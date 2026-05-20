package engine

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type HttpNodeHandler struct{}

func (h *HttpNodeHandler) Handle(nc NodeContext) NodeResult {
	rawURL := fmt.Sprintf("%v", nc.Node.Data["url"])
	rawMethod := fmt.Sprintf("%v", nc.Node.Data["method"])
	if rawMethod == "" || rawMethod == "<nil>" {
		rawMethod = "GET"
	}

	rawBody := ""
	if nc.Node.Data["body"] != nil {
		rawBody = fmt.Sprintf("%v", nc.Node.Data["body"])
	}

	reqURL := resolveString(rawURL, nc.State)
	reqMethod := resolveString(rawMethod, nc.State)
	reqBody := resolveString(rawBody, nc.State)

	var req *http.Request
	var err error
	if reqBody != "" && reqMethod != "GET" {
		req, err = http.NewRequestWithContext(nc.Ctx, reqMethod, reqURL, bytes.NewBuffer([]byte(reqBody)))
		req.Header.Set("Content-Type", "application/json")
	} else {
		req, err = http.NewRequestWithContext(nc.Ctx, reqMethod, reqURL, nil)
	}

	if err != nil {
		return NodeResult{Error: fmt.Errorf("failed to create request: %w", err)}
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return NodeResult{Error: fmt.Errorf("http request failed: %w", err)}
	}
	defer resp.Body.Close()

	respBodyBytes, _ := io.ReadAll(resp.Body)
	var jsonResp interface{}
	if err := json.Unmarshal(respBodyBytes, &jsonResp); err != nil {
		jsonResp = string(respBodyBytes)
	}

	// Update the global state directly via pointer reference in the context map
	resultData := map[string]interface{}{
		"status": resp.StatusCode,
		"body":   jsonResp,
	}
	nc.State[nc.Node.ID] = resultData

	activeHandle := "main"
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return NodeResult{
			Output: resultData,
			Error:  fmt.Errorf("received non-200 status: %d", resp.StatusCode),
		}
	}

	return NodeResult{
		ActiveHandle: activeHandle,
		Output:       resultData,
	}
}

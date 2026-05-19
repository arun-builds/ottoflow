package engine

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"regexp"
	"strings"

	"github.com/arun-builds/ottoflow/internal/models"
	"github.com/tidwall/gjson"
)

// nodeExecutionContext implements the ExecuteContext interface.
// It acts as a sandbox, ensuring a node can only access data for its specific execution.
type nodeExecutionContext struct {
	workspaceID string
	node        models.Node
	inputs      [][]OttoItem
}

// GetInputs returns the data passed into this node from the previous step.
func (c *nodeExecutionContext) GetInputs() [][]OttoItem {
	return c.inputs
}

// GetNodeParameter fetches a parameter from the node's JSON config.
// If the parameter is a string containing expressions (e.g., {{ $json.id }}),
// it evaluates them against the item at the specific itemIndex.
func (c *nodeExecutionContext) GetNodeParameter(parameterName string, itemIndex int) (interface{}, error) {
	val, exists := c.node.Parameters[parameterName]
	if !exists {
		return nil, fmt.Errorf("parameter '%s' not found", parameterName)
	}

	// If it's a string, it might be a template formula
	strVal, isString := val.(string)
	if !isString {
		// If it's an int, bool, array, or nested map, return it exactly as-is
		return val, nil
	}

	// If it's a string, evaluate any {{ ... }} expressions
	return c.evaluateExpression(strVal, itemIndex)
}

// GetNodeParameterString is a strict type-cast wrapper.
func (c *nodeExecutionContext) GetNodeParameterString(parameterName string, itemIndex int) (string, error) {
	val, err := c.GetNodeParameter(parameterName, itemIndex)
	if err != nil {
		return "", err
	}

	strVal, ok := val.(string)
	if !ok {
		return "", fmt.Errorf("parameter '%s' is not a string", parameterName)
	}
	return strVal, nil
}

// GetCredentials securely fetches credentials scoped ONLY to this workspace.
func (c *nodeExecutionContext) GetCredentials(credentialName string) (map[string]interface{}, error) {
	// In the future, this will do a DB query:
	// SELECT encrypted_data FROM credentials WHERE workspace_id = c.workspaceID AND name = credentialName

	slog.Warn("Mocking credentials (DB not connected yet)",
		slog.String("workspace", c.workspaceID),
		slog.String("credential", credentialName))

	return map[string]interface{}{
		"token": "mock-api-token",
	}, nil
}

// Log emits structured traces for this specific node run.
func (c *nodeExecutionContext) Log(message string, data interface{}) {
	slog.Info(message,
		slog.String("node_id", c.node.ID),
		slog.String("workspace", c.workspaceID),
		slog.Any("data", data))
}

// expressionRegex finds anything inside {{ }}
var expressionRegex = regexp.MustCompile(`\{\{\s*(.+?)\s*\}\}`)

func (c *nodeExecutionContext) evaluateExpression(expr string, itemIndex int) (string, error) {
	// 1. Check if we have an item to evaluate against
	var currentItem *OttoItem
	if len(c.inputs) > 0 && itemIndex < len(c.inputs[0]) {
		currentItem = &c.inputs[0][itemIndex]
	}

	var jsonBytes []byte
	if currentItem != nil {
		jsonBytes, _ = json.Marshal(currentItem.JSON)
	}

	// 3. Replace all {{ }} tags in the string
	result := expressionRegex.ReplaceAllStringFunc(expr, func(match string) string {
		if currentItem == nil || len(jsonBytes) == 0 {
			return "" // No data available, resolve to empty string
		}

		// Extract the inner path, e.g., "{{ $json.commit.message }}" -> "$json.commit.message"
		submatches := expressionRegex.FindStringSubmatch(match)
		if len(submatches) < 2 {
			return match
		}
		path := strings.TrimSpace(submatches[1])

		// If they just requested "{{ $json }}", return the whole object stringified
		if path == "$json" {
			return string(jsonBytes)
		}

		// For standard queries, strip the "$json." prefix
		prefix := "$json."
		if strings.HasPrefix(path, prefix) {
			jsonPath := strings.TrimPrefix(path, prefix)

			// Use gjson to extract the data!
			res := gjson.GetBytes(jsonBytes, jsonPath)
			if res.Exists() {
				return res.String()
			}
		}

		// If the path doesn't exist or isn't formatted right, return empty string
		return ""
	})

	return result, nil
}

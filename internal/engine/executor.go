package engine

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"regexp"
	"strings"
)

// State carries the output data of nodes throughout the execution
type State map[string]interface{}

type Node struct {
	ID   string                 `json:"id"`
	Type string                 `json:"type"`
	Data map[string]interface{} `json:"data"`
}

type Edge struct {
	ID           string `json:"id"`
	Source       string `json:"source"`
	Target       string `json:"target"`
	SourceHandle string `json:"sourceHandle"` // React Flow uses camelCase for this!
}

// ExecutorStorage defines the methods the engine needs to persist history
type ExecutorStorage interface {
	CreateWorkflowExecution(ctx context.Context, workspaceID, workflowID string) (string, error)
	CompleteWorkflowExecution(ctx context.Context, execID, status string) error
	LogNodeExecution(ctx context.Context, execID, nodeID, status, inputJSON, outputJSON, errMsg string) error
}

// Regex to match {{anything.inside}}
var variableRegex = regexp.MustCompile(`\{\{\s*(.*?)\s*\}\}`)

// getValueFromState traverses the nested maps using dot notation (e.g., "webhook.event")
func getValueFromState(path string, state State) string {
	keys := strings.Split(path, ".")

	var current interface{} = state
	for _, key := range keys {
		// Go's JSON unmarshaler creates map[string]interface{} for nested objects.
		// We need to type-assert at each step to keep digging.
		if m, ok := current.(State); ok {
			current = m[key]
		} else if m, ok := current.(map[string]interface{}); ok {
			current = m[key]
		} else {
			// If the path breaks or doesn't exist, return an empty string
			return ""
		}
	}

	// If it's a map or slice, we might want to return it as JSON,
	// but for now, simple string formatting is perfect for comparisons.
	if current == nil {
		return ""
	}
	return fmt.Sprintf("%v", current)
}

func resolveString(input string, state State) string {
	return variableRegex.ReplaceAllStringFunc(input, func(match string) string {
		// Strip the {{ and }}
		path := strings.TrimSpace(match[2 : len(match)-2])
		return getValueFromState(path, state)
	})
}

func Execute(ctx context.Context, storage ExecutorStorage, workspaceID, workflowID, triggerType string, rawNodes, rawEdges any, rawPayload string) error {
	execID, err := storage.CreateWorkflowExecution(ctx, workspaceID, workflowID)
	if err != nil {
		return fmt.Errorf("failed to create execution record: %w", err)
	}
	defer func() {
		// We will pass "completed" by default, or "failed" if addingerror handling later
		storage.CompleteWorkflowExecution(context.Background(), execID, "completed")
	}()

	// Parse the React Flow data from interface{} to concrete structs
	var nodes []Node
	var edges []Edge

	nodesBytes, _ := json.Marshal(rawNodes)
	edgesBytes, _ := json.Marshal(rawEdges)
	json.Unmarshal(nodesBytes, &nodes)
	json.Unmarshal(edgesBytes, &edges)

	nodeMap := make(map[string]Node)
	var startNode *Node

	for _, n := range nodes {
		nodeMap[n.ID] = n
		// FIX: Dynamically find the start node based on what triggered this run
		if n.Type == triggerType {
			startNode = &n
		}
	}

	if startNode == nil {
		return fmt.Errorf("no %s trigger node found in workflow", triggerType)
	}

	outgoingEdges := make(map[string][]Edge)
	for _, e := range edges {
		outgoingEdges[e.Source] = append(outgoingEdges[e.Source], e)
	}

	// 3. Initialize State with the Webhook Payload
	state := make(State)
	var payloadData map[string]interface{}
	if err := json.Unmarshal([]byte(rawPayload), &payloadData); err == nil {
		state[triggerType] = payloadData
	}

	// 4. BFS Queue Setup
	queue := []Node{*startNode}

	// 5. The Execution Loop
	for len(queue) > 0 {
		// Pop the first node
		curr := queue[0]
		queue = queue[1:]

		slog.Info("Executing Node", slog.String("node_id", curr.ID), slog.String("type", curr.Type))

		// Determine which handle to activate (defaults to empty/main)
		activeHandle := ""

		inputBytes, _ := json.Marshal(state)

		var nodeOutput map[string]interface{}
		var nodeError string
		nodeStatus := "success"

		// --- NODE LOGIC ---
		handler, exists := Registry[curr.Type]
		if !exists {
			nodeStatus = "failed"
			nodeError = fmt.Sprintf("Unsupported node type: %s", curr.Type)
			storage.LogNodeExecution(ctx, execID, curr.ID, nodeStatus, string(inputBytes), "{}", nodeError)
			break // Stop execution, unknown node
		}

		// Execute the specific handler
		nc := NodeContext{
			Ctx:   ctx,
			Node:  curr,
			State: state,
		}

		result := handler.Handle(nc)

		// Parse results
		activeHandle = result.ActiveHandle
		if result.Error != nil {
			nodeStatus = "failed"
			nodeError = result.Error.Error()
		}
		if result.Output != nil {
			nodeOutput = result.Output
		}

		outputBytes, _ := json.Marshal(nodeOutput)
		storage.LogNodeExecution(ctx, execID, curr.ID, nodeStatus, string(inputBytes), string(outputBytes), nodeError)

		// --- ENQUEUE NEXT NODES ---
		// Only follow edges that match the activated handle
		for _, edge := range outgoingEdges[curr.ID] {
			// If the edge has no source handle, or it matches our active handle
			if edge.SourceHandle == "" || edge.SourceHandle == activeHandle || edge.SourceHandle == "main" {
				if nextNode, exists := nodeMap[edge.Target]; exists {
					queue = append(queue, nextNode)
				}
			}
		}
	}

	slog.Info("Workflow execution completed successfully")
	return nil
}

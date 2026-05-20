package engine

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/arun-builds/ottoflow/internal/models"
)

// Registry defines the interface the runner uses to fetch node implementations
type Registry interface {
	Get(nodeType string) (OttoNode, error)
}

// ExecutionLogger allows the engine to report node status back to the database.
type ExecutionLogger interface {
	LogNodeExecution(
		ctx context.Context,
		executionID string,
		nodeID string,
		status string,
		errorMsg *string,
		inputData []map[string]interface{},
		outputData []map[string]interface{},
	) error
}

// Runner is responsible for executing a workflow DAG
type Runner struct {
	registry Registry
}

func NewRunner(r Registry) *Runner {
	return &Runner{registry: r}
}

// Run executes a workflow. We pass the ExecutionLogger in so the engine can report progress
// back to Postgres without being tightly coupled to the database implementation.
func (r *Runner) Run(
	ctx context.Context,
	workspaceID string,
	executionID string,
	wf models.Workflow,
	startNodeID string,
	initialData [][]OttoItem,
	logger ExecutionLogger,
) error {
	slog.Info("Starting workflow execution",
		slog.String("workflow_id", wf.ID),
		slog.String("execution_id", executionID))

	// 1. Build lookup maps for fast access
	nodeMap := make(map[string]models.Node)
	for _, n := range wf.Nodes {
		nodeMap[n.ID] = n
	}

	edgeMap := make(map[string][]models.Edge)
	for _, e := range wf.Edges {
		edgeMap[e.Source] = append(edgeMap[e.Source], e)
	}

	type Task struct {
		NodeID string
		Inputs [][]OttoItem
	}

	queue := []Task{{
		NodeID: startNodeID,
		Inputs: initialData,
	}}

	// 3. Process the DAG Breadth-First
	for len(queue) > 0 {
		task := queue[0]
		queue = queue[1:]

		if ctx.Err() != nil {
			return fmt.Errorf("execution cancelled: %w", ctx.Err())
		}

		nodeData, exists := nodeMap[task.NodeID]
		if !exists {
			return fmt.Errorf("node %s not found in workflow", task.NodeID)
		}

		nodeImpl, err := r.registry.Get(nodeData.Type)
		if err != nil {
			return fmt.Errorf("failed to get implementation for node %s: %w", nodeData.ID, err)
		}

		execCtx := &nodeExecutionContext{
			workspaceID: workspaceID,
			node:        nodeData,
			inputs:      task.Inputs,
		}

		// Prepare input data for the database log
		logInput := extractItemData(task.Inputs)

		slog.Info("Executing node", slog.String("node_id", nodeData.ID))
		outputs, err := nodeImpl.Execute(execCtx)

		if err != nil {
			// LOG FAILURE
			errMsg := err.Error()
			if logger != nil {
				logger.LogNodeExecution(ctx, executionID, nodeData.ID, "failed", &errMsg, logInput, nil)
			}
			return fmt.Errorf("node %s failed: %w", nodeData.ID, err)
		}

		// LOG SUCCESS
		logOutput := extractItemData(outputs)
		if logger != nil {
			logger.LogNodeExecution(ctx, executionID, nodeData.ID, "success", nil, logInput, logOutput)
		}

		// 6. Route the outputs to the next nodes via Edges
		outgoingEdges := edgeMap[task.NodeID]
		for _, edge := range outgoingEdges {
			portIndex := parseHandleToIndex(edge.SourceHandle)

			if portIndex < len(outputs) && len(outputs[portIndex]) > 0 {
				nextTask := Task{
					NodeID: edge.Target,
					Inputs: [][]OttoItem{outputs[portIndex]},
				}
				queue = append(queue, nextTask)
			}
		}
	}

	slog.Info("Workflow execution completed successfully")
	return nil
}

// extractItemData is a helper to convert Engine items into raw maps for the DB logs
func extractItemData(data [][]OttoItem) []map[string]interface{} {
	var result []map[string]interface{}
	if len(data) > 0 {
		for _, item := range data[0] {
			result = append(result, item.JSON)
		}
	}
	return result
}

func parseHandleToIndex(handle string) int {
	if handle == "false" {
		return 1
	}
	return 0
}

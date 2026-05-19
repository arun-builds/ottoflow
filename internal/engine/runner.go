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

// Runner is responsible for executing a workflow DAG
type Runner struct {
	registry Registry
}

func NewRunner(r Registry) *Runner {
	return &Runner{registry: r}
}

// Run executes a workflow for a specific workspace.
// context.Context allows us to cancel the execution if the user hits "Stop" in the UI.
func (r *Runner) Run(ctx context.Context, workspaceID string, wf models.Workflow, startNodeID string, initialData [][]OttoItem) error {
	slog.Info("Starting workflow execution",
		slog.String("workflow_id", wf.ID),
		slog.String("workspace_id", workspaceID))

	// 1. Build lookup maps for fast access
	nodeMap := make(map[string]models.Node)
	for _, n := range wf.Nodes {
		nodeMap[n.ID] = n
	}

	// Map of SourceNodeID -> []Edge (to quickly find where data goes next)
	edgeMap := make(map[string][]models.Edge)
	for _, e := range wf.Edges {
		edgeMap[e.Source] = append(edgeMap[e.Source], e)
	}

	// 2. The Execution Queue
	// We queue tasks representing a node that is ready to run, along with its input data.
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
		// Pop the first task
		task := queue[0]
		queue = queue[1:]

		// Check if execution was cancelled by the system/user
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

		// 4. Create the execution context for this specific node run
		// (We will build the actual concrete struct for this next)
		execCtx := &nodeExecutionContext{
			workspaceID: workspaceID,
			node:        nodeData,
			inputs:      task.Inputs,
		}

		// 5. Execute the Node
		slog.Info("Executing node", slog.String("node_id", nodeData.ID))
		outputs, err := nodeImpl.Execute(execCtx)
		if err != nil {
			return fmt.Errorf("node %s failed: %w", nodeData.ID, err)
		}

		// 6. Route the outputs to the next nodes via Edges
		outgoingEdges := edgeMap[task.NodeID]
		for _, edge := range outgoingEdges {
			// Find which port this edge is connected to (e.g., port 0 for "main")
			portIndex := parseHandleToIndex(edge.SourceHandle)

			// If this port has data, queue the target node
			if portIndex < len(outputs) && len(outputs[portIndex]) > 0 {
				nextTask := Task{
					NodeID: edge.Target,
					Inputs: [][]OttoItem{outputs[portIndex]}, // Send this data to the next node
				}
				queue = append(queue, nextTask)
			}
		}
	}

	slog.Info("Workflow execution completed successfully")
	return nil
}

// Dummy helper to map string handles to slice indexes (e.g., "main" -> 0, "true" -> 0, "false" -> 1)
// We will refine this later.
func parseHandleToIndex(handle string) int {
	if handle == "false" {
		return 1
	}
	return 0
}

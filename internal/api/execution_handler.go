package api

import (
	"encoding/json"
	"net/http"

	"github.com/arun-builds/ottoflow/internal/db"
	"github.com/arun-builds/ottoflow/internal/models"
)

type ExecutionHandler struct {
	repo *db.ExecutionRepository
}

func NewExecutionHandler(repo *db.ExecutionRepository) *ExecutionHandler {
	return &ExecutionHandler{repo: repo}
}

// HandleGetExecutions returns the history of runs for a workflow
// Route: GET /api/workflows/{workflow_id}/executions
func (h *ExecutionHandler) HandleGetExecutions(w http.ResponseWriter, r *http.Request) {

	workflowID := r.PathValue("workflow_id")

	executions, err := h.repo.GetExecutionsByWorkflow(r.Context(), workflowID)
	if err != nil {
		http.Error(w, "Failed to fetch executions", http.StatusInternalServerError)
		return
	}

	// If null, return empty array instead of null
	if executions == nil {
		executions = []models.WorkflowExecution{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(executions)
}

// HandleGetNodeExecutions returns the step-by-step logs for a specific run
// Route: GET /api/executions/{execution_id}/nodes
func (h *ExecutionHandler) HandleGetNodeExecutions(w http.ResponseWriter, r *http.Request) {

	executionID := r.PathValue("execution_id")

	nodes, err := h.repo.GetNodeExecutions(r.Context(), executionID)
	if err != nil {
		http.Error(w, "Failed to fetch node executions", http.StatusInternalServerError)
		return
	}

	if nodes == nil {
		nodes = []models.NodeExecution{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(nodes)
}

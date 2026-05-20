package api

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/arun-builds/ottoflow/internal/db"
	"github.com/arun-builds/ottoflow/internal/models"
)

type WorkflowHandler struct {
	repo *db.WorkflowRepository
}

func NewWorkflowHandler(repo *db.WorkflowRepository) *WorkflowHandler {
	return &WorkflowHandler{repo: repo}
}

// helper to extract workspace from headers (Mocking an Auth Middleware)
func getWorkspaceID(r *http.Request) string {
	wsID := r.Header.Get("X-Workspace-ID")
	if wsID == "" {
		return "ws_acme_corp" // Fallback for easy local testing
	}
	return wsID
}

// GET /api/workflows
func (h *WorkflowHandler) ListWorkflows(w http.ResponseWriter, r *http.Request) {
	wsID := getWorkspaceID(r)

	workflows, err := h.repo.List(r.Context(), wsID)
	if err != nil {
		slog.Error("Failed to list workflows", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	// If no workflows exist, return an empty array instead of null
	if workflows == nil {
		workflows = []models.Workflow{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(workflows)
}

// GET /api/workflows/{id}
func (h *WorkflowHandler) GetWorkflow(w http.ResponseWriter, r *http.Request) {
	wsID := getWorkspaceID(r)
	wfID := r.PathValue("id")

	wf, err := h.repo.GetByID(r.Context(), wsID, wfID)
	if err != nil {
		http.Error(w, "workflow not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(wf)
}

// POST /api/workflows
func (h *WorkflowHandler) CreateWorkflow(w http.ResponseWriter, r *http.Request) {
	wsID := getWorkspaceID(r)

	var wf models.Workflow
	if err := json.NewDecoder(r.Body).Decode(&wf); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Generate a unique ID for the new workflow
	b := make([]byte, 8)
	rand.Read(b)
	wf.ID = "wf_" + hex.EncodeToString(b)

	if wf.Status == "" {
		wf.Status = "draft"
	}

	if err := h.repo.Save(r.Context(), wsID, &wf); err != nil {
		slog.Error("Failed to save workflow", slog.String("error", err.Error()))
		http.Error(w, "failed to save workflow", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(wf)
}

// PUT /api/workflows/{id}
func (h *WorkflowHandler) UpdateWorkflow(w http.ResponseWriter, r *http.Request) {
	wsID := getWorkspaceID(r)
	wfID := r.PathValue("id")

	var wf models.Workflow
	if err := json.NewDecoder(r.Body).Decode(&wf); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Ensure the ID in the body matches the URL parameter
	wf.ID = wfID

	if err := h.repo.Save(r.Context(), wsID, &wf); err != nil {
		slog.Error("Failed to update workflow", slog.String("error", err.Error()))
		http.Error(w, "failed to update workflow", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(wf)
}

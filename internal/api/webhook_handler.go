package api

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/arun-builds/ottoflow/internal/db"
)

type WebhookHandler struct {
	execRepo *db.ExecutionRepository
}

func NewWebhookHandler(execRepo *db.ExecutionRepository) *WebhookHandler {
	return &WebhookHandler{execRepo: execRepo}
}

func (h *WebhookHandler) HandleIncomingWebhook(w http.ResponseWriter, r *http.Request) {
	// 1. Extract the workflow ID from the URL path
	// Assuming the route is configured as /webhook/{id}

	workflowID := r.PathValue("id")
	if workflowID == "" {
		http.Error(w, "missing workflow id", http.StatusBadRequest)
		return
	}

	workspaceID, status, err := h.execRepo.GetWorkflowStatus(r.Context(), workflowID)
	if err != nil {
		slog.Warn("Webhook rejected: workflow not found", slog.String("workflow_id", workflowID))
		http.Error(w, "workflow not found", http.StatusNotFound)
		return
	}

	if status != "active" {
		slog.Info("Webhook ignored: workflow inactive", slog.String("workflow_id", workflowID))
		w.WriteHeader(http.StatusAccepted) // 202: Accepted but ignored
		w.Write([]byte(`{"status":"ignored", "reason":"workflow is inactive"}`))
		return
	}

	var payload map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		slog.Error("Webhook rejected: invalid JSON", slog.String("error", err.Error()))
		http.Error(w, "invalid JSON payload", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	executionID, err := h.execRepo.InsertInbox(r.Context(), workspaceID, workflowID, payload)
	if err != nil {
		slog.Error("Database failed to persist webhook", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	slog.Info("Webhook queued successfully",
		slog.String("execution_id", executionID),
		slog.String("workflow_id", workflowID))

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message":      "webhook received and queued",
		"execution_id": executionID,
	})
}

package ingress

import (
	"io"
	"net/http"

	"github.com/arun-builds/ottoflow/internal/queue"
)

type Handler struct {
	publisher *queue.WebhookPublisher
}

func NewHandler(pub *queue.WebhookPublisher) *Handler {
	return &Handler{publisher: pub}
}

func (h *Handler) HandleHook(w http.ResponseWriter, r *http.Request) {
	webhookID := r.PathValue("webhook_id")
	if webhookID == "" {
		http.Error(w, "missing webhook id", http.StatusBadRequest)
		return
	}

	payload, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "failed to read body", http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()

	err = h.publisher.Publish(r.Context(), webhookID, payload)
	if err != nil {
		http.Error(w, "failed to queue webhook", http.StatusServiceUnavailable)
		return
	}

	w.WriteHeader(http.StatusAccepted)
	w.Write([]byte(`{"status":"queued"}`))
}

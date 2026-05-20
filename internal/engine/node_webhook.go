package engine

type WebhookNodeHandler struct{}

func (h *WebhookNodeHandler) Handle(nc NodeContext) NodeResult {
	// The webhook payload was already seeded into nc.State["webhook"] by the executor setup.
	// We just pass it through so it gets saved to the Postgres audit logs.
	return NodeResult{
		ActiveHandle: "main",
		Output: map[string]interface{}{
			"payload": nc.State["webhook"],
		},
	}
}

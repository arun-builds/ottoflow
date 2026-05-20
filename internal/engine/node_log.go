package engine

import "log/slog"

type LogNodeHandler struct{}

func (h *LogNodeHandler) Handle(nc NodeContext) NodeResult {
	slog.Info("Log Node Output",
		slog.String("node_id", nc.Node.ID),
		slog.Any("current_state", nc.State),
	)

	return NodeResult{
		ActiveHandle: "main",
		Output: map[string]interface{}{
			"logged": true,
		},
	}
}

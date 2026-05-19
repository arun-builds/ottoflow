package nodes

import "github.com/arun-builds/ottoflow/internal/engine"

type WebhookNode struct{}

func (n *WebhookNode) Description() engine.NodeDescription {
	return engine.NodeDescription{
		Type:    "webhook",
		Name:    "Webhook Trigger",
		Group:   []string{"trigger"},
		Inputs:  []string{},       // Triggers don't usually have inbound edges from other nodes
		Outputs: []string{"main"}, // Sends data out to the next node
	}
}

func (n *WebhookNode) Execute(ctx engine.ExecuteContext) ([][]engine.OttoItem, error) {
	// For a trigger node, the "inputs" are actually the payload injected by the
	// HTTP handler when it starts the workflow (e.g., the POST body).
	inputs := ctx.GetInputs()

	// If no data was injected (e.g., manual test run), create a default empty item
	if len(inputs) == 0 || len(inputs[0]) == 0 {
		emptyItem := engine.OttoItem{
			JSON: map[string]interface{}{
				"message": "Webhook triggered manually without payload",
			},
		}
		return [][]engine.OttoItem{{emptyItem}}, nil
	}

	//  pass the injected HTTP payload forward to the next nodes
	return inputs, nil
}

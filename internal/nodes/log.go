package nodes

import (
	"fmt"

	"github.com/arun-builds/ottoflow/internal/engine"
)

type LogNode struct{}

func (n *LogNode) Description() engine.NodeDescription {
	return engine.NodeDescription{
		Type:    "log",
		Name:    "Console Log",
		Group:   []string{"action", "debug"},
		Inputs:  []string{"main"},
		Outputs: []string{"main"}, // Pass the data through so the workflow isn't blocked
	}
}

func (n *LogNode) Execute(ctx engine.ExecuteContext) ([][]engine.OttoItem, error) {
	inputs := ctx.GetInputs()

	var items []engine.OttoItem
	if len(inputs) > 0 {
		items = inputs[0]
	}

	// Iterate over EVERY incoming item
	for i, item := range items {
		// Fetch the "message" parameter, evaluating it specifically for THIS item
		// If the user didn't provide a message, default to empty string
		msg, _ := ctx.GetNodeParameterString("message", i)
		if msg == "" {
			msg = "No message parameter provided"
		}

		// Use the context logger to emit the trace, attaching the item's JSON
		ctx.Log(fmt.Sprintf("[Item %d]: %s", i, msg), item.JSON)
	}

	// Pass the exact same items forward to the next node
	return [][]engine.OttoItem{items}, nil
}

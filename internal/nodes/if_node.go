package nodes

import (
	"fmt"
	"strconv"

	"github.com/arun-builds/ottoflow/internal/engine"
)

type IfNode struct{}

func (n *IfNode) Type() string {
	return "if"
}

// Description defines the node's shape, including its two distinct outputs.
func (n *IfNode) Description() engine.NodeDescription {
	return engine.NodeDescription{
		Type:    "if",
		Name:    "If / Else",
		Group:   []string{"logic", "routing"},
		Inputs:  []string{"main"},
		Outputs: []string{"true", "false"}, // Index 0 = "true", Index 1 = "false"
	}
}

// Execute evaluates the condition for every item and routes them to the correct output array.
func (n *IfNode) Execute(ctx engine.ExecuteContext) ([][]engine.OttoItem, error) {
	inputs := ctx.GetInputs()

	var items []engine.OttoItem
	if len(inputs) > 0 {
		items = inputs[0]
	}

	var trueItems []engine.OttoItem
	var falseItems []engine.OttoItem

	// Evaluate the condition for EVERY incoming item
	for i, item := range items {
		// We use GetNodeParameterString so the engine resolves templates like {{ $json.amount }} for us
		val1Str, _ := ctx.GetNodeParameterString("value1", i)
		val2Str, _ := ctx.GetNodeParameterString("value2", i)

		operator, _ := ctx.GetNodeParameterString("operator", i)
		if operator == "" {
			return nil, fmt.Errorf("missing required 'operator' parameter on item %d", i)
		}

		isTrue := evaluateCondition(val1Str, operator, val2Str)

		if isTrue {
			trueItems = append(trueItems, item)
		} else {
			falseItems = append(falseItems, item)
		}
	}

	// Index 0 maps to the "true" output handle
	// Index 1 maps to the "false" output handle
	return [][]engine.OttoItem{
		trueItems,
		falseItems,
	}, nil
}

// evaluateCondition dynamically decides whether to do a numeric or text comparison
func evaluateCondition(val1, operator, val2 string) bool {
	// Try parsing both as floats first to see if we can do numeric math
	f1, err1 := strconv.ParseFloat(val1, 64)
	f2, err2 := strconv.ParseFloat(val2, 64)

	// If both are valid numbers, do a numeric comparison
	if err1 == nil && err2 == nil {
		switch operator {
		case "==":
			return f1 == f2
		case "!=":
			return f1 != f2
		case ">":
			return f1 > f2
		case "<":
			return f1 < f2
		case ">=":
			return f1 >= f2
		case "<=":
			return f1 <= f2
		}
	}

	// If they aren't numbers, fall back to string comparison
	switch operator {
	case "==":
		return val1 == val2
	case "!=":
		return val1 != val2
	}

	return false
}

package engine

import "fmt"

type IfNodeHandler struct{}

func (h *IfNodeHandler) Handle(nc NodeContext) NodeResult {
	rawVal1 := fmt.Sprintf("%v", nc.Node.Data["value1"])
	rawVal2 := fmt.Sprintf("%v", nc.Node.Data["value2"])
	operator := nc.Node.Data["operator"]

	val1 := resolveString(rawVal1, nc.State)
	val2 := resolveString(rawVal2, nc.State)

	conditionMet := false
	if operator == "==" && val1 == val2 {
		conditionMet = true
	} else if operator == "!=" && val1 != val2 {
		conditionMet = true
	}

	activeHandle := "false"
	if conditionMet {
		activeHandle = "true"
	}

	return NodeResult{
		ActiveHandle: activeHandle,
		Output: map[string]interface{}{
			"evaluated_left":  val1,
			"evaluated_right": val2,
			"operator":        operator,
			"result":          conditionMet,
		},
	}
}

package engine

import "strconv"

type IfNodeHandler struct{}

func (h *IfNodeHandler) Handle(nc NodeContext) NodeResult {
	val1 := resolveString(stringData(nc.Node.Data, "value1"), nc.State)
	val2 := resolveString(stringData(nc.Node.Data, "value2"), nc.State)
	operator := stringData(nc.Node.Data, "operator")

	conditionMet := evaluateCondition(val1, operator, val2)

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

// evaluateCondition does a numeric comparison when both sides parse as numbers,
// otherwise falls back to string comparison. Supports every operator offered in the UI.
func evaluateCondition(val1, operator, val2 string) bool {
	f1, err1 := strconv.ParseFloat(val1, 64)
	f2, err2 := strconv.ParseFloat(val2, 64)

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

	switch operator {
	case "==":
		return val1 == val2
	case "!=":
		return val1 != val2
	}

	return false
}

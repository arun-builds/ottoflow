package engine

import (
	"context"
)

// NodeContext holds everything a node needs to do its job
type NodeContext struct {
	Ctx   context.Context
	Node  Node
	State State
}

// NodeResult is what a node returns to the engine
type NodeResult struct {
	ActiveHandle string
	Output       map[string]interface{}
	Error        error
}

// NodeHandler is the interface all action nodes must implement
type NodeHandler interface {
	Handle(nc NodeContext) NodeResult
}

// Registry maps node types (from React Flow) to their Go handlers
var Registry = map[string]NodeHandler{
	"if":      &IfNodeHandler{},
	"http":    &HttpNodeHandler{},
	"webhook": &WebhookNodeHandler{},
	"log":     &LogNodeHandler{},
}

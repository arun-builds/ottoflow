package nodes

import (
	"fmt"

	"github.com/arun-builds/ottoflow/internal/engine"
)

// Registry holds all available node types in the system.
type Registry struct {
	nodes map[string]engine.OttoNode
}

func NewRegistry() *Registry {
	return &Registry{
		nodes: make(map[string]engine.OttoNode),
	}
}

// Register adds a new node implementation to the registry.
// It uses the node's Description().Type as the lookup key.

func (r *Registry) Register(node engine.OttoNode) {
	nodeType := node.Description().Type
	// If a developer accidentally registers two nodes with the same type,
	// we want it to fail immediately on boot, not later during a workflow run.
	if _, exists := r.nodes[nodeType]; exists {
		panic(fmt.Sprintf("Node type '%s' is already registered", nodeType))
	}

	r.nodes[nodeType] = node
}

// Get retrieves a node implementation by its string type.
func (r *Registry) Get(nodeType string) (engine.OttoNode, error) {
	node, exists := r.nodes[nodeType]
	if !exists {
		return nil, fmt.Errorf("unknown node type: %s", nodeType)
	}
	return node, nil
}

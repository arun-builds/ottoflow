package engine

// OttoItem represents a single unit of data passing through the workflow.
// nodes process arrays of these items.
type OttoItem struct {
	JSON   map[string]interface{} `json:"json"`
	Binary map[string]interface{} `json:"binary,omitempty"`
}

// NodeDescription defines the metadata for a node.
// The registry uses this to map the JSON schema to actual Go code, and the engine
// uses it to understand the node's routing capabilities (inputs/outputs).
type NodeDescription struct {
	Type    string   `json:"type"`    // e.g., "slackMessage", "webhook"
	Name    string   `json:"name"`    // e.g., "Send Slack Message"
	Group   []string `json:"group"`   // e.g., []string{"trigger", "action", "logic"}
	Inputs  []string `json:"inputs"`  // e.g., []string{"main"}
	Outputs []string `json:"outputs"` // e.g., []string{"main"} OR []string{"true", "false"}
}

// ExecuteContext is the toolkit passed into every node's Execute function.
// It completely isolates the node from the engine's internal memory and database.
type ExecuteContext interface {
	// GetInputs returns the data passed to this node from the previous node.
	// Outer slice = input ports, inner slice = items.
	GetInputs() [][]OttoItem

	// GetNodeParameter parses and returns a raw parameter for a specific item.
	// This evaluates expressions (e.g., {{ $json.id }}) against the specific itemIndex.
	GetNodeParameter(parameterName string, itemIndex int) (interface{}, error)

	// GetNodeParameterString is a convenience wrapper for parameters expected to be strings.
	GetNodeParameterString(parameterName string, itemIndex int) (string, error)

	// GetCredentials retrieves decrypted credentials securely from the engine.
	GetCredentials(credentialName string) (map[string]interface{}, error)

	// Log allows nodes to emit execution traces for the frontend UI.
	Log(message string, data interface{})
}

// OttoNode is the strict contract that every node implementation must satisfy.
type OttoNode interface {
	Description() NodeDescription

	// Execute runs the node's logic.
	// It returns data routed to specific output ports (outer slice = ports, inner = items).
	Execute(ctx ExecuteContext) ([][]OttoItem, error)
}

package models

type NodeUI struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

// Node represents a single actionable step in the workflow
type Node struct {
	ID   string `json:"id"`
	Type string `json:"type"` // e.g., "webhook", "slackMessage"
	Name string `json:"name"`

	// Parameters are completely dynamic depending on the node type.
	// We use map[string]interface{} so it can hold nested objects, arrays, or strings.
	Parameters map[string]interface{} `json:"parameters"`

	// Credentials is a pointer to a string because it can be null in the JSON
	Credentials *string `json:"credentials,omitempty"`

	// UI holds the canvas coordinates. The engine ignores this,
	// but we must preserve it so the frontend renders correctly when loading.
	UI NodeUI `json:"ui"`
}

// Edge represents a wire connecting two nodes
type Edge struct {
	ID string `json:"id"`

	// Where the data comes from
	Source       string `json:"source"`
	SourceHandle string `json:"sourceHandle"` // e.g., "main", "true", "false"

	// Where the data goes
	Target       string `json:"target"`
	TargetHandle string `json:"targetHandle"` // e.g., "main"
}

type Workflow struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Status string `json:"status"` // e.g., "active", "draft", "inactive"
	Nodes  []Node `json:"nodes"`
	Edges  []Edge `json:"edges"`
}

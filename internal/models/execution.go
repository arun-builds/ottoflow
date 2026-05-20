package models

import (
	"encoding/json"
	"time"
)

type WorkflowExecution struct {
	ID          string     `json:"id"`
	WorkspaceID string     `json:"workspace_id"`
	WorkflowID  string     `json:"workflow_id"`
	Status      string     `json:"status"`
	StartedAt   time.Time  `json:"started_at"`
	FinishedAt  *time.Time `json:"finished_at"` // Pointer because it can be null while running
}

type NodeExecution struct {
	ID           string          `json:"id"`
	ExecutionID  string          `json:"execution_id"`
	NodeID       string          `json:"node_id"`
	Status       string          `json:"status"`
	InputData    json.RawMessage `json:"input_data"`
	OutputData   json.RawMessage `json:"output_data"`
	ErrorMessage string          `json:"error_message"`
	ExecutedAt   time.Time       `json:"executed_at"`
}

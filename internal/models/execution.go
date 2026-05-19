package models

import (
	"time"
)

// ExecutionInbox represents a trigger that has landed but not yet queued in Redis
type ExecutionInbox struct {
	ID          string                 `json:"id"`
	WorkspaceID string                 `json:"workspace_id"`
	WorkflowID  string                 `json:"workflow_id"`
	TriggerType string                 `json:"trigger_type"`
	Payload     map[string]interface{} `json:"payload"`
	Status      string                 `json:"status"`
	CreatedAt   time.Time              `json:"created_at"`
}

// WorkflowExecution tracks the overarching state of a DAG run
type WorkflowExecution struct {
	ID          string     `json:"id"`
	WorkspaceID string     `json:"workspace_id"`
	WorkflowID  string     `json:"workflow_id"`
	Status      string     `json:"status"`
	StartedAt   time.Time  `json:"started_at"`
	FinishedAt  *time.Time `json:"finished_at,omitempty"`
}

// NodeExecution tracks the exact data in and out of a specific node
type NodeExecution struct {
	ID           string                   `json:"id"`
	ExecutionID  string                   `json:"execution_id"`
	NodeID       string                   `json:"node_id"`
	Status       string                   `json:"status"`
	InputData    []map[string]interface{} `json:"input_data,omitempty"`
	OutputData   []map[string]interface{} `json:"output_data,omitempty"`
	ErrorMessage *string                  `json:"error_message,omitempty"`
	ExecutedAt   time.Time                `json:"executed_at"`
}

package db

import (
	"context"
	"database/sql"
	"time"

	"github.com/arun-builds/ottoflow/internal/models"
	"github.com/google/uuid"
)

// ExecutionRepository handles all database operations for workflow runs
type ExecutionRepository struct {
	db *sql.DB
}

// NewExecutionRepository creates a new instance of ExecutionRepository
func NewExecutionRepository(db *sql.DB) *ExecutionRepository {
	return &ExecutionRepository{db: db}
}

// CreateWorkflowExecution starts a new run and returns the execution ID
func (r *ExecutionRepository) CreateWorkflowExecution(ctx context.Context, workspaceID, workflowID string) (string, error) {
	execID := uuid.NewString()
	query := `
		INSERT INTO workflow_executions (id, workspace_id, workflow_id, status, started_at)
		VALUES ($1, $2, $3, 'running', $4)
	`
	_, err := r.db.ExecContext(ctx, query, execID, workspaceID, workflowID, time.Now())
	return execID, err
}

// CompleteWorkflowExecution marks the overall run as finished
func (r *ExecutionRepository) CompleteWorkflowExecution(ctx context.Context, execID, status string) error {
	query := `
		UPDATE workflow_executions 
		SET status = $1, finished_at = $2 
		WHERE id = $3
	`
	_, err := r.db.ExecContext(ctx, query, status, time.Now(), execID)
	return err
}

// LogNodeExecution saves the inputs and outputs of a single node step
func (r *ExecutionRepository) LogNodeExecution(ctx context.Context, execID, nodeID, status, inputJSON, outputJSON, errMsg string) error {
	query := `
		INSERT INTO node_executions (id, execution_id, node_id, status, input_data, output_data, error_message, executed_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := r.db.ExecContext(ctx, query, uuid.NewString(), execID, nodeID, status, inputJSON, outputJSON, errMsg, time.Now())
	return err
}

// GetExecutionsByWorkflow fetches the run history for a specific workflow, sorted newest first
func (r *ExecutionRepository) GetExecutionsByWorkflow(ctx context.Context, workflowID string) ([]models.WorkflowExecution, error) {
	query := `
		SELECT id, workspace_id, workflow_id, status, started_at, finished_at 
		FROM workflow_executions 
		WHERE workflow_id = $1 
		ORDER BY started_at DESC 
		LIMIT 50
	`
	rows, err := r.db.QueryContext(ctx, query, workflowID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var executions []models.WorkflowExecution
	for rows.Next() {
		var exec models.WorkflowExecution
		err := rows.Scan(
			&exec.ID, &exec.WorkspaceID, &exec.WorkflowID,
			&exec.Status, &exec.StartedAt, &exec.FinishedAt,
		)
		if err != nil {
			return nil, err
		}
		executions = append(executions, exec)
	}
	return executions, nil
}

// GetNodeExecutions fetches the granular step-by-step logs for a specific run
func (r *ExecutionRepository) GetNodeExecutions(ctx context.Context, executionID string) ([]models.NodeExecution, error) {
	query := `
		SELECT id, execution_id, node_id, status, input_data, output_data, error_message, executed_at 
		FROM node_executions 
		WHERE execution_id = $1 
		ORDER BY executed_at ASC
	`
	rows, err := r.db.QueryContext(ctx, query, executionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var nodes []models.NodeExecution
	for rows.Next() {
		var n models.NodeExecution
		err := rows.Scan(
			&n.ID, &n.ExecutionID, &n.NodeID, &n.Status,
			&n.InputData, &n.OutputData, &n.ErrorMessage, &n.ExecutedAt,
		)
		if err != nil {
			return nil, err
		}
		nodes = append(nodes, n)
	}
	return nodes, nil
}

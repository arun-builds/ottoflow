package db

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"

	"github.com/arun-builds/ottoflow/internal/models"
)

// ExecutionRepository handles the high-throughput inbox operations
type ExecutionRepository struct {
	db *sql.DB
}

func NewExecutionRepository(db *sql.DB) *ExecutionRepository {
	return &ExecutionRepository{db: db}
}

// GetWorkflowStatus quickly checks if a workflow is valid to receive webhooks.
// We only select what we need to keep the query blazing fast.
func (r *ExecutionRepository) GetWorkflowStatus(ctx context.Context, workflowID string) (workspaceID string, status string, err error) {
	query := `SELECT workspace_id, status FROM workflows WHERE id = $1`
	err = r.db.QueryRowContext(ctx, query, workflowID).Scan(&workspaceID, &status)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", "", fmt.Errorf("workflow not found")
		}
		return "", "", err
	}
	return workspaceID, status, nil
}

// InsertInbox lands the payload securely into the database.
func (r *ExecutionRepository) InsertInbox(ctx context.Context, workspaceID, workflowID string, payload map[string]interface{}) (string, error) {
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("invalid payload: %w", err)
	}

	// Generate a simple unique ID for the execution (e.g., exec_123abc)
	b := make([]byte, 8)
	rand.Read(b)
	executionID := "exec_" + hex.EncodeToString(b)

	query := `
		INSERT INTO execution_inbox (id, workspace_id, workflow_id, trigger_type, payload, status)
		VALUES ($1, $2, $3, 'webhook', $4, 'pending')
	`

	_, err = r.db.ExecContext(ctx, query, executionID, workspaceID, workflowID, payloadBytes)
	if err != nil {
		return "", fmt.Errorf("failed to insert to inbox: %w", err)
	}

	return executionID, nil
}

// ClaimPendingJobs safely grabs a batch of pending webhooks and locks them.
// It returns the jobs and updates their status to 'processing' in a single transaction.
func (r *ExecutionRepository) ClaimPendingJobs(ctx context.Context, limit int) ([]models.ExecutionInbox, error) {
	// The SKIP LOCKED magic ensures multiple workers don't grab the same rows.
	query := `
		UPDATE execution_inbox
		SET status = 'processing'
		WHERE id IN (
			SELECT id FROM execution_inbox
			WHERE status = 'pending'
			ORDER BY created_at ASC
			LIMIT $1
			FOR UPDATE SKIP LOCKED
		)
		RETURNING id, workspace_id, workflow_id, trigger_type, payload, created_at;
	`

	rows, err := r.db.QueryContext(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to claim jobs: %w", err)
	}
	defer rows.Close()

	var jobs []models.ExecutionInbox
	for rows.Next() {
		var job models.ExecutionInbox
		var payloadJSON []byte

		if err := rows.Scan(&job.ID, &job.WorkspaceID, &job.WorkflowID, &job.TriggerType, &payloadJSON, &job.CreatedAt); err != nil {
			return nil, err
		}

		json.Unmarshal(payloadJSON, &job.Payload)
		jobs = append(jobs, job)
	}

	return jobs, nil
}

// MarkJobQueued updates the job status once Redis has confirmed receipt.
func (r *ExecutionRepository) MarkJobQueued(ctx context.Context, jobID string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE execution_inbox SET status = 'queued' WHERE id = $1`, jobID)
	return err
}

// TryStartExecution enforces idempotency. It attempts to create the execution log.
// Returns true if successfully claimed, false if it already exists (duplicate).
func (r *ExecutionRepository) TryStartExecution(ctx context.Context, execID, workspaceID, workflowID string) (bool, error) {
	query := `
		INSERT INTO workflow_executions (id, workspace_id, workflow_id, status, started_at)
		VALUES ($1, $2, $3, 'running', CURRENT_TIMESTAMP)
		ON CONFLICT (id) DO NOTHING;
	`
	res, err := r.db.ExecContext(ctx, query, execID, workspaceID, workflowID)
	if err != nil {
		return false, fmt.Errorf("failed to start execution: %w", err)
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return false, err
	}

	// If rows == 0, it means the ON CONFLICT clause triggered (it's a duplicate)
	return rows > 0, nil
}

// CompleteExecution marks the overarching DAG run as finished or failed.
func (r *ExecutionRepository) CompleteExecution(ctx context.Context, execID, status string) error {
	query := `
		UPDATE workflow_executions 
		SET status = $1, finished_at = CURRENT_TIMESTAMP 
		WHERE id = $2;
	`
	_, err := r.db.ExecContext(ctx, query, status, execID)
	return err
}

// LogNodeExecution records the outcome of a single node using your exact struct types.
func (r *ExecutionRepository) LogNodeExecution(
	ctx context.Context,
	executionID string,
	nodeID string,
	status string,
	errorMsg *string,
	inputData []map[string]interface{},
	outputData []map[string]interface{},
) error {
	// Convert the maps to raw JSON bytes for Postgres JSONB columns
	inputBytes, _ := json.Marshal(inputData)
	outputBytes, _ := json.Marshal(outputData)

	query := `
		INSERT INTO node_executions (execution_id, node_id, status, error_message, input_data, output_data, executed_at)
		VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
	`
	_, err := r.db.ExecContext(ctx, query, executionID, nodeID, status, errorMsg, inputBytes, outputBytes)
	if err != nil {
		return fmt.Errorf("failed to log node execution: %w", err)
	}
	return nil
}

// GetNodeExecutions fetches the logs and unmarshals the JSON back into your struct's maps.
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

	var logs []models.NodeExecution
	for rows.Next() {
		var log models.NodeExecution
		var inputBytes, outputBytes []byte

		// Scan into temporary byte slices for the JSON columns
		if err := rows.Scan(
			&log.ID,
			&log.ExecutionID,
			&log.NodeID,
			&log.Status,
			&inputBytes,
			&outputBytes,
			&log.ErrorMessage,
			&log.ExecutedAt,
		); err != nil {
			return nil, err
		}

		// Unmarshal the bytes back into the struct's map fields
		if len(inputBytes) > 0 {
			json.Unmarshal(inputBytes, &log.InputData)
		}
		if len(outputBytes) > 0 {
			json.Unmarshal(outputBytes, &log.OutputData)
		}

		logs = append(logs, log)
	}
	return logs, nil
}

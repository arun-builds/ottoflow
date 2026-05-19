package db

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/arun-builds/ottoflow/internal/models"
)

// WorkflowRepository handles all database operations for workflows.
type WorkflowRepository struct {
	db *sql.DB
}

// NewWorkflowRepository initializes the repository.
func NewWorkflowRepository(db *sql.DB) *WorkflowRepository {
	return &WorkflowRepository{db: db}
}

// Save inserts or updates a workflow securely by workspace.
func (r *WorkflowRepository) Save(ctx context.Context, workspaceID string, wf *models.Workflow) error {
	nodesJSON, err := json.Marshal(wf.Nodes)
	if err != nil {
		return fmt.Errorf("failed to marshal nodes: %w", err)
	}

	edgesJSON, err := json.Marshal(wf.Edges)
	if err != nil {
		return fmt.Errorf("failed to marshal edges: %w", err)
	}

	query := `
		INSERT INTO workflows (id, workspace_id, name, status, nodes, edges, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			status = EXCLUDED.status,
			nodes = EXCLUDED.nodes,
			edges = EXCLUDED.edges,
			updated_at = CURRENT_TIMESTAMP
		WHERE workflows.workspace_id = $2;
	`

	_, err = r.db.ExecContext(ctx, query, wf.ID, workspaceID, wf.Name, wf.Status, nodesJSON, edgesJSON)
	if err != nil {
		return fmt.Errorf("failed to save workflow: %w", err)
	}

	return nil
}

// GetByID loads a workflow securely for a specific workspace.
func (r *WorkflowRepository) GetByID(ctx context.Context, workspaceID, workflowID string) (*models.Workflow, error) {
	query := `
		SELECT id, name, status, nodes, edges 
		FROM workflows 
		WHERE id = $1 AND workspace_id = $2
	`

	var wf models.Workflow
	var nodesJSON, edgesJSON []byte

	err := r.db.QueryRowContext(ctx, query, workflowID, workspaceID).Scan(
		&wf.ID, &wf.Name, &wf.Status, &nodesJSON, &edgesJSON,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("workflow not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	if err := json.Unmarshal(nodesJSON, &wf.Nodes); err != nil {
		return nil, fmt.Errorf("failed to unmarshal nodes: %w", err)
	}
	if err := json.Unmarshal(edgesJSON, &wf.Edges); err != nil {
		return nil, fmt.Errorf("failed to unmarshal edges: %w", err)
	}

	return &wf, nil
}

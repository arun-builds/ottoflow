package db

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

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

// List returns all workflows for a workspace without loading the heavy nodes/edges JSON.
func (r *WorkflowRepository) List(ctx context.Context, workspaceID string) ([]models.Workflow, error) {
	query := `
		SELECT id, name, status 
		FROM workflows 
		WHERE workspace_id = $1 
		ORDER BY updated_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query, workspaceID)
	if err != nil {
		return nil, fmt.Errorf("failed to list workflows: %w", err)
	}
	defer rows.Close()

	var workflows []models.Workflow
	for rows.Next() {
		var wf models.Workflow
		if err := rows.Scan(&wf.ID, &wf.Name, &wf.Status); err != nil {
			return nil, err
		}
		workflows = append(workflows, wf)
	}

	return workflows, nil
}

// Create inserts a new workflow into the database
func (r *WorkflowRepository) Create(ctx context.Context, w *models.Workflow) error {
	// Set creation timestamps
	now := time.Now()
	w.CreatedAt = now
	w.UpdatedAt = now

	// Marshal the React Flow arrays into JSON bytes for the JSONB columns
	nodesJSON, err := json.Marshal(w.Nodes)
	if err != nil {
		return err
	}

	edgesJSON, err := json.Marshal(w.Edges)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO workflows (id, workspace_id, name, status, nodes, edges, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`

	_, err = r.db.ExecContext(ctx, query,
		w.ID,
		w.WorkspaceID,
		w.Name,
		w.Status,
		nodesJSON,
		edgesJSON,
		w.CreatedAt,
		w.UpdatedAt,
	)

	return err
}

// GetByGlobalID fetches a workflow using only its ID.
// This should ONLY be used by trusted internal services like the Worker,
// never by the public-facing UI API.
func (r *WorkflowRepository) GetByGlobalID(ctx context.Context, id string) (*models.Workflow, error) {
	query := `
		SELECT id, workspace_id, name, status, nodes, edges, created_at, updated_at
		FROM workflows
		WHERE id = $1
	`

	var w models.Workflow
	var nodesJSON, edgesJSON []byte

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&w.ID,
		&w.WorkspaceID,
		&w.Name,
		&w.Status,
		&nodesJSON,
		&edgesJSON,
		&w.CreatedAt,
		&w.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	// Unmarshal the JSONB columns into the Go slices
	if err := json.Unmarshal(nodesJSON, &w.Nodes); err != nil {
		return nil, err
	}
	if err := json.Unmarshal(edgesJSON, &w.Edges); err != nil {
		return nil, err
	}

	return &w, nil
}

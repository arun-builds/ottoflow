-- +goose Up
SELECT 'up SQL query';
CREATE TABLE workflows (
    id VARCHAR(50) PRIMARY KEY,
    workspace_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    nodes JSONB NOT NULL DEFAULT '[]',
    edges JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workflows_workspace_id ON workflows(workspace_id);

CREATE TABLE execution_inbox (
    id VARCHAR(50) PRIMARY KEY,
    workspace_id VARCHAR(50) NOT NULL,
    workflow_id VARCHAR(50) NOT NULL,
    trigger_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inbox_pending ON execution_inbox(status) WHERE status = 'pending';

CREATE TABLE workflow_executions (
    id VARCHAR(50) PRIMARY KEY,
    workspace_id VARCHAR(50) NOT NULL,
    workflow_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'running',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_executions_workspace ON workflow_executions(workspace_id, workflow_id);

CREATE TABLE node_executions (
    id VARCHAR(50) PRIMARY KEY,
    execution_id VARCHAR(50) NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    node_id VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    input_data JSONB,  
    output_data JSONB,
    error_message TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_node_executions_exec_id ON node_executions(execution_id);

-- +goose Down
SELECT 'down SQL query';
DROP TABLE IF EXISTS node_executions;
DROP TABLE IF EXISTS workflow_executions;
DROP TABLE IF EXISTS execution_inbox;
DROP TABLE IF EXISTS workflows;
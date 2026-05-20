-- +goose Up
-- 1. Drop the foreign key constraint blocking the change
ALTER TABLE node_executions DROP CONSTRAINT IF EXISTS node_executions_execution_id_fkey;

-- 2. Convert all ID columns to native UUID
ALTER TABLE workflows ALTER COLUMN id TYPE UUID USING id::UUID;
ALTER TABLE workflows ALTER COLUMN workspace_id TYPE UUID USING workspace_id::UUID;

ALTER TABLE execution_inbox ALTER COLUMN id TYPE UUID USING id::UUID;
ALTER TABLE execution_inbox ALTER COLUMN workspace_id TYPE UUID USING workspace_id::UUID;
ALTER TABLE execution_inbox ALTER COLUMN workflow_id TYPE UUID USING workflow_id::UUID;

ALTER TABLE workflow_executions ALTER COLUMN id TYPE UUID USING id::UUID;
ALTER TABLE workflow_executions ALTER COLUMN workspace_id TYPE UUID USING workspace_id::UUID;
ALTER TABLE workflow_executions ALTER COLUMN workflow_id TYPE UUID USING workflow_id::UUID;

ALTER TABLE node_executions ALTER COLUMN id TYPE UUID USING id::UUID;
ALTER TABLE node_executions ALTER COLUMN execution_id TYPE UUID USING execution_id::UUID;

-- 3. Re-add the foreign key constraint
ALTER TABLE node_executions 
    ADD CONSTRAINT node_executions_execution_id_fkey 
    FOREIGN KEY (execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE;


-- +goose Down
-- 1. Drop the foreign key constraint
ALTER TABLE node_executions DROP CONSTRAINT IF EXISTS node_executions_execution_id_fkey;

-- 2. Revert back to VARCHAR(50)
ALTER TABLE node_executions ALTER COLUMN id TYPE VARCHAR(50);
ALTER TABLE node_executions ALTER COLUMN execution_id TYPE VARCHAR(50);

ALTER TABLE workflow_executions ALTER COLUMN id TYPE VARCHAR(50);
ALTER TABLE workflow_executions ALTER COLUMN workspace_id TYPE VARCHAR(50);
ALTER TABLE workflow_executions ALTER COLUMN workflow_id TYPE VARCHAR(50);

ALTER TABLE execution_inbox ALTER COLUMN id TYPE VARCHAR(50);
ALTER TABLE execution_inbox ALTER COLUMN workspace_id TYPE VARCHAR(50);
ALTER TABLE execution_inbox ALTER COLUMN workflow_id TYPE VARCHAR(50);

ALTER TABLE workflows ALTER COLUMN id TYPE VARCHAR(50);
ALTER TABLE workflows ALTER COLUMN workspace_id TYPE VARCHAR(50);

-- 3. Re-add the foreign key constraint
ALTER TABLE node_executions 
    ADD CONSTRAINT node_executions_execution_id_fkey 
    FOREIGN KEY (execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE;
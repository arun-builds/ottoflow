-- +goose Up
ALTER TABLE node_executions ADD COLUMN node_type VARCHAR(50);

-- +goose Down
ALTER TABLE node_executions DROP COLUMN node_type;

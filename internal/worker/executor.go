package worker

import (
	"context"
	"encoding/json"
	"log/slog"
	"time"

	"github.com/arun-builds/ottoflow/internal/db"
	"github.com/arun-builds/ottoflow/internal/engine"
	"github.com/arun-builds/ottoflow/internal/models"
	"github.com/redis/go-redis/v9"
)

type ExecutorWorker struct {
	execRepo     *db.ExecutionRepository
	workflowRepo *db.WorkflowRepository
	runner       *engine.Runner
	redisClient  *redis.Client
	streamName   string
	groupName    string
	workerName   string // Unique name for this specific instance
}

func NewExecutorWorker(execRepo *db.ExecutionRepository, wfRepo *db.WorkflowRepository, runner *engine.Runner, rdb *redis.Client, workerName string) *ExecutorWorker {
	return &ExecutorWorker{
		execRepo:     execRepo,
		workflowRepo: wfRepo,
		runner:       runner,
		redisClient:  rdb,
		streamName:   "ottoflow:executions",
		groupName:    "dag_workers",
		workerName:   workerName,
	}
}

// Start begins the consumer group polling loop.
func (w *ExecutorWorker) Start(ctx context.Context) {
	slog.Info("Starting Executor Worker", slog.String("worker_name", w.workerName))

	// 1. Create the Consumer Group (Ignore error if it already exists)
	err := w.redisClient.XGroupCreateMkStream(ctx, w.streamName, w.groupName, "0").Err()
	if err != nil && err.Error() != "BUSYGROUP Consumer Group name already exists" {
		slog.Error("Failed to create consumer group", slog.String("error", err.Error()))
		return
	}

	for {
		select {
		case <-ctx.Done():
			slog.Info("Shutting down Executor Worker", slog.String("worker", w.workerName))
			return
		default:
			w.consumeNext(ctx)
		}
	}
}

func (w *ExecutorWorker) consumeNext(ctx context.Context) {
	// Block for up to 2 seconds waiting for a new message (">" means unread messages)
	streams, err := w.redisClient.XReadGroup(ctx, &redis.XReadGroupArgs{
		Group:    w.groupName,
		Consumer: w.workerName,
		Streams:  []string{w.streamName, ">"},
		Count:    1,
		Block:    2 * time.Second,
	}).Result()

	if err != nil {
		if err == redis.Nil {
			return // Timeout, no new messages, loop around
		}
		slog.Error("Redis XREADGROUP error", slog.String("error", err.Error()))
		time.Sleep(1 * time.Second) // Backoff
		return
	}

	// Process the message
	for _, msg := range streams[0].Messages {
		w.processJob(ctx, msg)
	}
}

func (w *ExecutorWorker) processJob(ctx context.Context, msg redis.XMessage) {
	jobJSON := msg.Values["job_data"].(string)

	var job models.ExecutionInbox
	if err := json.Unmarshal([]byte(jobJSON), &job); err != nil {
		slog.Error("Failed to parse job data", slog.String("error", err.Error()))
		w.ackMessage(ctx, msg.ID) // Bad payload, ACK it to drop it
		return
	}

	// THE IDEMPOTENCY LOCK
	// If a network glitch causes Redis to deliver this twice, the database will reject the second attempt.
	isFresh, err := w.execRepo.TryStartExecution(ctx, job.ID, job.WorkspaceID, job.WorkflowID)
	if err != nil {
		slog.Error("DB error checking idempotency", slog.String("error", err.Error()))
		return // Do not ACK. Let Redis retry it later.
	}

	if !isFresh {
		slog.Warn("Duplicate job detected, skipping", slog.String("job_id", job.ID))
		w.ackMessage(ctx, msg.ID)
		return
	}

	slog.Info("Executing Workflow", slog.String("workflow_id", job.WorkflowID), slog.String("job_id", job.ID))

	// 1. Load the actual Workflow JSON from Postgres
	workflow, err := w.workflowRepo.GetByID(ctx, job.WorkspaceID, job.WorkflowID)
	if err != nil {
		slog.Error("Failed to load workflow", slog.String("error", err.Error()))
		w.execRepo.CompleteExecution(ctx, job.ID, "failed")
		w.ackMessage(ctx, msg.ID)
		return
	}

	// 2. Format the webhook payload into Engine format
	initialData := [][]engine.OttoItem{
		{{JSON: job.Payload}},
	}

	// 3. Find the Trigger Node (the entry point)
	var startNodeID string
	for _, n := range workflow.Nodes {
		if n.Type == job.TriggerType {
			startNodeID = n.ID
			break
		}
	}

	if startNodeID == "" {
		slog.Error("No matching trigger node found in workflow")
		w.execRepo.CompleteExecution(ctx, job.ID, "failed")
		w.ackMessage(ctx, msg.ID)
		return
	}

	// 4. RUN THE DAG ENGINE!
	err = w.runner.Run(ctx, job.WorkspaceID, *workflow, startNodeID, initialData)

	finalStatus := "completed"
	if err != nil {
		finalStatus = "failed"
		slog.Error("Workflow failed", slog.String("error", err.Error()))
	}

	// 5. Update DB and ACK
	w.execRepo.CompleteExecution(ctx, job.ID, finalStatus)
	w.ackMessage(ctx, msg.ID)
}

func (w *ExecutorWorker) ackMessage(ctx context.Context, redisMsgID string) {
	w.redisClient.XAck(ctx, w.streamName, w.groupName, redisMsgID)
}

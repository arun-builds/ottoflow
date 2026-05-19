package worker

import (
	"context"
	"log/slog"
	"time"

	"github.com/arun-builds/ottoflow/internal/db"
	"github.com/arun-builds/ottoflow/internal/engine"
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

package worker

import (
	"context"
	"encoding/json"
	"log/slog"
	"time"

	"github.com/arun-builds/ottoflow/internal/db"
	"github.com/redis/go-redis/v9"
)

type OutboxRelay struct {
	repo        *db.ExecutionRepository
	redisClient *redis.Client
	streamName  string
}

func NewOutboxRelay(repo *db.ExecutionRepository, rdb *redis.Client) *OutboxRelay {
	return &OutboxRelay{
		repo:        repo,
		redisClient: rdb,
		streamName:  "ottoflow:executions",
	}
}

// Start begins the background polling loop. It blocks until ctx is canceled.
func (o *OutboxRelay) Start(ctx context.Context) {
	slog.Info("Starting Outbox Relay Worker")

	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			slog.Info("Shutting down Outbox Relay")
			return
		case <-ticker.C:
			o.processBatch(ctx)
		}
	}
}

func (o *OutboxRelay) processBatch(ctx context.Context) {
	// 1. Claim up to 50 jobs at a time safely
	jobs, err := o.repo.ClaimPendingJobs(ctx, 50)
	if err != nil {
		slog.Error("Failed to claim jobs from outbox", slog.String("error", err.Error()))
		return
	}

	if len(jobs) == 0 {
		return // Nothing to do
	}

	slog.Info("Claimed jobs for queueing", slog.Int("count", len(jobs)))

	// 2. Push each job to the Redis Stream
	for _, job := range jobs {
		jobJSON, _ := json.Marshal(job)

		err := o.redisClient.XAdd(ctx, &redis.XAddArgs{
			Stream: o.streamName,
			Values: map[string]interface{}{
				"job_data": jobJSON,
			},
		}).Err()

		if err != nil {
			slog.Error("Failed to push job to Redis Stream",
				slog.String("job_id", job.ID),
				slog.String("error", err.Error()))
			// In a production system, we would either retry or set status to 'failed_queue'
			continue
		}

		// 3. Confirm in DB
		if err := o.repo.MarkJobQueued(ctx, job.ID); err != nil {
			slog.Error("Failed to mark job as queued in DB", slog.String("job_id", job.ID))
		}
	}
}

package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/arun-builds/ottoflow/internal/db"
	"github.com/arun-builds/ottoflow/internal/queue"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// 1. Connect to Postgres (We need this to fetch the Workflow DAG)
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgresql://postgres:postgres@localhost:5432/postgres"
	}

	dbConn, err := db.NewPostgresDB(dbURL)
	if err != nil {
		slog.Error("Database connection failed", slog.String("error", err.Error()))
		os.Exit(1)
	}
	defer dbConn.Close()

	workflowRepo := db.NewWorkflowRepository(dbConn)

	// 2. Connect to Redis Consumer
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://:password@localhost:6379"
	}

	consumer, err := queue.NewWebhookConsumer(redisURL)
	if err != nil {
		slog.Error("Redis consumer setup failed", slog.String("error", err.Error()))
		os.Exit(1)
	}
	defer consumer.Close()

	// 3. Start consuming in a goroutine
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go func() {
		slog.Info("Worker started. Listening for webhooks on Redis Stream...")
		consumer.Consume(ctx, func(webhookID, payload, msgID string) error {
			slog.Info("Received Job", slog.String("webhook_id", webhookID))

			// Use the trusted global lookup
			workflow, err := workflowRepo.GetByGlobalID(ctx, webhookID)
			if err != nil {
				slog.Error("Failed to fetch workflow", slog.String("error", err.Error()))
				return err
			}

			slog.Info("Loaded DAG to execute",
				slog.String("workflow_id", workflow.ID),
				slog.String("workspace", workflow.WorkspaceID),
			)

			// TODO: Actually traverse the nodes and edges here!

			return nil
		})
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("Shutting down Worker service...")
	cancel()                    // Signals the Consume loop to stop
	time.Sleep(1 * time.Second) // Give it a second to finish current jobs
}

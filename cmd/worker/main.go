package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/arun-builds/ottoflow/internal/db"
	"github.com/arun-builds/ottoflow/internal/engine"
	"github.com/arun-builds/ottoflow/internal/nodes"
	"github.com/arun-builds/ottoflow/internal/worker"
	"github.com/redis/go-redis/v9"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/ottoflow?sslmode=disable"
	}

	dbConn, err := db.NewPostgresDB(dbURL)
	if err != nil {
		slog.Error("Database connection failed", slog.String("error", err.Error()))
		os.Exit(1)
	}
	defer dbConn.Close()

	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}

	rdb := redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})

	workflowRepo := db.NewWorkflowRepository(dbConn)
	execRepo := db.NewExecutionRepository(dbConn)

	registry := nodes.NewRegistry()
	registry.Register(&nodes.WebhookNode{})
	registry.Register(&nodes.LogNode{})
	runner := engine.NewRunner(registry)

	outboxWorker := worker.NewOutboxRelay(execRepo, rdb)

	executorWorker := worker.NewExecutorWorker(execRepo, workflowRepo, runner, rdb, "worker-1")

	workerCtx, workerCancel := context.WithCancel(context.Background())

	slog.Info("Starting Worker Service Daemons")
	go outboxWorker.Start(workerCtx)
	go executorWorker.Start(workerCtx)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("Shutting down Worker service...")
	workerCancel()
}

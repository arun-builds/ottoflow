package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/arun-builds/ottoflow/internal/api"
	"github.com/arun-builds/ottoflow/internal/db"
	"github.com/arun-builds/ottoflow/internal/engine"
	"github.com/arun-builds/ottoflow/internal/models"
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

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	})

	if err := rdb.Ping(context.Background()).Err(); err != nil {
		slog.Error("Redis connection failed", slog.String("error", err.Error()))
		os.Exit(1)
	}
	slog.Info("Successfully connected to Redis")

	dbConn, err := db.NewPostgresDB(dbURL)
	if err != nil {
		slog.Error("Database connection failed", slog.String("error", err.Error()))
		os.Exit(1)
	}
	defer dbConn.Close()

	workflowRepo := db.NewWorkflowRepository(dbConn)
	workflowHandler := api.NewWorkflowHandler(workflowRepo)
	execRepo := db.NewExecutionRepository(dbConn)

	webhookHandler := api.NewWebhookHandler(execRepo)
	outboxWorker := worker.NewOutboxRelay(execRepo, rdb)

	registry := nodes.NewRegistry()
	registry.Register(&nodes.WebhookNode{})
	registry.Register(&nodes.LogNode{})

	slog.Info("Initialized Node Registry", slog.Int("nodes_loaded", 2))
	runner := engine.NewRunner(registry)

	// Initialize the worker that pulls from Redis and runs the DAG
	executorWorker := worker.NewExecutorWorker(execRepo, workflowRepo, runner, rdb, "worker-1")

	workerCtx, workerCancel := context.WithCancel(context.Background())

	// Start BOTH workers in the background
	go outboxWorker.Start(workerCtx)
	go executorWorker.Start(workerCtx)

	// Keep the dry run for local testing
	runTestWorkflow(runner)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy"}`))
	})

	mux.HandleFunc("POST /webhook/{id}", webhookHandler.HandleIncomingWebhook)

	mux.HandleFunc("GET /api/workflows", workflowHandler.ListWorkflows)
	mux.HandleFunc("GET /api/workflows/{id}", workflowHandler.GetWorkflow)
	mux.HandleFunc("POST /api/workflows", workflowHandler.CreateWorkflow)
	mux.HandleFunc("PUT /api/workflows/{id}", workflowHandler.UpdateWorkflow)

	srv := &http.Server{Addr: ":" + port, Handler: mux}

	go func() {
		slog.Info("Starting Ottoflow server", slog.String("port", port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Server failed", slog.String("error", err.Error()))
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("Shutting down server gracefully...")
	workerCancel() // Stops the background Redis and Postgres loops safely
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
}

// runTestWorkflow builds a hardcoded DAG and pushes it through the execution runner.
func runTestWorkflow(runner *engine.Runner) {
	slog.Info("=== STARTING DRY RUN ===")

	// 1. Build the Hardcoded DAG (What the DB/React Flow will eventually provide)
	testWorkflow := models.Workflow{
		ID:     "wf_test_01",
		Name:   "Test Webhook to Log",
		Status: "active",
		Nodes: []models.Node{
			{
				ID:   "node_webhook_1",
				Type: "webhook",
				Name: "Incoming Github Push",
			},
			{
				ID:   "node_log_1",
				Type: "log",
				Name: "Log the commit",
				Parameters: map[string]interface{}{
					//  expression will be handled by our gjson parser.
					"message": "Received new code! Details: {{ $json.commit.message }}",
				},
			},
		},
		Edges: []models.Edge{
			{
				ID:           "edge_1",
				Source:       "node_webhook_1",
				SourceHandle: "main",
				Target:       "node_log_1",
				TargetHandle: "main",
			},
		},
	}

	// 2. Mock the incoming HTTP Webhook Payload
	initialData := [][]engine.OttoItem{
		{
			{
				JSON: map[string]interface{}{
					"event": "push",
					"commit": map[string]interface{}{
						"message": "Fixed the nasty graph bug",
						"author":  "dev_steve",
					},
				},
			},
		},
	}

	// 3. Execute the Graph
	ctx := context.Background()
	workspaceID := "ws_acme_corp"
	startNodeID := "node_webhook_1"

	err := runner.Run(ctx, workspaceID, testWorkflow, startNodeID, initialData)
	if err != nil {
		slog.Error("Dry run failed", slog.String("error", err.Error()))
	}

	slog.Info("=== END DRY RUN ===")
}

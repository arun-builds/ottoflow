package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/arun-builds/ottoflow/internal/db"
	"github.com/arun-builds/ottoflow/internal/engine"
	"github.com/arun-builds/ottoflow/internal/models"
	"github.com/arun-builds/ottoflow/internal/nodes"
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

	workflowRepo := db.NewWorkflowRepository(dbConn)
	_ = workflowRepo

	registry := nodes.NewRegistry()
	registry.Register(&nodes.WebhookNode{})
	registry.Register(&nodes.LogNode{})

	slog.Info("Initialized Node Registry", slog.Int("nodes_loaded", 2))
	runner := engine.NewRunner(registry)

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
					//  expression will be handled by dummy parser.
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
	// In reality, the HTTP handler will construct this from the `r.Body`.
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

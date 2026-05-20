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
)

func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")

		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")

		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

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

	// Only UI Repos and Handlers
	workflowRepo := db.NewWorkflowRepository(dbConn)
	executionRepo := db.NewExecutionRepository(dbConn)
	workflowHandler := api.NewWorkflowHandler(workflowRepo)
	executionHandler := api.NewExecutionHandler(executionRepo)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // UI API on 8080
	}

	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"service":"api", "status":"healthy"}`))
	})

	mux.HandleFunc("GET /api/workflows", workflowHandler.ListWorkflows)
	mux.HandleFunc("GET /api/workflows/{id}", workflowHandler.GetWorkflow)
	mux.HandleFunc("POST /api/workflows", workflowHandler.CreateWorkflow)
	mux.HandleFunc("PUT /api/workflows/{id}", workflowHandler.UpdateWorkflow)

	mux.HandleFunc("GET /api/workflows/{workflow_id}/executions", executionHandler.HandleGetExecutions)
	mux.HandleFunc("GET /api/executions/{execution_id}/nodes", executionHandler.HandleGetNodeExecutions)

	handler := CORSMiddleware(mux)

	srv := &http.Server{Addr: ":" + port, Handler: handler}

	go func() {
		slog.Info("Starting API Service", slog.String("port", port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Server failed", slog.String("error", err.Error()))
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("Shutting down API service...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
}

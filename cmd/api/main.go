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

	// Only UI Repos and Handlers
	workflowRepo := db.NewWorkflowRepository(dbConn)
	workflowHandler := api.NewWorkflowHandler(workflowRepo)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // UI API on 8080
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"service":"api", "status":"healthy"}`))
	})

	// Only UI Routes
	mux.HandleFunc("GET /api/workflows", workflowHandler.ListWorkflows)
	mux.HandleFunc("GET /api/workflows/{id}", workflowHandler.GetWorkflow)
	mux.HandleFunc("POST /api/workflows", workflowHandler.CreateWorkflow)
	mux.HandleFunc("PUT /api/workflows/{id}", workflowHandler.UpdateWorkflow)

	srv := &http.Server{Addr: ":" + port, Handler: mux}

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

package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/arun-builds/ottoflow/internal/ingress"
	"github.com/arun-builds/ottoflow/internal/queue"
)

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// 1. Connect to Redis
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://:password@localhost:6379"
	}

	publisher, err := queue.NewWebhookPublisher(redisURL)
	if err != nil {
		slog.Error("Redis connection failed", slog.String("error", err.Error()))
		os.Exit(1)
	}
	defer publisher.Close()

	ingressHandler := ingress.NewHandler(publisher)

	mux := http.NewServeMux()

	// Health check for load balancers
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"service":"webhook-ingress", "status":"healthy"}`))
	})

	mux.HandleFunc("POST /hooks/{webhook_id}", ingressHandler.HandleHook)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	srv := &http.Server{Addr: ":" + port, Handler: cors(mux)}

	go func() {
		slog.Info("Starting Webhook Ingress Service", slog.String("port", port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Server failed", slog.String("error", err.Error()))
			os.Exit(1)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("Shutting down Webhook service...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
}

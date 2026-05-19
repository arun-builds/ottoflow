package db

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"time"

	_ "github.com/lib/pq"
)

// NewPostgresDB initializes a connection pool to Postgres.
func NewPostgresDB(dsn string) (*sql.DB, error) {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Connection Pool Settings (SaaS Defaults)
	db.SetMaxOpenConns(25)                 // Max simultaneous connections
	db.SetMaxIdleConns(25)                 // Keep connections warm
	db.SetConnMaxLifetime(5 * time.Minute) // Cycle connections safely

	// Verify the connection is actually alive
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	slog.Info("Successfully connected to Postgres")
	return db, nil
}

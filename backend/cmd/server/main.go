// Command server is the entrypoint for the sociograph backend.
package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"sociograph/backend/config"
	"sociograph/backend/internal/db"
	"sociograph/backend/internal/handlers"
	"sociograph/backend/internal/repository"
	"sociograph/backend/internal/seed"
	"sociograph/backend/internal/seed/bulk"
)

func main() {
	// ── Configuration ──────────────────────────────────────────────────────
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "err", err)
		os.Exit(1)
	}

	// ── Logger ─────────────────────────────────────────────────────────────
	logLevel := slog.LevelInfo
	switch cfg.Log.Level {
	case "debug":
		logLevel = slog.LevelDebug
	case "warn":
		logLevel = slog.LevelWarn
	case "error":
		logLevel = slog.LevelError
	}
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: logLevel}))
	slog.SetDefault(logger)

	// ── Database ───────────────────────────────────────────────────────────
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := db.NewPool(ctx, cfg.DB)
	if err != nil {
		slog.Error("failed to connect to database", "err", err)
		os.Exit(1)
	}
	defer pool.Close()
	slog.Info("database connected")

	// ── Repositories ───────────────────────────────────────────────────────
	peopleRepo := repository.NewPeopleRepo(pool)
	interactionRepo := repository.NewInteractionRepo(pool)

	// ── Seed registries ────────────────────────────────────────────────────
	seedRegistry := seed.NewRegistry()
	bulkRegistry := bulk.NewRegistry()

	// ── Handlers ───────────────────────────────────────────────────────────
	peopleH := handlers.NewPeopleHandler(peopleRepo, seedRegistry, bulkRegistry)
	interactionH := handlers.NewInteractionHandler(interactionRepo)

	// ── Router ─────────────────────────────────────────────────────────────
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))

	r.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintln(w, `{"status":"ok"}`)
	})

	// People seed-data routes
	r.Route("/people", func(r chi.Router) {
		r.Post("/seed-data", peopleH.SeedData)           // POST /people/seed-data?type=device
		r.Put("/seed-data", peopleH.UpdateSeedData)      // PUT  /people/seed-data?id=<uuid>
		r.Delete("/seed-data", peopleH.DeleteSeedData)   // DELETE /people/seed-data?id=<uuid>
		r.Post("/bulk-seed-data", peopleH.BulkSeedData)  // POST /people/bulk-seed-data?type=...
	})

	// Interaction routes
	r.Route("/interactions", func(r chi.Router) {
		r.Post("/", interactionH.Create)      // POST /interactions
		r.Put("/{id}", interactionH.Update)   // PUT  /interactions/{id}
	})

	// ── HTTP Server ────────────────────────────────────────────────────────
	srv := &http.Server{
		Addr:         cfg.Addr(),
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown on SIGINT / SIGTERM
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		slog.Info("server starting", "addr", cfg.Addr())
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "err", err)
			os.Exit(1)
		}
	}()

	<-quit
	slog.Info("shutting down server...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("server forced to shutdown", "err", err)
	}

	slog.Info("server stopped")
}

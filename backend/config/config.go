// Package config loads and exposes all application configuration.
// All environment variable access is centralised here — no other package
// should read os.Getenv directly.
package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config holds the full runtime configuration for the server.
type Config struct {
	DB   DBConfig
	HTTP HTTPConfig
	Log  LogConfig
}

// DBConfig contains Supabase / Postgres connection settings.
type DBConfig struct {
	// URL is the full libpq-style connection string, e.g.:
	// postgres://postgres.[ref]:[password]@[host]:5432/postgres
	URL string

	// MaxConns caps the pgx connection pool size.
	MaxConns int32

	// MinConns is the minimum number of idle connections to maintain.
	MinConns int32
}

// HTTPConfig holds HTTP server settings.
type HTTPConfig struct {
	Port int
}

// LogConfig holds logging settings.
type LogConfig struct {
	// Level is one of: debug, info, warn, error
	Level string
}

// Load reads configuration from environment variables.
// It automatically attempts to load a .env file from the current working
// directory if one exists; this is a no-op in production environments that
// inject env vars directly.
func Load() (*Config, error) {
	// Load .env (silently ignore if absent — production won't have one)
	_ = godotenv.Load()

	dbURL := os.Getenv("SUPABASE_DB_URL")
	if dbURL == "" {
		return nil, fmt.Errorf("config: SUPABASE_DB_URL is required but not set")
	}

	port, err := intEnv("PORT", 8080)
	if err != nil {
		return nil, fmt.Errorf("config: invalid PORT: %w", err)
	}

	maxConns, err := int32Env("DB_MAX_CONNS", 10)
	if err != nil {
		return nil, fmt.Errorf("config: invalid DB_MAX_CONNS: %w", err)
	}

	minConns, err := int32Env("DB_MIN_CONNS", 2)
	if err != nil {
		return nil, fmt.Errorf("config: invalid DB_MIN_CONNS: %w", err)
	}

	logLevel := os.Getenv("LOG_LEVEL")
	if logLevel == "" {
		logLevel = "info"
	}

	return &Config{
		DB: DBConfig{
			URL:      dbURL,
			MaxConns: maxConns,
			MinConns: minConns,
		},
		HTTP: HTTPConfig{
			Port: port,
		},
		Log: LogConfig{
			Level: logLevel,
		},
	}, nil
}

// Addr returns the TCP listen address, e.g. ":8080".
func (c *Config) Addr() string {
	return fmt.Sprintf(":%d", c.HTTP.Port)
}

// ── helpers ──────────────────────────────────────────────────────────────────

func intEnv(key string, fallback int) (int, error) {
	v := os.Getenv(key)
	if v == "" {
		return fallback, nil
	}
	return strconv.Atoi(v)
}

func int32Env(key string, fallback int32) (int32, error) {
	v := os.Getenv(key)
	if v == "" {
		return fallback, nil
	}
	n, err := strconv.ParseInt(v, 10, 32)
	return int32(n), err
}

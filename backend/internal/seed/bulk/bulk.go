// Package bulk defines the BulkSeeder interface and Registry for batch imports.
//
// # Contract
//
// A BulkSeeder accepts an opaque source (multipart file, JSON body, etc.) and
// returns a slice of CreatePersonInput ready for BulkCreate. The handler owns
// the HTTP concerns; seeders own only parsing and normalization.
//
// # Extension guide
//
// To activate a stub seeder (e.g. "excel"):
//  1. Open excel.go and implement ExcelSeeder.Parse + ExcelSeeder.Seed.
//  2. Register it in NewRegistry() below.
//
// The HTTP handler and router need no changes.
package bulk

import (
	"context"
	"fmt"
	"io"
	"sync"

	"sociograph/backend/internal/models"
	"sociograph/backend/internal/repository"
)

// ─── BulkSeeder interface ────────────────────────────────────────────────────

// BulkSeeder is implemented by every batch-import source.
type BulkSeeder interface {
	// Type returns the canonical key used in ?type=<key>, e.g. "excel".
	Type() string

	// Parse reads from r and returns normalized CreatePersonInputs.
	// r is the raw multipart file or request body — implementations decide
	// the encoding (CSV, vCard, JSON, etc.).
	Parse(ctx context.Context, r io.Reader) ([]models.CreatePersonInput, error)
}

// ─── BulkSourceType ─────────────────────────────────────────────────────────

// BulkSourceType enumerates all recognised bulk import types.
// Keep in sync with NewRegistry below.
type BulkSourceType string

const (
	SourceMobileContactExport BulkSourceType = "mobile_contact_export"
	SourceExcel               BulkSourceType = "excel"
	SourceTwitter             BulkSourceType = "twitter"
	SourceInstagram           BulkSourceType = "instagram"
)

// ─── Registry ────────────────────────────────────────────────────────────────

// Registry holds all registered BulkSeeders.
type Registry struct {
	mu      sync.RWMutex
	entries map[string]BulkSeeder
}

// NewRegistry builds the default bulk registry.
// Activate stub implementations here once they are ready.
func NewRegistry() *Registry {
	r := &Registry{entries: make(map[string]BulkSeeder)}

	// Register stubs — handlers return 501 until Parse is implemented.
	r.Register(&MobileContactSeeder{})
	r.Register(&ExcelSeeder{})
	r.Register(&TwitterSeeder{})
	r.Register(&InstagramSeeder{})

	return r
}

// Register adds s to the registry. Panics on duplicate types.
func (r *Registry) Register(s BulkSeeder) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.entries[s.Type()]; exists {
		panic(fmt.Sprintf("bulk: seeder %q already registered", s.Type()))
	}
	r.entries[s.Type()] = s
}

// Get returns the BulkSeeder for the given type, or false if unknown.
func (r *Registry) Get(typ string) (BulkSeeder, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	s, ok := r.entries[typ]
	return s, ok
}

// Types returns all registered type keys.
func (r *Registry) Types() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()
	keys := make([]string, 0, len(r.entries))
	for k := range r.entries {
		keys = append(keys, k)
	}
	return keys
}

// ─── Orchestration ───────────────────────────────────────────────────────────

// Seed parses r using the seeder identified by typ and bulk-inserts all
// resulting people. Returns all persisted records.
func (r *Registry) Seed(
	ctx context.Context,
	typ string,
	body io.Reader,
	repo *repository.PeopleRepo,
) ([]*models.Person, error) {
	seeder, ok := r.Get(typ)
	if !ok {
		return nil, fmt.Errorf("bulk: unknown type %q (known: %v)", typ, r.Types())
	}

	inputs, err := seeder.Parse(ctx, body)
	if err != nil {
		return nil, fmt.Errorf("bulk: parse (%s): %w", typ, err)
	}

	if len(inputs) == 0 {
		return nil, fmt.Errorf("bulk: seeder %q returned 0 records — nothing to import", typ)
	}

	people, err := repo.BulkCreate(ctx, inputs)
	if err != nil {
		return nil, fmt.Errorf("bulk: persist (%s): %w", typ, err)
	}

	return people, nil
}

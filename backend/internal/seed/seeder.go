// Package seed defines the Seeder interface and a Registry for single-record
// seed operations.
//
// # Extension guide
//
// To add a new seed source (e.g. "linkedin"):
//  1. Create a new file, e.g. linkedin.go, in this package.
//  2. Implement the Seeder interface.
//  3. Register it in NewRegistry().
//
// The registry is the only place where seeders need to be listed — handlers
// and routes remain unchanged.
package seed

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"

	"sociograph/backend/internal/models"
	"sociograph/backend/internal/repository"
)

// ─── Seeder interface ────────────────────────────────────────────────────────

// Seeder is implemented by every single-record seed source.
//
//   - Type returns the unique key used in ?type=<key> query params.
//   - Normalize converts source-specific raw JSON into a CreatePersonInput.
//     The handler calls Normalize then hands the result to PeopleRepo.Create.
type Seeder interface {
	// Type is the canonical identifier (lowercase, no spaces), e.g. "device".
	Type() string

	// Normalize converts raw request body bytes into a CreatePersonInput.
	// Implementations should validate required fields and return a descriptive
	// error so the HTTP handler can surface it as 422.
	Normalize(data json.RawMessage) (*models.CreatePersonInput, error)
}

// ─── Registry ────────────────────────────────────────────────────────────────

// Registry holds all registered Seeders and provides the Seed method that
// orchestrates normalization + persistence.
type Registry struct {
	mu      sync.RWMutex
	entries map[string]Seeder
}

// NewRegistry builds the default registry pre-loaded with all built-in seeders.
// Add new seeders here as the project grows.
func NewRegistry() *Registry {
	r := &Registry{entries: make(map[string]Seeder)}
	r.Register(&DeviceSeeder{})
	// future: r.Register(&LinkedInSeeder{})
	return r
}

// Register adds s to the registry. Panics on duplicate types to surface
// misconfiguration at startup rather than silently overwriting.
func (r *Registry) Register(s Seeder) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.entries[s.Type()]; exists {
		panic(fmt.Sprintf("seed: seeder %q already registered", s.Type()))
	}
	r.entries[s.Type()] = s
}

// Get returns the Seeder for the given type key, or false if unknown.
func (r *Registry) Get(typ string) (Seeder, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	s, ok := r.entries[typ]
	return s, ok
}

// Types returns all registered type keys, useful for error messages.
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

// Seed normalizes raw bytes using the seeder identified by typ and persists the
// result via repo. It returns the created Person.
func (r *Registry) Seed(
	ctx context.Context,
	typ string,
	data json.RawMessage,
	repo *repository.PeopleRepo,
) (*models.Person, error) {
	seeder, ok := r.Get(typ)
	if !ok {
		return nil, fmt.Errorf("seed: unknown type %q (known: %v)", typ, r.Types())
	}

	input, err := seeder.Normalize(data)
	if err != nil {
		return nil, fmt.Errorf("seed: normalize (%s): %w", typ, err)
	}

	person, err := repo.Create(ctx, *input)
	if err != nil {
		return nil, fmt.Errorf("seed: persist (%s): %w", typ, err)
	}

	return person, nil
}

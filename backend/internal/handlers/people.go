// Package handlers contains HTTP handler functions for the people resource.
package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"sociograph/backend/internal/models"
	"sociograph/backend/internal/repository"
	"sociograph/backend/internal/seed"
	"sociograph/backend/internal/seed/bulk"
)

// PeopleHandler groups all HTTP handlers for the /people routes.
type PeopleHandler struct {
	repo         *repository.PeopleRepo
	seedRegistry *seed.Registry
	bulkRegistry *bulk.Registry
}

// NewPeopleHandler constructs a PeopleHandler.
func NewPeopleHandler(
	repo *repository.PeopleRepo,
	seedRegistry *seed.Registry,
	bulkRegistry *bulk.Registry,
) *PeopleHandler {
	return &PeopleHandler{
		repo:         repo,
		seedRegistry: seedRegistry,
		bulkRegistry: bulkRegistry,
	}
}

// ─── POST /people/seed-data?type=<type> ─────────────────────────────────────

// SeedData seeds a single person from the specified source type.
//
//	POST /people/seed-data?type=device
//	Content-Type: application/json
//	{ "name": "Jane Doe", "phone": "+91-98765-43210" }
func (h *PeopleHandler) SeedData(w http.ResponseWriter, r *http.Request) {
	typ := strings.TrimSpace(r.URL.Query().Get("type"))
	if typ == "" {
		respondError(w, http.StatusBadRequest, "query param 'type' is required")
		return
	}

	var raw json.RawMessage
	if err := json.NewDecoder(r.Body).Decode(&raw); err != nil {
		respondError(w, http.StatusBadRequest, fmt.Sprintf("invalid JSON body: %v", err))
		return
	}

	person, err := h.seedRegistry.Seed(r.Context(), typ, raw, h.repo)
	if err != nil {
		// Surface validation errors as 422
		respondError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, person)
}

// ─── PUT /people/seed-data?id=<uuid> ────────────────────────────────────────

// UpdateSeedData updates a previously seeded person by UUID.
//
//	PUT /people/seed-data?id=<uuid>
//	Content-Type: application/json
//	{ "company": "New Corp" }
func (h *PeopleHandler) UpdateSeedData(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	var in models.UpdatePersonInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		respondError(w, http.StatusBadRequest, fmt.Sprintf("invalid JSON body: %v", err))
		return
	}

	person, err := h.repo.Update(r.Context(), id, in)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusNotFound, fmt.Sprintf("person %s not found", uuidString(id)))
			return
		}
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, person)
}

// ─── DELETE /people/seed-data?id=<uuid> ─────────────────────────────────────

// DeleteSeedData deletes a person by UUID.
//
//	DELETE /people/seed-data?id=<uuid>
func (h *PeopleHandler) DeleteSeedData(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.repo.Delete(r.Context(), id); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusNotFound, fmt.Sprintf("person %s not found", uuidString(id)))
			return
		}
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ─── POST /people/bulk-seed-data?type=<type> ────────────────────────────────

// BulkSeedData seeds multiple people from the specified bulk source.
//
//	POST /people/bulk-seed-data?type=mobile_contact_export|excel|twitter|instagram
//	Content-Type: multipart/form-data  (file field: "file")
//	  — or —
//	Content-Type: application/json     (raw body, source-defined schema)
//
// Note: stubs return 501 until the respective Parse implementation is complete.
func (h *PeopleHandler) BulkSeedData(w http.ResponseWriter, r *http.Request) {
	typ := strings.TrimSpace(r.URL.Query().Get("type"))
	if typ == "" {
		respondError(w, http.StatusBadRequest, "query param 'type' is required")
		return
	}

	// Resolve body: prefer multipart file upload, fall back to raw body.
	body := r.Body
	if strings.HasPrefix(r.Header.Get("Content-Type"), "multipart/form-data") {
		if err := r.ParseMultipartForm(32 << 20); err != nil { // 32 MB limit
			respondError(w, http.StatusBadRequest, "failed to parse multipart form")
			return
		}
		f, _, err := r.FormFile("file")
		if err != nil {
			respondError(w, http.StatusBadRequest, "multipart field 'file' is required")
			return
		}
		defer f.Close()
		body = f
	}

	people, err := h.bulkRegistry.Seed(r.Context(), typ, body, h.repo)
	if err != nil {
		// 501 for stubs, 422 for validation/parse failures
		if strings.Contains(err.Error(), "not yet implemented") {
			respondError(w, http.StatusNotImplemented,
				fmt.Sprintf("bulk source %q is not yet implemented", typ))
			return
		}
		respondError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, map[string]any{
		"imported": len(people),
		"people":   people,
	})
}

// ── helpers ──────────────────────────────────────────────────────────────────

func parseUUIDParam(r *http.Request, key string) (pgtype.UUID, error) {
	raw := strings.TrimSpace(r.URL.Query().Get(key))
	if raw == "" {
		return pgtype.UUID{}, fmt.Errorf("query param '%s' is required", key)
	}
	var id pgtype.UUID
	if err := id.Scan(raw); err != nil {
		return pgtype.UUID{}, fmt.Errorf("'%s' is not a valid UUID: %v", key, err)
	}
	return id, nil
}

func uuidString(id pgtype.UUID) string {
	b, _ := id.MarshalJSON()
	return strings.Trim(string(b), `"`)
}

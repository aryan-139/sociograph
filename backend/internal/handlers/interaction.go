package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"sociograph/backend/internal/models"
	"sociograph/backend/internal/repository"
)

// InteractionHandler groups all HTTP handlers for the /interactions routes.
type InteractionHandler struct {
	repo *repository.InteractionRepo
}

// NewInteractionHandler constructs an InteractionHandler.
func NewInteractionHandler(repo *repository.InteractionRepo) *InteractionHandler {
	return &InteractionHandler{repo: repo}
}

// ─── POST /interactions ──────────────────────────────────────────────────────

// Create creates a new interaction between two people.
//
//	POST /interactions
//	Content-Type: application/json
//	{
//	  "p1": "<uuid>",
//	  "p2": "<uuid>",
//	  "relationship_type": "colleague",
//	  "notes": "Met at PyCon 2025",
//	  "status": "active"
//	}
func (h *InteractionHandler) Create(w http.ResponseWriter, r *http.Request) {
	var in models.CreateInteractionInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		respondError(w, http.StatusBadRequest, fmt.Sprintf("invalid JSON body: %v", err))
		return
	}

	if !in.P1.Valid || !in.P2.Valid {
		respondError(w, http.StatusBadRequest, "both 'p1' and 'p2' UUIDs are required")
		return
	}

	interaction, err := h.repo.Create(r.Context(), in)
	if err != nil {
		// Postgres check constraint fires if p1 == p2
		if strings.Contains(err.Error(), "interactions_no_self_loop") {
			respondError(w, http.StatusBadRequest, "p1 and p2 must be different people")
			return
		}
		// FK violation: one of the UUIDs doesn't exist in people
		if strings.Contains(err.Error(), "foreign key") || strings.Contains(err.Error(), "fkey") {
			respondError(w, http.StatusUnprocessableEntity, "one or both person UUIDs do not exist")
			return
		}
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, interaction)
}

// ─── PUT /interactions/{id} ──────────────────────────────────────────────────

// Update updates an existing interaction.
//
//	PUT /interactions/{id}
//	Content-Type: application/json
//	{ "status": "inactive", "notes": "Lost touch" }
func (h *InteractionHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := parseInteractionID(r)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	var in models.UpdateInteractionInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		respondError(w, http.StatusBadRequest, fmt.Sprintf("invalid JSON body: %v", err))
		return
	}

	interaction, err := h.repo.Update(r.Context(), id, in)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusNotFound, fmt.Sprintf("interaction %s not found", uuidString(id)))
			return
		}
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, interaction)
}

// ── helpers ──────────────────────────────────────────────────────────────────

func parseInteractionID(r *http.Request) (pgtype.UUID, error) {
	raw := chi.URLParam(r, "id")
	if raw == "" {
		return pgtype.UUID{}, fmt.Errorf("path param 'id' is required")
	}
	var id pgtype.UUID
	if err := id.Scan(raw); err != nil {
		return pgtype.UUID{}, fmt.Errorf("'id' is not a valid UUID: %v", err)
	}
	return id, nil
}

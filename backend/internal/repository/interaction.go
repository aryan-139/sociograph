// Package repository provides data-access functions for the interactions table.
package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"sociograph/backend/internal/models"
)

// InteractionRepo wraps the pool and exposes typed CRUD operations.
type InteractionRepo struct {
	pool *pgxpool.Pool
}

// NewInteractionRepo creates a new InteractionRepo backed by pool.
func NewInteractionRepo(pool *pgxpool.Pool) *InteractionRepo {
	return &InteractionRepo{pool: pool}
}

// Create inserts a new interaction and returns the persisted record.
func (r *InteractionRepo) Create(ctx context.Context, in models.CreateInteractionInput) (*models.Interaction, error) {
	const q = `
		INSERT INTO public.interactions
			(p1, p2, relationship_type, notes, status)
		VALUES
			($1, $2, $3, $4, $5)
		RETURNING
			id, p1, p2, relationship_type, notes, status, created_at, updated_at`

	row := r.pool.QueryRow(ctx, q,
		in.P1,
		in.P2,
		in.RelationshipType,
		in.Notes,
		in.Status,
	)
	return scanInteraction(row)
}

// GetByID fetches a single interaction by UUID. Returns pgx.ErrNoRows when not found.
func (r *InteractionRepo) GetByID(ctx context.Context, id pgtype.UUID) (*models.Interaction, error) {
	const q = `
		SELECT id, p1, p2, relationship_type, notes, status, created_at, updated_at
		FROM public.interactions
		WHERE id = $1`

	row := r.pool.QueryRow(ctx, q, id)
	return scanInteraction(row)
}

// Update applies non-nil fields from in to the interaction identified by id.
func (r *InteractionRepo) Update(ctx context.Context, id pgtype.UUID, in models.UpdateInteractionInput) (*models.Interaction, error) {
	const q = `
		UPDATE public.interactions SET
			relationship_type = COALESCE($2, relationship_type),
			notes             = COALESCE($3, notes),
			status            = COALESCE($4, status)
		WHERE id = $1
		RETURNING
			id, p1, p2, relationship_type, notes, status, created_at, updated_at`

	row := r.pool.QueryRow(ctx, q,
		id,
		in.RelationshipType,
		in.Notes,
		in.Status,
	)
	return scanInteraction(row)
}

// ── helpers ──────────────────────────────────────────────────────────────────

func scanInteraction(row pgx.Row) (*models.Interaction, error) {
	var i models.Interaction
	err := row.Scan(
		&i.ID,
		&i.P1,
		&i.P2,
		&i.RelationshipType,
		&i.Notes,
		&i.Status,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("interaction: scan: %w", err)
	}
	return &i, nil
}

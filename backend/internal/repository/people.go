// Package repository provides data-access functions for the people table.
package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"sociograph/backend/internal/models"
)

// PeopleRepo wraps the pool and exposes typed CRUD operations.
type PeopleRepo struct {
	pool *pgxpool.Pool
}

// NewPeopleRepo creates a new PeopleRepo backed by pool.
func NewPeopleRepo(pool *pgxpool.Pool) *PeopleRepo {
	return &PeopleRepo{pool: pool}
}

// Create inserts a new person and returns the persisted record.
func (r *PeopleRepo) Create(ctx context.Context, in models.CreatePersonInput) (*models.Person, error) {
	const q = `
		INSERT INTO public.people
			(name, company, role, location, met_at, first_met, last_interaction)
		VALUES
			($1, $2, $3, $4, $5, $6, $7)
		RETURNING
			id, name, company, role, location, met_at, first_met, last_interaction,
			created_at, updated_at`

	row := r.pool.QueryRow(ctx, q,
		in.Name,
		in.Company,
		in.Role,
		in.Location,
		in.MetAt,
		in.FirstMet,
		in.LastInteraction,
	)

	return scanPerson(row)
}

// BulkCreate inserts multiple people in a single transaction and returns
// all persisted records. The operation is atomic — if any row fails the
// entire batch is rolled back.
func (r *PeopleRepo) BulkCreate(ctx context.Context, inputs []models.CreatePersonInput) ([]*models.Person, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("people.BulkCreate: begin tx: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	people := make([]*models.Person, 0, len(inputs))
	for _, in := range inputs {
		const q = `
			INSERT INTO public.people
				(name, company, role, location, met_at, first_met, last_interaction)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			RETURNING
				id, name, company, role, location, met_at, first_met, last_interaction,
				created_at, updated_at`

		row := tx.QueryRow(ctx, q,
			in.Name, in.Company, in.Role, in.Location,
			in.MetAt, in.FirstMet, in.LastInteraction,
		)

		p, err := scanPerson(row)
		if err != nil {
			return nil, fmt.Errorf("people.BulkCreate: insert %q: %w", in.Name, err)
		}
		people = append(people, p)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("people.BulkCreate: commit: %w", err)
	}
	return people, nil
}

// GetByID fetches a single person by UUID. Returns pgx.ErrNoRows when not found.
func (r *PeopleRepo) GetByID(ctx context.Context, id pgtype.UUID) (*models.Person, error) {
	const q = `
		SELECT id, name, company, role, location, met_at, first_met, last_interaction,
		       created_at, updated_at
		FROM public.people
		WHERE id = $1`

	row := r.pool.QueryRow(ctx, q, id)
	return scanPerson(row)
}

// Update applies non-nil fields from in to the person identified by id.
// It returns the updated record. Uses COALESCE so only provided fields change.
func (r *PeopleRepo) Update(ctx context.Context, id pgtype.UUID, in models.UpdatePersonInput) (*models.Person, error) {
	const q = `
		UPDATE public.people SET
			name             = COALESCE($2, name),
			company          = COALESCE($3, company),
			role             = COALESCE($4, role),
			location         = COALESCE($5, location),
			met_at           = COALESCE($6, met_at),
			first_met        = COALESCE($7, first_met),
			last_interaction = COALESCE($8, last_interaction)
		WHERE id = $1
		RETURNING
			id, name, company, role, location, met_at, first_met, last_interaction,
			created_at, updated_at`

	row := r.pool.QueryRow(ctx, q,
		id,
		in.Name,
		in.Company,
		in.Role,
		in.Location,
		in.MetAt,
		in.FirstMet,
		in.LastInteraction,
	)
	return scanPerson(row)
}

// Delete removes the person with the given id.
// Returns pgx.ErrNoRows if no row was deleted.
func (r *PeopleRepo) Delete(ctx context.Context, id pgtype.UUID) error {
	const q = `DELETE FROM public.people WHERE id = $1`
	tag, err := r.pool.Exec(ctx, q, id)
	if err != nil {
		return fmt.Errorf("people.Delete: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

// ── helpers ──────────────────────────────────────────────────────────────────

func scanPerson(row pgx.Row) (*models.Person, error) {
	var p models.Person
	err := row.Scan(
		&p.ID,
		&p.Name,
		&p.Company,
		&p.Role,
		&p.Location,
		&p.MetAt,
		&p.FirstMet,
		&p.LastInteraction,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("people: scan: %w", err)
	}
	return &p, nil
}

// Package models defines the core domain types for sociograph.
package models

import (
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

// Person mirrors the public.people table.
type Person struct {
	ID              pgtype.UUID `json:"id"`
	Name            string      `json:"name"`
	Company         *string     `json:"company,omitempty"`
	Role            *string     `json:"role,omitempty"`
	Location        *string     `json:"location,omitempty"`
	MetAt           *string     `json:"met_at,omitempty"`
	FirstMet        *time.Time  `json:"first_met,omitempty"`
	LastInteraction *time.Time  `json:"last_interaction,omitempty"`
	Intent          *string     `json:"intent,omitempty"`
	Notes           *string     `json:"notes,omitempty"`
	CreatedAt       time.Time   `json:"created_at"`
	UpdatedAt       time.Time   `json:"updated_at"`
}

// CreatePersonInput is the payload used when inserting a new person.
// All nullable fields are pointers so that partial updates are unambiguous.
type CreatePersonInput struct {
	Name            string     `json:"name"`
	Company         *string    `json:"company,omitempty"`
	Role            *string    `json:"role,omitempty"`
	Location        *string    `json:"location,omitempty"`
	MetAt           *string    `json:"met_at,omitempty"`
	FirstMet        *time.Time `json:"first_met,omitempty"`
	LastInteraction *time.Time `json:"last_interaction,omitempty"`
	Intent          *string    `json:"intent,omitempty"`
	Notes           *string    `json:"notes,omitempty"`
}

// UpdatePersonInput is the payload used when updating an existing person.
// A nil pointer means "leave unchanged".
type UpdatePersonInput struct {
	Name            *string    `json:"name,omitempty"`
	Company         *string    `json:"company,omitempty"`
	Role            *string    `json:"role,omitempty"`
	Location        *string    `json:"location,omitempty"`
	MetAt           *string    `json:"met_at,omitempty"`
	FirstMet        *time.Time `json:"first_met,omitempty"`
	LastInteraction *time.Time `json:"last_interaction,omitempty"`
	Intent          *string    `json:"intent,omitempty"`
	Notes           *string    `json:"notes,omitempty"`
}

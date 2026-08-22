package models

import (
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

// RelationshipType is a controlled vocabulary for interaction kinds.
type RelationshipType string

const (
	RelationshipColleague  RelationshipType = "colleague"
	RelationshipFriend     RelationshipType = "friend"
	RelationshipMentor     RelationshipType = "mentor"
	RelationshipMentee     RelationshipType = "mentee"
	RelationshipAcquaint   RelationshipType = "acquaintance"
	RelationshipNetworking RelationshipType = "networking"
	RelationshipOther      RelationshipType = "other"
)

// InteractionStatus tracks the lifecycle of a relationship record.
type InteractionStatus string

const (
	StatusActive   InteractionStatus = "active"
	StatusInactive InteractionStatus = "inactive"
	StatusPending  InteractionStatus = "pending"
)

// Interaction mirrors the public.interactions table.
// P1 and P2 are UUIDs referencing public.people.
type Interaction struct {
	ID               pgtype.UUID       `json:"id"`
	P1               pgtype.UUID       `json:"p1"`
	P2               pgtype.UUID       `json:"p2"`
	RelationshipType *RelationshipType `json:"relationship_type,omitempty"`
	Notes            *string           `json:"notes,omitempty"`
	Status           *InteractionStatus `json:"status,omitempty"`
	CreatedAt        time.Time         `json:"created_at"`
	UpdatedAt        time.Time         `json:"updated_at"`
}

// CreateInteractionInput is the request payload for POST /interactions.
type CreateInteractionInput struct {
	P1               pgtype.UUID       `json:"p1"`
	P2               pgtype.UUID       `json:"p2"`
	RelationshipType *RelationshipType `json:"relationship_type,omitempty"`
	Notes            *string           `json:"notes,omitempty"`
	Status           *InteractionStatus `json:"status,omitempty"`
}

// UpdateInteractionInput is the request payload for PUT /interactions/:id.
type UpdateInteractionInput struct {
	RelationshipType *RelationshipType `json:"relationship_type,omitempty"`
	Notes            *string           `json:"notes,omitempty"`
	Status           *InteractionStatus `json:"status,omitempty"`
}

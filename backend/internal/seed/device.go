package seed

import (
	"encoding/json"
	"fmt"
	"strings"

	"sociograph/backend/internal/models"
)

// DeviceSeeder handles contacts exported from a phone / device address book.
//
// Expected request body (POST /people/seed-data?type=device):
//
//	{
//	  "name":   "Jane Doe",          // required
//	  "phone":  "+91-98765-43210",   // optional, stored in met_at for reference
//	  "email":  "jane@example.com",  // optional
//	  "company": "Acme Corp",        // optional
//	  "role":    "Engineer",         // optional
//	  "location": "Mumbai"           // optional
//	}
type DeviceSeeder struct{}

// deviceInput is the raw JSON shape expected from a device contact export.
type deviceInput struct {
	Name     string  `json:"name"`
	Phone    *string `json:"phone,omitempty"`
	Email    *string `json:"email,omitempty"`
	Company  *string `json:"company,omitempty"`
	Role     *string `json:"role,omitempty"`
	Location *string `json:"location,omitempty"`
}

// Type returns "device".
func (d *DeviceSeeder) Type() string { return "device" }

// Normalize validates and maps deviceInput to a CreatePersonInput.
func (d *DeviceSeeder) Normalize(data json.RawMessage) (*models.CreatePersonInput, error) {
	var raw deviceInput
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, fmt.Errorf("device seeder: invalid JSON: %w", err)
	}

	raw.Name = strings.TrimSpace(raw.Name)
	if raw.Name == "" {
		return nil, fmt.Errorf("device seeder: 'name' is required")
	}

	// Store phone/email as a convenience note inside met_at so the schema
	// stays clean. This field can be enriched later.
	var metAt *string
	if raw.Phone != nil && strings.TrimSpace(*raw.Phone) != "" {
		s := "phone:" + strings.TrimSpace(*raw.Phone)
		if raw.Email != nil && strings.TrimSpace(*raw.Email) != "" {
			s += " email:" + strings.TrimSpace(*raw.Email)
		}
		metAt = &s
	} else if raw.Email != nil && strings.TrimSpace(*raw.Email) != "" {
		s := "email:" + strings.TrimSpace(*raw.Email)
		metAt = &s
	}

	return &models.CreatePersonInput{
		Name:     raw.Name,
		Company:  raw.Company,
		Role:     raw.Role,
		Location: raw.Location,
		MetAt:    metAt,
	}, nil
}

package bulk

import (
	"context"
	"fmt"
	"io"

	"sociograph/backend/internal/models"
)

// MobileContactSeeder imports people from a mobile contact export.
//
// # Expected format (to be defined)
//
// Accepts a vCard (.vcf) file or a JSON array of contacts exported from iOS
// Contacts / Android Contacts.
//
// # vCard example
//
//	BEGIN:VCARD
//	VERSION:3.0
//	FN:Jane Doe
//	ORG:Acme Corp
//	TITLE:Engineer
//	TEL;TYPE=CELL:+91-98765-43210
//	EMAIL:jane@example.com
//	END:VCARD
//
// # JSON array example
//
//	[
//	  { "name": "Jane Doe", "phone": "+91-98765-43210", "company": "Acme" }
//	]
//
// TODO: implement Parse once the mobile export format is confirmed.
type MobileContactSeeder struct{}

func (s *MobileContactSeeder) Type() string { return string(SourceMobileContactExport) }

func (s *MobileContactSeeder) Parse(_ context.Context, _ io.Reader) ([]models.CreatePersonInput, error) {
	return nil, fmt.Errorf("mobile_contact_export: not yet implemented")
}

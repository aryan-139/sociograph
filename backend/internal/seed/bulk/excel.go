package bulk

import (
	"context"
	"fmt"
	"io"

	"sociograph/backend/internal/models"
)

// ExcelSeeder imports people from an Excel spreadsheet (.xlsx).
//
// # Expected format (to be defined)
//
// The spreadsheet must have a header row. Recognised column names (case-insensitive):
//
//	Name      → people.name        (required)
//	Company   → people.company
//	Role      → people.role
//	Location  → people.location
//	Met At    → people.met_at
//	First Met → people.first_met   (date: YYYY-MM-DD or Excel serial)
//
// Extra columns are ignored.
//
// # Multipart upload
//
//	POST /people/bulk-seed-data?type=excel
//	Content-Type: multipart/form-data
//	file: <contacts.xlsx>
//
// TODO: implement Parse using github.com/xuri/excelize/v2 once ready.
type ExcelSeeder struct{}

func (s *ExcelSeeder) Type() string { return string(SourceExcel) }

func (s *ExcelSeeder) Parse(_ context.Context, _ io.Reader) ([]models.CreatePersonInput, error) {
	return nil, fmt.Errorf("excel: not yet implemented")
}

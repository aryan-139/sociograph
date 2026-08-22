package bulk

import (
	"context"
	"fmt"
	"io"

	"sociograph/backend/internal/models"
)

// InstagramSeeder imports people from an Instagram connections export.
//
// # Expected format (to be defined)
//
// Accepts the JSON from the Instagram Data Download:
//   - File path in archive: followers_and_following/following.json
//   - Each entry: { "title": "username", "string_list_data": [{ "value": "handle" }] }
//
// Alternatively, a simplified custom JSON array:
//
//	[
//	  { "instagram_handle": "janedoe", "name": "Jane Doe" }
//	]
//
// Mapping:
//
//	name / title       → people.name
//	instagram_handle   → people.met_at  (prefixed "instagram:")
//
// TODO: implement Parse once the Instagram export format is confirmed.
type InstagramSeeder struct{}

func (s *InstagramSeeder) Type() string { return string(SourceInstagram) }

func (s *InstagramSeeder) Parse(_ context.Context, _ io.Reader) ([]models.CreatePersonInput, error) {
	return nil, fmt.Errorf("instagram: not yet implemented")
}

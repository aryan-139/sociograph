package bulk

import (
	"context"
	"fmt"
	"io"

	"sociograph/backend/internal/models"
)

// TwitterSeeder imports people from a Twitter/X connections export.
//
// # Expected format (to be defined)
//
// Accepts the JSON payload from the Twitter Data Export archive:
//   - File path in archive: data/following.js
//   - Each entry has: accountId, userLink, name
//
// Alternatively, accepts a custom JSON array:
//
//	[
//	  { "twitter_handle": "@janedoe", "name": "Jane Doe" }
//	]
//
// Mapping:
//
//	name           → people.name
//	twitter_handle → people.met_at  (prefixed "twitter:")
//
// TODO: implement Parse once the Twitter export format is confirmed.
type TwitterSeeder struct{}

func (s *TwitterSeeder) Type() string { return string(SourceTwitter) }

func (s *TwitterSeeder) Parse(_ context.Context, _ io.Reader) ([]models.CreatePersonInput, error) {
	return nil, fmt.Errorf("twitter: not yet implemented")
}

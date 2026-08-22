package handlers

import (
	"encoding/json"
	"net/http"
)

// apiError is the standard error envelope.
type apiError struct {
	Error string `json:"error"`
}

// respondJSON serialises v as JSON and writes it with the given status code.
func respondJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// respondError writes a JSON error envelope with the given status code.
func respondError(w http.ResponseWriter, status int, msg string) {
	respondJSON(w, status, apiError{Error: msg})
}

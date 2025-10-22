package engine

import (
	"context"
	"fmt"
)

// ⚠️ TODO: Sobald klar, ersetze den Import/Init auf die echte Mangle-Go-API.
// import "github.com/google/mangle-go/mangle"

type MangleEngine struct {
	program string
}

func NewMangleEngine() *MangleEngine { 
	return &MangleEngine{} 
}

func (e *MangleEngine) Load(program string) error {
	e.program = program
	// TODO: compile program with mangle
	// _, err := mangle.Compile(program)
	// return err
	return nil
}

func (e *MangleEngine) Eval(q QueryRequest) (QueryResult, error) {
	ctx := context.Background()
	prog := e.program
	if q.Program != "" {
		prog = q.Program
		// _, err := mangle.Compile(prog)
		// if err != nil { return QueryResult{Ok:false, Error: err.Error()}, nil }
	}
	_ = ctx

	// TODO: inject q.Facts into mangle DB, run q.Query, read tables.
	// result := mangle.Run(ctx, prog, q.Query, q.Facts, q.Params)

	// Temporär: Dummy-Resultat bis Importpfad gesetzt ist
	return QueryResult{
		Ok: true,
		Tables: map[string][]map[string]any{
			"allow": {{"userId": "u1", "moduleId": "mA"}},
		},
	}, nil
} 
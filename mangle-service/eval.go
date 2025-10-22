package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/google/mangle/engine"
	"github.com/google/mangle/parse"
)

type EvalRequest struct {
	SessionID string                 `json:"sessionId"`
	Facts     []map[string]any       `json:"facts"`   // z.B. {"pred":"watched","args":[ "sess1", 1 ]}
	Queries   []map[string]any       `json:"queries"` // z.B. {"pred":"current_status","args":[ "sess1", "_S" ]}
}

type EvalResponse struct {
	Results map[string][]map[string]any `json:"results"`
	Error   string                      `json:"error,omitempty"`
}

func buildFacts(fs []map[string]any) ([]engine.Fact, error) {
	out := make([]engine.Fact, 0, len(fs))
	for _, f := range fs {
		pred, _ := f["pred"].(string)
		args, _ := f["args"].([]any)
		termArgs := make([]engine.Term, 0, len(args))
		for _, a := range args {
			switch v := a.(type) {
			case float64:
				termArgs = append(termArgs, engine.Int(int64(v)))
			case string:
				termArgs = append(termArgs, engine.String(v))
			case bool:
				if v {
					termArgs = append(termArgs, engine.String("true"))
				} else {
					termArgs = append(termArgs, engine.String("false"))
				}
			default:
				b, _ := json.Marshal(v)
				termArgs = append(termArgs, engine.String(string(b)))
			}
		}
		out = append(out, engine.Fact{Predicate: pred, Args: termArgs})
	}
	return out, nil
}

func evaluate(program string, facts []engine.Fact, queries []map[string]any) (map[string][]map[string]any, error) {
	// Parser & Engine
	ast, err := parse.Program(program)
	if err != nil {
		return nil, fmt.Errorf("parse error: %w", err)
	}
	e := engine.NewEngine()
	if err := e.AddProgram(ast); err != nil {
		return nil, err
	}
	// Facts injizieren
	for _, f := range facts {
		if err := e.Assert(f); err != nil {
			return nil, err
		}
	}
	// Fixpunkt berechnen
	if err := e.Materialize(); err != nil {
		return nil, err
	}

	// Queries auswerten
	result := map[string][]map[string]any{}
	for _, q := range queries {
		pred := q["pred"].(string)
		args := q["args"].([]any)
		terms := make([]engine.Term, 0, len(args))
		for _, a := range args {
			s, ok := a.(string)
			if ok && len(s) > 0 && s[0] == '_' {
				terms = append(terms, engine.Var(s[1:])) // _S -> Var(S)
				continue
			}
			switch v := a.(type) {
			case float64:
				terms = append(terms, engine.Int(int64(v)))
			case string:
				terms = append(terms, engine.String(v))
			default:
				b, _ := json.Marshal(v)
				terms = append(terms, engine.String(string(b)))
			}
		}
		tuples, err := e.Query(pred, terms...)
		if err != nil {
			return nil, err
		}
		rows := []map[string]any{}
		for _, t := range tuples {
			row := map[string]any{}
			for i, term := range t {
				row[fmt.Sprintf("col%d", i)] = term.String()
			}
			rows = append(rows, row)
		}
		result[pred] = rows
	}
	return result, nil
}

func loadRules() (string, error) {
	b, err := os.ReadFile("rules/junosixteen.mg")
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// HTTP-Handler
func evalHandler(w http.ResponseWriter, r *http.Request) {
	var req EvalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad request", 400)
		return
	}
	prog, err := loadRules()
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	fs, err := buildFacts(req.Facts)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	res, err := evaluate(prog, fs, req.Queries)
	resp := EvalResponse{Results: res}
	if err != nil {
		resp.Error = err.Error()
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
} 
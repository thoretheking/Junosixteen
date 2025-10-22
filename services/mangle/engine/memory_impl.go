package engine

import "fmt"

type MemoryEngine struct {
	program string
}

func NewMemoryEngine() *MemoryEngine { 
	return &MemoryEngine{} 
}

func (e *MemoryEngine) Load(program string) error {
	e.program = program
	return nil
}

func (e *MemoryEngine) Eval(q QueryRequest) (QueryResult, error) {
	// Extrem vereinfachter Evaluator: erlaubt Modul, wenn userXP >= requiredXP
	// Erwartet Facts wie: userXP(userId, xp), moduleReq(moduleId, requiredXP)
	userXP := map[string]int{}
	required := map[string]int{}
	
	for _, f := range q.Facts {
		if f["type"] == "userXP" {
			userXP[fmt.Sprint(f["userId"])] = int(f["xp"].(float64))
		}
		if f["type"] == "moduleReq" {
			required[fmt.Sprint(f["moduleId"])] = int(f["requiredXP"].(float64))
		}
	}
	
	out := []map[string]any{}
	for m, req := range required {
		uid := fmt.Sprint(q.Params["userId"])
		if userXP[uid] >= req {
			out = append(out, map[string]any{"userId": uid, "moduleId": m})
		}
	}
	
	return QueryResult{
		Ok:     true, 
		Tables: map[string][]map[string]any{"allow": out},
	}, nil
} 
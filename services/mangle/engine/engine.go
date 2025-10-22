package engine

type Fact map[string]any

type QueryRequest struct {
	Program string         `json:"program"` // optional: überschreibt geladene Regeln
	Query   string         `json:"query"`
	Facts   []Fact         `json:"facts"`
	Params  map[string]any `json:"params"`
}

type QueryResult struct {
	Ok     bool                     `json:"ok"`
	Tables map[string][]map[string]any `json:"tables"`
	Error  string                   `json:"error,omitempty"`
}

type Engine interface {
	Load(program string) error
	Eval(q QueryRequest) (QueryResult, error)
} 
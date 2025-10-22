# Mangle Engine Direct Integration Notes

## 📋 Überblick

Diese Notizen dokumentieren die geplante direkte Integration der Mangle Go-Engine anstelle der aktuellen CLI-Lösung.

## 🔄 Migration CLI → SDK

### Aktuelle CLI-Implementation
```go
// services/mangle/main.go
func runMgCLI(query, factsPath string) (string, error) {
    args := []string{}
    for _, f := range ruleFiles {
        args = append(args, "-f", f)
    }
    args = append(args, "-q", query, "-i", factsPath)
    
    cmd := exec.Command(mgBin, args...)
    // ... exec and parse output
}
```

### Geplante SDK-Implementation
```go
import "github.com/google/mangle/engine" // Hypothetisches Package

var mangleEngine *engine.Engine

func initEngine() error {
    rules, err := engine.LoadFiles(ruleFiles...)
    if err != nil {
        return err
    }
    
    mangleEngine = engine.New(rules)
    return nil
}

func evalWithSDK(query string, facts json.RawMessage) (*engine.Result, error) {
    factsObj, err := engine.ParseJSON(facts)
    if err != nil {
        return nil, err
    }
    
    return mangleEngine.Eval(query, factsObj)
}
```

## 🗂️ Facts Mapping (JSON → Engine)

### Aktuelles JSON-Format
```json
{
  "answered_correct": [["lea", 3, 1, "2025-08-25T07:58:00Z"]],
  "answered_wrong": [["lea", 3, 2, "2025-08-25T07:59:00Z"]],
  "deadline": [[3, "2025-08-29T21:59:00Z"]]
}
```

### Engine-Facts-Mapping
```go
func jsonToMangleFacts(data json.RawMessage) ([]engine.Fact, error) {
    var jsonFacts struct {
        AnsweredCorrect [][]interface{} `json:"answered_correct"`
        AnsweredWrong   [][]interface{} `json:"answered_wrong"`
        Deadline        [][]interface{} `json:"deadline"`
    }
    
    if err := json.Unmarshal(data, &jsonFacts); err != nil {
        return nil, err
    }
    
    var facts []engine.Fact
    
    // Convert answered_correct facts
    for _, fact := range jsonFacts.AnsweredCorrect {
        facts = append(facts, engine.Fact{
            Predicate: "answered_correct",
            Args: []engine.Term{
                engine.Atom(fact[0].(string)),
                engine.Number(fact[1].(float64)),
                engine.Number(fact[2].(float64)),
                engine.Atom(fact[3].(string)),
            },
        })
    }
    
    // Convert answered_wrong facts
    for _, fact := range jsonFacts.AnsweredWrong {
        facts = append(facts, engine.Fact{
            Predicate: "answered_wrong",
            Args: []engine.Term{
                engine.Atom(fact[0].(string)),
                engine.Number(fact[1].(float64)),
                engine.Number(fact[2].(float64)),
                engine.Atom(fact[3].(string)),
            },
        })
    }
    
    // Convert deadline facts
    for _, fact := range jsonFacts.Deadline {
        facts = append(facts, engine.Fact{
            Predicate: "deadline",
            Args: []engine.Term{
                engine.Number(fact[0].(float64)),
                engine.Atom(fact[1].(string)),
            },
        })
    }
    
    return facts, nil
}
```

## 🔄 Rule Loading & Invalidation

### Rule File Monitoring
```go
import "github.com/fsnotify/fsnotify"

func watchRuleFiles() error {
    watcher, err := fsnotify.NewWatcher()
    if err != nil {
        return err
    }
    
    for _, file := range ruleFiles {
        err = watcher.Add(file)
        if err != nil {
            return err
        }
    }
    
    go func() {
        for {
            select {
            case event := <-watcher.Events:
                if event.Op&fsnotify.Write == fsnotify.Write {
                    log.Printf("Rule file modified: %s", event.Name)
                    reloadEngine()
                }
            case err := <-watcher.Errors:
                log.Printf("Watcher error: %v", err)
            }
        }
    }()
    
    return nil
}

func reloadEngine() error {
    rules, err := engine.LoadFiles(ruleFiles...)
    if err != nil {
        return err
    }
    
    // Atomic engine replacement
    newEngine := engine.New(rules)
    mangleEngine = newEngine
    
    log.Printf("Engine reloaded with %d rules", len(ruleFiles))
    return nil
}
```

### /reload Endpoint Enhancement
```go
func reloadHandler(w http.ResponseWriter, r *http.Request) {
    // Discover new rule files
    newRuleFiles, err := discoverRules(rulesDir)
    if err != nil {
        http.Error(w, "reload failed: "+err.Error(), 500)
        return
    }
    
    // Update global rule files
    ruleFiles = newRuleFiles
    
    // Reload engine with new rules
    if err := reloadEngine(); err != nil {
        http.Error(w, "engine reload failed: "+err.Error(), 500)
        return
    }
    
    w.WriteHeader(200)
    w.Write([]byte(fmt.Sprintf("reloaded %d rules", len(ruleFiles))))
}
```

## 🔍 Explainability & Debugging

### Ableitungspfad (Derivation Trace)
```go
type ExplainableResult struct {
    Results []engine.Binding    `json:"results"`
    Trace   []engine.Step       `json:"trace,omitempty"`
    Stats   engine.Statistics   `json:"stats,omitempty"`
}

func evalWithExplanation(query string, facts json.RawMessage) (*ExplainableResult, error) {
    factsObj, err := jsonToMangleFacts(facts)
    if err != nil {
        return nil, err
    }
    
    // Enable tracing
    result := mangleEngine.EvalWithTrace(query, factsObj)
    
    return &ExplainableResult{
        Results: result.Bindings,
        Trace:   result.DerivationSteps,
        Stats:   result.Statistics,
    }, nil
}
```

### Debug-Endpoint Erweiterung
```go
func debugHandler(w http.ResponseWriter, r *http.Request) {
    info := map[string]interface{}{
        "service":      "JunoSixteen Mangle Sidecar",
        "version":      "2.0.0-sdk",
        "engine_mode":  "direct",
        "rules_loaded": len(ruleFiles),
        "rule_files":   ruleFiles,
        "facts_cache":  getFactsCacheStats(),
        "performance": map[string]interface{}{
            "avg_eval_time": getAverageEvalTime(),
            "queries_processed": getTotalQueries(),
            "cache_hit_rate": getCacheHitRate(),
        },
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(info)
}
```

## ⚡ Performance Optimizations

### Rule Compilation Caching
```go
var compiledRulesCache = make(map[string]*engine.CompiledRules)

func getCompiledRules(ruleFiles []string) (*engine.CompiledRules, error) {
    cacheKey := strings.Join(ruleFiles, "|")
    
    if cached, exists := compiledRulesCache[cacheKey]; exists {
        return cached, nil
    }
    
    compiled, err := engine.CompileFiles(ruleFiles...)
    if err != nil {
        return nil, err
    }
    
    compiledRulesCache[cacheKey] = compiled
    return compiled, nil
}
```

### Query Result Caching
```go
import "golang.org/x/sync/singleflight"

var queryGroup singleflight.Group

func evalWithCache(query string, facts json.RawMessage) (*engine.Result, error) {
    // Create cache key from query + facts hash
    cacheKey := fmt.Sprintf("%s:%x", query, sha256.Sum256(facts))
    
    // Use singleflight to prevent duplicate work
    result, err, _ := queryGroup.Do(cacheKey, func() (interface{}, error) {
        return evalWithSDK(query, facts)
    })
    
    if err != nil {
        return nil, err
    }
    
    return result.(*engine.Result), nil
}
```

## 🚀 Migration Strategy

### Phase 1: CLI → SDK (Breaking Change)
1. Update `go.mod` mit Mangle-SDK dependency
2. Implementiere `jsonToMangleFacts()`
3. Ersetze `runMgCLI()` durch `evalWithSDK()`
4. Teste mit bestehenden Golden Tests

### Phase 2: Performance Optimizations
1. Rule compilation caching
2. Query result caching
3. Background rule reloading
4. Metrics & monitoring

### Phase 3: Advanced Features
1. Explainability API
2. Rule debugger
3. Live rule editing
4. Performance profiling

## 🧪 Testing Strategy

### SDK Integration Tests
```go
func TestSDKIntegration(t *testing.T) {
    // Load test rules
    rules := []string{"testdata/progress.mg", "testdata/game.mg"}
    engine := setupTestEngine(rules)
    
    // Test fact conversion
    jsonFacts := []byte(`{"answered_correct": [["test", 1, 1, "2025-08-25T10:00:00Z"]]}`)
    facts, err := jsonToMangleFacts(jsonFacts)
    assert.NoError(t, err)
    
    // Test query evaluation
    result, err := engine.Eval("can_start(U,L)?", facts)
    assert.NoError(t, err)
    assert.NotEmpty(t, result.Bindings)
}
```

### Performance Benchmarks
```go
func BenchmarkCLIvsSDK(b *testing.B) {
    b.Run("CLI", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            runMgCLI("can_start(U,L)?", "testdata/facts.json")
        }
    })
    
    b.Run("SDK", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            evalWithSDK("can_start(U,L)?", testFacts)
        }
    })
}
```

## 📝 Configuration

### Environment Variables
```bash
# Engine mode selection
MANGLE_ENGINE_MODE=sdk  # or "cli"

# Performance tuning
MANGLE_CACHE_SIZE=1000
MANGLE_CACHE_TTL=300s
MANGLE_COMPILE_CACHE=true

# Debugging
MANGLE_TRACE_ENABLED=false
MANGLE_DEBUG_QUERIES=false
```

## 📊 Monitoring & Metrics

### Prometheus Metrics
```go
import "github.com/prometheus/client_golang/prometheus"

var (
    evalDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "mangle_eval_duration_seconds",
            Help: "Time spent evaluating queries",
        },
        []string{"query_type", "status"},
    )
    
    rulesLoaded = prometheus.NewGauge(
        prometheus.GaugeOpts{
            Name: "mangle_rules_loaded_total",
            Help: "Number of rules currently loaded",
        },
    )
)
```

---

**Status:** Vorbereitet für SDK-Migration  
**Priorität:** Nach CLI-Stabilisierung  
**Aufwand:** ~2-3 Entwicklertage 
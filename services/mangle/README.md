# JunoSixteen – Mangle Sidecar

Go-basierter HTTP-Service für regelbasierte Entscheidungen in der JunoSixteen Lernplattform.

## 🚀 Schnellstart

### Voraussetzungen

**mg-CLI installieren:**
```bash
# Global installieren
GOBIN=$HOME/bin go install github.com/google/mangle/interpreter/mg@latest

# Sicherstellen dass $HOME/bin im PATH ist
export PATH="$HOME/bin:$PATH"

# Installation überprüfen
mg --help
```

### Service starten
```bash
cd services/mangle
go mod tidy
go run main.go
```

Der Service läuft standardmäßig auf Port 8088 und lädt automatisch alle `.mg` Dateien aus `./rules`.

## 📡 API Endpoints

### POST /eval
Evaluiert Mangle-Regeln basierend auf Facts und Query über mg-CLI.

**Request:**
```json
{
  "ruleset": "progress",
  "facts": {
    "answered_correct": [["lea",3,1,"2025-08-25T07:58:00Z"]],
    "deadline": [[3,"2025-08-29T21:59:00Z"]]
  },
  "query": "can_start(U,L)?"
}
```

**Response:**
```json
{
  "results": [{"U": "lea", "L": 4}],
  "raw": "JSON response from mg CLI",
  "timestamp": "2025-08-25T09:51:00Z"
}
```

### GET /health
Health-Check für Monitoring.

### POST /reload
Lädt Mangle-Regeln neu (scannt ./rules für .mg Dateien).

### GET /debug
Debug-Informationen und verfügbare Endpoints.

## 🔧 Konfiguration

### Umgebungsvariablen
- `MANGLE_PORT`: Port für den HTTP-Server (Standard: 8088)
- `MANGLE_RULES_DIR`: Verzeichnis für .mg-Dateien (Standard: ./rules)
- `MG_BIN`: Pfad zur mg-CLI (Standard: mg)

### Unterstützte Rulesets
- `progress`: Fortschritt und Level-Freischaltung
- `game`: Gamification-Mechaniken (Punkte, Multiplier)
- `recommend`: Empfehlungsalgorithmen
- `certs`: Zertifikatsvergabe
- `time`: Zeitbasierte Regeln

## 🏗️ Architektur

```
┌─────────────────┐    HTTP    ┌─────────────────┐
│   Backend       │ ────────> │  Mangle Sidecar │
│   (Node.js)     │   /eval    │     (Go)        │
└─────────────────┘            └─────────────────┘
                                        │
                                        ▼
                               ┌─────────────────┐
                               │    mg CLI       │
                               │ (Mangle Engine) │
                               └─────────────────┘
                                        │
                                        ▼
                               ┌─────────────────┐
                               │   Rules (.mg)   │
                               │ + Facts (JSON)  │
                               └─────────────────┘
```

## 📝 Entwicklung

### mg-CLI Integration
Der Service nutzt die offizielle mg-CLI:
- Lädt alle `.mg`-Dateien aus dem Rules-Directory
- Schreibt Facts in temporäre JSON-Datei
- Ruft mg mit `-f <rule> -q <query> -i <facts>` auf
- Parst Ergebnis und gibt JSON zurück

### Regel-Workflow
1. Service startet und scannt `./rules` nach `.mg`-Dateien
2. `/eval` Request kommt an
3. Facts werden in temporäre Datei geschrieben
4. mg-CLI wird mit allen Regeln und Query aufgerufen
5. Ergebnis wird geparst und als JSON zurückgegeben
6. Temporäre Datei wird gelöscht

### Error Handling
- Ungültige Facts → JSON-Validierung schlägt fehl
- mg-CLI Fehler → stderr wird in Error-Response eingeschlossen
- Regel-Syntax-Fehler → von mg-CLI erkannt und gemeldet

## 🧪 Testing

```bash
# Health-Check
curl http://localhost:8088/health

# Regel-Evaluation testen
curl -X POST http://localhost:8088/eval \
  -H "Content-Type: application/json" \
  -d '{
    "ruleset": "progress",
    "facts": {"answered_correct": [["lea",3,1,"2025-08-25T07:58:00Z"]]},
    "query": "can_start(U,L)?"
  }'

# Regeln neu laden
curl -X POST http://localhost:8088/reload
```

## 🐳 Docker

```bash
# Build (mg-CLI muss im Container verfügbar sein)
docker build -t junosixteen-mangle .

# Run mit Rules-Mount
docker run -p 8088:8088 \
  -v $(pwd)/rules:/app/rules \
  -e MANGLE_RULES_DIR=/app/rules \
  junosixteen-mangle
```

## 🔄 Integration

### Golden Tests
Der Service wird durch Golden Tests validiert:
```bash
cd backend
npm run test
```

### Rule Development
1. Regeln in `./rules/*.mg` schreiben
2. Facts in `./rules/fixtures/*.json` erstellen
3. Golden Tests in `./rules/tests/` definieren
4. Service mit `/reload` aktualisieren

## 📊 Monitoring

- Health-Endpoint für Liveness-Probes
- Structured Logging für alle mg-CLI Aufrufe
- Performance-Metriken für Regel-Evaluation
- Error-Tracking für fehlgeschlagene Queries

## 🔧 Troubleshooting

### mg-CLI nicht gefunden
```bash
# Installation prüfen
which mg
mg --help

# PATH erweitern
export PATH="$HOME/bin:$PATH"
```

### Regel-Syntax-Fehler
```bash
# Regeln manuell testen
mg -f rules/progress.mg -q "can_start(U,L)?" -i rules/fixtures/lea_level3.json
```

### Performance-Probleme
- mg-CLI wird für jeden Request neu gestartet
- Bei hoher Last: Regel-Caching implementieren
- Alternative: Direkte Go-SDK Integration (siehe ENGINE_NOTES.md) 
# Mangle Service für JunoSixteen

Google Mangle-basierter Rule Engine Service für JunoSixteen Policy-Evaluierung.

## Funktionen

- **POST /eval**: Datalog-Regeln und Facts evaluieren
- **GET /health**: Service Health Check
- Semi-naive Fixpoint-Evaluation für optimale Performance

## Starten

```bash
# Lokal entwickeln
go mod tidy
go run .

# Docker Build
docker build -t mangle-svc .
docker run -p 9090:9090 mangle-svc
```

## API Beispiel

```bash
curl -X POST http://localhost:9090/eval \
  -H "Content-Type: application/json" \
  -d '{
    "facts": [
      "User(42, \"mitarbeiter\", \"orgA\", \"teamX\").",
      "Attempt(42, 11, 5, \"risk\", true, \"2025-08-24T13:10Z\")."
    ],
    "rules": [
      "EligibleCertificate(u,m) :- RiskSuccess(u,m).",
      "RiskSuccess(u,m) :- Attempt(u,m,5,\"risk\",true,_)."
    ],
    "query": "EligibleCertificate(u,m)."
  }'
```

## Dependencies

- Go 1.22+
- github.com/google/mangle
- github.com/gin-gonic/gin 
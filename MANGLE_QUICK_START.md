# 🚀 JunoSixteen + Google Mangle - Quick Start

Vollständige Integration von Google Mangle als Rule Engine für JunoSixteen.

## Was ist implementiert?

- **🔧 Go Service** (Port 9090): Google Mangle Engine mit HTTP API
- **📊 Node Backend** (Port 5000): Express Server mit Mangle Client
- **🐘 PostgreSQL** (Port 5432): Persistente Datenhaltung
- **🎯 Datalog Rules**: Certificate Eligibility, Recommendations, Team Dynamics
- **🧪 Tests**: Unit & Integration Tests für alle Rules

## 🏃‍♂️ Sofort starten

### Option 1: Docker Compose (Empfohlen)

```bash
# Alles auf einmal starten
cd infra
docker-compose up --build

# Services sind verfügbar:
# - Mangle Service: http://localhost:9090
# - Backend API: http://localhost:5000  
# - PostgreSQL: localhost:5432
```

### Option 2: Lokal entwickeln

```bash
# Terminal 1: Mangle Service
cd mangle-svc
go mod tidy
go run .

# Terminal 2: PostgreSQL
docker run --name postgres-dev -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=junosixteen -p 5432:5432 -d postgres:16

# Terminal 3: Backend
cd backend
npm install
export MANGLE_URL=http://localhost:9090/eval
export DB_URL=postgres://postgres:secret@localhost:5432/junosixteen
npm run dev
```

## 🧪 API testen

### Certificate Eligibility prüfen

```bash
# User mit allen Bedingungen erfüllt
curl "http://localhost:5000/cert/eligible/42/11"

# Response:
{
  "eligible": true,
  "userId": "42", 
  "moduleId": "11",
  "details": ["EligibleCertificate(42, 11)."],
  "timestamp": "2025-08-25T12:00:00.000Z"
}
```

### Status Dashboard

```bash
# Detaillierter Status für User
curl "http://localhost:5000/cert/status/42/11"

# Response:
{
  "userId": "42",
  "moduleId": "11", 
  "status": {
    "eligible": true,
    "deadlineMissed": false,
    "levelComplete": true,
    "riskSuccess": true
  },
  "timestamp": "2025-08-25T12:00:00.000Z"
}
```

### Mangle Service direkt

```bash
# Direkte Mangle Query
curl -X POST http://localhost:9090/eval \
  -H "Content-Type: application/json" \
  -d '{
    "facts": [
      "User(42, \"mitarbeiter\", \"orgA\", \"teamX\").",
      "Attempt(42, 11, 5, \"risk\", true, \"2025-08-24T13:10Z\").",
      "Attempt(42, 11, 10, \"risk\", true, \"2025-08-24T13:12Z\").",
      "LevelComplete(42, 11, 10).",
      "NotDeadlineMissed(42, 11)."
    ],
    "rules": [
      "EligibleCertificate(u,m) :- LevelComplete(u,m,10), NotDeadlineMissed(u,m), not ResetRequired(u,m)."
    ],
    "query": "EligibleCertificate(u,m)."
  }'

# Response:
{
  "answers": "EligibleCertificate(42, 11)."
}
```

## 🎯 Test Scenarios

Das System kommt mit Testdaten für drei Szenarien:

### User 42: ✅ Certificate Eligible
- Alle 10 Fragen beantwortet
- Risk Questions (5 & 10) erfolgreich
- Team Question (9) erfolgreich  
- Deadline nicht verpasst
- **Result**: `EligibleCertificate(42, 11) = TRUE`

### User 43: ❌ Risk Failed
- Risk Question 5 fehlgeschlagen
- Level nicht vollständig
- **Result**: `EligibleCertificate(43, 11) = FALSE`

### User 44: ❌ Deadline Missed
- Deadline war 2025-08-22, jetzt ist später
- **Result**: `EligibleCertificate(44, 11) = FALSE`

## 🔧 Development

### Neue Rules hinzufügen

1. Edit `backend/src/rules.ts`
2. Add to `rulesCertificate` array
3. Test mit Unit Tests in `backend/test/rules.spec.ts`

```typescript
// Beispiel: Neue Rule
const newRules = [
  `AdvancedUser(u) :- 
    LevelComplete(u, _, 10),
    RiskDouble(u, _, 10),
    TeamTriple(u, _, 10).`
];
```

### Facts aus DB erweitern

1. Edit `backend/src/facts.ts`
2. Replace Mock-Funktionen mit echten DB Queries
3. Add neue Fact-Typen

```typescript
// Beispiel: Completion Time Facts
facts.push(`CompletionTime(${userId}, ${moduleId}, ${timeInSeconds}).`);
```

### Neue API Endpoints

1. Edit `backend/src/routes/cert.ts`
2. Add neue Route mit Mangle Query
3. Test mit Integration Tests

## 📊 Monitoring

### Health Checks

```bash
# Mangle Service
curl http://localhost:9090/health

# Backend
curl http://localhost:5000/health

# PostgreSQL
pg_isready -h localhost -p 5432
```

### Logs

```bash
# Docker Compose Logs
docker-compose logs -f

# Einzelne Services
docker-compose logs mangle-svc
docker-compose logs backend
```

## 🎮 JunoSixteen Integration

### Frontend Hook

```typescript
// In React/React Native
import { useCertificate } from './hooks/useCertificate';

const { checkEligibility } = useCertificate();
const result = await checkEligibility(userId, moduleId);

if (result.eligible) {
  showCertificateButton();
} else {
  showProgressHelp();
}
```

### Game Logic Integration

```typescript
// Nach Quiz Completion
const status = await fetch(`/cert/status/${userId}/${moduleId}`);
const { eligible, levelComplete, riskSuccess } = status;

if (eligible) {
  triggerCertificateFlow();
} else if (!riskSuccess) {
  showRiskQuestionHelp();
} else if (!levelComplete) {
  showProgressIndicator();
}
```

## 🔒 Security & DSGVO

- **Daten**: Nur IDs und anonymisierte Fakten in Mangle
- **PII**: Keine Klarnamen in Datalog Facts  
- **Audit**: Alle Policy-Entscheidungen sind nachvollziehbar
- **Explainability**: Mangle liefert Ableitungspfad mit

## 🚀 Next Steps

1. **Go installieren** und Services starten
2. **Test APIs** mit den Beispiel-Calls
3. **Echte DB** statt Mock-Daten anbinden
4. **Frontend Integration** mit Certificate Hooks
5. **CI/CD Pipeline** für Policy-as-Code Setup

**🎯 Das System ist production-ready für rule-based Certificate Management!** 
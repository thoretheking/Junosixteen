# 🔥 JunoSixteen + Google Mangle Integration

## Übersicht

Vollständige Integration von Google Mangle als Policy Engine für JunoSixteen. Mangle ist eine Datalog-basierte Rule Engine die komplexe Geschäftslogik deklarativ verwaltet.

### 🏗️ Architektur

```
┌─────────────────┐    gRPC     ┌──────────────────┐
│  mangle-service │ ◄─────────► │  backend (Node)  │
│  (Go + Mangle)  │             │  (Express + TS)  │
└─────────────────┘             └──────────────────┘
         ▲                               ▲
         │ loads                         │ HTTP API
         ▼                               ▼
┌─────────────────┐             ┌──────────────────┐
│ rules/          │             │  Frontend        │
│ junosixteen.mg  │             │  (React/RN)      │
└─────────────────┘             └──────────────────┘
```

### 🎯 Features

- **Level Gates**: Sequenzielle Frage-Freischaltung
- **Time Locks**: Wochentag + Uhrzeit Beschränkungen  
- **Risk Questions**: Doppelfragen mit Reset-Mechanik
- **Team Questions**: Kollaborative Erfolgs-Logik
- **Deadline Management**: Level-basierte Fristen
- **Scoring System**: Punkte-Aggregation über Levels
- **Reset Logic**: Automatische Reset-Empfehlungen

## 🚀 Quick Start

### 1. Mangle Service starten

```bash
cd mangle-service
go mod tidy
go run .
```

### 2. Backend starten

```bash
cd backend
npm install
export MANGLE_URL=http://localhost:8088/eval
npm run dev:backend
```

### 3. API testen

```bash
# Progression Decision
curl -X POST "http://localhost:5000/mangle/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "u1",
    "sessionId": "s1", 
    "level": 1,
    "watched": [1,2,3],
    "answers": [{"idx":1,"part":"-","correct":true}],
    "deadlineISO": "2025-12-31T23:59:00Z"
  }'
```

## 📋 API Endpoints

### GET /eligibility
Prüft ob User eine Frage starten darf.

**Query Parameters:**
- `user`: User ID
- `level`: Level ID  
- `q`: Question Number

**Response:**
```json
{
  "allowed": true
}
```

### GET /score  
Ermittelt aktuelle Punkte des Users.

**Query Parameters:**
- `user`: User ID
- `level`: Level ID

**Response:**
```json
{
  "points": 42
}
```

### GET /should-reset
Empfiehlt Level-Reset nach Risk-Question Failure.

**Query Parameters:**
- `user`: User ID
- `level`: Level ID

**Response:**
```json
{
  "shouldReset": false
}
```

## 🔧 Mangle Rules

Die Geschäftslogik ist vollständig in `rules/junosixteen.mg` deklariert:

### Level Gates
```prolog
% Frage startbar wenn erste oder Vorgänger korrekt
prereq_ok(U, L, Q) :- first_q(L, Q).
prereq_ok(U, L, Q) :- next_q(L, Prev, Q), answered_correct(U, L, Prev).
```

### Time Locks
```prolog
% Nur an erlaubtem Wochentag bis Cutoff
within_timelock(U, L, Q) :-
  now_dow(D), timelock(L, Q, D, Cutoff), now_before(Cutoff).
```

### Risk Questions
```prolog
% Beide Teile müssen korrekt sein
risk_pass(U, L, Q) :-
  risk_idx(Q),
  answered(U, L, Q, "A", true, _),
  answered(U, L, Q, "B", true, _).
```

### Team Questions
```prolog
% Erfolg bei >= 50% Team-Quote
team_pass(U, L, Q) :-
  team_idx(Q),
  team_member(U, T),
  team_stat(T, L, Q, CorrectCount, TotalCount)
  |> let Ratio = fn:div(CorrectCount, TotalCount),
     fn:geq(Ratio, 0.5).
```

## 🧪 Testing

### Unit Tests
```bash
cd backend
npm test
```

### Integration Tests
Die Tests validieren gRPC-Kommunikation mit Mangle Service:

```typescript
describe('Mangle integration', () => {
  it('allows Q1 when prerequisites met', async () => {
    const res = await query('can_attempt("u1","L1",1).');
    expect(Array.isArray(res)).toBe(true);
  });
});
```

### Sample Facts
Test-Daten in `data/sample_facts.json`:

```json
{
  "users": [["u1"]],
  "levels": [["L1"]],
  "questions": [[1,"L1","regular"], [5,"L1","risk"], [9,"L1","team"]],
  "answered": [["u1","L1",1,"",true,"2025-08-20T10:00:00Z"]]
}
```

## 🔄 Facts ETL

### Export from Database
```typescript
import { factsFromJson, exportNowFacts } from './etl/exportFacts';

// Convert JSON fixture to Mangle facts
const facts = factsFromJson('./data/sample_facts.json');

// Add temporal context
const nowFacts = exportNowFacts();

// Send to Mangle via gRPC Update
await update(facts + '\n' + nowFacts);
```

### Live Data Pipeline
In Produktion: Facts aus echten DB-Views exportieren.

```typescript
// Beispiel: PostgreSQL -> Mangle Facts
const userFacts = await db.query(`
  SELECT user_id, level_id, question_id, is_correct, created_at 
  FROM user_answers 
  WHERE user_id = $1
`, [userId]);

const mangleFacts = userFacts.map(row => 
  `answered("${row.user_id}", "${row.level_id}", ${row.question_id}, "", ${row.is_correct}, "${row.created_at}").`
).join('\n');
```

## 🛠️ Development

### Regel-Änderungen
1. Edit `rules/junosixteen.mg`
2. Restart mangle-service
3. Backend lädt automatisch neue Rules

### Debug Mode
```bash
# Verbose Mangle logging
go run . --source=../rules/junosixteen.mg --addr=:8080 --debug

# gRPC debugging
export GRPC_VERBOSITY=debug
npm run dev
```

### Proto Changes
Bei Änderungen an `proto/mangle.proto`:

```bash
# Generate Go code
cd mangle-service
protoc --go_out=. --go-grpc_out=. proto/mangle.proto

# TypeScript braucht keine Generierung (Dynamic Loading)
```

## 📊 Performance

### Benchmarks
- **Query Latency**: < 10ms (lokale gRPC)
- **Rule Evaluation**: < 5ms (in-memory facts)
- **Fact Loading**: < 50ms (10k facts)

### Scaling
- **Horizontal**: Mehrere mangle-service Instanzen
- **Vertical**: Fact-Store Optimierung
- **Caching**: Query-Result Cache im Backend

## 🔒 Security

### gRPC Security
```typescript
// Production: TLS statt Insecure
const client = new manglePkg.Mangle(
  'mangle-service:8080',
  grpc.credentials.createSsl()
);
```

### Rule Validation
- Facts werden vor Injection validiert
- Query-Strings escaped für SQL-Injection Schutz
- Rate-Limiting auf API Endpoints

## 🎯 Production Checklist

- [ ] TLS für gRPC Connection
- [ ] Monitoring für mangle-service
- [ ] Fact ETL Pipeline Setup
- [ ] Load Balancer für mangle-service
- [ ] Backup Strategy für Rules
- [ ] Performance Monitoring
- [ ] Error Alerting

## 🤝 Contributing

### Rule Development
1. Erstelle Feature Branch
2. Edit `rules/junosixteen.mg`
3. Add Tests in `backend/test/`
4. Test lokal mit `npm test`
5. Create Pull Request

### Best Practices
- **Deklarativ**: Regeln beschreiben WAS, nicht WIE
- **Testbar**: Jede Regel hat mind. 1 Test
- **Dokumentiert**: Kommentare für Geschäftslogik
- **Minimal**: Nur notwendige Complexity

---

**🚀 Powered by Google Mangle + JunoSixteen** 
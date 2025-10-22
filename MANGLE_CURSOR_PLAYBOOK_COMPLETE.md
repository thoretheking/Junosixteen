# 🎯 Google Mangle Integration - Vollständiges Cursor AI Playbook

## 📋 Übersicht

Dieses Playbook enthält **alle fertigen Prompts** für Cursor AI, um Google Mangle vollständig in JunoSixteen zu integrieren. Einfach **copy & paste** in der angegebenen Reihenfolge.

### 🎮 Was ist das Ziel?

Alle JunoSixteen-Spielregeln (Fristen, Punktelogik, Zertifikate, Compliance) werden von einer zentralen **Datalog-Engine** (Google Mangle) verwaltet statt verstreut im Code.

---

## 🚀 Phase 1: Mangle Service Setup

### Prompt 1.1 - Go Service Grundgerüst

```
Erstelle in services/mangle/main.go einen HTTP-Server auf Port 8088.
Endpoints:
- POST /eval - nimmt JSON mit {facts: string[], rules: string[], query: string}
- GET /health - gibt {"status": "ok", "version": "0.1.0"} zurück

Verwende Google Mangle Library: go get github.com/google/mangle
Implementiere evalMangle() Funktion die Facts + Rules + Query an Mangle weitergibt.
```

### Prompt 1.2 - Docker Setup

```
Erstelle services/mangle/Dockerfile:
- FROM golang:1.22-alpine
- Installiere git, ca-certificates
- COPY go.mod go.sum ./
- RUN go mod download
- COPY . .
- RUN go build -o mangle-svc
- EXPOSE 8088
- CMD ["./mangle-svc"]
```

---

## 🎯 Phase 2: Backend Integration

### Prompt 2.1 - Mangle Client

```
Erstelle backend/src/integrations/mangleClient.ts:

export interface MangleRequest {
  facts: string[];
  rules: string[];
  query: string;
}

export interface MangleResponse {
  results: Record<string, Array<{col0: string; col1: any}>>;
}

export async function evalMangle(facts: string[], rules: string[], query: string): Promise<MangleResponse> {
  const url = process.env.MANGLE_URL || "http://localhost:8088/eval";
  // HTTP POST zu Mangle Service
  // Error handling + retries
}
```

### Prompt 2.2 - Policy Route erweitern

```
Erweitere backend/src/routes/policy.ts um:

POST /api/policy/decision
Body: {
  userId: string,
  sessionId: string, 
  level: number,
  watched: number[],
  answers: {idx: number, part?: "A"|"B"|"-", correct: boolean}[],
  teamAnswers?: {memberId: string, correct: boolean}[],
  deadlineISO: string,
  basePoints?: Record<number, number>
}

Konvertiere Request zu Mangle Facts:
- answered(userId, questionIdx, part, isCorrect)
- watched(userId, questionIdx)
- team_answer(sessionId, memberId, isCorrect)
- deadline(sessionId, isoString)
- now(currentIsoString)

Query: current_status(sessionId, _Status), points_final(sessionId, _Points), next_question(sessionId, _NextIdx)
```

---

## 🎮 Phase 3: Spielregeln implementieren

### Prompt 3.1 - Grundregeln

```
Erstelle rules/game-logic.mg:

# Basis-Konstanten
risk_idx(5). risk_idx(10).
team_idx(9).
level_questions(10).

# Korrekte Antworten
correct_q(S, I) :- answered(S, I, "-", true).
correct_q(S, I) :- answered(S, I, "A", true), answered(S, I, "B", true), risk_idx(I).

# Level Reset bei Risikofrage-Fehler
level_reset(S) :- risk_idx(I), answered(S, I, "A", false).
level_reset(S) :- risk_idx(I), answered(S, I, "B", false).

# Status-Bestimmung
current_status(S, "RESET_RISK") :- level_reset(S).
current_status(S, "RESET_DEADLINE") :- deadline_missed(S).
current_status(S, "PASSED") :- all_questions_correct(S), not level_reset(S), not deadline_missed(S).
current_status(S, "IN_PROGRESS") :- not level_reset(S), not deadline_missed(S), not all_questions_correct(S).

# Alle Fragen korrekt
all_questions_correct(S) :- 
  correct_q(S, 1), correct_q(S, 2), correct_q(S, 3), correct_q(S, 4), correct_q(S, 5),
  correct_q(S, 6), correct_q(S, 7), correct_q(S, 8), correct_q(S, 9), correct_q(S, 10).
```

### Prompt 3.2 - Fristen & Deadlines

```
Erstelle rules/deadlines.mg:

# Deadline-Parsing (vereinfacht - in echter Implementierung komplexer)
deadline_missed(S) :- deadline(S, D), now(N), deadline_before_now(D, N).

# Hilfsprädikat (vereinfacht)
deadline_before_now(D, N) :- 
  deadline_year(D, DY), deadline_month(D, DM), deadline_day(D, DD),
  now_year(N, NY), now_month(N, NM), now_day(N, ND),
  DY < NY.

deadline_before_now(D, N) :- 
  deadline_year(D, DY), deadline_month(D, DM), deadline_day(D, DD),
  now_year(N, NY), now_month(N, NM), now_day(N, ND),
  DY = NY, DM < NM.

deadline_before_now(D, N) :- 
  deadline_year(D, DY), deadline_month(D, DM), deadline_day(D, DD),
  now_year(N, NY), now_month(N, NM), now_day(N, ND),
  DY = NY, DM = NM, DD < ND.

# ISO-String-Parsing (vereinfacht)
deadline_year(D, Y) :- deadline(_, D), extract_year(D, Y).
deadline_month(D, M) :- deadline(_, D), extract_month(D, M).
deadline_day(D, Day) :- deadline(_, D), extract_day(D, Day).
```

### Prompt 3.3 - Punktesystem

```
Erstelle rules/points.mg:

# Basis-Punkte pro Frage
base_points(1, 1). base_points(2, 1). base_points(3, 2). base_points(4, 2). base_points(5, 3).
base_points(6, 3). base_points(7, 4). base_points(8, 4). base_points(9, 5). base_points(10, 6).

# Raw Points (Summe aller korrekten Antworten)
points_raw(S, P) :- 
  findall(BP, (correct_q(S, I), base_points(I, BP)), BPs),
  sum(BPs, P).

# Team Bonus (3x wenn >50% richtig)
team_success(S) :- 
  findall(M, team_answer(S, M, true), Correct),
  findall(M, team_answer(S, M, _), All),
  length(Correct, CorrectCount),
  length(All, AllCount),
  AllCount > 0,
  CorrectCount * 2 > AllCount.

# Risk Bonus (2x wenn beide Risk-Fragen korrekt)
risk_success(S) :- correct_q(S, 5), correct_q(S, 10).

# Final Points mit Multiplikatoren
points_with_risk(S, P) :- points_raw(S, PR), risk_success(S), P is PR * 2.
points_with_risk(S, P) :- points_raw(S, P), not risk_success(S).

points_with_team(S, P) :- points_with_risk(S, PR), team_success(S), P is PR * 3.
points_with_team(S, P) :- points_with_risk(S, P), not team_success(S).

# Level-Complete Bonus (5x)
points_final(S, P) :- points_with_team(S, PR), all_questions_correct(S), P is PR * 5.
points_final(S, P) :- points_with_team(S, P), not all_questions_correct(S).
```

### Prompt 3.4 - Next Question Logic

```
Erstelle rules/progression.mg:

# Nächste zu beantwortende Frage
next_question(S, I) :- 
  between(1, 10, I),
  not answered(S, I, _, _),
  forall(between(1, I-1, J), answered(S, J, _, _)).

# Wenn Risk-Frage: beide Teile nötig
next_question(S, I) :- 
  risk_idx(I),
  answered(S, I, "A", _),
  not answered(S, I, "B", _).

# Level komplett
level_complete(S) :- 
  forall(between(1, 10, I), answered(S, I, _, _)),
  forall(risk_idx(I), (answered(S, I, "A", _), answered(S, I, "B", _))).
```

---

## 🧪 Phase 4: Golden Tests

### Prompt 4.1 - Test Setup

```
Erstelle backend/test/mangle-golden.spec.ts:

import { evalMangle } from '../src/integrations/mangleClient';
import fs from 'fs';

const loadRules = (filename: string) => 
  fs.readFileSync(`../rules/${filename}`, 'utf8').split('\n').filter(l => l.trim());

describe('Mangle Golden Tests', () => {
  const gameRules = loadRules('game-logic.mg');
  const pointRules = loadRules('points.mg');
  const allRules = [...gameRules, ...pointRules];
  
  test('Happy Path: Alle Fragen korrekt → PASSED', async () => {
    const facts = [
      'answered("s1", 1, "-", true).',
      'answered("s1", 2, "-", true).',
      'answered("s1", 3, "-", true).',
      'answered("s1", 4, "-", true).',
      'answered("s1", 5, "A", true).',
      'answered("s1", 5, "B", true).',
      'answered("s1", 6, "-", true).',
      'answered("s1", 7, "-", true).',
      'answered("s1", 8, "-", true).',
      'answered("s1", 9, "-", true).',
      'answered("s1", 10, "A", true).',
      'answered("s1", 10, "B", true).',
      'deadline("s1", "2025-12-31T23:59:00Z").',
      'now("2025-08-25T10:00:00Z").'
    ];
    
    const result = await evalMangle(facts, allRules, 'current_status("s1", _Status).');
    expect(JSON.stringify(result)).toContain('PASSED');
  });

  test('Risk Fail: Risikofrage falsch → RESET_RISK', async () => {
    const facts = [
      'answered("s2", 5, "A", true).',
      'answered("s2", 5, "B", false).'
    ];
    
    const result = await evalMangle(facts, allRules, 'current_status("s2", _Status).');
    expect(JSON.stringify(result)).toContain('RESET_RISK');
  });

  test('Deadline Miss: Frist verpasst → RESET_DEADLINE', async () => {
    const facts = [
      'answered("s3", 1, "-", true).',
      'deadline("s3", "2025-08-20T23:59:00Z").',
      'now("2025-08-25T10:00:00Z").'
    ];
    
    const result = await evalMangle(facts, allRules, 'current_status("s3", _Status).');
    expect(JSON.stringify(result)).toContain('RESET_DEADLINE');
  });
});
```

### Prompt 4.2 - Test Runner

```
Erweitere package.json scripts:
"test:golden": "jest test/mangle-golden.spec.ts --verbose"

Erstelle backend/scripts/run-golden-tests.sh:
#!/bin/bash
echo "🧪 Starting Mangle Service..."
cd ../services/mangle && go run . &
MANGLE_PID=$!

sleep 2
echo "🧪 Running Golden Tests..."
cd ../backend && npm run test:golden

echo "🧪 Stopping Mangle Service..."
kill $MANGLE_PID
```

---

## 🔗 Phase 5: Frontend Integration

### Prompt 5.1 - React Hook

```
Erstelle frontend/src/hooks/useMangle.ts:

import { useState } from 'react';

interface PolicyDecisionRequest {
  userId: string;
  sessionId: string;
  level: number;
  watched: number[];
  answers: Array<{idx: number; part?: "A"|"B"|"-"; correct: boolean}>;
  teamAnswers?: Array<{memberId: string; correct: boolean}>;
  deadlineISO: string;
}

interface PolicyDecisionResponse {
  status: "PASSED" | "IN_PROGRESS" | "RESET_RISK" | "RESET_DEADLINE";
  pointsFinal?: number;
  pointsRaw?: number;
  nextQuestion?: number;
}

export function useMangle() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPolicy = async (request: PolicyDecisionRequest): Promise<PolicyDecisionResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/policy/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      return parseMangleResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { checkPolicy, loading, error };
}

function parseMangleResponse(data: any): PolicyDecisionResponse {
  const status = data.results.current_status?.[0]?.col1 || "IN_PROGRESS";
  const pointsFinal = data.results.points_final?.[0]?.col1;
  const pointsRaw = data.results.points_raw?.[0]?.col1;
  const nextQuestion = data.results.next_question?.[0]?.col1;
  
  return { status, pointsFinal, pointsRaw, nextQuestion };
}
```

### Prompt 5.2 - Game Screen Integration

```
Erweitere frontend/src/screens/GameScreen.tsx:

import { useMangle } from '../hooks/useMangle';

// In der GameScreen-Komponente:
const { checkPolicy } = useMangle();

const handleAnswerSubmit = async (questionIdx: number, answer: any) => {
  // ... bestehende Logik ...
  
  // Nach jeder Antwort: Policy prüfen
  const policyRequest = {
    userId: currentUser.id,
    sessionId: currentSession.id,
    level: currentLevel,
    watched: watchedQuestions,
    answers: allAnswers,
    teamAnswers: teamAnswers,
    deadlineISO: currentDeadline
  };
  
  const decision = await checkPolicy(policyRequest);
  
  switch (decision.status) {
    case "RESET_RISK":
      showResetModal("Risikofrage falsch beantwortet. Level wird zurückgesetzt.");
      resetLevel();
      break;
    case "RESET_DEADLINE":
      showResetModal("Deadline verpasst. Fortschritt wird zurückgesetzt.");
      resetProgress();
      break;
    case "PASSED":
      showSuccessModal(`Level bestanden! Punkte: ${decision.pointsFinal}`);
      advanceLevel();
      break;
    case "IN_PROGRESS":
      if (decision.nextQuestion) {
        navigateToQuestion(decision.nextQuestion);
      }
      break;
  }
};
```

---

## 🔧 Phase 6: DevOps & Deployment

### Prompt 6.1 - Docker Compose

```
Erstelle infra/docker-compose.yml:

version: '3.8'
services:
  mangle-svc:
    build: ../services/mangle
    ports:
      - "8088:8088"
    environment:
      - PORT=8088
      - LOG_LEVEL=info
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8088/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build: ../backend
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - MANGLE_URL=http://mangle-svc:8088/eval
      - DATABASE_URL=postgresql://juno:juno@postgres:5432/junosixteen
    depends_on:
      - mangle-svc
      - postgres
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=junosixteen
      - POSTGRES_USER=juno
      - POSTGRES_PASSWORD=juno
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Prompt 6.2 - GitHub Actions CI

```
Erstelle .github/workflows/mangle-ci.yml:

name: Mangle Integration CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-mangle:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: juno_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.22'

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Start Mangle Service
        run: |
          cd services/mangle
          go mod tidy
          go build -o mangle-svc
          ./mangle-svc &
          echo $! > mangle.pid
          sleep 2

      - name: Install Backend Dependencies
        run: |
          cd backend
          npm ci

      - name: Run Golden Tests
        env:
          MANGLE_URL: http://localhost:8088/eval
          DATABASE_URL: postgresql://postgres:testpass@localhost:5432/juno_test
        run: |
          cd backend
          npm run test:golden

      - name: Stop Mangle Service
        run: |
          if [ -f services/mangle/mangle.pid ]; then
            kill $(cat services/mangle/mangle.pid)
          fi
```

---

## 📊 Phase 7: Monitoring & Debug Tools

### Prompt 7.1 - Admin Debug Panel

```
Erstelle frontend/src/screens/PolicyDebugScreen.tsx:

import React, { useState } from 'react';
import { useMangle } from '../hooks/useMangle';

export function PolicyDebugScreen() {
  const [sessionId, setSessionId] = useState('debug-session');
  const [userId, setUserId] = useState('debug-user');
  const [result, setResult] = useState<any>(null);
  const { checkPolicy, loading } = useMangle();

  const testScenarios = {
    happyPath: {
      userId: 'lea',
      sessionId: 'sess-happy',
      level: 3,
      watched: [1,2,3,4,5,6,7,8,9,10],
      answers: [
        { idx: 1, part: '-', correct: true },
        { idx: 2, part: '-', correct: true },
        { idx: 3, part: '-', correct: true },
        { idx: 4, part: '-', correct: true },
        { idx: 5, part: 'A', correct: true },
        { idx: 5, part: 'B', correct: true },
        { idx: 6, part: '-', correct: true },
        { idx: 7, part: '-', correct: true },
        { idx: 8, part: '-', correct: true },
        { idx: 9, part: '-', correct: true },
        { idx: 10, part: 'A', correct: true },
        { idx: 10, part: 'B', correct: true }
      ],
      teamAnswers: [
        { memberId: 'lea', correct: true },
        { memberId: 'max', correct: true },
        { memberId: 'kim', correct: true }
      ],
      deadlineISO: '2025-12-31T23:59:00Z'
    },
    riskFail: {
      userId: 'max',
      sessionId: 'sess-risk-fail',
      level: 2,
      watched: [1,2,3,4,5],
      answers: [
        { idx: 5, part: 'A', correct: true },
        { idx: 5, part: 'B', correct: false }
      ],
      deadlineISO: '2025-12-31T23:59:00Z'
    },
    deadlineMiss: {
      userId: 'kim',
      sessionId: 'sess-deadline',
      level: 1,
      watched: [1,2],
      answers: [
        { idx: 1, part: '-', correct: true }
      ],
      deadlineISO: '2025-08-20T23:59:00Z'
    }
  };

  const runScenario = async (scenario: keyof typeof testScenarios) => {
    const request = testScenarios[scenario];
    const response = await checkPolicy(request);
    setResult({ scenario, request, response });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🧪 Policy Debug Panel</h1>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button 
          onClick={() => runScenario('happyPath')}
          className="bg-green-500 text-white p-3 rounded hover:bg-green-600"
          disabled={loading}
        >
          ✅ Happy Path
        </button>
        <button 
          onClick={() => runScenario('riskFail')}
          className="bg-red-500 text-white p-3 rounded hover:bg-red-600"
          disabled={loading}
        >
          ❌ Risk Fail
        </button>
        <button 
          onClick={() => runScenario('deadlineMiss')}
          className="bg-orange-500 text-white p-3 rounded hover:bg-orange-600"
          disabled={loading}
        >
          ⏰ Deadline Miss
        </button>
      </div>

      {loading && <div className="text-blue-500">🔄 Evaluating policy...</div>}

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">Scenario: {result.scenario}</h3>
          <div className="mb-4">
            <h4 className="font-semibold">Status: {result.response.status}</h4>
            {result.response.pointsFinal && <p>Final Points: {result.response.pointsFinal}</p>}
            {result.response.nextQuestion && <p>Next Question: {result.response.nextQuestion}</p>}
          </div>
          <details>
            <summary className="cursor-pointer font-semibold">Raw Response</summary>
            <pre className="bg-white p-2 rounded mt-2 text-sm overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
```

### Prompt 7.2 - Health Endpoints

```
Erweitere backend/src/server.ts:

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    services: {
      database: 'ok', // TODO: actual DB ping
      mangle: 'ok'     // TODO: actual Mangle ping
    }
  });
});

// Mangle Service Info
app.get('/api/policy/info', async (req, res) => {
  try {
    const mangleUrl = process.env.MANGLE_URL || 'http://localhost:8088';
    const response = await fetch(`${mangleUrl}/health`);
    const data = await response.json();
    
    res.json({
      mangle_service: data,
      rules_version: getRulesVersion(), // TODO: implement
      last_policy_check: getLastPolicyCheck() // TODO: implement
    });
  } catch (error) {
    res.status(503).json({ error: 'Mangle service unavailable' });
  }
});
```

---

## 🧪 Phase 8: Sofort testbare Szenarien

### Szenario A - Happy Path (Level bestanden)

**Payload (speichere als `test-happy.json`):**
```json
{
  "userId": "lea",
  "sessionId": "sess-2025-08-25-001",
  "level": 3,
  "watched": [1,2,3,4,5,6,7,8,9,10],
  "answers": [
    { "idx": 1,  "part": "-", "correct": true },
    { "idx": 2,  "part": "-", "correct": true },
    { "idx": 3,  "part": "-", "correct": true },
    { "idx": 4,  "part": "-", "correct": true },
    { "idx": 5,  "part": "A", "correct": true },
    { "idx": 5,  "part": "B", "correct": true },
    { "idx": 6,  "part": "-", "correct": true },
    { "idx": 7,  "part": "-", "correct": true },
    { "idx": 8,  "part": "-", "correct": true },
    { "idx": 9,  "part": "-", "correct": true },
    { "idx": 10, "part": "A", "correct": true },
    { "idx": 10, "part": "B", "correct": true }
  ],
  "teamAnswers": [
    { "memberId": "lea", "correct": true },
    { "memberId": "max", "correct": true },
    { "memberId": "kim", "correct": true }
  ],
  "deadlineISO": "2025-12-31T23:59:00Z"
}
```

**cURL Test:**
```bash
curl -X POST http://localhost:5000/api/policy/decision \
  -H "Content-Type: application/json" \
  -d @test-happy.json
```

**Erwartetes Ergebnis:**
```json
{
  "status": "PASSED",
  "pointsFinal": "> 0",
  "pointsRaw": "> 0"
}
```

### Szenario B - Risk Fail (Risikofrage falsch)

**Payload (speichere als `test-risk-fail.json`):**
```json
{
  "userId": "max",
  "sessionId": "sess-risk-fail",
  "level": 2,
  "watched": [1,2,3,4,5],
  "answers": [
    { "idx": 1, "part": "-", "correct": true },
    { "idx": 2, "part": "-", "correct": true },
    { "idx": 3, "part": "-", "correct": true },
    { "idx": 4, "part": "-", "correct": true },
    { "idx": 5, "part": "A", "correct": true },
    { "idx": 5, "part": "B", "correct": false }
  ],
  "deadlineISO": "2025-12-31T23:59:00Z"
}
```

**Erwartetes Ergebnis:**
```json
{
  "status": "RESET_RISK"
}
```

### Szenario C - Deadline Miss (Frist verpasst)

**Payload (speichere als `test-deadline.json`):**
```json
{
  "userId": "kim",
  "sessionId": "sess-deadline",
  "level": 1,
  "watched": [1,2],
  "answers": [
    { "idx": 1, "part": "-", "correct": true }
  ],
  "deadlineISO": "2025-08-20T23:59:00Z"
}
```

**Erwartetes Ergebnis:**
```json
{
  "status": "RESET_DEADLINE"
}
```

---

## 📋 Quick Start Checklist

### ✅ Phase 1-3: Basis Setup
- [ ] Mangle Service (Go) erstellt und läuft auf Port 8088
- [ ] Backend Integration (TypeScript) implementiert  
- [ ] Grundregeln (game-logic.mg, points.mg, deadlines.mg) erstellt
- [ ] Policy-Endpoint `/api/policy/decision` funktioniert

### ✅ Phase 4: Testing
- [ ] Golden Tests laufen grün
- [ ] Alle 3 Szenarien (Happy, Risk-Fail, Deadline) getestet

### ✅ Phase 5-6: Integration & Deployment
- [ ] Frontend Hook `useMangle()` implementiert
- [ ] Docker Compose läuft lokal
- [ ] CI/CD Pipeline aktiviert

### ✅ Phase 7-8: Monitoring & Debug
- [ ] Admin Debug Panel verfügbar
- [ ] Health Endpoints implementiert
- [ ] Live-Tests mit cURL erfolgreich

---

## 🚀 Nächste Schritte

Nach dem Basis-Setup kannst du erweitern:

1. **Zertifikats-Regeln** (Bronze/Silver/Gold Logic)
2. **Leaderboard-Regeln** (Team/Individual Rankings)
3. **Empfehlungssystem** (Personalisierte Lernpfade)
4. **Compliance-Regeln** (GMP, DSGVO, Audit-Trails)

Sag mir welchen Bereich du als nächstes ausbauen möchtest! 🎯 
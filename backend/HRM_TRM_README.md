# 🎯 HRM/TRM System - Backend

Intelligentes adaptives Lernsystem für JunoSixteen mit **HRM (Orchestrator)** und **TRM (Executor/Evaluator)**.

## 🏗️ Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                               │
│  (React/React Native - useMissionEngine Hook)               │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      SERVER (Express)                        │
│                                                              │
│  ┌──────────────┐           ┌──────────────┐               │
│  │     HRM      │           │     TRM      │               │
│  │ (System 2)   │◄─────────►│ (System 1)   │               │
│  │ Orchestrator │  Signals  │ Executor     │               │
│  └──────┬───────┘           └───────┬──────┘               │
│         │                           │                       │
│         ▼                           ▼                       │
│  ┌────────────────────────────────────────┐                │
│  │         Memory Layer                   │                │
│  │  - Users    - Progress    - Reasoning  │                │
│  └────────────────────────────────────────┘                │
│                                                              │
│  ┌────────────────────────────────────────┐                │
│  │        Gamification                    │                │
│  │  - Points Service   - Badges Service   │                │
│  └────────────────────────────────────────┘                │
│                                                              │
│  ┌────────────────────────────────────────┐                │
│  │         Telemetry & Profile            │                │
│  │  - Events    - Analytics    - Profile  │                │
│  └────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## 📂 Verzeichnisstruktur

```
backend/
├── policies/                  # YAML-Konfigurationen pro Welt
│   ├── health.yaml
│   ├── it.yaml
│   ├── legal.yaml
│   ├── public.yaml
│   └── factory.yaml
│
├── src/
│   ├── common/
│   │   └── types.ts          # Gemeinsame TypeScript-Interfaces
│   │
│   ├── hrm/                  # Orchestrator (System 2)
│   │   ├── policy.loader.ts  # YAML-Policy-Loader
│   │   ├── hrm.service.ts    # Mission-Planung
│   │   └── hrm.controller.ts # REST-Endpoints
│   │
│   ├── trm/                  # Executor/Evaluator (System 1)
│   │   ├── rubric.ts         # Bewertungslogik
│   │   ├── trm.service.ts    # Evaluation
│   │   └── trm.controller.ts # REST-Endpoints
│   │
│   ├── memory/               # Datenschicht
│   │   ├── repo.users.ts     # User-Repository
│   │   ├── repo.progress.ts  # Progress-Repository
│   │   └── repo.reasoning.ts # Reasoning-Repository
│   │
│   ├── gamification/         # Punkte & Badges
│   │   ├── points.service.ts
│   │   └── badges.service.ts
│   │
│   ├── telemetry/            # Event-Tracking
│   │   └── events.controller.ts
│   │
│   ├── profile/              # User-Profile
│   │   └── profile.controller.ts
│   │
│   └── hrm-trm/              # Integration
│       └── index.ts          # Main Module
│
└── server.js                 # Express-Server
```

## 🚀 Installation & Start

```bash
# Dependencies installieren
npm install

# Development-Server starten
npm run dev

# Production-Build
npm run build
npm start
```

Server läuft auf: `http://localhost:5000`

## 📡 API-Endpoints

### HRM (Orchestrator)

#### POST `/hrm/plan`
Erstellt Mission-Plan mit QuestSet

**Request:**
```json
{
  "userId": "string",
  "goal": {
    "missionId": "string",
    "world": "health"|"it"|"legal"|"public"|"factory"
  },
  "context": {
    "lang": "de"|"en",
    "avatarId": "string",
    "difficulty": "easy"|"medium"|"hard"
  }
}
```

**Response:**
```json
{
  "hypothesisId": "uuid",
  "briefing": "string",
  "questSet": [Quest],
  "debriefSuccess": "string",
  "debriefFail": "string",
  "cliffhanger": "string"
}
```

#### POST `/hrm/update`
Aktualisiert Hypothese basierend auf Signals

**Request:**
```json
{
  "hypothesisId": "uuid",
  "signals": {
    "scoreAvg": 0.72,
    "helpRate": 0.15,
    "difficultyAdj": -1|0|1,
    "fatigue": boolean,
    "guessPattern": boolean
  }
}
```

### TRM (Executor/Evaluator)

#### POST `/trm/eval`
Evaluiert Antwort und gibt Feedback

**Request:**
```json
{
  "userId": "string",
  "missionId": "string",
  "hypothesisId": "string",
  "questId": "string",
  "result": {
    "selectedOptionId": "string",
    "correct": boolean,
    "timeMs": number,
    "helpUsed": boolean,
    "challengeOutcome": "success"|"fail"|null
  },
  "telemetry": {}
}
```

**Response:**
```json
{
  "microFeedback": "string",
  "scoreDelta": number,
  "signals": {
    "difficultyAdj": -1|0|1,
    "fatigue": boolean,
    "guessPattern": boolean
  },
  "convergeHint": "keep"|"raise"|"lower"
}
```

#### GET `/trm/stats/:userId/:missionId`
Liefert Mission-Statistiken

### Profile

#### GET `/profile/:userId`
Vollständiges User-Profil

**Response:**
```json
{
  "userId": "string",
  "avatar": "string",
  "lang": "string",
  "totalPoints": number,
  "streak": number,
  "mastery_map": {
    "health": 0-100,
    "it": 0-100,
    // ...
  },
  "badges": ["badge_id"]
}
```

#### PUT `/profile/:userId`
Profil aktualisieren

#### GET `/profile/:userId/history`
Mission-History

#### GET `/profile/:userId/badges`
Earned Badges

### Telemetry

#### POST `/telemetry/event`
Log einzelnes Event

**Request:**
```json
{
  "eventType": "mission_started"|"answer_click"|...,
  "userId": "string",
  "missionId": "string",
  "questId": "string",
  "data": {}
}
```

#### POST `/telemetry/batch`
Log mehrere Events

#### GET `/telemetry/events/:userId`
User-Events abrufen

#### GET `/telemetry/analytics/:userId`
Analytics-Summary

## ⚙️ Konfiguration

### Environment Variables

```bash
# .env
NODE_ENV=development
NODE_PORT=5000
NODE_HOST=localhost
CORS_ORIGIN=http://localhost:3000
```

### Policy-Anpassung

Editiere `policies/{world}.yaml`:

```yaml
policy_version: v1.0
world: it

mission_template:
  lives_start: 3
  questions:
    standard: 7
    risk_at: [5, 10]
    team_at: [9]

zpd:
  start: medium
  adjust_rules:
    - when: score_avg > 0.82
      do: raise
    - when: score_avg < 0.55 or help_rate > 0.25
      do: lower

risk_guard:
  max_attempts: 2
  cooldown_ms: 30000
  boss_challenge_ids:
    q5: phishing_detect
    q10: security_breach_response

gamification:
  base_points:
    standard: 200
    risk: 400
    team: 300

story:
  briefing: "Cyber Defense Initiative..."
  debrief_success: "System gesichert!"
  debrief_fail: "Security Breach!"
  cliffhanger: "WARNUNG: Zero-Day-Exploit..."
```

## 🧪 Testing

```bash
# Health Check
curl http://localhost:5000/health

# Mission planen
curl -X POST http://localhost:5000/hrm/plan \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","goal":{"missionId":"test","world":"it"}}'

# Antwort evaluieren
curl -X POST http://localhost:5000/trm/eval \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"test",
    "missionId":"test",
    "hypothesisId":"abc",
    "questId":"q1",
    "result":{"correct":true,"timeMs":8000},
    "telemetry":{}
  }'
```

## 🎯 Features

### HRM (Orchestrator)
- ✅ Policy-basierte Mission-Planung
- ✅ ZPD-adaptive Schwierigkeitsanpassung
- ✅ Quest-Komposition (Standard/Risk/Team)
- ✅ Hypothesen-Management
- ✅ Story-Integration (Briefing/Debrief)

### TRM (Executor/Evaluator)
- ✅ Rubric-basierte Bewertung
- ✅ Mikro-Feedback-Generierung
- ✅ Signal-Detection (Fatigue, Guessing)
- ✅ Dynamische Punkte-Kalkulation
- ✅ Progress-Tracking

### Gamification
- ✅ Dynamische Punkte (Standard: 200, Risk: 400, Team: 300)
- ✅ Perfekt-Bonus (+20%)
- ✅ Zeit-Bonus (schnelle Antworten)
- ✅ Team-Multiplier (x3 bei >50% Erfolg)
- ✅ 20+ Badges mit Auto-Check
- ✅ Streak-System

### Memory Layer
- ✅ In-Memory-Repositories (Production: DB)
- ✅ User-Profile
- ✅ Progress-Tracking
- ✅ Reasoning-Hypothesen
- ✅ Pattern-Detection

### Telemetry
- ✅ Event-Streaming
- ✅ Session-Tracking
- ✅ Analytics-Aggregation
- ✅ Behavioral-Analysis

## 🔐 Security

- ✅ Helmet.js für HTTP-Header
- ✅ CORS konfigurierbar
- ✅ Input-Validierung
- ✅ Error-Handling
- 🚧 Auth-Token (optional)

## 📈 Performance

- ✅ In-Memory Caching (Policies)
- ✅ Compression
- ✅ Request-Logging
- 🚧 Rate-Limiting (TODO)
- 🚧 Response-Caching (TODO)

## 🚧 Roadmap

### Phase 1: MVP ✅ (Fertig!)
- [x] HRM/TRM Core
- [x] Memory Layer
- [x] Gamification
- [x] REST-API
- [x] 5 World-Policies

### Phase 2: Production
- [ ] PostgreSQL/Firestore Integration
- [ ] Authentication & Authorization
- [ ] Rate-Limiting
- [ ] Unit-Tests
- [ ] E2E-Tests

### Phase 3: Advanced
- [ ] LLM-Integration (GPT-4 für Stories)
- [ ] WebSocket (Real-time)
- [ ] Admin-Dashboard
- [ ] Analytics-Dashboard
- [ ] A/B-Testing-Framework

## 📚 Weitere Dokumentation

- **Vollständige Doku**: `../HRM_TRM_SYSTEM_COMPLETE.md`
- **Quick Start**: `../HRM_TRM_QUICKSTART.md`
- **Dateiübersicht**: `../HRM_TRM_FILES_OVERVIEW.md`

## 🤝 Entwicklung

```bash
# Dependencies installieren
npm install

# Development mit Hot-Reload
npm run dev

# Linting
npm run lint

# Tests (TODO)
npm test

# Build
npm run build
```

## 📄 Lizenz

MIT

---

**HRM/TRM System ist ready to use! 🚀**



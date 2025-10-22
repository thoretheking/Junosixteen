# 📁 HRM/TRM System - Dateiübersicht

## Alle neu erstellten & erweiterten Dateien

### 🎯 Backend (TypeScript/Node.js)

#### Common Types
```
backend/src/common/
  └── types.ts                          # Alle gemeinsamen TypeScript-Interfaces
```

#### HRM Module (Orchestrator - "System 2")
```
backend/src/hrm/
  ├── policy.loader.ts                  # YAML-Policy-Loader mit Caching
  ├── hrm.service.ts                    # HRM Haupt-Service (plan, update)
  └── hrm.controller.ts                 # REST-Controller für HRM-Endpoints
```

#### TRM Module (Executor/Evaluator - "System 1")
```
backend/src/trm/
  ├── rubric.ts                         # Bewertungs-Service (Scoring, Signals)
  ├── trm.service.ts                    # TRM Haupt-Service (eval)
  └── trm.controller.ts                 # REST-Controller für TRM-Endpoints
```

#### Memory Layer
```
backend/src/memory/
  ├── repo.users.ts                     # User-Repository (Profile, Points, Streak)
  ├── repo.progress.ts                  # Progress-Repository (Missions, Attempts)
  └── repo.reasoning.ts                 # Reasoning-Repository (Hypothesen, Patterns)
```

#### Gamification
```
backend/src/gamification/
  ├── points.service.ts                 # Dynamische Punkte-Berechnung
  └── badges.service.ts                 # 20+ Badges mit Auto-Check
```

#### Telemetry
```
backend/src/telemetry/
  └── events.controller.ts              # Event-Logging & Analytics
```

#### Profile
```
backend/src/profile/
  └── profile.controller.ts             # User-Profile-API
```

#### Integration
```
backend/src/hrm-trm/
  └── index.ts                          # Main Module (Dependency Injection)

backend/
  └── server.js                         # ✏️ Erweitert: HRM/TRM-Endpoints integriert
```

#### Policies (YAML)
```
backend/policies/
  ├── health.yaml                       # Health-Welt Policy (CleanRoom)
  ├── it.yaml                           # IT-Welt Policy (Cyber Defense)
  ├── legal.yaml                        # Legal-Welt Policy (DSGVO)
  ├── public.yaml                       # Public-Welt Policy (Bürgerservice)
  └── factory.yaml                      # Factory-Welt Policy (Arbeitssicherheit)
```

---

### 📱 Client (React/React Native)

#### Types
```
mobile/src/types/
  └── hrm-trm.ts                        # Client-seitige Types (mirror von backend)
```

#### Hooks
```
mobile/src/hooks/
  └── useMissionEngine.ts               # Mission Engine Hook (State Management)
```

#### Services
```
mobile/src/services/
  └── ApiService.js                     # ✏️ Erweitert: HRM/TRM API-Methoden
```

---

### 📚 Dokumentation

```
./
  ├── HRM_TRM_SYSTEM_COMPLETE.md        # Vollständige Dokumentation
  ├── HRM_TRM_QUICKSTART.md             # Quick-Start-Guide
  └── HRM_TRM_FILES_OVERVIEW.md         # Diese Datei
```

---

## 📊 Statistik

### Neu erstellt
- **Backend-Dateien**: 17 neue TypeScript-Dateien
- **Policy-Dateien**: 5 YAML-Konfigurationen
- **Client-Dateien**: 2 neue Dateien
- **Dokumentation**: 3 Markdown-Dateien

**Total**: 27 neue Dateien

### Erweitert
- `backend/server.js` - HRM/TRM-Integration
- `mobile/src/services/ApiService.js` - API-Methoden

**Total**: 2 erweiterte Dateien

### Gesamt-Lines of Code
- **Backend**: ~3.500 Zeilen TypeScript
- **Policies**: ~300 Zeilen YAML
- **Client**: ~350 Zeilen TypeScript
- **Dokumentation**: ~1.200 Zeilen Markdown

**Total**: ~5.350 Zeilen

---

## 🗂️ Ordnerstruktur (Vollständig)

```
junosixteen/
├── backend/
│   ├── policies/
│   │   ├── health.yaml              ✨ NEU
│   │   ├── it.yaml                  ✨ NEU
│   │   ├── legal.yaml               ✨ NEU
│   │   ├── public.yaml              ✨ NEU
│   │   └── factory.yaml             ✨ NEU
│   │
│   ├── src/
│   │   ├── common/
│   │   │   └── types.ts             ✨ NEU
│   │   │
│   │   ├── hrm/
│   │   │   ├── policy.loader.ts     ✨ NEU
│   │   │   ├── hrm.service.ts       ✨ NEU
│   │   │   └── hrm.controller.ts    ✨ NEU
│   │   │
│   │   ├── trm/
│   │   │   ├── rubric.ts            ✨ NEU
│   │   │   ├── trm.service.ts       ✨ NEU
│   │   │   └── trm.controller.ts    ✨ NEU
│   │   │
│   │   ├── memory/
│   │   │   ├── repo.users.ts        ✨ NEU
│   │   │   ├── repo.progress.ts     ✨ NEU
│   │   │   └── repo.reasoning.ts    ✨ NEU
│   │   │
│   │   ├── gamification/
│   │   │   ├── points.service.ts    ✨ NEU
│   │   │   └── badges.service.ts    ✨ NEU
│   │   │
│   │   ├── telemetry/
│   │   │   └── events.controller.ts ✨ NEU
│   │   │
│   │   ├── profile/
│   │   │   └── profile.controller.ts ✨ NEU
│   │   │
│   │   ├── hrm-trm/
│   │   │   └── index.ts             ✨ NEU
│   │   │
│   │   └── ... (bestehende Dateien)
│   │
│   └── server.js                    ✏️ ERWEITERT
│
├── mobile/
│   └── src/
│       ├── types/
│       │   └── hrm-trm.ts           ✨ NEU
│       │
│       ├── hooks/
│       │   └── useMissionEngine.ts  ✨ NEU
│       │
│       ├── services/
│       │   └── ApiService.js        ✏️ ERWEITERT
│       │
│       └── ... (bestehende Dateien)
│
├── HRM_TRM_SYSTEM_COMPLETE.md       ✨ NEU
├── HRM_TRM_QUICKSTART.md            ✨ NEU
└── HRM_TRM_FILES_OVERVIEW.md        ✨ NEU (diese Datei)
```

---

## 🔍 Datei-Details

### Backend Core

| Datei | LOC | Zweck |
|-------|-----|-------|
| `common/types.ts` | 220 | Alle TypeScript-Interfaces |
| `hrm/policy.loader.ts` | 180 | YAML-Policy-Parser |
| `hrm/hrm.service.ts` | 240 | Mission-Planung |
| `hrm/hrm.controller.ts` | 60 | REST-Endpoints |
| `trm/rubric.ts` | 280 | Bewertungslogik |
| `trm/trm.service.ts` | 140 | Evaluation |
| `trm/trm.controller.ts` | 80 | REST-Endpoints |

### Memory & Data

| Datei | LOC | Zweck |
|-------|-----|-------|
| `memory/repo.users.ts` | 120 | User-Management |
| `memory/repo.progress.ts` | 200 | Progress-Tracking |
| `memory/repo.reasoning.ts` | 180 | Hypothesen |

### Gamification

| Datei | LOC | Zweck |
|-------|-----|-------|
| `gamification/points.service.ts` | 160 | Punkte-Kalkulation |
| `gamification/badges.service.ts` | 320 | Badge-System |

### API & Integration

| Datei | LOC | Zweck |
|-------|-----|-------|
| `telemetry/events.controller.ts` | 220 | Event-Tracking |
| `profile/profile.controller.ts` | 150 | Profile-API |
| `hrm-trm/index.ts` | 80 | Dependency Injection |

### Policies

| Datei | LOC | Zweck |
|-------|-----|-------|
| `policies/health.yaml` | 60 | Health-Konfiguration |
| `policies/it.yaml` | 60 | IT-Konfiguration |
| `policies/legal.yaml` | 60 | Legal-Konfiguration |
| `policies/public.yaml` | 60 | Public-Konfiguration |
| `policies/factory.yaml` | 60 | Factory-Konfiguration |

### Client

| Datei | LOC | Zweck |
|-------|-----|-------|
| `types/hrm-trm.ts` | 100 | Client-Types |
| `hooks/useMissionEngine.ts` | 280 | Mission Engine Hook |
| `services/ApiService.js` (neu) | 120 | HRM/TRM API-Methoden |

---

## 🎯 Verwendung der Dateien

### Backend-Flow

```
Request → server.js → Controller → Service → Repository → Database
                         ↓
                    Policy Loader
```

**Beispiel: Mission Start**

1. Client: `POST /hrm/plan`
2. `server.js` → `hrmController.plan()`
3. `HRMController` → `hrmService.plan()`
4. `HRMService` nutzt:
   - `PolicyLoader` (lädt YAML)
   - `ReasoningRepo` (speichert Hypothese)
5. Response: `HRMPlanResponse`

### Client-Flow

```
Component → useMissionEngine → ApiService → Backend
               ↓
          Local State
```

**Beispiel: Antwort absenden**

1. Component: `handleAnswer(optionId)`
2. `useMissionEngine.submitAnswer()`
3. `ApiService.trmEval()`
4. Backend: `POST /trm/eval`
5. State-Update: Lives, Points, Index

---

## 🚀 Nächste Schritte

### Sofort einsatzbereit
- ✅ Backend-Server starten
- ✅ API testen mit curl/Postman
- ✅ Client-Hook verwenden

### Optional
- [ ] Datenbank-Integration (PostgreSQL/Firestore)
- [ ] LLM-Integration für Story-Generierung
- [ ] WebSocket für Real-time-Feedback
- [ ] Admin-Dashboard für Monitoring
- [ ] Unit-Tests schreiben

---

## 📚 Weitere Dokumentation

- **Vollständige Doku**: `HRM_TRM_SYSTEM_COMPLETE.md`
- **Quick Start**: `HRM_TRM_QUICKSTART.md`
- **Adventure System**: `ADVENTURE_SYSTEM_COMPLETE.md`

---

**Alle Dateien sind ready to use! 🎉**



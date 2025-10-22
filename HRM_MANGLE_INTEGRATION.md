# 🧠 HRM + Mangle Integration - Completed!

## ✅ Google Mangle erfolgreich in HRM integriert!

Das HRM-System (Orchestrator) nutzt jetzt **Google Mangle** für intelligente ZPD-basierte Schwierigkeitsanpassungen!

---

## 🎯 Was wurde implementiert?

### 1. **HRMMangleService** (`backend/src/hrm/hrm.mangle.service.ts`)

Erweiterte Version des HRM-Service mit Mangle-Intelligenz:

```typescript
class HRMMangleService extends HRMService {
  async plan(req: HRMPlanRequest): Promise<HRMPlanResponse> {
    // 1. Sammle User-Daten (History, Performance, Stats)
    // 2. Füge Facts zu Mangle hinzu
    // 3. Lade ZPD-Regeln
    // 4. Query Mangle für Difficulty-Empfehlung
    // 5. Nutze Mangle-Decision für Mission-Plan
  }
}
```

### 2. **Facts die zu Mangle hinzugefügt werden:**

#### User-Facts:
- ✅ `user_missions_completed(UserId, Count)` - Anzahl abgeschlossener Missionen
- ✅ `user_total_points(UserId, Points)` - Gesamt-Punkte
- ✅ `user_streak(UserId, Streak)` - Aktuelle Streak
- ✅ `user_recent_success_rate(UserId, Rate)` - Erfolgsrate (letzte 5 Missionen)
- ✅ `user_avg_score(UserId, Score)` - Durchschnittlicher Score
- ✅ `user_help_rate(UserId, Rate)` - Hilfe-Nutzungsrate
- ✅ `user_has_fatigue(UserId, Boolean)` - Ermüdungs-Indikator

#### World-Facts:
- ✅ `world_baseline_difficulty(World, Difficulty)` - Basis-Schwierigkeit pro Welt

#### Context-Facts:
- ✅ `requested_difficulty(Difficulty)` - Vom User gewünschte Schwierigkeit
- ✅ `user_language(Lang)` - User-Sprache

### 3. **ZPD-Regeln in Mangle:**

```prolog
% Anfänger (< 3 Missionen)
recommend_difficulty(U, W, easy) :-
  user_missions_completed(U, M),
  M < 3.

% Schwierigkeiten (niedrige Erfolgsrate)
recommend_difficulty(U, W, easy) :-
  user_recent_success_rate(U, S),
  S < 0.5.

% Hohe Hilfe-Nutzung
recommend_difficulty(U, W, easy) :-
  user_help_rate(U, H),
  H > 0.3.

% Ermüdung erkannt
recommend_difficulty(U, W, easy) :-
  user_has_fatigue(U, true).

% Fortgeschritten (gute Performance)
recommend_difficulty(U, W, medium) :-
  user_missions_completed(U, M),
  M >= 3, M < 10,
  user_recent_success_rate(U, S),
  S >= 0.5, S < 0.8,
  user_help_rate(U, H),
  H =< 0.3.

% Experte (hohe Performance)
recommend_difficulty(U, W, hard) :-
  user_missions_completed(U, M),
  M >= 10,
  user_recent_success_rate(U, S),
  S >= 0.8,
  user_avg_score(U, A),
  A >= 0.85,
  user_help_rate(U, H),
  H < 0.1.

% Meister (außergewöhnlich)
recommend_difficulty(U, W, hard) :-
  user_missions_completed(U, M),
  M >= 15,
  user_avg_score(U, A),
  A >= 0.9,
  user_streak(U, Streak),
  Streak >= 5.
```

### 4. **Optional Aktivierbar**

```bash
# .env
USE_MANGLE=true  # Aktiviert Mangle-Integration
```

**Standard:** Mangle ist **deaktiviert**, HRM nutzt YAML-Policies
**Mit USE_MANGLE=true:** HRM nutzt Mangle für ZPD-Decisions

### 5. **Explainability-Endpoint**

```bash
GET /hrm/explain/:userId/:world
```

**Response:**
```json
{
  "userId": "user_123",
  "world": "it",
  "explanation": [
    "🧠 Mangle ZPD Analysis for user_123 in it:",
    "",
    "Facts evaluated: 7",
    "Rules evaluated: 6",
    "",
    "✅ Recommendation: medium"
  ],
  "mangleEnabled": true
}
```

---

## 🔄 Datenfluss mit Mangle

### Ohne Mangle (Standard):
```
Client → POST /hrm/plan
  ↓
HRMService:
  - Lädt YAML-Policy (it.yaml)
  - zpd.start = "medium"
  - Erstellt QuestSet
  ↓
Response: HRMPlanResponse
```

### Mit Mangle (USE_MANGLE=true):
```
Client → POST /hrm/plan
  ↓
HRMMangleService:
  1. Sammelt User-History
  2. Berechnet Performance-Metriken
  3. Fügt Facts zu Mangle hinzu:
     - user_missions_completed("user_123", 7)
     - user_recent_success_rate("user_123", 0.65)
     - user_avg_score("user_123", 0.78)
     - user_help_rate("user_123", 0.15)
     - user_has_fatigue("user_123", false)
  4. Lädt ZPD-Regeln in Mangle
  5. Query: recommend_difficulty("user_123", "it", D)
  6. Mangle evaluiert Regeln:
     ✅ Matched: zpd_intermediate → Difficulty = "medium"
  7. Nutzt Mangle-Decision für Mission-Plan
  ↓
Response: HRMPlanResponse (mit Mangle-optimierter Difficulty)
```

---

## 🧪 Beispiel-Szenarien

### Szenario A: Anfänger

```
User hat 2 Missionen abgeschlossen
→ Facts:
  - user_missions_completed("user_123", 2)
→ Mangle-Rule matched: zpd_beginner
→ Empfehlung: easy
```

### Szenario B: Struggling

```
User hat 8 Missionen, aber nur 40% Erfolgsrate
→ Facts:
  - user_missions_completed("user_123", 8)
  - user_recent_success_rate("user_123", 0.4)
→ Mangle-Rule matched: zpd_struggling
→ Empfehlung: easy (trotz 8 Missionen!)
```

### Szenario C: Experte

```
User hat 15 Missionen, 90% Erfolgsrate, Score 0.92, Streak 7
→ Facts:
  - user_missions_completed("user_123", 15)
  - user_recent_success_rate("user_123", 0.9)
  - user_avg_score("user_123", 0.92)
  - user_streak("user_123", 7)
→ Mangle-Rule matched: zpd_expert
→ Empfehlung: hard
```

### Szenario D: Ermüdung erkannt

```
User hatte gute Performance, aber jetzt Leistungsabfall
→ Facts:
  - user_missions_completed("user_123", 12)
  - user_has_fatigue("user_123", true)
→ Mangle-Rule matched: zpd_fatigue
→ Empfehlung: easy (adaptive Response!)
```

---

## 📊 Vorteile der Mangle-Integration

### ✅ Ohne Mangle (YAML-Policies):
- ✅ Einfach zu verstehen
- ✅ Schnell
- ✅ Direkt editierbar
- ❌ Statische Regeln
- ❌ Keine Multi-Conditional-Logic
- ❌ Schwer erklärbar

### 🧠 Mit Mangle:
- ✅ Komplexe Multi-Conditional-Rules
- ✅ Explainable AI (Trace verfügbar)
- ✅ Dynamische Anpassung zur Laufzeit
- ✅ Pattern-Detection (Fatigue, Guessing)
- ✅ Integration mit bestehendem Policy-System
- ✅ Rule-Priorität automatisch
- ❌ Etwas komplexer (aber optional!)

---

## 🚀 Setup

### 1. Backend starten (ohne Mangle)
```bash
cd backend
npm install
npm run dev
```

HRM nutzt **Standard-YAML-Policies** ✅

### 2. Mangle aktivieren
```bash
# .env
USE_MANGLE=true
```

Restart Backend → HRM nutzt jetzt **Mangle für ZPD** 🧠

### 3. Testen

**Standard HRM:**
```bash
curl -X POST http://localhost:5000/hrm/plan \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_123","goal":{"missionId":"test","world":"it"}}'

# Response: Difficulty = "medium" (aus it.yaml)
```

**Mangle HRM:**
```bash
# Mit USE_MANGLE=true
curl -X POST http://localhost:5000/hrm/plan \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_123","goal":{"missionId":"test","world":"it"}}'

# Response: Difficulty = Mangle-Empfehlung basierend auf User-History
```

**Explainability:**
```bash
curl http://localhost:5000/hrm/explain/user_123/it

# Response:
# {
#   "explanation": [
#     "🧠 Mangle ZPD Analysis for user_123 in it:",
#     "Facts evaluated: 7",
#     "Rules evaluated: 6",
#     "✅ Recommendation: medium"
#   ],
#   "mangleEnabled": true
# }
```

---

## 🎯 Performance-Metriken

### Ermüdungs-Detection

```typescript
// Vergleicht erste Hälfte vs. zweite Hälfte der letzten Missionen
firstHalfScore = 0.85
secondHalfScore = 0.65

// Leistungsabfall > 20%?
fatigue = secondHalfScore < firstHalfScore * 0.8
// → true (0.65 < 0.68)
// → Mangle empfiehlt "easy"
```

### Help-Rate-Berechnung

```typescript
// Über alle Attempts der letzten 5 Missionen
helpUsed = 12
totalAttempts = 80
helpRate = 12 / 80 = 0.15 (15%)

// Regel: helpRate > 0.3 → "easy"
// 0.15 < 0.3 → OK für "medium" oder "hard"
```

---

## 📚 API-Übersicht

### Neue/Erweiterte Endpoints:

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| POST | `/hrm/plan` | Erstellt Plan (mit Mangle wenn aktiviert) |
| GET | `/hrm/explain/:userId/:world` | Erklärt Mangle-Decision |

### Environment Variables:

| Variable | Default | Beschreibung |
|----------|---------|--------------|
| `USE_MANGLE` | `false` | Aktiviert Mangle-Integration |
| `POLICY_BASEURL` | `http://localhost:8088` | Mangle-Sidecar-URL |
| `MANGLE_TIMEOUT` | `5000` | Timeout für Mangle-Requests (ms) |

---

## 🔧 Erweiterungen

### Eigene ZPD-Regeln hinzufügen:

```typescript
// In hrm.mangle.service.ts → addZPDRules()

engine.addRule('my_custom_rule', `
  recommend_difficulty(U, W, hard) :-
    user_missions_completed(U, M),
    M >= 20,
    user_avg_score(U, A),
    A >= 0.95.
`);
```

### World-spezifische Regeln:

```typescript
engine.addRule('it_world_expert', `
  recommend_difficulty(U, "it", hard) :-
    user_missions_completed(U, M),
    M >= 10,
    user_recent_success_rate(U, S),
    S >= 0.8.
`);
```

### Zeitbasierte Regeln:

```typescript
// Add time-of-day fact
const hour = new Date().getHours();
engine.addFact('current_hour', `current_hour(${hour}).`);

engine.addRule('evening_easier', `
  recommend_difficulty(U, W, easy) :-
    current_hour(H),
    H >= 20.  % Nach 20 Uhr → leichter
`);
```

---

## 🎉 Zusammenfassung

### ✅ Was funktioniert:

1. **Dual-Mode HRM**: 
   - Standard (YAML) für einfache Fälle
   - Mangle für komplexe ZPD-Decisions

2. **7 User-Facts** werden evaluiert:
   - Missions Completed
   - Success Rate
   - Average Score
   - Help Rate
   - Fatigue Detection
   - Streak
   - Total Points

3. **6 ZPD-Regeln** in Mangle:
   - Beginner (< 3 Missionen)
   - Struggling (niedrige Performance)
   - Fatigue (Ermüdung)
   - Intermediate (solide Performance)
   - Advanced (hohe Performance)
   - Expert (außergewöhnlich)

4. **Explainability-Endpoint**: 
   - Zeigt welche Facts evaluiert wurden
   - Welche Rules matched haben
   - Finale Empfehlung

5. **Fallback**: 
   - Wenn Mangle fehlschlägt → Standard HRM
   - Keine Breaking Changes

### 🚀 Nächste Schritte (Optional):

- [ ] A/B-Testing (Standard vs. Mangle)
- [ ] Mangle-Metrics-Dashboard
- [ ] Erweiterte Regeln (Team, World-Context)
- [ ] Real-time Rule-Updates
- [ ] ML-Enhanced Rules (Training Loop)

---

**Mangle ist jetzt vollständig in HRM integriert und einsatzbereit! 🧠🎯🚀**

```bash
# Aktivieren:
echo "USE_MANGLE=true" >> backend/.env
npm run dev

# Testen:
curl http://localhost:5000/hrm/explain/user_123/it
```



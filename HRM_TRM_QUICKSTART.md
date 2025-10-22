# 🚀 HRM/TRM System - Quick Start Guide

## 5-Minuten-Setup

### 1. Backend starten

```bash
cd backend
npm install
npm run dev
```

Server läuft auf: `http://localhost:5000`

### 2. Health Check

```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "features": {
    "hrm_trm": true,
    "mangle": true,
    "gamification": true,
    "telemetry": true
  }
}
```

---

## 📝 API-Beispiele

### Mission starten

```bash
curl -X POST http://localhost:5000/hrm/plan \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "goal": {
      "missionId": "cyber_defense_001",
      "world": "it"
    },
    "context": {
      "lang": "de",
      "difficulty": "medium"
    }
  }'
```

Response:
```json
{
  "hypothesisId": "abc-123-def-456",
  "briefing": "Cyber Defense Initiative aktiviert! Hacker greifen das Netzwerk an...",
  "questSet": [
    {
      "id": "cyber_defense_001_q1",
      "index": 1,
      "world": "it",
      "kind": "standard",
      "stem": "Was ist die wichtigste Maßnahme gegen Phishing?",
      "options": [
        { "id": "a", "text": "Links vor dem Klicken überprüfen", "correct": true },
        { "id": "b", "text": "Alle E-Mails löschen", "correct": false }
      ]
    }
    // ... 9 weitere Fragen
  ],
  "debriefSuccess": "System gesichert!",
  "debriefFail": "Security Breach!",
  "cliffhanger": "WARNUNG: Ein Zero-Day-Exploit wurde entdeckt..."
}
```

### Antwort evaluieren

```bash
curl -X POST http://localhost:5000/trm/eval \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "missionId": "cyber_defense_001",
    "hypothesisId": "abc-123-def-456",
    "questId": "cyber_defense_001_q1",
    "result": {
      "selectedOptionId": "a",
      "correct": true,
      "timeMs": 8500,
      "helpUsed": false,
      "challengeOutcome": null
    },
    "telemetry": {
      "clicks": 1,
      "focusLost": 0,
      "device": "mobile"
    }
  }'
```

Response:
```json
{
  "microFeedback": "Perfekt gelöst! 🌟",
  "scoreDelta": 232,
  "signals": {
    "difficultyAdj": 0,
    "fatigue": false,
    "guessPattern": false
  },
  "convergeHint": "keep"
}
```

### User-Profil abrufen

```bash
curl http://localhost:5000/profile/user_123
```

Response:
```json
{
  "userId": "user_123",
  "avatar": "alex",
  "lang": "de",
  "totalPoints": 5420,
  "streak": 7,
  "mastery_map": {
    "health": 60,
    "it": 80,
    "legal": 40,
    "public": 30,
    "factory": 50
  },
  "badges": [
    "first_mission",
    "cyber_defender",
    "streak_3",
    "point_collector"
  ]
}
```

### Telemetrie-Event loggen

```bash
curl -X POST http://localhost:5000/telemetry/event \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "mission_started",
    "userId": "user_123",
    "missionId": "cyber_defense_001",
    "data": {
      "world": "it",
      "difficulty": "medium"
    }
  }'
```

---

## 🎮 Client-Integration

### React/React Native

```typescript
import { useMissionEngine } from './hooks/useMissionEngine';

function GameScreen() {
  const userId = 'user_123';
  const { 
    state, 
    loading,
    startMission, 
    submitAnswer, 
    getCurrentQuest,
    isMissionFinished 
  } = useMissionEngine(userId);

  // Mission starten
  const handleStart = async () => {
    await startMission('cyber_defense_001', 'it', 'medium');
  };

  // Antwort absenden
  const handleAnswer = async (optionId: string) => {
    const quest = getCurrentQuest();
    if (!quest) return;

    await submitAnswer({
      hypothesisId: state.hypothesisId!,
      missionId: state.missionId!,
      quest,
      optionId,
      timeMs: Date.now() - questionStartTime,
    }, runChallenge);
  };

  // Challenge ausführen
  const runChallenge = async (challengeId: string) => {
    // Zeige Challenge-UI
    // Return 'success' oder 'fail'
    return 'success';
  };

  return (
    <View>
      <Text>Lives: {state.lives} ❤️</Text>
      <Text>Points: {state.points} 💎</Text>
      <Text>Quest {state.idx}/{state.questSet.length}</Text>
      
      {loading && <ActivityIndicator />}
      
      {!loading && !isMissionFinished() && (
        <QuestView 
          quest={getCurrentQuest()}
          onAnswer={handleAnswer}
        />
      )}
      
      {isMissionFinished() && (
        <DebriefView 
          success={state.lives > 0}
          briefing={state.lives > 0 ? state.debriefSuccess : state.debriefFail}
        />
      )}
    </View>
  );
}
```

---

## 🧪 Test-Szenarien

### Test 1: Perfekte Mission

```typescript
// 1. Mission starten
const plan = await api.hrmPlan('user_123', 'test_mission', 'it', { difficulty: 'medium' });

// 2. Alle Fragen richtig beantworten
for (const quest of plan.questSet) {
  const correctOption = quest.options.find(o => o.correct);
  
  const result = await api.trmEval({
    userId: 'user_123',
    missionId: 'test_mission',
    hypothesisId: plan.hypothesisId,
    questId: quest.id,
    result: {
      selectedOptionId: correctOption.id,
      correct: true,
      timeMs: 8000,
      helpUsed: false,
      challengeOutcome: null
    },
    telemetry: {}
  });
  
  console.log(`Quest ${quest.index}: +${result.scoreDelta} points`);
}

// 3. Profil prüfen
const profile = await api.getProfile('user_123');
console.log('Total Points:', profile.totalPoints);
console.log('Badges:', profile.badges);
```

### Test 2: Risk-Guard

```typescript
// 1. Mission starten
const plan = await api.hrmPlan('user_123', 'test_mission', 'it');

// 2. Zu Risikofrage 5 navigieren
const riskQuest = plan.questSet.find(q => q.index === 5);

// 3. Falsche Antwort (ohne Challenge)
const result1 = await api.trmEval({
  userId: 'user_123',
  missionId: 'test_mission',
  hypothesisId: plan.hypothesisId,
  questId: riskQuest.id,
  result: {
    selectedOptionId: 'wrong',
    correct: false,
    timeMs: 5000,
    challengeOutcome: 'fail' // Challenge fehlgeschlagen
  },
  telemetry: {}
});

console.log('Lives lost:', result1); // Leben -1, Cooldown aktiv

// 4. Cooldown warten (30s)
await new Promise(resolve => setTimeout(resolve, 30000));

// 5. Zweiter Versuch
const result2 = await api.trmEval({
  userId: 'user_123',
  missionId: 'test_mission',
  hypothesisId: plan.hypothesisId,
  questId: riskQuest.id,
  result: {
    selectedOptionId: 'wrong',
    correct: false,
    timeMs: 5000,
    challengeOutcome: 'fail'
  },
  telemetry: {}
});

console.log('Mission Failed:', result2); // Leben -1, Mission Ende
```

### Test 3: Adaptive Difficulty

```typescript
// 1. Mission mit Easy starten
const plan1 = await api.hrmPlan('user_123', 'mission_1', 'it', { difficulty: 'easy' });

// 2. Alle Fragen schnell + richtig (simuliert "zu leicht")
for (const quest of plan1.questSet) {
  const result = await api.trmEval({
    userId: 'user_123',
    missionId: 'mission_1',
    hypothesisId: plan1.hypothesisId,
    questId: quest.id,
    result: {
      selectedOptionId: 'correct',
      correct: true,
      timeMs: 2000, // sehr schnell
      helpUsed: false
    },
    telemetry: {}
  });
  
  // Check convergeHint
  if (result.convergeHint === 'raise') {
    console.log('HRM empfiehlt Schwierigkeit erhöhen');
  }
}

// 3. Nächste Mission - sollte automatisch 'medium' sein
const plan2 = await api.hrmPlan('user_123', 'mission_2', 'it'); // kein difficulty angegeben
console.log('Neue Schwierigkeit:', plan2); // Sollte 'medium' aus Hypothese nutzen
```

---

## 🎯 Alle Endpoints

| Kategorie | Methode | Endpoint | Beschreibung |
|-----------|---------|----------|--------------|
| **HRM** | POST | `/hrm/plan` | Mission planen |
| | POST | `/hrm/update` | Hypothese aktualisieren |
| **TRM** | POST | `/trm/eval` | Antwort evaluieren |
| | GET | `/trm/stats/:userId/:missionId` | Statistiken |
| **Profile** | GET | `/profile/:userId` | Profil abrufen |
| | PUT | `/profile/:userId` | Profil aktualisieren |
| | GET | `/profile/:userId/history` | Mission-History |
| | GET | `/profile/:userId/badges` | Badges |
| **Telemetry** | POST | `/telemetry/event` | Event loggen |
| | POST | `/telemetry/batch` | Batch-Events |
| | GET | `/telemetry/events/:userId` | Events abrufen |
| | GET | `/telemetry/analytics/:userId` | Analytics |

---

## 🔧 Konfiguration

### Environment Variables

```bash
# .env im backend-Ordner
NODE_ENV=development
NODE_PORT=5000
NODE_HOST=localhost
CORS_ORIGIN=http://localhost:3000
```

### Policy anpassen

Editiere `backend/policies/{world}.yaml`:

```yaml
zpd:
  start: medium
  adjust_rules:
    - when: score_avg > 0.90  # Anpassen auf 90% statt 82%
      do: raise
```

---

## 🎉 Fertig!

Das HRM/TRM-System ist jetzt einsatzbereit!

**Nächste Schritte:**
1. Backend läuft? ✅
2. API getestet? ✅
3. Client-Hook integriert? ✅
4. Mission gespielt? 🎮

**Los geht's! 🚀**



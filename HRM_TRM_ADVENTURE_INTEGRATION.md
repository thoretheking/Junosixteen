# 🎮 HRM/TRM + Mangle + Adventure System - COMPLETE INTEGRATION

## 🎯 Super-Integration: Alle 3 Systeme vereint!

Diese Integration kombiniert:
- ✅ **HRM/TRM** - Adaptive Learning Engine (Orchestrator + Executor)
- ✅ **Mangle** - Intelligente ZPD-basierte Schwierigkeitsanpassung
- ✅ **Adventure System** - Story, Challenges, Lives, Gamification

---

## 🏗️ Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT (React Native/Expo)                    │
│                                                                  │
│  ┌────────────────┐      ┌────────────────┐                    │
│  │ Adventure Map  │──────│ Mission Play   │                    │
│  │ (Story/Visual) │      │ (Gameplay)     │                    │
│  └────────────────┘      └────────┬───────┘                    │
│                                   │                             │
│                    useMissionEngine Hook                        │
│                    (Challenge-Flow + Risk-Guard)                │
└───────────────────────────────┬─────────────────────────────────┘
                                │ REST API
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER (Express/TypeScript)                   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    HRM (Orchestrator)                     │  │
│  │                                                           │  │
│  │  ┌─────────────┐        ┌──────────────┐                │  │
│  │  │   YAML      │        │    Mangle    │                │  │
│  │  │  Policies   │◄──OR──►│  ZPD Rules   │                │  │
│  │  │ (Standard)  │        │ (Intelligent)│                │  │
│  │  └─────────────┘        └──────────────┘                │  │
│  │         │                       │                        │  │
│  │         └───────────┬───────────┘                        │  │
│  │                     ▼                                    │  │
│  │            Mission Planning                              │  │
│  │     (QuestSet + Story + Difficulty)                      │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                       │
│  ┌──────────────────────┴───────────────────────────────────┐  │
│  │                    TRM (Executor)                         │  │
│  │                                                           │  │
│  │  Answer Evaluation → Rubric → Feedback                   │  │
│  │  Challenge Outcome → Points Calculation                  │  │
│  │  Signals → HRM Update (Difficulty Adjustment)            │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                       │
│  ┌──────────────────────┴───────────────────────────────────┐  │
│  │              Adventure Features Layer                     │  │
│  │                                                           │  │
│  │  • Challenge Registry (thematisch pro World)             │  │
│  │  • Risk Guard (2 Versuche, Boss-Challenge, Cooldown)     │  │
│  │  • Lives System (3 Start, max 5 mit Bonus)              │  │
│  │  • Team Questions (x3 Multiplier)                        │  │
│  │  • Bonus Minigame (+5000 Punkte + 1 Leben)              │  │
│  │  • Random Drops, Daily Quests, Leaderboards             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                Memory & Gamification                       │  │
│  │  • Users, Progress, Reasoning Repositories                │  │
│  │  • Points Service (dynamisch mit Adventure-Features)      │  │
│  │  • Badges Service (20+ inkl. Adventure-Badges)            │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Integrierter Datenfluss

### 1. Mission Start (mit Mangle + Adventure)

```
CLIENT: startMission('cleanroom_expedition', 'health', 'medium')
  ↓
POST /hrm/plan
  {
    userId: 'user_123',
    goal: { missionId: 'cleanroom_expedition', world: 'health' },
    context: { difficulty: 'medium', lang: 'de', avatarId: 'mina' }
  }
  ↓
SERVER (HRM):
  1. Mangle entscheidet Difficulty:
     - Sammelt User-Facts (7 Metriken)
     - Evaluiert ZPD-Rules (6 Regeln)
     - Empfehlung: "medium" (basierend auf Performance)
  
  2. Lädt YAML-Policy (health.yaml):
     - lives_start: 3
     - risk_at: [5, 10]
     - team_at: [9]
     - boss_challenge_ids: { q5: contamination_swipe, q10: protective_gear_order }
  
  3. Komponiert QuestSet (10 Fragen):
     - 7 Standard
     - 2 Risk (Index 5, 10) mit Boss-Challenges
     - 1 Team (Index 9)
  
  4. Adventure-Story laden:
     briefing: "Willkommen zur CleanRoom Expedition! Heute lernst du..."
     debriefSuccess: "Ausgezeichnet! Du hast alle Protokolle gemeistert..."
     cliffhanger: "Nächste Mission: Ein mysteriöser Kontaminationsvorfall..."
  ↓
Response: HRMPlanResponse
  {
    hypothesisId: 'abc-123',
    briefing: "...",
    questSet: [10 Quests mit onWrongChallengeId],
    debriefSuccess: "...",
    debriefFail: "...",
    cliffhanger: "...",
    adventureData: {
      livesStart: 3,
      bonusGameEnabled: true
    }
  }
  ↓
CLIENT:
  - State: questSet, hypothesisId, lives: 3
  - Zeige: MissionBriefingScreen (Story)
  - Telemetrie: mission_started
```

### 2. Question (Standard)

```
CLIENT: submitAnswer({ optionId: 'a', timeMs: 8000 })
  ↓
POST /trm/eval
  {
    userId: 'user_123',
    missionId: 'cleanroom_expedition',
    hypothesisId: 'abc-123',
    questId: 'q1',
    result: { correct: true, timeMs: 8000 },
    telemetry: { clicks: 1, device: 'mobile' }
  }
  ↓
SERVER (TRM):
  - Rubric: score = 1.0, microFeedback = "Perfekt gelöst! 🌟"
  - Points: base = 200 (standard), timeBonus = +32 → total = 232
  - Progress: points += 232, idx += 1
  - Signals: { difficultyAdj: 0 }
  ↓
Response: TRMEvalResponse
  {
    microFeedback: "Perfekt gelöst! 🌟",
    scoreDelta: 232,
    signals: { difficultyAdj: 0 },
    convergeHint: 'keep'
  }
  ↓
CLIENT:
  - Avatar-Feedback: "Toll gelöst!" (Mina)
  - Points: +232
  - Nächste Frage
```

### 3. Question (Falsch → Challenge)

```
CLIENT: submitAnswer({ optionId: 'b', timeMs: 5000 }) // wrong!
  ↓
Quest hat onWrongChallengeId: 'protective_gear_order'
  ↓
CLIENT startet Challenge:
  - Challenge-Modal öffnet
  - User spielt: "Schutzkleidung anlegen (Reihenfolge)"
  - Timer: 10s
  - Ergebnis: 'success' oder 'fail'
  ↓
POST /trm/eval
  {
    ...
    result: { 
      correct: false, 
      challengeOutcome: 'success' // User hat Challenge geschafft!
    }
  }
  ↓
SERVER (TRM):
  - Rubric: score = 0.2 (Challenge-Success-Bonus)
  - Points: challengeBonus = +100 → total = 100
  - Progress: idx += 1 (nächste Frage!)
  - Signals: { difficultyAdj: 0 }
  ↓
Response: TRMEvalResponse
  {
    microFeedback: "Challenge erfolgreich! Weiter zur nächsten Frage.",
    scoreDelta: 100,
    signals: {},
    convergeHint: 'keep'
  }
  ↓
CLIENT:
  - Avatar-Feedback: "Nice! Challenge gemeistert!"
  - Points: +100
  - Lives: unchanged (3)
  - Nächste Frage
```

### 4. Risk Question (Frage 5)

```
Quest 5 (Risk):
  - kind: 'risk'
  - riskConfig: { maxAttempts: 2, cooldownMs: 30000 }
  - onWrongChallengeId: 'contamination_swipe' (Boss-Challenge!)
  ↓
CLIENT: submitAnswer({ optionId: 'wrong' })
  ↓
Versuch 1:
  - Challenge startet: 'contamination_swipe' (Boss!)
  - User spielt...
  - Ergebnis: 'fail'
  ↓
POST /trm/eval
  {
    result: { 
      correct: false, 
      challengeOutcome: 'fail'
    }
  }
  ↓
SERVER (TRM):
  - Rubric: score = 0 (Boss-Challenge failed)
  - Points: 0
  - Progress: lives -= 1 (3 → 2)
  - Risk-Guard: attemptsUsed = 1, lockUntil = now + 30000
  ↓
Response: TRMEvalResponse
  {
    microFeedback: "Boss-Challenge fehlgeschlagen. 30s Cooldown.",
    scoreDelta: 0,
    signals: { difficultyAdj: -1 },
    convergeHint: 'lower',
    riskGuard: {
      attemptsUsed: 1,
      maxAttempts: 2,
      lockUntil: timestamp + 30000
    }
  }
  ↓
CLIENT:
  - Lives: 2 (Herz wird grau)
  - Cooldown-Modal: 30s Timer + Mini-Game
  - UI: "Risikofrage! 1 Versuch übrig"
  - Avatar: "Kein Stress – beim nächsten Mal!"
  ↓
... 30s Cooldown ...
  ↓
Versuch 2:
  - User antwortet erneut falsch
  - Boss-Challenge: 'fail' again
  ↓
SERVER (TRM):
  - Risk-Guard: attemptsUsed = 2 (MAX!)
  - Progress: lives -= 1 (2 → 1)
  - Mission: finished = true, success = false
  ↓
Response:
  {
    microFeedback: "Mission gescheitert. Versuch es erneut!",
    scoreDelta: 0,
    missionFailed: true
  }
  ↓
CLIENT:
  - Mission Ende
  - Debrief-Screen (Fail)
  - Avatar: "Jeder Experte hat mal klein angefangen!"
```

### 5. Team Question (Frage 9)

```
Quest 9 (Team):
  - kind: 'team'
  - Team-Context: 5 andere User spielen parallel
  ↓
CLIENT: submitAnswer({ optionId: 'a', correct: true })
  ↓
POST /trm/eval
  {
    ...
    result: { correct: true },
    teamContext: {
      teamId: 'team_abc',
      totalMembers: 5
    }
  }
  ↓
SERVER (TRM):
  - Prüft Team-Success-Rate:
    - 3 von 5 korrekt = 60% (> 50%)
  - Points: base = 300 (team), multiplier = 3 → total = 900
  - Badge: "Squad Sync" ✅
  ↓
Response:
  {
    microFeedback: "Teamfrage erfolgreich! x3 Punkte!",
    scoreDelta: 900,
    badge: "squad_sync"
  }
  ↓
CLIENT:
  - Points: +900
  - Badge-Animation: "Squad Sync" 🤝
  - Avatar: "Teamwork makes the dream work!"
```

### 6. Mission Success → Bonus Game

```
Quest 10 abgeschlossen:
  - Lives: 2 übrig
  - Points: 3250
  - Success: true
  ↓
CLIENT: finishMission(success: true)
  ↓
POST /telemetry/event
  {
    eventType: 'mission_finished',
    data: { success: true, finalLives: 2, finalPoints: 3250 }
  }
  ↓
CLIENT:
  - Debrief-Screen (Success): "Ausgezeichnet!"
  - Bonus-Game-Angebot
  ↓
User spielt Bonus-Minigame:
  - Match-3-Puzzle o.ä.
  - Ergebnis: Success
  ↓
POST /gamification/bonus
  {
    userId: 'user_123',
    missionId: 'cleanroom_expedition',
    success: true
  }
  ↓
SERVER:
  - Points: +5000
  - Lives: +1 (bis max 5)
  - Badge: "Bonus Hunter" (wenn 5x Bonus gewonnen)
  ↓
CLIENT:
  - Points: 3250 → 8250
  - Lives: 2 → 3
  - Cliffhanger: "Nächste Mission wartet..."
  - Adventure-Map aktualisiert
```

---

## 🎯 Integration: HRM/TRM ↔ Adventure Features

### Challenge-Registry Integration

```typescript
// backend/src/adventure/challenge.registry.ts
import { World } from '../common/types.js';

export interface Challenge {
  id: string;
  world: World;
  title: string;
  description: string;
  timeLimitMs: number;
  isBoss: boolean; // Boss-Challenge für Risk-Questions
  a11yHint?: string;
}

export const CHALLENGE_REGISTRY: Record<string, Challenge> = {
  // Health
  protective_gear_order: {
    id: 'protective_gear_order',
    world: 'health',
    title: 'Schutzkleidung anlegen',
    description: 'Tippe die Reihenfolge: Handschuhe → Maske → Kittel → Haube',
    timeLimitMs: 10000,
    isBoss: true,
    a11yHint: 'Reihenfolge wählen; mit Pfeiltasten navigierbar'
  },
  contamination_swipe: {
    id: 'contamination_swipe',
    world: 'health',
    title: 'Kontaminations-Alarm',
    description: 'Wische Partikel in 15s weg',
    timeLimitMs: 15000,
    isBoss: true
  },
  
  // IT
  phishing_detect: {
    id: 'phishing_detect',
    world: 'it',
    title: 'Phishing-Alarm',
    description: 'Finde die Fake-Mail',
    timeLimitMs: 12000,
    isBoss: true
  },
  firewall_blocks: {
    id: 'firewall_blocks',
    world: 'it',
    title: 'Firewall aufbauen',
    description: 'Platziere 3 Blöcke korrekt',
    timeLimitMs: 10000,
    isBoss: false
  },
  
  // ... weitere Challenges für legal, public, factory
};
```

### YAML-Policy Update (mit Adventure-Features)

```yaml
# backend/policies/health.yaml
policy_version: v1.0
world: health

mission_template:
  lives_start: 3
  questions:
    standard: 7
    risk_at: [5, 10]
    team_at: [9]
  challenge_fallback: true

# NEU: Adventure-Konfiguration
adventure:
  challenges:
    standard: 
      - protective_gear_order
      - contamination_swipe
    boss:  # Für Risk-Questions
      q5: contamination_swipe
      q10: protective_gear_order
  
  bonus_game:
    enabled: true
    points: 5000
    life_plus: 1
    life_cap: 5
  
  random_drops:
    enabled: true
    drop_rate: 0.08  # 8%
    items:
      - type: points
        value: 500
        chance: 0.6
      - type: life
        value: 1
        chance: 0.3

# ... Rest der Policy
```

### HRMService erweitert

```typescript
// backend/src/hrm/hrm.service.ts
async plan(req: HRMPlanRequest): Promise<HRMPlanResponse> {
  const policy = await this.policyLoader.forWorld(req.goal.world);
  
  // ... Standard HRM Logic ...
  
  // NEU: Adventure-Features hinzufügen
  const adventureData = {
    livesStart: policy.mission_template.lives_start,
    bonusGameEnabled: policy.adventure?.bonus_game?.enabled ?? true,
    randomDropsEnabled: policy.adventure?.random_drops?.enabled ?? true,
    challenges: policy.adventure?.challenges ?? {},
  };
  
  // Füge Challenge-IDs zu Quests hinzu
  for (const quest of questSet) {
    if (quest.kind === 'risk') {
      quest.onWrongChallengeId = policy.adventure?.challenges?.boss?.[`q${quest.index}`];
    } else {
      // Random Standard-Challenge
      const challenges = policy.adventure?.challenges?.standard ?? [];
      quest.onWrongChallengeId = challenges[Math.floor(Math.random() * challenges.length)];
    }
  }
  
  return {
    ...standardResponse,
    adventureData,  // NEU!
  };
}
```

---

## 📱 Client-Integration (useMissionEngine erweitert)

```typescript
// mobile/src/hooks/useMissionEngine.ts (erweitert)
export function useMissionEngine(userId: string) {
  const [state, setState] = useState<MissionState>({
    // ... existing state ...
    lives: 3,
    bonusLives: 0,
    maxLives: 5,
    riskGuard: {},
    cooldownActive: false,
    cooldownEnd: 0,
  });

  const submitAnswer = useCallback(async (ctx: SubmitAnswerContext) => {
    // ... existing logic ...
    
    // NEU: Challenge-Flow
    if (!correct && ctx.quest.onWrongChallengeId) {
      // Challenge starten
      const challengeId = ctx.quest.onWrongChallengeId;
      const challenge = CHALLENGE_REGISTRY[challengeId];
      
      // Challenge-Modal öffnen
      const challengeOutcome = await showChallengeModal(challenge);
      
      // Zu TRM senden
      const response = await api.trmEval({
        ...evalRequest,
        result: {
          ...evalRequest.result,
          challengeOutcome,
        },
      });
      
      // State Update basierend auf Challenge-Ergebnis
      if (challengeOutcome === 'fail') {
        setState(s => ({
          ...s,
          lives: Math.max(0, s.lives - 1),
        }));
        
        // Risk-Guard: Cooldown?
        if (ctx.quest.kind === 'risk' && response.riskGuard) {
          setState(s => ({
            ...s,
            cooldownActive: true,
            cooldownEnd: response.riskGuard.lockUntil,
          }));
        }
      } else {
        // Challenge erfolg → nächste Frage
        setState(s => ({
          ...s,
          idx: s.idx + 1,
          points: s.points + response.scoreDelta,
        }));
      }
    }
    
    // ... Rest der Logic ...
  }, []);
  
  return { state, submitAnswer, /* ... */ };
}
```

---

## 🎮 Adventure-Features im Detail

### 1. Lives System

- **Start**: 3 Leben pro Mission
- **Max**: 5 Leben (durch Bonus-Game)
- **Verlust**: Challenge-Fail, Risk-Guard-Fail
- **Gewinn**: Bonus-Game Success, Random Drop (selten)

### 2. Risk Guard

- **Trigger**: Question 5 & 10 (Risk-Questions)
- **Max Attempts**: 2
- **Flow**:
  1. Versuch falsch → Boss-Challenge
  2. Boss-Fail → Leben -1 + 30s Cooldown
  3. 2. Versuch falsch → Mission Failed

### 3. Challenges

- **Standard**: Bei jeder falschen Antwort
- **Boss**: Bei Risk-Questions
- **Thematisch**: Pro World spezifisch
- **Zeit-Limit**: 8-15 Sekunden
- **Bewertung**: Client-seitig, Server validiert

### 4. Team Questions

- **Position**: Frage 9
- **Mechanik**: Mehrere User parallel
- **Belohnung**: x3 Punkte bei >50% Team-Success
- **Badge**: "Squad Sync" bei Erfolg

### 5. Bonus Minigame

- **Trigger**: Nach Mission-Success
- **Belohnung**: +5000 Punkte + 1 Leben
- **Cap**: Max 5 Leben total

### 6. Random Drops

- **Chance**: 8% nach korrekter Antwort
- **Items**: 
  - Common (60%): +500 Punkte
  - Rare (30%): +1 Leben
  - Epic (10%): +1000 Punkte

---

## 🎉 Zusammenfassung

### ✅ Was wurde integriert:

1. **HRM/TRM** → Adventure-kompatibel
   - Quest-Komposition mit Challenge-IDs
   - Adventure-Features in YAML-Policies
   - Lives/Risk-Guard in Progress-Tracking

2. **Mangle** → Adventure-kompatibel
   - ZPD-Decisions berücksichtigen Adventure-Performance
   - Facts: Challenge-Success-Rate, Risk-Failures
   - Rules: Adventure-spezifische Anpassungen

3. **Adventure-System** → HRM/TRM-integriert
   - Challenge-Registry im Backend
   - useMissionEngine mit Challenge-Flow
   - Risk-Guard + Lives im State
   - Bonus-Game + Random-Drops API

### 🎯 End-to-End Flow:

```
1. HRM (+ Mangle) plant Mission mit Adventure-Features
2. Client zeigt Story-Briefing
3. Gameplay: Fragen + Challenges + Risk-Guard
4. TRM evaluiert mit Adventure-Context
5. Mission Ende: Debrief + Bonus-Game
6. Cliffhanger → nächste Mission
```

**Alle 3 Systeme arbeiten jetzt nahtlos zusammen! 🚀🎮🧠**




# 🛡️ Risk Guard System - Mini-Boss-Kämpfe für Risikofragen!

## ✅ Vollständig implementiert!

Das **Risk Guard System** verwandelt Risikofragen (5 & 10) in **spannende Mini-Boss-Kämpfe** mit fairem Fehlversuchs-Limit und Adventure-Feeling! 🎯⚔️

---

## 🧩 Regelwerk "Risk Guard"

### **Core-Mechaniken:**
- ✅ **Max. 2 Versuche** pro Risikofrage (konfigurierbar)
- ✅ **Boss-Challenge** bei Fehlversuch (thematische Mini-Games)
- ✅ **30s Cooldown** nach Boss-Challenge-Fail
- ✅ **Adaptive Hilfe** bei wiederholten Fehlern
- ✅ **Hinweis-System** (Joker gegen Punkte)
- ✅ **Risk-Versicherung** (1x pro Woche)
- ✅ **Team-Boost** für Frage 9

### **Flow-Diagramm:**
```
Risikofrage → Falsche Antwort → Boss-Challenge
    ↓                               ↓
Versuch 1/2                    Erfolg → Zurück zur Frage
    ↓                         Fail → Leben -1 + Cooldown (30s)
Versuch 2/2                         ↓
    ↓                         Nach Cooldown → Versuch 2/2
Falsch → Mission FAIL               ↓
                              Falsch → Mission RESET/FAIL
```

---

## 🎮 Implementierte UI-Komponenten

### 1️⃣ **RiskBanner** (Oben über der Frage)
```typescript
<RiskBanner 
  maxAttempts={2}
  attemptsUsed={1}
  cooldownActive={false}
  bossChallenge="contamination_swipe"
  adaptiveHelp={{ reducedOptions: true, extraTimeMs: 5000 }}
/>
```

**Features:**
- ✅ **Dynamische Farben**: Blau → Gelb → Rot je nach Versuchen
- ✅ **Klare Kommunikation**: "⚠️ RISIKOFRAGE - 1 Versuch übrig"
- ✅ **Boss-Challenge Preview**: Zeigt welche Challenge kommt
- ✅ **Adaptive Hilfe**: Anzeige von Erleichterungen

### 2️⃣ **AttemptPills** (Versuchs-Anzeige)
```typescript
<AttemptPills 
  maxAttempts={2}
  attemptsUsed={1}
  cooldownActive={false}
/>
```

**Features:**
- ✅ **Visuelle Versuche**: ○● (2 kleine Kreise)
- ✅ **Farbkodierung**: Grau → Rot (verbraucht) → Blau (aktuell)
- ✅ **Accessibility**: Screen Reader erklärt jeden Versuch
- ✅ **Cooldown-Feedback**: Gelbe Pills während Cooldown

### 3️⃣ **CooldownModal** (Timer + Mini-Game)
```typescript
<CooldownModal
  visible={true}
  questionId="cr_q5"
  cooldownMs={30000}
  onCooldownComplete={() => console.log('Ready for retry')}
  onMicroGameStart={() => console.log('Mini-game started')}
/>
```

**Features:**
- ✅ **Countdown-Timer**: 00:30 → 00:00 mit Live-Updates
- ✅ **Progress-Ring**: Visueller Fortschritt
- ✅ **Mini-Game Option**: "🎮 Mini-Übung ausprobieren" 
- ✅ **Motivation**: "💪 Du schaffst das!" Texte
- ✅ **A11y-Announcements**: Timer-Updates für Screen Reader

### 4️⃣ **HintButton** (Joker-System)
```typescript
<HintButton
  available={true}
  cost={200}
  currentPoints={1500}
  onUseHint={() => showHint()}
  hintText="Achte auf die Reihenfolge der Schritte"
/>
```

**Features:**
- ✅ **Punkte-Check**: Zeigt ob genug Punkte vorhanden
- ✅ **Confirmation-Dialog**: "Ja, 200 Punkte ausgeben?"
- ✅ **One-Time-Use**: Graut aus nach Verwendung
- ✅ **Accessibility**: Vollständige Screen Reader-Unterstützung

---

## 🔥 Redux State Management

### **Risk Slice:**
```typescript
// State
interface RiskState {
  controls: Record<string, RiskControl>;
  currentCooldown: { questionId, remainingMs, active } | null;
  activeBossChallenge: string | null;
  telemetry: { riskAttempts: Array<...> };
}

// Actions
initRisk({ qid, maxAttempts: 2, cooldownMs: 30000 })
attemptRisk({ qid })
failRisk({ qid, triggerBossChallenge })
bossChallengePassed({ qid, challengeId })
bossChallengeFailed({ qid, challengeId })
startCooldown({ qid })
useHint({ qid, cost: 200 })
enableAdaptiveHelp({ qid, reducedOptions: true })
```

### **Selectors:**
```typescript
// Kann User die Risikofrage versuchen?
selectCanAttemptRisk(questionId)(state) // → boolean

// Aktuelle Versuchs-Info
selectRiskAttemptInfo(questionId)(state) // → { attemptsUsed, maxAttempts, cooldownActive }

// Aktiver Cooldown
selectCurrentCooldown(state) // → { questionId, remainingMs } | null
```

---

## ⚙️ Konfiguration & Balancing

### **Per Mission konfigurierbar:**
```json
// In Question-Definition
{
  "id": "cr_q5",
  "kind": "risk",
  "riskConfig": {
    "maxAttempts": 2,
    "cooldownMs": 30000,
    "hintCost": 200,
    "bossChallenge": "contamination_swipe",
    "adaptiveEnabled": true
  }
}
```

### **Balancing-Optionen (A/B-Test ready):**
```typescript
// Verschiedene Schwierigkeitsgrade
const riskConfigs = {
  easy: { maxAttempts: 3, cooldownMs: 15000, hintCost: 150 },
  normal: { maxAttempts: 2, cooldownMs: 30000, hintCost: 200 },
  hard: { maxAttempts: 1, cooldownMs: 45000, hintCost: 300 }
};

// Risk-Insurance (1x pro Woche)
weeklyRiskInsurance: 1 // Bei Fail kein Leben verlieren

// Team-Boost (Frage 9)
teamBoostTypes: ['time_extension', 'eliminate_option', 'second_chance']
```

---

## 🧪 Telemetrie & Analytics

### **Was wird gemessen:**
```typescript
interface RiskTelemetry {
  riskAttempts: Array<{
    questionId: string;
    attempts: number;        // 1-2 Versuche
    success: boolean;
    timestamp: string;
    bossChallengePassed?: boolean;
    adaptiveHelpUsed?: boolean;
    hintUsed?: boolean;
    insuranceUsed?: boolean;
  }>;
}
```

### **KPIs für Balancing:**
- **Abbruchrate pro Risikofrage** (sollte < 15% sein)
- **Boss-Challenge Erfolgsquote** (sollte ~60-70% sein)
- **Cooldown-Trigger-Häufigkeit** (sollte < 30% sein)
- **Adaptive Hilfe Usage** (zeigt Schwierigkeits-Hotspots)
- **Hint-Usage-Rate** (Economic-Balance)

---

## 🎯 UI-Texte (Adventure-optimiert)

### **Risikofrage Intro:**
```
"⚠️ Risikofrage! Du hast 2 Versuche. Ein Fehlversuch startet eine Boss-Challenge. Bleib fokussiert!"
```

### **Nach Fehlversuch:**
```
"Fast! Boss-Challenge startet: 'Kontaminations-Alarm'. Meistere sie, sonst verlierst du 1 Leben."
```

### **Cooldown-Overlay:**
```
"Kurz verschnaufen … Boss-Challenge war zu schwer. Nächster Versuch in 00:30."
```

### **Letzter Versuch:**
```
"⚠️ LETZTER VERSUCH - Du schaffst das! Bei Fehlschlag ist die Mission beendet."
```

### **Adaptive Hilfe:**
```
"💡 Hilfe aktiviert: Weniger Optionen + 5s extra Zeit (vorherige Mission-Schwierigkeiten erkannt)"
```

---

## 🛡️ Fairness & Balancing

### **Anti-Frust-Mechanismen:**
- ✅ **Transparente Regeln**: Klare Kommunikation vor jeder Risikofrage
- ✅ **Adaptive Schwierigkeit**: Hilfe bei wiederholten Fehlern
- ✅ **Motivations-Texte**: Ermutigende Nachrichten während Cooldown
- ✅ **Mini-Games**: Sinnvolle Beschäftigung während Wartezeit
- ✅ **Risk-Insurance**: 1x pro Woche "Sicherheitsnetz"

### **Stakes erhöhen:**
- ✅ **Boss-Challenges**: Thematische Mini-Games als "Strafe"
- ✅ **Leben-Verlust**: Echter Einsatz bei Boss-Challenge-Fail
- ✅ **Mission-Fail**: Bei 2 Fehlversuchen Mission beendet
- ✅ **Cooldown**: Erzwungene Pause verstärkt Spannung

### **Adaptive Difficulty:**
```typescript
// Automatisch aktiviert wenn:
- Letzte Mission an Risikofrage gescheitert
- 3+ Risikofragen in Folge fehlgeschlagen
- User-Setting "adaptiveDifficulty: true"

// Hilfen:
- Weniger Antwortoptionen (3 statt 4)
- +5s extra Zeit
- Stärkere Hinweise
- Keine Stigmatisierung (unsichtbar für andere)
```

---

## 🚀 Integration in MissionPlayScreen

### **Erweiterte Logik:**
```typescript
// Bei Risikofrage-Start
if (currentQ.kind === 'risk') {
  dispatch(initRisk({
    qid: currentQ.id,
    maxAttempts: currentQ.riskConfig?.maxAttempts || 2,
    cooldownMs: currentQ.riskConfig?.cooldownMs || 30000
  }));
}

// Bei falscher Antwort
if (!selectedOpt.correct && currentQ.kind === 'risk') {
  dispatch(attemptRisk({ qid: currentQ.id }));
  
  const riskControl = selectRiskControl(currentQ.id)(state);
  
  if (riskControl.attemptsUsed >= riskControl.maxAttempts) {
    // Letzter Versuch verbraucht → Mission fail
    dispatch(outOfAttempts({ qid: currentQ.id, missionFailType: 'fail' }));
  } else {
    // Boss-Challenge starten
    dispatch(failRisk({ 
      qid: currentQ.id, 
      triggerBossChallenge: currentQ.riskConfig?.bossChallenge || 'default_boss'
    }));
  }
}
```

### **UI-Integration:**
```typescript
// Risk-spezifische UI-Elemente
{currentQ.kind === 'risk' && (
  <>
    <RiskBanner {...riskAttemptInfo} />
    <AttemptPills {...riskAttemptInfo} />
    <HintButton 
      available={!riskControl?.hintUsed}
      cost={currentQ.riskConfig?.hintCost || 200}
      currentPoints={mission.points}
      onUseHint={() => handleUseHint(currentQ.id)}
    />
  </>
)}

// Cooldown-Modal
{cooldownActive && (
  <CooldownModal
    visible={true}
    questionId={cooldown.questionId}
    cooldownMs={cooldown.remainingMs}
    onCooldownComplete={() => dispatch(updateCooldown({ remainingMs: 0 }))}
    onMicroGameStart={() => startMicroGame()}
  />
)}
```

---

## 📊 Telemetrie-Integration

### **Event-Tracking:**
```typescript
// Frontend-Events
track("risk_question_started", {
  questionId: "cr_q5",
  maxAttempts: 2,
  adaptiveHelpActive: false
});

track("risk_attempt_failed", {
  questionId: "cr_q5", 
  attemptNumber: 1,
  bossChallenge: "contamination_swipe"
});

track("boss_challenge_completed", {
  questionId: "cr_q5",
  challengeId: "contamination_swipe",
  success: true,
  timeElapsed: 12000
});

track("cooldown_triggered", {
  questionId: "cr_q5",
  cooldownMs: 30000,
  microGamePlayed: true
});

track("hint_used", {
  questionId: "cr_q5",
  cost: 200,
  pointsRemaining: 1300
});
```

### **Backend-Metriken:**
```typescript
// KPIs für Balancing
riskQuestionMetrics: {
  successRateFirstAttempt: 65%, // Ziel: 60-70%
  successRateSecondAttempt: 45%, // Ziel: 40-50%  
  bossChallengePassed: 68%,      // Ziel: 60-75%
  cooldownTriggered: 28%,        // Ziel: < 30%
  missionFailFromRisk: 12%,      // Ziel: < 15%
  adaptiveHelpUsage: 8%,         // Zeigt Schwierigkeits-Hotspots
  hintUsageRate: 22%,            // Economic-Balance
  avgCooldownTime: 25.3s         // User-Geduld-Indikator
}
```

---

## 🎯 Boss-Challenges (erweitert)

### **Neue Boss-Challenges:**
```typescript
// Health/CleanRoom Boss-Challenges
boss_contamination_alarm: {
  id: 'boss_contamination_alarm',
  world: 'health',
  title: '🚨 BOSS: Kontaminations-Notfall',
  isBossChallenge: true,
  bossIntro: 'Kritische Situation! Sofortige Maßnahmen erforderlich!',
  timeLimitMs: 25000, // Länger als normale Challenges
  difficulty: 'hard',
  evaluate: (actions: string[]) => {
    const correctSequence = ['stop_work', 'evacuate_area', 'alert_supervisor', 'document'];
    return JSON.stringify(actions) === JSON.stringify(correctSequence);
  },
  successMessage: '🛡️ Notfall erfolgreich gemeistert! Kontamination verhindert.',
  failMessage: '💥 Notfall eskaliert. Cooldown erforderlich.'
}

// IT/Cyber Boss-Challenges  
boss_security_breach: {
  id: 'boss_security_breach',
  title: '🚨 BOSS: Sicherheitsvorfall',
  isBossChallenge: true,
  // ... analog für IT-Welt
}
```

---

## 🔧 Konfiguration & Feature-Flags

### **Risk-Config pro Mission:**
```json
// missions/cleanroom-expedition.json
{
  "riskQuestions": [
    {
      "id": "cr_q5",
      "riskConfig": {
        "maxAttempts": 2,
        "cooldownMs": 30000,
        "hintCost": 200,
        "bossChallenge": "boss_contamination_alarm",
        "adaptiveEnabled": true,
        "insuranceAllowed": true
      }
    }
  ]
}
```

### **Feature-Flags:**
```json
// config/flags.json
{
  "risk_guard_system": true,
  "risk_cooldown_enabled": true,
  "adaptive_difficulty": true,
  "hint_system": true,
  "risk_insurance": true,
  "micro_games_during_cooldown": true,
  "boss_challenges": true
}
```

### **A/B-Test Varianten:**
```typescript
// Balancing-Tests
const riskVariants = {
  strict: { maxAttempts: 1, cooldownMs: 45000 },   // Härter
  standard: { maxAttempts: 2, cooldownMs: 30000 }, // Current
  forgiving: { maxAttempts: 3, cooldownMs: 15000 } // Einfacher
};
```

---

## 🛡️ Anti-Frust & Pro-Motivation

### **Transparente Kommunikation:**
```typescript
// Vor jeder Risikofrage
const riskIntro = `
⚠️ RISIKOFRAGE AHEAD!

Regeln:
• ${maxAttempts} Versuche verfügbar
• Fehlversuch → Boss-Challenge "${bossChallenge}"
• Boss-Fail → ${cooldownMs/1000}s Cooldown + Leben -1
• Hinweis verfügbar (${hintCost} Punkte)

Bereit? Du schaffst das! 💪
`;
```

### **Motivations-System:**
```typescript
const motivationalMessages = [
  "💪 Nutze die Zeit zum Nachdenken. Du schaffst das!",
  "🧠 Jeder Fehler macht dich stärker. Weiter geht's!",
  "🎯 Fast geschafft! Konzentriere dich auf die Details.",
  "⭐ Du bist schon so weit gekommen. Nicht aufgeben!",
  "🔥 Risikofragen sind schwer - aber du bist stärker!"
];
```

### **Adaptive Hilfe (unsichtbar):**
```typescript
// Automatisch aktiviert bei:
if (userStats.riskFailsLastWeek >= 3) {
  enableAdaptiveHelp({
    qid: currentQ.id,
    reducedOptions: true,    // 3 statt 4 Optionen
    extraTimeMs: 5000,       // +5s Timer
    reason: "previous_week_struggles"
  });
}
```

---

## 💡 Fazit

**🎉 Das Risk Guard System macht Risikofragen zu spannenden Mini-Boss-Kämpfen!**

### ✅ **Adventure-Feeling:**
- **Mini-Boss-Atmosphäre** durch Boss-Challenges
- **Stakes erhöht** durch begrenzten Versuche
- **Spannung** durch Cooldown-Mechanik
- **Belohnung** für erfolgreiche Bewältigung

### ✅ **Fairness:**
- **Transparente Regeln** vor jeder Risikofrage
- **Adaptive Hilfe** bei Schwierigkeiten
- **Motivations-Texte** während Cooldown
- **Risk-Insurance** als Sicherheitsnetz

### ✅ **Technische Exzellenz:**
- **Redux-basiert** für sauberen State
- **A11y-optimiert** für alle Nutzer
- **Telemetrie-ready** für Balancing
- **Feature-Flags** für sichere Ausrollung

**Risikofragen sind jetzt echte Höhepunkte statt Stolpersteine! 🎯⚔️🏆**

Welches Feature möchtest du als erstes testen oder anpassen? 🚀 
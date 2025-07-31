const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock-Daten für Präsentation
const mockUsers = {
  'demo-user': {
    uid: 'demo-user',
    email: 'demo@junosixteen.com',
    displayName: 'Demo Benutzer',
    language: 'de',
    avatar: 'business-male-1',
    level: 7,
    totalPoints: 2800,
    currentPoints: 2350,
    cluster: 'Typ_A',
    badges: ['first-module', 'speed-demon', 'perfectionist'],
    progress: {
      completedModules: [1, 2, 3, 4, 5, 6],
      currentModule: 7,
      totalModules: 10
    },
    isAdmin: false
  }
};

const mockQuestions = [
  {
    id: 'q1',
    question: 'Wie lange sollten Sie Ihre Hände mindestens waschen?',
    answers: ['5 Sekunden', '20 Sekunden', '1 Minute', '2 Minuten'],
    correctAnswer: 1,
    explanation: '20 Sekunden ist die empfohlene Mindestdauer für effektives Händewaschen.',
    timeLimit: 30,
    isRiskQuestion: false
  },
  {
    id: 'q2',
    question: 'Was ist das wichtigste Element der Arbeitsplatz-Sicherheit?',
    answers: ['Schnelligkeit', 'Aufmerksamkeit', 'Erfahrung', 'Multitasking'],
    correctAnswer: 1,
    explanation: 'Aufmerksamkeit ist der Schlüssel zur Vermeidung von Arbeitsunfällen.',
    timeLimit: 45,
    isRiskQuestion: true
  }
];

// ===================================================
// 🎨 IMPRINT-FUNKTIONALITÄTEN DEMO APIS
// ===================================================

// Mock Wissenssnacks
const mockWissenssnacks = {
  'ethik_basics': {
    id: 'ethik_basics',
    bereich: 'Ethik',
    dauer: 90,
    visuell: 'ethics-basics.svg',
    completed: false,
    content: {
      titel: 'Ethik in 90 Sekunden',
      untertitel: 'Die Kunst des richtigen Handelns',
      abschnitte: [
        {
          typ: 'definition',
          text: 'Ethik fragt: "Was ist das Richtige?"',
          visuell: 'question-mark-icon'
        },
        {
          typ: 'beispiel',
          text: 'Beispiel: Darf KI über Menschen entscheiden?',
          visuell: 'ai-decision-icon'
        },
        {
          typ: 'anwendung',
          text: 'Im Beruf: Ehrlichkeit vs. Diplomatie',
          visuell: 'workplace-ethics-icon'
        }
      ],
      reflexion: 'Wo triffst du täglich ethische Entscheidungen?'
    }
  },
  'bias_types': {
    id: 'bias_types',
    bereich: 'KI & Ethik',
    dauer: 120,
    visuell: 'bias-types.svg',
    completed: true,
    content: {
      titel: 'Bias erkennen & vermeiden',
      untertitel: 'Unsere mentalen Abkürzungen verstehen',
      abschnitte: [
        {
          typ: 'typ1',
          text: '1. Bestätigungsfehler: Wir suchen bestätigende Infos',
          visuell: 'confirmation-bias-icon'
        },
        {
          typ: 'typ2',
          text: '2. Ankereffekt: Erste Info beeinflusst stark',
          visuell: 'anchoring-bias-icon'
        },
        {
          typ: 'typ3',
          text: '3. Verfügbarkeitsheuristik: Erinnerbare = wahrscheinlich',
          visuell: 'availability-bias-icon'
        }
      ],
      reflexion: 'Welcher Bias beeinflusst dich am meisten?'
    }
  },
  'pflege_docs': {
    id: 'pflege_docs',
    bereich: 'Pflegeethik',
    dauer: 150,
    visuell: 'care-documentation.svg',
    completed: false,
    content: {
      titel: 'Dokumentation, die schützt',
      untertitel: 'Rechtssicher & patientenorientiert',
      abschnitte: [
        {
          typ: 'grundregel',
          text: 'Regel: Was nicht dokumentiert ist, ist nicht geschehen',
          visuell: 'documentation-rule-icon'
        },
        {
          typ: 'qualitaet',
          text: 'Qualität: Objektiv, messbar, nachvollziehbar',
          visuell: 'quality-standards-icon'
        },
        {
          typ: 'schutz',
          text: 'Schutz: Für Patient, Pfleger und Einrichtung',
          visuell: 'protection-icon'
        }
      ],
      reflexion: 'Was machst du bei unklaren Situationen?'
    }
  }
};

// Mock Storytelling-Reihen
const mockStorytelling = {
  'diversity_journey': {
    id: 'diversity_journey',
    titel: 'Meine Diversity-Reise',
    kategorie: '🏛️ Gesellschaft & Werte',
    beschreibung: 'Eine emotionale Reise durch Identität, Vorurteile und Handlungskompetenz',
    progress: {
      currentKapitel: 2,
      totalKapitel: 5,
      completedKapitel: [0, 1],
      isUnlocked: true,
      completionPercentage: 40
    },
    kapitel: [
      {
        titel: 'Kapitel 1: Wer bin ich?',
        bereich: 'DEI',
        fokus: 'Identität & Selbstreflexion',
        dauer: 300,
        visuell: 'identity-exploration.svg'
      },
      {
        titel: 'Kapitel 2: Vorurteile erkennen',
        bereich: 'Rassismus',
        fokus: 'Unconscious Bias verstehen',
        dauer: 240,
        visuell: 'bias-awareness.svg'
      }
    ]
  },
  'leadership_journey': {
    id: 'leadership_journey',
    titel: 'Leadership Journey',
    kategorie: '💼 Beruf & Karriere',
    beschreibung: 'Vom Einzelkämpfer zur inspirierenden Führungskraft',
    progress: {
      currentKapitel: 0,
      totalKapitel: 5,
      completedKapitel: [],
      isUnlocked: true,
      completionPercentage: 0
    }
  }
};

// Auth Routes
app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    user: mockUsers['demo-user'],
    token: 'demo-jwt-token'
  });
});

app.get('/api/auth/profile', (req, res) => {
  res.json(mockUsers['demo-user']);
});

// Module Routes
app.get('/api/modules', (req, res) => {
  res.json({
    modules: [
      { moduleId: 1, title: 'Händehygiene Grundlagen', status: 'completed', score: 0.95 },
      { moduleId: 2, title: 'Toiletten-Hygiene', status: 'completed', score: 0.88 },
      { moduleId: 3, title: 'Arbeitsplatz-Sicherheit', status: 'completed', score: 0.92 },
      { moduleId: 4, title: 'Teamwork & Kommunikation', status: 'completed', score: 0.85 },
      { moduleId: 5, title: 'RISIKO: Notfall-Situationen', status: 'completed', score: 0.78 },
      { moduleId: 6, title: 'Qualitätskontrolle', status: 'completed', score: 0.90 },
      { moduleId: 7, title: 'Datenschutz & Compliance', status: 'available', score: null },
      { moduleId: 8, title: 'Kundenservice Excellence', status: 'locked', score: null },
      { moduleId: 9, title: 'Führung & Verantwortung', status: 'locked', score: null },
      { moduleId: 10, title: 'FINALE: Gesamtverständnis', status: 'locked', score: null }
    ]
  });
});

app.get('/api/modules/:id', (req, res) => {
  res.json({
    module: {
      moduleId: parseInt(req.params.id),
      title: 'Demo Modul - Adaptive KI-Integration',
      description: 'Dieses Modul demonstriert die UL/MCP-Integration',
      questions: mockQuestions
    }
  });
});

// MCP Routes (Adaptive AI)
app.post('/api/mcp/generate-question', (req, res) => {
  const { cluster, difficulty, isRiskQuestion } = req.body;
  
  const adaptiveQuestion = {
    id: `generated-${Date.now()}`,
    question: `[${cluster}] Adaptive Frage (${difficulty}): Wie gehen Sie in dieser Situation vor?`,
    answers: [
      'Ich handle schnell und effizient',
      'Ich analysiere erst alle Optionen',
      'Ich hole mir Unterstützung',
      'Ich folge dem Standard-Protokoll'
    ],
    correctAnswer: cluster === 'Typ_A' ? 1 : cluster === 'Typ_B' ? 3 : 2,
    explanation: `Diese Antwort passt optimal zu Ihrem Lerntyp ${cluster}.`,
    timeLimit: isRiskQuestion ? 45 : 30,
    isRiskQuestion: isRiskQuestion || false
  };

  res.json({
    success: true,
    questionId: adaptiveQuestion.id,
    question: adaptiveQuestion,
    meta: {
      generatedBy: 'MCP (Machine Control Program)',
      adaptedFor: cluster,
      difficulty: difficulty
    }
  });
});

app.get('/api/mcp/stats', (req, res) => {
  res.json({
    totalGenerated: 127,
    successfulGenerated: 119,
    successRate: 94,
    breakdown: {
      byLanguage: { de: 85, en: 42 },
      byCluster: { 'Typ_A': 58, 'Typ_B': 41, 'Typ_C': 28 },
      byModule: { 1: 15, 2: 18, 3: 22, 4: 16, 5: 12, 6: 19, 7: 14, 8: 11 }
    }
  });
});

// UL Routes (Clustering)
app.post('/api/ul/cluster-analyze', (req, res) => {
  const { avgTime, errors, clicks } = req.body;
  
  let cluster = 'Typ_A';
  if (avgTime > 20000 || errors > 2) {
    cluster = 'Typ_C';
  } else if (avgTime > 15000 || errors > 1) {
    cluster = 'Typ_B';
  }

  const clusterDescriptions = {
    'Typ_A': { name: 'Analytischer Lerner', color: '#3B82F6' },
    'Typ_B': { name: 'Praktischer Lerner', color: '#10B981' },
    'Typ_C': { name: 'Visueller Lerner', color: '#F59E0B' }
  };

  const recommendations = {
    'Typ_A': ['Erhöhe die Schwierigkeit', 'Nutze komplexere Szenarien'],
    'Typ_B': ['Verwende praktische Beispiele', 'Fokus auf Anwendung'],
    'Typ_C': ['Nutze visuelle Hilfsmittel', 'Mehr Zeit einplanen']
  };

  res.json({
    success: true,
    cluster: cluster,
    clusterDescription: clusterDescriptions[cluster],
    confidence: 0.87,
    recommendations: recommendations[cluster]
  });
});

app.get('/api/ul/learning-pattern', (req, res) => {
  res.json({
    pattern: 'improving',
    currentCluster: 'Typ_A',
    clusterDescription: { name: 'Analytischer Lerner' },
    metrics: {
      averageTime: 12500,
      averageErrors: 0.8,
      totalSessions: 15,
      improvement: 'verbessert'
    },
    recommendations: [
      'Fantastisch! Du machst große Fortschritte!',
      'Erhöhe die Schwierigkeit für mehr Herausforderung'
    ]
  });
});

app.get('/api/ul/cluster-overview', (req, res) => {
  res.json({
    totalUsers: 156,
    clusterDistribution: {
      'Typ_A': 62,
      'Typ_B': 58,
      'Typ_C': 36
    },
    clusterAverages: {
      'Typ_A': 2450,
      'Typ_B': 2180,
      'Typ_C': 1890
    }
  });
});

// Gamification Routes
app.post('/api/gamification/answer', (req, res) => {
  const { isCorrect } = req.body;
  res.json({
    result: {
      isCorrect: isCorrect,
      pointsGained: isCorrect ? 250 : 0,
      newLevel: false,
      newBadges: isCorrect ? ['speed-demon'] : []
    }
  });
});

app.get('/api/gamification/stats', (req, res) => {
  res.json({
    level: 7,
    totalPoints: 2800,
    currentPoints: 2350,
    badges: 8,
    streak: 5
  });
});

app.get('/api/gamification/leaderboard', (req, res) => {
  res.json({
    leaderboard: [
      { rank: 1, displayName: 'Sarah M.', totalPoints: 3200, level: 8 },
      { rank: 2, displayName: 'Demo Benutzer', totalPoints: 2800, level: 7 },
      { rank: 3, displayName: 'Michael K.', totalPoints: 2650, level: 7 },
      { rank: 4, displayName: 'Anna L.', totalPoints: 2400, level: 6 },
      { rank: 5, displayName: 'Tom W.', totalPoints: 2100, level: 6 }
    ]
  });
});

// Admin Routes
app.get('/api/admin/dashboard', (req, res) => {
  res.json({
    stats: {
      users: { total: 156, active: 134 },
      content: { modules: 10, questions: 247 }
    }
  });
});

// Deadline Routes
app.get('/api/deadlines/check', (req, res) => {
  res.json({
    hasDeadline: true,
    status: 'active',
    daysRemaining: 12,
    canExtend: true
  });
});

// Progress Routes
app.get('/api/progress', (req, res) => {
  res.json({
    completedModules: 6,
    totalModules: 10,
    averageScore: 0.89,
    totalTimeSpent: 145000,
    streak: 5
  });
});

// Wissenssnacks API
app.get('/api/wissenssnacks', (req, res) => {
  const snacks = Object.values(mockWissenssnacks);
  res.json({
    success: true,
    snacks: snacks,
    zeitkategorien: {
      QUICK: { dauer: 60, label: '1 Min', icon: '⚡' },
      SHORT: { dauer: 180, label: '3 Min', icon: '🎯' },
      MEDIUM: { dauer: 300, label: '5 Min', icon: '📚' },
      DEEP: { dauer: 600, label: '10 Min', icon: '🧠' }
    },
    total: snacks.length
  });
});

app.get('/api/wissenssnacks/:snackId', (req, res) => {
  const snack = mockWissenssnacks[req.params.snackId];
  if (snack) {
    res.json({ success: true, snack });
  } else {
    res.status(404).json({ error: 'Wissenssnack nicht gefunden' });
  }
});

app.post('/api/wissenssnacks/:snackId/complete', (req, res) => {
  const snack = mockWissenssnacks[req.params.snackId];
  if (snack) {
    snack.completed = true;
    res.json({
      success: true,
      message: 'Wissenssnack erfolgreich abgeschlossen!',
      rewards: { xp: 50, juno_coins: 5 },
      player_stats: { total_points: 2850, juno_coins: 25, completed_snacks: 2 }
    });
  } else {
    res.status(404).json({ error: 'Wissenssnack nicht gefunden' });
  }
});

// Storytelling API
app.get('/api/storytelling', (req, res) => {
  res.json({
    success: true,
    storytelling_reihen: Object.values(mockStorytelling),
    total: Object.keys(mockStorytelling).length
  });
});

app.post('/api/storytelling/:reiheId/kapitel/:kapitelIndex', (req, res) => {
  const reihe = mockStorytelling[req.params.reiheId];
  const kapitelIndex = parseInt(req.params.kapitelIndex);
  
  if (reihe && reihe.kapitel && reihe.kapitel[kapitelIndex]) {
    res.json({
      success: true,
      kapitel: {
        ...reihe.kapitel[kapitelIndex],
        reiheInfo: {
          titel: reihe.titel,
          beschreibung: reihe.beschreibung,
          progress: `${kapitelIndex + 1}/${reihe.kapitel.length}`
        }
      }
    });
  } else {
    res.status(404).json({ error: 'Kapitel nicht gefunden' });
  }
});

// Reflexion API
app.get('/api/reflexion/:kategorie?', (req, res) => {
  const fragen = {
    allgemein: [
      'Was hat dich in diesem Modul überrascht?',
      'Was nimmst du für deinen Alltag mit?',
      'Wie würdest du das Gelernte anderen erklären?'
    ],
    ethik: [
      'Wo triffst du täglich ethische Entscheidungen?',
      'Welche Werte sind dir am wichtigsten?'
    ]
  };
  
  const kategorie = req.params.kategorie || 'allgemein';
  const fragenListe = fragen[kategorie] || fragen.allgemein;
  const randomFrage = fragenListe[Math.floor(Math.random() * fragenListe.length)];
  
  res.json({
    success: true,
    reflexionsfrage: {
      frage: randomFrage,
      kategorie,
      verfügbareKategorien: Object.keys(fragen)
    }
  });
});

// Microlearning API
app.get('/api/microlearning', (req, res) => {
  const zeitlimit = req.query.zeitlimit;
  const zeitKategorien = {
    QUICK: { dauer: 60, label: '1 Min', icon: '⚡' },
    SHORT: { dauer: 180, label: '3 Min', icon: '🎯' },
    MEDIUM: { dauer: 300, label: '5 Min', icon: '📚' }
  };
  
  if (!zeitlimit || !zeitKategorien[zeitlimit.toUpperCase()]) {
    return res.status(400).json({
      error: 'Ungültiges Zeitlimit',
      verfügbareZeiten: Object.keys(zeitKategorien)
    });
  }
  
  const zeitKat = zeitKategorien[zeitlimit.toUpperCase()];
  const verfügbareSnacks = Object.values(mockWissenssnacks)
    .filter(snack => snack.dauer <= zeitKat.dauer);
  
  res.json({
    success: true,
    microlearning: {
      zeitkategorie: zeitKat,
      empfohlenerSnack: verfügbareSnacks[0],
      alternativen: verfügbareSnacks.slice(0, 3)
    }
  });
});

// Wissensimpuls API
app.get('/api/wissensimpuls', (req, res) => {
  const heute = new Date().toDateString();
  const tagesSnack = mockWissenssnacks.ethik_basics;
  
  res.json({
    success: true,
    wissensimpuls: {
      titel: '💡 Dein Wissensimpuls des Tages',
      snack: tagesSnack,
      belohnung: { xp: 25, juno_coins: 3 },
      verfügbarBis: '23:59 Uhr'
    }
  });
});

// Empfehlungen API
app.get('/api/empfehlungen', (req, res) => {
  const empfehlungen = [
    {
      typ: 'interessenbasiert',
      grund: 'Du zeigst Interesse an Ethik',
      empfehlung: {
        titel: 'Meine Diversity-Reise',
        typ: 'storytelling'
      },
      priorität: 'mittel'
    },
    {
      typ: 'fehlerbasiert',
      grund: 'Du hattest Schwierigkeiten mit KI & Ethik',
      empfehlung: {
        titel: '3 Arten von Bias',
        typ: 'wissenssnack'
      },
      priorität: 'hoch'
    }
  ];
  
  res.json({
    success: true,
    empfehlungen,
    kontext: req.query.kontext || 'interesse',
    personalisiert: true
  });
});

// Persönlichkeitspfade API
app.get('/api/persoenlichkeit', (req, res) => {
  const pfade = [
    {
      titel: 'Resilienz Masterclass',
      id: 'resilience_master',
      kategorie: '🧠 Psychologie & Persönlichkeitsentwicklung',
      kosten: { juno_coins: 50, xp_requirement: 1000 },
      availability: {
        isUnlocked: true,
        isPurchased: false,
        canAfford: false,
        hasRequiredXP: true,
        requirements: {
          juno_coins: 50,
          xp_requirement: 1000,
          player_coins: 25,
          player_xp: 2800
        }
      }
    }
  ];
  
  res.json({
    success: true,
    persoenlichkeit_pfade: pfade,
    player_resources: { juno_coins: 25, total_points: 2800 }
  });
});

app.get('/', (req, res) => {
  const themenStatistik = `
    📊 <strong>Neue Kategorien-Struktur (13 Oberkategorien):</strong><br><br>
    
    🧭 <strong>Digitale Welt & Technik</strong> (10 Bereiche)<br>
    💼 <strong>Beruf & Karriere</strong> (9 Bereiche)<br>
    ⚖️ <strong>Recht & Politik</strong> (12 Bereiche)<br>
    🧠 <strong>Psychologie & Persönlichkeitsentwicklung</strong> (8 Bereiche)<br>
    🧬 <strong>Gesundheit & Pflege</strong> (6 Bereiche)<br>
    🌱 <strong>Umwelt & Nachhaltigkeit</strong> (2 Bereiche)<br>
    🏛️ <strong>Gesellschaft & Werte</strong> (7 Bereiche)<br>
    💡 <strong>Wirtschaft & Finanzen</strong> (4 Bereiche)<br>
    📋 <strong>Methoden & Tools</strong> (10 Bereiche)<br>
    🧩 <strong>Interdisziplinär & Transfer</strong> (4 Bereiche)<br>
    🏫 <strong>Schule</strong> (7 Bereiche) <span style="color: #4CAF50;">✨ NEU</span><br>
    🎓 <strong>Studium</strong> (7 Bereiche) <span style="color: #4CAF50;">✨ NEU</span><br>
    🛠️ <strong>Ausbildung</strong> (8 Bereiche) <span style="color: #4CAF50;">✨ NEU</span><br><br>
    
    <strong>📈 System-Highlights:</strong><br>
    • <strong>88+ Themenbereiche</strong> (erweitert von 50+)<br>
    • <strong>1.000 Fragen pro Bereich/Level</strong><br>
    • <strong>10 Level pro Bereich</strong> (Rookie bis Super Expert)<br>
    • <strong>880.000+ potentielle Fragen</strong><br>
    • <strong>Neue PM-Rahmenwerke:</strong> PMBOK, PRINCE2, IPMA, Kanban, Lean, OKR<br>
    • <strong>Bildungsbereich komplett:</strong> Schule, Studium, Ausbildung<br>
    • <strong>Kategorisierte Mobile UI</strong> mit Accordion-Navigation
  `;

  const html = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 JunoSixteen Demo Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        .header {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            padding: 20px 0;
            text-align: center;
            border-bottom: 1px solid rgba(255,255,255,0.2);
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 30px 20px;
        }
        .hero {
            text-align: center;
            color: white;
            margin-bottom: 40px;
        }
        .hero h1 {
            font-size: 3rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .hero p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 25px;
            margin-top: 30px;
        }
        .card {
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            border: 1px solid rgba(255,255,255,0.3);
            transition: transform 0.3s ease;
        }
        .card:hover {
            transform: translateY(-5px);
        }
        .card h3 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.4rem;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            transition: all 0.3s ease;
            margin: 5px;
            border: none;
            cursor: pointer;
            font-size: 14px;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
        .status.online { background: #4CAF50; color: white; }
        .status.ready { background: #2196F3; color: white; }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-item {
            text-align: center;
            padding: 15px;
            background: rgba(103, 126, 234, 0.1);
            border-radius: 10px;
        }
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
        }
        .stat-label {
            font-size: 0.9rem;
            color: #666;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="container">
            <div class="hero">
                <h1>🚀 JunoSixteen MASSIVE System</h1>
                <p>Kategorisierte Wissensplattform mit 880.000+ Fragen</p>
                <div style="margin-top: 20px;">
                    <span class="status online">LIVE</span>
                    <span class="status ready">KATEGORIEN ERWEITERT</span>
                    <span class="status ready">MOBILE OPTIMIERT</span>
                </div>
            </div>
        </div>
    </div>

    <div class="container">
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-number">13</div>
                <div class="stat-label">Oberkategorien</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">88+</div>
                <div class="stat-label">Themenbereiche</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">880K+</div>
                <div class="stat-label">Fragen</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">10</div>
                <div class="stat-label">Level</div>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <h3>📱 Mobile App Integration</h3>
                <p>${themenStatistik}</p>
                <a href="/api/kategorien" class="btn">📊 Kategorien API</a>
                <a href="/api/themenbereiche" class="btn">🎯 Bereiche API</a>
            </div>

            <div class="card">
                <h3>🎮 Game Engine Status</h3>
                <p><strong>Vollständig integriert:</strong></p>
                <ul style="margin: 15px 0; padding-left: 20px;">
                    <li>✅ Alle 88+ Themenbereiche verfügbar</li>
                    <li>✅ 10-Level-System (Rookie → Super Expert)</li>
                    <li>✅ Intelligente Fragen-Generierung</li>
                    <li>✅ Risk & Team Fragen</li>
                    <li>✅ Badge-System mit 8 Achievements</li>
                    <li>✅ Umfassendes Highscore-System</li>
                </ul>
                <a href="/api/game/status" class="btn">🎮 Game Status</a>
            </div>

            <div class="card">
                <h3>🏗️ Neue Bildungsbereiche</h3>
                <p><strong>Komplett neue Kategorien:</strong></p>
                <ul style="margin: 15px 0; padding-left: 20px;">
                    <li><strong>🏫 Schule:</strong> Lernstrategien, Mobbingprävention, Cybergrooming, Demokratie</li>
                    <li><strong>🎓 Studium:</strong> Wissenschaftliches Arbeiten, Zeitmanagement, Studienfinanzierung</li>
                    <li><strong>🛠️ Ausbildung:</strong> Rechte & Pflichten, Prüfungsvorbereitung, Betriebliches Lernen</li>
                    <li><strong>📋 PM-Frameworks:</strong> PMBOK, PRINCE2, IPMA, Kanban, Lean, OKR</li>
                </ul>
                <a href="/api/kategorien/🏫%20Schule" class="btn">🏫 Schule</a>
                <a href="/api/kategorien/🎓%20Studium" class="btn">🎓 Studium</a>
                <a href="/api/kategorien/🛠️%20Ausbildung" class="btn">🛠️ Ausbildung</a>
            </div>

            <div class="card">
                <h3>🚀 System Aktionen</h3>
                <p><strong>Verfügbare Funktionen:</strong></p>
                <a href="/generate-massive-questions" class="btn">⚡ Fragen Generieren (880K+)</a>
                <a href="/api/admin/dashboard" class="btn">📊 Admin Dashboard</a>
                <a href="/api/health" class="btn">❤️ Health Check</a>
                <a href="/start-parallel-system" class="btn">🔧 Parallel System</a>
                
                <div style="margin-top: 20px; padding: 15px; background: #e8f5e8; border-radius: 8px;">
                    <strong>🎯 Bereit für Mobile App!</strong><br>
                    Alle APIs verfügbar • Kategorisierte Navigation • 880K+ Fragen bereit
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
  
  res.send(html);
});

app.listen(PORT, () => {
  console.log('\n🚀 JUNOSIXTEEN DEMO-SERVER GESTARTET!');
  console.log('=' .repeat(50));
  console.log(`✅ Server läuft auf: http://localhost:${PORT}`);
  console.log('✅ UL/MCP Integration: AKTIV');
  console.log('✅ Adaptive KI: SIMULIERT');
  console.log('✅ Demo-Daten: GELADEN');
  console.log('\n💡 Für Meeting bereit!');
  console.log('=' .repeat(50));
}); 
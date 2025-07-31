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
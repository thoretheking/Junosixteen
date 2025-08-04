const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

const db = admin.firestore();

// Level-Konfiguration basierend auf korrektem JunoSixteen Spielmodus
const LEVEL_CONFIG = {
  1: { baseMultiplier: 50, questionsPerLevel: 10, riskQuestions: [5, 10], teamQuestion: 9, theme: 'Rookie' },
  2: { baseMultiplier: 100, questionsPerLevel: 10, riskQuestions: [5, 10], teamQuestion: 9, theme: 'Explorer' },
  3: { baseMultiplier: 150, questionsPerLevel: 10, riskQuestions: [5, 10], teamQuestion: 9, theme: 'Challenger' },
  4: { baseMultiplier: 200, questionsPerLevel: 10, riskQuestions: [5, 10], teamQuestion: 9, theme: 'Strategist' },
  5: { baseMultiplier: 250, questionsPerLevel: 10, riskQuestions: [5, 10], teamQuestion: 9, theme: 'Specialist' },
  6: { baseMultiplier: 300, questionsPerLevel: 10, riskQuestions: [5, 10], teamQuestion: 9, theme: 'Virtuose' },
  7: { baseMultiplier: 350, questionsPerLevel: 10, riskQuestions: [5, 10], teamQuestion: 9, theme: 'Master' },
  8: { baseMultiplier: 400, questionsPerLevel: 10, riskQuestions: [5, 10], teamQuestion: 9, theme: 'Legend' },
  9: { baseMultiplier: 450, questionsPerLevel: 10, riskQuestions: [5, 10], teamQuestion: 9, theme: 'Expert' },
  10: { baseMultiplier: 500, questionsPerLevel: 10, riskQuestions: [5, 10], teamQuestion: 9, theme: 'Super Expert' }
};

// Punktberechnung: Level × 50 × Fragennummer
function calculateQuestionPoints(level, questionNumber) {
  return level * 50 * questionNumber;
}

// Fragentyp-Bestimmung
function getQuestionType(questionNumber) {
  if (questionNumber === 5 || questionNumber === 10) return 'risk';
  if (questionNumber === 9) return 'team';
  return 'standard';
}

// Badge-System
const BADGES = {
  'first_correct': { name: 'Erste richtige Antwort', icon: '🎯', points: 50 },
  'speed_demon': { name: 'Blitzschnell', icon: '⚡', points: 100 },
  'perfectionist': { name: '5 perfekte Antworten', icon: '💎', points: 150 },
  'risk_taker': { name: 'Risiko-Level gemeistert', icon: '🔥', points: 300 },
  'survivor': { name: 'Risiko überlebt', icon: '🛡️', points: 200 },
  'champion': { name: 'Level 10 erreicht', icon: '👑', points: 500 }
};

// ===================================================
// 🎮 MINIGAMES ALS LEVEL-BELOHNUNG 
// ===================================================

const MINIGAMES = {
  'memory_cards': {
    id: 'memory_cards',
    name: '🧠 Memory Karten',
    description: 'Finde alle Paare! Trainiere dein Gedächtnis mit fachbezogenen Begriffen.',
    duration: 60, // Sekunden
    difficulty_levels: ['easy', 'medium', 'hard'],
    reward_multiplier: 1.2,
    available_themes: ['hygiene', 'safety', 'compliance', 'teamwork']
  },
  'word_scramble': {
    id: 'word_scramble',
    name: '🔤 Wörter-Puzzle',
    description: 'Bringe die Buchstaben in die richtige Reihenfolge!',
    duration: 45,
    difficulty_levels: ['easy', 'medium', 'hard'],
    reward_multiplier: 1.1,
    available_themes: ['technical_terms', 'procedures', 'protocols']
  },
  'reaction_test': {
    id: 'reaction_test',
    name: '⚡ Reaktionstest',
    description: 'Wie schnell erkennst du richtige vs. falsche Aussagen?',
    duration: 30,
    difficulty_levels: ['easy', 'medium', 'hard'],
    reward_multiplier: 1.3,
    available_themes: ['safety_situations', 'emergency_procedures']
  },
  'puzzle_slider': {
    id: 'puzzle_slider',
    name: '🧩 Schiebe-Puzzle',
    description: 'Bringe das Bild in die richtige Reihenfolge!',
    duration: 90,
    difficulty_levels: ['easy', 'medium', 'hard'],
    reward_multiplier: 1.15,
    available_themes: ['workflow_diagrams', 'process_charts']
  }
};

// Level-spezifische Minigame-Zuordnung
const LEVEL_MINIGAME_MAPPING = {
  1: ['memory_cards'],
  2: ['memory_cards', 'word_scramble'],
  3: ['memory_cards', 'word_scramble'],
  4: ['memory_cards', 'word_scramble', 'reaction_test'],
  5: ['reaction_test'], // Risiko-Level bekommt spezielle Belohnung
  6: ['memory_cards', 'word_scramble', 'reaction_test'],
  7: ['memory_cards', 'word_scramble', 'reaction_test', 'puzzle_slider'],
  8: ['memory_cards', 'word_scramble', 'reaction_test', 'puzzle_slider'],
  9: ['reaction_test', 'puzzle_slider'], // Schwierigere Minigames
  10: ['puzzle_slider'] // Finales Level bekommt schwierigste Belohnung
};

// ===================================================
// 🎮 MINIGAME-ENDPOINTS
// ===================================================

// Level abgeschlossen - Minigame anbieten
router.post('/level-complete', async (req, res) => {
  try {
    const { level, bereich, score, correctAnswers, totalQuestions } = req.body;
    const uid = req.user.uid;

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    const userData = userDoc.data();
    const levelConfig = LEVEL_CONFIG[level];
    
    // Grund-Belohnung berechnen
    let pointsGained = levelConfig.points;
    let newBadges = [];
    let levelUp = false;
    let currentPoints = userData.currentPoints || 0;
    let totalPoints = userData.totalPoints || 0;

    // Performance-basierte Boni
    const accuracy = correctAnswers / totalQuestions;
    let performanceBonus = 0;
    
    if (accuracy >= 0.9) {
      performanceBonus = Math.floor(pointsGained * 0.5); // 50% Bonus für 90%+
      if (!userData.badges?.includes('perfectionist')) {
        newBadges.push('perfectionist');
      }
    } else if (accuracy >= 0.8) {
      performanceBonus = Math.floor(pointsGained * 0.25); // 25% Bonus für 80%+
    }

    currentPoints += pointsGained + performanceBonus;
    totalPoints += pointsGained + performanceBonus;

    // Verfügbare Minigames für dieses Level
    const availableMinigames = LEVEL_MINIGAME_MAPPING[level] || ['memory_cards'];
    const selectedMinigames = availableMinigames.map(gameId => ({
      ...MINIGAMES[gameId],
      estimated_reward: Math.floor(pointsGained * MINIGAMES[gameId].reward_multiplier)
    }));

    // Level-Up prüfen
    if (level < 10) {
      levelUp = true;
    }

    // Badge-Checks
    if (level === 5 && !userData.badges?.includes('risk_taker')) {
      newBadges.push('risk_taker');
    }
    if (level === 10 && !userData.badges?.includes('champion')) {
      newBadges.push('champion');
    }

    // Basis-Update (vor Minigame)
    await userRef.update({
      level: levelUp ? level + 1 : level,
      currentPoints,
      totalPoints,
      badges: admin.firestore.FieldValue.arrayUnion(...newBadges),
      lastActivity: admin.firestore.FieldValue.serverTimestamp()
    });

    // Level-Completion speichern
    await db.collection('levelCompletions').add({
      uid,
      level,
      bereich,
      score,
      accuracy,
      pointsGained,
      performanceBonus,
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      levelComplete: true,
      levelUp,
      baseReward: {
        pointsGained,
        performanceBonus,
        totalPoints,
        currentPoints,
        newLevel: levelUp ? level + 1 : level,
        newBadges: newBadges.map(badge => ({
          id: badge,
          ...BADGES[badge]
        }))
      },
      minigameReward: {
        available: true,
        message: `🎉 Level ${level} abgeschlossen! Spiele ein Minigame für Bonus-Punkte!`,
        games: selectedMinigames,
        timeLimit: 300 // 5 Minuten Zeit um Minigame zu starten
      }
    });

  } catch (error) {
    console.error('Level-Complete-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Level-Abschluss' });
  }
});

// Minigame starten
router.post('/minigame/start', async (req, res) => {
  try {
    const { gameId, difficulty = 'medium', theme } = req.body;
    const uid = req.user.uid;

    if (!MINIGAMES[gameId]) {
      return res.status(400).json({ error: 'Ungültiges Minigame' });
    }

    const game = MINIGAMES[gameId];
    const sessionId = `${uid}_${gameId}_${Date.now()}`;

    // Game-Session erstellen
    const gameSession = {
      sessionId,
      uid,
      gameId,
      difficulty,
      theme: theme || game.available_themes[0],
      startTime: admin.firestore.FieldValue.serverTimestamp(),
      duration: game.duration,
      status: 'active',
      score: 0,
      completed: false
    };

    await db.collection('minigameSessions').doc(sessionId).set(gameSession);

    // Game-spezifische Daten generieren
    let gameData = {};
    
    switch (gameId) {
      case 'memory_cards':
        gameData = generateMemoryGame(difficulty, theme);
        break;
      case 'word_scramble':
        gameData = generateWordScramble(difficulty, theme);
        break;
      case 'reaction_test':
        gameData = generateReactionTest(difficulty, theme);
        break;
      case 'puzzle_slider':
        gameData = generatePuzzleSlider(difficulty, theme);
        break;
    }

    res.json({
      success: true,
      sessionId,
      gameInfo: game,
      gameData,
      timeLimit: game.duration,
      potentialReward: Math.floor(200 * game.reward_multiplier)
    });

  } catch (error) {
    console.error('Minigame-Start-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Starten des Minigames' });
  }
});

// Minigame abschließen
router.post('/minigame/complete', async (req, res) => {
  try {
    const { sessionId, score, timeSpent, moves, accuracy } = req.body;
    const uid = req.user.uid;

    // Session abrufen
    const sessionDoc = await db.collection('minigameSessions').doc(sessionId).get();
    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Game-Session nicht gefunden' });
    }

    const sessionData = sessionDoc.data();
    if (sessionData.uid !== uid) {
      return res.status(403).json({ error: 'Ungültige Session' });
    }

    if (sessionData.completed) {
      return res.status(400).json({ error: 'Minigame bereits abgeschlossen' });
    }

    const game = MINIGAMES[sessionData.gameId];

    // Belohnung berechnen
    let baseReward = Math.floor(200 * game.reward_multiplier);
    let timeBonus = 0;
    let accuracyBonus = 0;
    let efficiencyBonus = 0;

    // Zeit-Bonus (je schneller, desto mehr)
    if (timeSpent < game.duration * 0.5) {
      timeBonus = Math.floor(baseReward * 0.3); // 30% für unter 50% der Zeit
    } else if (timeSpent < game.duration * 0.7) {
      timeBonus = Math.floor(baseReward * 0.15); // 15% für unter 70% der Zeit
    }

    // Genauigkeits-Bonus
    if (accuracy >= 0.95) {
      accuracyBonus = Math.floor(baseReward * 0.4); // 40% für 95%+ Genauigkeit
    } else if (accuracy >= 0.85) {
      accuracyBonus = Math.floor(baseReward * 0.2); // 20% für 85%+ Genauigkeit
    }

    // Effizienz-Bonus (weniger Moves bei Puzzle)
    if (sessionData.gameId === 'puzzle_slider' && moves) {
      const optimalMoves = getOptimalMoves(sessionData.difficulty);
      if (moves <= optimalMoves * 1.2) {
        efficiencyBonus = Math.floor(baseReward * 0.25);
      }
    }

    const totalReward = baseReward + timeBonus + accuracyBonus + efficiencyBonus;

    // User-Punkte aktualisieren
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
      totalPoints: admin.firestore.FieldValue.increment(totalReward),
      currentPoints: admin.firestore.FieldValue.increment(totalReward),
      lastActivity: admin.firestore.FieldValue.serverTimestamp()
    });

    // Session als abgeschlossen markieren
    await db.collection('minigameSessions').doc(sessionId).update({
      completed: true,
      finalScore: score,
      timeSpent,
      moves: moves || 0,
      accuracy,
      totalReward,
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Achievement prüfen
    let newAchievement = null;
    if (accuracy >= 0.95 && timeSpent < game.duration * 0.5) {
      newAchievement = {
        id: 'minigame_master',
        name: 'Minigame-Meister',
        description: 'Perfekte Leistung in einem Minigame',
        icon: '🏆',
        points: 100
      };
    }

    res.json({
      success: true,
      completed: true,
      results: {
        score,
        accuracy,
        timeSpent,
        moves: moves || 0,
        rewards: {
          baseReward,
          timeBonus,
          accuracyBonus,
          efficiencyBonus,
          totalReward
        },
        achievement: newAchievement,
        ranking: getMinigameRanking(sessionData.gameId, score)
      }
    });

  } catch (error) {
    console.error('Minigame-Complete-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Abschließen des Minigames' });
  }
});

// ===================================================
// 🎮 MINIGAME-GENERATOREN
// ===================================================

function generateMemoryGame(difficulty, theme) {
  const cardCounts = { easy: 8, medium: 12, hard: 16 }; // Paare
  const cardCount = cardCounts[difficulty];
  
  const themeCards = {
    hygiene: ['🧼', '🚿', '🧴', '🧽', '🦠', '💊', '🧪', '🥽', '🧻', '🗑️', '🚮', '♻️', '🛁', '🧊', '💧', '🧄'],
    safety: ['⚠️', '🛡️', '🦺', '⛑️', '🧯', '🚨', '🔒', '🔑', '🚪', '🚥', '⚡', '🔥', '☢️', '☣️', '🚧', '🛠️'],
    compliance: ['📋', '✅', '❌', '📊', '📈', '📉', '🎯', '📝', '📄', '📑', '📚', '📖', '🔍', '🔎', '📌', '📎'],
    teamwork: ['🤝', '👥', '👫', '👬', '👭', '💬', '🗣️', '👂', '🤔', '💡', '🎯', '🏆', '⭐', '🌟', '🎉', '👏']
  };
  
  const availableCards = themeCards[theme] || themeCards.hygiene;
  const selectedCards = availableCards.slice(0, cardCount);
  const gameCards = [...selectedCards, ...selectedCards]; // Doppelt für Paare
  
  // Karten mischen
  for (let i = gameCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [gameCards[i], gameCards[j]] = [gameCards[j], gameCards[i]];
  }
  
  return {
    cards: gameCards.map((card, index) => ({
      id: index,
      value: card,
      flipped: false,
      matched: false
    })),
    totalPairs: cardCount,
    maxFlips: cardCount * 3 // Maximal erlaubte Aufdeckungen
  };
}

function generateWordScramble(difficulty, theme) {
  const wordLists = {
    technical_terms: {
      easy: ['HYGIENE', 'SAUBER', 'WASCHEN', 'SEIFE'],
      medium: ['DESINFEKTION', 'STERILISATION', 'BAKTERIEN', 'VIREN'],
      hard: ['MIKROORGANISMEN', 'KONTAMINATION', 'ASEPTISCH', 'ANTISEPTISCH']
    },
    procedures: {
      easy: ['PRÜFEN', 'MELDEN', 'TESTEN', 'WARTEN'],
      medium: ['PROTOKOLL', 'VERFAHREN', 'ABLAUF', 'PROZESS'],
      hard: ['QUALITÄTSKONTROLLE', 'DOKUMENTATION', 'VERIFIZIERUNG', 'VALIDIERUNG']
    }
  };
  
  const words = wordLists[theme]?.[difficulty] || wordLists.technical_terms[difficulty];
  const selectedWord = words[Math.floor(Math.random() * words.length)];
  const scrambledWord = selectedWord.split('').sort(() => Math.random() - 0.5).join('');
  
  return {
    originalWord: selectedWord,
    scrambledWord,
    wordLength: selectedWord.length,
    hint: getWordHint(selectedWord, theme)
  };
}

function generateReactionTest(difficulty, theme) {
  const statementCounts = { easy: 10, medium: 15, hard: 20 };
  const timeWindows = { easy: 3000, medium: 2000, hard: 1500 }; // ms pro Statement
  
  const statements = {
    safety_situations: [
      { text: 'Bei einem Brand sollte man den Aufzug benutzen', correct: false },
      { text: 'Notausgänge müssen immer frei zugänglich sein', correct: true },
      { text: 'Schutzausrüstung ist nur bei Risiko-Arbeiten nötig', correct: false },
      { text: 'Sicherheitsdatenblätter enthalten wichtige Informationen', correct: true },
      { text: 'Erste-Hilfe-Kästen müssen regelmäßig überprüft werden', correct: true }
    ],
    emergency_procedures: [
      { text: 'Bei Notfällen zuerst die Geschäftsleitung informieren', correct: false },
      { text: 'Die Notrufnummer 112 ist europaweit gültig', correct: true },
      { text: 'Verletzte sollten sofort bewegt werden', correct: false },
      { text: 'Feuerlöscher haben ein Ablaufdatum', correct: true },
      { text: 'Sammelplätze sind bei Evakuierung wichtig', correct: true }
    ]
  };
  
  const availableStatements = statements[theme] || statements.safety_situations;
  const selectedStatements = [];
  
  for (let i = 0; i < statementCounts[difficulty]; i++) {
    const randomStatement = availableStatements[Math.floor(Math.random() * availableStatements.length)];
    selectedStatements.push({
      id: i,
      ...randomStatement,
      timeWindow: timeWindows[difficulty]
    });
  }
  
  return {
    statements: selectedStatements,
    totalStatements: statementCounts[difficulty],
    timePerStatement: timeWindows[difficulty]
  };
}

function generatePuzzleSlider(difficulty, theme) {
  const gridSizes = { easy: 3, medium: 4, hard: 5 }; // 3x3, 4x4, 5x5
  const gridSize = gridSizes[difficulty];
  const totalTiles = gridSize * gridSize;
  
  // Erstelle sortiertes Puzzle (1 bis n-1, letztes Feld leer)
  const solvedState = Array.from({ length: totalTiles - 1 }, (_, i) => i + 1);
  solvedState.push(0); // 0 = leeres Feld
  
  // Mische das Puzzle (sicherstelle lösbare Konfiguration)
  const puzzleState = [...solvedState];
  
  // Führe zufällige gültige Züge aus um zu mischen
  let emptyIndex = totalTiles - 1;
  for (let i = 0; i < 1000; i++) {
    const possibleMoves = getPossibleMoves(emptyIndex, gridSize);
    const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    
    // Tausche leeres Feld mit gewähltem Nachbarn
    [puzzleState[emptyIndex], puzzleState[randomMove]] = [puzzleState[randomMove], puzzleState[emptyIndex]];
    emptyIndex = randomMove;
  }
  
  return {
    gridSize,
    totalTiles,
    currentState: puzzleState,
    solvedState,
    emptyTileIndex: emptyIndex,
    moveCount: 0,
    image: getPuzzleImage(theme, difficulty)
  };
}

// ===================================================
// 🎮 HILFSFUNKTIONEN
// ===================================================

function getWordHint(word, theme) {
  const hints = {
    'HYGIENE': 'Sauberkeit und Gesundheitsschutz',
    'DESINFEKTION': 'Verfahren zur Keimreduzierung',
    'PROTOKOLL': 'Dokumentierte Verfahrensweise',
    'QUALITÄTSKONTROLLE': 'Überwachung von Standards'
  };
  return hints[word] || 'Fachbegriff aus dem Arbeitsbereich';
}

function getPossibleMoves(emptyIndex, gridSize) {
  const moves = [];
  const row = Math.floor(emptyIndex / gridSize);
  const col = emptyIndex % gridSize;
  
  // Oben
  if (row > 0) moves.push(emptyIndex - gridSize);
  // Unten  
  if (row < gridSize - 1) moves.push(emptyIndex + gridSize);
  // Links
  if (col > 0) moves.push(emptyIndex - 1);
  // Rechts
  if (col < gridSize - 1) moves.push(emptyIndex + 1);
  
  return moves;
}

function getOptimalMoves(difficulty) {
  return { easy: 15, medium: 25, hard: 40 }[difficulty];
}

function getPuzzleImage(theme, difficulty) {
  const images = {
    workflow_diagrams: {
      easy: 'workflow_simple_3x3.jpg',
      medium: 'workflow_medium_4x4.jpg', 
      hard: 'workflow_complex_5x5.jpg'
    },
    process_charts: {
      easy: 'process_basic_3x3.jpg',
      medium: 'process_advanced_4x4.jpg',
      hard: 'process_expert_5x5.jpg'
    }
  };
  
  return images[theme]?.[difficulty] || 'default_puzzle.jpg';
}

function getMinigameRanking(gameId, score) {
  // Simuliere Ranking basierend auf Score
  const rankings = ['Bronze', 'Silber', 'Gold', 'Platin'];
  const thresholds = { easy: [50, 70, 85, 95], medium: [60, 80, 90, 98], hard: [70, 85, 95, 99] };
  
  // Vereinfachte Ranking-Logik
  if (score >= 95) return { rank: 'Platin', icon: '🏆', bonus: 50 };
  if (score >= 85) return { rank: 'Gold', icon: '🥇', bonus: 30 };
  if (score >= 70) return { rank: 'Silber', icon: '🥈', bonus: 20 };
  return { rank: 'Bronze', icon: '🥉', bonus: 10 };
}

// ===================================================
// 🎮 MINIGAME-STATISTIKEN
// ===================================================

// Minigame-Leaderboard abrufen
router.get('/minigame/leaderboard/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { difficulty = 'all', timeframe = '7d' } = req.query;

    if (!MINIGAMES[gameId]) {
      return res.status(400).json({ error: 'Ungültiges Minigame' });
    }

    // Zeitraum berechnen
    const now = new Date();
    const startDate = new Date();
    switch (timeframe) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
    }

    // Query zusammenstellen
    let query = db.collection('minigameSessions')
      .where('gameId', '==', gameId)
      .where('completed', '==', true)
      .where('completedAt', '>=', admin.firestore.Timestamp.fromDate(startDate));

    if (difficulty !== 'all') {
      query = query.where('difficulty', '==', difficulty);
    }

    const sessionsSnapshot = await query
      .orderBy('finalScore', 'desc')
      .limit(10)
      .get();

    const leaderboard = [];
    
    for (const doc of sessionsSnapshot.docs) {
      const sessionData = doc.data();
      
      // User-Info abrufen
      const userDoc = await db.collection('users').doc(sessionData.uid).get();
      const userData = userDoc.data();
      
      leaderboard.push({
        rank: leaderboard.length + 1,
        username: userData?.username || 'Anonym',
        avatar: userData?.avatar || 'default',
        score: sessionData.finalScore,
        accuracy: sessionData.accuracy,
        timeSpent: sessionData.timeSpent,
        difficulty: sessionData.difficulty,
        reward: sessionData.totalReward,
        completedAt: sessionData.completedAt
      });
    }

    res.json({
      gameId,
      gameName: MINIGAMES[gameId].name,
      difficulty,
      timeframe,
      leaderboard,
      totalEntries: leaderboard.length
    });

  } catch (error) {
    console.error('Minigame-Leaderboard-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Leaderboards' });
  }
});

// Persönliche Minigame-Statistiken
router.get('/minigame/stats', async (req, res) => {
  try {
    const uid = req.user.uid;

    const sessionsSnapshot = await db.collection('minigameSessions')
      .where('uid', '==', uid)
      .where('completed', '==', true)
      .get();

    const stats = {
      totalGamesPlayed: 0,
      totalRewardsEarned: 0,
      averageAccuracy: 0,
      favoriteGame: null,
      bestScores: {},
      gameBreakdown: {}
    };

    let totalAccuracy = 0;
    const gameStats = {};

    sessionsSnapshot.forEach(doc => {
      const sessionData = doc.data();
      const gameId = sessionData.gameId;

      stats.totalGamesPlayed++;
      stats.totalRewardsEarned += sessionData.totalReward || 0;
      totalAccuracy += sessionData.accuracy || 0;

      // Game-spezifische Statistiken
      if (!gameStats[gameId]) {
        gameStats[gameId] = {
          name: MINIGAMES[gameId].name,
          timesPlayed: 0,
          bestScore: 0,
          totalRewards: 0,
          averageAccuracy: 0
        };
      }

      gameStats[gameId].timesPlayed++;
      gameStats[gameId].bestScore = Math.max(gameStats[gameId].bestScore, sessionData.finalScore);
      gameStats[gameId].totalRewards += sessionData.totalReward || 0;

      // Best Scores tracking
      if (!stats.bestScores[gameId] || sessionData.finalScore > stats.bestScores[gameId]) {
        stats.bestScores[gameId] = sessionData.finalScore;
      }
    });

    // Durchschnitte berechnen
    if (stats.totalGamesPlayed > 0) {
      stats.averageAccuracy = totalAccuracy / stats.totalGamesPlayed;
      
      // Lieblingsspiel (am meisten gespielt)
      let maxPlayed = 0;
      Object.entries(gameStats).forEach(([gameId, data]) => {
        if (data.timesPlayed > maxPlayed) {
          maxPlayed = data.timesPlayed;
          stats.favoriteGame = {
            id: gameId,
            name: data.name,
            timesPlayed: data.timesPlayed
          };
        }
      });
    }

    stats.gameBreakdown = gameStats;

    res.json({ stats });

  } catch (error) {
    console.error('Minigame-Stats-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Statistiken' });
  }
});

// Antwort verarbeiten und Punkte vergeben
router.post('/answer', async (req, res) => {
  try {
    const { questionId, answer, timeSpent, isCorrect } = req.body;
    const uid = req.user.uid;

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    const userData = userDoc.data();
    const currentLevel = userData.level || 1;
    const levelConfig = LEVEL_CONFIG[currentLevel];
    
    let pointsGained = 0;
    let newBadges = [];
    let levelUp = false;
    let gameOver = false;
    let newLevel = currentLevel;
    let currentPoints = userData.currentPoints || 0;
    let totalPoints = userData.totalPoints || 0;

    if (isCorrect) {
      // Richtige Antwort
      if (levelConfig.isRiskLevel) {
        // Risiko-Level: Verdopplung oder alles verlieren
        if (currentLevel === 5) {
          pointsGained = currentPoints; // Verdopplung
          currentPoints = currentPoints * 2;
          newBadges.push('risk_taker');
        } else if (currentLevel === 10) {
          pointsGained = currentPoints; // Finale Verdopplung
          currentPoints = currentPoints * 2;
          newBadges.push('champion');
        }
      } else {
        // Normales Level
        pointsGained = levelConfig.points;
        
        // Speed-Bonus (unter 5 Sekunden)
        if (timeSpent < 5000) {
          pointsGained += 50;
          if (!userData.badges?.includes('speed_demon')) {
            newBadges.push('speed_demon');
          }
        }
        
        currentPoints += pointsGained;
      }
      
      // Level-Up prüfen
      if (currentLevel < 10) {
        newLevel = currentLevel + 1;
        levelUp = true;
      }
      
      // Badge-Checks
      if (!userData.badges?.includes('first_correct') && currentLevel === 1) {
        newBadges.push('first_correct');
      }
      
    } else {
      // Falsche Antwort
      if (levelConfig.isRiskLevel) {
        // Risiko-Level: Alles verlieren
        currentPoints = 0;
        gameOver = true;
        newLevel = 1; // Zurück zu Level 1
      } else {
        // Normales Level: Punktabzug aber Level bleibt
        const penalty = Math.min(100, currentPoints * 0.1);
        currentPoints = Math.max(0, currentPoints - penalty);
        pointsGained = -penalty;
      }
    }

    // Badge-Punkte hinzufügen
    const badgePoints = newBadges.reduce((sum, badge) => sum + BADGES[badge].points, 0);
    totalPoints += Math.max(0, pointsGained) + badgePoints;

    // Datenbank aktualisieren
    const updateData = {
      level: newLevel,
      currentPoints,
      totalPoints,
      badges: admin.firestore.FieldValue.arrayUnion(...newBadges),
      lastActivity: admin.firestore.FieldValue.serverTimestamp()
    };

    await userRef.update(updateData);

    // Statistik speichern
    await db.collection('gameStats').add({
      uid,
      questionId,
      answer,
      isCorrect,
      timeSpent,
      pointsGained,
      level: currentLevel,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      result: {
        isCorrect,
        pointsGained,
        totalPoints,
        currentPoints,
        level: newLevel,
        levelUp,
        gameOver,
        newBadges: newBadges.map(badge => ({
          id: badge,
          ...BADGES[badge]
        })),
        nextLevelInfo: LEVEL_CONFIG[Math.min(newLevel + 1, 10)]
      }
    });

  } catch (error) {
    console.error('Gamification-Fehler:', error);
    res.status(500).json({ error: 'Fehler bei der Punkteverarbeitung' });
  }
});

// Aktuelle Spielstatistiken abrufen
router.get('/stats', async (req, res) => {
  try {
    const uid = req.user.uid;
    
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    const userData = userDoc.data();
    const currentLevel = userData.level || 1;
    const levelConfig = LEVEL_CONFIG[currentLevel];

    res.json({
      user: {
        level: currentLevel,
        currentPoints: userData.currentPoints || 0,
        totalPoints: userData.totalPoints || 0,
        badges: userData.badges || []
      },
      currentLevel: {
        number: currentLevel,
        ...levelConfig
      },
      nextLevel: LEVEL_CONFIG[Math.min(currentLevel + 1, 10)],
      availableBadges: Object.keys(BADGES).map(key => ({
        id: key,
        ...BADGES[key],
        earned: userData.badges?.includes(key) || false
      }))
    });

  } catch (error) {
    console.error('Stats-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Statistiken' });
  }
});

// Leaderboard abrufen
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 10, type = 'totalPoints' } = req.query;
    
    let query = db.collection('users')
      .where('totalPoints', '>', 0)
      .orderBy('totalPoints', 'desc')
      .limit(parseInt(limit));

    if (type === 'level') {
      query = db.collection('users')
        .where('level', '>', 1)
        .orderBy('level', 'desc')
        .orderBy('currentPoints', 'desc')
        .limit(parseInt(limit));
    }

    const snapshot = await query.get();
    const leaderboard = [];

    snapshot.forEach((doc, index) => {
      const data = doc.data();
      leaderboard.push({
        rank: index + 1,
        uid: doc.id,
        displayName: data.displayName || 'Anonym',
        avatar: data.avatar,
        level: data.level,
        totalPoints: data.totalPoints,
        currentPoints: data.currentPoints,
        badges: data.badges?.length || 0
      });
    });

    res.json({ leaderboard });

  } catch (error) {
    console.error('Leaderboard-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Leaderboards' });
  }
});

// Risiko-Level starten
router.post('/risk-level/:level', async (req, res) => {
  try {
    const { level } = req.params;
    const uid = req.user.uid;
    
    if (![5, 10].includes(parseInt(level))) {
      return res.status(400).json({ error: 'Ungültiges Risiko-Level' });
    }

    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    
    if (userData.level !== parseInt(level)) {
      return res.status(400).json({ error: 'Level-Berechtigung fehlt' });
    }

    // Risiko-Level-spezifische Fragen laden
    const questionsSnapshot = await db.collection('questions')
      .where('level', '==', parseInt(level))
      .where('isRiskQuestion', '==', true)
      .limit(2)
      .get();

    const questions = [];
    questionsSnapshot.forEach(doc => {
      questions.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      riskLevel: parseInt(level),
      currentPoints: userData.currentPoints,
      potentialWin: userData.currentPoints * 2,
      potentialLoss: userData.currentPoints,
      questions,
      warning: level === '5' ? 'Achtung: Bei falscher Antwort verlierst du alle Punkte!' : 'FINALES RISIKO: Alles oder Nichts!'
    });

  } catch (error) {
    console.error('Risiko-Level-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Risiko-Levels' });
  }
});

// Fortschritt zurücksetzen (Admin oder nach Ablauf)
router.post('/reset/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { reason = 'manual_reset' } = req.body;

    // Admin-Check
    const adminDoc = await db.collection('users').doc(req.user.uid).get();
    if (!adminDoc.data()?.isAdmin) {
      return res.status(403).json({ error: 'Admin-Berechtigung erforderlich' });
    }

    await db.collection('users').doc(uid).update({
      level: 1,
      currentPoints: 0,
      badges: [],
      progress: {
        completedModules: [],
        currentModule: 1,
        totalModules: 10
      },
      resetReason: reason,
      resetAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ 
      message: 'Fortschritt erfolgreich zurückgesetzt',
      uid,
      reason 
    });

  } catch (error) {
    console.error('Reset-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Zurücksetzen' });
  }
});

module.exports = router; 
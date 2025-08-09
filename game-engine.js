// ===================================================
// 🎮 JUNOSIXTEEN GAME ENGINE - VOLLSTÄNDIGE VERSION
// Komplette Spiel-Logik, Punkte-System & Level-Management mit Minigame-Integration
// ===================================================

const fs = require('fs');
const path = require('path');

// ===================================================
// 🏆 BADGE SYSTEM
// ===================================================

const BADGE_DEFINITIONS = {
  'first_login': {
    name: 'Willkommen!',
    description: 'Erste Anmeldung bei JunoSixteen',
    icon: '👋',
    points: 50
  },
  'quiz_master': {
    name: 'Quiz Master',
    description: '10 Quizzes erfolgreich abgeschlossen',
    icon: '🧠',
    points: 200
  },
  'streak_week': {
    name: 'Wochenstreak',
    description: '7 Tage in Folge aktiv',
    icon: '🔥',
    points: 300
  },
  'level_5': {
    name: 'Prodigy erreicht',
    description: 'Level 5 in einem Bereich erreicht',
    icon: '⭐',
    points: 500
  },
  'squad_sync': {
    name: 'Squad Sync',
    description: 'Teamfrage erfolgreich gelöst',
    icon: '🤝',
    points: 300
  },
  'risk_master': {
    name: 'Risk Master',
    description: '5 Risikofragen korrekt beantwortet',
    icon: '⚡',
    points: 400
  },
  'expert_certified': {
    name: 'Expert Certified',
    description: 'Level 10 in einem Bereich erreicht',
    icon: '🏆',
    points: 1000
  },
  'multi_master': {
    name: 'Multi Master',
    description: 'Level 5+ in 3 verschiedenen Bereichen',
    icon: '🌟',
    points: 750
  },
  // Neue Minigame-Badges
  'minigame_master': {
    name: 'Minigame-Meister',
    description: 'Perfekte Leistung in einem Minigame',
    icon: '🎮',
    points: 200
  },
  'speed_minigamer': {
    name: 'Blitzschnell',
    description: 'Minigame in Rekordzeit abgeschlossen',
    icon: '💨',
    points: 150
  },
  'minigame_explorer': {
    name: 'Minigame-Entdecker',
    description: 'Alle 4 Minigame-Typen gespielt',
    icon: '🗺️',
    points: 300
  }
};

// ===================================================
// 🎯 LEVEL CONFIGURATION
// ===================================================

const LEVEL_CONFIG = {
  1: { name: 'Rookie', difficulty: 'sehr_einfach', baseMultiplier: 50, questionsPerLevel: 10, riskQuestions: [5, 10], teamQuestion: 9 },
  2: { name: 'Explorer', difficulty: 'einfach', baseMultiplier: 100, questionsPerLevel: 10, riskQuestions: [5, 10], teamQuestion: 9 },
  3: { name: 'Challenger', difficulty: 'einfach', baseMultiplier: 150, questionsPerLevel: 10, riskQuestions: [5, 10], teamQuestion: 9 },
  4: { name: 'Strategist', difficulty: 'mittel', baseMultiplier: 200, questionsPerLevel: 10, riskQuestions: [5, 10], teamQuestion: 9 },
  5: { name: 'Specialist', difficulty: 'mittel', baseMultiplier: 250, questionsPerLevel: 10, riskQuestions: [5, 10], teamQuestion: 9 },
  6: { name: 'Advanced', difficulty: 'mittel', baseMultiplier: 300, questionsPerLevel: 10, riskQuestions: [5, 10], teamQuestion: 9 },
  7: { name: 'Virtuose', difficulty: 'schwer', baseMultiplier: 350, questionsPerLevel: 10, riskQuestions: [5, 10], teamQuestion: 9 },
  8: { name: 'Master', difficulty: 'schwer', baseMultiplier: 400, questionsPerLevel: 10, riskQuestions: [5, 10], teamQuestion: 9 },
  9: { name: 'Legend', difficulty: 'expert', baseMultiplier: 450, questionsPerLevel: 10, riskQuestions: [5, 10], teamQuestion: 9 },
  10: { name: 'Super Expert', difficulty: 'expert', baseMultiplier: 500, questionsPerLevel: 10, riskQuestions: [5, 10], teamQuestion: 9 }
};

// Punktberechnung: Level × 50 × Fragennummer
// Beispiel Level 2, Frage 3: 2 × 50 × 3 = 300 Punkte
function calculateQuestionPoints(level, questionNumber) {
  return level * 50 * questionNumber;
}

// ===================================================
// 🎮 GAME ENGINE CLASS
// ===================================================

class GameEngine {
  constructor() {
    this.players = new Map();
    this.games = new Map();
    this.highscores = new Map();
    this.loadData();
  }

  // ===================================================
  // 💾 DATA MANAGEMENT
  // ===================================================

  loadData() {
    try {
      if (fs.existsSync('game-data.json')) {
        const data = JSON.parse(fs.readFileSync('game-data.json', 'utf8'));
        this.players = new Map(data.players || []);
        this.games = new Map(data.games || []);
        this.highscores = new Map(data.highscores || []);
      }
    } catch (error) {
      console.log('Neue Game Engine initialisiert');
    }
  }

  saveData() {
    try {
      const data = {
        players: Array.from(this.players.entries()),
        games: Array.from(this.games.entries()),
        highscores: Array.from(this.highscores.entries())
      };
      fs.writeFileSync('game-data.json', JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    }
  }

  // ===================================================
  // 👤 PLAYER MANAGEMENT
  // ===================================================

  createPlayer(playerId, userData = {}) {
    const player = {
      id: playerId,
      username: userData.username || `Player_${playerId.slice(0, 8)}`,
      email: userData.email || '',
      created_at: new Date(),
      total_points: 0,
      current_points: 0,
      level: 1,
      badges: ['first_login'],
      progress: {},
      stats: {
        total_quizzes: 0,
        total_questions: 0,
        correct_answers: 0,
        accuracy: 0,
        ul_cluster: 'Typ_A',
        risk_questions_attempted: 0,
        risk_questions_correct: 0
      },
      minigame_stats: {},
      streak: {
        current: 0,
        longest: 0,
        last_activity: null
      }
    };

    this.players.set(playerId, player);
    this.awardBadge(playerId, 'first_login');
    this.saveData();
    return player;
  }

  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  updatePlayer(playerId, updates) {
    const player = this.getPlayer(playerId);
    if (!player) return null;

    Object.assign(player, updates);
    this.saveData();
    return player;
  }

  // ===================================================
  // 🎮 GAME SESSION MANAGEMENT
  // ===================================================

  startGame(playerId, bereich, mode = 'single') {
    const player = this.getPlayer(playerId);
    if (!player) return null;

    // Initialize progress for bereich if not exists
    if (!player.progress[bereich]) {
      player.progress[bereich] = {
        level: 1,
        current_question: 1,
        experience: 0,
        best_score: 0,
        level_attempts: 0
      };
    }

    const progress = player.progress[bereich];
    const levelConfig = LEVEL_CONFIG[progress.level];

    const gameId = `${playerId}_${bereich}_${Date.now()}`;
    const game = {
      id: gameId,
      player_id: playerId,
      bereich,
      level: progress.level,
      mode,
      status: 'active',
      start_time: new Date(),
      current_question: 1,
      total_questions: 10,
      points: 0,
      base_points: levelConfig.baseScore,
      questions_answered: 0,
      correct_answers: 0,
      risk_questions_attempted: 0,
      risk_questions_correct: 0
    };

    this.games.set(gameId, game);
    this.saveData();
    return game;
  }

  // ===================================================
  // 📝 QUESTION PROCESSING
  // ===================================================

  processAnswer(gameId, questionId, answer, timeTaken) {
    const game = this.games.get(gameId);
    if (!game || game.status !== 'active') return null;

    const player = this.getPlayer(game.player_id);
    if (!player) return null;

    // Mock question data (in real app this would come from database)
    const question = {
      id: questionId,
      correct: Math.floor(Math.random() * 4), // Mock correct answer
      points_value: this.calculateQuestionPoints(game.current_question, game.level),
      type: 'default',
      position: game.current_question
    };

    const isCorrect = answer === question.correct;
    game.questions_answered++;

    let result;
    if (question.type === 'risk') {
      result = this.processRiskAnswer(game, question, answer, timeTaken);
    } else if (question.type === 'team') {
      result = this.processTeamAnswer(game, question, [answer], timeTaken);
    } else {
      result = this.processStandardAnswer(game, question, answer, timeTaken);
    }

    // Update player stats
    player.stats.total_questions++;
    if (isCorrect) {
      player.stats.correct_answers++;
      game.correct_answers++;
    }
    player.stats.accuracy = player.stats.correct_answers / player.stats.total_questions;

    // Check if game should continue
    if (game.current_question >= game.total_questions || result.level_reset) {
      const levelResult = this.completeLevel(game);
      result.level_result = levelResult;
      result.game_complete = true;
    } else {
      game.current_question++;
    }

    this.saveData();
    return {
      result,
      game_state: game,
      next_question: game.current_question <= game.total_questions ? this.generateNextQuestion(game) : null,
      game_complete: result.game_complete || false
    };
  }

  processStandardAnswer(game, question, answer, timeTaken) {
    const isCorrect = answer === question.correct;
    const questionPoints = question.points_value || this.calculateQuestionPoints(question.position, game.level);

    if (isCorrect) {
      // Speed bonus
      let speedBonus = 0;
      if (timeTaken < 10000) { // Under 10 seconds
        speedBonus = Math.floor(questionPoints * 0.2);
      }

      const totalPoints = questionPoints + speedBonus;
      game.points += totalPoints;

      return {
        type: 'standard',
        correct: true,
        points_earned: totalPoints,
        speed_bonus: speedBonus,
        total_points: game.points,
        explanation: `Richtig! ${questionPoints} Punkte ${speedBonus > 0 ? `+ ${speedBonus} Speed-Bonus` : ''}`,
        time_taken: timeTaken,
        stays_at_question: false
      };
    } else {
      // Wrong answer: point deduction
      const penalty = Math.floor(questionPoints * 0.1);
      game.points = Math.max(0, game.points - penalty);

      return {
        type: 'standard',
        correct: false,
        points_earned: -penalty,
        total_points: game.points,
        explanation: `Falsch! ${penalty} Punkte abgezogen.`,
        time_taken: timeTaken,
        stays_at_question: true // Repeat question
      };
    }
  }

  calculateQuestionPoints(position, level) {
    const basePoints = position * 10; // Frage 1=10, Frage 2=20, etc.
    const levelMultiplier = level; // Level 1=1x, Level 2=2x, etc.
    return basePoints * levelMultiplier;
  }

  generateNextQuestion(game) {
    // Mock question generation (in real app this would use MCP)
    return {
      id: `q_${game.id}_${game.current_question}`,
      question: `Beispielfrage ${game.current_question} für Level ${game.level}`,
      answers: ['Option A', 'Option B', 'Option C', 'Option D'],
      type: 'default',
      time_limit: 30
    };
  }

  // ===================================================
  // 🎖️ LEVEL & PROGRESS MANAGEMENT
  // ===================================================

  completeLevel(game) {
    const player = this.getPlayer(game.player_id);
    if (!player) return;

    // Level abgeschlossen: Fortschritt speichern
    const progress = player.progress[game.bereich];
    const canAdvance = this.canAdvanceToNextLevel(player, game.bereich);

    if (canAdvance && progress.level < 10) {
      // Advance to next level
      progress.level++;
      progress.current_question = 1;
      progress.level_attempts = 0;
    } else {
      // Stay in current level, reset to question 1
      progress.current_question = 1;
      progress.level_attempts++;
    }

    progress.experience += game.points;
    progress.best_score = Math.max(progress.best_score, game.points);
    
    // Update total points
    player.total_points += game.points;
    
    // Update statistics
    player.stats.total_quizzes++;
    
    // Check for badges
    this.checkLevelBadges(game.player_id, game.bereich, progress.level);
    
    // Update highscores
    this.updateHighscores(player, game);
    
    game.status = 'completed';
    game.level_completed = true;
    game.end_time = new Date();

    // ===================================================
    // 🎮 MINIGAME-BELOHNUNG SYSTEM
    // ===================================================
    
    // Verfügbare Minigames für dieses Level bestimmen
    const availableMinigames = this.getAvailableMinigames(progress.level);
    const shouldOfferMinigame = this.shouldOfferMinigame(game, progress);
    
    let minigameReward = null;
    if (shouldOfferMinigame && availableMinigames.length > 0) {
      minigameReward = {
        available: true,
        message: `🎉 Level ${progress.level} abgeschlossen! Spiele ein Minigame für Bonus-Punkte!`,
        games: availableMinigames.map(gameId => ({
          id: gameId,
          ...this.getMinigameInfo(gameId),
          estimated_reward: Math.floor(game.points * this.getMinigameInfo(gameId).reward_multiplier)
        })),
        timeLimit: 300, // 5 Minuten Zeit um Minigame zu starten
        levelCompleted: progress.level
      };

      // Markiere dass Minigame angeboten wurde
      progress.last_minigame_level = progress.level;
    }
    
    return {
      level_completed: true,
      advanced_to_next_level: canAdvance && progress.level < 10,
      current_level: progress.level,
      points_earned: game.points,
      total_player_points: player.total_points,
      message: canAdvance ? 
        `Level ${progress.level} erreicht!` : 
        `Level ${progress.level} wiederholen - UL-System analysiert Verbesserung.`,
      minigameReward: minigameReward
    };
  }

  canAdvanceToNextLevel(player, bereich) {
    const progress = player.progress[bereich];
    const stats = player.stats;
    
    // Einfache Logik: Weniger als 3 Versuche = Aufstieg
    if (progress.level_attempts < 2) {
      return true;
    }
    
    // UL-Cluster-basierte Entscheidung
    if (stats.ul_cluster === 'Typ_A' && stats.accuracy > 0.8) {
      return true;
    } else if (stats.ul_cluster === 'Typ_B' && stats.accuracy > 0.7) {
      return true;
    } else if (stats.ul_cluster === 'Typ_C' && stats.accuracy > 0.6) {
      return true;
    }
    
    return false;
  }

  // ===================================================
  // 🎮 MINIGAME-INTEGRATION
  // ===================================================

  getAvailableMinigames(level) {
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

    return LEVEL_MINIGAME_MAPPING[level] || ['memory_cards'];
  }

  shouldOfferMinigame(game, progress) {
    // 1. Mindestpunktzahl erreicht (70% des möglichen Scores)
    const minScoreThreshold = game.base_points * 0.7;
    if (game.points < minScoreThreshold) {
      return false;
    }

    // 2. Nicht zu oft hintereinander (max. jedes 2. Level)
    if (progress.last_minigame_level && progress.level - progress.last_minigame_level < 2) {
      return false;
    }

    // 3. Risiko-Level (5, 10) bekommen immer Minigames
    if ([5, 10].includes(progress.level)) {
      return true;
    }

    // 4. Erste 3 Level bekommen immer Minigames (Tutorial)
    if (progress.level <= 3) {
      return true;
    }

    // 5. Zufällige 60% Chance für andere Level
    return Math.random() < 0.6;
  }

  getMinigameInfo(gameId) {
    const MINIGAMES = {
      'memory_cards': {
        name: '🧠 Memory Karten',
        description: 'Finde alle Paare! Trainiere dein Gedächtnis mit fachbezogenen Begriffen.',
        duration: 60,
        difficulty_levels: ['easy', 'medium', 'hard'],
        reward_multiplier: 1.2,
        available_themes: ['hygiene', 'safety', 'compliance', 'teamwork']
      },
      'word_scramble': {
        name: '🔤 Wörter-Puzzle',
        description: 'Bringe die Buchstaben in die richtige Reihenfolge!',
        duration: 45,
        difficulty_levels: ['easy', 'medium', 'hard'],
        reward_multiplier: 1.1,
        available_themes: ['technical_terms', 'procedures', 'protocols']
      },
      'reaction_test': {
        name: '⚡ Reaktionstest',
        description: 'Wie schnell erkennst du richtige vs. falsche Aussagen?',
        duration: 30,
        difficulty_levels: ['easy', 'medium', 'hard'],
        reward_multiplier: 1.3,
        available_themes: ['safety_situations', 'emergency_procedures']
      },
      'puzzle_slider': {
        name: '🧩 Schiebe-Puzzle',
        description: 'Bringe das Bild in die richtige Reihenfolge!',
        duration: 90,
        difficulty_levels: ['easy', 'medium', 'hard'],
        reward_multiplier: 1.15,
        available_themes: ['workflow_diagrams', 'process_charts']
      }
    };

    return MINIGAMES[gameId] || MINIGAMES['memory_cards'];
  }

  // Minigame abgeschlossen - Belohnung verarbeiten
  processMinigameReward(playerId, gameId, score, timeSpent, accuracy, moves = 0) {
    const player = this.getPlayer(playerId);
    if (!player) return null;

    const gameInfo = this.getMinigameInfo(gameId);
    
    // Belohnung berechnen
    let baseReward = Math.floor(200 * gameInfo.reward_multiplier);
    let timeBonus = 0;
    let accuracyBonus = 0;
    let efficiencyBonus = 0;

    // Zeit-Bonus
    if (timeSpent < gameInfo.duration * 0.5) {
      timeBonus = Math.floor(baseReward * 0.3);
    } else if (timeSpent < gameInfo.duration * 0.7) {
      timeBonus = Math.floor(baseReward * 0.15);
    }

    // Genauigkeits-Bonus
    if (accuracy >= 0.95) {
      accuracyBonus = Math.floor(baseReward * 0.4);
    } else if (accuracy >= 0.85) {
      accuracyBonus = Math.floor(baseReward * 0.2);
    }

    // Effizienz-Bonus (bei Puzzle)
    if (gameId === 'puzzle_slider' && moves > 0) {
      const optimalMoves = 25;
      if (moves <= optimalMoves * 1.2) {
        efficiencyBonus = Math.floor(baseReward * 0.25);
      }
    }

    const totalReward = baseReward + timeBonus + accuracyBonus + efficiencyBonus;

    // Player-Punkte aktualisieren
    player.total_points += totalReward;
    player.current_points = (player.current_points || 0) + totalReward;

    // Minigame-Statistiken aktualisieren
    if (!player.minigame_stats) {
      player.minigame_stats = {};
    }
    
    if (!player.minigame_stats[gameId]) {
      player.minigame_stats[gameId] = {
        times_played: 0,
        best_score: 0,
        total_rewards: 0,
        best_time: Infinity
      };
    }

    const gameStats = player.minigame_stats[gameId];
    gameStats.times_played++;
    gameStats.best_score = Math.max(gameStats.best_score, score);
    gameStats.total_rewards += totalReward;
    gameStats.best_time = Math.min(gameStats.best_time, timeSpent);

    // Badge-Checks
    this.checkMinigameBadges(playerId, gameId, score, accuracy, timeSpent);

    // Ranking
    const ranking = this.getMinigameRanking(score, accuracy);

    this.saveData();

    return {
      totalReward,
      breakdown: {
        baseReward,
        timeBonus,
        accuracyBonus,
        efficiencyBonus
      },
      ranking,
      newTotalPoints: player.total_points,
      gameStats: gameStats
    };
  }

  // ===================================================
  // 🏆 BADGE SYSTEM
  // ===================================================

  awardBadge(playerId, badgeId) {
    const player = this.getPlayer(playerId);
    if (!player || player.badges.includes(badgeId)) return false;

    player.badges.push(badgeId);
    const badge = BADGE_DEFINITIONS[badgeId];
    if (badge) {
      player.total_points += badge.points;
    }

    this.saveData();
    return true;
  }

  checkLevelBadges(playerId, bereich, level) {
    const player = this.getPlayer(playerId);
    if (!player) return;

    // Level 5 badge
    if (level >= 5 && !player.badges.includes('level_5')) {
      this.awardBadge(playerId, 'level_5');
    }

    // Level 10 badge
    if (level >= 10 && !player.badges.includes('expert_certified')) {
      this.awardBadge(playerId, 'expert_certified');
    }

    // Multi Master badge
    const bereiche5Plus = Object.entries(player.progress)
      .filter(([_, progress]) => progress.level >= 5).length;
    
    if (bereiche5Plus >= 3 && !player.badges.includes('multi_master')) {
      this.awardBadge(playerId, 'multi_master');
    }

    // Quiz Master badge
    if (player.stats.total_quizzes >= 10 && !player.badges.includes('quiz_master')) {
      this.awardBadge(playerId, 'quiz_master');
    }
  }

  checkMinigameBadges(playerId, gameId, score, accuracy, timeSpent) {
    const player = this.getPlayer(playerId);
    if (!player) return;

    // Perfekte Leistung
    if (accuracy >= 0.95 && timeSpent < this.getMinigameInfo(gameId).duration * 0.5) {
      this.awardBadge(playerId, 'minigame_master');
    }

    // Speed-Demon
    if (timeSpent < this.getMinigameInfo(gameId).duration * 0.3) {
      this.awardBadge(playerId, 'speed_minigamer');
    }

    // Alle Minigames gespielt
    const playedGames = Object.keys(player.minigame_stats || {});
    if (playedGames.length >= 4) {
      this.awardBadge(playerId, 'minigame_explorer');
    }
  }

  getMinigameRanking(score, accuracy) {
    if (accuracy >= 0.95 && score >= 90) {
      return { rank: 'Platin', icon: '🏆', bonus: 50 };
    } else if (accuracy >= 0.85 && score >= 75) {
      return { rank: 'Gold', icon: '🥇', bonus: 30 };
    } else if (accuracy >= 0.70 && score >= 60) {
      return { rank: 'Silber', icon: '🥈', bonus: 20 };
    } else {
      return { rank: 'Bronze', icon: '🥉', bonus: 10 };
    }
  }

  // ===================================================
  // 📊 HIGHSCORES & STATISTICS
  // ===================================================

  updateHighscores(player, game) {
    const key = `${game.bereich}_level_${game.level}`;
    
    if (!this.highscores.has(key)) {
      this.highscores.set(key, []);
    }
    
    const scores = this.highscores.get(key);
    scores.push({
      player_id: player.id,
      username: player.username,
      score: game.points,
      accuracy: player.stats.accuracy,
      date: new Date()
    });
    
    // Keep top 10
    scores.sort((a, b) => b.score - a.score);
    this.highscores.set(key, scores.slice(0, 10));
    
    this.saveData();
  }

  getHighscores(type = 'global', filter = null) {
    const allScores = [];
    
    for (const [key, scores] of this.highscores) {
      if (filter && !key.includes(filter)) continue;
      allScores.push(...scores.map(score => ({ ...score, category: key })));
    }
    
    return allScores.sort((a, b) => b.score - a.score).slice(0, 10);
  }
}

// ===================================================
// 🚀 EXPORT
// ===================================================

module.exports = { GameEngine, BADGE_DEFINITIONS, LEVEL_CONFIG }; 
import { describe, it, expect, beforeEach } from '@jest/globals';

/**
 * Bonusgame System Unit Tests
 * Tests für +5000 Punkte Bonus und Life Cap von 5
 */

interface BonusGame {
  id: string;
  userId: string;
  type: 'memory_cards' | 'word_scramble' | 'reaction_test' | 'puzzle_slider';
  difficulty: 'easy' | 'medium' | 'hard';
  score: number;
  completed: boolean;
  pointsEarned: number;
  livesEarned: number;
}

interface UserGameState {
  userId: string;
  lives: number;
  bonusLives: number;
  maxLives: number;
  points: number;
  completedBonusGames: string[];
}

class BonusGameSystem {
  private userStates: Map<string, UserGameState> = new Map();
  
  private readonly BONUS_POINTS = 5000;
  private readonly MAX_LIVES = 5;
  private readonly LIFE_CAP = 5;
  
  // Punktmultiplikatoren basierend auf Schwierigkeit
  private readonly DIFFICULTY_MULTIPLIERS = {
    easy: 0.5,
    medium: 1.0,
    hard: 1.5
  };
  
  /**
   * Initialisiert oder holt User-State
   */
  private getUserState(userId: string): UserGameState {
    let state = this.userStates.get(userId);
    
    if (!state) {
      state = {
        userId,
        lives: 3, // Standard: 3 Lives
        bonusLives: 0,
        maxLives: this.MAX_LIVES,
        points: 0,
        completedBonusGames: []
      };
      this.userStates.set(userId, state);
    }
    
    return state;
  }
  
  /**
   * Startet ein Bonusgame
   */
  startBonusGame(
    userId: string,
    type: BonusGame['type'],
    difficulty: BonusGame['difficulty']
  ): BonusGame {
    const gameId = `${type}_${Date.now()}`;
    
    return {
      id: gameId,
      userId,
      type,
      difficulty,
      score: 0,
      completed: false,
      pointsEarned: 0,
      livesEarned: 0
    };
  }
  
  /**
   * Beendet ein Bonusgame und vergibt Belohnungen
   */
  completeBonusGame(
    userId: string,
    gameId: string,
    score: number,
    maxScore: number
  ): {
    bonusGame: BonusGame;
    userState: UserGameState;
    rewards: {
      points: number;
      lives: number;
      bonusPoints: number;
    };
  } {
    const state = this.getUserState(userId);
    
    // Prüfe ob bereits abgeschlossen
    if (state.completedBonusGames.includes(gameId)) {
      throw new Error('bonus_game_already_completed');
    }
    
    // Berechne Performance-Prozentsatz
    const performance = Math.min(score / maxScore, 1.0);
    
    // Berechne Punkte basierend auf Performance
    const basePoints = this.BONUS_POINTS;
    const earnedPoints = Math.floor(basePoints * performance);
    
    // Leben-Belohnung: 1 Life bei ≥80% Performance
    let livesEarned = 0;
    const currentTotalLives = state.lives + state.bonusLives;
    
    if (performance >= 0.8 && currentTotalLives < this.LIFE_CAP) {
      livesEarned = 1;
      state.bonusLives++;
    }
    
    // Enforce Life Cap
    const totalLives = state.lives + state.bonusLives;
    if (totalLives > this.LIFE_CAP) {
      const excess = totalLives - this.LIFE_CAP;
      state.bonusLives -= excess;
      livesEarned = Math.max(0, livesEarned - excess);
    }
    
    // Extra-Bonus bei perfekter Performance (100%)
    const bonusPoints = performance === 1.0 ? 1000 : 0;
    const totalPoints = earnedPoints + bonusPoints;
    
    // Update User State
    state.points += totalPoints;
    state.completedBonusGames.push(gameId);
    
    const bonusGame: BonusGame = {
      id: gameId,
      userId,
      type: 'memory_cards', // Typ sollte aus Game-Context kommen
      difficulty: 'medium',
      score,
      completed: true,
      pointsEarned: totalPoints,
      livesEarned
    };
    
    return {
      bonusGame,
      userState: { ...state },
      rewards: {
        points: earnedPoints,
        lives: livesEarned,
        bonusPoints
      }
    };
  }
  
  /**
   * Gibt aktuellen User-State zurück
   */
  getUserGameState(userId: string): UserGameState {
    return { ...this.getUserState(userId) };
  }
  
  /**
   * Verliert ein Leben
   */
  loseLife(userId: string): UserGameState {
    const state = this.getUserState(userId);
    
    // Zuerst Bonus-Lives aufbrauchen
    if (state.bonusLives > 0) {
      state.bonusLives--;
    } else if (state.lives > 0) {
      state.lives--;
    }
    
    return { ...state };
  }
  
  /**
   * Reset für Tests
   */
  reset(userId: string): void {
    this.userStates.delete(userId);
  }
}

describe('Bonusgame System', () => {
  let bonusSystem: BonusGameSystem;
  const testUserId = 'user123';
  
  beforeEach(() => {
    bonusSystem = new BonusGameSystem();
  });
  
  describe('Bonusgame Start', () => {
    it('sollte ein Bonusgame korrekt initialisieren', () => {
      const game = bonusSystem.startBonusGame(testUserId, 'memory_cards', 'medium');
      
      expect(game.id).toBeDefined();
      expect(game.userId).toBe(testUserId);
      expect(game.type).toBe('memory_cards');
      expect(game.difficulty).toBe('medium');
      expect(game.score).toBe(0);
      expect(game.completed).toBe(false);
      expect(game.pointsEarned).toBe(0);
      expect(game.livesEarned).toBe(0);
    });
    
    it('sollte verschiedene Bonusgame-Typen unterstützen', () => {
      const types: Array<BonusGame['type']> = [
        'memory_cards',
        'word_scramble',
        'reaction_test',
        'puzzle_slider'
      ];
      
      types.forEach(type => {
        const game = bonusSystem.startBonusGame(testUserId, type, 'easy');
        expect(game.type).toBe(type);
      });
    });
  });
  
  describe('Punktvergabe (+5000 Basis)', () => {
    it('sollte 5000 Punkte bei 100% Performance vergeben', () => {
      const game = bonusSystem.startBonusGame(testUserId, 'memory_cards', 'medium');
      const result = bonusSystem.completeBonusGame(testUserId, game.id, 100, 100);
      
      expect(result.rewards.points).toBe(5000);
      expect(result.userState.points).toBe(6000); // 5000 + 1000 Bonus
    });
    
    it('sollte 1000 Extra-Bonus-Punkte bei perfekter Performance vergeben', () => {
      const game = bonusSystem.startBonusGame(testUserId, 'memory_cards', 'medium');
      const result = bonusSystem.completeBonusGame(testUserId, game.id, 100, 100);
      
      expect(result.rewards.bonusPoints).toBe(1000);
      expect(result.bonusGame.pointsEarned).toBe(6000); // 5000 + 1000
    });
    
    it('sollte Punkte proportional zur Performance vergeben', () => {
      const game = bonusSystem.startBonusGame(testUserId, 'memory_cards', 'medium');
      
      // 50% Performance = 2500 Punkte (50% von 5000)
      const result = bonusSystem.completeBonusGame(testUserId, game.id, 50, 100);
      
      expect(result.rewards.points).toBe(2500);
      expect(result.rewards.bonusPoints).toBe(0); // Kein Bonus bei < 100%
    });
    
    it('sollte Punkte bei 80% Performance korrekt berechnen', () => {
      const game = bonusSystem.startBonusGame(testUserId, 'memory_cards', 'medium');
      const result = bonusSystem.completeBonusGame(testUserId, game.id, 80, 100);
      
      expect(result.rewards.points).toBe(4000); // 80% von 5000
    });
    
    it('sollte Punkte bei niedriger Performance korrekt berechnen', () => {
      const game = bonusSystem.startBonusGame(testUserId, 'memory_cards', 'medium');
      const result = bonusSystem.completeBonusGame(testUserId, game.id, 10, 100);
      
      expect(result.rewards.points).toBe(500); // 10% von 5000
    });
  });
  
  describe('Leben-System (Cap = 5)', () => {
    it('sollte ein zusätzliches Leben bei ≥80% Performance vergeben', () => {
      const game = bonusSystem.startBonusGame(testUserId, 'memory_cards', 'medium');
      const result = bonusSystem.completeBonusGame(testUserId, game.id, 80, 100);
      
      expect(result.rewards.lives).toBe(1);
      expect(result.userState.bonusLives).toBe(1);
    });
    
    it('sollte kein zusätzliches Leben bei <80% Performance vergeben', () => {
      const game = bonusSystem.startBonusGame(testUserId, 'memory_cards', 'medium');
      const result = bonusSystem.completeBonusGame(testUserId, game.id, 79, 100);
      
      expect(result.rewards.lives).toBe(0);
      expect(result.userState.bonusLives).toBe(0);
    });
    
    it('sollte Life Cap von 5 einhalten', () => {
      // Starte mit 3 Lives, füge 3 Bonus-Lives hinzu (würde 6 ergeben)
      const games = [
        bonusSystem.startBonusGame(testUserId, 'memory_cards', 'easy'),
        bonusSystem.startBonusGame(testUserId, 'word_scramble', 'easy'),
        bonusSystem.startBonusGame(testUserId, 'reaction_test', 'easy')
      ];
      
      games.forEach((game, index) => {
        if (index < 2) {
          bonusSystem.completeBonusGame(testUserId, game.id, 100, 100);
        }
      });
      
      const finalResult = bonusSystem.completeBonusGame(testUserId, games[2].id, 100, 100);
      
      const totalLives = finalResult.userState.lives + finalResult.userState.bonusLives;
      expect(totalLives).toBeLessThanOrEqual(5);
    });
    
    it('sollte keine Leben vergeben wenn Cap bereits erreicht', () => {
      // Erreiche Life Cap
      const games = [
        bonusSystem.startBonusGame(testUserId, 'memory_cards', 'easy'),
        bonusSystem.startBonusGame(testUserId, 'word_scramble', 'easy')
      ];
      
      bonusSystem.completeBonusGame(testUserId, games[0].id, 100, 100);
      bonusSystem.completeBonusGame(testUserId, games[1].id, 100, 100);
      
      // Sollte jetzt bei 5 Lives sein (3 + 2)
      const state = bonusSystem.getUserGameState(testUserId);
      expect(state.lives + state.bonusLives).toBe(5);
      
      // Versuche weiteres Leben zu verdienen
      const game3 = bonusSystem.startBonusGame(testUserId, 'reaction_test', 'easy');
      const result = bonusSystem.completeBonusGame(testUserId, game3.id, 100, 100);
      
      expect(result.rewards.lives).toBe(0);
      expect(result.userState.lives + result.userState.bonusLives).toBe(5);
    });
  });
  
  describe('Leben-Verlust', () => {
    it('sollte Bonus-Lives zuerst aufbrauchen', () => {
      // Verdiene Bonus-Life
      const game = bonusSystem.startBonusGame(testUserId, 'memory_cards', 'easy');
      bonusSystem.completeBonusGame(testUserId, game.id, 100, 100);
      
      const stateBefore = bonusSystem.getUserGameState(testUserId);
      expect(stateBefore.bonusLives).toBe(1);
      expect(stateBefore.lives).toBe(3);
      
      // Verliere ein Leben
      const stateAfter = bonusSystem.loseLife(testUserId);
      
      expect(stateAfter.bonusLives).toBe(0); // Bonus-Life aufgebraucht
      expect(stateAfter.lives).toBe(3); // Regular Lives intakt
    });
    
    it('sollte Regular Lives nach Bonus-Lives aufbrauchen', () => {
      // Verliere Leben ohne Bonus-Lives
      const state1 = bonusSystem.loseLife(testUserId);
      expect(state1.lives).toBe(2);
      
      const state2 = bonusSystem.loseLife(testUserId);
      expect(state2.lives).toBe(1);
    });
  });
  
  describe('Bonusgame Completion', () => {
    it('sollte verhindern dass ein Bonusgame mehrfach abgeschlossen wird', () => {
      const game = bonusSystem.startBonusGame(testUserId, 'memory_cards', 'medium');
      bonusSystem.completeBonusGame(testUserId, game.id, 100, 100);
      
      expect(() => {
        bonusSystem.completeBonusGame(testUserId, game.id, 100, 100);
      }).toThrow('bonus_game_already_completed');
    });
    
    it('sollte mehrere verschiedene Bonusgames nacheinander erlauben', () => {
      const game1 = bonusSystem.startBonusGame(testUserId, 'memory_cards', 'easy');
      const game2 = bonusSystem.startBonusGame(testUserId, 'word_scramble', 'medium');
      
      const result1 = bonusSystem.completeBonusGame(testUserId, game1.id, 100, 100);
      const result2 = bonusSystem.completeBonusGame(testUserId, game2.id, 100, 100);
      
      expect(result1.bonusGame.completed).toBe(true);
      expect(result2.bonusGame.completed).toBe(true);
      expect(result2.userState.completedBonusGames).toHaveLength(2);
    });
  });
  
  describe('User State Management', () => {
    it('sollte initial 3 Lives haben', () => {
      const state = bonusSystem.getUserGameState(testUserId);
      
      expect(state.lives).toBe(3);
      expect(state.bonusLives).toBe(0);
      expect(state.maxLives).toBe(5);
    });
    
    it('sollte Punkte korrekt akkumulieren', () => {
      const game1 = bonusSystem.startBonusGame(testUserId, 'memory_cards', 'easy');
      bonusSystem.completeBonusGame(testUserId, game1.id, 50, 100);
      
      const game2 = bonusSystem.startBonusGame(testUserId, 'word_scramble', 'easy');
      bonusSystem.completeBonusGame(testUserId, game2.id, 100, 100);
      
      const state = bonusSystem.getUserGameState(testUserId);
      
      expect(state.points).toBe(2500 + 6000); // 50% + 100% (mit Bonus)
    });
  });
  
  describe('Edge Cases', () => {
    it('sollte mit Score 0 korrekt umgehen', () => {
      const game = bonusSystem.startBonusGame(testUserId, 'memory_cards', 'easy');
      const result = bonusSystem.completeBonusGame(testUserId, game.id, 0, 100);
      
      expect(result.rewards.points).toBe(0);
      expect(result.rewards.lives).toBe(0);
      expect(result.rewards.bonusPoints).toBe(0);
    });
    
    it('sollte mit Score > maxScore korrekt umgehen (cap bei 100%)', () => {
      const game = bonusSystem.startBonusGame(testUserId, 'memory_cards', 'easy');
      const result = bonusSystem.completeBonusGame(testUserId, game.id, 150, 100);
      
      // Sollte bei 100% Performance gecapped sein
      expect(result.rewards.points).toBe(5000);
      expect(result.rewards.bonusPoints).toBe(1000);
    });
    
    it('sollte verschiedene User separat verwalten', () => {
      const user1 = 'user1';
      const user2 = 'user2';
      
      const game1 = bonusSystem.startBonusGame(user1, 'memory_cards', 'easy');
      const game2 = bonusSystem.startBonusGame(user2, 'word_scramble', 'easy');
      
      bonusSystem.completeBonusGame(user1, game1.id, 100, 100);
      bonusSystem.completeBonusGame(user2, game2.id, 50, 100);
      
      const state1 = bonusSystem.getUserGameState(user1);
      const state2 = bonusSystem.getUserGameState(user2);
      
      expect(state1.points).toBe(6000);
      expect(state2.points).toBe(2500);
    });
  });
});


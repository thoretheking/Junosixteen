/**
 * Reasoning Repository
 * Manages learning hypotheses, patterns, and adaptive notes
 */

import { Hypothesis, World, Difficulty } from '../common/types.js';
import { PolicyConfig } from '../hrm/policy.loader.js';

export interface HypothesisInit {
  startDifficulty: Difficulty;
}

export class ReasoningRepo {
  private hypotheses: Map<string, Hypothesis> = new Map();
  private userNotes: Map<string, string[]> = new Map();

  /**
   * Write new hypothesis
   */
  async writeHypothesis(
    userId: string,
    hypothesisId: string,
    policy: PolicyConfig,
    init: HypothesisInit
  ): Promise<Hypothesis> {
    const now = new Date().toISOString();

    const hypothesis: Hypothesis = {
      id: hypothesisId,
      userId,
      missionId: policy.world, // Using world as mission identifier for now
      world: policy.world,
      difficulty: init.startDifficulty,
      startedAt: now,
      updatedAt: now,
      signals: {
        scoreAvg: 0,
        helpRate: 0,
        difficultyAdj: 0,
        fatigue: false,
        guessPattern: false,
      },
      notes: [`Initial hypothesis: difficulty=${init.startDifficulty}`],
    };

    this.hypotheses.set(hypothesisId, hypothesis);
    return hypothesis;
  }

  /**
   * Get hypothesis by ID
   */
  async getHypothesis(hypothesisId: string): Promise<Hypothesis | null> {
    return this.hypotheses.get(hypothesisId) || null;
  }

  /**
   * Update hypothesis with new signals
   */
  async updateHypothesis(hypothesisId: string, signals: Partial<Hypothesis['signals']>): Promise<Hypothesis> {
    const hypothesis = await this.getHypothesis(hypothesisId);
    if (!hypothesis) {
      throw new Error(`Hypothesis not found: ${hypothesisId}`);
    }

    // Merge signals
    hypothesis.signals = {
      ...hypothesis.signals,
      ...signals,
    };

    // Adjust difficulty based on signals
    if (signals.difficultyAdj) {
      const difficultyLevels: Difficulty[] = ['easy', 'medium', 'hard'];
      const currentIdx = difficultyLevels.indexOf(hypothesis.difficulty);
      const newIdx = Math.max(0, Math.min(2, currentIdx + signals.difficultyAdj));
      const newDifficulty = difficultyLevels[newIdx];

      if (newDifficulty !== hypothesis.difficulty) {
        hypothesis.notes.push(
          `Difficulty adjusted: ${hypothesis.difficulty} → ${newDifficulty} (avg: ${signals.scoreAvg?.toFixed(2)})`
        );
        hypothesis.difficulty = newDifficulty;
      }
    }

    // Add pattern notes
    if (signals.guessPattern) {
      hypothesis.notes.push('⚠️ Detected guessing pattern - user rushing through questions');
    }
    if (signals.fatigue) {
      hypothesis.notes.push('😴 Fatigue detected - performance declining');
    }

    hypothesis.updatedAt = new Date().toISOString();
    this.hypotheses.set(hypothesisId, hypothesis);

    return hypothesis;
  }

  /**
   * Add reasoning note for user
   */
  async addNote(userId: string, note: string): Promise<void> {
    const notes = this.userNotes.get(userId) || [];
    notes.push(`[${new Date().toISOString()}] ${note}`);
    this.userNotes.set(userId, notes);
  }

  /**
   * Get user notes
   */
  async getNotes(userId: string): Promise<string[]> {
    return this.userNotes.get(userId) || [];
  }

  /**
   * Get user hypotheses
   */
  async getUserHypotheses(userId: string): Promise<Hypothesis[]> {
    const results: Hypothesis[] = [];
    
    for (const hypothesis of this.hypotheses.values()) {
      if (hypothesis.userId === userId) {
        results.push(hypothesis);
      }
    }

    return results.sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  /**
   * Detect learning patterns
   */
  async detectPatterns(userId: string, world: World): Promise<string[]> {
    const hypotheses = await this.getUserHypotheses(userId);
    const worldHypotheses = hypotheses.filter(h => h.world === world);

    const patterns: string[] = [];

    // Pattern 1: Consistent difficulty struggles
    const hardCount = worldHypotheses.filter(h => h.difficulty === 'hard').length;
    if (hardCount > 3) {
      patterns.push(`User excels at ${world} - consistently on hard difficulty`);
    }

    // Pattern 2: Frequent fatigue
    const fatigueCount = worldHypotheses.filter(h => h.signals.fatigue).length;
    if (fatigueCount > 2) {
      patterns.push(`User shows fatigue in ${world} - consider shorter sessions`);
    }

    // Pattern 3: Guessing pattern
    const guessCount = worldHypotheses.filter(h => h.signals.guessPattern).length;
    if (guessCount > 2) {
      patterns.push(`User tends to guess in ${world} - needs more guidance`);
    }

    return patterns;
  }
}



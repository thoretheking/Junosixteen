/**
 * Progress Repository
 * Manages mission progress, attempts, and history
 */

import { ProgressRecord, AttemptRecord } from '../common/types.js';

export class ProgressRepo {
  private progress: Map<string, ProgressRecord> = new Map();

  /**
   * Generate key for progress record
   */
  private getKey(userId: string, missionId: string): string {
    return `${userId}:${missionId}`;
  }

  /**
   * Get progress for a mission
   */
  async getProgress(userId: string, missionId: string): Promise<ProgressRecord | null> {
    const key = this.getKey(userId, missionId);
    return this.progress.get(key) || null;
  }

  /**
   * Start new mission progress
   */
  async startProgress(userId: string, missionId: string, livesStart: number): Promise<ProgressRecord> {
    const key = this.getKey(userId, missionId);
    
    const record: ProgressRecord = {
      userId,
      missionId,
      lives: livesStart,
      points: 0,
      questionIndex: 1,
      finished: false,
      success: false,
      history: [],
      startedAt: new Date().toISOString(),
    };

    this.progress.set(key, record);
    return record;
  }

  /**
   * Append attempt to history
   */
  async appendAttempt(
    userId: string,
    missionId: string,
    questId: string,
    attempt: Omit<AttemptRecord, 'questId' | 'attemptedAt'>
  ): Promise<ProgressRecord> {
    const record = await this.getProgress(userId, missionId);
    if (!record) {
      throw new Error(`No progress found for ${userId}:${missionId}`);
    }

    const attemptRecord: AttemptRecord = {
      questId,
      ...attempt,
      attemptedAt: new Date().toISOString(),
    };

    record.history.push(attemptRecord);
    record.points += attempt.scoreDelta;
    
    // Update lives if challenge failed
    if (attempt.challengeOutcome === 'fail') {
      record.lives = Math.max(0, record.lives - 1);
    }

    // Move to next question if correct or challenge succeeded
    if (attempt.correct || attempt.challengeOutcome === 'success') {
      record.questionIndex += 1;
    }

    this.progress.set(this.getKey(userId, missionId), record);
    return record;
  }

  /**
   * Finish mission
   */
  async finishProgress(userId: string, missionId: string, success: boolean): Promise<ProgressRecord> {
    const record = await this.getProgress(userId, missionId);
    if (!record) {
      throw new Error(`No progress found for ${userId}:${missionId}`);
    }

    record.finished = true;
    record.success = success;
    record.finishedAt = new Date().toISOString();

    this.progress.set(this.getKey(userId, missionId), record);
    return record;
  }

  /**
   * Add life (from bonus game)
   */
  async addLife(userId: string, missionId: string, lifeCap: number): Promise<number> {
    const record = await this.getProgress(userId, missionId);
    if (!record) {
      throw new Error(`No progress found for ${userId}:${missionId}`);
    }

    record.lives = Math.min(record.lives + 1, lifeCap);
    this.progress.set(this.getKey(userId, missionId), record);

    return record.lives;
  }

  /**
   * Get user's mission history
   */
  async getUserHistory(userId: string): Promise<ProgressRecord[]> {
    const records: ProgressRecord[] = [];
    
    for (const [key, record] of this.progress.entries()) {
      if (record.userId === userId) {
        records.push(record);
      }
    }

    return records.sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  /**
   * Calculate statistics
   */
  async getStats(userId: string, missionId: string): Promise<{
    scoreAvg: number;
    helpRate: number;
    totalAttempts: number;
    correctAttempts: number;
  }> {
    const record = await this.getProgress(userId, missionId);
    if (!record || record.history.length === 0) {
      return {
        scoreAvg: 0,
        helpRate: 0,
        totalAttempts: 0,
        correctAttempts: 0,
      };
    }

    const totalAttempts = record.history.length;
    const correctAttempts = record.history.filter(a => a.correct).length;
    const helpUsedCount = record.history.filter(a => a.helpUsed).length;
    const scoreSum = record.history.reduce((sum, a) => sum + a.score, 0);

    return {
      scoreAvg: scoreSum / totalAttempts,
      helpRate: helpUsedCount / totalAttempts,
      totalAttempts,
      correctAttempts,
    };
  }
}



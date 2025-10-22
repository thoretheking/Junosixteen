/**
 * Points Service
 * Calculates points based on performance, quest type, and context
 */

import { TRMEvalRequest, QKind } from '../common/types.js';
import { PolicyConfig } from '../hrm/policy.loader.js';

export class PointsService {
  /**
   * Calculate points for a quest based on type and performance
   */
  forQuest(req: TRMEvalRequest, score: number, policy?: PolicyConfig): number {
    // Default base points if no policy provided
    const basePoints = {
      standard: 200,
      risk: 400,
      team: 300,
    };

    // Use policy points if available
    const points = policy?.gamification.base_points || basePoints;

    // Determine quest type from questId
    const questKind = this.detectQuestKind(req.questId);
    let base = points[questKind];

    // Apply score multiplier (0.5 - 1.0)
    const scoreMultiplier = Math.max(0.5, Math.min(1.0, score));
    let total = base * scoreMultiplier;

    // Bonus for perfect score
    if (score >= 1.0 && !req.result.helpUsed) {
      total *= 1.2; // 20% bonus for perfect + no help
    }

    // Time bonus (answered quickly)
    if (req.result.timeMs < 10000 && req.result.correct) {
      const timeBonus = Math.max(0, 50 - Math.floor(req.result.timeMs / 200));
      total += timeBonus;
    }

    // Challenge success bonus
    if (req.result.challengeOutcome === 'success') {
      total += 100; // Bonus for overcoming challenge
    }

    // Penalty for guessing pattern (detected in signals)
    // This will be applied by TRM based on telemetry

    return Math.round(total);
  }

  /**
   * Calculate bonus minigame points
   */
  forBonusGame(success: boolean, policy?: PolicyConfig): number {
    if (!success) return 0;

    const bonusPoints = policy?.gamification.bonus_minigame.points || 5000;
    return bonusPoints;
  }

  /**
   * Calculate team quest multiplier
   */
  teamMultiplier(teamSuccessRate: number): number {
    // x3 if team success rate > 50%
    if (teamSuccessRate > 0.5) {
      return 3;
    }
    // x1.5 if team success rate > 25%
    if (teamSuccessRate > 0.25) {
      return 1.5;
    }
    return 1;
  }

  /**
   * Detect quest kind from questId
   */
  private detectQuestKind(questId: string): QKind {
    if (questId.includes('risk') || questId.includes('q5') || questId.includes('q10')) {
      return 'risk';
    }
    if (questId.includes('team') || questId.includes('q9')) {
      return 'team';
    }
    return 'standard';
  }

  /**
   * Calculate diminishing returns for rapid answers
   */
  applyDiminishingReturns(basePoints: number, rapidAnswerCount: number): number {
    if (rapidAnswerCount <= 1) return basePoints;

    // Reduce points by 10% for each rapid answer after the first
    const reduction = Math.min(0.5, (rapidAnswerCount - 1) * 0.1);
    return Math.round(basePoints * (1 - reduction));
  }

  /**
   * Calculate streak bonus
   */
  streakBonus(streak: number): number {
    if (streak < 3) return 0;
    if (streak < 5) return 50;
    if (streak < 10) return 100;
    return 200; // 10+ streak
  }
}



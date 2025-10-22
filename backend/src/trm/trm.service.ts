/**
 * TRM Service - Executor & Evaluator ("System 1")
 * Generates/parameterizes micro-tasks, provides immediate feedback
 */

import { TRMEvalRequest, TRMEvalResponse, ConvergeHint } from '../common/types.js';
import { RubricService } from './rubric.js';
import { PointsService } from '../gamification/points.service.js';
import { ProgressRepo } from '../memory/repo.progress.js';
import { PolicyLoader } from '../hrm/policy.loader.js';

export class TRMService {
  constructor(
    private readonly rubricService: RubricService,
    private readonly pointsService: PointsService,
    private readonly progressRepo: ProgressRepo,
    private readonly policyLoader: PolicyLoader
  ) {}

  /**
   * Evaluate answer and provide feedback
   */
  async eval(req: TRMEvalRequest): Promise<TRMEvalResponse> {
    // Score the attempt
    const { score, microTip, signals } = this.rubricService.score(req);

    // Get policy for points calculation (optional - could be cached)
    let policy = undefined;
    try {
      // Extract world from missionId (simplified)
      const world = this.extractWorldFromMissionId(req.missionId);
      if (world) {
        policy = await this.policyLoader.forWorld(world);
      }
    } catch (e) {
      console.warn('Could not load policy for points calculation:', e);
    }

    // Calculate points
    const delta = this.pointsService.forQuest(req, score, policy);

    // Store attempt in progress
    try {
      await this.progressRepo.appendAttempt(
        req.userId,
        req.missionId,
        req.questId,
        {
          selectedOptionId: req.result.selectedOptionId,
          correct: req.result.correct,
          timeMs: req.result.timeMs,
          score,
          scoreDelta: delta,
          helpUsed: req.result.helpUsed || false,
          challengeOutcome: req.result.challengeOutcome,
          telemetry: req.telemetry,
        }
      );
    } catch (e) {
      console.error('Failed to store attempt:', e);
      // Continue - this is not critical for response
    }

    // Determine converge hint for HRM
    const convergeHint = this.convergeHint(score, signals);

    return {
      microFeedback: microTip,
      scoreDelta: delta,
      signals,
      convergeHint,
    };
  }

  /**
   * Determine converge hint for HRM based on performance
   */
  private convergeHint(score: number, signals: any): ConvergeHint {
    // Raise difficulty if performing well
    if (score > 0.85 && !signals.fatigue && !signals.guessPattern) {
      return 'raise';
    }

    // Lower difficulty if struggling
    if (score < 0.55 || signals.fatigue) {
      return 'lower';
    }

    // Keep current level
    return 'keep';
  }

  /**
   * Extract world from mission ID
   * Simple heuristic - in production, query from database
   */
  private extractWorldFromMissionId(missionId: string): any {
    const worldKeywords = {
      health: ['health', 'cleanroom', 'medical', 'hygiene'],
      it: ['it', 'cyber', 'security', 'tech'],
      legal: ['legal', 'law', 'dsgvo', 'compliance'],
      public: ['public', 'citizen', 'service', 'administration'],
      factory: ['factory', 'safety', 'production', 'industrial'],
    };

    const lowerMissionId = missionId.toLowerCase();

    for (const [world, keywords] of Object.entries(worldKeywords)) {
      if (keywords.some(kw => lowerMissionId.includes(kw))) {
        return world;
      }
    }

    return 'health'; // Default fallback
  }

  /**
   * Get mission statistics and aggregate signals
   */
  async getMissionStats(userId: string, missionId: string): Promise<any> {
    const stats = await this.progressRepo.getStats(userId, missionId);
    const progress = await this.progressRepo.getProgress(userId, missionId);

    if (!progress) {
      return null;
    }

    // Calculate aggregate signals
    const aggregateSignals = this.rubricService.calculateAggregateSignals(
      progress.history
    );

    return {
      ...stats,
      aggregateSignals,
      currentLives: progress.lives,
      currentPoints: progress.points,
      currentIndex: progress.questionIndex,
    };
  }
}



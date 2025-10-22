/**
 * HRM Service with Mangle Integration
 * Enhanced Orchestrator using Google Mangle for complex policy decisions
 */

import { HRMService } from './hrm.service.js';
import { 
  HRMPlanRequest, 
  HRMPlanResponse,
  Difficulty,
  World
} from '../common/types.js';
import { PolicyLoader } from './policy.loader.js';
import { ReasoningRepo } from '../memory/repo.reasoning.js';
import { ProgressRepo } from '../memory/repo.progress.js';
import { UsersRepo } from '../memory/repo.users.js';

// Import Mangle Engine
import { getMangleEngine } from '../../mangle-engine.js';

export class HRMMangleService extends HRMService {
  constructor(
    policyLoader: PolicyLoader,
    reasoningRepo: ReasoningRepo,
    private readonly progressRepo: ProgressRepo,
    private readonly usersRepo: UsersRepo
  ) {
    super(policyLoader, reasoningRepo);
  }

  /**
   * Plan with Mangle-enhanced ZPD decisions
   */
  async plan(req: HRMPlanRequest): Promise<HRMPlanResponse> {
    try {
      // Get Mangle-determined difficulty
      const mangleDifficulty = await this.getMangleDifficulty(req);
      
      // Override difficulty if Mangle suggests different
      const enhancedReq = {
        ...req,
        context: {
          ...req.context,
          difficulty: mangleDifficulty || req.context?.difficulty,
        },
      };

      console.log(`🧠 Mangle ZPD Decision: ${mangleDifficulty} (requested: ${req.context?.difficulty || 'auto'})`);

      // Call parent plan with Mangle-enhanced request
      return await super.plan(enhancedReq);
    } catch (error) {
      console.error('❌ Mangle integration error, falling back to standard HRM:', error);
      // Fallback to standard HRM if Mangle fails
      return await super.plan(req);
    }
  }

  /**
   * Get difficulty recommendation from Mangle
   */
  private async getMangleDifficulty(req: HRMPlanRequest): Promise<Difficulty | null> {
    const engine = getMangleEngine();

    try {
      // Reset engine for fresh analysis
      engine.reset();

      // Gather user data
      const userHistory = await this.progressRepo.getUserHistory(req.userId);
      const user = await this.usersRepo.getUser(req.userId);
      const worldHistory = userHistory.filter(h => h.missionId.includes(req.goal.world));

      // Add facts to Mangle
      this.addUserFacts(engine, req.userId, user, worldHistory);
      this.addWorldFacts(engine, req.goal.world);
      this.addContextFacts(engine, req);

      // Add ZPD decision rules
      this.addZPDRules(engine);

      // Query Mangle for difficulty recommendation
      const result = await engine.query(`recommend_difficulty("${req.userId}", "${req.goal.world}", D).`);

      if (result.results && result.results.length > 0) {
        const difficulty = result.results[0].D as Difficulty;
        console.log(`🧠 Mangle recommends: ${difficulty}`);
        
        // Store reasoning
        await this.reasoningRepo.addNote(
          req.userId,
          `Mangle ZPD: ${difficulty} (world: ${req.goal.world}, history: ${worldHistory.length} missions)`
        );

        return difficulty;
      }

      return null;
    } catch (error) {
      console.error('Mangle query failed:', error);
      return null;
    }
  }

  /**
   * Add user-related facts to Mangle
   */
  private addUserFacts(engine: any, userId: string, user: any, history: any[]): void {
    // User level based on total missions completed
    const completedMissions = history.filter(h => h.finished && h.success).length;
    engine.addFact(`user_missions_${userId}`, `user_missions_completed("${userId}", ${completedMissions}).`);

    // User performance metrics
    if (user) {
      engine.addFact(`user_points_${userId}`, `user_total_points("${userId}", ${user.totalPoints}).`);
      engine.addFact(`user_streak_${userId}`, `user_streak("${userId}", ${user.streak}).`);
    }

    // Recent performance (last 5 missions)
    const recentMissions = history.slice(0, 5);
    const recentSuccessRate = recentMissions.length > 0
      ? recentMissions.filter(h => h.success).length / recentMissions.length
      : 0;

    engine.addFact(`user_recent_success_${userId}`, 
      `user_recent_success_rate("${userId}", ${recentSuccessRate.toFixed(2)}).`);

    // Average score from recent missions
    const avgScore = this.calculateAverageScore(recentMissions);
    engine.addFact(`user_avg_score_${userId}`, 
      `user_avg_score("${userId}", ${avgScore.toFixed(2)}).`);

    // Help usage rate
    const helpRate = this.calculateHelpRate(recentMissions);
    engine.addFact(`user_help_rate_${userId}`, 
      `user_help_rate("${userId}", ${helpRate.toFixed(2)}).`);

    // Fatigue indicators
    const hasFatigue = this.detectFatigue(recentMissions);
    engine.addFact(`user_fatigue_${userId}`, 
      `user_has_fatigue("${userId}", ${hasFatigue ? 'true' : 'false'}).`);
  }

  /**
   * Add world-related facts
   */
  private addWorldFacts(engine: any, world: World): void {
    // World difficulty baseline
    const worldBaseline: Record<World, string> = {
      health: 'medium',
      it: 'hard',
      legal: 'hard',
      public: 'medium',
      factory: 'medium',
    };

    engine.addFact(`world_baseline_${world}`, 
      `world_baseline_difficulty("${world}", ${worldBaseline[world]}).`);
  }

  /**
   * Add context facts
   */
  private addContextFacts(engine: any, req: HRMPlanRequest): void {
    if (req.context?.difficulty) {
      engine.addFact('requested_difficulty', 
        `requested_difficulty("${req.context.difficulty}").`);
    }

    if (req.context?.lang) {
      engine.addFact('user_language', 
        `user_language("${req.context.lang}").`);
    }
  }

  /**
   * Add ZPD decision rules to Mangle
   */
  private addZPDRules(engine: any): void {
    // Rule: Beginner level (< 3 missions completed)
    engine.addRule('zpd_beginner', `
      recommend_difficulty(U, W, easy) :-
        user_missions_completed(U, M),
        M < 3.
    `);

    // Rule: Struggling (low success rate or high help usage)
    engine.addRule('zpd_struggling', `
      recommend_difficulty(U, W, easy) :-
        user_recent_success_rate(U, S),
        S < 0.5.
      
      recommend_difficulty(U, W, easy) :-
        user_help_rate(U, H),
        H > 0.3.
    `);

    // Rule: Fatigue detected
    engine.addRule('zpd_fatigue', `
      recommend_difficulty(U, W, easy) :-
        user_has_fatigue(U, true).
    `);

    // Rule: Intermediate (decent performance)
    engine.addRule('zpd_intermediate', `
      recommend_difficulty(U, W, medium) :-
        user_missions_completed(U, M),
        M >= 3,
        M < 10,
        user_recent_success_rate(U, S),
        S >= 0.5,
        S < 0.8,
        user_help_rate(U, H),
        H =< 0.3.
    `);

    // Rule: Advanced (high performance)
    engine.addRule('zpd_advanced', `
      recommend_difficulty(U, W, hard) :-
        user_missions_completed(U, M),
        M >= 10,
        user_recent_success_rate(U, S),
        S >= 0.8,
        user_avg_score(U, A),
        A >= 0.85,
        user_help_rate(U, H),
        H < 0.1.
    `);

    // Rule: Expert (exceptional performance)
    engine.addRule('zpd_expert', `
      recommend_difficulty(U, W, hard) :-
        user_missions_completed(U, M),
        M >= 15,
        user_avg_score(U, A),
        A >= 0.9,
        user_streak(U, Streak),
        Streak >= 5.
    `);

    // Rule: World-specific baseline (fallback)
    engine.addRule('zpd_baseline', `
      recommend_difficulty(U, W, D) :-
        world_baseline_difficulty(W, D),
        user_missions_completed(U, M),
        M >= 5,
        M < 10.
    `);
  }

  /**
   * Calculate average score from mission history
   */
  private calculateAverageScore(missions: any[]): number {
    if (missions.length === 0) return 0;

    let totalScore = 0;
    let totalAttempts = 0;

    for (const mission of missions) {
      for (const attempt of mission.history || []) {
        totalScore += attempt.score || 0;
        totalAttempts++;
      }
    }

    return totalAttempts > 0 ? totalScore / totalAttempts : 0;
  }

  /**
   * Calculate help usage rate
   */
  private calculateHelpRate(missions: any[]): number {
    if (missions.length === 0) return 0;

    let helpUsed = 0;
    let totalAttempts = 0;

    for (const mission of missions) {
      for (const attempt of mission.history || []) {
        if (attempt.helpUsed) helpUsed++;
        totalAttempts++;
      }
    }

    return totalAttempts > 0 ? helpUsed / totalAttempts : 0;
  }

  /**
   * Detect fatigue from mission history
   */
  private detectFatigue(missions: any[]): boolean {
    if (missions.length < 2) return false;

    // Check if performance is declining over recent missions
    const firstHalf = missions.slice(0, Math.ceil(missions.length / 2));
    const secondHalf = missions.slice(Math.ceil(missions.length / 2));

    const firstHalfScore = this.calculateAverageScore(firstHalf);
    const secondHalfScore = this.calculateAverageScore(secondHalf);

    // Fatigue if performance dropped by more than 20%
    return secondHalfScore < firstHalfScore * 0.8;
  }

  /**
   * Explain Mangle decision (for debugging/explainability)
   */
  async explainDecision(userId: string, world: World): Promise<string[]> {
    const engine = getMangleEngine();
    
    try {
      // Get all facts that led to decision
      const result = await engine.query(`recommend_difficulty("${userId}", "${world}", D).`);
      
      const explanations: string[] = [
        `🧠 Mangle ZPD Analysis for ${userId} in ${world}:`,
        '',
      ];

      // Get stats
      const stats = engine.getStats();
      explanations.push(`Facts evaluated: ${stats.factsCount || 0}`);
      explanations.push(`Rules evaluated: ${stats.rulesCount || 0}`);
      
      if (result.results && result.results.length > 0) {
        explanations.push('');
        explanations.push(`✅ Recommendation: ${result.results[0].D}`);
      } else {
        explanations.push('');
        explanations.push('⚠️ No recommendation could be determined');
      }

      return explanations;
    } catch (error) {
      return [`❌ Error explaining decision: ${error}`];
    }
  }
}



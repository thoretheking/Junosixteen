/**
 * Analytics Controller
 * REST API for insights, recommendations, and predictions
 */

import { Request, Response } from 'express';
import { generateUserInsights, generateInsightsSummary } from './insights.engine.js';
import { ProgressRepo } from '../memory/repo.progress.js';
import { UsersRepo } from '../memory/repo.users.js';

export class AnalyticsController {
  constructor(
    private readonly progressRepo: ProgressRepo,
    private readonly usersRepo: UsersRepo
  ) {}

  /**
   * GET /analytics/insights/:userId
   * Get comprehensive user insights
   */
  async getUserInsights(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          error: 'Missing required parameter: userId',
        });
        return;
      }

      // Gather user data
      const user = await this.usersRepo.getUser(userId);
      const missions = await this.progressRepo.getUserHistory(userId);

      if (!user) {
        res.status(404).json({
          error: 'User not found',
        });
        return;
      }

      // Collect all attempts
      const attempts: any[] = [];
      for (const mission of missions) {
        attempts.push(...(mission.history || []));
      }

      // Generate insights
      const insights = generateUserInsights({
        userId,
        missions,
        attempts,
        currentStreak: user.streak,
        totalPoints: user.totalPoints,
      });

      res.json(insights);
    } catch (error) {
      console.error('Error generating insights:', error);
      res.status(500).json({
        error: 'Failed to generate insights',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /analytics/summary/:userId
   * Get readable insights summary
   */
  async getInsightsSummary(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      // Get insights
      const user = await this.usersRepo.getUser(userId);
      const missions = await this.progressRepo.getUserHistory(userId);

      if (!user) {
        res.status(404).json({
          error: 'User not found',
        });
        return;
      }

      const attempts: any[] = [];
      for (const mission of missions) {
        attempts.push(...(mission.history || []));
      }

      const insights = generateUserInsights({
        userId,
        missions,
        attempts,
        currentStreak: user.streak,
        totalPoints: user.totalPoints,
      });

      const summary = generateInsightsSummary(insights);

      res.json({
        userId,
        summary,
        insights, // Full insights also included
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      res.status(500).json({
        error: 'Failed to generate summary',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /analytics/recommendations/:userId
   * Get personalized recommendations only
   */
  async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const user = await this.usersRepo.getUser(userId);
      const missions = await this.progressRepo.getUserHistory(userId);

      if (!user) {
        res.status(404).json({
          error: 'User not found',
        });
        return;
      }

      const attempts: any[] = [];
      for (const mission of missions) {
        attempts.push(...(mission.history || []));
      }

      const insights = generateUserInsights({
        userId,
        missions,
        attempts,
        currentStreak: user.streak,
        totalPoints: user.totalPoints,
      });

      res.json({
        userId,
        recommendations: insights.recommendations,
        generated: insights.generatedAt,
      });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({
        error: 'Failed to get recommendations',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /analytics/predictions/:userId
   * Get performance predictions
   */
  async getPredictions(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const user = await this.usersRepo.getUser(userId);
      const missions = await this.progressRepo.getUserHistory(userId);

      if (!user) {
        res.status(404).json({
          error: 'User not found',
        });
        return;
      }

      const attempts: any[] = [];
      for (const mission of missions) {
        attempts.push(...(mission.history || []));
      }

      const insights = generateUserInsights({
        userId,
        missions,
        attempts,
        currentStreak: user.streak,
        totalPoints: user.totalPoints,
      });

      res.json({
        userId,
        predictions: insights.predictions,
        performance: insights.performance,
        generated: insights.generatedAt,
      });
    } catch (error) {
      console.error('Error getting predictions:', error);
      res.status(500).json({
        error: 'Failed to get predictions',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}



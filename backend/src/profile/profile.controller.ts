/**
 * Profile Controller
 * User profile and statistics endpoints
 */

import { Request, Response } from 'express';
import { UsersRepo } from '../memory/repo.users.js';
import { ProgressRepo } from '../memory/repo.progress.js';
import { BadgesService } from '../gamification/badges.service.js';
import { UserProfileResponse } from '../common/types.js';

export class ProfileController {
  constructor(
    private readonly usersRepo: UsersRepo,
    private readonly progressRepo: ProgressRepo,
    private readonly badgesService: BadgesService
  ) {}

  /**
   * GET /profile/:userId
   * Get user profile with stats
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          error: 'Missing required parameter: userId',
        });
        return;
      }

      // Get user
      const user = await this.usersRepo.getUser(userId);
      if (!user) {
        res.status(404).json({
          error: 'User not found',
        });
        return;
      }

      // Get mastery map
      const masteryMap = await this.usersRepo.getMasteryMap(userId);

      // Get badges
      const badges = await this.badgesService.checkBadges(userId);
      const badgeIds = badges.map(b => b.id);

      const profile: UserProfileResponse = {
        userId: user.userId,
        avatar: user.avatar,
        lang: user.lang,
        totalPoints: user.totalPoints,
        streak: user.streak,
        mastery_map: masteryMap,
        badges: badgeIds,
      };

      res.json(profile);
    } catch (error) {
      console.error('Error getting profile:', error);
      res.status(500).json({
        error: 'Failed to get user profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PUT /profile/:userId
   * Update user profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const updates = req.body;

      if (!userId) {
        res.status(400).json({
          error: 'Missing required parameter: userId',
        });
        return;
      }

      // Update user
      const user = await this.usersRepo.upsertUser(userId, updates);

      res.json({
        ok: true,
        user,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({
        error: 'Failed to update user profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /profile/:userId/history
   * Get user's mission history
   */
  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!userId) {
        res.status(400).json({
          error: 'Missing required parameter: userId',
        });
        return;
      }

      const history = await this.progressRepo.getUserHistory(userId);
      const limitedHistory = history.slice(0, limit);

      res.json({
        userId,
        history: limitedHistory,
        total: history.length,
      });
    } catch (error) {
      console.error('Error getting history:', error);
      res.status(500).json({
        error: 'Failed to get user history',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /profile/:userId/badges
   * Get user's earned badges
   */
  async getBadges(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          error: 'Missing required parameter: userId',
        });
        return;
      }

      const badges = await this.badgesService.checkBadges(userId);

      res.json({
        userId,
        badges,
        count: badges.length,
      });
    } catch (error) {
      console.error('Error getting badges:', error);
      res.status(500).json({
        error: 'Failed to get user badges',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}



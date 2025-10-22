/**
 * Adventure Controller
 * REST API for Adventure Features (Challenges, Daily Quests, Random Drops)
 */

import { Request, Response } from 'express';
import {
  CHALLENGE_REGISTRY,
  getChallengesByWorld,
  getBossChallengesByWorld,
  getChallengeById,
  getRandomChallenge,
  validateChallengeResult,
} from './challenge.registry.js';
import {
  getTodaysQuests,
  updateQuestProgress,
  isQuestExpired,
  getActiveQuests,
  getCompletedQuests,
  generateWeeklyQuest,
} from './daily.quests.js';
import {
  rollForDrop,
  getDropEffect,
  formatDropMessage,
  getEasterEggsForWorld,
  getDropStatistics,
} from './random.drops.js';
import { World } from '../common/types.js';

export class AdventureController {
  /**
   * GET /adventure/challenges
   * Get all challenges or filter by world
   */
  async getChallenges(req: Request, res: Response): Promise<void> {
    try {
      const { world, boss } = req.query;

      let challenges;

      if (world) {
        const worldType = world as World;
        challenges = boss === 'true'
          ? getBossChallengesByWorld(worldType)
          : getChallengesByWorld(worldType);
      } else {
        challenges = Object.values(CHALLENGE_REGISTRY);
      }

      res.json({
        challenges,
        total: challenges.length,
      });
    } catch (error) {
      console.error('Error getting challenges:', error);
      res.status(500).json({
        error: 'Failed to get challenges',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /adventure/challenges/:id
   * Get specific challenge by ID
   */
  async getChallengeById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const challenge = getChallengeById(id);

      if (!challenge) {
        res.status(404).json({
          error: 'Challenge not found',
        });
        return;
      }

      res.json(challenge);
    } catch (error) {
      console.error('Error getting challenge:', error);
      res.status(500).json({
        error: 'Failed to get challenge',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /adventure/challenges/validate
   * Validate challenge result
   */
  async validateChallenge(req: Request, res: Response): Promise<void> {
    try {
      const { challengeId, result } = req.body;

      if (!challengeId || !result) {
        res.status(400).json({
          error: 'Missing required fields: challengeId, result',
        });
        return;
      }

      const challenge = getChallengeById(challengeId);
      if (!challenge) {
        res.status(404).json({
          error: 'Challenge not found',
        });
        return;
      }

      const isValid = validateChallengeResult(challengeId, result);

      res.json({
        challengeId,
        valid: isValid,
        challenge: {
          id: challenge.id,
          title: challenge.title,
          difficulty: challenge.difficulty,
          isBoss: challenge.isBoss,
        },
        result,
      });
    } catch (error) {
      console.error('Error validating challenge:', error);
      res.status(500).json({
        error: 'Failed to validate challenge',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /adventure/quests/daily
   * Get today's daily quests
   */
  async getDailyQuests(req: Request, res: Response): Promise<void> {
    try {
      const { world } = req.query;
      const quests = getTodaysQuests(world as World);

      res.json({
        quests,
        total: quests.length,
        active: getActiveQuests(quests).length,
        completed: getCompletedQuests(quests).length,
      });
    } catch (error) {
      console.error('Error getting daily quests:', error);
      res.status(500).json({
        error: 'Failed to get daily quests',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /adventure/quests/weekly
   * Get weekly quest
   */
  async getWeeklyQuest(req: Request, res: Response): Promise<void> {
    try {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      
      const quest = generateWeeklyQuest(weekStart.toISOString().split('T')[0]);

      res.json(quest);
    } catch (error) {
      console.error('Error getting weekly quest:', error);
      res.status(500).json({
        error: 'Failed to get weekly quest',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /adventure/quests/progress
   * Update quest progress
   */
  async updateQuestProgress(req: Request, res: Response): Promise<void> {
    try {
      const { questId, increment } = req.body;

      if (!questId) {
        res.status(400).json({
          error: 'Missing required field: questId',
        });
        return;
      }

      // In production, fetch from database
      const quests = getTodaysQuests();
      const quest = quests.find(q => q.id === questId);

      if (!quest) {
        res.status(404).json({
          error: 'Quest not found',
        });
        return;
      }

      if (isQuestExpired(quest)) {
        res.status(400).json({
          error: 'Quest has expired',
        });
        return;
      }

      const updatedQuest = updateQuestProgress(quest, increment || 1);

      res.json({
        quest: updatedQuest,
        justCompleted: !quest.completed && updatedQuest.completed,
        reward: updatedQuest.completed ? updatedQuest.reward : null,
      });
    } catch (error) {
      console.error('Error updating quest progress:', error);
      res.status(500).json({
        error: 'Failed to update quest progress',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /adventure/drops/roll
   * Roll for random drop
   */
  async rollDrop(req: Request, res: Response): Promise<void> {
    try {
      const { streak, world, questKind, riskQuestion } = req.body;

      const drop = rollForDrop({
        streak,
        world: world as World,
        questKind,
        riskQuestion,
      });

      if (!drop) {
        res.json({
          dropped: false,
          message: 'No drop this time',
        });
        return;
      }

      const effect = getDropEffect(drop);
      const message = formatDropMessage(drop);

      res.json({
        dropped: true,
        drop,
        effect,
        message,
      });
    } catch (error) {
      console.error('Error rolling drop:', error);
      res.status(500).json({
        error: 'Failed to roll drop',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /adventure/drops/easter-eggs/:world
   * Get easter eggs for specific world
   */
  async getEasterEggs(req: Request, res: Response): Promise<void> {
    try {
      const { world } = req.params;
      const easterEggs = getEasterEggsForWorld(world as World);

      res.json({
        world,
        easterEggs,
        total: easterEggs.length,
      });
    } catch (error) {
      console.error('Error getting easter eggs:', error);
      res.status(500).json({
        error: 'Failed to get easter eggs',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /adventure/stats
   * Get adventure system statistics
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const dropStats = getDropStatistics();
      const challengeStats = {
        total: Object.keys(CHALLENGE_REGISTRY).length,
        byWorld: {
          health: getChallengesByWorld('health').length,
          it: getChallengesByWorld('it').length,
          legal: getChallengesByWorld('legal').length,
          public: getChallengesByWorld('public').length,
          factory: getChallengesByWorld('factory').length,
        },
        bossChallenges: Object.values(CHALLENGE_REGISTRY).filter(c => c.isBoss).length,
      };

      res.json({
        challenges: challengeStats,
        drops: dropStats,
        dailyQuests: {
          available: getTodaysQuests().length,
        },
      });
    } catch (error) {
      console.error('Error getting stats:', error);
      res.status(500).json({
        error: 'Failed to get stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /adventure/random-challenge/:world
   * Get random challenge for world
   */
  async getRandomChallenge(req: Request, res: Response): Promise<void> {
    try {
      const { world } = req.params;
      const challenge = getRandomChallenge(world as World);

      if (!challenge) {
        res.status(404).json({
          error: 'No challenges available for this world',
        });
        return;
      }

      res.json(challenge);
    } catch (error) {
      console.error('Error getting random challenge:', error);
      res.status(500).json({
        error: 'Failed to get random challenge',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}



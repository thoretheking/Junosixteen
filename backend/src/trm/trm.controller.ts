/**
 * TRM Controller
 * REST endpoints for the Executor/Evaluator
 */

import { Request, Response } from 'express';
import { TRMService } from './trm.service.js';
import { TRMEvalRequest } from '../common/types.js';

export class TRMController {
  constructor(private readonly trmService: TRMService) {}

  /**
   * POST /trm/eval
   * Evaluate user answer and provide feedback
   */
  async eval(req: Request, res: Response): Promise<void> {
    try {
      const evalRequest: TRMEvalRequest = req.body;

      // Validate request
      if (!evalRequest.userId || !evalRequest.missionId || !evalRequest.questId || !evalRequest.result) {
        res.status(400).json({
          error: 'Missing required fields: userId, missionId, questId, result',
        });
        return;
      }

      const response = await this.trmService.eval(evalRequest);
      
      res.json(response);
    } catch (error) {
      console.error('Error in TRM eval:', error);
      res.status(500).json({
        error: 'Failed to evaluate answer',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /trm/stats/:userId/:missionId
   * Get mission statistics
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const { userId, missionId } = req.params;

      if (!userId || !missionId) {
        res.status(400).json({
          error: 'Missing required parameters: userId, missionId',
        });
        return;
      }

      const stats = await this.trmService.getMissionStats(userId, missionId);
      
      if (!stats) {
        res.status(404).json({
          error: 'No progress found for this mission',
        });
        return;
      }

      res.json(stats);
    } catch (error) {
      console.error('Error in TRM stats:', error);
      res.status(500).json({
        error: 'Failed to get mission statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}



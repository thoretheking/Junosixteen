/**
 * HRM Controller
 * REST endpoints for the Orchestrator
 */

import { Request, Response } from 'express';
import { HRMService } from './hrm.service.js';
import { HRMPlanRequest, HRMUpdateRequest } from '../common/types.js';

export class HRMController {
  constructor(private readonly hrmService: HRMService) {}

  /**
   * POST /hrm/plan
   * Create mission plan with quest set
   */
  async plan(req: Request, res: Response): Promise<void> {
    try {
      const planRequest: HRMPlanRequest = req.body;

      // Validate request
      if (!planRequest.userId || !planRequest.goal?.missionId || !planRequest.goal?.world) {
        res.status(400).json({
          error: 'Missing required fields: userId, goal.missionId, goal.world',
        });
        return;
      }

      const response = await this.hrmService.plan(planRequest);
      
      res.json(response);
    } catch (error) {
      console.error('Error in HRM plan:', error);
      res.status(500).json({
        error: 'Failed to create mission plan',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /hrm/update
   * Update hypothesis based on signals
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const updateRequest: HRMUpdateRequest = req.body;

      // Validate request
      if (!updateRequest.hypothesisId || !updateRequest.signals) {
        res.status(400).json({
          error: 'Missing required fields: hypothesisId, signals',
        });
        return;
      }

      const response = await this.hrmService.update(updateRequest);
      
      res.json(response);
    } catch (error) {
      console.error('Error in HRM update:', error);
      res.status(500).json({
        error: 'Failed to update hypothesis',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /hrm/explain/:userId/:world
   * Explain Mangle decision (only available if Mangle is enabled)
   */
  async explain(req: Request, res: Response): Promise<void> {
    try {
      const { userId, world } = req.params;

      if (!userId || !world) {
        res.status(400).json({
          error: 'Missing required parameters: userId, world',
        });
        return;
      }

      // Check if service has explainDecision method (Mangle-enhanced)
      if ('explainDecision' in this.hrmService) {
        const explanation = await (this.hrmService as any).explainDecision(userId, world);
        res.json({
          userId,
          world,
          explanation,
          mangleEnabled: true,
        });
      } else {
        res.json({
          userId,
          world,
          explanation: ['Mangle integration not enabled. Set USE_MANGLE=true to enable.'],
          mangleEnabled: false,
        });
      }
    } catch (error) {
      console.error('Error in HRM explain:', error);
      res.status(500).json({
        error: 'Failed to explain decision',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}


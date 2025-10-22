/**
 * HRM/TRM System - Main Module
 * Exports initialized services and controllers
 */

import { PolicyLoader } from '../hrm/policy.loader.js';
import { HRMService } from '../hrm/hrm.service.js';
import { HRMMangleService } from '../hrm/hrm.mangle.service.js';
import { HRMController } from '../hrm/hrm.controller.js';

import { RubricService } from '../trm/rubric.js';
import { TRMService } from '../trm/trm.service.js';
import { TRMController } from '../trm/trm.controller.js';

import { UsersRepo } from '../memory/repo.users.js';
import { ProgressRepo } from '../memory/repo.progress.js';
import { ReasoningRepo } from '../memory/repo.reasoning.js';

import { PointsService } from '../gamification/points.service.js';
import { BadgesService } from '../gamification/badges.service.js';

import { EventsController } from '../telemetry/events.controller.js';
import { ProfileController } from '../profile/profile.controller.js';
import { AdventureController } from '../adventure/adventure.controller.js';
import { AnalyticsController } from '../analytics/analytics.controller.js';

/**
 * Initialize and export all services
 */
export function initializeHRMTRM() {
  // Memory Layer
  const usersRepo = new UsersRepo();
  const progressRepo = new ProgressRepo();
  const reasoningRepo = new ReasoningRepo();

  // Policy Loader
  const policyLoader = new PolicyLoader();

  // Gamification Services
  const pointsService = new PointsService();
  const badgesService = new BadgesService(progressRepo, usersRepo);

  // HRM (Orchestrator)
  // Use Mangle-enhanced HRM if enabled
  const useMangle = process.env.USE_MANGLE === 'true' || process.env.USE_MANGLE === '1';
  
  const hrmService = useMangle
    ? new HRMMangleService(policyLoader, reasoningRepo, progressRepo, usersRepo)
    : new HRMService(policyLoader, reasoningRepo);
  
  const hrmController = new HRMController(hrmService);
  
  console.log(`🧠 HRM Mode: ${useMangle ? 'Mangle-Enhanced' : 'Standard'}`);
  console.log(`   Set USE_MANGLE=true to enable Mangle integration`);

  // TRM (Executor/Evaluator)
  const rubricService = new RubricService();
  const trmService = new TRMService(
    rubricService,
    pointsService,
    progressRepo,
    policyLoader
  );
  const trmController = new TRMController(trmService);

  // Telemetry
  const eventsController = new EventsController();

  // Profile
  const profileController = new ProfileController(
    usersRepo,
    progressRepo,
    badgesService
  );

  // Adventure
  const adventureController = new AdventureController();

  // Analytics
  const analyticsController = new AnalyticsController(progressRepo, usersRepo);

  // Preload policies
  policyLoader.preloadAll().catch(err => {
    console.error('❌ Failed to preload policies:', err);
  });

  return {
    // Controllers
    hrmController,
    trmController,
    eventsController,
    profileController,
    adventureController,
    analyticsController,

    // Services (for direct access if needed)
    hrmService,
    trmService,
    pointsService,
    badgesService,

    // Repositories
    usersRepo,
    progressRepo,
    reasoningRepo,

    // Policy Loader
    policyLoader,
  };
}


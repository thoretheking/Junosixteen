/**
 * JunoSixteen HRM/TRM System - Common Types
 * Shared TypeScript interfaces for Orchestrator & Executor
 */

// World types (5 thematic areas)
export type World = 'health' | 'it' | 'legal' | 'public' | 'factory';

// Question kinds
export type QKind = 'standard' | 'risk' | 'team';

// Difficulty levels
export type Difficulty = 'easy' | 'medium' | 'hard';

// Challenge outcome
export type ChallengeOutcome = 'success' | 'fail' | null;

// Converge hint for HRM
export type ConvergeHint = 'keep' | 'raise' | 'lower';

/**
 * Quest Option - Single answer choice
 */
export interface QuestOption {
  id: string;
  text: string;
  correct: boolean;
}

/**
 * Quest - Single question with options
 */
export interface Quest {
  id: string;
  index: number;
  world: World;
  kind: QKind;
  stem: string; // Question text
  options: QuestOption[];
  onWrongChallengeId?: string; // Thematic challenge when answer is wrong
  riskConfig?: {
    maxAttempts: number;
    cooldownMs: number;
  };
}

/**
 * HRM Plan Request - Start new mission
 */
export interface HRMPlanRequest {
  userId: string;
  goal: {
    missionId: string;
    world: World;
  };
  context?: {
    lang?: string;
    avatarId?: string;
    difficulty?: Difficulty;
  };
}

/**
 * HRM Plan Response - Mission plan with quest set
 */
export interface HRMPlanResponse {
  hypothesisId: string; // Reference ID for updates
  briefing: string; // Story intro
  questSet: Quest[]; // 10 questions incl. risk/team
  debriefSuccess: string;
  debriefFail: string;
  cliffhanger: string;
}

/**
 * TRM Eval Request - Evaluate user answer
 */
export interface TRMEvalRequest {
  userId: string;
  missionId: string;
  hypothesisId: string;
  questId: string;
  result: {
    selectedOptionId?: string;
    correct: boolean;
    timeMs: number;
    helpUsed?: boolean;
    challengeOutcome?: ChallengeOutcome;
  };
  telemetry: Record<string, any>; // clicks, focus, retries, device, etc.
}

/**
 * TRM Eval Response - Feedback and signals
 */
export interface TRMEvalResponse {
  microFeedback: string; // Short tip/confirmation
  scoreDelta: number; // Points adjustment
  signals: {
    difficultyAdj?: -1 | 0 | 1;
    fatigue?: boolean;
    guessPattern?: boolean;
  };
  convergeHint?: ConvergeHint; // For HRM.update
}

/**
 * HRM Update Request - Adjust hypothesis based on signals
 */
export interface HRMUpdateRequest {
  hypothesisId: string;
  signals: {
    difficultyAdj?: -1 | 0 | 1;
    fatigue?: boolean;
    guessPattern?: boolean;
    scoreAvg?: number;
    helpRate?: number;
  };
}

/**
 * HRM Update Response
 */
export interface HRMUpdateResponse {
  ok: boolean;
  updatedHypothesis?: any;
}

/**
 * User Profile Response
 */
export interface UserProfileResponse {
  userId: string;
  avatar?: string;
  lang?: string;
  totalPoints: number;
  streak: number;
  mastery_map: Record<World, number>; // Progress per world (0-100%)
  badges: string[];
}

/**
 * Hypothesis - Learning hypothesis stored in memory
 */
export interface Hypothesis {
  id: string;
  userId: string;
  missionId: string;
  world: World;
  difficulty: Difficulty;
  startedAt: string;
  updatedAt: string;
  signals: {
    scoreAvg: number;
    helpRate: number;
    difficultyAdj: number;
    fatigue: boolean;
    guessPattern: boolean;
  };
  notes: string[]; // Reasoning notes
}

/**
 * Progress Record - Mission progress per user
 */
export interface ProgressRecord {
  userId: string;
  missionId: string;
  lives: number;
  points: number;
  questionIndex: number;
  finished: boolean;
  success: boolean;
  history: AttemptRecord[];
  startedAt: string;
  finishedAt?: string;
}

/**
 * Attempt Record - Single question attempt
 */
export interface AttemptRecord {
  questId: string;
  selectedOptionId?: string;
  correct: boolean;
  timeMs: number;
  score: number;
  scoreDelta: number;
  helpUsed: boolean;
  challengeOutcome?: ChallengeOutcome;
  telemetry: Record<string, any>;
  attemptedAt: string;
}

/**
 * Telemetry Event
 */
export interface TelemetryEvent {
  eventType: string;
  userId: string;
  missionId?: string;
  questId?: string;
  timestamp: string;
  data: Record<string, any>;
}

/**
 * Badge Definition
 */
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string; // Description of how to earn
  earnedAt?: string;
}

/**
 * Points Configuration
 */
export interface PointsConfig {
  standard: number;
  risk: number;
  team: number;
  bonusMinigame: {
    points: number;
    lifePlus: number;
    lifeCap: number;
  };
}



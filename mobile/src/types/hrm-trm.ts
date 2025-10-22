/**
 * HRM/TRM Types - Client Side
 * Shared types for client-server communication
 */

export type World = 'health' | 'it' | 'legal' | 'public' | 'factory';
export type QKind = 'standard' | 'risk' | 'team';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ChallengeOutcome = 'success' | 'fail' | null;
export type ConvergeHint = 'keep' | 'raise' | 'lower';

export interface QuestOption {
  id: string;
  text: string;
  correct: boolean;
}

export interface Quest {
  id: string;
  index: number;
  world: World;
  kind: QKind;
  stem: string;
  options: QuestOption[];
  onWrongChallengeId?: string;
  riskConfig?: {
    maxAttempts: number;
    cooldownMs: number;
  };
}

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

export interface HRMPlanResponse {
  hypothesisId: string;
  briefing: string;
  questSet: Quest[];
  debriefSuccess: string;
  debriefFail: string;
  cliffhanger: string;
}

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
  telemetry: Record<string, any>;
}

export interface TRMEvalResponse {
  microFeedback: string;
  scoreDelta: number;
  signals: {
    difficultyAdj?: -1 | 0 | 1;
    fatigue?: boolean;
    guessPattern?: boolean;
  };
  convergeHint?: ConvergeHint;
}

export interface UserProfile {
  userId: string;
  avatar?: string;
  lang?: string;
  totalPoints: number;
  streak: number;
  mastery_map: Record<World, number>;
  badges: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  earnedAt?: string;
}

export interface TelemetryEvent {
  eventType: string;
  userId: string;
  missionId?: string;
  questId?: string;
  timestamp?: string;
  data: Record<string, any>;
}



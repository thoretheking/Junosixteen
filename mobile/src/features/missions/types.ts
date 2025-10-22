// Mission System Types
export type LifeCount = 0 | 1 | 2 | 3 | 4 | 5;

export type World = 'health' | 'it' | 'legal' | 'public' | 'factory';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type QuestionKind = 'standard' | 'risk' | 'team';

// === RISK GUARD SYSTEM ===
export interface RiskControl {
  maxAttempts: number;        // z.B. 2
  attemptsUsed: number;       // 0..max
  cooldownMs: number;         // z.B. 30000
  lockUntil?: number;         // epoch ms, falls Cooldown aktiv
  hintUsed?: boolean;         // Joker/Hinweis verwendet
  bossChallengeFailed?: boolean; // Boss-Challenge fehlgeschlagen
  adaptiveHelp?: {
    reducedOptions?: boolean;   // 3 statt 4 Optionen
    extraTimeMs?: number;       // +5s Timer
    reason?: string;            // "previous_mission_risk_fail"
  };
}

export interface RiskConfig {
  maxAttempts: number;
  cooldownMs: number;
  hintCost: number;           // Punkte-Kosten für Hinweis
  bossChallenge: string;      // Challenge-ID für Boss-Fight
  adaptiveEnabled: boolean;   // Adaptive Schwierigkeit
}

export interface MissionMeta {
  id: string;
  title: string;
  world: World;
  difficulty: Difficulty;
  livesStart: LifeCount; // default 3
  description: string;
  briefing: string;
  debriefSuccess: string;
  debriefFail: string;
  questions: Question[];
  unlocked: boolean;
  completed: boolean;
  bestScore?: number;
  riskInsuranceAvailable?: boolean; // 1x pro Woche "Versicherung"
}

export interface Question {
  id: string;
  index: number; // 1..10
  kind: QuestionKind;
  stem: string;
  options: QuestionOption[];
  onWrongChallengeId?: string; // which challenge to trigger
  timeLimit?: number; // seconds
  points: number; // base points for correct answer
  riskConfig?: RiskConfig; // Nur für risk-questions
  adaptiveOptions?: QuestionOption[]; // Reduzierte Optionen für adaptive Hilfe
}

export interface QuestionOption {
  id: string;
  text: string;
  correct: boolean;
  isDistractor?: boolean; // Kann bei adaptiver Hilfe entfernt werden
}

export interface Challenge {
  id: string;
  world: World;
  title: string;
  description: string;
  timeLimitMs: number;
  difficulty: Difficulty;
  isBossChallenge?: boolean; // Markiert Boss-Challenges
  // simple outcome for POC
  evaluate: (input: any) => boolean;
  a11yHint?: string;
  instructions: string;
  successMessage: string;
  failMessage: string;
  bossIntro?: string; // Spezielle Intro für Boss-Challenges
}

export interface MissionProgress {
  missionId: string;
  currentQuestionIndex: number; // 1..10
  lives: LifeCount;
  points: number;
  bonusLives: LifeCount; // can push to max 5 total
  finished: boolean;
  success: boolean;
  startedAt?: string;
  finishedAt?: string;
  answeredQuestions: string[]; // question IDs
  completedChallenges: string[]; // challenge IDs
  currentStreak: number; // consecutive correct answers
  risk: Record<string, RiskControl>; // key = question.id
  hintsUsed: number; // Anzahl verwendeter Hinweise
  riskInsuranceUsed?: boolean; // Risk-Versicherung verwendet
  teamBoostUsed?: boolean; // Team-Boost verwendet (Frage 9)
}

export interface BonusGame {
  id: string;
  title: string;
  description: string;
  instructions: string;
  timeLimitMs: number;
  pointsReward: number;
  livesReward: LifeCount;
  difficulty: Difficulty;
  evaluate: (input: any) => { success: boolean; score: number };
}

export interface UserProfile {
  uid: string;
  selectedAvatarId?: string;
  lang: 'de' | 'en';
  isAdmin: boolean;
  totalPoints: number;
  totalLives: number;
  completedMissions: string[];
  currentMission?: string;
  achievements: string[];
  weeklyRiskInsurance: number; // Anzahl verfügbare Risk-Versicherungen diese Woche
  preferences: {
    soundEnabled: boolean;
    hapticsEnabled: boolean;
    reducedMotion: boolean;
    highContrast: boolean;
    adaptiveDifficulty: boolean; // Adaptive Schwierigkeit aktiviert
  };
  stats: {
    riskQuestionsAttempted: number;
    riskQuestionsPassed: number;
    bossChallengessCompleted: number;
    averageAttemptsPerRisk: number;
  };
}

export interface GameState {
  currentMission: MissionProgress | null;
  availableMissions: MissionMeta[];
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  currentCooldown: {
    questionId: string;
    remainingMs: number;
    active: boolean;
  } | null;
}

// Challenge Input Types
export interface DragDropInput {
  type: 'drag-drop';
  items: Array<{ id: string; position: { x: number; y: number } }>;
}

export interface SequenceInput {
  type: 'sequence';
  sequence: string[];
}

export interface SwipeInput {
  type: 'swipe';
  hits: number;
  timeElapsed: number;
}

export interface MultipleChoiceInput {
  type: 'multiple-choice';
  selectedOptions: string[];
}

export type ChallengeInput = DragDropInput | SequenceInput | SwipeInput | MultipleChoiceInput;

// API Types
export interface MissionStartRequest {
  missionId: string;
  userId: string;
}

export interface MissionStartResponse {
  success: boolean;
  missionProgress: MissionProgress;
  firstQuestion: Question;
}

export interface AnswerSubmissionRequest {
  missionId: string;
  questionId: string;
  selectedOptionId: string;
  timeElapsed: number;
  hintUsed?: boolean;
}

export interface AnswerSubmissionResponse {
  correct: boolean;
  points: number;
  nextQuestion?: Question;
  challengeTriggered?: Challenge;
  missionCompleted?: boolean;
  explanation?: string;
  riskAttemptInfo?: {
    attemptsUsed: number;
    maxAttempts: number;
    cooldownActive: boolean;
    cooldownRemainingMs?: number;
  };
}

export interface ChallengeSubmissionRequest {
  challengeId: string;
  input: ChallengeInput;
  timeElapsed: number;
}

export interface ChallengeSubmissionResponse {
  success: boolean;
  message: string;
  nextQuestion?: Question;
  livesLost?: number;
  missionFailed?: boolean;
  cooldownTriggered?: boolean;
  cooldownMs?: number;
} 
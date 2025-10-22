/**
 * Live Competitions System
 * Real-time PvP, Battle Royale, und Live-Events
 */

import { World } from '../common/types.js';

// ===================================================
// 1v1 DUELS
// ===================================================

export interface Duel {
  id: string;
  
  // Players
  player1: DuelPlayer;
  player2: DuelPlayer;
  
  // Match settings
  world: World;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  timeLimit: number; // ms per question
  
  // Rules
  rules: {
    sameQuestions: boolean; // Beide bekommen gleiche Fragen
    sharedLives: boolean;
    allowPowerUps: boolean;
    suddenDeath: boolean; // Bei Gleichstand
  };
  
  // State
  currentRound: number;
  totalRounds: number;
  status: 'waiting' | 'active' | 'finished';
  winner?: string;
  
  // Rewards
  winnerReward: number;
  loserReward: number;
  
  // Timestamps
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
}

export interface DuelPlayer {
  userId: string;
  username: string;
  avatar?: string;
  
  // Stats
  score: number;
  lives: number;
  correctAnswers: number;
  streak: number;
  
  // Status
  ready: boolean;
  connected: boolean;
  powerUpsUsed: string[];
}

// ===================================================
// BATTLE ROYALE
// ===================================================

export interface BattleRoyale {
  id: string;
  name: string;
  
  // Players
  maxPlayers: number;
  players: BattleRoyalePlayer[];
  playersRemaining: number;
  
  // Game state
  currentRound: number;
  totalRounds: number;
  questionsPerRound: number;
  
  // Zone mechanics
  safeZone: {
    radius: number; // Shrinks each round
    damage: number; // Lives lost per round outside
  };
  
  // Rules
  world?: World; // If undefined, random world per round
  eliminationMode: 'bottom_50' | 'bottom_25' | 'lowest_score';
  
  // Status
  status: 'lobby' | 'countdown' | 'active' | 'finished';
  startTime?: string;
  
  // Rewards (Top 10)
  rewards: Array<{
    rank: number;
    points: number;
    badge?: string;
    title?: string;
  }>;
}

export interface BattleRoyalePlayer {
  userId: string;
  username: string;
  avatar?: string;
  
  // Status
  alive: boolean;
  placement: number; // Final rank when eliminated
  
  // Stats
  score: number;
  lives: number;
  questionsAnswered: number;
  correctAnswers: number;
  eliminationCount: number; // How many others eliminated
  
  // Position
  inSafeZone: boolean;
  
  // Eliminated info
  eliminatedAt?: string;
  eliminatedBy?: 'player' | 'zone' | 'lives';
}

// ===================================================
// SPEED RUN CHALLENGES
// ===================================================

export interface SpeedRunChallenge {
  id: string;
  name: string;
  description: string;
  
  // Challenge
  missionId: string;
  world: World;
  targetTime: number; // ms - Zeit zu schlagen
  
  // Leaderboard
  records: SpeedRunRecord[];
  worldRecord: SpeedRunRecord;
  
  // Rewards für Rekord-Breaker
  rewards: {
    worldRecord: { points: number; badge: string; title: string };
    top10: { points: number; badge: string };
    underTarget: { points: number };
  };
  
  // Rules
  rules: {
    allowHints: boolean;
    allowPowerUps: boolean;
    mustBePerfect: boolean; // 100% richtig
  };
}

export interface SpeedRunRecord {
  rank: number;
  userId: string;
  username: string;
  time: number; // ms
  score: number; // Correct answers
  date: string;
  verified: boolean;
  replay?: string; // URL to replay
}

// ===================================================
// LIVE QUIZ SHOW
// ===================================================

export interface LiveQuizShow {
  id: string;
  title: string;
  host: {
    avatarId: string;
    name: string;
  };
  
  // Schedule
  startTime: string;
  duration: number; // minutes
  
  // Format
  rounds: number;
  questionsPerRound: number;
  eliminationRounds: number[]; // e.g. [3, 6, 9]
  
  // Participants
  maxPlayers: number;
  currentPlayers: LiveQuizPlayer[];
  eliminated: LiveQuizPlayer[];
  
  // Prize pool
  prizePool: number; // Wächst mit Teilnehmern
  prizeDistribution: {
    winner: number; // %
    top3: number;
    top10: number;
  };
  
  // Status
  status: 'scheduled' | 'live' | 'finished';
  currentRound: number;
  currentQuestion: number;
}

export interface LiveQuizPlayer {
  userId: string;
  username: string;
  avatar?: string;
  
  // Status
  alive: boolean;
  placement?: number;
  
  // Stats
  score: number;
  correctAnswers: number;
  averageResponseTime: number;
  lifelines: {
    fiftyFifty: boolean;
    askCommunity: boolean;
    doubleChance: boolean;
  };
}

// ===================================================
// RAID BOSSES
// ===================================================

export interface RaidBoss {
  id: string;
  name: string;
  description: string;
  world: World;
  
  // Boss stats
  health: number;
  maxHealth: number;
  difficulty: 'normal' | 'hard' | 'nightmare';
  
  // Phases
  currentPhase: number;
  phases: RaidPhase[];
  
  // Participants
  raiders: Raider[];
  maxRaiders: number;
  
  // Timing
  startTime: string;
  duration: number; // minutes
  endsAt: string;
  
  // Rewards
  rewards: {
    participation: { points: number };
    topDamage: { points: number; badge: string };
    completion: { points: number; badge: string; title: string };
  };
  
  status: 'spawned' | 'active' | 'defeated' | 'escaped';
}

export interface RaidPhase {
  phase: number;
  healthThreshold: number; // % HP
  difficulty: 'easy' | 'medium' | 'hard';
  specialMechanic?: string;
  questions: number;
}

export interface Raider {
  userId: string;
  username: string;
  damage: number; // Correctly answered questions
  lives: number;
  active: boolean;
  joinedAt: string;
}

export const RAID_BOSSES: RaidBoss[] = [
  {
    id: 'mega_virus',
    name: 'Mega-Virus',
    description: 'Ein riesiger Virus bedroht das CleanRoom!',
    world: 'health',
    health: 1000,
    maxHealth: 1000,
    difficulty: 'hard',
    currentPhase: 1,
    phases: [
      { phase: 1, healthThreshold: 100, difficulty: 'easy', questions: 10 },
      { phase: 2, healthThreshold: 50, difficulty: 'medium', questions: 15 },
      { phase: 3, healthThreshold: 0, difficulty: 'hard', questions: 20, specialMechanic: 'Time-Pressure' },
    ],
    raiders: [],
    maxRaiders: 100,
    startTime: new Date().toISOString(),
    duration: 60, // 1 Stunde
    endsAt: new Date(Date.now() + 3600000).toISOString(),
    rewards: {
      participation: { points: 1000 },
      topDamage: { points: 5000, badge: 'raid_mvp' },
      completion: { points: 10000, badge: 'virus_slayer', title: 'Virus-Bezwinger' },
    },
    status: 'spawned',
  },
  
  {
    id: 'hacker_king',
    name: 'Hacker-König',
    description: 'Der mächtigste Hacker aller Zeiten!',
    world: 'it',
    health: 2000,
    maxHealth: 2000,
    difficulty: 'nightmare',
    currentPhase: 1,
    phases: [
      { phase: 1, healthThreshold: 100, difficulty: 'medium', questions: 20 },
      { phase: 2, healthThreshold: 50, difficulty: 'hard', questions: 30 },
      { phase: 3, healthThreshold: 0, difficulty: 'hard', questions: 50, specialMechanic: 'DDoS-Waves' },
    ],
    raiders: [],
    maxRaiders: 200,
    startTime: new Date().toISOString(),
    duration: 120, // 2 Stunden
    endsAt: new Date(Date.now() + 7200000).toISOString(),
    rewards: {
      participation: { points: 2000 },
      topDamage: { points: 15000, badge: 'hacker_hunter' },
      completion: { points: 25000, badge: 'hacker_king_slayer', title: 'Hacker-König-Bezwinger' },
    },
    status: 'spawned',
  },
];

// ===================================================
// HELPER FUNCTIONS
// ===================================================

export function createDuel(
  player1Id: string,
  player2Id: string,
  world: World
): Duel {
  return {
    id: `duel_${Date.now()}`,
    player1: {
      userId: player1Id,
      username: 'Player 1',
      score: 0,
      lives: 3,
      correctAnswers: 0,
      streak: 0,
      ready: false,
      connected: true,
      powerUpsUsed: [],
    },
    player2: {
      userId: player2Id,
      username: 'Player 2',
      score: 0,
      lives: 3,
      correctAnswers: 0,
      streak: 0,
      ready: false,
      connected: true,
      powerUpsUsed: [],
    },
    world,
    difficulty: 'medium',
    questionCount: 10,
    timeLimit: 30000,
    rules: {
      sameQuestions: true,
      sharedLives: false,
      allowPowerUps: true,
      suddenDeath: true,
    },
    currentRound: 0,
    totalRounds: 10,
    status: 'waiting',
    winnerReward: 2000,
    loserReward: 500,
    createdAt: new Date().toISOString(),
  };
}

export function attackRaidBoss(
  boss: RaidBoss,
  damage: number
): { newHealth: number; phaseChanged: boolean; defeated: boolean } {
  const newHealth = Math.max(0, boss.health - damage);
  const oldPhase = boss.currentPhase;
  
  // Check phase transition
  const healthPercentage = (newHealth / boss.maxHealth) * 100;
  let newPhase = oldPhase;
  
  for (let i = boss.phases.length - 1; i >= 0; i--) {
    if (healthPercentage <= boss.phases[i].healthThreshold) {
      newPhase = boss.phases[i].phase;
      break;
    }
  }
  
  const phaseChanged = newPhase !== oldPhase;
  const defeated = newHealth === 0;
  
  return {
    newHealth,
    phaseChanged,
    defeated,
  };
}

export function getActiveDuels(userId: string, duels: Duel[]): Duel[] {
  return duels.filter(
    d => (d.player1.userId === userId || d.player2.userId === userId) &&
         d.status !== 'finished'
  );
}

export function getBattleRoyalePlacement(
  totalPlayers: number,
  currentRank: number
): { tier: string; rewards: number } {
  const topPercent = (currentRank / totalPlayers) * 100;
  
  if (currentRank === 1) {
    return { tier: 'Winner', rewards: 25000 };
  }
  
  if (topPercent <= 5) {
    return { tier: 'Top 5%', rewards: 10000 };
  }
  
  if (topPercent <= 10) {
    return { tier: 'Top 10%', rewards: 5000 };
  }
  
  if (topPercent <= 25) {
    return { tier: 'Top 25%', rewards: 2000 };
  }
  
  return { tier: 'Participant', rewards: 500 };
}



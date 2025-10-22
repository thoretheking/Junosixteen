/**
 * Social Features System
 * Multiplayer, Clans, Mentoring, und Community-Features
 */

import { World } from '../common/types.js';

// ===================================================
// CLANS & GUILDS
// ===================================================

export interface Clan {
  id: string;
  name: string;
  tag: string; // 3-5 Zeichen, z.B. [PRO]
  description: string;
  
  // Members
  members: ClanMember[];
  maxMembers: number;
  memberCount: number;
  
  // Stats
  totalPoints: number;
  totalMissions: number;
  averageLevel: number;
  clanLevel: number;
  
  // Specialization
  primaryWorld?: World;
  expertise: Record<World, number>; // 0-100%
  
  // Perks
  perks: ClanPerk[];
  
  // Settings
  isPublic: boolean;
  requiresApproval: boolean;
  minLevelToJoin: number;
  
  // Metadata
  createdAt: string;
  createdBy: string;
  banner?: string;
  emblem?: string;
}

export interface ClanMember {
  userId: string;
  username: string;
  role: 'leader' | 'officer' | 'member';
  joinedAt: string;
  contribution: number; // Points contributed
  missionsCompleted: number;
  status: 'online' | 'offline' | 'away';
}

export interface ClanPerk {
  id: string;
  name: string;
  description: string;
  effect: string;
  level: number; // Clan-Level required
  cost: number; // Clan-Points
  active: boolean;
}

export const CLAN_PERKS: Record<string, ClanPerk> = {
  shared_lives: {
    id: 'shared_lives',
    name: 'Geteilte Leben',
    description: 'Clan-Mitglieder können sich Leben teilen',
    effect: '+1 Leben am Start wenn Clan-Mitglied online',
    level: 5,
    cost: 10000,
    active: false,
  },
  
  bonus_points: {
    id: 'bonus_points',
    name: 'Clan-Bonus',
    description: '+10% Punkte für alle Mitglieder',
    effect: 'Multiplier 1.1',
    level: 10,
    cost: 25000,
    active: false,
  },
  
  quick_help: {
    id: 'quick_help',
    name: 'Schnelle Hilfe',
    description: 'Kostenlose Hinweise von Clan-Mitgliedern',
    effect: '3 kostenlose Hints pro Tag',
    level: 3,
    cost: 5000,
    active: false,
  },
  
  clan_shop_discount: {
    id: 'clan_shop_discount',
    name: 'Clan-Rabatt',
    description: '20% Rabatt im Shop für Mitglieder',
    effect: 'Multiplier 0.8 für Power-Up-Kosten',
    level: 7,
    cost: 15000,
    active: false,
  },
};

// ===================================================
// MENTORING SYSTEM
// ===================================================

export interface MentorRelation {
  mentorId: string;
  menteeId: string;
  startedAt: string;
  
  // Progress
  sessionsCompleted: number;
  missionsShared: number;
  improvementRate: number; // Mentee improvement %
  
  // Rewards
  mentorPoints: number;
  menteeBonus: number;
  
  // Status
  active: boolean;
  tier: 'bronze' | 'silver' | 'gold'; // Based on sessions
}

export interface MentorProfile {
  userId: string;
  mentorLevel: number; // 1-10
  specialization: World[];
  totalMentees: number;
  activeMentees: number;
  successRate: number; // % of mentees that improved
  
  // Rewards earned
  totalMentorPoints: number;
  mentorBadges: string[];
  
  // Availability
  availableForMentoring: boolean;
  maxMentees: number;
}

export const MENTOR_REWARDS = {
  sessionCompleted: 100,
  menteeImproved: 500,
  menteeAchievement: 250,
  tier_bronze: 1000,
  tier_silver: 2500,
  tier_gold: 5000,
};

// ===================================================
// CO-OP MISSIONS
// ===================================================

export interface CoOpMission {
  id: string;
  title: string;
  description: string;
  world: World;
  
  // Requirements
  minPlayers: number;
  maxPlayers: number;
  minLevel: number;
  
  // Gameplay
  rounds: number;
  questsPerRound: number;
  sharedLives: boolean;
  
  // Rewards
  baseReward: number;
  perfectBonus: number; // Wenn alle Spieler 100%
  speedBonus: number; // Wenn unter Zeit-Limit
  
  // Difficulty scales with player count
  difficultyScaling: number; // Multiplier per player
}

export const COOP_MISSIONS: Record<string, CoOpMission> = {
  team_cleanroom: {
    id: 'team_cleanroom',
    title: 'Team CleanRoom-Challenge',
    description: 'Gemeinsam den Sterilbereich sichern',
    world: 'health',
    minPlayers: 2,
    maxPlayers: 4,
    minLevel: 5,
    rounds: 3,
    questsPerRound: 5,
    sharedLives: true,
    baseReward: 1000,
    perfectBonus: 500,
    speedBonus: 300,
    difficultyScaling: 1.2,
  },
  
  cyber_defense_squad: {
    id: 'cyber_defense_squad',
    title: 'Cyber Defense Squad',
    description: 'Koordinierter Angriff auf Hacker-Netzwerk',
    world: 'it',
    minPlayers: 3,
    maxPlayers: 6,
    minLevel: 10,
    rounds: 5,
    questsPerRound: 4,
    sharedLives: false,
    baseReward: 2000,
    perfectBonus: 1000,
    speedBonus: 500,
    difficultyScaling: 1.3,
  },
};

// ===================================================
// LIVE EVENTS & TOURNAMENTS
// ===================================================

export interface Tournament {
  id: string;
  name: string;
  description: string;
  
  // Schedule
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  
  // Format
  format: 'single_elimination' | 'round_robin' | 'ladder' | 'battle_royale';
  maxParticipants: number;
  currentParticipants: number;
  
  // Rules
  worlds: World[];
  difficulty: 'easy' | 'medium' | 'hard';
  missionCount: number;
  
  // Prizes
  prizes: {
    first: { points: number; title: string; badge: string; exclusive?: string };
    second: { points: number; badge: string };
    third: { points: number; badge: string };
    participation: { points: number };
  };
  
  // Status
  status: 'registration' | 'ongoing' | 'finished';
  currentRound?: number;
  totalRounds?: number;
}

export const TOURNAMENTS: Tournament[] = [
  {
    id: 'tournament_001',
    name: 'JunoSixteen Grand Championship',
    description: 'Das ultimative Turnier! Alle Welten, höchste Schwierigkeit!',
    startDate: '2025-12-01T18:00:00Z',
    endDate: '2025-12-15T20:00:00Z',
    registrationDeadline: '2025-11-30T23:59:59Z',
    format: 'single_elimination',
    maxParticipants: 128,
    currentParticipants: 0,
    worlds: ['health', 'it', 'legal', 'public', 'factory'],
    difficulty: 'hard',
    missionCount: 5,
    prizes: {
      first: {
        points: 100000,
        title: 'Grand Champion 2025',
        badge: 'champion_2025',
        exclusive: 'champion_avatar',
      },
      second: {
        points: 50000,
        badge: 'finalist_2025',
      },
      third: {
        points: 25000,
        badge: 'bronze_2025',
      },
      participation: {
        points: 5000,
      },
    },
    status: 'registration',
  },
];

// ===================================================
// GIFTS & TRADING
// ===================================================

export interface Gift {
  id: string;
  fromUserId: string;
  toUserId: string;
  itemType: 'points' | 'life' | 'power_up' | 'hint' | 'custom';
  itemId?: string;
  amount: number;
  message?: string;
  sentAt: string;
  claimedAt?: string;
  claimed: boolean;
}

export interface TradeOffer {
  id: string;
  fromUserId: string;
  toUserId: string;
  
  // Offered items
  offering: {
    points?: number;
    powerUps?: string[];
    badges?: string[];
  };
  
  // Requested items
  requesting: {
    points?: number;
    powerUps?: string[];
    badges?: string[];
  };
  
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
  expiresAt: string;
}

// ===================================================
// FRIEND SYSTEM
// ===================================================

export interface Friend {
  userId: string;
  username: string;
  avatar?: string;
  level: number;
  status: 'online' | 'offline' | 'in_mission';
  
  // Stats
  totalPoints: number;
  currentStreak: number;
  strongWorld: World;
  
  // Friendship
  friendSince: string;
  missionsCompleted: number; // Together
  lastPlayed?: string;
}

export interface FriendInvite {
  id: string;
  fromUserId: string;
  toUserId: string;
  message?: string;
  sentAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

// ===================================================
// COMMUNITY CHALLENGES
// ===================================================

export interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  
  // Goal
  goal: {
    type: 'total_missions' | 'total_challenges' | 'total_points' | 'world_mastery';
    target: number;
    current: number;
  };
  
  // Timeline
  startDate: string;
  endDate: string;
  
  // Participants
  participantCount: number;
  contributions: Record<string, number>; // userId → contribution
  
  // Rewards (for ALL participants if goal reached)
  rewards: {
    points: number;
    badge?: string;
    powerUp?: string;
    exclusiveContent?: string;
  };
  
  // Milestones
  milestones: Array<{
    percentage: number;
    unlocked: boolean;
    reward: string;
  }>;
  
  status: 'active' | 'completed' | 'failed';
}

export const COMMUNITY_CHALLENGES: CommunityChallenge[] = [
  {
    id: 'community_001',
    title: '1 Million Fragen Challenge',
    description: 'Gemeinsam 1 Million Fragen richtig beantworten!',
    goal: {
      type: 'total_missions',
      target: 100000, // 100k Missionen à 10 Fragen = 1M
      current: 0,
    },
    startDate: '2025-11-01T00:00:00Z',
    endDate: '2025-11-30T23:59:59Z',
    participantCount: 0,
    contributions: {},
    rewards: {
      points: 10000,
      badge: 'community_hero',
      powerUp: 'golden_ticket',
      exclusiveContent: 'community_champion_avatar',
    },
    milestones: [
      { percentage: 25, unlocked: false, reward: '+1000 Punkte für alle' },
      { percentage: 50, unlocked: false, reward: '+1 Leben für alle' },
      { percentage: 75, unlocked: false, reward: 'Legendary Drop garantiert' },
      { percentage: 100, unlocked: false, reward: 'Alle Rewards freigeschaltet!' },
    ],
    status: 'active',
  },
];

// ===================================================
// LIVE CHAT & EMOTES
// ===================================================

export interface EmoteSystem {
  emotes: Emote[];
  recentlyUsed: string[];
  unlocked: string[];
}

export interface Emote {
  id: string;
  name: string;
  icon: string;
  animated: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockCondition?: string;
  cost?: number;
}

export const EMOTES: Record<string, Emote> = {
  thumbs_up: {
    id: 'thumbs_up',
    name: 'Daumen hoch',
    icon: '👍',
    animated: false,
    rarity: 'common',
  },
  
  fire: {
    id: 'fire',
    name: 'Feuer',
    icon: '🔥',
    animated: true,
    rarity: 'common',
  },
  
  brain: {
    id: 'brain',
    name: 'Big Brain',
    icon: '🧠',
    animated: true,
    rarity: 'rare',
    unlockCondition: 'Perfect Mission',
  },
  
  champion: {
    id: 'champion',
    name: 'Champion',
    icon: '👑',
    animated: true,
    rarity: 'legendary',
    unlockCondition: 'Rank #1 Leaderboard',
  },
};

// ===================================================
// SPECTATOR MODE
// ===================================================

export interface SpectatorSession {
  id: string;
  missionId: string;
  playerId: string;
  playerName: string;
  
  // Live data
  currentQuestion: number;
  lives: number;
  points: number;
  streak: number;
  
  // Spectators
  spectators: Spectator[];
  maxSpectators: number;
  
  // Settings
  allowChat: boolean;
  allowTips: boolean;
  
  startedAt: string;
}

export interface Spectator {
  userId: string;
  username: string;
  joinedAt: string;
  cheering: boolean;
  tipsSent: number;
}

// ===================================================
// HELPER FUNCTIONS
// ===================================================

export function createClan(
  name: string,
  tag: string,
  creatorId: string
): Clan {
  return {
    id: `clan_${Date.now()}`,
    name,
    tag: tag.toUpperCase(),
    description: '',
    members: [{
      userId: creatorId,
      username: 'Creator',
      role: 'leader',
      joinedAt: new Date().toISOString(),
      contribution: 0,
      missionsCompleted: 0,
      status: 'online',
    }],
    maxMembers: 50,
    memberCount: 1,
    totalPoints: 0,
    totalMissions: 0,
    averageLevel: 1,
    clanLevel: 1,
    expertise: {
      health: 0,
      it: 0,
      legal: 0,
      public: 0,
      factory: 0,
    },
    perks: [],
    isPublic: true,
    requiresApproval: false,
    minLevelToJoin: 1,
    createdAt: new Date().toISOString(),
    createdBy: creatorId,
  };
}

export function calculateClanLevel(totalPoints: number): number {
  // Clan-Level based on total points
  if (totalPoints < 10000) return 1;
  if (totalPoints < 50000) return 2;
  if (totalPoints < 100000) return 3;
  if (totalPoints < 250000) return 5;
  if (totalPoints < 500000) return 7;
  if (totalPoints < 1000000) return 10;
  return 15;
}

export function canActivatePerk(clan: Clan, perkId: string): boolean {
  const perk = CLAN_PERKS[perkId];
  if (!perk) return false;
  
  if (clan.clanLevel < perk.level) return false;
  if (clan.totalPoints < perk.cost) return false;
  
  return true;
}

export function sendGift(
  fromUserId: string,
  toUserId: string,
  itemType: Gift['itemType'],
  amount: number,
  message?: string
): Gift {
  return {
    id: `gift_${Date.now()}`,
    fromUserId,
    toUserId,
    itemType,
    amount,
    message,
    sentAt: new Date().toISOString(),
    claimed: false,
  };
}

export function calculateMentorBonus(
  menteeImprovement: number
): number {
  // Mentor gets bonus based on mentee improvement
  if (menteeImprovement < 5) return 100;
  if (menteeImprovement < 10) return 250;
  if (menteeImprovement < 20) return 500;
  return 1000;
}



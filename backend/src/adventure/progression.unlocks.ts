/**
 * Progression & Unlocks System
 * Level-System, Skill-Trees, und freischaltbare Inhalte
 */

import { World } from '../common/types.js';

// ===================================================
// LEVEL SYSTEM
// ===================================================

export interface PlayerLevel {
  currentLevel: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  
  // Prestige
  prestigeLevel: number; // Nach Level 100
  prestigeBonus: number; // % Bonus
  
  // Unlocks at current level
  unlockedFeatures: string[];
  nextUnlock?: {
    level: number;
    feature: string;
    description: string;
  };
}

export interface LevelDefinition {
  level: number;
  xpRequired: number;
  cumulativeXP: number;
  
  // Rewards
  rewards: {
    points?: number;
    lives?: number;
    powerUps?: string[];
    badges?: string[];
  };
  
  // Unlocks
  unlocks?: {
    feature: string;
    description: string;
  }[];
}

/**
 * XP Curve - Exponential growth
 */
export function calculateXPRequired(level: number): number {
  // XP = 100 * level^1.5
  return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * Generate level definitions (1-100)
 */
export function generateLevelDefinitions(): LevelDefinition[] {
  const levels: LevelDefinition[] = [];
  let cumulativeXP = 0;
  
  for (let i = 1; i <= 100; i++) {
    const xpRequired = calculateXPRequired(i);
    cumulativeXP += xpRequired;
    
    const level: LevelDefinition = {
      level: i,
      xpRequired,
      cumulativeXP,
      rewards: {},
    };
    
    // Milestone rewards
    if (i % 10 === 0) {
      level.rewards.points = i * 1000;
      level.rewards.lives = 2;
      level.rewards.badges = [`level_${i}_milestone`];
    }
    
    if (i % 25 === 0) {
      level.rewards.powerUps = ['mega_multiplier'];
    }
    
    // Feature unlocks
    level.unlocks = getUnlocksForLevel(i);
    
    levels.push(level);
  }
  
  return levels;
}

/**
 * Get unlocks for specific level
 */
function getUnlocksForLevel(level: number): LevelDefinition['unlocks'] {
  const unlocks: Array<{ feature: string; description: string }> = [];
  
  switch (level) {
    case 3:
      unlocks.push({ feature: 'daily_quests', description: 'Daily Quests freigeschaltet!' });
      break;
    case 5:
      unlocks.push({ feature: 'team_questions', description: 'Team-Fragen verfügbar!' });
      break;
    case 7:
      unlocks.push({ feature: 'power_ups_shop', description: 'Power-Ups Shop geöffnet!' });
      break;
    case 10:
      unlocks.push({ feature: 'clans', description: 'Clans beitreten & gründen!' });
      break;
    case 15:
      unlocks.push({ feature: 'pvp_duels', description: '1v1 Duels verfügbar!' });
      break;
    case 20:
      unlocks.push({ feature: 'mentor_system', description: 'Mentoring freigeschaltet!' });
      break;
    case 25:
      unlocks.push({ feature: 'battle_royale', description: 'Battle Royale-Modus!' });
      break;
    case 30:
      unlocks.push({ feature: 'coop_missions', description: 'Co-Op Missionen!' });
      break;
    case 40:
      unlocks.push({ feature: 'tournaments', description: 'Turniere verfügbar!' });
      break;
    case 50:
      unlocks.push({ feature: 'raid_bosses', description: 'Raid-Bosse spawnen!' });
      break;
    case 75:
      unlocks.push({ feature: 'prestige_shop', description: 'Prestige-Shop geöffnet!' });
      break;
    case 100:
      unlocks.push({ feature: 'prestige_mode', description: 'Prestige-Modus freigeschaltet!' });
      break;
  }
  
  return unlocks;
}

// ===================================================
// SKILL TREES
// ===================================================

export interface SkillTree {
  world: World;
  nodes: SkillNode[];
}

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  
  // Position in tree
  tier: number; // 1-5
  prerequisiteIds: string[];
  
  // Cost
  cost: {
    points: number;
    level?: number;
  };
  
  // Effect
  effect: {
    type: 'passive' | 'active';
    bonus: {
      pointsMultiplier?: number;
      xpMultiplier?: number;
      dropChance?: number;
      challengeBonus?: number;
      livesStart?: number;
    };
  };
  
  // State
  unlocked: boolean;
  purchased: boolean;
}

export const SKILL_TREES: Record<World, SkillNode[]> = {
  health: [
    {
      id: 'health_fundamentals',
      name: 'Hygiene-Grundlagen',
      description: '+5% Punkte in Health-Missionen',
      icon: '🧼',
      tier: 1,
      prerequisiteIds: [],
      cost: { points: 1000, level: 5 },
      effect: {
        type: 'passive',
        bonus: { pointsMultiplier: 1.05 },
      },
      unlocked: true,
      purchased: false,
    },
    {
      id: 'health_master',
      name: 'CleanRoom-Meister',
      description: '+15% Punkte, +1 Leben-Start',
      icon: '🏥',
      tier: 5,
      prerequisiteIds: ['health_fundamentals', 'health_advanced'],
      cost: { points: 25000, level: 50 },
      effect: {
        type: 'passive',
        bonus: { pointsMultiplier: 1.15, livesStart: 1 },
      },
      unlocked: false,
      purchased: false,
    },
  ],
  
  it: [
    {
      id: 'it_fundamentals',
      name: 'IT-Grundlagen',
      description: '+5% Punkte in IT-Missionen',
      icon: '💻',
      tier: 1,
      prerequisiteIds: [],
      cost: { points: 1000, level: 5 },
      effect: {
        type: 'passive',
        bonus: { pointsMultiplier: 1.05 },
      },
      unlocked: true,
      purchased: false,
    },
  ],
  
  legal: [],
  public: [],
  factory: [],
};

// ===================================================
// UNLOCKABLES
// ===================================================

export interface Unlockable {
  id: string;
  type: 'avatar' | 'border' | 'emote' | 'theme' | 'title' | 'challenge' | 'mission' | 'world';
  name: string;
  description: string;
  icon?: string;
  
  // Unlock conditions
  conditions: {
    level?: number;
    achievement?: string;
    points?: number;
    worldMastery?: { world: World; percentage: number };
    seasonRank?: number;
    eventCompletion?: string;
  };
  
  // State
  unlocked: boolean;
  unlockedAt?: string;
}

export const UNLOCKABLES: Unlockable[] = [
  // Avatars
  {
    id: 'legendary_mentor',
    type: 'avatar',
    name: 'Legendärer Mentor',
    description: 'Exklusiver Avatar für 500 Missionen',
    icon: '🌟',
    conditions: { level: 100 },
    unlocked: false,
  },
  
  {
    id: 'neo',
    type: 'avatar',
    name: 'Neo',
    description: 'The One - für das Unmögliche',
    icon: '🕶️',
    conditions: { achievement: 'the_one' },
    unlocked: false,
  },
  
  // Borders
  {
    id: 'rainbow_frame',
    type: 'border',
    name: 'Regenbogen-Rahmen',
    description: 'Für Allwissende',
    conditions: { achievement: 'omniscient' },
    unlocked: false,
  },
  
  {
    id: 'champion_s1_frame',
    type: 'border',
    name: 'Season 1 Champion Frame',
    description: 'Nur für Season 1 Champions',
    conditions: { seasonRank: 1 },
    unlocked: false,
  },
  
  // Worlds
  {
    id: 'secret_world',
    type: 'world',
    name: 'Geheime Welt: Innovation',
    description: 'Freigeschaltet nach 100% in allen Welten',
    conditions: { 
      worldMastery: { world: 'health', percentage: 100 }
    },
    unlocked: false,
  },
  
  // Challenges
  {
    id: 'nightmare_challenges',
    type: 'challenge',
    name: 'Nightmare-Challenges',
    description: 'Extreme Challenges für Experten',
    conditions: { level: 75 },
    unlocked: false,
  },
];

// ===================================================
// XP SOURCES
// ===================================================

export const XP_SOURCES = {
  questionCorrect: 10,
  questionPerfect: 15, // No help, fast answer
  missionComplete: 100,
  missionPerfect: 200,
  challengeWin: 25,
  bossChallengeWin: 50,
  riskQuestionSuccess: 30,
  teamQuestionSuccess: 25,
  dailyQuestComplete: 50,
  weeklyQuestComplete: 200,
  achievementUnlock: 100,
  badgeEarn: 50,
  leaderboardTop10: 500,
  leaderboardTop3: 1000,
  leaderboardRank1: 2000,
  tournamentWin: 5000,
  raidBossDefeat: 1000,
  duelWin: 100,
};

// ===================================================
// PRESTIGE SYSTEM
// ===================================================

export interface PrestigeLevel {
  level: number; // 0, 1, 2, 3...
  
  // Requirements
  requiresLevel: number; // Player must be Level 100+
  
  // Benefits
  benefits: {
    xpMultiplier: number; // 1.1, 1.2, 1.3...
    pointsMultiplier: number;
    exclusiveAvatar?: string;
    exclusiveBorder?: string;
    prestigeShopAccess?: boolean;
  };
  
  // Reset
  keepsProgress: boolean;
  resetsMissions: boolean;
}

export function prestigeUp(currentPrestige: number): PrestigeLevel {
  return {
    level: currentPrestige + 1,
    requiresLevel: 100,
    benefits: {
      xpMultiplier: 1 + (currentPrestige + 1) * 0.1, // +10% per prestige
      pointsMultiplier: 1 + (currentPrestige + 1) * 0.05, // +5% per prestige
      exclusiveAvatar: `prestige_${currentPrestige + 1}_avatar`,
      exclusiveBorder: `prestige_${currentPrestige + 1}_border`,
      prestigeShopAccess: currentPrestige + 1 >= 3,
    },
    keepsProgress: true,
    resetsMissions: false,
  };
}

export function calculatePrestigeBonus(prestigeLevel: number): number {
  return 1 + prestigeLevel * 0.1; // +10% per prestige level
}



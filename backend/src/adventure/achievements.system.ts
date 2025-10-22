/**
 * Achievements System
 * Erweiterte Erfolge & Meilensteine mit Progress-Tracking
 */

import { World } from '../common/types.js';

export type AchievementCategory = 
  | 'missions' 
  | 'challenges' 
  | 'social' 
  | 'mastery' 
  | 'special' 
  | 'collection';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string;
  
  // Progress
  target: number;
  current: number;
  completed: boolean;
  completedAt?: string;
  
  // Requirements
  requirements?: {
    world?: World;
    difficulty?: 'easy' | 'medium' | 'hard';
    timeLimit?: number; // ms
    minStreak?: number;
    noHelpUsed?: boolean;
  };
  
  // Rewards
  rewards: {
    points: number;
    badge?: string;
    title?: string; // Spieler-Titel
    avatar?: string; // Spezielle Avatar-Option
    border?: string; // Profilrahmen
  };
  
  // Secret Achievement?
  isSecret: boolean;
  hint?: string; // Hinweis für Secret Achievements
}

/**
 * Achievement Registry - Alle verfügbaren Achievements
 */
export const ACHIEVEMENT_REGISTRY: Record<string, Achievement> = {
  // ===================================================
  // MISSIONS CATEGORY
  // ===================================================
  
  mission_novice: {
    id: 'mission_novice',
    title: 'Mission Neuling',
    description: 'Schließe deine ersten 5 Missionen ab',
    category: 'missions',
    tier: 'bronze',
    icon: '🎯',
    target: 5,
    current: 0,
    completed: false,
    rewards: {
      points: 500,
      badge: 'novice',
    },
    isSecret: false,
  },

  mission_veteran: {
    id: 'mission_veteran',
    title: 'Mission Veteran',
    description: 'Schließe 25 Missionen ab',
    category: 'missions',
    tier: 'silver',
    icon: '⭐',
    target: 25,
    current: 0,
    completed: false,
    rewards: {
      points: 2500,
      badge: 'veteran',
      title: 'Veteran',
    },
    isSecret: false,
  },

  mission_master: {
    id: 'mission_master',
    title: 'Mission Meister',
    description: 'Schließe 100 Missionen ab',
    category: 'missions',
    tier: 'gold',
    icon: '👑',
    target: 100,
    current: 0,
    completed: false,
    rewards: {
      points: 10000,
      badge: 'master',
      title: 'Meister',
      border: 'gold_frame',
    },
    isSecret: false,
  },

  mission_legend: {
    id: 'mission_legend',
    title: 'Legende',
    description: 'Schließe 500 Missionen ab',
    category: 'missions',
    tier: 'platinum',
    icon: '💎',
    target: 500,
    current: 0,
    completed: false,
    rewards: {
      points: 50000,
      badge: 'legend',
      title: 'Legende',
      border: 'platinum_frame',
      avatar: 'legendary_mentor',
    },
    isSecret: false,
  },

  perfect_streak: {
    id: 'perfect_streak',
    title: 'Perfektionist',
    description: 'Schließe 10 Missionen in Folge perfekt ab (100% richtig)',
    category: 'missions',
    tier: 'gold',
    icon: '✨',
    target: 10,
    current: 0,
    completed: false,
    requirements: {
      noHelpUsed: true,
    },
    rewards: {
      points: 5000,
      badge: 'perfectionist',
      title: 'Perfektionist',
    },
    isSecret: false,
  },

  speed_demon: {
    id: 'speed_demon',
    title: 'Speedrunner',
    description: 'Schließe 5 Missionen in unter 3 Minuten ab',
    category: 'missions',
    tier: 'silver',
    icon: '⚡',
    target: 5,
    current: 0,
    completed: false,
    requirements: {
      timeLimit: 180000, // 3 Minuten
    },
    rewards: {
      points: 3000,
      badge: 'speedrunner',
      title: 'Speedrunner',
    },
    isSecret: false,
  },

  // ===================================================
  // CHALLENGES CATEGORY
  // ===================================================

  challenge_warrior: {
    id: 'challenge_warrior',
    title: 'Challenge-Krieger',
    description: 'Bestehe 50 Challenges erfolgreich',
    category: 'challenges',
    tier: 'silver',
    icon: '⚔️',
    target: 50,
    current: 0,
    completed: false,
    rewards: {
      points: 2000,
      badge: 'warrior',
    },
    isSecret: false,
  },

  boss_slayer: {
    id: 'boss_slayer',
    title: 'Boss-Bezwinger',
    description: 'Besiege 25 Boss-Challenges',
    category: 'challenges',
    tier: 'gold',
    icon: '🗡️',
    target: 25,
    current: 0,
    completed: false,
    rewards: {
      points: 5000,
      badge: 'boss_slayer',
      title: 'Boss-Bezwinger',
    },
    isSecret: false,
  },

  flawless_victory: {
    id: 'flawless_victory',
    title: 'Makelloser Sieg',
    description: 'Bestehe 10 Challenges mit perfektem Score',
    category: 'challenges',
    tier: 'gold',
    icon: '💫',
    target: 10,
    current: 0,
    completed: false,
    rewards: {
      points: 4000,
      badge: 'flawless',
      title: 'Makellos',
    },
    isSecret: false,
  },

  // ===================================================
  // SOCIAL CATEGORY
  // ===================================================

  team_player: {
    id: 'team_player',
    title: 'Teamplayer',
    description: 'Beantworte 50 Team-Fragen erfolgreich',
    category: 'social',
    tier: 'silver',
    icon: '🤝',
    target: 50,
    current: 0,
    completed: false,
    rewards: {
      points: 2500,
      badge: 'team_player',
      title: 'Teamplayer',
    },
    isSecret: false,
  },

  leader: {
    id: 'leader',
    title: 'Anführer',
    description: 'Erreiche Platz 1 im Wochen-Leaderboard',
    category: 'social',
    tier: 'gold',
    icon: '👑',
    target: 1,
    current: 0,
    completed: false,
    rewards: {
      points: 5000,
      badge: 'leader',
      title: 'Anführer',
      border: 'leader_frame',
    },
    isSecret: false,
  },

  helper: {
    id: 'helper',
    title: 'Helfer',
    description: 'Helfe 100 Teammitgliedern bei Team-Fragen',
    category: 'social',
    tier: 'silver',
    icon: '💝',
    target: 100,
    current: 0,
    completed: false,
    rewards: {
      points: 3000,
      badge: 'helper',
      title: 'Helfer',
    },
    isSecret: false,
  },

  // ===================================================
  // MASTERY CATEGORY (World-specific)
  // ===================================================

  health_master: {
    id: 'health_master',
    title: 'Gesundheits-Meister',
    description: 'Erreiche 100% Mastery in Health',
    category: 'mastery',
    tier: 'platinum',
    icon: '🏥',
    target: 100,
    current: 0,
    completed: false,
    requirements: {
      world: 'health',
    },
    rewards: {
      points: 15000,
      badge: 'health_master',
      title: 'Gesundheits-Meister',
      border: 'health_frame',
    },
    isSecret: false,
  },

  it_master: {
    id: 'it_master',
    title: 'IT-Meister',
    description: 'Erreiche 100% Mastery in IT',
    category: 'mastery',
    tier: 'platinum',
    icon: '💻',
    target: 100,
    current: 0,
    completed: false,
    requirements: {
      world: 'it',
    },
    rewards: {
      points: 15000,
      badge: 'it_master',
      title: 'IT-Meister',
      border: 'it_frame',
    },
    isSecret: false,
  },

  legal_master: {
    id: 'legal_master',
    title: 'Rechts-Meister',
    description: 'Erreiche 100% Mastery in Legal',
    category: 'mastery',
    tier: 'platinum',
    icon: '⚖️',
    target: 100,
    current: 0,
    completed: false,
    requirements: {
      world: 'legal',
    },
    rewards: {
      points: 15000,
      badge: 'legal_master',
      title: 'Rechts-Meister',
      border: 'legal_frame',
    },
    isSecret: false,
  },

  public_master: {
    id: 'public_master',
    title: 'Verwaltungs-Meister',
    description: 'Erreiche 100% Mastery in Public',
    category: 'mastery',
    tier: 'platinum',
    icon: '🏛️',
    target: 100,
    current: 0,
    completed: false,
    requirements: {
      world: 'public',
    },
    rewards: {
      points: 15000,
      badge: 'public_master',
      title: 'Verwaltungs-Meister',
      border: 'public_frame',
    },
    isSecret: false,
  },

  factory_master: {
    id: 'factory_master',
    title: 'Produktions-Meister',
    description: 'Erreiche 100% Mastery in Factory',
    category: 'mastery',
    tier: 'platinum',
    icon: '🏭',
    target: 100,
    current: 0,
    completed: false,
    requirements: {
      world: 'factory',
    },
    rewards: {
      points: 15000,
      badge: 'factory_master',
      title: 'Produktions-Meister',
      border: 'factory_frame',
    },
    isSecret: false,
  },

  omniscient: {
    id: 'omniscient',
    title: 'Allwissend',
    description: 'Erreiche 100% Mastery in ALLEN Welten',
    category: 'mastery',
    tier: 'diamond',
    icon: '🌟',
    target: 5,
    current: 0,
    completed: false,
    rewards: {
      points: 100000,
      badge: 'omniscient',
      title: 'Der/Die Allwissende',
      border: 'rainbow_frame',
      avatar: 'grand_master',
    },
    isSecret: false,
  },

  // ===================================================
  // COLLECTION CATEGORY
  // ===================================================

  collector: {
    id: 'collector',
    title: 'Sammler',
    description: 'Sammle 50 verschiedene Items',
    category: 'collection',
    tier: 'silver',
    icon: '🎁',
    target: 50,
    current: 0,
    completed: false,
    rewards: {
      points: 2000,
      badge: 'collector',
    },
    isSecret: false,
  },

  rare_hunter: {
    id: 'rare_hunter',
    title: 'Seltener Jäger',
    description: 'Erhalte 10 Rare Drops',
    category: 'collection',
    tier: 'silver',
    icon: '🌟',
    target: 10,
    current: 0,
    completed: false,
    rewards: {
      points: 3000,
      badge: 'rare_hunter',
      title: 'Jäger',
    },
    isSecret: false,
  },

  legendary_finder: {
    id: 'legendary_finder',
    title: 'Legenden-Finder',
    description: 'Erhalte 1 Legendary Drop',
    category: 'collection',
    tier: 'platinum',
    icon: '👑',
    target: 1,
    current: 0,
    completed: false,
    rewards: {
      points: 10000,
      badge: 'legendary_finder',
      title: 'Legenden-Finder',
    },
    isSecret: false,
  },

  easter_egg_hunter: {
    id: 'easter_egg_hunter',
    title: 'Easter Egg Jäger',
    description: 'Finde alle 4 Easter Eggs',
    category: 'collection',
    tier: 'gold',
    icon: '🥚',
    target: 4,
    current: 0,
    completed: false,
    rewards: {
      points: 7777,
      badge: 'easter_egg_hunter',
      title: 'Easter Egg Jäger',
    },
    isSecret: false,
  },

  // ===================================================
  // SPECIAL CATEGORY (Secret & Unique)
  // ===================================================

  night_owl: {
    id: 'night_owl',
    title: 'Nachteule',
    description: 'Schließe 10 Missionen zwischen 22:00 und 06:00 Uhr ab',
    category: 'special',
    tier: 'bronze',
    icon: '🦉',
    target: 10,
    current: 0,
    completed: false,
    rewards: {
      points: 1000,
      badge: 'night_owl',
      title: 'Nachteule',
    },
    isSecret: true,
    hint: 'Spiele spät in der Nacht...',
  },

  early_bird: {
    id: 'early_bird',
    title: 'Frühaufsteher',
    description: 'Schließe 10 Missionen zwischen 05:00 und 08:00 Uhr ab',
    category: 'special',
    tier: 'bronze',
    icon: '🐦',
    target: 10,
    current: 0,
    completed: false,
    rewards: {
      points: 1000,
      badge: 'early_bird',
      title: 'Frühaufsteher',
    },
    isSecret: true,
    hint: 'Der frühe Vogel fängt den Wurm...',
  },

  persistent: {
    id: 'persistent',
    title: 'Beharrlich',
    description: 'Spiele 30 Tage in Folge',
    category: 'special',
    tier: 'gold',
    icon: '📅',
    target: 30,
    current: 0,
    completed: false,
    rewards: {
      points: 5000,
      badge: 'persistent',
      title: 'Der/Die Beharrliche',
    },
    isSecret: false,
  },

  comeback_kid: {
    id: 'comeback_kid',
    title: 'Comeback-Kid',
    description: 'Gewinne 5 Missionen mit nur 1 Leben übrig',
    category: 'special',
    tier: 'silver',
    icon: '💪',
    target: 5,
    current: 0,
    completed: false,
    rewards: {
      points: 2500,
      badge: 'comeback_kid',
      title: 'Comeback-Kid',
    },
    isSecret: false,
  },

  risk_taker: {
    id: 'risk_taker',
    title: 'Risikofreudiger',
    description: 'Bestehe 50 Risikofragen erfolgreich',
    category: 'special',
    tier: 'gold',
    icon: '🎲',
    target: 50,
    current: 0,
    completed: false,
    rewards: {
      points: 4000,
      badge: 'risk_taker',
      title: 'Risikofreudiger',
    },
    isSecret: false,
  },

  unstoppable: {
    id: 'unstoppable',
    title: 'Unaufhaltsam',
    description: 'Erreiche einen 50er-Streak',
    category: 'special',
    tier: 'platinum',
    icon: '🔥',
    target: 50,
    current: 0,
    completed: false,
    rewards: {
      points: 20000,
      badge: 'unstoppable',
      title: 'Der/Die Unaufhaltsame',
      border: 'fire_frame',
    },
    isSecret: false,
  },

  the_one: {
    id: 'the_one',
    title: 'The One',
    description: '???',
    category: 'special',
    tier: 'diamond',
    icon: '✨',
    target: 1,
    current: 0,
    completed: false,
    rewards: {
      points: 1000000,
      badge: 'the_one',
      title: 'The One',
      border: 'matrix_frame',
      avatar: 'neo',
    },
    isSecret: true,
    hint: 'Erreiche das Unmögliche...',
  },
};

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return Object.values(ACHIEVEMENT_REGISTRY).filter(a => a.category === category);
}

/**
 * Get achievements by tier
 */
export function getAchievementsByTier(tier: AchievementTier): Achievement[] {
  return Object.values(ACHIEVEMENT_REGISTRY).filter(a => a.tier === tier);
}

/**
 * Get secret achievements
 */
export function getSecretAchievements(): Achievement[] {
  return Object.values(ACHIEVEMENT_REGISTRY).filter(a => a.isSecret);
}

/**
 * Get completed achievements
 */
export function getCompletedAchievements(achievements: Achievement[]): Achievement[] {
  return achievements.filter(a => a.completed);
}

/**
 * Update achievement progress
 */
export function updateAchievementProgress(
  achievement: Achievement,
  increment: number = 1
): Achievement {
  const updated = { ...achievement };
  updated.current = Math.min(achievement.current + increment, achievement.target);
  
  if (updated.current >= updated.target && !updated.completed) {
    updated.completed = true;
    updated.completedAt = new Date().toISOString();
  }
  
  return updated;
}

/**
 * Calculate completion percentage
 */
export function getCompletionPercentage(achievements: Achievement[]): number {
  const total = achievements.length;
  const completed = achievements.filter(a => a.completed).length;
  return Math.round((completed / total) * 100);
}

/**
 * Get achievement statistics
 */
export function getAchievementStats() {
  const achievements = Object.values(ACHIEVEMENT_REGISTRY);
  
  return {
    total: achievements.length,
    byCategory: {
      missions: getAchievementsByCategory('missions').length,
      challenges: getAchievementsByCategory('challenges').length,
      social: getAchievementsByCategory('social').length,
      mastery: getAchievementsByCategory('mastery').length,
      collection: getAchievementsByCategory('collection').length,
      special: getAchievementsByCategory('special').length,
    },
    byTier: {
      bronze: getAchievementsByTier('bronze').length,
      silver: getAchievementsByTier('silver').length,
      gold: getAchievementsByTier('gold').length,
      platinum: getAchievementsByTier('platinum').length,
      diamond: getAchievementsByTier('diamond').length,
    },
    secretAchievements: getSecretAchievements().length,
  };
}

/**
 * Get next achievement to unlock (closest to completion)
 */
export function getNextAchievement(achievements: Achievement[]): Achievement | null {
  const incomplete = achievements.filter(a => !a.completed && a.current > 0);
  
  if (incomplete.length === 0) return null;
  
  // Sort by progress percentage (descending)
  const sorted = incomplete.sort((a, b) => {
    const aProgress = a.current / a.target;
    const bProgress = b.current / b.target;
    return bProgress - aProgress;
  });
  
  return sorted[0];
}

/**
 * Check if achievement should be unlocked based on context
 */
export function checkAchievementUnlock(
  achievementId: string,
  context: {
    hour?: number;
    streak?: number;
    world?: World;
    lives?: number;
    riskQuestion?: boolean;
  }
): boolean {
  const achievement = ACHIEVEMENT_REGISTRY[achievementId];
  if (!achievement || achievement.completed) return false;

  // Check requirements
  if (achievement.requirements) {
    if (achievement.requirements.world && achievement.requirements.world !== context.world) {
      return false;
    }
    if (achievement.requirements.minStreak && (context.streak ?? 0) < achievement.requirements.minStreak) {
      return false;
    }
  }

  // Special cases
  if (achievementId === 'night_owl') {
    const hour = context.hour ?? new Date().getHours();
    return hour >= 22 || hour < 6;
  }

  if (achievementId === 'early_bird') {
    const hour = context.hour ?? new Date().getHours();
    return hour >= 5 && hour < 8;
  }

  if (achievementId === 'comeback_kid') {
    return context.lives === 1;
  }

  return true;
}



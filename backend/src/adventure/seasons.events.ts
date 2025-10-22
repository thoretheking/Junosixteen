/**
 * Seasons & Events System
 * Zeitbasierte Events, Seasons, und spezielle Herausforderungen
 */

import { World } from '../common/types.js';

export type EventType = 'seasonal' | 'holiday' | 'special' | 'community';
export type SeasonTheme = 'spring' | 'summer' | 'autumn' | 'winter';

export interface Season {
  id: string;
  number: number;
  name: string;
  theme: SeasonTheme;
  startDate: string;
  endDate: string;
  description: string;
  
  // Rewards
  rewards: {
    completionBadge: string;
    topPlayerRewards: {
      rank1: { points: number; title: string; border: string };
      rank2: { points: number; title: string };
      rank3: { points: number; title: string };
      top10: { points: number; badge: string };
      top50: { points: number };
    };
  };
  
  // Special rules
  specialRules?: {
    doublePoints?: boolean;
    bonusChallenges?: string[];
    exclusiveMissions?: string[];
  };
  
  active: boolean;
}

export interface SpecialEvent {
  id: string;
  name: string;
  description: string;
  type: EventType;
  startDate: string;
  endDate: string;
  
  // Event-specific content
  missions?: string[]; // Spezielle Event-Missionen
  challenges?: string[];
  quests?: string[];
  
  // Rewards
  rewards: {
    participationBadge?: string;
    completionPoints: number;
    exclusiveItems?: string[];
  };
  
  // Requirements
  requirements?: {
    minLevel?: number;
    worlds?: World[];
  };
  
  // Status
  active: boolean;
  participantCount?: number;
}

/**
 * Season Registry
 */
export const SEASONS: Record<string, Season> = {
  season_2025_q1: {
    id: 'season_2025_q1',
    number: 1,
    name: 'Saison 1: Frühlings-Erwachen',
    theme: 'spring',
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-03-31T23:59:59Z',
    description: 'Die erste Saison von JunoSixteen! Neue Anfänge, neue Herausforderungen!',
    rewards: {
      completionBadge: 'season_1_veteran',
      topPlayerRewards: {
        rank1: {
          points: 50000,
          title: 'Season 1 Champion',
          border: 'champion_s1_frame',
        },
        rank2: {
          points: 25000,
          title: 'Season 1 Finalist',
        },
        rank3: {
          points: 15000,
          title: 'Season 1 Top 3',
        },
        top10: {
          points: 5000,
          badge: 'season_1_top10',
        },
        top50: {
          points: 1000,
        },
      },
    },
    specialRules: {
      doublePoints: false,
    },
    active: true,
  },

  season_2025_q2: {
    id: 'season_2025_q2',
    number: 2,
    name: 'Saison 2: Sommer-Sprint',
    theme: 'summer',
    startDate: '2025-04-01T00:00:00Z',
    endDate: '2025-06-30T23:59:59Z',
    description: 'Heißer Sommer, heiße Challenges! Speed-Missionen und Bonus-Events!',
    rewards: {
      completionBadge: 'season_2_veteran',
      topPlayerRewards: {
        rank1: {
          points: 75000,
          title: 'Summer Champion',
          border: 'champion_s2_frame',
        },
        rank2: {
          points: 35000,
          title: 'Summer Finalist',
        },
        rank3: {
          points: 20000,
          title: 'Summer Top 3',
        },
        top10: {
          points: 7500,
          badge: 'season_2_top10',
        },
        top50: {
          points: 2000,
        },
      },
    },
    specialRules: {
      doublePoints: true,
      bonusChallenges: ['summer_sprint', 'heat_wave'],
    },
    active: false,
  },
};

/**
 * Special Events Registry
 */
export const SPECIAL_EVENTS: Record<string, SpecialEvent> = {
  halloween_2025: {
    id: 'halloween_2025',
    name: 'Halloween Horror',
    description: 'Gruselige Missionen und spezielle Halloween-Challenges!',
    type: 'holiday',
    startDate: '2025-10-25T00:00:00Z',
    endDate: '2025-10-31T23:59:59Z',
    missions: ['haunted_cleanroom', 'zombie_network', 'legal_nightmare'],
    challenges: ['pumpkin_carve', 'ghost_hunt'],
    rewards: {
      participationBadge: 'halloween_2025',
      completionPoints: 5000,
      exclusiveItems: ['pumpkin_avatar', 'ghost_border'],
    },
    active: false,
  },

  christmas_2025: {
    id: 'christmas_2025',
    name: 'Weihnachts-Wunder',
    description: 'Festliche Missionen und Winter-Specials!',
    type: 'holiday',
    startDate: '2025-12-15T00:00:00Z',
    endDate: '2025-12-31T23:59:59Z',
    missions: ['santa_cleanroom', 'cyber_christmas', 'legal_gifts'],
    challenges: ['gift_wrap', 'snow_challenge'],
    rewards: {
      participationBadge: 'christmas_2025',
      completionPoints: 7500,
      exclusiveItems: ['santa_avatar', 'snow_border'],
    },
    active: false,
  },

  community_challenge: {
    id: 'community_challenge_001',
    name: 'Community Challenge #1',
    description: 'Gemeinsam 1 Million Fragen beantworten!',
    type: 'community',
    startDate: '2025-11-01T00:00:00Z',
    endDate: '2025-11-30T23:59:59Z',
    rewards: {
      completionPoints: 10000,
      exclusiveItems: ['community_hero_badge'],
    },
    requirements: {
      minLevel: 5,
    },
    active: true,
  },

  cyber_week: {
    id: 'cyber_week_2025',
    name: 'Cyber Security Week',
    description: 'Eine Woche voller IT-Security-Challenges!',
    type: 'special',
    startDate: '2025-11-15T00:00:00Z',
    endDate: '2025-11-22T23:59:59Z',
    missions: ['advanced_firewall', 'zero_day_defense', 'social_engineering'],
    challenges: ['hack_defense', 'encryption_master'],
    rewards: {
      participationBadge: 'cyber_week_2025',
      completionPoints: 8000,
      exclusiveItems: ['hacker_avatar', 'matrix_border'],
    },
    requirements: {
      worlds: ['it'],
    },
    active: true,
  },
};

/**
 * Get current season
 */
export function getCurrentSeason(): Season | null {
  const now = new Date().toISOString();

  for (const season of Object.values(SEASONS)) {
    if (season.startDate <= now && season.endDate >= now) {
      return season;
    }
  }

  return null;
}

/**
 * Get active events
 */
export function getActiveEvents(): SpecialEvent[] {
  const now = new Date().toISOString();

  return Object.values(SPECIAL_EVENTS).filter(
    event => event.active && event.startDate <= now && event.endDate >= now
  );
}

/**
 * Get upcoming events
 */
export function getUpcomingEvents(days: number = 7): SpecialEvent[] {
  const now = new Date();
  const future = new Date();
  future.setDate(now.getDate() + days);

  const nowStr = now.toISOString();
  const futureStr = future.toISOString();

  return Object.values(SPECIAL_EVENTS).filter(
    event => event.startDate > nowStr && event.startDate <= futureStr
  );
}

/**
 * Check if user can participate in event
 */
export function canParticipateInEvent(
  event: SpecialEvent,
  userLevel: number,
  userWorlds: World[]
): { canParticipate: boolean; reason?: string } {
  if (!event.requirements) {
    return { canParticipate: true };
  }

  if (event.requirements.minLevel && userLevel < event.requirements.minLevel) {
    return {
      canParticipate: false,
      reason: `Level ${event.requirements.minLevel} erforderlich`,
    };
  }

  if (event.requirements.worlds) {
    const hasRequiredWorld = event.requirements.worlds.some(w => userWorlds.includes(w));
    if (!hasRequiredWorld) {
      return {
        canParticipate: false,
        reason: `Mindestens eine Mission in ${event.requirements.worlds.join(', ')} erforderlich`,
      };
    }
  }

  return { canParticipate: true };
}

/**
 * Get season progress
 */
export function getSeasonProgress(season: Season): {
  daysRemaining: number;
  progressPercentage: number;
  isEnding: boolean;
} {
  const now = new Date();
  const start = new Date(season.startDate);
  const end = new Date(season.endDate);

  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const remaining = end.getTime() - now.getTime();

  const daysRemaining = Math.ceil(remaining / (1000 * 60 * 60 * 24));
  const progressPercentage = Math.round((elapsed / totalDuration) * 100);
  const isEnding = daysRemaining <= 7; // Last week

  return {
    daysRemaining,
    progressPercentage,
    isEnding,
  };
}

/**
 * Get event countdown
 */
export function getEventCountdown(event: SpecialEvent): {
  active: boolean;
  startsIn?: number; // ms
  endsIn?: number; // ms
  status: 'upcoming' | 'active' | 'ended';
} {
  const now = new Date();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  if (now < start) {
    return {
      active: false,
      startsIn: start.getTime() - now.getTime(),
      status: 'upcoming',
    };
  }

  if (now > end) {
    return {
      active: false,
      status: 'ended',
    };
  }

  return {
    active: true,
    endsIn: end.getTime() - now.getTime(),
    status: 'active',
  };
}

/**
 * Calculate season rank rewards
 */
export function calculateSeasonRewards(
  rank: number,
  season: Season
): {
  points: number;
  badge?: string;
  title?: string;
  border?: string;
} {
  const rewards = season.rewards.topPlayerRewards;

  if (rank === 1) return rewards.rank1;
  if (rank === 2) return rewards.rank2;
  if (rank === 3) return rewards.rank3;
  if (rank <= 10) return rewards.top10;
  if (rank <= 50) return rewards.top50;

  return { points: 0 };
}

/**
 * Get themed bonus for season
 */
export function getSeasonalBonus(season: Season): number {
  const bonuses: Record<SeasonTheme, number> = {
    spring: 1.1, // +10% points
    summer: 1.25, // +25% points (summer sprint!)
    autumn: 1.15, // +15% points
    winter: 1.2, // +20% points (holiday season)
  };

  return bonuses[season.theme];
}

/**
 * Check for special event rewards
 */
export function checkEventCompletion(
  event: SpecialEvent,
  userProgress: {
    missionsCompleted: string[];
    challengesCompleted: string[];
  }
): {
  completed: boolean;
  progress: number;
  rewards?: any;
} {
  if (!event.missions && !event.challenges) {
    return { completed: false, progress: 0 };
  }

  let completed = 0;
  let total = 0;

  if (event.missions) {
    total += event.missions.length;
    completed += event.missions.filter(m => 
      userProgress.missionsCompleted.includes(m)
    ).length;
  }

  if (event.challenges) {
    total += event.challenges.length;
    completed += event.challenges.filter(c => 
      userProgress.challengesCompleted.includes(c)
    ).length;
  }

  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isCompleted = progress === 100;

  return {
    completed: isCompleted,
    progress,
    rewards: isCompleted ? event.rewards : undefined,
  };
}



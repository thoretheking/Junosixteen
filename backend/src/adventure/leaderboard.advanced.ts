/**
 * Advanced Leaderboard System
 * Multi-dimensional rankings with seasons, worlds, and custom metrics
 */

import { World } from '../common/types.js';

export type LeaderboardType = 
  | 'global' 
  | 'world' 
  | 'weekly' 
  | 'monthly' 
  | 'seasonal' 
  | 'team' 
  | 'challenge';

export type LeaderboardMetric = 
  | 'points' 
  | 'missions_completed' 
  | 'perfect_missions' 
  | 'challenges_won' 
  | 'streak' 
  | 'speed' 
  | 'consistency';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  metric: LeaderboardMetric;
  
  // Additional stats
  stats?: {
    missionsCompleted?: number;
    challengesWon?: number;
    currentStreak?: number;
    averageSpeed?: number; // Sekunden pro Mission
    perfectMissions?: number;
    totalPoints?: number;
  };
  
  // Badges & Titles
  title?: string;
  badges: string[];
  border?: string;
  
  // Trend
  previousRank?: number;
  trend?: 'up' | 'down' | 'same' | 'new';
  
  // Metadata
  world?: World;
  teamId?: string;
  season?: string;
  updatedAt: string;
}

export interface Leaderboard {
  id: string;
  type: LeaderboardType;
  metric: LeaderboardMetric;
  title: string;
  description: string;
  
  // Scope
  world?: World;
  season?: string;
  startDate?: string;
  endDate?: string;
  
  // Entries
  entries: LeaderboardEntry[];
  totalEntries: number;
  
  // Metadata
  updatedAt: string;
  refreshInterval: number; // Sekunden
}

/**
 * Create global leaderboard
 */
export function createGlobalLeaderboard(
  entries: LeaderboardEntry[],
  metric: LeaderboardMetric = 'points'
): Leaderboard {
  return {
    id: `global_${metric}`,
    type: 'global',
    metric,
    title: `Global ${getMetricName(metric)} Leaderboard`,
    description: 'Die besten Spieler weltweit',
    entries: sortAndRankEntries(entries, metric),
    totalEntries: entries.length,
    updatedAt: new Date().toISOString(),
    refreshInterval: 300, // 5 Minuten
  };
}

/**
 * Create world-specific leaderboard
 */
export function createWorldLeaderboard(
  world: World,
  entries: LeaderboardEntry[],
  metric: LeaderboardMetric = 'points'
): Leaderboard {
  const worldEntries = entries.filter(e => e.world === world);

  return {
    id: `world_${world}_${metric}`,
    type: 'world',
    metric,
    title: `${getWorldName(world)} ${getMetricName(metric)} Leaderboard`,
    description: `Die besten in der ${getWorldName(world)}-Welt`,
    world,
    entries: sortAndRankEntries(worldEntries, metric),
    totalEntries: worldEntries.length,
    updatedAt: new Date().toISOString(),
    refreshInterval: 300,
  };
}

/**
 * Create weekly leaderboard
 */
export function createWeeklyLeaderboard(
  entries: LeaderboardEntry[],
  metric: LeaderboardMetric = 'points'
): Leaderboard {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  return {
    id: `weekly_${weekStart.toISOString().split('T')[0]}_${metric}`,
    type: 'weekly',
    metric,
    title: `Wöchentliches ${getMetricName(metric)} Leaderboard`,
    description: 'Die besten dieser Woche',
    startDate: weekStart.toISOString(),
    endDate: weekEnd.toISOString(),
    entries: sortAndRankEntries(entries, metric),
    totalEntries: entries.length,
    updatedAt: new Date().toISOString(),
    refreshInterval: 60, // 1 Minute
  };
}

/**
 * Create seasonal leaderboard
 */
export function createSeasonalLeaderboard(
  seasonId: string,
  entries: LeaderboardEntry[],
  metric: LeaderboardMetric = 'points'
): Leaderboard {
  return {
    id: `season_${seasonId}_${metric}`,
    type: 'seasonal',
    metric,
    title: `Season ${seasonId} ${getMetricName(metric)} Leaderboard`,
    description: `Die Champions der Saison ${seasonId}`,
    season: seasonId,
    entries: sortAndRankEntries(entries, metric),
    totalEntries: entries.length,
    updatedAt: new Date().toISOString(),
    refreshInterval: 600, // 10 Minuten
  };
}

/**
 * Create challenge-specific leaderboard
 */
export function createChallengeLeaderboard(
  challengeId: string,
  entries: LeaderboardEntry[]
): Leaderboard {
  return {
    id: `challenge_${challengeId}`,
    type: 'challenge',
    metric: 'speed',
    title: `Challenge: ${challengeId} - Speed Leaderboard`,
    description: 'Schnellste Spieler bei dieser Challenge',
    entries: sortAndRankEntries(entries, 'speed'),
    totalEntries: entries.length,
    updatedAt: new Date().toISOString(),
    refreshInterval: 300,
  };
}

/**
 * Sort and rank entries by metric
 */
function sortAndRankEntries(
  entries: LeaderboardEntry[],
  metric: LeaderboardMetric
): LeaderboardEntry[] {
  // Sort by score (descending for most metrics, ascending for speed)
  const sorted = [...entries].sort((a, b) => {
    if (metric === 'speed') {
      return a.score - b.score; // Lower is better
    }
    return b.score - a.score; // Higher is better
  });

  // Assign ranks
  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    sorted[i].rank = currentRank;

    // Calculate trend
    if (sorted[i].previousRank) {
      const prev = sorted[i].previousRank!;
      if (prev > currentRank) {
        sorted[i].trend = 'up';
      } else if (prev < currentRank) {
        sorted[i].trend = 'down';
      } else {
        sorted[i].trend = 'same';
      }
    } else {
      sorted[i].trend = 'new';
    }

    currentRank++;
  }

  return sorted;
}

/**
 * Get user position in leaderboard
 */
export function getUserPosition(
  leaderboard: Leaderboard,
  userId: string
): LeaderboardEntry | null {
  return leaderboard.entries.find(e => e.userId === userId) || null;
}

/**
 * Get top N entries
 */
export function getTopEntries(leaderboard: Leaderboard, n: number = 10): LeaderboardEntry[] {
  return leaderboard.entries.slice(0, n);
}

/**
 * Get entries around user (for context)
 */
export function getEntriesAroundUser(
  leaderboard: Leaderboard,
  userId: string,
  range: number = 5
): LeaderboardEntry[] {
  const userEntry = getUserPosition(leaderboard, userId);
  if (!userEntry) return [];

  const userRank = userEntry.rank;
  const start = Math.max(0, userRank - range - 1);
  const end = Math.min(leaderboard.entries.length, userRank + range);

  return leaderboard.entries.slice(start, end);
}

/**
 * Calculate percentile rank
 */
export function getPercentileRank(leaderboard: Leaderboard, userId: string): number {
  const userEntry = getUserPosition(leaderboard, userId);
  if (!userEntry) return 0;

  const rank = userEntry.rank;
  const total = leaderboard.totalEntries;

  return Math.round((1 - (rank - 1) / total) * 100);
}

/**
 * Get metric name in German
 */
function getMetricName(metric: LeaderboardMetric): string {
  const names: Record<LeaderboardMetric, string> = {
    points: 'Punkte',
    missions_completed: 'Missionen',
    perfect_missions: 'Perfekte Missionen',
    challenges_won: 'Challenges',
    streak: 'Streak',
    speed: 'Geschwindigkeit',
    consistency: 'Konstanz',
  };
  return names[metric];
}

/**
 * Get world name in German
 */
function getWorldName(world: World): string {
  const names: Record<World, string> = {
    health: 'Gesundheitswesen',
    it: 'IT-Sicherheit',
    legal: 'Rechtswesen',
    public: 'Verwaltung',
    factory: 'Produktion',
  };
  return names[world];
}

/**
 * Get rewards for leaderboard position
 */
export function getLeaderboardRewards(rank: number): {
  points: number;
  badge?: string;
  title?: string;
} {
  if (rank === 1) {
    return {
      points: 10000,
      badge: 'first_place',
      title: 'Champion',
    };
  }

  if (rank === 2) {
    return {
      points: 5000,
      badge: 'second_place',
      title: 'Vize-Champion',
    };
  }

  if (rank === 3) {
    return {
      points: 2500,
      badge: 'third_place',
      title: 'Bronze-Medaillist',
    };
  }

  if (rank <= 10) {
    return {
      points: 1000,
      badge: 'top_ten',
    };
  }

  if (rank <= 50) {
    return {
      points: 500,
    };
  }

  return { points: 0 };
}

/**
 * Get season information
 */
export function getCurrentSeason(): {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  theme: string;
} {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Seasons: Q1, Q2, Q3, Q4
  const quarter = Math.floor(month / 3) + 1;
  
  const seasonStart = new Date(year, (quarter - 1) * 3, 1);
  const seasonEnd = new Date(year, quarter * 3, 0);

  const themes = [
    'Frühlings-Erwachen',
    'Sommer-Sprint',
    'Herbst-Challenge',
    'Winter-Meisterschaft',
  ];

  return {
    id: `${year}_Q${quarter}`,
    name: `Saison ${year} Q${quarter}`,
    startDate: seasonStart.toISOString(),
    endDate: seasonEnd.toISOString(),
    theme: themes[quarter - 1],
  };
}

/**
 * Create team leaderboard
 */
export function createTeamLeaderboard(
  teamEntries: Array<{
    teamId: string;
    teamName: string;
    totalPoints: number;
    memberCount: number;
    avgPointsPerMember: number;
  }>
): Leaderboard {
  const entries: LeaderboardEntry[] = teamEntries.map((team, index) => ({
    rank: index + 1,
    userId: team.teamId,
    username: team.teamName,
    score: team.totalPoints,
    metric: 'points',
    stats: {
      totalPoints: team.totalPoints,
      missionsCompleted: team.memberCount * 10, // Estimate
    },
    badges: [],
    updatedAt: new Date().toISOString(),
    teamId: team.teamId,
  }));

  return {
    id: 'team_global',
    type: 'team',
    metric: 'points',
    title: 'Team Leaderboard',
    description: 'Die besten Teams',
    entries: sortAndRankEntries(entries, 'points'),
    totalEntries: entries.length,
    updatedAt: new Date().toISOString(),
    refreshInterval: 600,
  };
}

/**
 * Calculate consistency score
 */
export function calculateConsistencyScore(missionScores: number[]): number {
  if (missionScores.length === 0) return 0;

  // Standard deviation calculation
  const avg = missionScores.reduce((sum, s) => sum + s, 0) / missionScores.length;
  const variance = missionScores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / missionScores.length;
  const stdDev = Math.sqrt(variance);

  // Consistency score: Higher avg + lower stdDev = better
  // Normalize to 0-100
  const consistencyScore = (avg * 100) * (1 - Math.min(stdDev / 100, 0.5));

  return Math.round(consistencyScore);
}

/**
 * Get milestone rewards for leaderboard climbing
 */
export function getMilestoneRewards(
  previousRank: number,
  newRank: number
): {
  milestone: string;
  points: number;
  badge?: string;
} | null {
  // Top 100 → Top 50
  if (previousRank > 50 && newRank <= 50) {
    return {
      milestone: 'Top 50 erreicht!',
      points: 500,
    };
  }

  // Top 50 → Top 10
  if (previousRank > 10 && newRank <= 10) {
    return {
      milestone: 'Top 10 erreicht!',
      points: 2000,
      badge: 'top_ten',
    };
  }

  // Top 10 → Top 3
  if (previousRank > 3 && newRank <= 3) {
    return {
      milestone: 'Podium erreicht!',
      points: 5000,
      badge: 'podium',
    };
  }

  // Reached #1
  if (previousRank > 1 && newRank === 1) {
    return {
      milestone: 'Champion!',
      points: 10000,
      badge: 'champion',
    };
  }

  return null;
}

/**
 * Generate mock leaderboard data (for testing/demo)
 */
export function generateMockLeaderboard(
  count: number = 100,
  type: LeaderboardType = 'global',
  world?: World
): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];

  for (let i = 0; i < count; i++) {
    entries.push({
      rank: i + 1,
      userId: `user_${i + 1}`,
      username: `Spieler ${i + 1}`,
      avatar: ['alex', 'ulli', 'amara', 'aya'][i % 4],
      score: Math.floor(Math.random() * 50000) + (count - i) * 100,
      metric: 'points',
      stats: {
        totalPoints: Math.floor(Math.random() * 50000),
        missionsCompleted: Math.floor(Math.random() * 100),
        currentStreak: Math.floor(Math.random() * 20),
        perfectMissions: Math.floor(Math.random() * 30),
      },
      badges: ['first_mission', 'perfectionist'].slice(0, Math.floor(Math.random() * 2) + 1),
      world,
      updatedAt: new Date().toISOString(),
      trend: ['up', 'down', 'same'][Math.floor(Math.random() * 3)] as any,
    });
  }

  return entries;
}



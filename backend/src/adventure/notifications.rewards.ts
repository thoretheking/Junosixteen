/**
 * Notifications & Rewards System
 * Push-Benachrichtigungen, Inbox, und Reward-Claiming
 */

// ===================================================
// NOTIFICATION SYSTEM
// ===================================================

export type NotificationType = 
  | 'achievement' 
  | 'badge' 
  | 'level_up' 
  | 'quest_available' 
  | 'event_started'
  | 'clan_invite'
  | 'friend_request'
  | 'gift_received'
  | 'challenge_invite'
  | 'tournament_started'
  | 'leaderboard_rank'
  | 'daily_reminder'
  | 'streak_warning';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  
  // Content
  title: string;
  message: string;
  icon: string;
  
  // Action
  actionUrl?: string;
  actionLabel?: string;
  
  // Metadata
  data?: Record<string, any>;
  
  // Status
  read: boolean;
  claimed: boolean;
  
  // Timestamps
  createdAt: string;
  expiresAt?: string;
}

export interface NotificationPreferences {
  userId: string;
  
  // Channels
  push: boolean;
  email: boolean;
  inApp: boolean;
  
  // Types
  achievements: boolean;
  social: boolean;
  events: boolean;
  dailyReminders: boolean;
  
  // Timing
  quietHoursStart?: number; // Hour (0-23)
  quietHoursEnd?: number;
}

/**
 * Create notification
 */
export function createNotification(
  userId: string,
  type: NotificationType,
  content: {
    title: string;
    message: string;
    icon?: string;
    actionUrl?: string;
    data?: any;
  }
): Notification {
  return {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type,
    title: content.title,
    message: content.message,
    icon: content.icon || '🔔',
    actionUrl: content.actionUrl,
    data: content.data,
    read: false,
    claimed: false,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Notification templates
 */
export const NOTIFICATION_TEMPLATES = {
  achievement_unlocked: (achievementName: string) => ({
    title: '🏆 Achievement freigeschaltet!',
    message: `Du hast "${achievementName}" erreicht!`,
    icon: '🏆',
  }),
  
  level_up: (newLevel: number) => ({
    title: '⬆️ Level Up!',
    message: `Glückwunsch! Du bist jetzt Level ${newLevel}!`,
    icon: '⭐',
  }),
  
  daily_quest_available: () => ({
    title: '📅 Neue Daily Quests!',
    message: 'Frische Quests sind verfügbar. Hol dir deine Belohnungen!',
    icon: '🎯',
  }),
  
  streak_warning: (currentStreak: number) => ({
    title: '🔥 Streak in Gefahr!',
    message: `Dein ${currentStreak}er-Streak läuft heute ab! Spiele jetzt!`,
    icon: '⚠️',
  }),
  
  clan_invite: (clanName: string) => ({
    title: '🤝 Clan-Einladung!',
    message: `${clanName} lädt dich ein!`,
    icon: '📨',
  }),
  
  tournament_starting: (tournamentName: string) => ({
    title: '⚔️ Turnier startet bald!',
    message: `"${tournamentName}" beginnt in 1 Stunde!`,
    icon: '🏆',
  }),
  
  leaderboard_rank_up: (rank: number) => ({
    title: '📈 Leaderboard-Aufstieg!',
    message: `Du bist jetzt Rang #${rank}! Weiter so!`,
    icon: '🎉',
  }),
};

// ===================================================
// REWARD INBOX
// ===================================================

export interface RewardItem {
  id: string;
  userId: string;
  
  // Reward
  type: 'points' | 'xp' | 'life' | 'power_up' | 'badge' | 'avatar' | 'border';
  itemId?: string;
  amount: number;
  
  // Source
  source: string; // 'achievement', 'quest', 'event', 'gift', etc.
  sourceId: string;
  
  // Display
  title: string;
  description: string;
  icon: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  
  // Status
  claimed: boolean;
  claimedAt?: string;
  
  // Expiration
  expiresAt?: string;
  
  createdAt: string;
}

/**
 * Create reward item
 */
export function createRewardItem(
  userId: string,
  type: RewardItem['type'],
  amount: number,
  source: string,
  sourceId: string,
  metadata: {
    title: string;
    description: string;
    icon?: string;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
    expiresIn?: number; // ms
  }
): RewardItem {
  const expiresAt = metadata.expiresIn
    ? new Date(Date.now() + metadata.expiresIn).toISOString()
    : undefined;

  return {
    id: `reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type,
    amount,
    source,
    sourceId,
    title: metadata.title,
    description: metadata.description,
    icon: metadata.icon || '🎁',
    rarity: metadata.rarity,
    claimed: false,
    expiresAt,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Claim reward
 */
export function claimReward(reward: RewardItem): {
  success: boolean;
  rewards: {
    points?: number;
    xp?: number;
    lives?: number;
    powerUp?: string;
    badge?: string;
    avatar?: string;
    border?: string;
  };
  error?: string;
} {
  // Check if already claimed
  if (reward.claimed) {
    return { success: false, rewards: {}, error: 'Reward already claimed' };
  }

  // Check if expired
  if (reward.expiresAt && new Date(reward.expiresAt) < new Date()) {
    return { success: false, rewards: {}, error: 'Reward expired' };
  }

  // Build reward object
  const rewards: any = {};

  switch (reward.type) {
    case 'points':
      rewards.points = reward.amount;
      break;
    case 'xp':
      rewards.xp = reward.amount;
      break;
    case 'life':
      rewards.lives = reward.amount;
      break;
    case 'power_up':
      rewards.powerUp = reward.itemId;
      break;
    case 'badge':
      rewards.badge = reward.itemId;
      break;
    case 'avatar':
      rewards.avatar = reward.itemId;
      break;
    case 'border':
      rewards.border = reward.itemId;
      break;
  }

  return { success: true, rewards };
}

// ===================================================
// DAILY LOGIN REWARDS
// ===================================================

export interface DailyLoginReward {
  day: number;
  reward: {
    points: number;
    xp?: number;
    lives?: number;
    powerUp?: string;
    badge?: string;
  };
  claimed: boolean;
}

export function generateDailyLoginRewards(streak: number): DailyLoginReward[] {
  const rewards: DailyLoginReward[] = [];
  
  for (let day = 1; day <= 7; day++) {
    let reward: DailyLoginReward['reward'] = { points: 100 * day };
    
    if (day === 3) {
      reward.lives = 1;
    }
    
    if (day === 5) {
      reward.powerUp = 'double_points';
    }
    
    if (day === 7) {
      reward.points = 1000;
      reward.xp = 500;
      reward.lives = 2;
      reward.badge = 'weekly_warrior';
    }
    
    rewards.push({
      day,
      reward,
      claimed: day <= (streak % 7),
    });
  }
  
  return rewards;
}

// ===================================================
// ACHIEVEMENT REWARDS SHOWCASE
// ===================================================

export interface RewardShowcase {
  userId: string;
  
  // Recent rewards (last 24h)
  recentRewards: RewardItem[];
  
  // Pending claims
  pendingClaims: RewardItem[];
  
  // Statistics
  stats: {
    totalRewardsClaimed: number;
    totalPointsFromRewards: number;
    totalXPFromRewards: number;
    totalLivesFromRewards: number;
    rarityBreakdown: Record<string, number>;
  };
}

export function generateRewardShowcase(
  userId: string,
  allRewards: RewardItem[]
): RewardShowcase {
  const userRewards = allRewards.filter(r => r.userId === userId);
  
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const recentRewards = userRewards.filter(
    r => new Date(r.createdAt) > oneDayAgo && r.claimed
  );
  
  const pendingClaims = userRewards.filter(r => !r.claimed);
  
  const claimed = userRewards.filter(r => r.claimed);
  
  const stats = {
    totalRewardsClaimed: claimed.length,
    totalPointsFromRewards: claimed
      .filter(r => r.type === 'points')
      .reduce((sum, r) => sum + r.amount, 0),
    totalXPFromRewards: claimed
      .filter(r => r.type === 'xp')
      .reduce((sum, r) => sum + r.amount, 0),
    totalLivesFromRewards: claimed
      .filter(r => r.type === 'life')
      .reduce((sum, r) => sum + r.amount, 0),
    rarityBreakdown: {
      common: claimed.filter(r => r.rarity === 'common').length,
      rare: claimed.filter(r => r.rarity === 'rare').length,
      epic: claimed.filter(r => r.rarity === 'epic').length,
      legendary: claimed.filter(r => r.rarity === 'legendary').length,
    },
  };
  
  return {
    userId,
    recentRewards,
    pendingClaims,
    stats,
  };
}



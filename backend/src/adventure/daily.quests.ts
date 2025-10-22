/**
 * Daily Quests System
 * Tägliche Mini-Aufgaben für zusätzliche Motivation
 */

import { World } from '../common/types.js';

export type QuestDifficulty = 'easy' | 'medium' | 'hard';
export type QuestType = 'missions' | 'streak' | 'perfect' | 'challenges' | 'team';

export interface DailyQuest {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
  difficulty: QuestDifficulty;
  type: QuestType;
  world?: World; // Optional: World-spezifisch
  target: number; // Ziel-Anzahl
  current: number; // Aktueller Fortschritt
  completed: boolean;
  reward: {
    points: number;
    lives?: number;
    badge?: string;
  };
  estimatedTimeMinutes: number;
  expiresAt: string; // ISO timestamp
}

/**
 * Generate daily quests for a user
 */
export function generateDailyQuests(date: string = new Date().toISOString().split('T')[0]): DailyQuest[] {
  const quests: DailyQuest[] = [];
  const expiresAt = new Date(date);
  expiresAt.setDate(expiresAt.getDate() + 1);
  expiresAt.setHours(0, 0, 0, 0);

  // Easy Quest (2 Minuten)
  quests.push({
    id: `daily_${date}_easy`,
    date,
    title: '3 Fragen richtig beantworten',
    description: 'Beantworte 3 Fragen korrekt in beliebigen Missionen',
    difficulty: 'easy',
    type: 'missions',
    target: 3,
    current: 0,
    completed: false,
    reward: {
      points: 300,
    },
    estimatedTimeMinutes: 2,
    expiresAt: expiresAt.toISOString(),
  });

  // Medium Quest (5 Minuten)
  const worlds: World[] = ['health', 'it', 'legal', 'public', 'factory'];
  const randomWorld = worlds[Math.floor(Math.random() * worlds.length)];
  
  quests.push({
    id: `daily_${date}_medium`,
    date,
    title: '5er-Streak erreichen',
    description: `Beantworte 5 Fragen in Folge richtig (${getWorldName(randomWorld)})`,
    difficulty: 'medium',
    type: 'streak',
    world: randomWorld,
    target: 5,
    current: 0,
    completed: false,
    reward: {
      points: 500,
      lives: 1,
    },
    estimatedTimeMinutes: 5,
    expiresAt: expiresAt.toISOString(),
  });

  // Hard Quest (10 Minuten)
  quests.push({
    id: `daily_${date}_hard`,
    date,
    title: 'Perfekte Mission',
    description: 'Schließe eine Mission ohne Fehler ab (alle 10 Fragen richtig)',
    difficulty: 'hard',
    type: 'perfect',
    target: 1,
    current: 0,
    completed: false,
    reward: {
      points: 1000,
      lives: 1,
      badge: 'daily_perfectionist',
    },
    estimatedTimeMinutes: 10,
    expiresAt: expiresAt.toISOString(),
  });

  return quests;
}

/**
 * Generate weekly quest
 */
export function generateWeeklyQuest(weekStart: string): DailyQuest {
  const expiresAt = new Date(weekStart);
  expiresAt.setDate(expiresAt.getDate() + 7);

  return {
    id: `weekly_${weekStart}`,
    date: weekStart,
    title: '15 Missionen abschließen',
    description: 'Schließe 15 beliebige Missionen in dieser Woche ab',
    difficulty: 'hard',
    type: 'missions',
    target: 15,
    current: 0,
    completed: false,
    reward: {
      points: 5000,
      lives: 2,
      badge: 'weekly_champion',
    },
    estimatedTimeMinutes: 120,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Generate world-specific daily quest
 */
export function generateWorldQuest(world: World, date: string): DailyQuest {
  const expiresAt = new Date(date);
  expiresAt.setDate(expiresAt.getDate() + 1);
  expiresAt.setHours(0, 0, 0, 0);

  const questTemplates = {
    health: {
      title: 'CleanRoom-Spezialist',
      description: 'Schließe 3 Health-Missionen erfolgreich ab',
    },
    it: {
      title: 'Cyber-Verteidiger',
      description: 'Schließe 3 IT-Missionen erfolgreich ab',
    },
    legal: {
      title: 'Rechts-Experte',
      description: 'Schließe 3 Legal-Missionen erfolgreich ab',
    },
    public: {
      title: 'Bürger-Champion',
      description: 'Schließe 3 Public-Missionen erfolgreich ab',
    },
    factory: {
      title: 'Sicherheits-Profi',
      description: 'Schließe 3 Factory-Missionen erfolgreich ab',
    },
  };

  const template = questTemplates[world];

  return {
    id: `world_${world}_${date}`,
    date,
    title: template.title,
    description: template.description,
    difficulty: 'medium',
    type: 'missions',
    world,
    target: 3,
    current: 0,
    completed: false,
    reward: {
      points: 800,
      badge: `${world}_specialist`,
    },
    estimatedTimeMinutes: 25,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Challenge-specific daily quest
 */
export function generateChallengeQuest(date: string): DailyQuest {
  const expiresAt = new Date(date);
  expiresAt.setDate(expiresAt.getDate() + 1);
  expiresAt.setHours(0, 0, 0, 0);

  return {
    id: `challenge_${date}`,
    date,
    title: 'Challenge-Meister',
    description: 'Bestehe 5 Challenges erfolgreich',
    difficulty: 'medium',
    type: 'challenges',
    target: 5,
    current: 0,
    completed: false,
    reward: {
      points: 600,
    },
    estimatedTimeMinutes: 8,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Team-specific daily quest
 */
export function generateTeamQuest(date: string): DailyQuest {
  const expiresAt = new Date(date);
  expiresAt.setDate(expiresAt.getDate() + 1);
  expiresAt.setHours(0, 0, 0, 0);

  return {
    id: `team_${date}`,
    date,
    title: 'Team-Player',
    description: 'Beantworte 3 Team-Fragen erfolgreich',
    difficulty: 'easy',
    type: 'team',
    target: 3,
    current: 0,
    completed: false,
    reward: {
      points: 400,
      badge: 'team_player',
    },
    estimatedTimeMinutes: 6,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Update quest progress
 */
export function updateQuestProgress(
  quest: DailyQuest,
  increment: number = 1
): DailyQuest {
  const updated = { ...quest };
  updated.current = Math.min(quest.current + increment, quest.target);
  updated.completed = updated.current >= updated.target;
  return updated;
}

/**
 * Check if quest is expired
 */
export function isQuestExpired(quest: DailyQuest): boolean {
  return new Date(quest.expiresAt) < new Date();
}

/**
 * Get all available quests for today
 */
export function getTodaysQuests(includeWorld?: World): DailyQuest[] {
  const today = new Date().toISOString().split('T')[0];
  const quests = generateDailyQuests(today);

  // Add challenge quest
  quests.push(generateChallengeQuest(today));

  // Add team quest
  quests.push(generateTeamQuest(today));

  // Add world-specific quest if specified
  if (includeWorld) {
    quests.push(generateWorldQuest(includeWorld, today));
  }

  return quests;
}

/**
 * Helper: Get world name in German
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
 * Calculate total possible daily points
 */
export function calculateDailyMaxPoints(): number {
  const quests = getTodaysQuests();
  return quests.reduce((sum, q) => sum + q.reward.points, 0);
}

/**
 * Get quest by ID
 */
export function getQuestById(quests: DailyQuest[], questId: string): DailyQuest | undefined {
  return quests.find(q => q.id === questId);
}

/**
 * Get completed quests
 */
export function getCompletedQuests(quests: DailyQuest[]): DailyQuest[] {
  return quests.filter(q => q.completed);
}

/**
 * Get active (non-completed, non-expired) quests
 */
export function getActiveQuests(quests: DailyQuest[]): DailyQuest[] {
  return quests.filter(q => !q.completed && !isQuestExpired(q));
}



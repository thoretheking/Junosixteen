// Daily Quests System - Tägliche Mini-Aufgaben
export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  type: 'streak' | 'points' | 'speed' | 'accuracy' | 'challenges' | 'social';
  target: number;
  progress: number;
  completed: boolean;
  reward: {
    points: number;
    lives?: number;
    badge?: string;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTimeMin: number;
  expiresAt: string; // ISO timestamp
  world?: string; // Optional: spezifisch für eine Welt
}

export interface DailyQuestProgress {
  questId: string;
  progress: number;
  completed: boolean;
  completedAt?: string;
  attempts: number;
}

// Daily Quest Templates
const QUEST_TEMPLATES: Omit<DailyQuest, 'id' | 'progress' | 'completed' | 'expiresAt'>[] = [
  // === EASY QUESTS (1-2 Min) ===
  {
    title: 'Früher Vogel',
    description: 'Beantworte 3 Fragen richtig',
    type: 'accuracy',
    target: 3,
    reward: { points: 300 },
    difficulty: 'easy',
    estimatedTimeMin: 2
  },
  
  {
    title: 'Speed-Learner',
    description: 'Beantworte 1 Frage in unter 30 Sekunden',
    type: 'speed',
    target: 1,
    reward: { points: 200 },
    difficulty: 'easy',
    estimatedTimeMin: 1
  },
  
  {
    title: 'Challenge-Rookie',
    description: 'Bestehe 1 Challenge erfolgreich',
    type: 'challenges',
    target: 1,
    reward: { points: 250 },
    difficulty: 'easy',
    estimatedTimeMin: 2
  },

  // === MEDIUM QUESTS (3-5 Min) ===
  {
    title: 'Streak-Master',
    description: 'Erreiche einen 5er-Streak',
    type: 'streak',
    target: 5,
    reward: { points: 500, lives: 1 },
    difficulty: 'medium',
    estimatedTimeMin: 4
  },
  
  {
    title: 'Punkte-Sammler',
    description: 'Sammle 1000 Punkte heute',
    type: 'points',
    target: 1000,
    reward: { points: 300 },
    difficulty: 'medium',
    estimatedTimeMin: 5
  },
  
  {
    title: 'Multi-World Explorer',
    description: 'Spiele in 2 verschiedenen Welten',
    type: 'social',
    target: 2,
    reward: { points: 400, badge: 'explorer' },
    difficulty: 'medium',
    estimatedTimeMin: 8
  },

  // === HARD QUESTS (5-10 Min) ===
  {
    title: 'Perfektionist',
    description: 'Beantworte 10 Fragen zu 100% richtig',
    type: 'accuracy',
    target: 10,
    reward: { points: 1000, lives: 1 },
    difficulty: 'hard',
    estimatedTimeMin: 8
  },
  
  {
    title: 'Challenge-Champion',
    description: 'Bestehe 3 Challenges ohne Fehler',
    type: 'challenges',
    target: 3,
    reward: { points: 800, badge: 'challenge_master' },
    difficulty: 'hard',
    estimatedTimeMin: 10
  },
  
  {
    title: 'Risk-Taker',
    description: 'Bestehe 2 Risikofragen erfolgreich',
    type: 'accuracy',
    target: 2,
    reward: { points: 1200, lives: 1 },
    difficulty: 'hard',
    estimatedTimeMin: 6
  },

  // === WORLD-SPECIFIC QUESTS ===
  {
    title: 'CleanRoom-Spezialist',
    description: 'Bestehe 2 Health-Challenges',
    type: 'challenges',
    target: 2,
    reward: { points: 600, badge: 'health_expert' },
    difficulty: 'medium',
    estimatedTimeMin: 5,
    world: 'health'
  },
  
  {
    title: 'Cyber-Verteidiger',
    description: 'Löse 3 IT-Security Fragen',
    type: 'accuracy',
    target: 3,
    reward: { points: 700, badge: 'cyber_guardian' },
    difficulty: 'medium',
    estimatedTimeMin: 6,
    world: 'it'
  },
  
  {
    title: 'Rechts-Gelehrter',
    description: 'Sammle 500 Punkte in Legal-Missionen',
    type: 'points',
    target: 500,
    reward: { points: 400, badge: 'legal_scholar' },
    difficulty: 'medium',
    estimatedTimeMin: 7,
    world: 'legal'
  }
];

// Daily Quest Generation
export function generateDailyQuests(
  userLevel: number = 1,
  userWorlds: string[] = [],
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): DailyQuest[] {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Reset to midnight

  // Filter Templates basierend auf User-Level und Präferenzen
  let availableTemplates = QUEST_TEMPLATES.filter(template => {
    // Schwierigkeit-Filter
    if (userLevel < 3 && template.difficulty === 'hard') return false;
    if (userLevel < 2 && template.difficulty === 'medium') return false;
    
    // Welt-Filter (wenn User spezifische Welten spielt)
    if (template.world && userWorlds.length > 0 && !userWorlds.includes(template.world)) {
      return false;
    }
    
    return true;
  });

  // Wähle 3 Quests: 1 easy, 1 medium, 1 hard (wenn verfügbar)
  const selectedQuests: DailyQuest[] = [];
  
  // Easy Quest
  const easyQuests = availableTemplates.filter(t => t.difficulty === 'easy');
  if (easyQuests.length > 0) {
    const randomEasy = easyQuests[Math.floor(Math.random() * easyQuests.length)];
    selectedQuests.push({
      ...randomEasy,
      id: `daily-${today.toISOString().split('T')[0]}-easy`,
      progress: 0,
      completed: false,
      expiresAt: tomorrow.toISOString()
    });
  }

  // Medium Quest
  const mediumQuests = availableTemplates.filter(t => t.difficulty === 'medium');
  if (mediumQuests.length > 0) {
    const randomMedium = mediumQuests[Math.floor(Math.random() * mediumQuests.length)];
    selectedQuests.push({
      ...randomMedium,
      id: `daily-${today.toISOString().split('T')[0]}-medium`,
      progress: 0,
      completed: false,
      expiresAt: tomorrow.toISOString()
    });
  }

  // Hard Quest (nur wenn User-Level hoch genug)
  if (userLevel >= 3) {
    const hardQuests = availableTemplates.filter(t => t.difficulty === 'hard');
    if (hardQuests.length > 0) {
      const randomHard = hardQuests[Math.floor(Math.random() * hardQuests.length)];
      selectedQuests.push({
        ...randomHard,
        id: `daily-${today.toISOString().split('T')[0]}-hard`,
        progress: 0,
        completed: false,
        expiresAt: tomorrow.toISOString()
      });
    }
  }

  return selectedQuests;
}

// Quest Progress Update
export function updateQuestProgress(
  quests: DailyQuest[],
  eventType: DailyQuest['type'],
  value: number,
  context?: { world?: string; accuracy?: number; timeElapsed?: number }
): DailyQuest[] {
  return quests.map(quest => {
    if (quest.completed || quest.type !== eventType) return quest;
    
    // World-spezifische Quests prüfen
    if (quest.world && context?.world !== quest.world) return quest;
    
    // Spezielle Logik je Quest-Typ
    let progressIncrement = 0;
    
    switch (eventType) {
      case 'streak':
        if (value >= quest.target) {
          progressIncrement = quest.target - quest.progress;
        }
        break;
        
      case 'points':
        progressIncrement = value;
        break;
        
      case 'speed':
        if (context?.timeElapsed && context.timeElapsed <= 30000) { // 30s
          progressIncrement = 1;
        }
        break;
        
      case 'accuracy':
        if (context?.accuracy === 1) { // 100% richtig
          progressIncrement = 1;
        }
        break;
        
      case 'challenges':
        progressIncrement = 1;
        break;
        
      case 'social':
        progressIncrement = 1;
        break;
    }
    
    const newProgress = Math.min(quest.progress + progressIncrement, quest.target);
    const completed = newProgress >= quest.target;
    
    return {
      ...quest,
      progress: newProgress,
      completed,
      completedAt: completed ? new Date().toISOString() : undefined
    };
  });
}

// Hook für Daily Quests
import { useState, useEffect } from 'react';

export function useDailyQuests() {
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadTodaysQuests();
  }, []);
  
  const loadTodaysQuests = async () => {
    try {
      // In echter App: Firebase/AsyncStorage laden
      const storedQuests = await loadStoredQuests();
      const today = new Date().toISOString().split('T')[0];
      
      // Prüfe ob Quests von heute sind
      const todaysQuests = storedQuests.filter(quest => 
        quest.id.includes(today) && new Date(quest.expiresAt) > new Date()
      );
      
      if (todaysQuests.length === 0) {
        // Generiere neue Daily Quests
        const newQuests = generateDailyQuests(3, ['health', 'it'], 'medium');
        setQuests(newQuests);
        await saveQuests(newQuests);
      } else {
        setQuests(todaysQuests);
      }
    } catch (error) {
      console.error('Failed to load daily quests:', error);
      // Fallback: Generiere lokale Quests
      const fallbackQuests = generateDailyQuests(1, [], 'easy');
      setQuests(fallbackQuests);
    } finally {
      setLoading(false);
    }
  };
  
  const updateProgress = (eventType: DailyQuest['type'], value: number, context?: any) => {
    setQuests(current => {
      const updated = updateQuestProgress(current, eventType, value, context);
      saveQuests(updated); // Persistiere Updates
      return updated;
    });
  };
  
  const refreshQuests = () => {
    loadTodaysQuests();
  };
  
  return {
    quests,
    loading,
    updateProgress,
    refreshQuests,
    completedCount: quests.filter(q => q.completed).length,
    totalReward: quests.reduce((sum, q) => sum + (q.completed ? q.reward.points : 0), 0)
  };
}

// Helper: Load stored quests (AsyncStorage/Firebase)
async function loadStoredQuests(): Promise<DailyQuest[]> {
  try {
    // In echter App: AsyncStorage oder Firebase
    const stored = localStorage.getItem('dailyQuests');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Helper: Save quests
async function saveQuests(quests: DailyQuest[]): Promise<void> {
  try {
    localStorage.setItem('dailyQuests', JSON.stringify(quests));
  } catch (error) {
    console.error('Failed to save daily quests:', error);
  }
}

// Helper: Check if quest is expired
export function isQuestExpired(quest: DailyQuest): boolean {
  return new Date() > new Date(quest.expiresAt);
}

// Helper: Get quest progress percentage
export function getQuestProgressPercentage(quest: DailyQuest): number {
  return Math.min((quest.progress / quest.target) * 100, 100);
}

// Helper: Format time remaining
export function getTimeRemaining(quest: DailyQuest): string {
  const now = new Date();
  const expires = new Date(quest.expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Abgelaufen';
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
} 
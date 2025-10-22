// Random Drops System - Überraschungs-Belohnungen
export interface RandomDrop {
  id: string;
  type: 'life' | 'points' | 'badge' | 'hint' | 'time_extension';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  value: number;
  message: string;
  icon: string;
  animation?: string;
  condition?: (context: DropContext) => boolean;
}

export interface DropContext {
  questionIndex: number;
  streak: number;
  world: string;
  difficulty: string;
  lives: number;
  points: number;
  isRiskQuestion: boolean;
  isTeamQuestion: boolean;
}

export interface DropResult {
  dropped: boolean;
  drop?: RandomDrop;
  reason?: string;
}

// Drop-Konfiguration mit Wahrscheinlichkeiten
const DROP_CONFIG = {
  baseChance: 0.08, // 8% Grundchance
  streakMultiplier: 0.02, // +2% pro Streak
  riskQuestionBonus: 0.05, // +5% bei Risikofragen
  lowLivesBonus: 0.03, // +3% bei ≤1 Leben
  maxChance: 0.25 // Maximum 25% Chance
};

// Verfügbare Drops
export const RANDOM_DROPS: Record<string, RandomDrop> = {
  // === COMMON DROPS (60% der Drops) ===
  bonus_points_200: {
    id: 'bonus_points_200',
    type: 'points',
    rarity: 'common',
    value: 200,
    message: '💰 Bonus-Punkte gefunden! +200 Punkte',
    icon: '💰',
    animation: 'sparkle'
  },
  
  bonus_points_500: {
    id: 'bonus_points_500',
    type: 'points',
    rarity: 'common',
    value: 500,
    message: '💎 Wertvolle Punkte entdeckt! +500 Punkte',
    icon: '💎',
    animation: 'shine'
  },
  
  time_boost: {
    id: 'time_boost',
    type: 'time_extension',
    rarity: 'common',
    value: 10, // 10 seconds
    message: '⏰ Zeit-Boost! +10 Sekunden für nächste Frage',
    icon: '⏰',
    animation: 'clockspin'
  },

  // === RARE DROPS (30% der Drops) ===
  bonus_life: {
    id: 'bonus_life',
    type: 'life',
    rarity: 'rare',
    value: 1,
    message: '❤️ Extra-Leben gefunden! +1 Leben',
    icon: '❤️',
    animation: 'heartbeat',
    condition: (ctx) => ctx.lives < 5 // Nur wenn nicht schon Maximum
  },
  
  bonus_points_1000: {
    id: 'bonus_points_1000',
    type: 'points',
    rarity: 'rare',
    value: 1000,
    message: '🌟 Seltener Schatz! +1000 Punkte',
    icon: '🌟',
    animation: 'starfall'
  },
  
  hint_token: {
    id: 'hint_token',
    type: 'hint',
    rarity: 'rare',
    value: 1,
    message: '💡 Hinweis-Token gefunden! Kostenloser Tipp verfügbar',
    icon: '💡',
    animation: 'lightbulb'
  },

  // === EPIC DROPS (9% der Drops) ===
  double_points: {
    id: 'double_points',
    type: 'points',
    rarity: 'epic',
    value: 2, // Multiplier
    message: '⚡ Doppelte Punkte! Nächste Frage zählt x2',
    icon: '⚡',
    animation: 'lightning'
  },
  
  shield_protection: {
    id: 'shield_protection',
    type: 'life',
    rarity: 'epic',
    value: 0, // Special effect
    message: '🛡️ Schutzschild! Nächster Fehler kostet kein Leben',
    icon: '🛡️',
    animation: 'shield'
  },

  // === LEGENDARY DROPS (1% der Drops) ===
  golden_streak: {
    id: 'golden_streak',
    type: 'points',
    rarity: 'legendary',
    value: 5000,
    message: '👑 LEGENDARY! Goldener Streak! +5000 Punkte + Unsterblichkeit für diese Mission',
    icon: '👑',
    animation: 'crown',
    condition: (ctx) => ctx.streak >= 5 // Nur bei 5+ Streak
  }
};

// Drop-Wahrscheinlichkeiten nach Seltenheit
const RARITY_WEIGHTS = {
  common: 60,
  rare: 30,
  epic: 9,
  legendary: 1
};

// Haupt-Drop-Funktion
export function rollForDrop(context: DropContext): DropResult {
  // Berechne Drop-Chance
  let dropChance = DROP_CONFIG.baseChance;
  
  // Streak-Bonus
  dropChance += context.streak * DROP_CONFIG.streakMultiplier;
  
  // Risikofragen-Bonus
  if (context.isRiskQuestion) {
    dropChance += DROP_CONFIG.riskQuestionBonus;
  }
  
  // Low-Lives-Bonus (Comeback-Mechanik)
  if (context.lives <= 1) {
    dropChance += DROP_CONFIG.lowLivesBonus;
  }
  
  // Cap bei Maximum
  dropChance = Math.min(dropChance, DROP_CONFIG.maxChance);
  
  // Roll für Drop
  const roll = Math.random();
  if (roll > dropChance) {
    return { dropped: false };
  }
  
  // Drop getriggert! Wähle Seltenheit
  const rarityRoll = Math.random() * 100;
  let selectedRarity: keyof typeof RARITY_WEIGHTS;
  
  if (rarityRoll <= RARITY_WEIGHTS.legendary) {
    selectedRarity = 'legendary';
  } else if (rarityRoll <= RARITY_WEIGHTS.legendary + RARITY_WEIGHTS.epic) {
    selectedRarity = 'epic';
  } else if (rarityRoll <= RARITY_WEIGHTS.legendary + RARITY_WEIGHTS.epic + RARITY_WEIGHTS.rare) {
    selectedRarity = 'rare';
  } else {
    selectedRarity = 'common';
  }
  
  // Filtere verfügbare Drops nach Seltenheit und Bedingungen
  const availableDrops = Object.values(RANDOM_DROPS).filter(drop => {
    if (drop.rarity !== selectedRarity) return false;
    if (drop.condition && !drop.condition(context)) return false;
    return true;
  });
  
  if (availableDrops.length === 0) {
    return { dropped: false, reason: 'no_valid_drops_for_rarity' };
  }
  
  // Zufälligen Drop aus verfügbaren auswählen
  const selectedDrop = availableDrops[Math.floor(Math.random() * availableDrops.length)];
  
  return {
    dropped: true,
    drop: selectedDrop,
    reason: `${selectedRarity}_drop_triggered`
  };
}

// Hook für React Components
import { useState } from 'react';

export function useRandomDrops() {
  const [lastDrop, setLastDrop] = useState<RandomDrop | null>(null);
  const [showDropModal, setShowDropModal] = useState(false);
  
  const triggerDrop = (context: DropContext) => {
    const result = rollForDrop(context);
    
    if (result.dropped && result.drop) {
      setLastDrop(result.drop);
      setShowDropModal(true);
      
      // Analytics
      console.log('Random drop triggered:', {
        dropId: result.drop.id,
        rarity: result.drop.rarity,
        context,
        chance: calculateDropChance(context)
      });
      
      return result.drop;
    }
    
    return null;
  };
  
  const dismissDrop = () => {
    setShowDropModal(false);
    setLastDrop(null);
  };
  
  return {
    triggerDrop,
    dismissDrop,
    lastDrop,
    showDropModal
  };
}

// Helper: Berechne aktuelle Drop-Chance (für UI/Debug)
export function calculateDropChance(context: DropContext): number {
  let chance = DROP_CONFIG.baseChance;
  chance += context.streak * DROP_CONFIG.streakMultiplier;
  if (context.isRiskQuestion) chance += DROP_CONFIG.riskQuestionBonus;
  if (context.lives <= 1) chance += DROP_CONFIG.lowLivesBonus;
  return Math.min(chance, DROP_CONFIG.maxChance);
}

// Helper: Formatiere Drop-Chance für UI
export function formatDropChance(chance: number): string {
  return `${(chance * 100).toFixed(1)}%`;
}

// Helper: Erhalte Drop-Statistiken
export function getDropStats() {
  const totalDrops = Object.keys(RANDOM_DROPS).length;
  const byRarity = Object.values(RANDOM_DROPS).reduce((acc, drop) => {
    acc[drop.rarity] = (acc[drop.rarity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalDrops,
    byRarity,
    baseChance: DROP_CONFIG.baseChance,
    maxChance: DROP_CONFIG.maxChance
  };
}

// Easter Eggs (spezielle Drops)
export const EASTER_EGGS: RandomDrop[] = [
  {
    id: 'developer_coffee',
    type: 'points',
    rarity: 'legendary',
    value: 1337,
    message: '☕ Developer-Kaffee gefunden! +1337 Punkte (Leet!)',
    icon: '☕',
    animation: 'code',
    condition: (ctx) => ctx.questionIndex === 7 && ctx.streak >= 3
  },
  
  {
    id: 'rubber_duck',
    type: 'hint',
    rarity: 'epic',
    value: 3, // 3 kostenlose Hints
    message: '🦆 Rubber Duck Debug-Buddy! 3 kostenlose Hinweise',
    icon: '🦆',
    animation: 'quack',
    condition: (ctx) => ctx.world === 'it'
  },
  
  {
    id: 'legal_loophole',
    type: 'points',
    rarity: 'rare',
    value: 777,
    message: '📜 Gesetzeslücke entdeckt! +777 Punkte (Lucky!)',
    icon: '📜',
    animation: 'scroll',
    condition: (ctx) => ctx.world === 'legal' && ctx.questionIndex === 9
  }
]; 
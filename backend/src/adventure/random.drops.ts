/**
 * Random Drops System
 * Überraschungs-Belohnungen während des Spielens
 */

import { World } from '../common/types.js';

export type DropRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface RandomDrop {
  id: string;
  name: string;
  description: string;
  rarity: DropRarity;
  type: 'points' | 'life' | 'time' | 'hint' | 'shield' | 'multiplier' | 'special';
  value: number | string;
  icon: string;
  dropChance: number; // 0.0 - 1.0
  requirements?: {
    minStreak?: number;
    world?: World;
    questKind?: 'risk' | 'team' | 'standard';
  };
}

/**
 * Drop Registry - All possible drops
 */
export const DROP_REGISTRY: Record<string, RandomDrop> = {
  // ===================================================
  // COMMON DROPS (60% of all drops)
  // ===================================================
  
  points_200: {
    id: 'points_200',
    name: 'Bonus-Punkte',
    description: '+200 Extra-Punkte!',
    rarity: 'common',
    type: 'points',
    value: 200,
    icon: '💰',
    dropChance: 0.25,
  },

  points_300: {
    id: 'points_300',
    name: 'Große Bonus-Punkte',
    description: '+300 Extra-Punkte!',
    rarity: 'common',
    type: 'points',
    value: 300,
    icon: '💰',
    dropChance: 0.20,
  },

  time_bonus: {
    id: 'time_bonus',
    name: 'Zeit-Bonus',
    description: '+10 Sekunden zusätzliche Zeit',
    rarity: 'common',
    type: 'time',
    value: 10000,
    icon: '⏰',
    dropChance: 0.15,
  },

  // ===================================================
  // RARE DROPS (30% of all drops)
  // ===================================================

  life_boost: {
    id: 'life_boost',
    name: 'Leben-Boost',
    description: '+1 Leben (bis max 5)',
    rarity: 'rare',
    type: 'life',
    value: 1,
    icon: '❤️',
    dropChance: 0.15,
  },

  points_1000: {
    id: 'points_1000',
    name: 'Mega-Punkte',
    description: '+1000 Extra-Punkte!',
    rarity: 'rare',
    type: 'points',
    value: 1000,
    icon: '🌟',
    dropChance: 0.10,
  },

  hint_token: {
    id: 'hint_token',
    name: 'Hinweis-Token',
    description: '1 kostenloser Hinweis',
    rarity: 'rare',
    type: 'hint',
    value: 1,
    icon: '💡',
    dropChance: 0.05,
  },

  // ===================================================
  // EPIC DROPS (9% of all drops)
  // ===================================================

  double_points: {
    id: 'double_points',
    name: 'Doppelte Punkte',
    description: 'Nächste 3 Fragen: x2 Punkte',
    rarity: 'epic',
    type: 'multiplier',
    value: 2,
    icon: '⚡',
    dropChance: 0.05,
  },

  shield: {
    id: 'shield',
    name: 'Schutzschild',
    description: 'Nächster Fehler kostet kein Leben',
    rarity: 'epic',
    type: 'shield',
    value: 1,
    icon: '🛡️',
    dropChance: 0.04,
  },

  // ===================================================
  // LEGENDARY DROPS (1% of all drops)
  // ===================================================

  golden_star: {
    id: 'golden_star',
    name: 'Goldener Stern',
    description: '+5000 Punkte + Unsterblichkeit (diese Mission)',
    rarity: 'legendary',
    type: 'special',
    value: 5000,
    icon: '👑',
    dropChance: 0.005,
    requirements: {
      minStreak: 7,
    },
  },

  lucky_clover: {
    id: 'lucky_clover',
    name: 'Glücksklee',
    description: '+2 Leben + alle Fragen auf easy',
    rarity: 'legendary',
    type: 'special',
    value: 2,
    icon: '🍀',
    dropChance: 0.005,
  },

  // ===================================================
  // EASTER EGGS (Special Conditions)
  // ===================================================

  developer_coffee: {
    id: 'developer_coffee',
    name: 'Developer-Kaffee',
    description: '+1337 Punkte (Leet!)',
    rarity: 'epic',
    type: 'points',
    value: 1337,
    icon: '☕',
    dropChance: 0.001,
    requirements: {
      minStreak: 3,
      world: 'it',
    },
  },

  rubber_duck: {
    id: 'rubber_duck',
    name: 'Rubber Duck',
    description: '3 kostenlose Hinweise',
    rarity: 'rare',
    type: 'hint',
    value: 3,
    icon: '🦆',
    dropChance: 0.002,
    requirements: {
      world: 'it',
    },
  },

  legal_loophole: {
    id: 'legal_loophole',
    name: 'Gesetzeslücke',
    description: '+777 Punkte (Lucky!)',
    rarity: 'rare',
    type: 'points',
    value: 777,
    icon: '📜',
    dropChance: 0.002,
    requirements: {
      world: 'legal',
    },
  },

  health_angel: {
    id: 'health_angel',
    name: 'Schutzengel',
    description: '+3 Leben sofort',
    rarity: 'epic',
    type: 'life',
    value: 3,
    icon: '👼',
    dropChance: 0.001,
    requirements: {
      world: 'health',
    },
  },
};

/**
 * Calculate drop chance based on context
 */
export function calculateDropChance(context: {
  streak?: number;
  world?: World;
  questKind?: 'risk' | 'team' | 'standard';
  riskQuestion?: boolean;
}): number {
  let baseChance = 0.08; // 8% base chance

  // Streak bonus: +2% per streak level
  if (context.streak && context.streak > 0) {
    baseChance += context.streak * 0.02;
  }

  // Risk question bonus: +5%
  if (context.riskQuestion) {
    baseChance += 0.05;
  }

  // Team question bonus: +3%
  if (context.questKind === 'team') {
    baseChance += 0.03;
  }

  // Cap at 25%
  return Math.min(baseChance, 0.25);
}

/**
 * Roll for a random drop
 */
export function rollForDrop(context: {
  streak?: number;
  world?: World;
  questKind?: 'risk' | 'team' | 'standard';
  riskQuestion?: boolean;
}): RandomDrop | null {
  const dropChance = calculateDropChance(context);
  
  // Roll for drop
  if (Math.random() > dropChance) {
    return null; // No drop
  }

  // Get eligible drops
  const eligibleDrops = Object.values(DROP_REGISTRY).filter(drop => {
    // Check requirements
    if (drop.requirements) {
      if (drop.requirements.minStreak && (context.streak ?? 0) < drop.requirements.minStreak) {
        return false;
      }
      if (drop.requirements.world && drop.requirements.world !== context.world) {
        return false;
      }
      if (drop.requirements.questKind && drop.requirements.questKind !== context.questKind) {
        return false;
      }
    }
    return true;
  });

  if (eligibleDrops.length === 0) {
    return null;
  }

  // Weighted random selection based on drop chance
  const totalWeight = eligibleDrops.reduce((sum, drop) => sum + drop.dropChance, 0);
  let random = Math.random() * totalWeight;

  for (const drop of eligibleDrops) {
    random -= drop.dropChance;
    if (random <= 0) {
      return drop;
    }
  }

  // Fallback
  return eligibleDrops[0];
}

/**
 * Get drops by rarity
 */
export function getDropsByRarity(rarity: DropRarity): RandomDrop[] {
  return Object.values(DROP_REGISTRY).filter(d => d.rarity === rarity);
}

/**
 * Get drops by type
 */
export function getDropsByType(type: RandomDrop['type']): RandomDrop[] {
  return Object.values(DROP_REGISTRY).filter(d => d.type === type);
}

/**
 * Get easter egg drops for world
 */
export function getEasterEggsForWorld(world: World): RandomDrop[] {
  return Object.values(DROP_REGISTRY).filter(
    d => d.requirements?.world === world && d.dropChance < 0.005
  );
}

/**
 * Apply drop effect (helper for client)
 */
export interface DropEffect {
  pointsGained?: number;
  livesGained?: number;
  timeBonus?: number;
  hintsGained?: number;
  multiplierActive?: { factor: number; questsRemaining: number };
  shieldActive?: boolean;
  unsterblich?: boolean;
  message: string;
}

export function getDropEffect(drop: RandomDrop): DropEffect {
  const effect: DropEffect = {
    message: drop.description,
  };

  switch (drop.type) {
    case 'points':
      effect.pointsGained = Number(drop.value);
      break;
    
    case 'life':
      effect.livesGained = Number(drop.value);
      break;
    
    case 'time':
      effect.timeBonus = Number(drop.value);
      break;
    
    case 'hint':
      effect.hintsGained = Number(drop.value);
      break;
    
    case 'multiplier':
      effect.multiplierActive = {
        factor: Number(drop.value),
        questsRemaining: 3,
      };
      break;
    
    case 'shield':
      effect.shieldActive = true;
      break;
    
    case 'special':
      // Golden Star
      if (drop.id === 'golden_star') {
        effect.pointsGained = 5000;
        effect.unsterblich = true;
      }
      // Lucky Clover
      else if (drop.id === 'lucky_clover') {
        effect.livesGained = 2;
        // Difficulty adjustment handled separately
      }
      break;
  }

  return effect;
}

/**
 * Format drop notification message
 */
export function formatDropMessage(drop: RandomDrop): string {
  const rarityEmojis: Record<DropRarity, string> = {
    common: '💰',
    rare: '🌟',
    epic: '⚡',
    legendary: '👑',
  };

  return `${rarityEmojis[drop.rarity]} ${drop.rarity.toUpperCase()} DROP! ${drop.icon} ${drop.name}: ${drop.description}`;
}

/**
 * Get drop statistics
 */
export function getDropStatistics(): {
  total: number;
  byRarity: Record<DropRarity, number>;
  byType: Record<string, number>;
} {
  const drops = Object.values(DROP_REGISTRY);
  
  const byRarity: Record<DropRarity, number> = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  };

  const byType: Record<string, number> = {};

  for (const drop of drops) {
    byRarity[drop.rarity]++;
    byType[drop.type] = (byType[drop.type] || 0) + 1;
  }

  return {
    total: drops.length,
    byRarity,
    byType,
  };
}



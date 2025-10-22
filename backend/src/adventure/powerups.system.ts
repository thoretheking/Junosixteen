/**
 * Power-Ups System
 * Temporäre Boosts und dauerhafte Upgrades
 */

import { World } from '../common/types.js';

export type PowerUpType = 'temporary' | 'permanent' | 'consumable';
export type PowerUpCategory = 'time' | 'points' | 'lives' | 'knowledge' | 'special';

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  type: PowerUpType;
  category: PowerUpCategory;
  icon: string;
  
  // Cost
  cost: {
    points?: number;
    premium?: boolean; // Premium-Währung
  };
  
  // Effect
  effect: {
    multiplier?: number; // z.B. 2x Punkte
    bonus?: number; // z.B. +30s Zeit
    duration?: number; // ms (für temporary)
    uses?: number; // Anzahl Verwendungen (für consumable)
  };
  
  // Availability
  levelRequired?: number;
  worldSpecific?: World;
  limited?: boolean; // Limitierte Edition
  
  // Stats
  owned: boolean;
  active: boolean;
  remainingUses?: number;
  expiresAt?: string;
}

/**
 * Power-Up Registry
 */
export const POWERUP_REGISTRY: Record<string, PowerUp> = {
  // ===================================================
  // TIME CATEGORY
  // ===================================================
  
  time_freeze: {
    id: 'time_freeze',
    name: 'Zeit-Stopp',
    description: 'Friert die Zeit für eine Frage ein',
    type: 'consumable',
    category: 'time',
    icon: '⏸️',
    cost: { points: 500 },
    effect: {
      uses: 1,
      bonus: 999999, // Praktisch unendlich
    },
    owned: false,
    active: false,
  },

  time_boost: {
    id: 'time_boost',
    name: 'Zeit-Boost',
    description: '+30 Sekunden für alle Fragen (1 Mission)',
    type: 'consumable',
    category: 'time',
    icon: '⏰',
    cost: { points: 300 },
    effect: {
      bonus: 30000,
      uses: 1,
    },
    owned: false,
    active: false,
  },

  slow_motion: {
    id: 'slow_motion',
    name: 'Zeitlupe',
    description: 'Zeit läuft 50% langsamer (1 Mission)',
    type: 'consumable',
    category: 'time',
    icon: '🐌',
    cost: { points: 400 },
    effect: {
      multiplier: 1.5,
      uses: 1,
    },
    owned: false,
    active: false,
  },

  // ===================================================
  // POINTS CATEGORY
  // ===================================================

  double_points: {
    id: 'double_points',
    name: 'Doppelte Punkte',
    description: '2x Punkte für 30 Minuten',
    type: 'temporary',
    category: 'points',
    icon: '💎',
    cost: { points: 1000 },
    effect: {
      multiplier: 2,
      duration: 1800000, // 30 Min
    },
    owned: false,
    active: false,
  },

  triple_points: {
    id: 'triple_points',
    name: 'Dreifache Punkte',
    description: '3x Punkte für 1 Mission',
    type: 'consumable',
    category: 'points',
    icon: '💰',
    cost: { points: 2000 },
    effect: {
      multiplier: 3,
      uses: 1,
    },
    owned: false,
    active: false,
  },

  mega_multiplier: {
    id: 'mega_multiplier',
    name: 'Mega-Multiplikator',
    description: '5x Punkte für 3 Fragen',
    type: 'consumable',
    category: 'points',
    icon: '🌟',
    cost: { points: 3000 },
    effect: {
      multiplier: 5,
      uses: 3,
    },
    owned: false,
    active: false,
  },

  // ===================================================
  // LIVES CATEGORY
  // ===================================================

  extra_life: {
    id: 'extra_life',
    name: 'Extra-Leben',
    description: '+1 Leben sofort',
    type: 'consumable',
    category: 'lives',
    icon: '❤️',
    cost: { points: 800 },
    effect: {
      bonus: 1,
      uses: 1,
    },
    owned: false,
    active: false,
  },

  resurrection: {
    id: 'resurrection',
    name: 'Auferstehung',
    description: 'Verhindert Mission-Fail einmal',
    type: 'consumable',
    category: 'lives',
    icon: '💫',
    cost: { points: 1500 },
    effect: {
      uses: 1,
    },
    owned: false,
    active: false,
  },

  immortality: {
    id: 'immortality',
    name: 'Unsterblichkeit',
    description: 'Keine Leben-Verluste für 1 Mission',
    type: 'consumable',
    category: 'lives',
    icon: '👼',
    cost: { points: 2500 },
    effect: {
      uses: 1,
    },
    owned: false,
    active: false,
  },

  life_cap_upgrade: {
    id: 'life_cap_upgrade',
    name: 'Leben-Cap Upgrade',
    description: 'Max Leben erhöht von 5 auf 7 (permanent)',
    type: 'permanent',
    category: 'lives',
    icon: '💚',
    cost: { points: 10000 },
    effect: {
      bonus: 2,
    },
    owned: false,
    active: false,
  },

  // ===================================================
  // KNOWLEDGE CATEGORY
  // ===================================================

  fifty_fifty: {
    id: 'fifty_fifty',
    name: '50:50 Joker',
    description: 'Entfernt 2 falsche Antworten',
    type: 'consumable',
    category: 'knowledge',
    icon: '🎯',
    cost: { points: 200 },
    effect: {
      uses: 3,
    },
    owned: false,
    active: false,
  },

  hint_master: {
    id: 'hint_master',
    name: 'Hinweis-Meister',
    description: '5 kostenlose Hinweise',
    type: 'consumable',
    category: 'knowledge',
    icon: '💡',
    cost: { points: 500 },
    effect: {
      uses: 5,
    },
    owned: false,
    active: false,
  },

  skip_question: {
    id: 'skip_question',
    name: 'Frage überspringen',
    description: 'Überspringe 1 Frage ohne Punktverlust',
    type: 'consumable',
    category: 'knowledge',
    icon: '⏭️',
    cost: { points: 600 },
    effect: {
      uses: 1,
    },
    owned: false,
    active: false,
  },

  answer_reveal: {
    id: 'answer_reveal',
    name: 'Antwort zeigen',
    description: 'Zeigt die richtige Antwort (50% Punkte)',
    type: 'consumable',
    category: 'knowledge',
    icon: '👁️',
    cost: { points: 400 },
    effect: {
      uses: 1,
      multiplier: 0.5, // Nur halbe Punkte
    },
    owned: false,
    active: false,
  },

  // ===================================================
  // SPECIAL CATEGORY
  // ===================================================

  shield: {
    id: 'shield',
    name: 'Schutzschild',
    description: 'Nächster Fehler kostet kein Leben',
    type: 'consumable',
    category: 'special',
    icon: '🛡️',
    cost: { points: 700 },
    effect: {
      uses: 1,
    },
    owned: false,
    active: false,
  },

  lucky_charm: {
    id: 'lucky_charm',
    name: 'Glücksbringer',
    description: '+50% Drop-Chance für 1 Mission',
    type: 'consumable',
    category: 'special',
    icon: '🍀',
    cost: { points: 1000 },
    effect: {
      multiplier: 1.5,
      uses: 1,
    },
    owned: false,
    active: false,
  },

  second_chance: {
    id: 'second_chance',
    name: 'Zweite Chance',
    description: 'Bei falscher Antwort: sofort nochmal versuchen',
    type: 'consumable',
    category: 'special',
    icon: '🔄',
    cost: { points: 800 },
    effect: {
      uses: 1,
    },
    owned: false,
    active: false,
  },

  challenge_skip: {
    id: 'challenge_skip',
    name: 'Challenge-Skip',
    description: 'Überspringe 1 Challenge',
    type: 'consumable',
    category: 'special',
    icon: '⚡',
    cost: { points: 1200 },
    effect: {
      uses: 1,
    },
    owned: false,
    active: false,
  },

  risk_insurance: {
    id: 'risk_insurance',
    name: 'Risiko-Versicherung',
    description: 'Risikofragen zählen wie normale Fragen',
    type: 'consumable',
    category: 'special',
    icon: '📋',
    cost: { points: 1500 },
    effect: {
      uses: 1,
    },
    owned: false,
    active: false,
  },

  // ===================================================
  // PREMIUM POWER-UPS
  // ===================================================

  vip_pass: {
    id: 'vip_pass',
    name: 'VIP-Pass',
    description: 'Alle Power-Ups 50% günstiger (30 Tage)',
    type: 'temporary',
    category: 'special',
    icon: '👑',
    cost: { premium: true },
    effect: {
      multiplier: 0.5,
      duration: 2592000000, // 30 Tage
    },
    owned: false,
    active: false,
    levelRequired: 10,
  },

  golden_ticket: {
    id: 'golden_ticket',
    name: 'Goldenes Ticket',
    description: 'Alle Belohnungen 2x (7 Tage)',
    type: 'temporary',
    category: 'special',
    icon: '🎫',
    cost: { premium: true },
    effect: {
      multiplier: 2,
      duration: 604800000, // 7 Tage
    },
    owned: false,
    active: false,
    levelRequired: 5,
  },
};

/**
 * Get power-ups by category
 */
export function getPowerUpsByCategory(category: PowerUpCategory): PowerUp[] {
  return Object.values(POWERUP_REGISTRY).filter(p => p.category === category);
}

/**
 * Get power-ups by type
 */
export function getPowerUpsByType(type: PowerUpType): PowerUp[] {
  return Object.values(POWERUP_REGISTRY).filter(p => p.type === type);
}

/**
 * Get owned power-ups
 */
export function getOwnedPowerUps(powerUps: PowerUp[]): PowerUp[] {
  return powerUps.filter(p => p.owned);
}

/**
 * Get active power-ups
 */
export function getActivePowerUps(powerUps: PowerUp[]): PowerUp[] {
  return powerUps.filter(p => p.active);
}

/**
 * Purchase power-up
 */
export function purchasePowerUp(
  powerUpId: string,
  userPoints: number
): { success: boolean; newPoints: number; powerUp?: PowerUp; error?: string } {
  const powerUp = POWERUP_REGISTRY[powerUpId];
  
  if (!powerUp) {
    return { success: false, newPoints: userPoints, error: 'Power-Up not found' };
  }

  // Check cost
  if (powerUp.cost.premium) {
    return { success: false, newPoints: userPoints, error: 'Premium currency required' };
  }

  const cost = powerUp.cost.points || 0;
  if (userPoints < cost) {
    return { success: false, newPoints: userPoints, error: 'Not enough points' };
  }

  // Purchase
  const newPoints = userPoints - cost;
  const purchasedPowerUp = { ...powerUp, owned: true };

  if (powerUp.type === 'consumable') {
    purchasedPowerUp.remainingUses = powerUp.effect.uses;
  }

  return {
    success: true,
    newPoints,
    powerUp: purchasedPowerUp,
  };
}

/**
 * Activate power-up
 */
export function activatePowerUp(powerUp: PowerUp): PowerUp {
  if (!powerUp.owned) {
    throw new Error('Power-Up not owned');
  }

  if (powerUp.type === 'consumable' && (powerUp.remainingUses ?? 0) <= 0) {
    throw new Error('No uses remaining');
  }

  const activated = { ...powerUp, active: true };

  if (powerUp.type === 'temporary' && powerUp.effect.duration) {
    const expiresAt = new Date();
    expiresAt.setMilliseconds(expiresAt.getMilliseconds() + powerUp.effect.duration);
    activated.expiresAt = expiresAt.toISOString();
  }

  return activated;
}

/**
 * Use power-up (decrement uses)
 */
export function usePowerUp(powerUp: PowerUp): PowerUp {
  if (!powerUp.active) {
    throw new Error('Power-Up not active');
  }

  if (powerUp.type === 'consumable') {
    const used = { ...powerUp };
    used.remainingUses = (used.remainingUses ?? 0) - 1;

    if (used.remainingUses <= 0) {
      used.active = false;
      used.owned = false;
    }

    return used;
  }

  return powerUp;
}

/**
 * Check if power-up is expired
 */
export function isPowerUpExpired(powerUp: PowerUp): boolean {
  if (powerUp.type !== 'temporary' || !powerUp.expiresAt) {
    return false;
  }

  return new Date(powerUp.expiresAt) < new Date();
}

/**
 * Get power-up statistics
 */
export function getPowerUpStats() {
  const powerUps = Object.values(POWERUP_REGISTRY);

  return {
    total: powerUps.length,
    byType: {
      temporary: getPowerUpsByType('temporary').length,
      permanent: getPowerUpsByType('permanent').length,
      consumable: getPowerUpsByType('consumable').length,
    },
    byCategory: {
      time: getPowerUpsByCategory('time').length,
      points: getPowerUpsByCategory('points').length,
      lives: getPowerUpsByCategory('lives').length,
      knowledge: getPowerUpsByCategory('knowledge').length,
      special: getPowerUpsByCategory('special').length,
    },
    premiumPowerUps: powerUps.filter(p => p.cost.premium).length,
  };
}

/**
 * Apply power-up effect to value
 */
export function applyPowerUpEffect(
  value: number,
  powerUps: PowerUp[],
  effectType: 'points' | 'time' | 'drop_chance'
): number {
  let result = value;

  const activePowerUps = getActivePowerUps(powerUps);

  for (const powerUp of activePowerUps) {
    // Skip expired power-ups
    if (isPowerUpExpired(powerUp)) continue;

    // Apply multiplier
    if (powerUp.effect.multiplier) {
      if (effectType === 'points' && powerUp.category === 'points') {
        result *= powerUp.effect.multiplier;
      }
      if (effectType === 'time' && powerUp.category === 'time') {
        result *= powerUp.effect.multiplier;
      }
      if (effectType === 'drop_chance' && powerUp.id === 'lucky_charm') {
        result *= powerUp.effect.multiplier;
      }
    }

    // Apply bonus
    if (powerUp.effect.bonus) {
      if (effectType === 'time' && powerUp.category === 'time') {
        result += powerUp.effect.bonus;
      }
    }
  }

  return Math.round(result);
}



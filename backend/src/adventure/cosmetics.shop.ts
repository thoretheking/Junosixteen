/**
 * Cosmetics & Shop System
 * Avatare, Borders, Themes, Emotes, und Premium-Shop
 */

import { World } from '../common/types.js';

// ===================================================
// COSMETICS
// ===================================================

export type CosmeticType = 'avatar' | 'border' | 'theme' | 'emote' | 'banner' | 'title' | 'effect';
export type CosmeticRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface Cosmetic {
  id: string;
  type: CosmeticType;
  name: string;
  description: string;
  rarity: CosmeticRarity;
  
  // Visual
  preview?: string; // URL
  icon: string;
  color?: string;
  animated?: boolean;
  
  // Availability
  price: {
    points?: number;
    premium?: number; // Premium-Währung
  };
  
  // Unlock requirements
  requirements?: {
    level?: number;
    achievement?: string;
    world?: World;
    event?: string;
    limited?: boolean;
    seasonExclusive?: string;
  };
  
  // Status
  owned: boolean;
  equipped: boolean;
  
  // Metadata
  releaseDate?: string;
  limitedQuantity?: number;
  ownedBy?: number; // How many players own this
}

// ===================================================
// AVATARS
// ===================================================

export const AVATARS: Record<string, Cosmetic> = {
  // Standard (kostenlos)
  alex: {
    id: 'alex',
    type: 'avatar',
    name: 'Alex',
    description: 'Aufmunternder Mentor',
    rarity: 'common',
    icon: '👨‍🏫',
    price: {},
    owned: true,
    equipped: false,
  },
  
  ulli: {
    id: 'ulli',
    type: 'avatar',
    name: 'Ulli',
    description: 'Analytischer Denker',
    rarity: 'common',
    icon: '👩‍💼',
    price: {},
    owned: true,
    equipped: false,
  },
  
  // Unlock durch Achievements
  legendary_mentor: {
    id: 'legendary_mentor',
    type: 'avatar',
    name: 'Legendärer Mentor',
    description: 'Für wahre Meister',
    rarity: 'legendary',
    icon: '🌟',
    animated: true,
    price: {},
    requirements: {
      level: 100,
    },
    owned: false,
    equipped: false,
  },
  
  neo: {
    id: 'neo',
    type: 'avatar',
    name: 'Neo',
    description: 'The One',
    rarity: 'mythic',
    icon: '🕶️',
    animated: true,
    price: {},
    requirements: {
      achievement: 'the_one',
    },
    owned: false,
    equipped: false,
  },
  
  // Premium
  cyber_punk: {
    id: 'cyber_punk',
    type: 'avatar',
    name: 'Cyber Punk',
    description: 'Futuristischer Hacker',
    rarity: 'epic',
    icon: '🤖',
    animated: true,
    price: { premium: 500 },
    owned: false,
    equipped: false,
  },
};

// ===================================================
// BORDERS
// ===================================================

export const BORDERS: Record<string, Cosmetic> = {
  default_border: {
    id: 'default_border',
    type: 'border',
    name: 'Standard-Rahmen',
    description: 'Einfacher Rahmen',
    rarity: 'common',
    icon: '⬜',
    color: '#CCCCCC',
    price: {},
    owned: true,
    equipped: true,
  },
  
  gold_frame: {
    id: 'gold_frame',
    type: 'border',
    name: 'Gold-Rahmen',
    description: 'Für Meister',
    rarity: 'rare',
    icon: '🟨',
    color: '#FFD700',
    price: { points: 5000 },
    requirements: { achievement: 'mission_master' },
    owned: false,
    equipped: false,
  },
  
  platinum_frame: {
    id: 'platinum_frame',
    type: 'border',
    name: 'Platin-Rahmen',
    description: 'Für Legenden',
    rarity: 'epic',
    icon: '⬜',
    color: '#E5E4E2',
    price: { points: 25000 },
    requirements: { achievement: 'mission_legend' },
    owned: false,
    equipped: false,
  },
  
  rainbow_frame: {
    id: 'rainbow_frame',
    type: 'border',
    name: 'Regenbogen-Rahmen',
    description: 'Für Allwissende',
    rarity: 'mythic',
    icon: '🌈',
    animated: true,
    price: {},
    requirements: { achievement: 'omniscient' },
    owned: false,
    equipped: false,
  },
  
  fire_frame: {
    id: 'fire_frame',
    type: 'border',
    name: 'Feuer-Rahmen',
    description: 'Für Unaufhaltsame',
    rarity: 'legendary',
    icon: '🔥',
    animated: true,
    price: {},
    requirements: { achievement: 'unstoppable' },
    owned: false,
    equipped: false,
  },
};

// ===================================================
// THEMES
// ===================================================

export interface Theme {
  id: string;
  name: string;
  description: string;
  
  // Colors
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  
  // Visual effects
  animations?: boolean;
  particles?: boolean;
  
  // Availability
  price: { points?: number; premium?: number };
  requirements?: any;
  
  rarity: CosmeticRarity;
  owned: boolean;
  equipped: boolean;
}

export const THEMES: Record<string, Theme> = {
  default: {
    id: 'default',
    name: 'Standard',
    description: 'JunoSixteen Standard-Theme',
    colors: {
      primary: '#5479F7',
      secondary: '#99B9FF',
      background: '#FFFFFF',
      text: '#00002E',
      accent: '#FF8BA7',
    },
    price: {},
    rarity: 'common',
    owned: true,
    equipped: true,
  },
  
  dark_mode: {
    id: 'dark_mode',
    name: 'Dark Mode',
    description: 'Für Nacht-Eulen',
    colors: {
      primary: '#7B9FFF',
      secondary: '#4A5F99',
      background: '#1A1A2E',
      text: '#EAEAEA',
      accent: '#FF6B9D',
    },
    price: { points: 2000 },
    rarity: 'uncommon',
    owned: false,
    equipped: false,
  },
  
  matrix: {
    id: 'matrix',
    name: 'Matrix',
    description: 'Grüner Code-Regen',
    colors: {
      primary: '#00FF00',
      secondary: '#008000',
      background: '#000000',
      text: '#00FF00',
      accent: '#00FF00',
    },
    animations: true,
    particles: true,
    price: { points: 10000 },
    requirements: { achievement: 'it_master' },
    rarity: 'epic',
    owned: false,
    equipped: false,
  },
  
  golden_age: {
    id: 'golden_age',
    name: 'Goldenes Zeitalter',
    description: 'Luxus pur',
    colors: {
      primary: '#FFD700',
      secondary: '#FFA500',
      background: '#FFF8DC',
      text: '#8B4513',
      accent: '#FF6347',
    },
    animations: true,
    price: { premium: 1000 },
    rarity: 'legendary',
    owned: false,
    equipped: false,
  },
};

// ===================================================
// SHOP SYSTEM
// ===================================================

export interface ShopCategory {
  id: string;
  name: string;
  description: string;
  items: Cosmetic[];
  featured: boolean;
  discount?: number; // %
}

export const SHOP_CATEGORIES: ShopCategory[] = [
  {
    id: 'featured',
    name: 'Featured',
    description: 'Diese Woche im Angebot!',
    items: [], // Dynamisch gefüllt
    featured: true,
    discount: 25,
  },
  
  {
    id: 'avatars',
    name: 'Avatare',
    description: 'Wähle deinen Mentor',
    items: Object.values(AVATARS),
    featured: false,
  },
  
  {
    id: 'borders',
    name: 'Rahmen',
    description: 'Verziere dein Profil',
    items: Object.values(BORDERS),
    featured: false,
  },
  
  {
    id: 'themes',
    name: 'Themes',
    description: 'Personalisiere dein Erlebnis',
    items: Object.values(THEMES),
    featured: false,
  },
];

/**
 * Purchase cosmetic
 */
export function purchaseCosmetic(
  cosmetic: Cosmetic,
  userPoints: number,
  userPremium: number = 0
): {
  success: boolean;
  newPoints: number;
  newPremium: number;
  cosmetic?: Cosmetic;
  error?: string;
} {
  // Check if owned
  if (cosmetic.owned) {
    return {
      success: false,
      newPoints: userPoints,
      newPremium: userPremium,
      error: 'Already owned',
    };
  }

  // Check points
  if (cosmetic.price.points && userPoints < cosmetic.price.points) {
    return {
      success: false,
      newPoints: userPoints,
      newPremium: userPremium,
      error: 'Not enough points',
    };
  }

  // Check premium
  if (cosmetic.price.premium && userPremium < cosmetic.price.premium) {
    return {
      success: false,
      newPoints: userPoints,
      newPremium: userPremium,
      error: 'Not enough premium currency',
    };
  }

  // Purchase
  const newPoints = userPoints - (cosmetic.price.points || 0);
  const newPremium = userPremium - (cosmetic.price.premium || 0);
  
  const purchasedCosmetic = { ...cosmetic, owned: true };

  return {
    success: true,
    newPoints,
    newPremium,
    cosmetic: purchasedCosmetic,
  };
}

/**
 * Get featured items (rotates weekly)
 */
export function getFeaturedItems(week: number): Cosmetic[] {
  const allCosmetics = [
    ...Object.values(AVATARS),
    ...Object.values(BORDERS),
    ...Object.values(THEMES),
  ];
  
  // Pseudo-random selection based on week number
  const seed = week;
  const featured: Cosmetic[] = [];
  
  for (let i = 0; i < 5; i++) {
    const index = (seed * (i + 1) * 17) % allCosmetics.length;
    featured.push(allCosmetics[index]);
  }
  
  return featured;
}



// Design-Tokens für JunoSixteen CI
export const colors = {
  // Primary Colors
  ink: '#00002E',
  brand: '#5479F7',
  brand200: '#99B9FF',
  surface: '#F6F8FF',
  bg: '#FFFFFF',
  accent: '#FF8BA7',
  
  // Semantic Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Neutral Scale
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Lives & Gaming
  life: '#EF4444',      // Heart red
  lifeEmpty: '#E5E7EB', // Empty heart
  points: '#F59E0B',    // Gold
  bonus: '#10B981'      // Green bonus
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999
} as const;

export const typography = {
  // Font Sizes
  h1: 32,
  h2: 24,
  h3: 20,
  body: 16,
  caption: 14,
  small: 12,
  
  // Line Heights
  h1LineHeight: 40,
  h2LineHeight: 32,
  h3LineHeight: 28,
  bodyLineHeight: 24,
  captionLineHeight: 20,
  
  // Font Weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const
} as const;

export const shadows = {
  soft: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  medium: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8
  },
  strong: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12
  }
} as const;

// A11y Minimum Hit Target Size
export const hitTarget = {
  minSize: 48,
  comfortable: 56,
  large: 64
} as const;

// Animation Durations (respects prefers-reduced-motion)
export const animations = {
  fast: 150,
  normal: 250,
  slow: 400,
  reduced: 0 // For prefers-reduced-motion
} as const;

// Z-Index Scale
export const zIndex = {
  base: 0,
  overlay: 10,
  modal: 100,
  toast: 1000,
  tooltip: 2000
} as const; 
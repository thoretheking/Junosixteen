import React, { createContext, useContext, ReactNode } from 'react';

export const COLORS = {
  primary: '#3B82F6',
  secondary: '#F59E0B', 
  danger: '#EF4444',
  success: '#10B981',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  // Level colors based on JunoSixteen design
  level: {
    normal: '#3B82F6',
    risk: '#F59E0B',
    final: '#EF4444'
  }
};

export const TYPOGRAPHY = {
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    color: COLORS.text,
  },
  caption: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    color: COLORS.textSecondary,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
  }
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const BORDERS = {
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  width: {
    thin: 1,
    medium: 2,
    thick: 4,
  }
};

interface ThemeContextType {
  colors: typeof COLORS;
  typography: typeof TYPOGRAPHY;
  spacing: typeof SPACING;
  borders: typeof BORDERS;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  borders: BORDERS,
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const value: ThemeContextType = {
    colors: COLORS,
    typography: TYPOGRAPHY,
    spacing: SPACING,
    borders: BORDERS,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

interface AccessibilityContextType {
  prefersReducedMotion: boolean;
  isScreenReaderEnabled: boolean;
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
  updatePreferences: (prefs: Partial<AccessibilityPreferences>) => void;
}

interface AccessibilityPreferences {
  prefersReducedMotion: boolean;
  isScreenReaderEnabled: boolean;
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    prefersReducedMotion: false,
    isScreenReaderEnabled: false,
    highContrast: false,
    fontSize: 'normal'
  });

  useEffect(() => {
    // Check for prefers-reduced-motion
    checkReducedMotionPreference();
    
    // Check for screen reader
    checkScreenReaderStatus();
    
    // Subscribe to screen reader changes
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      handleScreenReaderChange
    );
    
    return () => {
      subscription?.remove();
    };
  }, []);

  const checkReducedMotionPreference = async () => {
    try {
      // React Native doesn't have built-in prefers-reduced-motion check
      // This would typically be checked via native modules or system settings
      // For now, we'll provide a user preference option
      
      // In a real implementation, you might use:
      // - react-native-device-info
      // - Custom native module
      // - AsyncStorage to save user preference
      
      setPreferences(prev => ({
        ...prev,
        prefersReducedMotion: false // Default
      }));
    } catch (error) {
      console.error('Error checking reduced motion preference:', error);
    }
  };

  const checkScreenReaderStatus = async () => {
    try {
      const isEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      setPreferences(prev => ({
        ...prev,
        isScreenReaderEnabled: isEnabled
      }));
    } catch (error) {
      console.error('Error checking screen reader status:', error);
    }
  };

  const handleScreenReaderChange = (isEnabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      isScreenReaderEnabled: isEnabled
    }));
  };

  const updatePreferences = (prefs: Partial<AccessibilityPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...prefs
    }));
  };

  return (
    <AccessibilityContext.Provider
      value={{
        ...preferences,
        updatePreferences
      }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

// Utility hook for animated components
export const useAnimationConfig = () => {
  const { prefersReducedMotion } = useAccessibility();
  
  return {
    // Duration
    duration: prefersReducedMotion ? 0 : 300,
    
    // Spring config
    spring: prefersReducedMotion
      ? { tension: 1000, friction: 500 } // Instant
      : { tension: 40, friction: 7 }, // Normal
    
    // Timing config
    timing: {
      duration: prefersReducedMotion ? 1 : 300,
      useNativeDriver: true
    },
    
    // Helpers
    shouldAnimate: !prefersReducedMotion
  };
};


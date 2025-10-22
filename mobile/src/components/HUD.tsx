import React from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import { colors, spacing, typography, hitTarget } from '../theme/tokens';
import { LifeCount } from '../features/missions/types';

interface HUDProps {
  lives: LifeCount;
  bonusLives: LifeCount;
  points: number;
  progress: number; // 0-100
  currentQuestion: number;
  totalQuestions: number;
  streak?: number;
}

export default function HUD({ 
  lives, 
  bonusLives, 
  points, 
  progress, 
  currentQuestion, 
  totalQuestions,
  streak = 0
}: HUDProps) {
  const totalLives = lives + bonusLives;
  
  // Announce important changes to screen readers
  React.useEffect(() => {
    if (lives === 1) {
      AccessibilityInfo.announceForAccessibility('Achtung! Nur noch ein Leben übrig.');
    } else if (lives === 0) {
      AccessibilityInfo.announceForAccessibility('Alle Leben verloren. Mission fehlgeschlagen.');
    }
  }, [lives]);

  const renderHearts = () => {
    const hearts = [];
    
    // Regular lives (red hearts)
    for (let i = 0; i < 3; i++) {
      hearts.push(
        <Text 
          key={`life-${i}`}
          style={[
            styles.heart,
            { color: i < lives ? colors.life : colors.lifeEmpty }
          ]}
          accessibilityLabel={`Leben ${i + 1} ${i < lives ? 'vorhanden' : 'verloren'}`}
        >
          ♥
        </Text>
      );
    }
    
    // Bonus lives (golden hearts)
    for (let i = 0; i < bonusLives; i++) {
      hearts.push(
        <Text 
          key={`bonus-${i}`}
          style={[styles.heart, { color: colors.bonus }]}
          accessibilityLabel={`Bonus-Leben ${i + 1}`}
        >
          ♥
        </Text>
      );
    }
    
    return hearts;
  };

  return (
    <View style={styles.container} accessibilityRole="banner">
      {/* Lives Section */}
      <View style={styles.livesContainer}>
        <Text style={styles.label} accessibilityLabel={`${totalLives} Leben übrig`}>
          Leben
        </Text>
        <View style={styles.heartsRow} accessible={false}>
          {renderHearts()}
        </View>
      </View>

      {/* Points Section */}
      <View style={styles.pointsContainer}>
        <Text 
          style={styles.pointsText}
          accessibilityLabel={`${points.toLocaleString()} Punkte`}
          accessibilityRole="text"
        >
          {points.toLocaleString()}
        </Text>
        <Text style={styles.pointsLabel}>Punkte</Text>
        {streak > 0 && (
          <Text 
            style={styles.streakText}
            accessibilityLabel={`${streak} richtige Antworten in Folge`}
          >
            🔥 {streak}x
          </Text>
        )}
      </View>

      {/* Progress Section */}
      <View style={styles.progressContainer}>
        <Text 
          style={styles.label}
          accessibilityLabel={`Frage ${currentQuestion} von ${totalQuestions}`}
        >
          Frage {currentQuestion}/{totalQuestions}
        </Text>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${progress}%` }
              ]}
              accessibilityLabel={`Fortschritt: ${Math.round(progress)} Prozent`}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    minHeight: hitTarget.comfortable
  },
  
  livesContainer: {
    flex: 1,
    alignItems: 'flex-start'
  },
  
  label: {
    fontSize: typography.caption,
    fontWeight: typography.medium,
    color: colors.gray600,
    marginBottom: spacing.xs
  },
  
  heartsRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  
  heart: {
    fontSize: 20,
    marginRight: spacing.xs,
    textShadowColor: colors.gray400,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  
  pointsContainer: {
    flex: 2,
    alignItems: 'center',
    position: 'relative'
  },
  
  pointsText: {
    fontSize: typography.h2,
    fontWeight: typography.bold,
    color: colors.points,
    textShadowColor: colors.gray400,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  
  pointsLabel: {
    fontSize: typography.caption,
    fontWeight: typography.medium,
    color: colors.gray600
  },
  
  streakText: {
    position: 'absolute',
    top: -spacing.xs,
    right: -spacing.sm,
    fontSize: typography.small,
    fontWeight: typography.bold,
    color: colors.accent,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden'
  },
  
  progressContainer: {
    flex: 1,
    alignItems: 'flex-end'
  },
  
  progressBarContainer: {
    width: 80,
    alignItems: 'center'
  },
  
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    overflow: 'hidden'
  },
  
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.brand,
    borderRadius: 4,
    minWidth: 4 // Ensure some visual feedback even at 0%
  }
}); 
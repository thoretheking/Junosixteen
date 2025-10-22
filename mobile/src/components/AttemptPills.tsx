import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';

interface AttemptPillsProps {
  maxAttempts: number;
  attemptsUsed: number;
  cooldownActive?: boolean;
}

export default function AttemptPills({ 
  maxAttempts, 
  attemptsUsed, 
  cooldownActive = false 
}: AttemptPillsProps) {
  const attemptsRemaining = maxAttempts - attemptsUsed;
  
  const renderPills = () => {
    const pills = [];
    
    for (let i = 0; i < maxAttempts; i++) {
      const isUsed = i < attemptsUsed;
      const isCurrent = i === attemptsUsed && !cooldownActive;
      
      pills.push(
        <View 
          key={i}
          style={[
            styles.pill,
            isUsed && styles.pillUsed,
            isCurrent && styles.pillCurrent,
            cooldownActive && styles.pillCooldown
          ]}
          accessibilityLabel={
            isUsed 
              ? `Versuch ${i + 1} verbraucht` 
              : isCurrent 
                ? `Aktueller Versuch ${i + 1}`
                : `Versuch ${i + 1} verfügbar`
          }
        >
          <Text style={[
            styles.pillText,
            isUsed && styles.pillTextUsed,
            isCurrent && styles.pillTextCurrent
          ]}>
            {isUsed ? '●' : isCurrent ? '◐' : '○'}
          </Text>
        </View>
      );
    }
    
    return pills;
  };

  return (
    <View style={styles.container}>
      <Text 
        style={styles.label}
        accessibilityLabel={`${attemptsRemaining} von ${maxAttempts} Versuchen übrig`}
      >
        Versuche: {attemptsRemaining}/{maxAttempts}
      </Text>
      
      <View 
        style={styles.pillsContainer}
        accessible={false}
      >
        {renderPills()}
      </View>
      
      {cooldownActive && (
        <Text style={styles.cooldownText}>
          ⏳ Cooldown aktiv
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing.sm
  },
  
  label: {
    fontSize: typography.caption,
    fontWeight: typography.medium,
    color: colors.gray600,
    marginBottom: spacing.xs
  },
  
  pillsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  
  pill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gray200,
    borderWidth: 2,
    borderColor: colors.gray300,
    justifyContent: 'center',
    alignItems: 'center'
  },
  
  pillUsed: {
    backgroundColor: colors.error,
    borderColor: colors.error
  },
  
  pillCurrent: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4
  },
  
  pillCooldown: {
    backgroundColor: colors.warning,
    borderColor: colors.warning
  },
  
  pillText: {
    fontSize: 12,
    fontWeight: typography.bold,
    color: colors.gray600
  },
  
  pillTextUsed: {
    color: colors.bg
  },
  
  pillTextCurrent: {
    color: colors.bg
  },
  
  cooldownText: {
    fontSize: typography.caption,
    color: colors.warning,
    fontWeight: typography.medium,
    marginTop: spacing.xs
  }
}); 
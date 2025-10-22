import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';
import { RiskControl } from '../features/missions/types';

interface RiskBannerProps {
  maxAttempts: number;
  attemptsUsed: number;
  cooldownActive: boolean;
  bossChallenge?: string;
  adaptiveHelp?: RiskControl['adaptiveHelp'];
}

export default function RiskBanner({ 
  maxAttempts, 
  attemptsUsed, 
  cooldownActive,
  bossChallenge,
  adaptiveHelp
}: RiskBannerProps) {
  const attemptsRemaining = maxAttempts - attemptsUsed;
  
  const getBannerColor = () => {
    if (cooldownActive) return colors.warning;
    if (attemptsRemaining === 1) return colors.error;
    return colors.brand;
  };

  const getBannerText = () => {
    if (cooldownActive) {
      return 'COOLDOWN AKTIV - Kurz verschnaufen...';
    }
    
    if (attemptsRemaining === 1) {
      return '⚠️ LETZTER VERSUCH - Du schaffst das!';
    }
    
    return `⚠️ RISIKOFRAGE - ${attemptsRemaining} Versuche übrig`;
  };

  return (
    <View style={[styles.container, { backgroundColor: getBannerColor() }]}>
      <View style={styles.content}>
        <Text 
          style={styles.bannerText}
          accessibilityRole="header"
          accessibilityLabel={getBannerText()}
        >
          {getBannerText()}
        </Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>
            {bossChallenge && `Boss-Challenge: ${bossChallenge}`}
          </Text>
          
          {adaptiveHelp && (
            <Text style={styles.adaptiveText}>
              💡 {adaptiveHelp.reducedOptions ? 'Weniger Optionen' : ''}
              {adaptiveHelp.extraTimeMs ? `+${adaptiveHelp.extraTimeMs/1000}s Zeit` : ''}
            </Text>
          )}
        </View>
        
        {!cooldownActive && (
          <Text style={styles.warningText}>
            Bei Fehlversuch startet eine Boss-Challenge
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md
  },
  
  content: {
    alignItems: 'center'
  },
  
  bannerText: {
    fontSize: typography.body,
    fontWeight: typography.bold,
    color: colors.bg,
    textAlign: 'center',
    marginBottom: spacing.xs
  },
  
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  
  infoText: {
    fontSize: typography.caption,
    color: colors.bg,
    fontWeight: typography.medium,
    opacity: 0.9
  },
  
  adaptiveText: {
    fontSize: typography.caption,
    color: colors.bg,
    fontWeight: typography.medium,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8
  },
  
  warningText: {
    fontSize: typography.caption,
    color: colors.bg,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontStyle: 'italic'
  }
}); 
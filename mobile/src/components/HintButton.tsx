import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { colors, spacing, typography, hitTarget, shadows } from '../theme/tokens';

interface HintButtonProps {
  available: boolean;
  cost: number; // Punkte-Kosten
  currentPoints: number;
  onUseHint: () => void;
  hintText?: string;
  disabled?: boolean;
}

export default function HintButton({
  available,
  cost,
  currentPoints,
  onUseHint,
  hintText,
  disabled = false
}: HintButtonProps) {
  const canAfford = currentPoints >= cost;
  const isUsable = available && canAfford && !disabled;

  const handlePress = () => {
    if (!isUsable) return;

    Alert.alert(
      '💡 Hinweis verwenden?',
      `Kostet ${cost} Punkte. Du hast ${currentPoints} Punkte.${hintText ? `\n\nHinweis: ${hintText}` : ''}`,
      [
        {
          text: 'Abbrechen',
          style: 'cancel'
        },
        {
          text: `Ja, ${cost} Punkte ausgeben`,
          onPress: onUseHint
        }
      ]
    );
  };

  const getButtonStyle = () => {
    if (!available) return [styles.button, styles.buttonDisabled];
    if (!canAfford) return [styles.button, styles.buttonNoMoney];
    return [styles.button, styles.buttonAvailable];
  };

  const getButtonText = () => {
    if (!available) return '💡 Hinweis bereits verwendet';
    if (!canAfford) return `💡 Hinweis (${cost} Punkte - zu wenig)`;
    return `💡 Hinweis nutzen (−${cost} Punkte)`;
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={getButtonStyle()}
        onPress={handlePress}
        disabled={!isUsable}
        accessibilityRole="button"
        accessibilityLabel={getButtonText()}
        accessibilityHint={
          isUsable 
            ? `Zeigt einen Hinweis für ${cost} Punkte` 
            : available 
              ? 'Hinweis bereits verwendet'
              : 'Nicht genug Punkte für Hinweis'
        }
        accessibilityState={{ disabled: !isUsable }}
      >
        <View style={styles.buttonContent}>
          <Text style={[
            styles.buttonText,
            !available && styles.buttonTextDisabled,
            !canAfford && styles.buttonTextNoMoney
          ]}>
            💡
          </Text>
          <View style={styles.buttonTextContainer}>
            <Text style={[
              styles.buttonLabel,
              !available && styles.buttonTextDisabled,
              !canAfford && styles.buttonTextNoMoney
            ]}>
              Hinweis
            </Text>
            <Text style={[
              styles.buttonCost,
              !available && styles.buttonTextDisabled,
              !canAfford && styles.buttonTextNoMoney
            ]}>
              {available ? `−${cost}` : 'verwendet'}
            </Text>
          </View>
        </View>
      </Pressable>
      
      {!canAfford && available && (
        <Text style={styles.warningText}>
          Nicht genug Punkte (benötigt: {cost})
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm
  },
  
  button: {
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: hitTarget.minSize,
    borderWidth: 2,
    ...shadows.soft
  },
  
  buttonAvailable: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  },
  
  buttonDisabled: {
    backgroundColor: colors.gray200,
    borderColor: colors.gray300
  },
  
  buttonNoMoney: {
    backgroundColor: colors.warning + '20',
    borderColor: colors.warning
  },
  
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  buttonText: {
    fontSize: 24,
    marginRight: spacing.sm
  },
  
  buttonTextContainer: {
    alignItems: 'center'
  },
  
  buttonLabel: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: colors.bg
  },
  
  buttonCost: {
    fontSize: typography.caption,
    color: colors.bg,
    opacity: 0.8
  },
  
  buttonTextDisabled: {
    color: colors.gray500
  },
  
  buttonTextNoMoney: {
    color: colors.warning
  },
  
  warningText: {
    fontSize: typography.caption,
    color: colors.warning,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontStyle: 'italic'
  }
}); 
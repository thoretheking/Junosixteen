import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, AccessibilityInfo } from 'react-native';
import { colors, spacing, typography, hitTarget, shadows, zIndex } from '../theme/tokens';

interface CooldownModalProps {
  visible: boolean;
  questionId: string;
  cooldownMs: number;
  onCooldownComplete: () => void;
  onMicroGameStart?: () => void; // Optional micro-game
  onClose?: () => void;
}

export default function CooldownModal({
  visible,
  questionId,
  cooldownMs,
  onCooldownComplete,
  onMicroGameStart,
  onClose
}: CooldownModalProps) {
  const [remainingMs, setRemainingMs] = useState(cooldownMs);
  const [showMicroGame, setShowMicroGame] = useState(false);
  
  // Countdown timer
  useEffect(() => {
    if (!visible) return;
    
    setRemainingMs(cooldownMs);
    
    const interval = setInterval(() => {
      setRemainingMs(prev => {
        const newRemaining = prev - 1000;
        
        // Announce countdown at key intervals
        if (newRemaining === 10000) {
          AccessibilityInfo.announceForAccessibility('Noch 10 Sekunden Cooldown');
        } else if (newRemaining === 5000) {
          AccessibilityInfo.announceForAccessibility('Noch 5 Sekunden');
        } else if (newRemaining <= 0) {
          AccessibilityInfo.announceForAccessibility('Cooldown beendet! Du kannst es nochmal versuchen.');
          onCooldownComplete();
          return 0;
        }
        
        return newRemaining;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [visible, cooldownMs, onCooldownComplete]);
  
  // Initial accessibility announcement
  useEffect(() => {
    if (visible) {
      AccessibilityInfo.announceForAccessibility(
        `Cooldown gestartet. ${Math.ceil(cooldownMs / 1000)} Sekunden warten bis zum nächsten Versuch.`
      );
    }
  }, [visible, cooldownMs]);

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `00:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleMicroGameStart = () => {
    setShowMicroGame(true);
    if (onMicroGameStart) {
      onMicroGameStart();
    }
    AccessibilityInfo.announceForAccessibility('Mini-Übung gestartet');
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text 
              style={styles.title}
              accessibilityRole="header"
            >
              ⏳ Kurz verschnaufen
            </Text>
            <Text style={styles.subtitle}>
              Boss-Challenge war zu schwer. Zeit zum Durchatmen!
            </Text>
          </View>

          {/* Timer Display */}
          <View style={styles.timerContainer}>
            <Text 
              style={styles.timerText}
              accessibilityLabel={`Noch ${formatTime(remainingMs)} bis zum nächsten Versuch`}
              accessibilityLiveRegion="polite"
            >
              {formatTime(remainingMs)}
            </Text>
            <Text style={styles.timerLabel}>
              bis zum nächsten Versuch
            </Text>
          </View>

          {/* Progress Ring (Visual) */}
          <View style={styles.progressContainer}>
            <View style={styles.progressRing}>
              <View 
                style={[
                  styles.progressFill,
                  {
                    transform: [{
                      rotate: `${((cooldownMs - remainingMs) / cooldownMs) * 360}deg`
                    }]
                  }
                ]}
              />
            </View>
          </View>

          {/* Micro Game Option */}
          {onMicroGameStart && !showMicroGame && remainingMs > 5000 && (
            <View style={styles.microGameContainer}>
              <Text style={styles.microGameTitle}>
                In der Zwischenzeit:
              </Text>
              <Pressable
                style={styles.microGameButton}
                onPress={handleMicroGameStart}
                accessibilityRole="button"
                accessibilityLabel="Mini-Übung starten"
                accessibilityHint="Spiele eine kurze Übung während des Cooldowns"
              >
                <Text style={styles.microGameButtonText}>
                  🎮 Mini-Übung ausprobieren
                </Text>
              </Pressable>
              <Text style={styles.microGameSubtext}>
                (Keine Punkte, nur zum Üben)
              </Text>
            </View>
          )}

          {/* Motivational Message */}
          <View style={styles.motivationContainer}>
            <Text style={styles.motivationText}>
              💪 Nutze die Zeit zum Nachdenken. Du schaffst das!
            </Text>
          </View>

          {/* Close Button (if allowed) */}
          {onClose && (
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Modal schließen"
            >
              <Text style={styles.closeButtonText}>
                Verstanden
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg
  },
  
  modal: {
    backgroundColor: colors.bg,
    borderRadius: 24,
    padding: spacing.xl,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    ...shadows.strong
  },
  
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  
  title: {
    fontSize: typography.h2,
    fontWeight: typography.bold,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.sm
  },
  
  subtitle: {
    fontSize: typography.body,
    color: colors.gray600,
    textAlign: 'center'
  },
  
  timerContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  
  timerText: {
    fontSize: 48,
    fontWeight: typography.bold,
    color: colors.warning,
    fontVariant: ['tabular-nums'] as any
  },
  
  timerLabel: {
    fontSize: typography.caption,
    color: colors.gray600,
    textAlign: 'center',
    marginTop: spacing.xs
  },
  
  progressContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  
  progressRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: colors.gray200,
    position: 'relative',
    overflow: 'hidden'
  },
  
  progressFill: {
    position: 'absolute',
    top: -30,
    left: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.warning,
    transformOrigin: '30px 30px'
  },
  
  microGameContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    width: '100%'
  },
  
  microGameTitle: {
    fontSize: typography.body,
    fontWeight: typography.medium,
    color: colors.ink,
    marginBottom: spacing.sm
  },
  
  microGameButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    minHeight: hitTarget.minSize,
    justifyContent: 'center',
    alignItems: 'center'
  },
  
  microGameButtonText: {
    fontSize: typography.body,
    fontWeight: typography.medium,
    color: colors.bg
  },
  
  microGameSubtext: {
    fontSize: typography.caption,
    color: colors.gray500,
    fontStyle: 'italic'
  },
  
  motivationContainer: {
    padding: spacing.md,
    backgroundColor: colors.success + '20', // 20% opacity
    borderRadius: 12,
    marginBottom: spacing.lg,
    width: '100%'
  },
  
  motivationText: {
    fontSize: typography.body,
    color: colors.success,
    textAlign: 'center',
    fontWeight: typography.medium
  },
  
  closeButton: {
    backgroundColor: colors.gray100,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: hitTarget.minSize,
    justifyContent: 'center',
    alignItems: 'center'
  },
  
  closeButtonText: {
    fontSize: typography.body,
    fontWeight: typography.medium,
    color: colors.gray700
  }
}); 
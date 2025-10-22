import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, AccessibilityInfo } from 'react-native';
import { useAppDispatch } from '../../app/storeHooks';
import { bonusGameCompleted, gainLife, addBonusPoints } from './missionSlice';
import { colors, spacing, typography, hitTarget, shadows } from '../../theme/tokens';

interface BonusGameScreenProps {
  route: {
    params: {
      missionId: string;
      basePoints: number;
    };
  };
  navigation: any;
}

export default function BonusGameScreen({ route, navigation }: BonusGameScreenProps) {
  const dispatch = useAppDispatch();
  const { missionId, basePoints } = route.params;
  
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'finished'>('intro');
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds
  const [score, setScore] = useState(0);
  const [targets, setTargets] = useState<Array<{ id: string; x: number; y: number; hit: boolean }>>([]);
  const [gameResult, setGameResult] = useState<{ success: boolean; points: number } | null>(null);
  
  const animatedScale = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Bonus game configuration
  const TARGET_COUNT = 10;
  const TIME_LIMIT = 30;
  const POINTS_PER_TARGET = 500;
  const SUCCESS_THRESHOLD = 7; // Need 7/10 targets for success
  const BONUS_POINTS = 5000;

  useEffect(() => {
    // Announce game start
    AccessibilityInfo.announceForAccessibility(
      'Bonus-Spiel verfügbar! Tippe auf Ziele um Punkte und ein Leben zu gewinnen.'
    );
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      startGame();
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState]);

  const startGame = () => {
    // Generate random targets
    const newTargets = Array.from({ length: TARGET_COUNT }, (_, index) => ({
      id: `target-${index}`,
      x: Math.random() * 250, // Relative to container
      y: Math.random() * 300,
      hit: false
    }));
    
    setTargets(newTargets);
    setScore(0);
    setTimeLeft(TIME_LIMIT);
    
    // Start countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          finishGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    AccessibilityInfo.announceForAccessibility(
      `Bonus-Spiel gestartet! ${TIME_LIMIT} Sekunden Zeit. Tippe auf die Ziele.`
    );
  };

  const hitTarget = (targetId: string) => {
    setTargets(prev => 
      prev.map(target => 
        target.id === targetId && !target.hit
          ? { ...target, hit: true }
          : target
      )
    );
    
    setScore(prev => prev + 1);
    
    // Haptic feedback and animation
    Animated.sequence([
      Animated.timing(animatedScale, { toValue: 1.1, duration: 100, useNativeDriver: true }),
      Animated.timing(animatedScale, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();
    
    // Check if all targets hit
    const hitCount = targets.filter(t => t.hit).length + 1;
    if (hitCount >= TARGET_COUNT) {
      finishGame();
    }
  };

  const finishGame = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    const success = score >= SUCCESS_THRESHOLD;
    const earnedPoints = success ? BONUS_POINTS : score * POINTS_PER_TARGET;
    
    setGameResult({ success, points: earnedPoints });
    setGameState('finished');
    
    // Dispatch results to Redux
    dispatch(bonusGameCompleted({ 
      success, 
      bonusPoints: earnedPoints 
    }));
    
    // Announce result
    AccessibilityInfo.announceForAccessibility(
      success 
        ? `Bonus-Spiel erfolgreich! ${earnedPoints} Punkte und ein Leben erhalten.`
        : `Bonus-Spiel beendet. ${earnedPoints} Punkte erhalten.`
    );
  };

  const handleContinue = () => {
    navigation.navigate('MissionDebrief', {
      missionId,
      success: true,
      bonusCompleted: true,
      bonusPoints: gameResult?.points || 0
    });
  };

  const handleSkip = () => {
    navigation.navigate('MissionDebrief', {
      missionId,
      success: true,
      bonusCompleted: false
    });
  };

  if (gameState === 'intro') {
    return (
      <View style={styles.container}>
        <View style={styles.introContainer}>
          <Text style={styles.title} accessibilityRole="header">
            🎯 Bonus-Spiel!
          </Text>
          <Text style={styles.description}>
            Verdiene extra Punkte und ein Leben!
          </Text>
          
          <View style={styles.rulesContainer}>
            <Text style={styles.rulesTitle}>Spielregeln:</Text>
            <Text style={styles.ruleText}>• Tippe auf {TARGET_COUNT} Ziele in {TIME_LIMIT} Sekunden</Text>
            <Text style={styles.ruleText}>• Mindestens {SUCCESS_THRESHOLD} Treffer für Erfolg</Text>
            <Text style={styles.ruleText}>• Belohnung: {BONUS_POINTS.toLocaleString()} Punkte + 1 Leben</Text>
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, styles.primaryButton]}
              onPress={() => setGameState('playing')}
              accessibilityRole="button"
              accessibilityLabel="Bonus-Spiel starten"
            >
              <Text style={styles.primaryButtonText}>Spiel starten</Text>
            </Pressable>
            
            <Pressable
              style={[styles.button, styles.secondaryButton]}
              onPress={handleSkip}
              accessibilityRole="button"
              accessibilityLabel="Bonus-Spiel überspringen"
            >
              <Text style={styles.secondaryButtonText}>Überspringen</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  if (gameState === 'playing') {
    return (
      <View style={styles.container}>
        {/* Game HUD */}
        <View style={styles.gameHUD}>
          <Text style={styles.timer} accessibilityLabel={`${timeLeft} Sekunden übrig`}>
            ⏰ {timeLeft}s
          </Text>
          <Text style={styles.scoreText} accessibilityLabel={`${score} von ${TARGET_COUNT} Zielen getroffen`}>
            🎯 {score}/{TARGET_COUNT}
          </Text>
        </View>

        {/* Game Area */}
        <View style={styles.gameArea}>
          <Text style={styles.gameInstructions}>
            Tippe auf die blauen Ziele!
          </Text>
          
          <View style={styles.targetsContainer}>
            {targets.map(target => (
              <Pressable
                key={target.id}
                style={[
                  styles.target,
                  {
                    left: target.x,
                    top: target.y,
                    opacity: target.hit ? 0.3 : 1,
                    backgroundColor: target.hit ? colors.success : colors.brand
                  }
                ]}
                onPress={() => !target.hit && hitTarget(target.id)}
                disabled={target.hit}
                accessibilityRole="button"
                accessibilityLabel={`Ziel ${target.id} ${target.hit ? 'bereits getroffen' : 'verfügbar'}`}
                accessibilityState={{ disabled: target.hit }}
              >
                <Animated.Text 
                  style={[
                    styles.targetText,
                    { transform: [{ scale: animatedScale }] }
                  ]}
                >
                  {target.hit ? '✓' : '🎯'}
                </Animated.Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // Finished state
  return (
    <View style={styles.container}>
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle} accessibilityRole="header">
          {gameResult?.success ? '🎉 Erfolgreich!' : '⏰ Zeit abgelaufen!'}
        </Text>
        
        <Text style={styles.resultScore}>
          {score}/{TARGET_COUNT} Ziele getroffen
        </Text>
        
        <View style={styles.rewardContainer}>
          <Text style={styles.rewardTitle}>Belohnung:</Text>
          <Text style={styles.rewardText}>
            💰 {gameResult?.points.toLocaleString()} Punkte
          </Text>
          {gameResult?.success && (
            <Text style={styles.rewardText}>
              ❤️ +1 Leben
            </Text>
          )}
        </View>

        <Pressable
          style={[styles.button, styles.primaryButton]}
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel="Zur Mission-Zusammenfassung"
        >
          <Text style={styles.primaryButtonText}>Weiter</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg
  },
  
  introContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl
  },
  
  title: {
    fontSize: typography.h1,
    fontWeight: typography.bold,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.md
  },
  
  description: {
    fontSize: typography.body,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: spacing.xl
  },
  
  rulesContainer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.xl,
    ...shadows.soft
  },
  
  rulesTitle: {
    fontSize: typography.h3,
    fontWeight: typography.semibold,
    color: colors.ink,
    marginBottom: spacing.sm
  },
  
  ruleText: {
    fontSize: typography.body,
    color: colors.gray700,
    marginBottom: spacing.xs
  },
  
  buttonContainer: {
    width: '100%',
    gap: spacing.md
  },
  
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 16,
    minHeight: hitTarget.minSize,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium
  },
  
  primaryButton: {
    backgroundColor: colors.brand
  },
  
  secondaryButton: {
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray300
  },
  
  primaryButtonText: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: colors.bg
  },
  
  secondaryButtonText: {
    fontSize: typography.body,
    fontWeight: typography.medium,
    color: colors.gray700
  },
  
  gameHUD: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200
  },
  
  timer: {
    fontSize: typography.h2,
    fontWeight: typography.bold,
    color: colors.warning
  },
  
  scoreText: {
    fontSize: typography.h2,
    fontWeight: typography.bold,
    color: colors.brand
  },
  
  gameArea: {
    flex: 1,
    padding: spacing.lg
  },
  
  gameInstructions: {
    fontSize: typography.body,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: spacing.lg
  },
  
  targetsContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.gray50,
    borderRadius: 16,
    margin: spacing.md
  },
  
  target: {
    position: 'absolute',
    width: hitTarget.comfortable,
    height: hitTarget.comfortable,
    borderRadius: hitTarget.comfortable / 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium
  },
  
  targetText: {
    fontSize: 24,
    color: colors.bg
  },
  
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl
  },
  
  resultTitle: {
    fontSize: typography.h1,
    fontWeight: typography.bold,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.md
  },
  
  resultScore: {
    fontSize: typography.h2,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: spacing.xl
  },
  
  rewardContainer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.xl,
    alignItems: 'center',
    ...shadows.soft
  },
  
  rewardTitle: {
    fontSize: typography.h3,
    fontWeight: typography.semibold,
    color: colors.ink,
    marginBottom: spacing.sm
  },
  
  rewardText: {
    fontSize: typography.body,
    color: colors.success,
    fontWeight: typography.medium,
    marginBottom: spacing.xs
  }
}); 
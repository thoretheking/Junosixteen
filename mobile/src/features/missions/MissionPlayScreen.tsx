import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, AccessibilityInfo, Alert } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../app/storeHooks';
import { 
  correctAnswer, 
  wrongAnswer, 
  loseLife, 
  finishMission,
  selectCurrentMission,
  selectShowingChallenge,
  selectCanContinue
} from './missionSlice';
import { CHALLENGES } from './challengeRegistry';
import { Question, Challenge } from './types';
import { colors, spacing, typography, hitTarget, shadows } from '../../theme/tokens';
import HUD from '../../components/HUD';
import ChallengeModal from '../../components/ChallengeModal';

interface MissionPlayScreenProps {
  route: {
    params: {
      missionId: string;
      questions: Question[];
    };
  };
  navigation: any;
}

export default function MissionPlayScreen({ route, navigation }: MissionPlayScreenProps) {
  const dispatch = useAppDispatch();
  const mission = useAppSelector(selectCurrentMission);
  const showingChallenge = useAppSelector(selectShowingChallenge);
  const canContinue = useAppSelector(selectCanContinue);
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [questionStartTime] = useState(Date.now());
  
  const { questions } = route.params;
  
  // Current question
  const currentQ = mission ? questions[mission.currentQuestionIndex - 1] : null;
  const currentChallenge = showingChallenge ? CHALLENGES[showingChallenge] : null;

  // Navigation effects
  useEffect(() => {
    if (!mission) {
      navigation.navigate('MissionMap');
      return;
    }

    if (mission.finished) {
      navigation.navigate('MissionDebrief', {
        missionId: mission.missionId,
        success: mission.success,
        points: mission.points,
        lives: mission.lives
      });
    }
  }, [mission, navigation]);

  // Accessibility announcements
  useEffect(() => {
    if (currentQ) {
      AccessibilityInfo.announceForAccessibility(
        `Frage ${currentQ.index}. ${currentQ.stem}`
      );
    }
  }, [currentQ]);

  const handleAnswerSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleAnswerSubmit = () => {
    if (!currentQ || !selectedOption || !mission) return;
    
    const selectedOpt = currentQ.options.find(o => o.id === selectedOption);
    if (!selectedOpt) return;

    const timeElapsed = Date.now() - questionStartTime;
    
    if (selectedOpt.correct) {
      // Correct answer
      let points = currentQ.points;
      
      // Risk question bonus (2x points)
      if (currentQ.kind === 'risk') {
        points *= 2;
      }
      
      // Team question bonus (3x points)  
      if (currentQ.kind === 'team') {
        points *= 3;
      }

      dispatch(correctAnswer({ 
        questionId: currentQ.id, 
        points 
      }));
      
      AccessibilityInfo.announceForAccessibility(
        `Richtig! ${points} Punkte erhalten.`
      );
      
    } else {
      // Wrong answer - trigger challenge or lose life
      if (currentQ.onWrongChallengeId && CHALLENGES[currentQ.onWrongChallengeId]) {
        dispatch(wrongAnswer({ 
          questionId: currentQ.id, 
          challengeId: currentQ.onWrongChallengeId 
        }));
        
        AccessibilityInfo.announceForAccessibility(
          `Falsche Antwort. Challenge wird gestartet: ${CHALLENGES[currentQ.onWrongChallengeId].title}`
        );
      } else {
        // No challenge available, lose life directly
        dispatch(wrongAnswer({ questionId: currentQ.id }));
        
        AccessibilityInfo.announceForAccessibility(
          'Falsche Antwort. Ein Leben verloren.'
        );
      }
    }
    
    // Reset for next question
    setSelectedOption(null);
  };

  const handleChallengeResult = (success: boolean) => {
    if (!currentChallenge) return;
    
    dispatch(challengeCompleted({ 
      challengeId: currentChallenge.id, 
      success 
    }));
    
    if (success) {
      AccessibilityInfo.announceForAccessibility(
        'Challenge erfolgreich! Weiter zur nächsten Frage.'
      );
    } else {
      AccessibilityInfo.announceForAccessibility(
        'Challenge fehlgeschlagen. Ein Leben verloren.'
      );
    }
  };

  if (!mission || !currentQ) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Lade Mission...</Text>
      </View>
    );
  }

  if (!canContinue) {
    return (
      <View style={styles.gameOverContainer}>
        <Text style={styles.gameOverText} accessibilityRole="header">
          Mission beendet
        </Text>
        <Text style={styles.gameOverSubtext}>
          {mission.success ? 'Erfolgreich abgeschlossen!' : 'Alle Leben verloren'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HUD */}
      <HUD
        lives={mission.lives}
        bonusLives={mission.bonusLives}
        points={mission.points}
        progress={(mission.currentQuestionIndex - 1) / 10 * 100}
        currentQuestion={mission.currentQuestionIndex}
        totalQuestions={10}
        streak={mission.currentStreak}
      />

      {/* Question Content */}
      <View style={styles.questionContainer}>
        <Text 
          style={styles.questionHeader}
          accessibilityRole="header"
          accessibilityLabel={`Frage ${currentQ.index} von 10`}
        >
          Frage {currentQ.index}/10
          {currentQ.kind === 'risk' && (
            <Text style={styles.riskBadge}> ⚠️ RISIKO</Text>
          )}
          {currentQ.kind === 'team' && (
            <Text style={styles.teamBadge}> 👥 TEAM</Text>
          )}
        </Text>
        
        <Text 
          style={styles.questionText}
          accessibilityRole="text"
        >
          {currentQ.stem}
        </Text>

        {/* Answer Options */}
        <View style={styles.optionsContainer}>
          {currentQ.options.map((option, index) => (
            <Pressable
              key={option.id}
              style={[
                styles.optionButton,
                selectedOption === option.id && styles.optionButtonSelected
              ]}
              onPress={() => handleAnswerSelect(option.id)}
              accessibilityRole="radio"
              accessibilityState={{ 
                checked: selectedOption === option.id,
                disabled: false
              }}
              accessibilityLabel={`Option ${String.fromCharCode(65 + index)}: ${option.text}`}
              accessibilityHint="Doppeltipp um diese Antwort auszuwählen"
            >
              <View style={styles.optionContent}>
                <View style={styles.optionLetter}>
                  <Text style={styles.optionLetterText}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={styles.optionText}>{option.text}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Submit Button */}
        <Pressable
          style={[
            styles.submitButton,
            !selectedOption && styles.submitButtonDisabled
          ]}
          onPress={handleAnswerSubmit}
          disabled={!selectedOption}
          accessibilityRole="button"
          accessibilityLabel="Antwort bestätigen"
          accessibilityState={{ disabled: !selectedOption }}
          accessibilityHint="Bestätigt die ausgewählte Antwort"
        >
          <Text style={[
            styles.submitButtonText,
            !selectedOption && styles.submitButtonTextDisabled
          ]}>
            Antwort bestätigen
          </Text>
        </Pressable>
      </View>

      {/* Challenge Modal */}
      {currentChallenge && (
        <ChallengeModal
          challenge={currentChallenge}
          visible={!!showingChallenge}
          onResult={handleChallengeResult}
          onClose={() => handleChallengeResult(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg
  },
  
  loadingText: {
    fontSize: typography.h2,
    color: colors.gray600
  },
  
  gameOverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    padding: spacing.xl
  },
  
  gameOverText: {
    fontSize: typography.h1,
    fontWeight: typography.bold,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.md
  },
  
  gameOverSubtext: {
    fontSize: typography.body,
    color: colors.gray600,
    textAlign: 'center'
  },
  
  questionContainer: {
    flex: 1,
    padding: spacing.lg
  },
  
  questionHeader: {
    fontSize: typography.h3,
    fontWeight: typography.semibold,
    color: colors.ink,
    marginBottom: spacing.md,
    textAlign: 'center'
  },
  
  riskBadge: {
    fontSize: typography.caption,
    color: colors.warning,
    fontWeight: typography.bold
  },
  
  teamBadge: {
    fontSize: typography.caption,
    color: colors.info,
    fontWeight: typography.bold
  },
  
  questionText: {
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
    color: colors.ink,
    marginBottom: spacing.xl,
    textAlign: 'center'
  },
  
  optionsContainer: {
    marginBottom: spacing.xl
  },
  
  optionButton: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray200,
    minHeight: hitTarget.comfortable,
    ...shadows.soft
  },
  
  optionButtonSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.brand200
  },
  
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md
  },
  
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md
  },
  
  optionLetterText: {
    fontSize: typography.body,
    fontWeight: typography.bold,
    color: colors.bg
  },
  
  optionText: {
    flex: 1,
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
    color: colors.ink
  },
  
  submitButton: {
    backgroundColor: colors.brand,
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: hitTarget.minSize,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium
  },
  
  submitButtonDisabled: {
    backgroundColor: colors.gray300
  },
  
  submitButtonText: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: colors.bg
  },
  
  submitButtonTextDisabled: {
    color: colors.gray500
  }
}); 
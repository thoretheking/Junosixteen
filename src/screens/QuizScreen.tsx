import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import ApiService from '../services/ApiService';

const { width, height } = Dimensions.get('window');

interface Question {
  id: string;
  question: string;
  answers: string[];
  correctAnswer: number;
  explanation: string;
  timeLimit: number;
  isRiskQuestion: boolean;
}

interface QuizScreenProps {
  navigation: any;
  route: any;
}

const QuizScreen: React.FC<QuizScreenProps> = ({ navigation, route }) => {
  const { colors, typography, spacing } = useTheme();
  const { user, refreshUser } = useUser();
  const { moduleId } = route.params;
  
  const [module, setModule] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [startTime, setStartTime] = useState<number>(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingQuestion, setGeneratingQuestion] = useState(false);
  const [userCluster, setUserCluster] = useState<string>('Typ_A');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadModule();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (questions.length > 0) {
      startTimer();
    }
  }, [currentQuestionIndex, questions]);

  const loadModule = async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.getModule(moduleId, user?.language || 'de');
      setModule(response.module);
      
      // Benutzer-Cluster abrufen für adaptive Fragen
      setUserCluster(user?.cluster || 'Typ_A');
      
      // Wenn keine Fragen vorhanden, generiere adaptive Fragen mit MCP
      if (!response.module.questions || response.module.questions.length === 0) {
        await generateAdaptiveQuestions();
      } else {
        setQuestions(response.module.questions);
      }
      
      setStartTime(Date.now());
    } catch (error) {
      console.error('Error loading module:', error);
      Alert.alert('Fehler', 'Modul konnte nicht geladen werden');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const generateAdaptiveQuestions = async () => {
    try {
      setGeneratingQuestion(true);
      const currentLevel = user?.level || 1;
      const isRiskLevel = [5, 10].includes(currentLevel);
      
      // Bestimme Schwierigkeit basierend auf Benutzer-Performance
      // Verwende das Verhältnis von aktuellen zu Gesamtpunkten als Score-Indikator
      let difficulty = 'medium';
      const pointsRatio = user?.totalPoints ? user.currentPoints / user.totalPoints : 0.5;
      const userLevel = user?.level || 1;
      
      if (pointsRatio > 0.8 || userLevel > 7) {
        difficulty = 'hard';
      } else if (pointsRatio < 0.3 || userLevel < 3) {
        difficulty = 'easy';
      }

      // Generiere adaptive Frage mit MCP
      const response = await ApiService.generateQuestion({
        moduleId: moduleId,
        level: currentLevel,
        language: user?.language || 'de',
        cluster: userCluster,
        difficulty: difficulty,
        isRiskQuestion: isRiskLevel && Math.random() > 0.7,
      });

      if (response.success) {
        const newQuestion: Question = {
          id: response.questionId,
          question: response.question.question,
          answers: response.question.answers,
          correctAnswer: response.question.correctAnswer,
          explanation: response.question.explanation,
          timeLimit: isRiskLevel ? 45 : 30,
          isRiskQuestion: response.question.isRiskQuestion || false,
        };

        setQuestions(prev => [...prev, newQuestion]);
      }
    } catch (error) {
      console.error('Error generating adaptive question:', error);
      // Fallback zu statischen Fragen wenn MCP fehlschlägt
      Alert.alert('Info', 'Adaptive Fragengenerierung fehlgeschlagen, verwende Standard-Fragen');
    } finally {
      setGeneratingQuestion(false);
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    setTimeLeft(currentQuestion.timeLimit || 30);
    
    // Timer Animation
    timerAnim.setValue(1);
    Animated.timing(timerAnim, {
      toValue: 0,
      duration: (currentQuestion.timeLimit || 30) * 1000,
      useNativeDriver: false,
    }).start();

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeout = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedAnswer(-1); // Timeout
    setTimeout(() => handleAnswerSubmit(-1), 500);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswering || selectedAnswer !== null) return;
    
    setSelectedAnswer(answerIndex);
    if (timerRef.current) clearInterval(timerRef.current);
    
    setTimeout(() => handleAnswerSubmit(answerIndex), 800);
  };

  const handleAnswerSubmit = async (answerIndex: number) => {
    setIsAnswering(true);
    
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    const timeSpent = Date.now() - startTime;

    try {
      // Verhalten an Backend senden für UL-Analyse und Cluster-Update
      const ulResponse = await ApiService.analyzeUserBehavior({
        avgTime: timeSpent,
        errors: isCorrect ? 0 : 1,
        clicks: answerIndex + 1,
        moduleId: moduleId,
      });

      // Cluster-Update falls sich das Lernverhalten geändert hat
      if (ulResponse.cluster !== userCluster) {
        setUserCluster(ulResponse.cluster);
        await refreshUser(); // User-Context aktualisieren
        
        // Zeige Cluster-Change-Nachricht
        setTimeout(() => {
          Alert.alert(
            'Lerntyp-Update! 🎯',
            `Dein Lerntyp wurde auf ${ulResponse.clusterDescription.name} angepasst!\n\n${ulResponse.recommendations.join('\n')}`,
            [{ text: 'Super!', onPress: () => {} }]
          );
        }, 3000);
      }

      // Antwort an Gamification-System senden
      const response = await ApiService.submitAnswer({
        questionId: currentQuestion.id,
        answer: answerIndex,
        timeSpent,
        isCorrect,
      });

      setResultData(response.result);
      
      if (isCorrect) {
        setCorrectAnswers(prev => prev + 1);
        setScore(prev => prev + (response.result.pointsGained || 0));
      }

      // Zeige Ergebnis kurz an
      setShowResult(true);
      
      setTimeout(() => {
        setShowResult(false);
        nextQuestion();
      }, 2500);

    } catch (error) {
      console.error('Error submitting answer:', error);
      Alert.alert('Fehler', 'Antwort konnte nicht übermittelt werden');
      setIsAnswering(false);
    }
  };

  const nextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswering(false);
      setStartTime(Date.now());
      
      // Progress Animation
      Animated.timing(progressAnim, {
        toValue: (currentQuestionIndex + 1) / questions.length,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      // Prüfe ob mehr Fragen benötigt werden (adaptive Generation)
      const shouldGenerateMore = questions.length < 5; // Mindestens 5 Fragen pro Modul
      
      if (shouldGenerateMore && !generatingQuestion) {
        await generateAdaptiveQuestions();
        // Wenn neue Frage generiert, weitermachen
        if (questions.length > currentQuestionIndex + 1) {
          nextQuestion();
          return;
        }
      }
      
      completeModule();
    }
  };

  const completeModule = async () => {
    try {
      const totalTime = Date.now() - startTime;
      const finalScore = correctAnswers / questions.length;
      
      const response = await ApiService.completeModule(moduleId, {
        score: finalScore,
        timeSpent: totalTime,
        correctAnswers,
        totalQuestions: questions.length,
      });

      await refreshUser();

      // Zeige Abschluss-Screen
      navigation.replace('ModuleComplete', {
        moduleTitle: module.title,
        score: finalScore,
        correctAnswers,
        totalQuestions: questions.length,
        points: score,
        certificateEligible: response.certificateEligible,
        nextModule: response.nextModule,
      });

    } catch (error) {
      console.error('Error completing module:', error);
      Alert.alert('Fehler', 'Modul konnte nicht abgeschlossen werden');
    }
  };

  if (isLoading || generatingQuestion) {
    return (
      <View style={[{ flex: 1, backgroundColor: colors.background }, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{...typography.body, color: colors.textSecondary}}>
          {isLoading ? 'Lade Fragen...' : 'Generiere adaptive Frage...'}
        </Text>
        {generatingQuestion && (
          <Text style={{...typography.caption, color: colors.primary, marginTop: spacing.sm}}>
            🤖 MCP analysiert deinen Lerntyp ({userCluster})
          </Text>
        )}
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) {
    return (
      <View style={[{ flex: 1, backgroundColor: colors.background }, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{...typography.body, color: colors.textSecondary}}>Keine Fragen verfügbar</Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loading: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      ...typography.body,
      color: colors.textSecondary,
    },
    header: {
      backgroundColor: colors.primary,
      padding: spacing.lg,
      paddingTop: spacing.xl,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    moduleTitle: {
      ...typography.subtitle,
      color: 'white',
      flex: 1,
    },
    timerContainer: {
      alignItems: 'center',
    },
    timerText: {
      ...typography.body,
      color: 'white',
      fontWeight: 'bold',
    },
    progressContainer: {
      marginBottom: spacing.sm,
    },
    progressBar: {
      height: 4,
      backgroundColor: 'rgba(255,255,255,0.3)',
      borderRadius: 2,
    },
    progressFill: {
      height: '100%',
      backgroundColor: 'white',
      borderRadius: 2,
    },
    questionCounter: {
      ...typography.caption,
      color: 'white',
      opacity: 0.9,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    content: {
      flex: 1,
      padding: spacing.lg,
    },
    questionCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    questionText: {
      ...typography.body,
      fontSize: 18,
      lineHeight: 26,
      color: colors.text,
      marginBottom: spacing.lg,
    },
    riskWarning: {
      backgroundColor: colors.danger + '10',
      borderRadius: 8,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderLeftWidth: 4,
      borderLeftColor: colors.danger,
    },
    riskText: {
      ...typography.caption,
      color: colors.danger,
      fontWeight: '600',
    },
    answersContainer: {
      gap: spacing.md,
    },
    answerButton: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 12,
      padding: spacing.lg,
      alignItems: 'center',
    },
    correctAnswer: {
      backgroundColor: colors.success + '20',
      borderColor: colors.success,
    },
    wrongAnswer: {
      backgroundColor: colors.danger + '20',
      borderColor: colors.danger,
    },
    disabledAnswer: {
      opacity: 0.5,
    },
    answerText: {
      ...typography.body,
      color: colors.text,
      textAlign: 'center',
    },
    resultModal: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)',
    },
    resultContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.xl,
      width: width * 0.9,
      alignItems: 'center',
    },
    resultIcon: {
      fontSize: 48,
      marginBottom: spacing.md,
    },
    resultTitle: {
      ...typography.title,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    resultText: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    pointsText: {
      ...typography.subtitle,
      color: colors.primary,
      fontWeight: 'bold',
    },
  });

  const getAnswerStyle = (index: number) => {
    if (selectedAnswer === null) return styles.answerButton;
    
    if (index === currentQuestion.correctAnswer) {
      return [styles.answerButton, styles.correctAnswer];
    }
    
    if (index === selectedAnswer && index !== currentQuestion.correctAnswer) {
      return [styles.answerButton, styles.wrongAnswer];
    }
    
    return [styles.answerButton, styles.disabledAnswer];
  };

  const getTimerColor = () => {
    if (timeLeft <= 5) return colors.danger;
    if (timeLeft <= 10) return colors.secondary;
    return colors.primary;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.moduleTitle}>{module?.title}</Text>
          <View style={styles.timerContainer}>
            <Text style={[styles.timerText, { color: getTimerColor() }]}>
              {timeLeft}s
            </Text>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>
        
        <Text style={styles.questionCounter}>
          Frage {currentQuestionIndex + 1} von {questions.length}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.questionCard}>
          {currentQuestion.isRiskQuestion && (
            <View style={styles.riskWarning}>
              <Text style={styles.riskText}>
                ⚠️ RISIKO-FRAGE: Falsche Antwort = Alle Punkte verloren!
              </Text>
            </View>
          )}
          
          <Text style={styles.questionText}>
            {currentQuestion.question}
          </Text>
        </View>

        <View style={styles.answersContainer}>
          {currentQuestion.answers.map((answer, index) => (
            <TouchableOpacity
              key={index}
              style={getAnswerStyle(index)}
              onPress={() => handleAnswerSelect(index)}
              disabled={isAnswering || selectedAnswer !== null}
              accessibilityRole="button"
              accessibilityLabel={`Antwort ${String.fromCharCode(65 + index)}: ${answer}`}
              accessibilityHint="Doppeltipp um diese Antwort auszuwählen"
              accessibilityState={{
                disabled: isAnswering || selectedAnswer !== null,
                selected: selectedAnswer === index
              }}>
              <Text style={styles.answerText}>{answer}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Result Modal */}
      <Modal
        visible={showResult}
        transparent={true}
        animationType="fade">
        <View style={styles.resultModal}>
          <View style={styles.resultContainer}>
            <Text style={styles.resultIcon}>
              {resultData?.isCorrect ? '🎉' : '😔'}
            </Text>
            <Text style={[
              styles.resultTitle,
              { color: resultData?.isCorrect ? colors.success : colors.danger }
            ]}>
              {resultData?.isCorrect ? 'Richtig!' : 'Falsch!'}
            </Text>
            <Text style={styles.resultText}>
              {currentQuestion.explanation}
            </Text>
            {resultData?.pointsGained > 0 && (
              <Text style={styles.pointsText}>
                +{resultData.pointsGained} Punkte
              </Text>
            )}
            {resultData?.newBadges?.length > 0 && (
              <Text style={styles.resultText}>
                🏆 Neues Badge erhalten!
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default QuizScreen; 
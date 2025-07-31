// ===================================================
// 🎯 QUIZ SCREEN
// Interactive Mobile Quiz mit UL/MCP Integration
// ===================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Vibration,
  Platform,
  BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import HapticFeedback from 'react-native-haptic-feedback';

// Services
import { ApiService } from '../services/ApiService';

// Context
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

// Components
import LoadingSpinner from '../components/LoadingSpinner';
import CountdownTimer from '../components/CountdownTimer';
import ProgressBar from '../components/ProgressBar';
import ClusterBadge from '../components/ClusterBadge';

const QuizScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { user, updateUserStats } = useUser();
  
  // Quiz State
  const [quizSession, setQuizSession] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isAnswering, setIsAnswering] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  
  // UL Analytics State
  const [behaviorData, setBehaviorData] = useState({
    start_time: Date.now(),
    response_times: [],
    click_patterns: [],
    error_count: 0,
    hesitation_count: 0
  });
  
  // Animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    startQuiz();
    
    // Handle back button on Android
    const backAction = () => {
      showExitConfirmation();
      return true;
    };
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    
    return () => backHandler.remove();
  }, []);
  
  useEffect(() => {
    if (timeLeft <= 5 && timeLeft > 0) {
      // Haptic feedback for urgency
      HapticFeedback.trigger('impactLight');
    }
    
    if (timeLeft <= 0) {
      handleTimeUp();
    }
  }, [timeLeft]);
  
  const startQuiz = async () => {
    try {
      setIsLoading(true);
      const moduleId = route.params?.moduleId || 'module-7';
      const response = await ApiService.startQuiz(moduleId);
      
      if (response.success) {
        setQuizSession(response.quiz_session);
        
        // Animate progress bar
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false
        }).start();
      }
    } catch (error) {
      Alert.alert('Fehler', 'Quiz konnte nicht gestartet werden');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAnswerSelect = (answerIndex) => {
    if (isAnswering || showExplanation) return;
    
    const startTime = Date.now();
    const responseTime = (startTime - behaviorData.start_time - 
      behaviorData.response_times.reduce((sum, time) => sum + time, 0)) / 1000;
    
    // Track click pattern for UL analysis
    setBehaviorData(prev => ({
      ...prev,
      response_times: [...prev.response_times, responseTime],
      click_patterns: [...prev.click_patterns, {
        question_index: currentQuestionIndex,
        selected_answer: answerIndex,
        timestamp: Date.now()
      }]
    }));
    
    setSelectedAnswer(answerIndex);
    
    // Haptic feedback
    HapticFeedback.trigger('selection');
    
    // Animation feedback
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
  };
  
  const submitAnswer = async () => {
    if (selectedAnswer === null || isAnswering) return;
    
    setIsAnswering(true);
    
    try {
      const currentQuestion = quizSession.questions[currentQuestionIndex];
      const timeTaken = 30 - timeLeft;
      
      const response = await ApiService.submitAnswer(
        currentQuestion.id,
        selectedAnswer,
        timeTaken
      );
      
      if (response.success) {
        const { result } = response;
        
        // Update points
        setTotalPoints(prev => prev + result.points_earned);
        
        // Track errors for UL
        if (!result.correct) {
          setBehaviorData(prev => ({
            ...prev,
            error_count: prev.error_count + 1
          }));
        }
        
        // Show result animation
        if (result.correct) {
          HapticFeedback.trigger('impactHeavy');
        } else {
          if (currentQuestion.is_risk) {
            Vibration.vibrate([100, 200, 100]);
          } else {
            HapticFeedback.trigger('impactMedium');
          }
        }
        
        setShowExplanation(true);
        
        // Auto-advance after 3 seconds
        setTimeout(() => {
          nextQuestion();
        }, 3000);
      }
    } catch (error) {
      Alert.alert('Fehler', 'Antwort konnte nicht übermittelt werden');
      setIsAnswering(false);
    }
  };
  
  const nextQuestion = () => {
    if (currentQuestionIndex < quizSession.questions.length - 1) {
      // Animate to next question
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setShowExplanation(false);
        setIsAnswering(false);
        setTimeLeft(30);
        
        // Update progress
        const progress = (currentQuestionIndex + 2) / quizSession.questions.length;
        Animated.timing(progressAnim, {
          toValue: progress,
          duration: 500,
          useNativeDriver: false
        }).start();
        
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }).start();
      });
    } else {
      finishQuiz();
    }
  };
  
  const finishQuiz = async () => {
    try {
      // Analyze user behavior with UL
      const finalBehaviorData = {
        ...behaviorData,
        total_time: Date.now() - behaviorData.start_time,
        completion_rate: (currentQuestionIndex + 1) / quizSession.questions.length,
        avg_response_time: behaviorData.response_times.reduce((sum, time) => sum + time, 0) / behaviorData.response_times.length
      };
      
      await ApiService.analyzeUserBehavior(finalBehaviorData);
      
      // Update user stats
      updateUserStats({
        points: totalPoints,
        quizzes_completed: 1
      });
      
      // Navigate to results
      navigation.replace('QuizResults', {
        totalPoints,
        totalQuestions: quizSession.questions.length,
        behaviorData: finalBehaviorData
      });
      
    } catch (error) {
      console.error('Finish quiz error:', error);
      navigation.goBack();
    }
  };
  
  const handleTimeUp = () => {
    if (!showExplanation) {
      // Auto-submit with no answer
      setBehaviorData(prev => ({
        ...prev,
        hesitation_count: prev.hesitation_count + 1
      }));
      
      setSelectedAnswer(-1); // No answer
      submitAnswer();
    }
  };
  
  const showExitConfirmation = () => {
    Alert.alert(
      'Quiz verlassen?',
      'Ihr Fortschritt geht verloren.',
      [
        { text: 'Weitermachen', style: 'cancel' },
        { text: 'Verlassen', style: 'destructive', onPress: () => navigation.goBack() }
      ]
    );
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <LoadingSpinner message="Quiz wird geladen..." />
      </SafeAreaView>
    );
  }
  
  if (!quizSession) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.error }]}>
          Quiz konnte nicht geladen werden
        </Text>
      </SafeAreaView>
    );
  }
  
  const currentQuestion = quizSession.questions[currentQuestionIndex];
  const progress = (currentQuestionIndex + 1) / quizSession.questions.length;
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.exitButton}
          onPress={showExitConfirmation}
        >
          <Icon name="close" size={24} color={theme.text} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.questionCounter, { color: theme.text }]}>
            {currentQuestionIndex + 1} / {quizSession.questions.length}
          </Text>
          <ProgressBar progress={progress} color={theme.primary} />
        </View>
        
        <TouchableOpacity style={styles.helpButton}>
          <Icon name="help-outline" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
      
      {/* Timer & Points */}
      <View style={styles.statsRow}>
        <CountdownTimer 
          initialTime={30}
          onTimeUpdate={setTimeLeft}
          isActive={!showExplanation}
          warningThreshold={10}
        />
        
        <ClusterBadge 
          cluster={user?.profile?.cluster || 'Typ_A'}
          confidence={user?.profile?.cluster_confidence || 0.87}
        />
        
        <View style={styles.pointsContainer}>
          <Icon name="stars" size={20} color={theme.warning} />
          <Text style={[styles.points, { color: theme.text }]}>
            {totalPoints}
          </Text>
        </View>
      </View>
      
      {/* Question */}
      <Animated.View 
        style={[
          styles.questionContainer,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
        ]}
      >
        <ScrollView style={styles.questionScroll}>
          <View style={styles.questionHeader}>
            {currentQuestion.is_risk && (
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                style={styles.riskBadge}
              >
                <Icon name="warning" size={16} color="#ffffff" />
                <Text style={styles.riskText}>RISIKO-FRAGE</Text>
              </LinearGradient>
            )}
            
            <Text style={[styles.difficulty, { color: theme.textSecondary }]}>
              {currentQuestion.difficulty.toUpperCase()} • {currentQuestion.points} Punkte
            </Text>
          </View>
          
          <Text style={[styles.questionText, { color: theme.text }]}>
            {currentQuestion.text}
          </Text>
          
          {/* Options */}
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  { 
                    backgroundColor: selectedAnswer === index ? theme.primary : theme.surface,
                    borderColor: selectedAnswer === index ? theme.primary : theme.border
                  }
                ]}
                onPress={() => handleAnswerSelect(index)}
                disabled={isAnswering || showExplanation}
              >
                <View style={styles.optionContent}>
                  <View style={[
                    styles.optionNumber,
                    { 
                      backgroundColor: selectedAnswer === index ? '#ffffff' : theme.primary
                    }
                  ]}>
                    <Text style={[
                      styles.optionNumberText,
                      { color: selectedAnswer === index ? theme.primary : '#ffffff' }
                    ]}>
                      {index + 1}
                    </Text>
                  </View>
                  
                  <Text style={[
                    styles.optionText,
                    { color: selectedAnswer === index ? '#ffffff' : theme.text }
                  ]}>
                    {option}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Explanation */}
          {showExplanation && (
            <Animated.View style={styles.explanationContainer}>
              <LinearGradient
                colors={[theme.surface + '00', theme.surface]}
                style={styles.explanationBackground}
              >
                <Icon name="lightbulb-outline" size={24} color={theme.warning} />
                <Text style={[styles.explanationText, { color: theme.text }]}>
                  {currentQuestion.explanation}
                </Text>
              </LinearGradient>
            </Animated.View>
          )}
        </ScrollView>
      </Animated.View>
      
      {/* Submit Button */}
      {!showExplanation && (
        <TouchableOpacity
          style={[
            styles.submitButton,
            { 
              backgroundColor: selectedAnswer !== null ? theme.primary : theme.textSecondary,
              opacity: selectedAnswer !== null ? 1 : 0.6
            }
          ]}
          onPress={submitAnswer}
          disabled={selectedAnswer === null || isAnswering}
        >
          {isAnswering ? (
            <LoadingSpinner size="small" color="#ffffff" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>
                Antwort bestätigen
              </Text>
              <Icon name="check" size={24} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: 'space-between'
  },
  exitButton: {
    padding: 5
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20
  },
  questionCounter: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8
  },
  helpButton: {
    padding: 5
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  points: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5
  },
  questionContainer: {
    flex: 1,
    paddingHorizontal: 20
  },
  questionScroll: {
    flex: 1
  },
  questionHeader: {
    marginBottom: 15
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
    alignSelf: 'flex-start'
  },
  riskText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5
  },
  difficulty: {
    fontSize: 12,
    fontWeight: '600'
  },
  questionText: {
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 25,
    fontWeight: '500'
  },
  optionsContainer: {
    marginBottom: 20
  },
  optionButton: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    overflow: 'hidden'
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16
  },
  optionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  optionNumberText: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22
  },
  explanationContainer: {
    marginTop: 20
  },
  explanationBackground: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  explanationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    paddingVertical: 16,
    borderRadius: 12
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    margin: 20
  }
});

export default QuizScreen; 
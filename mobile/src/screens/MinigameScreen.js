import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, 
  Animated, Dimensions, ScrollView, TextInput, Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ApiService from '../services/ApiService';

const { width, height } = Dimensions.get('window');

const MinigameScreen = ({ route, navigation }) => {
  const { levelResult, availableGames } = route.params;
  
  // Game State
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [gameActive, setGameActive] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  
  // Memory Game State
  const [memoryCards, setMemoryCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  
  // Word Scramble State
  const [scrambledWord, setScrambledWord] = useState('');
  const [userInput, setUserInput] = useState('');
  const [wordHint, setWordHint] = useState('');
  
  // Reaction Test State
  const [currentStatement, setCurrentStatement] = useState(null);
  const [statementIndex, setStatementIndex] = useState(0);
  const [reactionResults, setReactionResults] = useState([]);
  
  // Puzzle Slider State
  const [puzzleGrid, setPuzzleGrid] = useState([]);
  const [emptyIndex, setEmptyIndex] = useState(0);
  const [moveCount, setMoveCount] = useState(0);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true
    }).start();
  }, []);

  useEffect(() => {
    if (gameActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameActive) {
      handleGameTimeout();
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, gameActive]);

  // ===================================================
  // 🎮 GAME SELECTION & INITIALIZATION
  // ===================================================

  const startMinigame = async (gameId, difficulty = 'medium') => {
    try {
      const game = availableGames.find(g => g.id === gameId);
      const theme = game.available_themes[0];
      
      const response = await ApiService.startMinigame({
        gameId,
        difficulty,
        theme
      });

      setSelectedGame(game);
      setGameData(response.gameData);
      setSessionId(response.sessionId);
      setTimeLeft(game.duration);
      setGameActive(true);
      setScore(0);

      // Initialize game-specific state
      switch (gameId) {
        case 'memory_cards':
          initializeMemoryGame(response.gameData);
          break;
        case 'word_scramble':
          initializeWordScramble(response.gameData);
          break;
        case 'reaction_test':
          initializeReactionTest(response.gameData);
          break;
        case 'puzzle_slider':
          initializePuzzleSlider(response.gameData);
          break;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    } catch (error) {
      console.error('Error starting minigame:', error);
      Alert.alert('Fehler', 'Minigame konnte nicht gestartet werden');
    }
  };

  // ===================================================
  // 🧠 MEMORY CARDS IMPLEMENTATION
  // ===================================================

  const initializeMemoryGame = (data) => {
    setMemoryCards(data.cards);
    setFlippedCards([]);
    setMatchedPairs(0);
  };

  const flipCard = (cardIndex) => {
    if (flippedCards.length >= 2 || flippedCards.includes(cardIndex)) return;
    if (memoryCards[cardIndex].matched) return;

    const newFlipped = [...flippedCards, cardIndex];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      const firstCard = memoryCards[first];
      const secondCard = memoryCards[second];

      if (firstCard.value === secondCard.value) {
        // Match found!
        setTimeout(() => {
          const updatedCards = [...memoryCards];
          updatedCards[first].matched = true;
          updatedCards[second].matched = true;
          setMemoryCards(updatedCards);
          setMatchedPairs(matchedPairs + 1);
          setScore(score + 10);
          setFlippedCards([]);

          // Check if game complete
          if (matchedPairs + 1 === gameData.totalPairs) {
            completeMinigame(100, timeLeft, 0, 1.0);
          }

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 1000);
      } else {
        // No match
        setTimeout(() => {
          setFlippedCards([]);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }, 1000);
      }
    }
  };

  const renderMemoryCard = (card, index) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.memoryCard,
        flippedCards.includes(index) || card.matched ? styles.flippedCard : null,
        card.matched ? styles.matchedCard : null
      ]}
      onPress={() => flipCard(index)}
      disabled={flippedCards.includes(index) || card.matched}
    >
      <Text style={styles.cardText}>
        {flippedCards.includes(index) || card.matched ? card.value : '❓'}
      </Text>
    </TouchableOpacity>
  );

  // ===================================================
  // 🔤 WORD SCRAMBLE IMPLEMENTATION
  // ===================================================

  const initializeWordScramble = (data) => {
    setScrambledWord(data.scrambledWord);
    setWordHint(data.hint);
    setUserInput('');
  };

  const checkWordAnswer = () => {
    const isCorrect = userInput.toUpperCase() === gameData.originalWord;
    
    if (isCorrect) {
      const timeBonus = Math.max(0, timeLeft * 2);
      completeMinigame(100, gameData.duration - timeLeft, 0, 1.0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setUserInput('');
      setScore(Math.max(0, score - 5));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // ===================================================
  // ⚡ REACTION TEST IMPLEMENTATION
  // ===================================================

  const initializeReactionTest = (data) => {
    setCurrentStatement(data.statements[0]);
    setStatementIndex(0);
    setReactionResults([]);
  };

  const handleReactionChoice = (userChoice) => {
    const isCorrect = userChoice === currentStatement.correct;
    const newResults = [...reactionResults, {
      correct: isCorrect,
      responseTime: gameData.timePerStatement - timeLeft
    }];
    
    setReactionResults(newResults);
    setScore(score + (isCorrect ? 10 : -2));

    if (statementIndex + 1 < gameData.statements.length) {
      setStatementIndex(statementIndex + 1);
      setCurrentStatement(gameData.statements[statementIndex + 1]);
      setTimeLeft(currentStatement.timeWindow / 1000);
    } else {
      const accuracy = newResults.filter(r => r.correct).length / newResults.length;
      completeMinigame(score, 0, 0, accuracy);
    }

    Haptics.impactAsync(
      isCorrect ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Heavy
    );
  };

  // ===================================================
  // 🧩 PUZZLE SLIDER IMPLEMENTATION
  // ===================================================

  const initializePuzzleSlider = (data) => {
    setPuzzleGrid(data.currentState);
    setEmptyIndex(data.emptyTileIndex);
    setMoveCount(0);
  };

  const moveTile = (tileIndex) => {
    const gridSize = Math.sqrt(puzzleGrid.length);
    const emptyRow = Math.floor(emptyIndex / gridSize);
    const emptyCol = emptyIndex % gridSize;
    const tileRow = Math.floor(tileIndex / gridSize);
    const tileCol = tileIndex % gridSize;

    // Check if tile is adjacent to empty space
    const isAdjacent = (Math.abs(emptyRow - tileRow) === 1 && emptyCol === tileCol) ||
                      (Math.abs(emptyCol - tileCol) === 1 && emptyRow === tileRow);

    if (!isAdjacent) return;

    // Swap tiles
    const newGrid = [...puzzleGrid];
    [newGrid[emptyIndex], newGrid[tileIndex]] = [newGrid[tileIndex], newGrid[emptyIndex]];
    
    setPuzzleGrid(newGrid);
    setEmptyIndex(tileIndex);
    setMoveCount(moveCount + 1);

    // Check if puzzle solved
    const isSolved = newGrid.every((tile, index) => {
      if (index === newGrid.length - 1) return tile === 0; // Last tile should be empty
      return tile === index + 1;
    });

    if (isSolved) {
      const efficiency = moveCount <= 25 ? 1.0 : Math.max(0.5, 25 / moveCount);
      completeMinigame(100, gameData.duration - timeLeft, moveCount, efficiency);
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderPuzzleTile = (tile, index) => {
    if (tile === 0) {
      return <View key={index} style={styles.emptyTile} />;
    }

    return (
      <TouchableOpacity
        key={index}
        style={styles.puzzleTile}
        onPress={() => moveTile(index)}
      >
        <Text style={styles.puzzleTileText}>{tile}</Text>
      </TouchableOpacity>
    );
  };

  // ===================================================
  // 🎉 GAME COMPLETION
  // ===================================================

  const completeMinigame = async (finalScore, timeSpent, moves, accuracy) => {
    try {
      setGameActive(false);
      setGameComplete(true);

      const response = await ApiService.completeMinigame({
        sessionId,
        score: finalScore,
        timeSpent,
        moves,
        accuracy
      });

      // Show completion animation
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true })
      ]).start();

      setTimeout(() => {
        Alert.alert(
          '🎉 Minigame abgeschlossen!',
          `Score: ${finalScore}\nBelohnung: ${response.results.rewards.totalReward} Punkte\nRanking: ${response.results.ranking.rank} ${response.results.ranking.icon}`,
          [
            { text: 'Anderes Spiel', onPress: () => resetGame() },
            { text: 'Fertig', onPress: () => navigation.goBack() }
          ]
        );
      }, 1500);

    } catch (error) {
      console.error('Error completing minigame:', error);
      Alert.alert('Fehler', 'Ergebnis konnte nicht gespeichert werden');
    }
  };

  const handleGameTimeout = () => {
    Alert.alert(
      '⏰ Zeit abgelaufen!',
      'Das Minigame ist beendet.',
      [
        { text: 'Nochmal', onPress: () => startMinigame(selectedGame.id) },
        { text: 'Anderes Spiel', onPress: () => resetGame() }
      ]
    );
    setGameActive(false);
  };

  const resetGame = () => {
    setSelectedGame(null);
    setGameData(null);
    setSessionId(null);
    setGameActive(false);
    setGameComplete(false);
    setScore(0);
    setTimeLeft(0);
  };

  // ===================================================
  // 🎨 RENDER METHODS
  // ===================================================

  const renderGameSelection = () => (
    <View style={styles.selectionContainer}>
      <Text style={styles.headerTitle}>🎉 Level abgeschlossen!</Text>
      <Text style={styles.headerSubtitle}>Wähle dein Belohnungs-Minigame:</Text>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {availableGames.map((game, index) => (
          <TouchableOpacity
            key={game.id}
            style={styles.gameCard}
            onPress={() => startMinigame(game.id)}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.gameCardGradient}
            >
              <View style={styles.gameCardContent}>
                <Text style={styles.gameIcon}>
                  {game.id === 'memory_cards' ? '🧠' :
                   game.id === 'word_scramble' ? '🔤' :
                   game.id === 'reaction_test' ? '⚡' : '🧩'}
                </Text>
                <View style={styles.gameInfo}>
                  <Text style={styles.gameName}>{game.name}</Text>
                  <Text style={styles.gameDesc}>{game.description}</Text>
                  <Text style={styles.gameReward}>
                    Belohnung: ~{game.estimated_reward} Punkte
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderGameHeader = () => (
    <View style={styles.gameHeader}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => {
          Alert.alert(
            'Spiel verlassen?',
            'Dein Fortschritt geht verloren.',
            [
              { text: 'Weiterspielen', style: 'cancel' },
              { text: 'Verlassen', onPress: () => resetGame() }
            ]
          );
        }}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      <View style={styles.gameHeaderInfo}>
        <Text style={styles.gameTitle}>{selectedGame?.name}</Text>
        <View style={styles.gameStats}>
          <Text style={styles.gameStatText}>⏱️ {timeLeft}s</Text>
          <Text style={styles.gameStatText}>🎯 {score}</Text>
        </View>
      </View>
    </View>
  );

  const renderActiveGame = () => {
    switch (selectedGame?.id) {
      case 'memory_cards':
        return (
          <View style={styles.memoryContainer}>
            <Text style={styles.gameInstruction}>
              Finde alle Paare! ({matchedPairs}/{gameData.totalPairs})
            </Text>
            <View style={styles.memoryGrid}>
              {memoryCards.map((card, index) => renderMemoryCard(card, index))}
            </View>
          </View>
        );

      case 'word_scramble':
        return (
          <View style={styles.wordContainer}>
            <Text style={styles.gameInstruction}>
              Bringe die Buchstaben in die richtige Reihenfolge:
            </Text>
            <Text style={styles.scrambledWord}>{scrambledWord}</Text>
            <Text style={styles.wordHint}>Hinweis: {wordHint}</Text>
            <TextInput
              style={styles.wordInput}
              value={userInput}
              onChangeText={setUserInput}
              placeholder="Deine Antwort..."
              autoCapitalize="characters"
              maxLength={gameData.wordLength}
            />
            <TouchableOpacity style={styles.submitButton} onPress={checkWordAnswer}>
              <Text style={styles.submitButtonText}>Antwort prüfen</Text>
            </TouchableOpacity>
          </View>
        );

      case 'reaction_test':
        return (
          <View style={styles.reactionContainer}>
            <Text style={styles.gameInstruction}>
              Frage {statementIndex + 1}/{gameData.totalStatements}
            </Text>
            <Text style={styles.reactionStatement}>
              {currentStatement?.text}
            </Text>
            <View style={styles.reactionButtons}>
              <TouchableOpacity
                style={[styles.reactionButton, styles.trueButton]}
                onPress={() => handleReactionChoice(true)}
              >
                <Text style={styles.reactionButtonText}>✅ RICHTIG</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reactionButton, styles.falseButton]}
                onPress={() => handleReactionChoice(false)}
              >
                <Text style={styles.reactionButtonText}>❌ FALSCH</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'puzzle_slider':
        const gridSize = Math.sqrt(puzzleGrid.length);
        return (
          <View style={styles.puzzleContainer}>
            <Text style={styles.gameInstruction}>
              Züge: {moveCount} | Bringe die Zahlen in Reihenfolge!
            </Text>
            <View style={[styles.puzzleGrid, { width: gridSize * 60, height: gridSize * 60 }]}>
              {puzzleGrid.map((tile, index) => renderPuzzleTile(tile, index))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {!selectedGame ? (
          renderGameSelection()
        ) : (
          <>
            {renderGameHeader()}
            <View style={styles.gameArea}>
              {renderActiveGame()}
            </View>
          </>
        )}
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 50,
  },
  selectionContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.9,
  },
  gameCard: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  gameCardGradient: {
    padding: 20,
  },
  gameCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  gameDesc: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 5,
  },
  gameReward: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 10,
  },
  gameHeaderInfo: {
    flex: 1,
    marginLeft: 10,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  gameStats: {
    flexDirection: 'row',
    marginTop: 5,
  },
  gameStatText: {
    color: '#FFFFFF',
    marginRight: 20,
    fontWeight: 'bold',
  },
  gameArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 20,
    padding: 20,
  },
  gameInstruction: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },

  // Memory Game Styles
  memoryContainer: {
    flex: 1,
    alignItems: 'center',
  },
  memoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: width - 80,
  },
  memoryCard: {
    width: 60,
    height: 60,
    backgroundColor: '#667eea',
    margin: 5,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flippedCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  matchedCard: {
    backgroundColor: '#4ECDC4',
    opacity: 0.6,
  },
  cardText: {
    fontSize: 24,
    color: '#FFFFFF',
  },

  // Word Scramble Styles
  wordContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrambledWord: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 20,
    letterSpacing: 4,
  },
  wordHint: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  wordInput: {
    borderWidth: 2,
    borderColor: '#667eea',
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    textAlign: 'center',
    width: 200,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Reaction Test Styles
  reactionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionStatement: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    color: '#333',
    lineHeight: 28,
  },
  reactionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  reactionButton: {
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 15,
    minWidth: 120,
  },
  trueButton: {
    backgroundColor: '#4ECDC4',
  },
  falseButton: {
    backgroundColor: '#FF6B6B',
  },
  reactionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },

  // Puzzle Slider Styles
  puzzleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  puzzleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 2,
    borderColor: '#667eea',
    borderRadius: 10,
  },
  puzzleTile: {
    width: 58,
    height: 58,
    backgroundColor: '#667eea',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTile: {
    width: 58,
    height: 58,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  puzzleTileText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default MinigameScreen; 
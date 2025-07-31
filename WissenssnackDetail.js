import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, TextInput, Modal, Alert, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const WissenssnackDetail = ({ route, navigation }) => {
  const { snack } = route.params;
  const [currentAbschnitt, setCurrentAbschnitt] = useState(0);
  const [reflexionText, setReflexionText] = useState('');
  const [showReflexion, setShowReflexion] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [startTime] = useState(Date.now());

  const slideAnim = new Animated.Value(0);
  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true
    }).start();
  }, [currentAbschnitt]);

  const nextAbschnitt = () => {
    if (currentAbschnitt < snack.content.abschnitte.length - 1) {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true })
      ]).start();
      
      setCurrentAbschnitt(currentAbschnitt + 1);
    } else {
      setShowReflexion(true);
    }
  };

  const prevAbschnitt = () => {
    if (currentAbschnitt > 0) {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true })
      ]).start();
      
      setCurrentAbschnitt(currentAbschnitt - 1);
    }
  };

  const completeSnack = async () => {
    try {
      const timeTaken = Date.now() - startTime;
      
      const response = await fetch(`/api/wissenssnacks/${snack.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token'
        },
        body: JSON.stringify({
          reflexionAntwort: reflexionText,
          timeTaken
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setCompleted(true);
        Alert.alert(
          '🎉 Gut gemacht!',
          `Du hast ${result.rewards.xp} XP und ${result.rewards.juno_coins} Juno Coins erhalten!`,
          [
            {
              text: 'Weiter lernen',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Fehler', 'Snack konnte nicht abgeschlossen werden');
    }
  };

  const getIconForType = (typ) => {
    const iconMap = {
      'definition': 'help-circle',
      'beispiel': 'bulb',
      'anwendung': 'settings',
      'typ1': 'eye',
      'typ2': 'anchor',
      'typ3': 'library',
      'grundregel': 'checkmark-circle',
      'qualitaet': 'star',
      'schutz': 'shield'
    };
    return iconMap[typ] || 'information-circle';
  };

  const getColorForType = (typ) => {
    const colorMap = {
      'definition': '#3498db',
      'beispiel': '#f39c12',
      'anwendung': '#2ecc71',
      'typ1': '#e74c3c',
      'typ2': '#9b59b6',
      'typ3': '#1abc9c',
      'grundregel': '#27ae60',
      'qualitaet': '#f1c40f',
      'schutz': '#34495e'
    };
    return colorMap[typ] || '#95a5a6';
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${((currentAbschnitt + 1) / snack.content.abschnitte.length) * 100}%` }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>
        {currentAbschnitt + 1} / {snack.content.abschnitte.length}
      </Text>
    </View>
  );

  const renderAbschnitt = () => {
    const abschnitt = snack.content.abschnitte[currentAbschnitt];
    const iconName = getIconForType(abschnitt.typ);
    const color = getColorForType(abschnitt.typ);

    return (
      <Animated.View 
        style={[
          styles.abschnittContainer,
          { 
            opacity: fadeAnim,
            transform: [{
              translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })
            }]
          }
        ]}
      >
        <BlurView intensity={80} style={styles.abschnittCard}>
          <View style={[styles.iconContainer, { backgroundColor: color }]}>
            <Ionicons name={iconName} size={32} color="#fff" />
          </View>
          
          <View style={styles.contentContainer}>
            <Text style={styles.abschnittText}>{abschnitt.text}</Text>
          </View>
          
          {/* Sanfte Animation für Karten-Wechsel */}
          <View style={styles.cardIndicator}>
            <View style={[styles.cardDot, { backgroundColor: color }]} />
          </View>
        </BlurView>
      </Animated.View>
    );
  };

  const renderReflexionModal = () => (
    <Modal
      visible={showReflexion}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.modalContainer}>
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>💭 Kurze Reflexion</Text>
            <TouchableOpacity onPress={() => setShowReflexion(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.reflexionFrage}>{snack.content.reflexion}</Text>
            
            <View style={styles.reflexionInputContainer}>
              <TextInput
                style={styles.reflexionInput}
                multiline
                numberOfLines={4}
                placeholder="Deine Gedanken..."
                placeholderTextColor="#999"
                value={reflexionText}
                onChangeText={setReflexionText}
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.skipButton]}
                onPress={completeSnack}
              >
                <Text style={styles.skipButtonText}>Überspringen</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.completeButton]}
                onPress={completeSnack}
              >
                <Text style={styles.completeButtonText}>Abschließen</Text>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      {/* Header mit Soft Shadows */}
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{snack.content.titel}</Text>
              <Text style={styles.headerSubtitle}>{snack.content.untertitel}</Text>
              
              <View style={styles.headerMeta}>
                <View style={styles.durationBadge}>
                  <Ionicons name="time" size={14} color="#fff" />
                  <Text style={styles.durationText}>{snack.dauer}s</Text>
                </View>
                <View style={styles.bereichBadge}>
                  <Text style={styles.bereichText}>{snack.bereich}</Text>
                </View>
              </View>
            </View>
          </View>
          
          {renderProgressBar()}
        </SafeAreaView>
      </LinearGradient>

      {/* Main Content mit vertikal scrollbaren Cards */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentArea}>
          {renderAbschnitt()}
        </View>
      </ScrollView>

      {/* Navigation Buttons mit sanften Animationen */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          style={[styles.navButton, currentAbschnitt === 0 && styles.navButtonDisabled]}
          onPress={prevAbschnitt}
          disabled={currentAbschnitt === 0}
        >
          <Ionicons 
            name="chevron-back" 
            size={20} 
            color={currentAbschnitt === 0 ? "#ccc" : "#667eea"} 
          />
          <Text style={[styles.navButtonText, currentAbschnitt === 0 && styles.navButtonTextDisabled]}>
            Zurück
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, styles.nextButton]}
          onPress={nextAbschnitt}
        >
          <Text style={styles.nextButtonText}>
            {currentAbschnitt < snack.content.abschnitte.length - 1 ? 'Weiter' : 'Reflexion'}
          </Text>
          <Ionicons 
            name={currentAbschnitt < snack.content.abschnitte.length - 1 ? "chevron-forward" : "checkmark"} 
            size={20} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>

      {renderReflexionModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    marginRight: 15,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 10,
  },
  headerMeta: {
    flexDirection: 'row',
    gap: 10,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  bereichBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bereichText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 15,
    gap: 15,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  progressText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  contentArea: {
    padding: 20,
    minHeight: 400,
  },
  abschnittContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  abschnittCard: {
    borderRadius: 20,
    padding: 30,
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 12,
    alignItems: 'center',
    minHeight: 300,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  abschnittText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#2c3e50',
    textAlign: 'center',
    fontWeight: '500',
  },
  cardIndicator: {
    marginTop: 20,
  },
  cardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    gap: 8,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    color: '#667eea',
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: '#ccc',
  },
  nextButton: {
    backgroundColor: '#667eea',
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  reflexionFrage: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 26,
  },
  reflexionInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 4,
    marginBottom: 30,
  },
  reflexionInput: {
    fontSize: 16,
    padding: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#2c3e50',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 40,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 25,
    gap: 8,
  },
  skipButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  skipButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  completeButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  completeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default WissenssnackDetail; 
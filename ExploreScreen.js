import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Modal, FlatList, Alert, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const ExploreScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('snacks');
  const [wissenssnacks, setWissenssnacks] = useState([]);
  const [storytelling, setStorytelling] = useState([]);
  const [tagesimpuls, setTagesimpuls] = useState(null);
  const [empfehlungen, setEmpfehlungen] = useState([]);
  const [playerResources, setPlayerResources] = useState({ juno_coins: 0, total_points: 0 });
  const [selectedZeitfilter, setSelectedZeitfilter] = useState(null);
  const [loading, setLoading] = useState(true);

  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    loadExploreData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true
    }).start();
  }, []);

  const loadExploreData = async () => {
    try {
      setLoading(true);
      
      // Parallel laden für bessere Performance
      const [snacksRes, storytellingRes, impulsRes, empfehlungenRes] = await Promise.all([
        fetch('/api/wissenssnacks', { headers: { Authorization: 'Bearer demo-token' }}),
        fetch('/api/storytelling', { headers: { Authorization: 'Bearer demo-token' }}),
        fetch('/api/wissensimpuls', { headers: { Authorization: 'Bearer demo-token' }}),
        fetch('/api/empfehlungen?kontext=interesse', { headers: { Authorization: 'Bearer demo-token' }})
      ]);

      const snacksData = await snacksRes.json();
      const storytellingData = await storytellingRes.json();
      const impulsData = await impulsRes.json();
      const empfehlungenData = await empfehlungenRes.json();

      if (snacksData.success) setWissenssnacks(snacksData.snacks);
      if (storytellingData.success) setStorytelling(storytellingData.storytelling_reihen);
      if (impulsData.success) setTagesimpuls(impulsData.wissensimpuls);
      if (empfehlungenData.success) setEmpfehlungen(empfehlungenData.empfehlungen);

    } catch (error) {
      console.error('Error loading explore data:', error);
    } finally {
      setLoading(false);
    }
  };

  const zeitkategorien = [
    { key: 'QUICK', label: '⚡ 1 Min', dauer: 60, color: '#FF6B6B' },
    { key: 'SHORT', label: '🎯 3 Min', dauer: 180, color: '#4ECDC4' },
    { key: 'MEDIUM', label: '📚 5 Min', dauer: 300, color: '#45B7D1' },
    { key: 'DEEP', label: '🧠 10 Min', dauer: 600, color: '#96CEB4' }
  ];

  const renderHeader = () => (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
      <SafeAreaView>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>🌟 Explore</Text>
            <View style={styles.resourcesDisplay}>
              <View style={styles.resourceItem}>
                <Ionicons name="diamond" size={16} color="#FFD700" />
                <Text style={styles.resourceText}>{playerResources.juno_coins}</Text>
              </View>
              <View style={styles.resourceItem}>
                <Ionicons name="flash" size={16} color="#4ECDC4" />
                <Text style={styles.resourceText}>{playerResources.total_points}</Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.headerSubtitle}>
            Entdecke neue Lernwelten jenseits der Pflichtkurse
          </Text>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                { id: 'snacks', label: '🍿 Snacks', icon: 'flash' },
                { id: 'journeys', label: '🗺️ Reisen', icon: 'map' },
                { id: 'micro', label: '⚡ Micro', icon: 'time' },
                { id: 'heute', label: '📅 Heute', icon: 'today' }
              ].map(tab => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  const renderWissenssnack = ({ item }) => (
    <TouchableOpacity 
      style={styles.snackCard}
      onPress={() => navigation.navigate('WissenssnackDetail', { snack: item })}
    >
      <BlurView intensity={20} style={styles.snackBlur}>
        <View style={styles.snackHeader}>
          <View style={styles.snackDuration}>
            <Ionicons name="time" size={12} color="#666" />
            <Text style={styles.snackDurationText}>{item.dauer}s</Text>
          </View>
          {item.completed && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4ECDC4" />
            </View>
          )}
        </View>
        
        <Text style={styles.snackTitle}>{Object.keys(item)[0]}</Text>
        <Text style={styles.snackSubtitle}>{item.content?.untertitel}</Text>
        
        <View style={styles.snackBereich}>
          <Text style={styles.snackBereichText}>{item.bereich}</Text>
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  const renderStorytellingReihe = ({ item }) => (
    <TouchableOpacity 
      style={styles.storyCard}
      onPress={() => navigation.navigate('StorytellingDetail', { reihe: item })}
    >
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.storyGradient}>
        <View style={styles.storyHeader}>
          <Text style={styles.storyTitle}>{item.titel}</Text>
          <View style={styles.storyProgress}>
            <Text style={styles.storyProgressText}>
              {item.progress.currentKapitel}/{item.progress.totalKapitel}
            </Text>
          </View>
        </View>
        
        <Text style={styles.storyDescription}>{item.beschreibung}</Text>
        
        <View style={styles.storyFooter}>
          <View style={styles.storyProgressBar}>
            <View 
              style={[
                styles.storyProgressFill, 
                { width: `${item.progress.completionPercentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.storyCategory}>{item.kategorie}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderZeitfilter = () => (
    <View style={styles.zeitfilterContainer}>
      <Text style={styles.sectionTitle}>⚡ Wie viel Zeit hast du?</Text>
      <View style={styles.zeitfilterGrid}>
        {zeitkategorien.map(kategorie => (
          <TouchableOpacity
            key={kategorie.key}
            style={[
              styles.zeitfilterCard,
              { backgroundColor: kategorie.color },
              selectedZeitfilter === kategorie.key && styles.zeitfilterActive
            ]}
            onPress={() => setSelectedZeitfilter(kategorie.key)}
          >
            <Text style={styles.zeitfilterLabel}>{kategorie.label}</Text>
            <Text style={styles.zeitfilterDauer}>{kategorie.dauer}s</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderTagesimpuls = () => (
    <View style={styles.impulsContainer}>
      <LinearGradient colors={['#FFD89B', '#19547B']} style={styles.impulsCard}>
        <View style={styles.impulsHeader}>
          <Text style={styles.impulsTitle}>💡 Dein Wissensimpuls</Text>
          <Text style={styles.impulsTime}>Heute</Text>
        </View>
        
        {tagesimpuls ? (
          <View style={styles.impulsContent}>
            <Text style={styles.impulsSnackTitle}>{tagesimpuls.snack?.content?.titel}</Text>
            <Text style={styles.impulsSnackSubtitle}>{tagesimpuls.snack?.content?.untertitel}</Text>
            
            <TouchableOpacity 
              style={styles.impulsButton}
              onPress={() => navigation.navigate('WissenssnackDetail', { snack: tagesimpuls.snack })}
            >
              <Text style={styles.impulsButtonText}>Jetzt lernen</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.impulsCompleted}>✅ Heute bereits abgeholt!</Text>
        )}
      </LinearGradient>
      
      {/* Empfehlungen */}
      {empfehlungen.length > 0 && (
        <View style={styles.empfehlungenContainer}>
          <Text style={styles.sectionTitle}>🎯 Für dich empfohlen</Text>
          {empfehlungen.map((emp, index) => (
            <View key={index} style={styles.empfehlungCard}>
              <Text style={styles.empfehlungGrund}>{emp.grund}</Text>
              <Text style={styles.empfehlungTitle}>{emp.empfehlung?.titel}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>✨ Lade deine Lernwelt...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'snacks':
        return (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>🍿 Wissenssnacks</Text>
            <Text style={styles.sectionSubtitle}>Lernen in 30-90 Sekunden</Text>
            <FlatList
              data={wissenssnacks}
              renderItem={renderWissenssnack}
              keyExtractor={item => item.id}
              numColumns={2}
              columnWrapperStyle={styles.snackRow}
              showsVerticalScrollIndicator={false}
            />
          </View>
        );
        
      case 'journeys':
        return (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>🗺️ Lernreisen</Text>
            <Text style={styles.sectionSubtitle}>Emotionale Geschichten über mehrere Kapitel</Text>
            <FlatList
              data={storytelling}
              renderItem={renderStorytellingReihe}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
            />
          </View>
        );
        
      case 'micro':
        return (
          <View style={styles.content}>
            {renderZeitfilter()}
            {selectedZeitfilter && (
              <View style={styles.microResults}>
                <Text style={styles.sectionTitle}>Passende Inhalte</Text>
                <FlatList
                  data={wissenssnacks.filter(s => s.dauer <= zeitkategorien.find(z => z.key === selectedZeitfilter)?.dauer)}
                  renderItem={renderWissenssnack}
                  keyExtractor={item => item.id}
                  numColumns={2}
                  columnWrapperStyle={styles.snackRow}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}
          </View>
        );
        
      case 'heute':
        return renderTagesimpuls();
        
      default:
        return <View />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
        {renderHeader()}
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderContent()}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  animatedContainer: {
    flex: 1,
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
  },
  resourcesDisplay: {
    flexDirection: 'row',
    gap: 15,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 5,
  },
  resourceText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  tabContainer: {
    marginTop: 10,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 20,
  },
  snackRow: {
    justifyContent: 'space-between',
  },
  snackCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  snackBlur: {
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  snackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  snackDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  snackDurationText: {
    fontSize: 12,
    color: '#666',
  },
  completedBadge: {
    // Badge-Style
  },
  snackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  snackSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 10,
  },
  snackBereich: {
    backgroundColor: '#e8f4f8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  snackBereichText: {
    fontSize: 10,
    color: '#3498db',
    fontWeight: '500',
  },
  storyCard: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  storyGradient: {
    padding: 20,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  storyProgress: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  storyProgressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  storyDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 15,
  },
  storyFooter: {
    // Footer-Style
  },
  storyProgressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 10,
  },
  storyProgressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  storyCategory: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  zeitfilterContainer: {
    marginBottom: 30,
  },
  zeitfilterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  zeitfilterCard: {
    width: '48%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  zeitfilterActive: {
    transform: [{ scale: 1.05 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  zeitfilterLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  zeitfilterDauer: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  impulsContainer: {
    padding: 20,
  },
  impulsCard: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  impulsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  impulsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  impulsTime: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  impulsContent: {
    // Content-Style
  },
  impulsSnackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  impulsSnackSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 15,
  },
  impulsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: 'flex-start',
    gap: 8,
  },
  impulsButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  impulsCompleted: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  empfehlungenContainer: {
    // Empfehlungen-Style
  },
  empfehlungCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  empfehlungGrund: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  empfehlungTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  microResults: {
    marginTop: 20,
  },
});

export default ExploreScreen; 
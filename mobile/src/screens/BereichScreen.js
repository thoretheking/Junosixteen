// ===================================================
// 🎯 JUNOSIXTEEN BEREICH SELECTION SCREEN
// Complete Learning Areas with Level Progress & Highscores
// ===================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  StyleSheet,
  Dimensions,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import ApiService from '../services/ApiService';

const { width } = Dimensions.get('window');

// ===================================================
// 🎯 BEREICH SCREEN COMPONENT
// ===================================================

const BereichScreen = ({ navigation }) => {
  // State Management
  const [bereiche, setBereiche] = useState([]);
  const [filteredBereiche, setFilteredBereiche] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBereich, setSelectedBereich] = useState(null);
  const [highscores, setHighscores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal State
  const [showBereichModal, setShowBereichModal] = useState(false);
  const [showHighscoreModal, setShowHighscoreModal] = useState(false);
  const [highscoreType, setHighscoreType] = useState('global');

  // Filter State
  const [filterLevel, setFilterLevel] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // ===================================================
  // 🚀 INITIALIZATION
  // ===================================================

  useEffect(() => {
    loadBereiche();
  }, []);

  useEffect(() => {
    filterBereiche();
  }, [bereiche, searchQuery, filterLevel, sortBy]);

  const loadBereiche = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getBereiche();
      setBereiche(data.bereiche);
    } catch (error) {
      console.error('Error loading bereiche:', error);
      Alert.alert('Fehler', 'Bereiche konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBereiche();
    setRefreshing(false);
  };

  // ===================================================
  // 🔍 FILTERING & SEARCH
  // ===================================================

  const filterBereiche = () => {
    let filtered = [...bereiche];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(bereich =>
        bereich.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Level filter
    if (filterLevel !== 'all') {
      filtered = filtered.filter(bereich => {
        switch (filterLevel) {
          case 'beginner':
            return bereich.current_level <= 3;
          case 'intermediate':
            return bereich.current_level >= 4 && bereich.current_level <= 7;
          case 'advanced':
            return bereich.current_level >= 8;
          case 'completed':
            return bereich.current_level >= 10;
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'level':
          return b.current_level - a.current_level;
        case 'score':
          return b.best_score - a.best_score;
        case 'progress':
          return b.experience - a.experience;
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredBereiche(filtered);
  };

  // ===================================================
  // 🎮 GAME ACTIONS
  // ===================================================

  const handleBereichSelect = (bereich) => {
    setSelectedBereich(bereich);
    setShowBereichModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const startGame = (mode = 'single') => {
    setShowBereichModal(false);
    navigation.navigate('Game', {
      bereich: selectedBereich.name,
      level: selectedBereich.current_level,
      mode
    });
  };

  const showBereichHighscores = async (bereich) => {
    try {
      setLoading(true);
      const data = await ApiService.getHighscores('bereich', bereich.name);
      setHighscores(data.highscores);
      setHighscoreType('bereich');
      setShowHighscoreModal(true);
    } catch (error) {
      console.error('Error loading highscores:', error);
      Alert.alert('Fehler', 'Highscores konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const showGlobalHighscores = async (type = 'global') => {
    try {
      setLoading(true);
      const data = await ApiService.getHighscores(type);
      setHighscores(data.highscores);
      setHighscoreType(type);
      setShowHighscoreModal(true);
    } catch (error) {
      console.error('Error loading highscores:', error);
      Alert.alert('Fehler', 'Highscores konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // 🎨 RENDER HELPERS
  // ===================================================

  const getLevelColor = (level) => {
    if (level >= 8) return '#FF6B6B'; // Expert
    if (level >= 5) return '#4ECDC4'; // Advanced
    if (level >= 3) return '#45B7D1'; // Intermediate
    return '#96CEB4'; // Beginner
  };

  const getLevelIcon = (level) => {
    if (level >= 10) return 'crown';
    if (level >= 8) return 'star';
    if (level >= 5) return 'medal';
    if (level >= 3) return 'trending-up';
    return 'play';
  };

  const getBereichIcon = (bereichName) => {
    const iconMap = {
      'Datenschutz': 'shield-check',
      'Cybersicherheit': 'security',
      'KI & Ethik': 'brain',
      'EU AI Act': 'gavel',
      'Projektmanagement': 'chart-gantt',
      'Leadership': 'account-tie',
      'Marketing': 'bullhorn',
      'BWL': 'chart-line',
      'Programmierung': 'code-tags',
      'Microsoft Office': 'microsoft-office'
    };
    return iconMap[bereichName] || 'book-open';
  };

  // ===================================================
  // 🎨 RENDER COMPONENTS
  // ===================================================

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Lernbereiche</Text>

        <TouchableOpacity
          style={styles.highscoreButton}
          onPress={() => showGlobalHighscores('global')}
        >
          <Icon name="trophy" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Bereich suchen..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {[
          { key: 'all', label: 'Alle', icon: 'view-grid' },
          { key: 'beginner', label: 'Anfänger', icon: 'play' },
          { key: 'intermediate', label: 'Fortgeschritten', icon: 'trending-up' },
          { key: 'advanced', label: 'Experte', icon: 'star' },
          { key: 'completed', label: 'Abgeschlossen', icon: 'crown' }
        ].map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              filterLevel === filter.key && styles.filterChipActive
            ]}
            onPress={() => setFilterLevel(filter.key)}
          >
            <Icon
              name={filter.icon}
              size={16}
              color={filterLevel === filter.key ? '#FFFFFF' : '#666'}
            />
            <Text style={[
              styles.filterChipText,
              filterLevel === filter.key && styles.filterChipTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sortieren:</Text>
        {[
          { key: 'name', label: 'Name' },
          { key: 'level', label: 'Level' },
          { key: 'score', label: 'Score' },
          { key: 'progress', label: 'Fortschritt' }
        ].map(sort => (
          <TouchableOpacity
            key={sort.key}
            style={[
              styles.sortOption,
              sortBy === sort.key && styles.sortOptionActive
            ]}
            onPress={() => setSortBy(sort.key)}
          >
            <Text style={[
              styles.sortOptionText,
              sortBy === sort.key && styles.sortOptionTextActive
            ]}>
              {sort.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderBereichCard = (bereich) => (
    <TouchableOpacity
      key={bereich.name}
      style={styles.bereichCard}
      onPress={() => handleBereichSelect(bereich)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[getLevelColor(bereich.current_level), '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bereichGradient}
      >
        <View style={styles.bereichHeader}>
          <View style={styles.bereichIcon}>
            <Icon
              name={getBereichIcon(bereich.name)}
              size={24}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.bereichLevel}>
            <Icon
              name={getLevelIcon(bereich.current_level)}
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.levelText}>L{bereich.current_level}</Text>
          </View>
        </View>

        <Text style={styles.bereichName}>{bereich.name}</Text>

        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((bereich.current_level / 10) * 100, 100)}%`
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round((bereich.current_level / 10) * 100)}%
          </Text>
        </View>

        <View style={styles.bereichStats}>
          <View style={styles.statItem}>
            <Icon name="star" size={14} color="#666" />
            <Text style={styles.statValue}>{bereich.best_score}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Icon name="target" size={14} color="#666" />
            <Text style={styles.statValue}>
              {Math.round(bereich.accuracy * 100)}%
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.highscoreIcon}
            onPress={() => showBereichHighscores(bereich)}
          >
            <Icon name="chart-line" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderBereichModal = () => (
    <Modal
      visible={showBereichModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowBereichModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.bereichModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedBereich?.name}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowBereichModal(false)}
            >
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {selectedBereich && (
            <View style={styles.modalContent}>
              <View style={styles.levelDisplay}>
                <Icon
                  name={getLevelIcon(selectedBereich.current_level)}
                  size={32}
                  color={getLevelColor(selectedBereich.current_level)}
                />
                <Text style={styles.currentLevel}>
                  Level {selectedBereich.current_level}
                </Text>
                <Text style={styles.levelName}>
                  {selectedBereich.current_level >= 10 ? 'Super Expert' :
                   selectedBereich.current_level >= 9 ? 'Architect' :
                   selectedBereich.current_level >= 8 ? 'Guru' :
                   selectedBereich.current_level >= 7 ? 'Visionary' :
                   selectedBereich.current_level >= 6 ? 'Mastermind' :
                   selectedBereich.current_level >= 5 ? 'Prodigy' :
                   selectedBereich.current_level >= 4 ? 'Strategist' :
                   selectedBereich.current_level >= 3 ? 'Challenger' :
                   selectedBereich.current_level >= 2 ? 'Explorer' : 'Rookie'}
                </Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Icon name="star" size={20} color="#FFD700" />
                  <Text style={styles.statNumber}>{selectedBereich.best_score}</Text>
                  <Text style={styles.statLabel}>Bester Score</Text>
                </View>

                <View style={styles.statCard}>
                  <Icon name="target" size={20} color="#4ECDC4" />
                  <Text style={styles.statNumber}>
                    {Math.round(selectedBereich.accuracy * 100)}%
                  </Text>
                  <Text style={styles.statLabel}>Genauigkeit</Text>
                </View>

                <View style={styles.statCard}>
                  <Icon name="clock" size={20} color="#45B7D1" />
                  <Text style={styles.statNumber}>
                    {Math.round(selectedBereich.total_time / 60)}min
                  </Text>
                  <Text style={styles.statLabel}>Lernzeit</Text>
                </View>

                <View style={styles.statCard}>
                  <Icon name="trending-up" size={20} color="#96CEB4" />
                  <Text style={styles.statNumber}>{selectedBereich.experience}</Text>
                  <Text style={styles.statLabel}>Erfahrung</Text>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.singleButton]}
                  onPress={() => startGame('single')}
                >
                  <Icon name="play" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Einzelspiel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.teamButton]}
                  onPress={() => startGame('team')}
                >
                  <Icon name="account-group" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Team</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.highscoreViewButton}
                onPress={() => {
                  setShowBereichModal(false);
                  showBereichHighscores(selectedBereich);
                }}
              >
                <Icon name="trophy" size={16} color="#666" />
                <Text style={styles.highscoreViewText}>Highscores anzeigen</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderHighscoreModal = () => (
    <Modal
      visible={showHighscoreModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowHighscoreModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.highscoreModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {highscoreType === 'global' ? 'Globale Highscores' : `${selectedBereich?.name} Highscores`}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowHighscoreModal(false)}
            >
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.highscoreList}>
            {highscores.map((entry, index) => (
              <View key={index} style={styles.highscoreEntry}>
                <View style={styles.rankContainer}>
                  <Text style={[
                    styles.rank,
                    index < 3 && styles[`rank${index + 1}`]
                  ]}>
                    {index + 1}
                  </Text>
                  {index < 3 && (
                    <Icon
                      name={index === 0 ? 'crown' : index === 1 ? 'medal' : 'trophy-award'}
                      size={16}
                      color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}
                    />
                  )}
                </View>

                <View style={styles.playerInfo}>
                  <Text style={styles.username}>{entry.username}</Text>
                  <Text style={styles.entryDetails}>
                    Level {entry.level} • {new Date(entry.timestamp).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.scoreContainer}>
                  <Text style={styles.points}>{entry.points}</Text>
                  <Text style={styles.pointsLabel}>Punkte</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.highscoreFilters}>
            {[
              { key: 'global', label: 'Global' },
              { key: 'weekly', label: 'Woche' },
              { key: 'monthly', label: 'Monat' },
              { key: 'yearly', label: 'Jahr' }
            ].map(filter => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.highscoreFilter,
                  highscoreType === filter.key && styles.highscoreFilterActive
                ]}
                onPress={() => showGlobalHighscores(filter.key)}
              >
                <Text style={[
                  styles.highscoreFilterText,
                  highscoreType === filter.key && styles.highscoreFilterTextActive
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  // ===================================================
  // 🎨 MAIN RENDER
  // ===================================================

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {renderHeader()}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4ECDC4']}
            tintColor="#FFFFFF"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bereichGrid}>
          {filteredBereiche.map(renderBereichCard)}
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Dein Fortschritt</Text>
          <Text style={styles.summaryText}>
            {bereiche.filter(b => b.current_level >= 10).length} von {bereiche.length} Bereichen abgeschlossen
          </Text>
          <Text style={styles.summaryText}>
            Durchschnittliches Level: {bereiche.length > 0 ? 
              Math.round((bereiche.reduce((sum, b) => sum + b.current_level, 0) / bereiche.length) * 10) / 10 : 0}
          </Text>
        </View>
      </ScrollView>

      {renderBereichModal()}
      {renderHighscoreModal()}
    </LinearGradient>
  );
};

// ===================================================
// 🎨 STYLES
// ===================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  highscoreButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF30',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: '#4ECDC4',
  },
  filterChipText: {
    color: '#FFFFFF',
    marginLeft: 5,
    fontSize: 12,
  },
  filterChipTextActive: {
    fontWeight: 'bold',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    color: '#FFFFFF',
    marginRight: 10,
    fontSize: 14,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
  },
  sortOptionActive: {
    backgroundColor: '#FFFFFF30',
  },
  sortOptionText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  sortOptionTextActive: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  bereichGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bereichCard: {
    width: (width - 50) / 2,
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bereichGradient: {
    padding: 15,
    height: 180,
  },
  bereichHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bereichIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bereichLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  levelText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 12,
  },
  bereichName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    lineHeight: 20,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#FFFFFF50',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  progressText: {
    color: '#333',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
    minWidth: 35,
  },
  bereichStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  highscoreIcon: {
    padding: 4,
  },
  summarySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
    marginBottom: 30,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bereichModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    margin: 20,
    maxHeight: '80%',
    width: width - 40,
  },
  highscoreModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    margin: 20,
    maxHeight: '80%',
    width: width - 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    padding: 20,
  },
  levelDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  currentLevel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  levelName: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: (width - 100) / 2,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  singleButton: {
    backgroundColor: '#4ECDC4',
  },
  teamButton: {
    backgroundColor: '#45B7D1',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  highscoreViewButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  highscoreViewText: {
    color: '#666',
    marginLeft: 8,
  },
  highscoreList: {
    maxHeight: 300,
    paddingHorizontal: 20,
  },
  highscoreEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 50,
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginRight: 5,
  },
  rank1: {
    color: '#FFD700',
  },
  rank2: {
    color: '#C0C0C0',
  },
  rank3: {
    color: '#CD7F32',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  entryDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  pointsLabel: {
    fontSize: 10,
    color: '#666',
  },
  highscoreFilters: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  highscoreFilter: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  highscoreFilterActive: {
    backgroundColor: '#4ECDC4',
  },
  highscoreFilterText: {
    fontSize: 12,
    color: '#666',
  },
  highscoreFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default BereichScreen; 
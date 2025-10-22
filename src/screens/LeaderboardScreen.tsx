import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import ApiService from '../services/ApiService';

const { width } = Dimensions.get('window');

interface LeaderboardEntry {
  rank: number;
  uid: string;
  displayName: string;
  avatar: string;
  totalPoints: number;
  level: number;
  completedModules: number;
  badges: number;
}

interface LeaderboardScreenProps {
  navigation: any;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ navigation }) => {
  const { colors, typography, spacing } = useTheme();
  const { user } = useUser();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [selectedType, setSelectedType] = useState<'points' | 'level' | 'modules'>('points');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedType]);

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.getLeaderboard(
        selectedType === 'points' ? 'totalPoints' : 
        selectedType === 'level' ? 'level' : 'modules',
        20
      );
      
      setLeaderboardData(response.leaderboard || []);
      setUserRank(response.userRank);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      Alert.alert('Fehler', 'Rangliste konnte nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  const getAvatarEmoji = (avatar: string) => {
    if (avatar?.includes('manga')) return '🦸';
    if (avatar?.includes('realistic')) return '👤';
    if (avatar?.includes('comic')) return '🎭';
    if (avatar?.includes('business')) return '👔';
    return '👤';
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}.`;
  };

  const getTypeLabel = () => {
    switch (selectedType) {
      case 'points': return 'Punkte';
      case 'level': return 'Level';
      case 'modules': return 'Module';
      default: return 'Punkte';
    }
  };

  const getTypeValue = (entry: LeaderboardEntry) => {
    switch (selectedType) {
      case 'points': return entry.totalPoints.toLocaleString();
      case 'level': return `Level ${entry.level}`;
      case 'modules': return `${entry.completedModules} Module`;
      default: return entry.totalPoints.toLocaleString();
    }
  };

  const isCurrentUser = (entry: LeaderboardEntry) => {
    return entry.uid === user?.uid;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.primary,
      padding: spacing.lg,
      paddingTop: spacing.xl,
    },
    headerTitle: {
      ...typography.title,
      color: 'white',
      fontWeight: 'bold',
    },
    headerSubtitle: {
      ...typography.body,
      color: 'white',
      opacity: 0.9,
      marginTop: spacing.sm,
    },
    content: {
      flex: 1,
    },
    typeSelector: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      margin: spacing.lg,
      borderRadius: 12,
      padding: spacing.xs,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    typeButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      borderRadius: 8,
    },
    typeButtonActive: {
      backgroundColor: colors.primary,
    },
    typeText: {
      ...typography.body,
      color: colors.textSecondary,
    },
    typeTextActive: {
      color: 'white',
      fontWeight: '600',
    },
    userRankCard: {
      backgroundColor: colors.primary + '10',
      margin: spacing.lg,
      marginTop: 0,
      borderRadius: 12,
      padding: spacing.lg,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    userRankTitle: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '600',
      marginBottom: spacing.sm,
    },
    leaderboardList: {
      paddingHorizontal: spacing.lg,
    },
    entryCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.lg,
      marginBottom: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    currentUserCard: {
      backgroundColor: colors.primary + '10',
      borderWidth: 2,
      borderColor: colors.primary,
    },
    podiumCard: {
      backgroundColor: colors.secondary + '10',
    },
    rankContainer: {
      width: 50,
      alignItems: 'center',
      marginRight: spacing.md,
    },
    rankText: {
      ...typography.body,
      fontWeight: 'bold',
      color: colors.text,
    },
    rankEmoji: {
      fontSize: 24,
    },
    avatarContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    avatarEmoji: {
      fontSize: 24,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      ...typography.body,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    userDetails: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    scoreContainer: {
      alignItems: 'flex-end',
    },
    scoreValue: {
      ...typography.body,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    scoreLabel: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    emptyText: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.md,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: spacing.md,
    },
  });

  const renderLeaderboardEntry = (entry: LeaderboardEntry) => (
    <View
      key={entry.uid}
      style={[
        styles.entryCard,
        isCurrentUser(entry) && styles.currentUserCard,
        entry.rank <= 3 && styles.podiumCard,
      ]}>
      <View style={styles.rankContainer}>
        {entry.rank <= 3 ? (
          <Text style={styles.rankEmoji}>{getRankEmoji(entry.rank)}</Text>
        ) : (
          <Text style={styles.rankText}>{entry.rank}.</Text>
        )}
      </View>

      <View style={styles.avatarContainer}>
        <Text style={styles.avatarEmoji}>{getAvatarEmoji(entry.avatar)}</Text>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {entry.displayName || 'Anonym'}
          {isCurrentUser(entry) && ' (Du)'}
        </Text>
        <Text style={styles.userDetails}>
          Level {entry.level} • {entry.badges} Badges
        </Text>
      </View>

      <View style={styles.scoreContainer}>
        <Text style={styles.scoreValue}>{getTypeValue(entry)}</Text>
        <Text style={styles.scoreLabel}>{getTypeLabel()}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Rangliste</Text>
        <Text style={styles.headerSubtitle}>
          Vergleiche dich mit anderen Lernenden
        </Text>
      </View>

      <View style={styles.content}>
        {/* Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, selectedType === 'points' && styles.typeButtonActive]}
            onPress={() => setSelectedType('points')}
            accessibilityRole="radio"
            accessibilityLabel="Rangliste nach Punkten"
            accessibilityState={{ selected: selectedType === 'points' }}
            accessibilityHint="Zeigt die Rangliste sortiert nach Gesamtpunkten">
            <Text style={[styles.typeText, selectedType === 'points' && styles.typeTextActive]}>
              Punkte
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, selectedType === 'level' && styles.typeButtonActive]}
            onPress={() => setSelectedType('level')}
            accessibilityRole="radio"
            accessibilityLabel="Rangliste nach Level"
            accessibilityState={{ selected: selectedType === 'level' }}
            accessibilityHint="Zeigt die Rangliste sortiert nach Level">
            <Text style={[styles.typeText, selectedType === 'level' && styles.typeTextActive]}>
              Level
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, selectedType === 'modules' && styles.typeButtonActive]}
            onPress={() => setSelectedType('modules')}
            accessibilityRole="radio"
            accessibilityLabel="Rangliste nach Modulen"
            accessibilityState={{ selected: selectedType === 'modules' }}
            accessibilityHint="Zeigt die Rangliste sortiert nach abgeschlossenen Modulen">
            <Text style={[styles.typeText, selectedType === 'modules' && styles.typeTextActive]}>
              Module
            </Text>
          </TouchableOpacity>
        </View>

        {/* User Rank Card */}
        {userRank && (
          <View style={styles.userRankCard}>
            <Text style={styles.userRankTitle}>DEINE POSITION</Text>
            {renderLeaderboardEntry(userRank)}
          </View>
        )}

        {/* Leaderboard List */}
        <ScrollView
          style={styles.leaderboardList}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadLeaderboard} />
          }>
          
          {leaderboardData.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyText}>
                Noch keine Rangliste verfügbar.{'\n'}
                Sei der Erste und sammle Punkte!
              </Text>
            </View>
          ) : (
            leaderboardData.map(renderLeaderboardEntry)
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default LeaderboardScreen; 
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

interface ProgressScreenProps {
  navigation: any;
}

const ProgressScreen: React.FC<ProgressScreenProps> = ({ navigation }) => {
  const { colors, typography, spacing } = useTheme();
  const { user } = useUser();
  const [progressData, setProgressData] = useState<any>(null);
  const [statsData, setStatsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  useEffect(() => {
    loadProgressData();
  }, [selectedTimeframe]);

  const loadProgressData = async () => {
    try {
      setIsLoading(true);
      
      const [progressResponse, statsResponse] = await Promise.all([
        ApiService.getProgress(),
        ApiService.getProgressStats(selectedTimeframe),
      ]);

      setProgressData(progressResponse);
      setStatsData(statsResponse);
    } catch (error) {
      console.error('Error loading progress:', error);
      Alert.alert('Fehler', 'Fortschrittsdaten konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCertificate = async () => {
    try {
      const response = await ApiService.generateCertificate(user?.language || 'de');
      Alert.alert(
        'Zertifikat erstellt!',
        'Dein Zertifikat wurde erfolgreich generiert.',
        [
          { text: 'OK', style: 'default' }
        ]
      );
    } catch (error: any) {
      Alert.alert('Fehler', error.message || 'Zertifikat konnte nicht erstellt werden');
    }
  };

  if (!progressData) {
    return (
      <View style={[{ flex: 1, backgroundColor: colors.background }, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{...typography.body, color: colors.textSecondary}}>Lade Fortschrittsdaten...</Text>
      </View>
    );
  }

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
      padding: spacing.lg,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.lg,
      marginBottom: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardTitle: {
      ...typography.subtitle,
      marginBottom: spacing.md,
      color: colors.text,
    },
    progressContainer: {
      marginBottom: spacing.md,
    },
    progressBar: {
      height: 12,
      backgroundColor: colors.border,
      borderRadius: 6,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 6,
    },
    progressText: {
      ...typography.body,
      color: colors.text,
      textAlign: 'center',
      marginTop: spacing.sm,
      fontWeight: '600',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    statItem: {
      width: (width - spacing.lg * 3) / 2,
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: spacing.md,
      marginBottom: spacing.sm,
      alignItems: 'center',
    },
    statValue: {
      ...typography.title,
      color: colors.primary,
      fontWeight: 'bold',
      marginBottom: spacing.xs,
    },
    statLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    badgesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    badgeItem: {
      width: (width - spacing.lg * 3) / 3,
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    badgeIcon: {
      fontSize: 32,
      marginBottom: spacing.sm,
    },
    badgeName: {
      ...typography.caption,
      textAlign: 'center',
      color: colors.text,
    },
    badgeEarned: {
      opacity: 1,
    },
    badgeNotEarned: {
      opacity: 0.3,
    },
    deadlineCard: {
      backgroundColor: colors.secondary + '10',
      borderLeftWidth: 4,
      borderLeftColor: colors.secondary,
    },
    deadlineExpired: {
      backgroundColor: colors.danger + '10',
      borderLeftColor: colors.danger,
    },
    deadlineText: {
      ...typography.body,
      color: colors.text,
    },
    deadlineTime: {
      ...typography.subtitle,
      fontWeight: 'bold',
      marginTop: spacing.sm,
    },
    streakContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.success + '10',
      borderRadius: 8,
      padding: spacing.md,
    },
    streakIcon: {
      fontSize: 32,
      marginRight: spacing.md,
    },
    streakText: {
      ...typography.body,
      color: colors.success,
      flex: 1,
    },
    timeframeSelector: {
      flexDirection: 'row',
      backgroundColor: colors.border,
      borderRadius: 8,
      marginBottom: spacing.md,
    },
    timeframeButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      borderRadius: 6,
    },
    timeframeButtonActive: {
      backgroundColor: colors.primary,
    },
    timeframeText: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    timeframeTextActive: {
      color: 'white',
      fontWeight: '600',
    },
    certificateButton: {
      backgroundColor: colors.success,
      borderRadius: 12,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginVertical: spacing.md,
    },
    certificateButtonDisabled: {
      backgroundColor: colors.border,
    },
    certificateText: {
      ...typography.button,
      color: 'white',
    },
    certificateTextDisabled: {
      color: colors.textSecondary,
    },
  });

  const { progress, badges, streak, deadlineInfo, certificateEligible } = progressData;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Dein Fortschritt</Text>
        <Text style={styles.headerSubtitle}>
          Verfolge deinen Lernfortschritt und sammle Auszeichnungen
        </Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadProgressData} />
        }>
        
        {/* Hauptfortschritt */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 Gesamtfortschritt</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress?.progressPercentage || 0}%` }]} />
            </View>
            <Text style={styles.progressText}>
              Level {progress?.currentLevel || 1} • {progress?.progressPercentage?.toFixed(1) || 0}% abgeschlossen
            </Text>
          </View>
        </View>

        {/* Deadline Info */}
        {deadlineInfo?.hasDeadline && (
          <View style={[
            styles.card,
            styles.deadlineCard,
            deadlineInfo.isExpired && styles.deadlineExpired
          ]}>
            <Text style={styles.cardTitle}>⏰ Deadline</Text>
            <Text style={styles.deadlineText}>
              {deadlineInfo.isExpired 
                ? 'Deine Deadline ist abgelaufen!' 
                : 'Verbleibende Zeit:'}
            </Text>
            <Text style={[
              styles.deadlineTime,
              { color: deadlineInfo.isExpired ? colors.danger : colors.secondary }
            ]}>
              {deadlineInfo.isExpired 
                ? 'Abgelaufen' 
                : `${deadlineInfo.daysRemaining} Tage`}
            </Text>
          </View>
        )}

        {/* Lernstreak */}
        {streak?.days > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔥 Lernstreak</Text>
            <View style={styles.streakContainer}>
              <Text style={styles.streakIcon}>🔥</Text>
              <Text style={styles.streakText}>
                {streak.message}
              </Text>
            </View>
          </View>
        )}

        {/* Statistiken Zeitraum-Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📈 Detailstatistiken</Text>
          <View style={styles.timeframeSelector}>
            {['7d', '30d', '90d'].map(timeframe => (
              <TouchableOpacity
                key={timeframe}
                style={[
                  styles.timeframeButton,
                  selectedTimeframe === timeframe && styles.timeframeButtonActive
                ]}
                onPress={() => setSelectedTimeframe(timeframe)}>
                <Text style={[
                  styles.timeframeText,
                  selectedTimeframe === timeframe && styles.timeframeTextActive
                ]}>
                  {timeframe === '7d' ? '7 Tage' : timeframe === '30d' ? '30 Tage' : '90 Tage'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {statsData && (
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{statsData.summary?.totalCompletions || 0}</Text>
                <Text style={styles.statLabel}>Abschlüsse</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{statsData.summary?.avgAccuracy?.toFixed(1) || 0}%</Text>
                <Text style={styles.statLabel}>Genauigkeit</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.round((statsData.summary?.avgTimePerModule || 0) / 60000)}m</Text>
                <Text style={styles.statLabel}>⌀ Zeit</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {statsData.summary?.trend === 'improving' ? '📈' : 
                   statsData.summary?.trend === 'declining' ? '📉' : '📊'}
                </Text>
                <Text style={styles.statLabel}>Trend</Text>
              </View>
            </View>
          )}
        </View>

        {/* Badges */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏆 Auszeichnungen</Text>
          <View style={styles.badgesGrid}>
            {badges?.earned?.map((badge: any) => (
              <View key={badge.id} style={[styles.badgeItem, styles.badgeEarned]}>
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={styles.badgeName}>{badge.name}</Text>
              </View>
            ))}
            {badges?.unearned?.slice(0, 3).map((badge: any) => (
              <View key={badge.id} style={[styles.badgeItem, styles.badgeNotEarned]}>
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={styles.badgeName}>{badge.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Zertifikat */}
        <TouchableOpacity 
          style={[
            styles.certificateButton,
            !certificateEligible && styles.certificateButtonDisabled
          ]}
          onPress={handleGenerateCertificate}
          disabled={!certificateEligible}>
          <Text style={[
            styles.certificateText,
            !certificateEligible && styles.certificateTextDisabled
          ]}>
            {certificateEligible 
              ? '📜 Zertifikat generieren' 
              : `📜 Zertifikat (${progress?.completedModules?.length || 0}/10 Module)`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ProgressScreen; 
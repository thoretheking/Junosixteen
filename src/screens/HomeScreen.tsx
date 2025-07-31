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

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { colors, typography, spacing } = useTheme();
  const { user, refreshUser } = useUser();
  const [gameStats, setGameStats] = useState<any>(null);
  const [deadlineInfo, setDeadlineInfo] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [learningPattern, setLearningPattern] = useState<any>(null);
  const [mcpStats, setMcpStats] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Parallel API calls including UL and MCP data
      const [
        statsResponse, 
        deadlineResponse, 
        modulesResponse,
        learningPatternResponse,
        mcpStatsResponse
      ] = await Promise.all([
        ApiService.getGameStats(),
        ApiService.checkDeadline(),
        ApiService.getModules(user?.language || 'de'),
        ApiService.getLearningPattern().catch(() => null),
        ApiService.getMCPStats('7d').catch(() => null),
      ]);

      setGameStats(statsResponse);
      setDeadlineInfo(deadlineResponse);
      setModules(modulesResponse.modules || []);
      setLearningPattern(learningPatternResponse);
      setMcpStats(mcpStatsResponse);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    await refreshUser();
    await loadDashboardData();
  };

  const handleStartNextModule = () => {
    const nextModule = modules.find(m => m.status === 'available');
    if (nextModule) {
      navigation.navigate('Quiz', { moduleId: nextModule.moduleId });
    } else {
      Alert.alert('Info', 'Alle verfügbaren Module abgeschlossen!');
    }
  };

  const getLevelColor = (level: number) => {
    if ([5, 10].includes(level)) return colors.danger;
    if (level >= 8) return colors.secondary;
    return colors.primary;
  };

  const getDeadlineColor = () => {
    if (!deadlineInfo?.hasDeadline) return colors.textSecondary;
    if (deadlineInfo.status === 'expired') return colors.danger;
    if (deadlineInfo.status === 'urgent') return colors.secondary;
    return colors.success;
  };

  const getClusterColor = (cluster: string) => {
    switch (cluster) {
      case 'Typ_A': return '#3B82F6'; // Blau für analytisch
      case 'Typ_B': return '#10B981'; // Grün für praktisch
      case 'Typ_C': return '#F59E0B'; // Orange für visuell
      default: return colors.primary;
    }
  };

  const getClusterName = (cluster: string) => {
    switch (cluster) {
      case 'Typ_A': return 'Analytischer Lerner';
      case 'Typ_B': return 'Praktischer Lerner';
      case 'Typ_C': return 'Visueller Lerner';
      default: return cluster;
    }
  };

  const getPatternColor = (pattern: string) => {
    switch (pattern) {
      case 'improving': return colors.success;
      case 'struggling': return colors.danger;
      case 'stable': return colors.primary;
      default: return colors.textSecondary;
    }
  };

  const getPatternText = (pattern: string) => {
    switch (pattern) {
      case 'improving': return 'Du machst große Fortschritte! 🚀';
      case 'struggling': return 'Lass dich nicht entmutigen - du schaffst das! 💪';
      case 'stable': return 'Du lernst konstant weiter - super! ⭐';
      case 'insufficient_data': return 'Spiele mehr Module für bessere Analyse 📊';
      default: return pattern;
    }
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
    welcomeText: {
      ...typography.body,
      color: 'white',
      opacity: 0.9,
    },
    userName: {
      ...typography.title,
      color: 'white',
      fontWeight: 'bold',
      marginBottom: spacing.sm,
    },
    levelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 8,
      padding: spacing.sm,
      alignSelf: 'flex-start',
    },
    levelText: {
      ...typography.body,
      color: 'white',
      fontWeight: '600',
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
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
    },
    progressText: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: spacing.sm,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      ...typography.title,
      color: colors.primary,
      fontWeight: 'bold',
    },
    statLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    deadlineContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    deadlineText: {
      ...typography.body,
      flex: 1,
    },
    deadlineButton: {
      backgroundColor: colors.secondary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 6,
    },
    deadlineButtonText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    actionButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginVertical: spacing.sm,
    },
    actionButtonSecondary: {
      backgroundColor: colors.border,
    },
    actionButtonText: {
      ...typography.button,
      color: 'white',
    },
    actionButtonTextSecondary: {
      color: colors.text,
    },
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    quickActionButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: spacing.md,
      marginHorizontal: spacing.sm / 2,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    quickActionIcon: {
      fontSize: 24,
      marginBottom: spacing.sm,
    },
    quickActionText: {
      ...typography.caption,
      textAlign: 'center',
      color: colors.text,
    },
    clusterBadge: {
      padding: spacing.sm,
      borderRadius: 8,
      marginBottom: spacing.sm,
    },
    clusterBadgeText: {
      ...typography.body,
      color: 'white',
      fontWeight: 'bold',
    },
    patternInfo: {
      marginBottom: spacing.md,
    },
    patternStatus: {
      ...typography.body,
      color: colors.text,
    },
    recommendationsContainer: {
      marginTop: spacing.sm,
    },
    recommendationsTitle: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    recommendationText: {
      ...typography.body,
      color: colors.text,
    },
    mcpStatsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    mcpStatItem: {
      alignItems: 'center',
    },
    mcpStatValue: {
      ...typography.title,
      color: colors.primary,
      fontWeight: 'bold',
    },
    mcpStatLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    mcpDescription: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  const completionPercentage = user ? (user.progress.completedModules.length / user.progress.totalModules) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Willkommen zurück,</Text>
        <Text style={styles.userName}>{user?.displayName || 'Lernender'}</Text>
        <View style={styles.levelContainer}>
          <Text style={styles.levelText}>
            Level {user?.level || 1} • {user?.totalPoints || 0} Punkte
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }>
        
        {/* Fortschritt */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Dein Fortschritt</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${completionPercentage}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {user?.progress.completedModules.length || 0} von {user?.progress.totalModules || 10} Modulen abgeschlossen
            </Text>
          </View>
        </View>

        {/* Deadline Info */}
        {deadlineInfo?.hasDeadline && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⏰ Deadline</Text>
            <View style={styles.deadlineContainer}>
              <Text style={[styles.deadlineText, { color: getDeadlineColor() }]}>
                {deadlineInfo.status === 'expired' 
                  ? '⚠️ Frist abgelaufen!' 
                  : `Noch ${deadlineInfo.daysRemaining} Tage`}
              </Text>
              {deadlineInfo.canExtend && deadlineInfo.status !== 'active' && (
                <TouchableOpacity style={styles.deadlineButton}>
                  <Text style={styles.deadlineButtonText}>Verlängern</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Statistiken */}
        {gameStats && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎮 Deine Statistiken</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: getLevelColor(user?.level || 1) }]}>
                  {user?.level || 1}
                </Text>
                <Text style={styles.statLabel}>Level</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user?.currentPoints || 0}</Text>
                <Text style={styles.statLabel}>Aktuelle{'\n'}Punkte</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user?.badges?.length || 0}</Text>
                <Text style={styles.statLabel}>Badges</Text>
              </View>
            </View>
          </View>
        )}

        {/* UL-Lernmuster und Empfehlungen */}
        {learningPattern && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🧠 Dein Lerntyp: {user?.cluster || 'Analyse läuft...'}</Text>
            {user?.cluster && (
              <View style={[styles.clusterBadge, { backgroundColor: getClusterColor(user.cluster) }]}>
                <Text style={styles.clusterBadgeText}>
                  {getClusterName(user.cluster)}
                </Text>
              </View>
            )}
            
            <View style={styles.patternInfo}>
              <Text style={[styles.patternStatus, { color: getPatternColor(learningPattern.pattern) }]}>
                📈 {getPatternText(learningPattern.pattern)}
              </Text>
              
              {learningPattern.recommendations && learningPattern.recommendations.length > 0 && (
                <View style={styles.recommendationsContainer}>
                  <Text style={styles.recommendationsTitle}>💡 Empfehlungen für dich:</Text>
                  {learningPattern.recommendations.slice(0, 2).map((rec: string, index: number) => (
                    <Text key={index} style={styles.recommendationText}>
                      • {rec}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* MCP-adaptive Inhalte */}
        {mcpStats && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🤖 Adaptive KI-Unterstützung</Text>
            <View style={styles.mcpStatsGrid}>
              <View style={styles.mcpStatItem}>
                <Text style={styles.mcpStatValue}>{mcpStats.totalGenerated || 0}</Text>
                <Text style={styles.mcpStatLabel}>Generierte{'\n'}Fragen</Text>
              </View>
              <View style={styles.mcpStatItem}>
                <Text style={styles.mcpStatValue}>{mcpStats.successRate || '0'}%</Text>
                <Text style={styles.mcpStatLabel}>Erfolgs-{'\n'}rate</Text>
              </View>
            </View>
            <Text style={styles.mcpDescription}>
              Die KI passt Inhalte an deinen Lerntyp an und optimiert kontinuierlich dein Lernerlebnis.
            </Text>
          </View>
        )}

        {/* Hauptaktionen */}
        <TouchableOpacity style={styles.actionButton} onPress={handleStartNextModule}>
          <Text style={styles.actionButtonText}>
            🚀 Nächstes Modul starten
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => navigation.navigate('Progress')}>
          <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
            📈 Detaillierten Fortschritt anzeigen
          </Text>
        </TouchableOpacity>

        {/* Schnellaktionen */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Modules')}>
            <Text style={styles.quickActionIcon}>📚</Text>
            <Text style={styles.quickActionText}>Module</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Leaderboard')}>
            <Text style={styles.quickActionIcon}>🏆</Text>
            <Text style={styles.quickActionText}>Rangliste</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Progress')}>
            <Text style={styles.quickActionIcon}>🎯</Text>
            <Text style={styles.quickActionText}>Ziele</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen; 
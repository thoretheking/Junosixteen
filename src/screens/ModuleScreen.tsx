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

interface Module {
  id: string;
  moduleId: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedTime: number;
  points: number;
  isRiskLevel: boolean;
  status: string;
  isAvailable: boolean;
  isCompleted: boolean;
  videoInfo?: any;
  questionCount: number;
  theme: any;
}

interface ModuleScreenProps {
  navigation: any;
}

const ModuleScreen: React.FC<ModuleScreenProps> = ({ navigation }) => {
  const { colors, typography, spacing } = useTheme();
  const { user } = useUser();
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadModules();
  }, [user?.language]);

  const loadModules = async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.getModules(user?.language || 'de');
      setModules(response.modules || []);
    } catch (error) {
      console.error('Error loading modules:', error);
      Alert.alert('Fehler', 'Module konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModulePress = (module: Module) => {
    if (!module.isAvailable) {
      Alert.alert('Modul gesperrt', `Schließe erst Level ${module.moduleId - 1} ab, um dieses Modul freizuschalten.`);
      return;
    }

    if (module.isCompleted) {
      Alert.alert(
        'Modul abgeschlossen',
        'Du hast dieses Modul bereits abgeschlossen. Möchtest du es wiederholen?',
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Wiederholen', onPress: () => navigation.navigate('Quiz', { moduleId: module.moduleId }) }
        ]
      );
      return;
    }

    // Risiko-Level Warnung
    if (module.isRiskLevel) {
      Alert.alert(
        '⚠️ RISIKO-LEVEL!',
        `Level ${module.moduleId} ist ein Risiko-Level. Bei falschen Antworten verlierst du alle aktuellen Punkte!`,
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Risiko eingehen', style: 'destructive', onPress: () => navigation.navigate('Quiz', { moduleId: module.moduleId }) }
        ]
      );
      return;
    }

    navigation.navigate('Quiz', { moduleId: module.moduleId });
  };

  const getStatusIcon = (module: Module) => {
    if (module.isCompleted) return '✅';
    if (!module.isAvailable) return '🔒';
    if (module.isRiskLevel) return '⚠️';
    return '▶️';
  };

  const getStatusColor = (module: Module) => {
    if (module.isCompleted) return colors.success;
    if (!module.isAvailable) return colors.textSecondary;
    if (module.isRiskLevel) return colors.danger;
    return colors.primary;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return colors.success;
      case 'medium': return colors.secondary;
      case 'hard': return colors.danger;
      default: return colors.primary;
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
    moduleCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderLeftWidth: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    moduleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    statusIcon: {
      fontSize: 24,
      marginRight: spacing.md,
    },
    moduleTitle: {
      ...typography.subtitle,
      flex: 1,
      color: colors.text,
      fontWeight: 'bold',
    },
    levelBadge: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      minWidth: 40,
      alignItems: 'center',
    },
    levelBadgeRisk: {
      backgroundColor: colors.danger,
    },
    levelText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
    },
    moduleDescription: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    moduleInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    infoItem: {
      alignItems: 'center',
    },
    infoValue: {
      ...typography.caption,
      fontWeight: 'bold',
      color: colors.text,
    },
    infoLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      fontSize: 10,
    },
    difficultyBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs / 2,
      borderRadius: 4,
    },
    difficultyText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: 'white',
    },
    videoIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm,
      backgroundColor: colors.primary + '10',
      borderRadius: 6,
      padding: spacing.sm,
    },
    videoIcon: {
      fontSize: 16,
      marginRight: spacing.sm,
    },
    videoText: {
      ...typography.caption,
      color: colors.primary,
    },
    disabledCard: {
      opacity: 0.6,
    },
    completedCard: {
      backgroundColor: colors.success + '10',
    },
    progressInfo: {
      backgroundColor: colors.primary + '10',
      borderRadius: 8,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    progressText: {
      ...typography.body,
      color: colors.primary,
      textAlign: 'center',
      fontWeight: '600',
    },
  });

  const completedCount = modules.filter(m => m.isCompleted).length;
  const totalCount = modules.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 Module</Text>
        <Text style={styles.headerSubtitle}>
          Lerne in 10 Leveln mit steigender Schwierigkeit
        </Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadModules} />
        }>
        
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            🎯 {completedCount} von {totalCount} Modulen abgeschlossen
          </Text>
        </View>

        {modules.map((module) => (
          <TouchableOpacity
            key={module.id}
            style={[
              styles.moduleCard,
              {
                borderLeftColor: getStatusColor(module),
                opacity: module.isAvailable ? 1 : 0.6,
              },
              module.isCompleted && styles.completedCard,
            ]}
            onPress={() => handleModulePress(module)}
            disabled={!module.isAvailable}>
            
            <View style={styles.moduleHeader}>
              <Text style={styles.statusIcon}>{getStatusIcon(module)}</Text>
              <Text style={styles.moduleTitle}>{module.title}</Text>
              <View style={[
                styles.levelBadge,
                module.isRiskLevel && styles.levelBadgeRisk
              ]}>
                <Text style={styles.levelText}>{module.moduleId}</Text>
              </View>
            </View>

            <Text style={styles.moduleDescription}>
              {module.description}
            </Text>

            <View style={styles.moduleInfo}>
              <View style={styles.infoItem}>
                <Text style={styles.infoValue}>{module.estimatedTime}m</Text>
                <Text style={styles.infoLabel}>Zeit</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoValue}>{module.points}</Text>
                <Text style={styles.infoLabel}>Punkte</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoValue}>{module.questionCount}</Text>
                <Text style={styles.infoLabel}>Fragen</Text>
              </View>

              <View style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor(module.difficulty) }
              ]}>
                <Text style={styles.difficultyText}>
                  {module.difficulty.toUpperCase()}
                </Text>
              </View>
            </View>

            {module.videoInfo && (
              <View style={styles.videoIndicator}>
                <Text style={styles.videoIcon}>🎥</Text>
                <Text style={styles.videoText}>Video verfügbar</Text>
              </View>
            )}

            {module.isRiskLevel && (
              <View style={[styles.videoIndicator, { backgroundColor: colors.danger + '10' }]}>
                <Text style={styles.videoIcon}>⚠️</Text>
                <Text style={[styles.videoText, { color: colors.danger }]}>
                  RISIKO-LEVEL: Alles oder Nichts!
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default ModuleScreen; 
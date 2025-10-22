import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions, AccessibilityInfo } from 'react-native';
import { colors, spacing, typography, hitTarget, shadows } from '../../theme/tokens';
import { MissionMeta, World } from '../missions/types';

interface AdventureMapScreenProps {
  navigation: any;
  route: any;
}

interface MapNode {
  id: string;
  mission: MissionMeta;
  x: number; // Position auf der Karte (0-100%)
  y: number;
  unlocked: boolean;
  completed: boolean;
  connections: string[]; // IDs der verbundenen Missionen
}

export default function AdventureMapScreen({ navigation }: AdventureMapScreenProps) {
  const [selectedWorld, setSelectedWorld] = useState<World | 'all'>('all');
  const [mapNodes, setMapNodes] = useState<MapNode[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, boolean>>({});

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    loadAdventureMap();
    AccessibilityInfo.announceForAccessibility(
      'Adventure-Karte geladen. Wähle eine Mission zum Starten.'
    );
  }, []);

  const loadAdventureMap = async () => {
    // In echter App: Firebase laden
    const sampleMissions: MissionMeta[] = [
      {
        id: 'health-cleanroom-1',
        title: 'CleanRoom Expedition',
        world: 'health',
        difficulty: 'medium',
        livesStart: 3,
        description: 'Erkunde die sterile Welt des CleanRooms',
        briefing: 'Willkommen zur CleanRoom Expedition!',
        debriefSuccess: 'CleanRoom gemeistert!',
        debriefFail: 'Kontamination aufgetreten.',
        questions: [], // Würde aus JSON geladen
        unlocked: true,
        completed: false
      },
      {
        id: 'it-cyberdefense-1',
        title: 'Cyber Defense Initiative',
        world: 'it',
        difficulty: 'hard',
        livesStart: 3,
        description: 'Verteidige das Netzwerk gegen Angriffe',
        briefing: 'Cyber-Angriff erkannt! Sofortige Abwehr erforderlich!',
        debriefSuccess: 'Netzwerk gesichert!',
        debriefFail: 'System kompromittiert.',
        questions: [],
        unlocked: true,
        completed: false
      },
      {
        id: 'legal-compliance-1',
        title: 'Legal Labyrinth',
        world: 'legal',
        difficulty: 'medium',
        livesStart: 3,
        description: 'Navigiere durch das Rechtslabyrinth',
        briefing: 'Komplexer Rechtsfall! Präzision ist gefragt.',
        debriefSuccess: 'Rechtsfall erfolgreich gelöst!',
        debriefFail: 'Rechtliche Lücke entdeckt.',
        questions: [],
        unlocked: false, // Requires previous mission
        completed: false
      },
      {
        id: 'public-service-1',
        title: 'Citizen Service Challenge',
        world: 'public',
        difficulty: 'easy',
        livesStart: 3,
        description: 'Hilf Bürgern bei ihren Anliegen',
        briefing: 'Bürger brauchen deine Hilfe!',
        debriefSuccess: 'Bürger zufrieden!',
        debriefFail: 'Service-Verbesserung nötig.',
        questions: [],
        unlocked: true,
        completed: false
      },
      {
        id: 'factory-safety-1',
        title: 'Factory Safety Protocol',
        world: 'factory',
        difficulty: 'hard',
        livesStart: 3,
        description: 'Sichere die Produktionsstätte',
        briefing: 'Sicherheitsinspektion! Gefahren eliminieren.',
        debriefSuccess: 'Fabrik sicher!',
        debriefFail: 'Sicherheitsmängel entdeckt.',
        questions: [],
        unlocked: false,
        completed: false
      }
    ];

    // Generiere Karten-Layout
    const nodes: MapNode[] = sampleMissions.map((mission, index) => ({
      id: mission.id,
      mission,
      x: 20 + (index % 3) * 30, // 3 Spalten
      y: 20 + Math.floor(index / 3) * 25, // Reihen
      unlocked: mission.unlocked,
      completed: mission.completed,
      connections: index > 0 ? [sampleMissions[index - 1].id] : [] // Linear progression
    }));

    setMapNodes(nodes);
  };

  const handleMissionSelect = (mission: MissionMeta) => {
    if (!mission.unlocked) {
      AccessibilityInfo.announceForAccessibility(
        'Mission noch nicht freigeschaltet. Schließe vorherige Missionen ab.'
      );
      return;
    }

    navigation.navigate('MissionBriefing', { 
      missionId: mission.id,
      mission 
    });
  };

  const getWorldColor = (world: World) => {
    const worldColors = {
      health: colors.success,
      it: colors.brand,
      legal: colors.ink,
      public: colors.accent,
      factory: colors.warning
    };
    return worldColors[world] || colors.gray500;
  };

  const getWorldIcon = (world: World) => {
    const worldIcons = {
      health: '🏥',
      it: '💻',
      legal: '⚖️',
      public: '🏛️',
      factory: '🏭'
    };
    return worldIcons[world] || '🎯';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return colors.success;
      case 'medium': return colors.warning;
      case 'hard': return colors.error;
      default: return colors.gray500;
    }
  };

  const filteredNodes = selectedWorld === 'all' 
    ? mapNodes 
    : mapNodes.filter(node => node.mission.world === selectedWorld);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          🗺️ Adventure Map
        </Text>
        <Text style={styles.subtitle}>
          Wähle deine nächste Mission
        </Text>
      </View>

      {/* World Filter */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {['all', 'health', 'it', 'legal', 'public', 'factory'].map((world) => (
            <Pressable
              key={world}
              style={[
                styles.filterButton,
                selectedWorld === world && styles.filterButtonActive
              ]}
              onPress={() => setSelectedWorld(world as World | 'all')}
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedWorld === world }}
              accessibilityLabel={
                world === 'all' 
                  ? 'Alle Welten anzeigen' 
                  : `${getWorldIcon(world as World)} ${world} Missionen`
              }
            >
              <Text style={[
                styles.filterButtonText,
                selectedWorld === world && styles.filterButtonTextActive
              ]}>
                {world === 'all' ? '🌍 Alle' : `${getWorldIcon(world as World)} ${world}`}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Adventure Map */}
      <ScrollView style={styles.mapContainer} contentContainerStyle={styles.mapContent}>
        <View style={[styles.map, { width: screenWidth - 32, height: screenHeight * 0.8 }]}>
          {/* Connection Lines */}
          {filteredNodes.map(node => 
            node.connections.map(connectionId => {
              const connectedNode = filteredNodes.find(n => n.id === connectionId);
              if (!connectedNode) return null;

              return (
                <View
                  key={`${node.id}-${connectionId}`}
                  style={[
                    styles.connectionLine,
                    {
                      left: `${Math.min(node.x, connectedNode.x)}%`,
                      top: `${Math.min(node.y, connectedNode.y) + 3}%`,
                      width: `${Math.abs(node.x - connectedNode.x)}%`,
                      height: 2,
                      backgroundColor: node.unlocked && connectedNode.unlocked 
                        ? getWorldColor(node.mission.world)
                        : colors.gray300
                    }
                  ]}
                />
              );
            })
          )}

          {/* Mission Nodes */}
          {filteredNodes.map(node => (
            <Pressable
              key={node.id}
              style={[
                styles.missionNode,
                {
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  backgroundColor: node.unlocked 
                    ? getWorldColor(node.mission.world)
                    : colors.gray300
                },
                node.completed && styles.missionNodeCompleted,
                !node.unlocked && styles.missionNodeLocked
              ]}
              onPress={() => handleMissionSelect(node.mission)}
              disabled={!node.unlocked}
              accessibilityRole="button"
              accessibilityLabel={`Mission: ${node.mission.title}. ${
                node.completed ? 'Abgeschlossen' : 
                node.unlocked ? 'Verfügbar' : 'Gesperrt'
              }. Schwierigkeit: ${node.mission.difficulty}`}
              accessibilityHint={
                node.unlocked 
                  ? 'Doppeltipp um Mission zu starten'
                  : 'Mission noch nicht freigeschaltet'
              }
              accessibilityState={{ disabled: !node.unlocked }}
            >
              <View style={styles.missionNodeContent}>
                <Text style={styles.missionIcon}>
                  {node.completed ? '✅' : getWorldIcon(node.mission.world)}
                </Text>
                <Text style={[
                  styles.missionTitle,
                  !node.unlocked && styles.missionTitleLocked
                ]}>
                  {node.mission.title}
                </Text>
                <View style={styles.missionMeta}>
                  <View style={[
                    styles.difficultyBadge,
                    { backgroundColor: getDifficultyColor(node.mission.difficulty) }
                  ]}>
                    <Text style={styles.difficultyText}>
                      {node.mission.difficulty}
                    </Text>
                  </View>
                  <Text style={styles.livesText}>
                    ❤️ {node.mission.livesStart}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendIcon, { backgroundColor: colors.success }]} />
            <Text style={styles.legendText}>Verfügbar</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendIcon, { backgroundColor: colors.gray300 }]} />
            <Text style={styles.legendText}>Gesperrt</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>✅</Text>
            <Text style={styles.legendText}>Abgeschlossen</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg
  },
  
  header: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200
  },
  
  title: {
    fontSize: typography.h1,
    fontWeight: typography.bold,
    color: colors.ink,
    marginBottom: spacing.xs
  },
  
  subtitle: {
    fontSize: typography.body,
    color: colors.gray600
  },
  
  filterContainer: {
    paddingVertical: spacing.md,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200
  },
  
  filterContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm
  },
  
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    minHeight: hitTarget.minSize
  },
  
  filterButtonActive: {
    backgroundColor: colors.brand
  },
  
  filterButtonText: {
    fontSize: typography.body,
    fontWeight: typography.medium,
    color: colors.gray700
  },
  
  filterButtonTextActive: {
    color: colors.bg
  },
  
  mapContainer: {
    flex: 1
  },
  
  mapContent: {
    padding: spacing.md
  },
  
  map: {
    position: 'relative',
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.soft
  },
  
  connectionLine: {
    position: 'absolute',
    opacity: 0.6
  },
  
  missionNode: {
    position: 'absolute',
    width: 120,
    height: 100,
    borderRadius: 16,
    padding: spacing.sm,
    ...shadows.medium,
    transform: [{ translateX: -60 }, { translateY: -50 }] // Center on position
  },
  
  missionNodeCompleted: {
    borderWidth: 3,
    borderColor: colors.success
  },
  
  missionNodeLocked: {
    opacity: 0.5
  },
  
  missionNodeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  
  missionIcon: {
    fontSize: 24,
    marginBottom: spacing.xs
  },
  
  missionTitle: {
    fontSize: typography.caption,
    fontWeight: typography.semibold,
    color: colors.bg,
    textAlign: 'center',
    flexShrink: 1
  },
  
  missionTitleLocked: {
    color: colors.gray500
  },
  
  missionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.xs
  },
  
  difficultyBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8
  },
  
  difficultyText: {
    fontSize: typography.small,
    fontWeight: typography.medium,
    color: colors.bg
  },
  
  livesText: {
    fontSize: typography.caption,
    color: colors.bg,
    fontWeight: typography.medium
  },
  
  legend: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.gray200
  },
  
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  
  legendIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    fontSize: typography.body
  },
  
  legendText: {
    fontSize: typography.caption,
    color: colors.gray600,
    fontWeight: typography.medium
  }
}); 
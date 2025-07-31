import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import ApiService from '../services/ApiService';

const { width, height } = Dimensions.get('window');

interface AdminScreenProps {
  navigation: any;
}

const AdminScreen: React.FC<AdminScreenProps> = ({ navigation }) => {
  const { colors, typography, spacing } = useTheme();
  const { user } = useUser();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [deadlineExtensions, setDeadlineExtensions] = useState<any[]>([]);
  const [clusterOverview, setClusterOverview] = useState<any>(null);
  const [mcpStats, setMcpStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'extensions' | 'analytics'>('dashboard');
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [deadlineConfig, setDeadlineConfig] = useState({
    deadlineMode: 'relative',
    daysAfterStart: 7,
    startDate: '',
    endDate: '',
    onMissedDeadline: 'warning',
    allowExtension: true,
    applyToExisting: false,
  });

  useEffect(() => {
    if (user?.isAdmin) {
      loadAdminData();
    }
  }, [user, activeTab]);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);

      switch (activeTab) {
        case 'dashboard':
          const dashboardResponse = await ApiService.getAdminDashboard();
          setDashboardData(dashboardResponse);
          break;
        case 'users':
          const usersResponse = await ApiService.getUsers();
          setUsers(usersResponse.users || []);
          break;
        case 'extensions':
          const extensionsResponse = await ApiService.getDeadlineExtensions();
          setDeadlineExtensions(extensionsResponse.extensions || []);
          break;
        case 'analytics':
          const [clusterResponse, mcpResponse] = await Promise.all([
            ApiService.getClusterOverview().catch(() => null),
            ApiService.getMCPStats('30d').catch(() => null),
          ]);
          setClusterOverview(clusterResponse);
          setMcpStats(mcpResponse);
          break;
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      Alert.alert('Fehler', 'Admin-Daten konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetGlobalDeadline = async () => {
    try {
      await ApiService.setDeadlineConfig(deadlineConfig);
      Alert.alert('Erfolg', 'Deadline-Konfiguration wurde gesetzt');
      setShowDeadlineModal(false);
    } catch (error: any) {
      Alert.alert('Fehler', error.message || 'Deadline-Konfiguration fehlgeschlagen');
    }
  };

  const handleProcessExtension = async (extensionId: string, action: 'approve' | 'reject') => {
    try {
      await ApiService.processExtension(extensionId, action);
      Alert.alert('Erfolg', `Verlängerungsanfrage ${action === 'approve' ? 'genehmigt' : 'abgelehnt'}`);
      loadAdminData();
    } catch (error: any) {
      Alert.alert('Fehler', error.message || 'Fehler beim Bearbeiten der Anfrage');
    }
  };

  if (!user?.isAdmin) {
    return (
      <View style={[{ flex: 1, backgroundColor: colors.background }, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{...typography.title, color: colors.danger}}>⚠️ Zugriff verweigert</Text>
        <Text style={{...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md}}>
          Du benötigst Admin-Berechtigung um diese Seite zu sehen.
        </Text>
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
    tabSelector: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tabButton: {
      flex: 1,
      paddingVertical: spacing.md,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabButtonActive: {
      borderBottomColor: colors.primary,
    },
    tabText: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.primary,
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
    },
    statLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    userItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    userAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      ...typography.body,
      fontWeight: 'bold',
      color: colors.text,
    },
    userDetails: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    actionButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    actionButtonText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    extensionItem: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    extensionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    extensionUser: {
      ...typography.body,
      fontWeight: 'bold',
      color: colors.text,
    },
    extensionStatus: {
      ...typography.caption,
      color: colors.secondary,
      fontWeight: '600',
    },
    extensionReason: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    extensionActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    approveButton: {
      backgroundColor: colors.success,
      borderRadius: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      flex: 1,
      alignItems: 'center',
    },
    rejectButton: {
      backgroundColor: colors.danger,
      borderRadius: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      flex: 1,
      alignItems: 'center',
    },
    modal: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.xl,
      width: width * 0.9,
      maxHeight: height * 0.8,
    },
    modalTitle: {
      ...typography.title,
      marginBottom: spacing.lg,
      color: colors.text,
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
      color: colors.text,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    modalButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: 8,
      alignItems: 'center',
    },
    primaryButton: {
      backgroundColor: colors.primary,
    },
    secondaryButton: {
      backgroundColor: colors.border,
    },
    clusterPerformance: {
      marginTop: spacing.md,
    },
    performanceTitle: {
      ...typography.subtitle,
      marginBottom: spacing.sm,
    },
    performanceItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    performanceLabel: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    performanceValue: {
      ...typography.title,
      fontWeight: 'bold',
    },
    breakdownSection: {
      marginTop: spacing.md,
    },
    breakdownTitle: {
      ...typography.subtitle,
      marginBottom: spacing.sm,
    },
    breakdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    breakdownLabel: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    breakdownValue: {
      ...typography.title,
      fontWeight: 'bold',
    },
  });

  const renderDashboard = () => (
    <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadAdminData} />}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Systemstatistiken</Text>
        {dashboardData?.stats && (
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dashboardData.stats.users.total}</Text>
              <Text style={styles.statLabel}>Benutzer</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dashboardData.stats.users.active}</Text>
              <Text style={styles.statLabel}>Aktiv</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dashboardData.stats.content.modules}</Text>
              <Text style={styles.statLabel}>Module</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dashboardData.stats.content.questions}</Text>
              <Text style={styles.statLabel}>Fragen</Text>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.card} onPress={() => setShowDeadlineModal(true)}>
        <Text style={styles.cardTitle}>⏰ Deadline-Konfiguration</Text>
        <Text style={{...typography.body, color: colors.textSecondary}}>
          Globale Deadline-Einstellungen für alle Benutzer konfigurieren
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderUsers = () => (
    <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadAdminData} />}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>👥 Benutzerverwaltung</Text>
        {users.map((user) => (
          <View key={user.uid} style={styles.userItem}>
            <View style={styles.userAvatar}>
              <Text style={{fontSize: 20}}>👤</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.displayName || user.email}</Text>
              <Text style={styles.userDetails}>
                Level {user.level} • {user.totalPoints} Punkte • {user.deadlineStatus}
              </Text>
            </View>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Bearbeiten</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderExtensions = () => (
    <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadAdminData} />}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔄 Verlängerungsanfragen</Text>
        {deadlineExtensions.length === 0 ? (
          <Text style={{...typography.body, color: colors.textSecondary, textAlign: 'center', padding: spacing.xl}}>
            Keine ausstehenden Verlängerungsanfragen
          </Text>
        ) : (
          deadlineExtensions.map((extension) => (
            <View key={extension.id} style={styles.extensionItem}>
              <View style={styles.extensionHeader}>
                <Text style={styles.extensionUser}>{extension.userName}</Text>
                <Text style={styles.extensionStatus}>{extension.requestedDays} Tage</Text>
              </View>
              <Text style={styles.extensionReason}>{extension.reason}</Text>
              <View style={styles.extensionActions}>
                <TouchableOpacity 
                  style={styles.approveButton}
                  onPress={() => handleProcessExtension(extension.id, 'approve')}>
                  <Text style={{color: 'white', fontWeight: '600'}}>Genehmigen</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.rejectButton}
                  onPress={() => handleProcessExtension(extension.id, 'reject')}>
                  <Text style={{color: 'white', fontWeight: '600'}}>Ablehnen</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderAnalytics = () => (
    <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadAdminData} />}>
      {/* UL-Cluster-Übersicht */}
      {clusterOverview && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧠 Lerntyp-Verteilung (UL)</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#3B82F6' }]}>
                {clusterOverview.clusterDistribution?.['Typ_A'] || 0}
              </Text>
              <Text style={styles.statLabel}>Analytisch{'\n'}(Typ A)</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#10B981' }]}>
                {clusterOverview.clusterDistribution?.['Typ_B'] || 0}
              </Text>
              <Text style={styles.statLabel}>Praktisch{'\n'}(Typ B)</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                {clusterOverview.clusterDistribution?.['Typ_C'] || 0}
              </Text>
              <Text style={styles.statLabel}>Visuell{'\n'}(Typ C)</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {clusterOverview.totalUsers || 0}
              </Text>
              <Text style={styles.statLabel}>Gesamt{'\n'}Benutzer</Text>
            </View>
          </View>
          
          <View style={styles.clusterPerformance}>
            <Text style={styles.performanceTitle}>📈 Durchschnittsleistung pro Lerntyp:</Text>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Typ A (Analytisch):</Text>
              <Text style={styles.performanceValue}>
                {Math.round(clusterOverview.clusterAverages?.['Typ_A'] || 0)} Pkt
              </Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Typ B (Praktisch):</Text>
              <Text style={styles.performanceValue}>
                {Math.round(clusterOverview.clusterAverages?.['Typ_B'] || 0)} Pkt
              </Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Typ C (Visuell):</Text>
              <Text style={styles.performanceValue}>
                {Math.round(clusterOverview.clusterAverages?.['Typ_C'] || 0)} Pkt
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* MCP-Statistiken */}
      {mcpStats && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🤖 KI-Fragengenerierung (MCP)</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mcpStats.totalGenerated || 0}</Text>
              <Text style={styles.statLabel}>Generierte{'\n'}Fragen</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mcpStats.successfulGenerated || 0}</Text>
              <Text style={styles.statLabel}>Erfolgreich{'\n'}generiert</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: mcpStats.successRate >= 80 ? colors.success : colors.danger }]}>
                {mcpStats.successRate || 0}%
              </Text>
              <Text style={styles.statLabel}>Erfolgs-{'\n'}rate</Text>
            </View>
          </View>

          {mcpStats.breakdown && (
            <View style={styles.breakdownSection}>
              <Text style={styles.breakdownTitle}>🌍 Sprach-Verteilung:</Text>
              {Object.entries(mcpStats.breakdown.byLanguage || {}).map(([lang, count]: [string, any]) => (
                <View key={lang} style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>{lang.toUpperCase()}:</Text>
                  <Text style={styles.breakdownValue}>{count} Fragen</Text>
                </View>
              ))}
              
              <Text style={styles.breakdownTitle}>🧠 Cluster-Verteilung:</Text>
              {Object.entries(mcpStats.breakdown.byCluster || {}).map(([cluster, count]: [string, any]) => (
                <View key={cluster} style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>{cluster}:</Text>
                  <Text style={styles.breakdownValue}>{count} Fragen</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Batch-Generierung für Admins */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚡ Schnellaktionen</Text>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleBatchGeneration()}>
          <Text style={styles.actionButtonText}>🔄 Batch-Fragengenerierung starten</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.secondary, marginTop: spacing.sm }]}
          onPress={() => handleClusterAnalysis()}>
          <Text style={styles.actionButtonText}>📊 Cluster-Analyse aktualisieren</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const handleBatchGeneration = async () => {
    try {
      Alert.alert(
        'Batch-Generierung',
        'Möchten Sie für alle Module adaptive Fragen generieren?',
        [
          { text: 'Abbrechen', style: 'cancel' },
          { 
            text: 'Ja, starten', 
            onPress: async () => {
              try {
                setIsLoading(true);
                // Generiere für Module 1-10
                for (let moduleId = 1; moduleId <= 10; moduleId++) {
                  await ApiService.generateBatchQuestions({
                    moduleId,
                    count: 3,
                    language: 'de',
                    cluster: 'Typ_A'
                  });
                }
                Alert.alert('Erfolg', 'Batch-Generierung abgeschlossen!');
                loadAdminData();
              } catch (error: any) {
                Alert.alert('Fehler', error.message || 'Batch-Generierung fehlgeschlagen');
              } finally {
                setIsLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Batch generation error:', error);
    }
  };

  const handleClusterAnalysis = async () => {
    Alert.alert('Info', 'Cluster-Analyse wird bei der nächsten Benutzer-Interaktion automatisch aktualisiert.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ Admin Panel</Text>
        <Text style={styles.headerSubtitle}>
          System-Verwaltung und Konfiguration
        </Text>
      </View>

      <View style={styles.tabSelector}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'dashboard' && styles.tabButtonActive]}
          onPress={() => setActiveTab('dashboard')}>
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.tabTextActive]}>
            Dashboard
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'users' && styles.tabButtonActive]}
          onPress={() => setActiveTab('users')}>
          <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>
            Benutzer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'extensions' && styles.tabButtonActive]}
          onPress={() => setActiveTab('extensions')}>
          <Text style={[styles.tabText, activeTab === 'extensions' && styles.tabTextActive]}>
            Anfragen
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'analytics' && styles.tabButtonActive]}
          onPress={() => setActiveTab('analytics')}>
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.tabTextActive]}>
            Analytics
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'extensions' && renderExtensions()}
        {activeTab === 'analytics' && renderAnalytics()}
      </View>

      {/* Deadline Config Modal */}
      <Modal visible={showDeadlineModal} transparent animationType="fade">
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Deadline-Konfiguration</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Tage nach Start"
              value={deadlineConfig.daysAfterStart.toString()}
              onChangeText={(text) => setDeadlineConfig({...deadlineConfig, daysAfterStart: parseInt(text) || 7})}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={() => setShowDeadlineModal(false)}>
                <Text style={{color: colors.text}}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton]}
                onPress={handleSetGlobalDeadline}>
                <Text style={{color: 'white'}}>Speichern</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AdminScreen; 
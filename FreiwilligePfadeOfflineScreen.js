import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import offlineManager, { useOfflineStatus, useOfflineData } from './OfflineManager';

const { width } = Dimensions.get('window');

const FreiwilligePfadeOfflineScreen = ({ navigation }) => {
  const [selectedPfad, setSelectedPfad] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [journalTitle, setJournalTitle] = useState('');

  // Offline-spezifische Hooks
  const { isOnline, syncStatus } = useOfflineStatus();
  const { data: freiwilligePfade, loading: pfadeLoading } = useOfflineData('freiwillige-pfade');
  const { data: tagesimpuls, loading: impulsLoading } = useOfflineData('tagesimpuls');
  const { data: offlineJournal, loading: journalLoading } = useOfflineData('journal');

  useEffect(() => {
    // Initial cache update wenn online
    if (isOnline) {
      offlineManager.cacheFreiwilligePfadeData();
    }
  }, [isOnline]);

  const startPfad = async (pfadId) => {
    try {
      let success = false;
      let message = '';

      if (isOnline) {
        // Online: Normale API-Anfrage
        const response = await fetch(`/api/freiwillige-pfade/${pfadId}/start`, {
          method: 'POST',
          headers: { 
            Authorization: 'Bearer demo-token',
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        success = data.success;
        message = data.message + '\n\n' + data.naechste_schritte.beschreibung;
      } else {
        // Offline: Lokale Speicherung
        success = await offlineManager.startPfadOffline(pfadId);
        message = 'Pfad offline gestartet! 📱\n\nDeine Fortschritte werden lokal gespeichert und synchronisiert, sobald du wieder online bist.\n\nKein Zeitdruck - du bestimmst das Tempo!';
      }
      
      if (success) {
        Alert.alert(
          isOnline ? '🌱 Pfad gestartet' : '📱 Offline-Pfad gestartet',
          message,
          [{ text: 'Verstanden', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Error starting pfad:', error);
      Alert.alert(
        '❌ Fehler',
        'Pfad konnte nicht gestartet werden. Versuche es später erneut.'
      );
    }
  };

  const saveOfflineProgress = async (pfadId, progressData) => {
    try {
      const success = await offlineManager.saveOfflineProgress(pfadId, progressData);
      
      if (success) {
        Alert.alert(
          '💾 Fortschritt gespeichert',
          isOnline ? 
            'Dein Fortschritt wurde gespeichert.' : 
            'Fortschritt offline gespeichert. Wird synchronisiert, sobald du online bist.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const addJournalEntry = async () => {
    if (!journalText.trim()) return;

    try {
      const entry = {
        titel: journalTitle.trim() || 'Freiwillige Reflexion',
        inhalt: journalText.trim(),
        kategorie: 'freiwillig',
        offline: !isOnline
      };

      let result = null;

      if (isOnline) {
        // Online: API-Anfrage
        const response = await fetch('/api/lernjournal', {
          method: 'POST',
          headers: { 
            Authorization: 'Bearer demo-token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(entry)
        });
        
        const data = await response.json();
        if (data.success) result = data.eintrag;
      } else {
        // Offline: Lokale Speicherung
        result = await offlineManager.saveOfflineJournalEntry(entry);
      }

      if (result) {
        setJournalText('');
        setJournalTitle('');
        setShowJournalModal(false);
        
        Alert.alert(
          '📝 Eintrag gespeichert',
          isOnline ? 
            'Dein Journal-Eintrag wurde gespeichert - nur für dich sichtbar.' :
            'Eintrag offline gespeichert. Wird synchronisiert, sobald du online bist.\n\nDeine Reflexionen bleiben privat und werden nicht bewertet.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error adding journal entry:', error);
      Alert.alert('❌ Fehler', 'Eintrag konnte nicht gespeichert werden.');
    }
  };

  const showOfflineInfo = () => {
    setShowOfflineModal(true);
  };

  const clearOfflineData = async () => {
    Alert.alert(
      '🗑️ Offline-Daten löschen',
      'Möchtest du alle offline gespeicherten Daten löschen? Dies betrifft nur lokale Kopien - deine online gespeicherten Daten bleiben erhalten.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Löschen', 
          style: 'destructive',
          onPress: async () => {
            const success = await offlineManager.clearOfflineData();
            if (success) {
              Alert.alert('✅ Gelöscht', 'Offline-Daten wurden gelöscht.');
            }
          }
        }
      ]
    );
  };

  const renderOfflineIndicator = () => (
    <TouchableOpacity 
      style={[styles.offlineIndicator, isOnline ? styles.onlineIndicator : styles.offlineIndicatorRed]}
      onPress={showOfflineInfo}
    >
      <Text style={styles.offlineText}>
        {isOnline ? '🟢 Online' : '🔴 Offline'}
      </Text>
      {syncStatus?.pendingSync > 0 && (
        <Text style={styles.syncText}>({syncStatus.pendingSync} ausstehend)</Text>
      )}
    </TouchableOpacity>
  );

  const renderPfadCard = (pfad) => (
    <TouchableOpacity
      key={pfad.id}
      style={[styles.pfadCard, pfad.gestartet && styles.pfadCardActive]}
      onPress={() => {
        setSelectedPfad(pfad);
        setShowDetailModal(true);
      }}
    >
      <View style={styles.pfadHeader}>
        <Text style={styles.pfadIcon}>{pfad.motivation?.icon || '🌱'}</Text>
        <View style={styles.pfadInfo}>
          <Text style={styles.pfadTitle}>{pfad.titel}</Text>
          <Text style={styles.pfadKategorie}>{pfad.kategorie}</Text>
        </View>
        {pfad.gestartet && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Aktiv</Text>
          </View>
        )}
        {!isOnline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineBadgeText}>📱</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.pfadBeschreibung}>{pfad.beschreibung}</Text>
      
      <View style={styles.eigenschaften}>
        <Text style={styles.eigenschaftLabel}>🕐 Kein Zeitdruck</Text>
        <Text style={styles.eigenschaftLabel}>⏸️ Pausierbar</Text>
        <Text style={styles.eigenschaftLabel}>🔄 Wiederholbar</Text>
        {!isOnline && <Text style={styles.eigenschaftLabel}>📱 Offline verfügbar</Text>}
      </View>
      
      {pfad.gestartet && (
        <View style={styles.fortschrittContainer}>
          <Text style={styles.fortschrittText}>
            Fortschritt: {pfad.fortschritt || 0}% • Module: {pfad.abgeschlossene_module?.length || 0}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderOfflineModal = () => (
    <Modal
      visible={showOfflineModal}
      animationType="slide"
      presentationStyle="formSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📱 Offline-Status</Text>
            <TouchableOpacity onPress={() => setShowOfflineModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.statusSection}>
            <Text style={styles.statusTitle}>Verbindung:</Text>
            <Text style={[styles.statusValue, isOnline ? styles.onlineStatus : styles.offlineStatus]}>
              {isOnline ? '🟢 Online' : '🔴 Offline'}
            </Text>
          </View>

          {syncStatus && (
            <>
              <View style={styles.statusSection}>
                <Text style={styles.statusTitle}>Letzter Sync:</Text>
                <Text style={styles.statusValue}>
                  {syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : 'Nie'}
                </Text>
              </View>

              <View style={styles.statusSection}>
                <Text style={styles.statusTitle}>Ausstehende Synchronisation:</Text>
                <Text style={styles.statusValue}>{syncStatus.pendingSync} Einträge</Text>
              </View>

              <View style={styles.statusSection}>
                <Text style={styles.statusTitle}>Offline-Daten verfügbar:</Text>
                <Text style={styles.statusValue}>
                  {syncStatus.cachedData ? '✅ Ja' : '❌ Nein'}
                </Text>
              </View>
            </>
          )}

          <View style={styles.offlineInfo}>
            <Text style={styles.infoTitle}>📱 Offline-Funktionen:</Text>
            <Text style={styles.infoItem}>✓ Lernpfade starten und nutzen</Text>
            <Text style={styles.infoItem}>✓ Fortschritt lokal speichern</Text>
            <Text style={styles.infoItem}>✓ Journal-Einträge erstellen</Text>
            <Text style={styles.infoItem}>✓ Tägliche Lernimpulse generieren</Text>
            <Text style={styles.infoItem}>✓ Automatische Synchronisation</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.syncButton}
              onPress={async () => {
                if (isOnline) {
                  await offlineManager.syncOfflineData();
                  Alert.alert('🔄 Synchronisation', 'Daten wurden synchronisiert.');
                } else {
                  Alert.alert('❌ Offline', 'Synchronisation nur online möglich.');
                }
              }}
            >
              <Text style={styles.syncButtonText}>🔄 Jetzt synchronisieren</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearOfflineData}
            >
              <Text style={styles.clearButtonText}>🗑️ Offline-Daten löschen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (pfadeLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#27ae60" />
        <Text style={styles.loadingText}>
          {isOnline ? '🌱 Freiwillige Pfade werden geladen...' : '📱 Offline-Daten werden geladen...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderOfflineIndicator()}
      
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🌱 Freiwillige Lernpfade</Text>
          <Text style={styles.headerSubtitle}>
            Lernen ohne Zwang • {isOnline ? 'Online & Offline' : 'Offline-Modus'}
          </Text>
        </View>

        <View style={styles.philosophySection}>
          <Text style={styles.philosophyTitle}>💭 Lernphilosophie</Text>
          <Text style={styles.philosophyText}>
            Hier bestimmst du das Tempo. Keine Deadlines, keine Bewertungen, kein Druck. 
            {!isOnline && ' Auch offline kannst du lernen und deine Fortschritte werden später synchronisiert.'}
          </Text>
          
          <View style={styles.prinzipien}>
            <Text style={styles.prinzipItem}>✓ Keine Deadlines oder Zeitdruck</Text>
            <Text style={styles.prinzipItem}>✓ Freie Reihenfolge und Pausierung</Text>
            <Text style={styles.prinzipItem}>✓ Wiederholung jederzeit erlaubt</Text>
            <Text style={styles.prinzipItem}>✓ Reflexion ohne Bewertung</Text>
            {!isOnline && <Text style={styles.prinzipItem}>✓ Offline-Lernen möglich</Text>}
          </View>
        </View>

        {tagesimpuls && !impulsLoading && (
          <View style={styles.tagesimpulsSection}>
            <Text style={styles.sectionTitle}>
              ☀️ Dein heutiger Lernimpuls {tagesimpuls.offline && '(Offline generiert)'}
            </Text>
            <TouchableOpacity style={styles.tagesimpulsCard}>
              <Text style={styles.tagesimpulsTitle}>
                {tagesimpuls.content?.titel || tagesimpuls.titel || 'Tägliche Reflexion'}
              </Text>
              <Text style={styles.tagesimpulsText}>
                {tagesimpuls.content?.reflexion || tagesimpuls.content?.untertitel || tagesimpuls.beschreibung || 'Klicke für Details'}
              </Text>
              <Text style={styles.tagesimpulsHinweis}>
                Ganz freiwillig • Keine Deadline {tagesimpuls.offline && '• Offline verfügbar'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => setShowJournalModal(true)}
          >
            <Text style={styles.quickActionIcon}>📝</Text>
            <Text style={styles.quickActionText}>
              Lernjournal {!isOnline && '(Offline)'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={async () => {
              const neuerImpuls = await offlineManager.getTagesimpulsOffline();
              if (neuerImpuls) {
                Alert.alert(
                  '🎲 Neuer Impuls',
                  `${neuerImpuls.titel || 'Lernimpuls'}\n\n${neuerImpuls.content?.reflexion || neuerImpuls.beschreibung || 'Ein neuer Denkanstoß für dich!'}`,
                  [{ text: 'Verstanden' }]
                );
              }
            }}
          >
            <Text style={styles.quickActionIcon}>🎲</Text>
            <Text style={styles.quickActionText}>Zufälliger Impuls</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pfadeSection}>
          <Text style={styles.sectionTitle}>
            🌱 Verfügbare Pfade ({freiwilligePfade.length}) {!isOnline && '• Offline-Modus'}
          </Text>
          
          {freiwilligePfade.map(renderPfadCard)}

          {!isOnline && freiwilligePfade.length === 0 && (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>📱 Keine Offline-Daten verfügbar</Text>
              <Text style={styles.noDataSubtext}>
                Verbinde dich mit dem Internet, um Lernpfade herunterzuladen.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Detail Modal für Pfade */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="formSheet"
      >
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedPfad?.motivation?.icon || '🌱'} {selectedPfad?.titel}
              </Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.motivationSection}>
              <Text style={styles.motivationTitle}>{selectedPfad?.motivation?.titel}</Text>
              <Text style={styles.motivationBeschreibung}>{selectedPfad?.motivation?.beschreibung}</Text>
              
              {!isOnline && (
                <View style={styles.offlineNotice}>
                  <Text style={styles.offlineNoticeText}>
                    📱 Offline-Modus: Deine Fortschritte werden lokal gespeichert und später synchronisiert.
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.actionButtons}>
              {!selectedPfad?.gestartet ? (
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => {
                    startPfad(selectedPfad.id);
                    setShowDetailModal(false);
                  }}
                >
                  <Text style={styles.startButtonText}>
                    🌱 Pfad beginnen {!isOnline && '(Offline)'}
                  </Text>
                  <Text style={styles.startButtonSubtext}>
                    (Kein Zwang, kein Zeitdruck)
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() => {
                    setShowDetailModal(false);
                    // Navigation zur Pfad-Ausführung
                    saveOfflineProgress(selectedPfad.id, { 
                      besuch: new Date().toISOString(),
                      aktion: 'fortgesetzt'
                    });
                  }}
                >
                  <Text style={styles.continueButtonText}>
                    ▶️ Fortsetzen {!isOnline && '(Offline)'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Journal Modal */}
      <Modal
        visible={showJournalModal}
        animationType="slide"
        presentationStyle="formSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                📝 Lernjournal-Eintrag {!isOnline && '(Offline)'}
              </Text>
              <TouchableOpacity onPress={() => setShowJournalModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.journalHinweis}>
              Dieser Eintrag ist nur für dich sichtbar und wird nicht bewertet.
              {!isOnline && ' Wird synchronisiert, sobald du online bist.'}
            </Text>
            
            <TextInput
              style={styles.titleInput}
              placeholder="Titel (optional)"
              value={journalTitle}
              onChangeText={setJournalTitle}
              maxLength={100}
            />
            
            <TextInput
              style={styles.journalInput}
              multiline
              placeholder="Was hast du heute gelernt? Welche Gedanken beschäftigen dich?"
              value={journalText}
              onChangeText={setJournalText}
              maxLength={1000}
            />
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.startButton, !journalText.trim() && styles.disabledButton]}
                onPress={addJournalEntry}
                disabled={!journalText.trim()}
              >
                <Text style={styles.startButtonText}>
                  💾 Speichern {!isOnline && '(Offline)'}
                </Text>
                <Text style={styles.startButtonSubtext}>
                  (Privat & ohne Bewertung)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {renderOfflineModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#dc3545',
    borderBottomWidth: 1,
    borderBottomColor: '#c82333'
  },
  onlineIndicator: {
    backgroundColor: '#28a745'
  },
  offlineIndicatorRed: {
    backgroundColor: '#dc3545'
  },
  offlineText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  syncText: {
    color: '#ffffff',
    fontSize: 10,
    marginLeft: 5,
    opacity: 0.8
  },
  scrollContainer: {
    flex: 1
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic'
  },
  philosophySection: {
    margin: 15,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60'
  },
  philosophyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10
  },
  philosophyText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15
  },
  prinzipien: {
    gap: 5
  },
  prinzipItem: {
    fontSize: 13,
    color: '#27ae60',
    fontWeight: '500'
  },
  tagesimpulsSection: {
    margin: 15,
    marginTop: 0
  },
  tagesimpulsCard: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107'
  },
  tagesimpulsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 5
  },
  tagesimpulsText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 8
  },
  tagesimpulsHinweis: {
    fontSize: 12,
    color: '#856404',
    fontStyle: 'italic'
  },
  quickActions: {
    flexDirection: 'row',
    margin: 15,
    marginTop: 0,
    gap: 10
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 5
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center'
  },
  pfadeSection: {
    margin: 15,
    marginTop: 0
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15
  },
  pfadCard: {
    backgroundColor: '#ffffff',
    marginBottom: 15,
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  pfadCardActive: {
    borderColor: '#27ae60',
    borderWidth: 2
  },
  pfadHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  pfadIcon: {
    fontSize: 24,
    marginRight: 10
  },
  pfadInfo: {
    flex: 1
  },
  pfadTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2
  },
  pfadKategorie: {
    fontSize: 12,
    color: '#666'
  },
  statusBadge: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 5
  },
  statusText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold'
  },
  offlineBadge: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 5
  },
  offlineBadgeText: {
    fontSize: 10,
    color: '#ffffff'
  },
  pfadBeschreibung: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 18
  },
  eigenschaften: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10
  },
  eigenschaftLabel: {
    fontSize: 11,
    color: '#27ae60',
    backgroundColor: '#d4edda',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8
  },
  fortschrittContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 5
  },
  fortschrittText: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '500'
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  noDataText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: 'bold',
    marginBottom: 5
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  modalContent: {
    flex: 1,
    padding: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1
  },
  closeButton: {
    fontSize: 20,
    color: '#6c757d',
    padding: 5
  },
  motivationSection: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20
  },
  motivationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8
  },
  motivationBeschreibung: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18
  },
  offlineNotice: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#d1ecf1',
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#bee5eb'
  },
  offlineNoticeText: {
    fontSize: 12,
    color: '#0c5460',
    fontStyle: 'italic'
  },
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef'
  },
  statusTitle: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500'
  },
  statusValue: {
    fontSize: 14,
    color: '#2c3e50'
  },
  onlineStatus: {
    color: '#28a745'
  },
  offlineStatus: {
    color: '#dc3545'
  },
  offlineInfo: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 20
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10
  },
  infoItem: {
    fontSize: 13,
    color: '#495057',
    marginBottom: 5
  },
  actionButtons: {
    marginTop: 20,
    gap: 10
  },
  startButton: {
    backgroundColor: '#27ae60',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  startButtonSubtext: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
    marginTop: 2
  },
  continueButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  syncButton: {
    backgroundColor: '#17a2b8',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  clearButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  journalHinweis: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 15,
    textAlign: 'center'
  },
  titleInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 10,
    padding: 15,
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 10
  },
  journalInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 10,
    padding: 15,
    fontSize: 14,
    color: '#2c3e50',
    minHeight: 120,
    textAlignVertical: 'top'
  },
  disabledButton: {
    backgroundColor: '#6c757d',
    opacity: 0.6
  }
});

export default FreiwilligePfadeOfflineScreen; 
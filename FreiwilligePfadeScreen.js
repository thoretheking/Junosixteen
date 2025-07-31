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
  Dimensions
} from 'react-native';

const { width } = Dimensions.get('window');

const FreiwilligePfadeScreen = ({ navigation }) => {
  const [freiwilligePfade, setFreiwilligePfade] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPfad, setSelectedPfad] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [tagesimpuls, setTagesimpuls] = useState(null);

  useEffect(() => {
    loadFreiwilligePfade();
    loadTagesimpuls();
  }, []);

  const loadFreiwilligePfade = async () => {
    try {
      const response = await fetch('/api/freiwillige-pfade', {
        headers: { Authorization: 'Bearer demo-token' }
      });
      const data = await response.json();
      
      if (data.success) {
        setFreiwilligePfade(data.freiwillige_pfade);
      }
    } catch (error) {
      console.error('Error loading freiwillige pfade:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTagesimpuls = async () => {
    try {
      const response = await fetch('/api/tagesimpuls', {
        headers: { Authorization: 'Bearer demo-token' }
      });
      const data = await response.json();
      
      if (data.success) {
        setTagesimpuls(data.impuls);
      }
    } catch (error) {
      console.error('Error loading tagesimpuls:', error);
    }
  };

  const startPfad = async (pfadId) => {
    try {
      const response = await fetch(`/api/freiwillige-pfade/${pfadId}/start`, {
        method: 'POST',
        headers: { 
          Authorization: 'Bearer demo-token',
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert(
          '🌱 Pfad gestartet',
          data.message + '\n\n' + data.naechste_schritte.beschreibung,
          [{ text: 'Verstanden', style: 'default' }]
        );
        loadFreiwilligePfade(); // Refresh
      }
    } catch (error) {
      console.error('Error starting pfad:', error);
    }
  };

  const pausePfad = async (pfadId) => {
    try {
      const response = await fetch(`/api/freiwillige-pfade/${pfadId}/pause`, {
        method: 'POST',
        headers: { 
          Authorization: 'Bearer demo-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ grund: 'Persönliche Entscheidung' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert(
          '⏸️ Pfad pausiert',
          data.message + '\n\n' + data.motivation.beschreibung
        );
        loadFreiwilligePfade(); // Refresh
      }
    } catch (error) {
      console.error('Error pausing pfad:', error);
    }
  };

  const addJournalEntry = async () => {
    if (!journalText.trim()) return;

    try {
      const response = await fetch('/api/lernjournal', {
        method: 'POST',
        headers: { 
          Authorization: 'Bearer demo-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          titel: 'Freiwillige Reflexion',
          inhalt: journalText,
          kategorie: 'freiwillig'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setJournalText('');
        setShowJournalModal(false);
        Alert.alert(
          '📝 Eintrag gespeichert',
          data.message + '\n\n' + data.motivation.beschreibung
        );
      }
    } catch (error) {
      console.error('Error adding journal entry:', error);
    }
  };

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
        <Text style={styles.pfadIcon}>{pfad.motivation.icon}</Text>
        <View style={styles.pfadInfo}>
          <Text style={styles.pfadTitle}>{pfad.titel}</Text>
          <Text style={styles.pfadKategorie}>{pfad.kategorie}</Text>
        </View>
        {pfad.gestartet && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Aktiv</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.pfadBeschreibung}>{pfad.beschreibung}</Text>
      
      <View style={styles.eigenschaften}>
        <Text style={styles.eigenschaftLabel}>🕐 Kein Zeitdruck</Text>
        <Text style={styles.eigenschaftLabel}>⏸️ Pausierbar</Text>
        <Text style={styles.eigenschaftLabel}>🔄 Wiederholbar</Text>
      </View>
      
      {pfad.gestartet && (
        <View style={styles.fortschrittContainer}>
          <Text style={styles.fortschrittText}>
            Fortschritt: {pfad.fortschritt}% • Module: {pfad.abgeschlossene_module.length}
          </Text>
          <Text style={styles.letzterBesuch}>
            Letzter Besuch: {pfad.letzter_besuch ? new Date(pfad.letzter_besuch).toLocaleDateString() : 'Nie'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderDetailModal = () => (
    <Modal
      visible={showDetailModal}
      animationType="slide"
      presentationStyle="formSheet"
    >
      <View style={styles.modalContainer}>
        <ScrollView style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedPfad?.motivation.icon} {selectedPfad?.titel}</Text>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.motivationSection}>
            <Text style={styles.motivationTitle}>{selectedPfad?.motivation.titel}</Text>
            <Text style={styles.motivationBeschreibung}>{selectedPfad?.motivation.beschreibung}</Text>
          </View>
          
          <View style={styles.eigenschaften}>
            <Text style={styles.sectionTitle}>🌱 Freiwillige Eigenschaften:</Text>
            {selectedPfad?.eigenschaften && Object.entries(selectedPfad.eigenschaften).map(([key, value]) => 
              value && (
                <Text key={key} style={styles.eigenschaftItem}>
                  ✓ {key.replace(/_/g, ' ').replace('kein', 'Kein').replace('keine', 'Keine')}
                </Text>
              )
            )}
          </View>
          
          <View style={styles.moduleSection}>
            <Text style={styles.sectionTitle}>📚 Verfügbare Inhalte:</Text>
            {selectedPfad?.module?.map((modul, index) => (
              <View key={index} style={styles.modulItem}>
                <Text style={styles.modulTitle}>
                  {typeof modul === 'string' ? modul : modul.titel}
                </Text>
                {modul.dauer && (
                  <Text style={styles.modulDauer}>{modul.dauer}s</Text>
                )}
              </View>
            ))}
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
                <Text style={styles.startButtonText}>🌱 Pfad beginnen</Text>
                <Text style={styles.startButtonSubtext}>(Kein Zwang, kein Zeitdruck)</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.activeButtons}>
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() => {
                    setShowDetailModal(false);
                    // Navigation zur Pfad-Ausführung
                  }}
                >
                  <Text style={styles.continueButtonText}>▶️ Fortsetzen</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.pauseButton}
                  onPress={() => {
                    pausePfad(selectedPfad.id);
                    setShowDetailModal(false);
                  }}
                >
                  <Text style={styles.pauseButtonText}>⏸️ Pausieren</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const renderJournalModal = () => (
    <Modal
      visible={showJournalModal}
      animationType="slide"
      presentationStyle="formSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📝 Lernjournal-Eintrag</Text>
            <TouchableOpacity onPress={() => setShowJournalModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.journalHinweis}>
            Dieser Eintrag ist nur für dich sichtbar und wird nicht bewertet.
          </Text>
          
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
              <Text style={styles.startButtonText}>💾 Speichern</Text>
              <Text style={styles.startButtonSubtext}>(Privat & ohne Bewertung)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>🌱 Freiwillige Pfade werden geladen...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🌱 Freiwillige Lernpfade</Text>
          <Text style={styles.headerSubtitle}>Lernen ohne Zwang • Entdecken in eigenem Tempo</Text>
        </View>

        <View style={styles.philosophySection}>
          <Text style={styles.philosophyTitle}>💭 Lernphilosophie</Text>
          <Text style={styles.philosophyText}>
            Hier bestimmst du das Tempo. Keine Deadlines, keine Bewertungen, kein Druck. 
            Folge deiner Neugier und lerne aus intrinsischer Motivation.
          </Text>
          
          <View style={styles.prinzipien}>
            <Text style={styles.prinzipItem}>✓ Keine Deadlines oder Zeitdruck</Text>
            <Text style={styles.prinzipItem}>✓ Freie Reihenfolge und Pausierung</Text>
            <Text style={styles.prinzipItem}>✓ Wiederholung jederzeit erlaubt</Text>
            <Text style={styles.prinzipItem}>✓ Reflexion ohne Bewertung</Text>
            <Text style={styles.prinzipItem}>✓ Neugier als einziger Kompass</Text>
          </View>
        </View>

        {tagesimpuls && (
          <View style={styles.tagesimpulsSection}>
            <Text style={styles.sectionTitle}>☀️ Dein heutiger Lernimpuls</Text>
            <TouchableOpacity style={styles.tagesimpulsCard}>
              <Text style={styles.tagesimpulsTitle}>{tagesimpuls.content?.titel || 'Tägliche Reflexion'}</Text>
              <Text style={styles.tagesimpulsText}>
                {tagesimpuls.content?.reflexion || tagesimpuls.content?.untertitel || 'Klicke für Details'}
              </Text>
              <Text style={styles.tagesimpulsHinweis}>Ganz freiwillig • Keine Deadline</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => setShowJournalModal(true)}
          >
            <Text style={styles.quickActionIcon}>📝</Text>
            <Text style={styles.quickActionText}>Lernjournal</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={loadTagesimpuls}
          >
            <Text style={styles.quickActionIcon}>🎲</Text>
            <Text style={styles.quickActionText}>Zufälliger Impuls</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pfadeSection}>
          <Text style={styles.sectionTitle}>🌱 Verfügbare Pfade ({freiwilligePfade.length})</Text>
          
          {freiwilligePfade.map(renderPfadCard)}
        </View>
      </ScrollView>

      {renderDetailModal()}
      {renderJournalModal()}
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
    textAlign: 'center'
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
    fontWeight: '500'
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
    borderRadius: 10
  },
  statusText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold'
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
  letzterBesuch: {
    fontSize: 11,
    color: '#6c757d',
    marginTop: 2
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
  eigenschaftItem: {
    fontSize: 13,
    color: '#27ae60',
    marginBottom: 3
  },
  moduleSection: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20
  },
  modulItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa'
  },
  modulTitle: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1
  },
  modulDauer: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  actionButtons: {
    marginTop: 20
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
  activeButtons: {
    flexDirection: 'row',
    gap: 10
  },
  continueButton: {
    flex: 1,
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
  pauseButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  pauseButtonText: {
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

export default FreiwilligePfadeScreen; 
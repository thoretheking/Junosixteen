import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, FlatList, Alert, SafeAreaView, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// NEUE KATEGORISIERTE THEMENSTRUKTUR
const THEMENKATEGORIEN = {
  '🧭 Digitale Welt & Technik': [
    'KI Allgemein', 'KI & Ethik', 'Cybersicherheit', 'IT-Sicherheit', 'Digitalisierung',
    'Microsoft Office', 'Social Media', 'Data Act', 'EU AI Act', 'Programmierung'
  ],
  '💼 Beruf & Karriere': [
    'Karrierecoaching', 'Selbstorganisation', 'Leadership', 'HR', 'Kundenbeziehungsprozesse',
    'Vertriebsmanagement', 'Projektmanagement', 'Change Management', 'Kommunikation'
  ],
  '⚖️ Recht & Politik': [
    'Datenschutz', 'Arbeitsrecht', 'Betreuungsrecht', 'Urheberrecht', 'Lebensmittelrecht',
    'Steuerrecht', 'Kennzeichnungspflicht Lebensmittel', 'Forderungsmanagement',
    'Politik Deutschland', 'Politik Europa', 'Politik International', 'Compliance'
  ],
  '🧠 Psychologie & Persönlichkeitsentwicklung': [
    'Psychologie', 'Selbstfürsorge', 'Ethik', 'Philosophie', 'Literatur', 'Religion',
    'Glaube & Spiritualität', 'Konfliktmanagement'
  ],
  '🧬 Gesundheit & Pflege': [
    'Pflegeethik', 'Hygiene', 'Gewaltprävention', 'Suchtprävention', 'Erste Hilfe', 'Arbeitsschutz'
  ],
  '🌱 Umwelt & Nachhaltigkeit': [
    'Klimawandel', 'Tierwohl'
  ],
  '🏛️ Gesellschaft & Werte': [
    'DEI', 'Rassismus', 'Menschenrechte', 'Kindeswohl', 'Pädagogik', 'Verhaltensökonomie',
    'Wirtschaft & Soziales'
  ],
  '💡 Wirtschaft & Finanzen': [
    'BWL', 'VWL', 'E-Commerce', 'Marketing'
  ],
  '📋 Methoden & Tools': [
    'Scrum', 'PMBOK', 'PRINCE2', 'IPMA', 'Kanban', 'Lean', 'OKR', 'Design Thinking',
    'Wasserfallmodell', 'Agile Methoden'
  ],
  '🧩 Interdisziplinär & Transfer': [
    'Transferfähige Soft Skills', 'Szenarien- & Fallanalysen', 'Systemisches Denken',
    'Kreative Anwendungen'
  ],
  '🏫 Schule': [
    'Lernstrategien & Motivation', 'Mobbingprävention', 'Cybergrooming', 'Umgang mit Medien',
    'Schulrecht', 'Schülervertretung & Mitbestimmung', 'Grundlagen der Demokratie'
  ],
  '🎓 Studium': [
    'Studienplanung & Studienfinanzierung', 'Zeitmanagement im Studium', 'Wissenschaftliches Arbeiten',
    'Hausarbeiten & Zitierstandards', 'Umgang mit Leistungsdruck', 'Digitales Lernen & Lernplattformen',
    'Karriereplanung im Studium'
  ],
  '🛠️ Ausbildung': [
    'Rechte & Pflichten in der Ausbildung', 'Berufsorientierung', 'Prüfungsvorbereitung',
    'Betriebliches Lernen & Feedback', 'Kommunikation im Betrieb', 'Ausbildungsrahmenpläne verstehen',
    'Umgang mit Ausbildern & Kollegen', 'Konflikte in Ausbildungssituationen'
  ]
};

// Alle Bereiche flach für Suche
const ALLE_BEREICHE = Object.values(THEMENKATEGORIEN).flat();

const BereichScreen = ({ navigation }) => {
  const [suchtext, setSuchtext] = useState('');
  const [kategorieView, setKategorieView] = useState(true);
  const [erweitertKategorie, setErweitertKategorie] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [highscores, setHighscores] = useState({});

  useEffect(() => {
    loadPlayerData();
    loadHighscores();
  }, []);

  const loadPlayerData = async () => {
    try {
      const data = await AsyncStorage.getItem('playerData');
      if (data) {
        setPlayerData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Spielerdaten:', error);
    }
  };

  const loadHighscores = async () => {
    try {
      const data = await AsyncStorage.getItem('highscores');
      if (data) {
        setHighscores(JSON.parse(data));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Highscores:', error);
    }
  };

  const startQuiz = (bereich) => {
    const currentLevel = playerData?.progress?.[bereich]?.level || 1;
    
    Alert.alert(
      `🎯 ${bereich}`,
      `Quiz starten für Level ${currentLevel}?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Quiz starten',
          onPress: () => navigation.navigate('GameScreen', { 
            bereich, 
            level: currentLevel 
          })
        }
      ]
    );
  };

  // Gefilterte Bereiche basierend auf Suchtext
  const getFilteredBereiche = () => {
    if (!suchtext) return ALLE_BEREICHE;
    return ALLE_BEREICHE.filter(bereich => 
      bereich.toLowerCase().includes(suchtext.toLowerCase())
    );
  };

  // Kategorie-basierte Ansicht
  const renderKategorieView = () => {
    const kategorien = Object.keys(THEMENKATEGORIEN);
    
    return (
      <FlatList
        data={kategorien}
        keyExtractor={(item) => item}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: kategorie }) => {
          const bereiche = THEMENKATEGORIEN[kategorie];
          const isExpanded = erweitertKategorie === kategorie;
          
          return (
            <View style={styles.kategorieContainer}>
              {/* Kategorie Header */}
              <TouchableOpacity 
                style={styles.kategorieHeader}
                onPress={() => setErweitertKategorie(isExpanded ? null : kategorie)}
              >
                <Text style={styles.kategorieTitle}>{kategorie}</Text>
                <View style={styles.kategorieInfo}>
                  <Text style={styles.anzahlBereiche}>{bereiche.length} Bereiche</Text>
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#666" 
                  />
                </View>
              </TouchableOpacity>

              {/* Erweiterte Bereiche */}
              {isExpanded && (
                <View style={styles.bereicheListe}>
                  {bereiche.map((bereich, index) => (
                    <BereichCard 
                      key={bereich}
                      bereich={bereich}
                      index={index}
                      playerData={playerData}
                      highscores={highscores}
                      onPress={() => startQuiz(bereich)}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        }}
      />
    );
  };

  // Bereich-Card Komponente
  const BereichCard = ({ bereich, index, playerData, highscores, onPress }) => {
    const progress = playerData?.progress?.[bereich] || { level: 1, xp: 0 };
    const highscore = highscores[bereich] || 0;
    
    return (
      <TouchableOpacity 
        style={[styles.bereichCard, { borderLeftColor: getBereichColor(index) }]}
        onPress={onPress}
      >
        <View style={styles.bereichHeader}>
          <Text style={styles.bereichName}>{bereich}</Text>
          <Text style={styles.bereichLevel}>Level {progress.level}</Text>
        </View>
        
        <View style={styles.bereichStats}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${(progress.xp % 1000) / 10}%`,
                  backgroundColor: getBereichColor(index)
                }
              ]} 
            />
          </View>
          <Text style={styles.highscoreText}>🏆 {highscore}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Suchansicht (wie vorher)
  const renderSuchView = () => {
    const filtered = getFilteredBereiche();
    
    return (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item}
        numColumns={1}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: bereich, index }) => (
          <BereichCard 
            bereich={bereich}
            index={index}
            playerData={playerData}
            highscores={highscores}
            onPress={() => startQuiz(bereich)}
          />
        )}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🎯 Themenbereiche wählen</Text>
          <Text style={styles.headerSubtitle}>
            {ALLE_BEREICHE.length} Bereiche • 13 Kategorien • 1.000+ Fragen pro Bereich
          </Text>
        </View>

        {/* Suchleiste */}
        <View style={styles.suchContainer}>
          <Ionicons name="search" size={20} color="#888" style={styles.suchIcon} />
          <TextInput
            style={styles.suchInput}
            placeholder="Bereich suchen..."
            placeholderTextColor="#888"
            value={suchtext}
            onChangeText={setSuchtext}
          />
          {suchtext ? (
            <TouchableOpacity onPress={() => setSuchtext('')}>
              <Ionicons name="close" size={20} color="#888" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* View Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, kategorieView && styles.toggleActive]}
            onPress={() => setKategorieView(true)}
          >
            <Ionicons name="grid" size={16} color={kategorieView ? "#fff" : "#888"} />
            <Text style={[styles.toggleText, kategorieView && styles.toggleTextActive]}>
              Kategorien
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toggleButton, !kategorieView && styles.toggleActive]}
            onPress={() => setKategorieView(false)}
          >
            <Ionicons name="list" size={16} color={!kategorieView ? "#fff" : "#888"} />
            <Text style={[styles.toggleText, !kategorieView && styles.toggleTextActive]}>
              Alle Bereiche
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {suchtext || !kategorieView ? renderSuchView() : renderKategorieView()}
      </View>
    </SafeAreaView>
  );
};

// ... existing styles ...

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1419',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#b8bcc8',
  },
  suchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
  },
  suchIcon: {
    marginRight: 10,
  },
  suchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 3,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  toggleActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  toggleText: {
    color: '#888',
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  kategorieContainer: {
    marginBottom: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    overflow: 'hidden',
  },
  kategorieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  kategorieTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  kategorieInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  anzahlBereiche: {
    color: '#b8bcc8',
    fontSize: 12,
    marginRight: 10,
  },
  bereicheListe: {
    padding: 10,
  },
  bereichCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  bereichHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bereichName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  bereichLevel: {
    fontSize: 12,
    color: '#b8bcc8',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bereichStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginRight: 15,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  highscoreText: {
    fontSize: 12,
    color: '#b8bcc8',
  },
});

// Hilfsfunktion für Bereich-Farben
const getBereichColor = (index) => {
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
    '#dda0dd', '#98d8c8', '#ffb3ba', '#ffdfba', '#ffffba',
    '#baffc9', '#bae1ff', '#c4a8a8', '#c4c4e8', '#f0c0a8'
  ];
  return colors[index % colors.length];
};

export default BereichScreen; 
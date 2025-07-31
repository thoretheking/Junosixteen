# 📱 Offline-Funktionalität Integration Guide

## 🎯 Übersicht

Die Offline-Funktionalität ermöglicht es Nutzern, freiwillige Lernpfade auch ohne Internetverbindung zu nutzen. Dies passt perfekt zur "Lernen ohne Zwang"-Philosophie, da Nutzer vollständig flexibel lernen können.

## 📦 Benötigte Dependencies

Fügen Sie diese Dependencies zu Ihrer `package.json` hinzu:

```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "^1.21.0",
    "@react-native-community/netinfo": "^11.2.1"
  }
}
```

Installation:
```bash
npm install @react-native-async-storage/async-storage @react-native-community/netinfo
```

## 🛠️ Integration Steps

### 1. OfflineManager einbinden

```javascript
// In FreiwilligePfadeScreen.js oder einer neuen Datei
import offlineManager, { useOfflineStatus, useOfflineData } from './OfflineManager';

const FreiwilligePfadeScreen = () => {
  // Offline-Status überwachen
  const { isOnline, syncStatus } = useOfflineStatus();
  
  // Daten offline/online laden
  const { data: freiwilligePfade, loading } = useOfflineData('freiwillige-pfade');
  const { data: tagesimpuls } = useOfflineData('tagesimpuls');
  
  // ... Rest der Komponente
};
```

### 2. Backend API-Integration

Fügen Sie den Import in `server-production.js` hinzu:

```javascript
// Zeile ~16 in server-production.js
const { QuestionGenerator, THEMENBEREICHE, THEMENKATEGORIEN, generateQuestions,
        LERNFORMAT_TYPEN, ZEIT_KATEGORIEN, WISSENSSNACKS, STORYTELLING_REIHEN, 
        PERSOENLICHKEIT_PFADE, REFLEXIONSFRAGEN, FREIWILLIGE_PFADE } = require('./question-generator');
```

Kopieren Sie alle API-Endpoints aus `freiwillige-pfade-api.js` in `server-production.js`.

### 3. Navigation erweitern

```javascript
// In Ihrer App-Navigation
<Tab.Screen 
  name="FreiwilligePfade" 
  component={FreiwilligePfadeOfflineScreen}
  options={{
    tabBarIcon: ({ color }) => <Text style={{ color }}>🌱</Text>,
    title: 'Freiwillige Pfade'
  }}
/>
```

## 🌟 Hauptfunktionen

### Offline-Caching
```javascript
// Automatisches Caching beim App-Start
useEffect(() => {
  if (isOnline) {
    offlineManager.cacheFreiwilligePfadeData();
  }
}, [isOnline]);
```

### Offline-Fortschritt speichern
```javascript
const saveProgress = async (pfadId, data) => {
  if (isOnline) {
    // Online API-Call
    await fetch(`/api/freiwillige-pfade/${pfadId}/progress`, {/*...*/});
  } else {
    // Offline speichern
    await offlineManager.saveOfflineProgress(pfadId, data);
  }
};
```

### Lernjournal offline
```javascript
const addJournalEntry = async (entry) => {
  if (isOnline) {
    // Online speichern
    await fetch('/api/lernjournal', {/*...*/});
  } else {
    // Offline speichern - wird später synchronisiert
    await offlineManager.saveOfflineJournalEntry(entry);
  }
};
```

### Automatische Synchronisation
```javascript
// Wird automatisch aufgerufen wenn wieder online
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    offlineManager.syncOfflineData(); // Sync im Hintergrund
  }
});
```

## 🎨 UI-Komponenten

### Offline-Indikator
```javascript
const OfflineIndicator = () => {
  const { isOnline, syncStatus } = useOfflineStatus();
  
  return (
    <View style={[styles.indicator, isOnline ? styles.online : styles.offline]}>
      <Text>{isOnline ? '🟢 Online' : '🔴 Offline'}</Text>
      {syncStatus?.pendingSync > 0 && (
        <Text>({syncStatus.pendingSync} ausstehend)</Text>
      )}
    </View>
  );
};
```

### Offline-Badges
```javascript
// In Pfad-Karten
{!isOnline && (
  <View style={styles.offlineBadge}>
    <Text>📱 Offline verfügbar</Text>
  </View>
)}
```

### Conditional Messaging
```javascript
const getMessage = (action) => {
  return isOnline 
    ? `${action} gespeichert`
    : `${action} offline gespeichert - wird synchronisiert wenn online`;
};
```

## 🔧 Erweiterte Features

### 1. Offline-Tagesimpuls
```javascript
// Generiert täglich neue Impulse aus gecachten Daten
const tagesimpuls = await offlineManager.getTagesimpulsOffline();
```

### 2. Offline-Suche
```javascript
// Durchsucht gecachte Inhalte
const results = await offlineManager.searchOfflineContent(query);
```

### 3. Storage-Management
```javascript
// Überprüfe Speicherverbrauch
const info = await offlineManager.getOfflineStorageInfo();
console.log(`Offline-Daten: ${info.estimatedSize} bytes`);

// Lösche Offline-Daten
await offlineManager.clearOfflineData();
```

### 4. Sync-Status überwachen
```javascript
const status = offlineManager.getOfflineStatus();
// {
//   isOnline: false,
//   lastSync: "2024-01-15T10:30:00Z",
//   pendingSync: 3,
//   cachedData: true
// }
```

## 📱 Benutzerführung

### Offline-Hinweise
- **Freundlich**: "📱 Offline-Modus: Deine Fortschritte werden lokal gespeichert"
- **Motivierend**: "Auch offline kannst du lernen - ohne Zeitdruck!"
- **Transparent**: "Wird synchronisiert, sobald du online bist"

### Error-Handling
```javascript
try {
  await saveData();
} catch (error) {
  if (!isOnline) {
    // Offline-Fallback
    await offlineManager.saveDataOffline(data);
    showMessage("Offline gespeichert - wird später synchronisiert");
  } else {
    showError("Fehler beim Speichern");
  }
}
```

## 🔄 Synchronisation-Logik

### Automatisch
- App-Start (wenn online)
- Netzwerk-Wiederverbindung
- Periodisch im Hintergrund

### Manuell
```javascript
// Sync-Button für Nutzer
<TouchableOpacity onPress={() => offlineManager.syncOfflineData()}>
  <Text>🔄 Jetzt synchronisieren</Text>
</TouchableOpacity>
```

### Konflikt-Resolution
```javascript
// Bei Sync-Konflikten: Client-Daten bevorzugen
// (da es sich um persönliche Reflexionen handelt)
```

## 🧪 Testing

### Offline-Tests
```javascript
// Simuliere Offline-Modus
NetInfo.configure({
  reachabilityUrl: 'https://clients3.google.com/generate_204',
  reachabilityTest: async (response) => Promise.resolve(false)
});
```

### Test-Szenarien
1. ✅ App offline starten
2. ✅ Pfad offline beginnen
3. ✅ Fortschritt offline speichern
4. ✅ Journal offline erstellen
5. ✅ Wieder online gehen - automatische Sync
6. ✅ Manuelle Synchronisation
7. ✅ Offline-Daten löschen

## 📊 Performance

### Optimierungen
- **Lazy Loading**: Nur benötigte Daten cachen
- **Compression**: JSON-Daten komprimieren
- **Batching**: Mehrere Sync-Operationen zusammenfassen
- **Background Sync**: Nicht-blockierende Synchronisation

### Speicher-Management
```javascript
// Automatisches Cleanup alter Daten
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 Tage
if (Date.now() - lastSync > CACHE_EXPIRY) {
  await offlineManager.clearOfflineData();
}
```

## 🎯 Deployment

### Produktions-Überlegungen
1. **Error Tracking**: Offline-Fehler separat loggen
2. **Analytics**: Offline-Nutzung messen
3. **Storage Limits**: AsyncStorage-Grenzen beachten
4. **Background App Refresh**: iOS-Einstellungen berücksichtigen

### Monitoring
```javascript
// Track Offline-Nutzung
Analytics.track('offline_learning_session', {
  duration: sessionTime,
  modules_completed: offlineModules,
  sync_conflicts: conflictCount
});
```

## 🚀 Fazit

Die Offline-Funktionalität erweitert die "Lernen ohne Zwang"-Philosophie um **ultimative Flexibilität**:

✅ **Wann**: Jederzeit, auch ohne Internet  
✅ **Wo**: Überall, unabhängig von Verbindung  
✅ **Wie**: Ohne Unterbrechungen oder Datenverlust  
✅ **Warum**: Maximale Lernfreiheit für den Nutzer  

**Status: Ready for Implementation! 📱🌱** 
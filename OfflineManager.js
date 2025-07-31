// ===================================================
// 📱 OFFLINE MANAGER für freiwillige Lernpfade
// Ermöglicht Lernen ohne Internetverbindung
// ===================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

class OfflineManager {
  constructor() {
    this.isOnline = true;
    this.syncQueue = [];
    this.offlineData = {
      freiwilligePfade: [],
      wissenssnacks: [],
      reflexionsfragen: [],
      storytelling: [],
      tagesimpulse: {},
      lernjournal: [],
      lastSync: null
    };

    // Netzwerk-Status überwachen
    this.setupNetworkListener();
  }

  // ===================================================
  // 🌐 NETZWERK-MONITORING
  // ===================================================

  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected;

      console.log(`📡 Netzwerk-Status: ${this.isOnline ? 'Online' : 'Offline'}`);

      // Wenn wieder online, versuche zu synchronisieren
      if (wasOffline && this.isOnline) {
        this.syncOfflineData();
      }
    });
  }

  async checkNetworkStatus() {
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected;
    return this.isOnline;
  }

  // ===================================================
  // 💾 DATEN-CACHING für Offline-Nutzung
  // ===================================================

  async cacheFreiwilligePfadeData() {
    try {
      console.log('📥 Caching freiwillige Pfade für Offline-Nutzung...');

      // Lade alle relevanten Daten wenn online
      if (this.isOnline) {
        const responses = await Promise.all([
          fetch('/api/freiwillige-pfade', { headers: { Authorization: 'Bearer demo-token' }}),
          fetch('/api/wissenssnacks', { headers: { Authorization: 'Bearer demo-token' }}),
          fetch('/api/reflexion', { headers: { Authorization: 'Bearer demo-token' }}),
          fetch('/api/storytelling', { headers: { Authorization: 'Bearer demo-token' }}),
          fetch('/api/tagesimpuls', { headers: { Authorization: 'Bearer demo-token' }})
        ]);

        const [pfadeData, snacksData, reflexionData, storytellingData, impulsData] = 
          await Promise.all(responses.map(r => r.json()));

        // Speichere in lokalem Cache
        this.offlineData = {
          freiwilligePfade: pfadeData.freiwillige_pfade || [],
          wissenssnacks: snacksData.snacks || [],
          reflexionsfragen: reflexionData.reflexionsfrage || [],
          storytelling: storytellingData.storytelling_reihen || [],
          tagesimpulse: impulsData.impuls || {},
          lastSync: new Date().toISOString(),
          philosophy: pfadeData.philosophy
        };

        // Persistent speichern
        await AsyncStorage.setItem('offline_freiwillige_pfade', JSON.stringify(this.offlineData));
        
        console.log('✅ Freiwillige Pfade erfolgreich für Offline-Nutzung gecacht');
        return true;
      }
    } catch (error) {
      console.error('❌ Fehler beim Caching:', error);
      return false;
    }
  }

  async loadCachedData() {
    try {
      const cachedData = await AsyncStorage.getItem('offline_freiwillige_pfade');
      if (cachedData) {
        this.offlineData = JSON.parse(cachedData);
        console.log('📱 Offline-Daten geladen, letzter Sync:', this.offlineData.lastSync);
        return this.offlineData;
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Offline-Daten:', error);
    }
    return null;
  }

  // ===================================================
  // 🔄 OFFLINE-SYNCHRONISATION
  // ===================================================

  async syncOfflineData() {
    if (!this.isOnline) return false;

    try {
      console.log('🔄 Synchronisiere Offline-Daten...');

      // Lade lokale Änderungen
      const localChanges = await this.getLocalChanges();
      
      // Sende lokale Änderungen an Server
      for (const change of localChanges) {
        await this.syncSingleChange(change);
      }

      // Aktualisiere Cache mit neuesten Server-Daten
      await this.cacheFreiwilligePfadeData();

      // Lösche verarbeitete lokale Änderungen
      await this.clearLocalChanges();

      console.log('✅ Offline-Synchronisation abgeschlossen');
      return true;

    } catch (error) {
      console.error('❌ Fehler bei Offline-Synchronisation:', error);
      return false;
    }
  }

  async syncSingleChange(change) {
    try {
      const response = await fetch(change.endpoint, {
        method: change.method,
        headers: {
          'Authorization': 'Bearer demo-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(change.data)
      });

      if (response.ok) {
        console.log(`✅ Change synced: ${change.type}`);
      } else {
        console.log(`⚠️ Failed to sync: ${change.type}`);
      }
    } catch (error) {
      console.error('❌ Error syncing change:', error);
    }
  }

  // ===================================================
  // 📱 OFFLINE-OPERATIONEN
  // ===================================================

  async saveOfflineProgress(pfadId, progressData) {
    try {
      const offlineProgress = await AsyncStorage.getItem('offline_progress') || '{}';
      const progress = JSON.parse(offlineProgress);
      
      if (!progress[pfadId]) progress[pfadId] = {};
      
      // Merge neue Daten
      progress[pfadId] = {
        ...progress[pfadId],
        ...progressData,
        lastUpdate: new Date().toISOString(),
        offline: true
      };

      await AsyncStorage.setItem('offline_progress', JSON.stringify(progress));

      // Füge zur Sync-Queue hinzu
      this.addToSyncQueue({
        type: 'progress',
        pfadId,
        data: progressData,
        endpoint: `/api/freiwillige-pfade/${pfadId}/progress`,
        method: 'POST'
      });

      console.log('💾 Fortschritt offline gespeichert');
      return true;

    } catch (error) {
      console.error('❌ Fehler beim Offline-Speichern:', error);
      return false;
    }
  }

  async saveOfflineJournalEntry(entry) {
    try {
      const offlineJournal = await AsyncStorage.getItem('offline_journal') || '[]';
      const journal = JSON.parse(offlineJournal);
      
      const offlineEntry = {
        ...entry,
        id: `offline_${Date.now()}`,
        offline: true,
        created: new Date().toISOString()
      };

      journal.unshift(offlineEntry);
      await AsyncStorage.setItem('offline_journal', JSON.stringify(journal));

      // Zur Sync-Queue hinzufügen
      this.addToSyncQueue({
        type: 'journal',
        data: offlineEntry,
        endpoint: '/api/lernjournal',
        method: 'POST'
      });

      console.log('📝 Journal-Eintrag offline gespeichert');
      return offlineEntry;

    } catch (error) {
      console.error('❌ Fehler beim Offline-Journal:', error);
      return null;
    }
  }

  async getOfflineJournal() {
    try {
      const offlineJournal = await AsyncStorage.getItem('offline_journal') || '[]';
      return JSON.parse(offlineJournal);
    } catch (error) {
      console.error('❌ Fehler beim Laden des Offline-Journals:', error);
      return [];
    }
  }

  async getOfflineProgress(pfadId) {
    try {
      const offlineProgress = await AsyncStorage.getItem('offline_progress') || '{}';
      const progress = JSON.parse(offlineProgress);
      return progress[pfadId] || {};
    } catch (error) {
      console.error('❌ Fehler beim Laden des Offline-Fortschritts:', error);
      return {};
    }
  }

  // ===================================================
  // 🗃️ SYNC-QUEUE MANAGEMENT
  // ===================================================

  addToSyncQueue(item) {
    this.syncQueue.push({
      ...item,
      timestamp: new Date().toISOString()
    });
    this.saveSyncQueue();
  }

  async saveSyncQueue() {
    try {
      await AsyncStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('❌ Fehler beim Speichern der Sync-Queue:', error);
    }
  }

  async loadSyncQueue() {
    try {
      const queue = await AsyncStorage.getItem('sync_queue');
      this.syncQueue = queue ? JSON.parse(queue) : [];
      return this.syncQueue;
    } catch (error) {
      console.error('❌ Fehler beim Laden der Sync-Queue:', error);
      return [];
    }
  }

  async getLocalChanges() {
    await this.loadSyncQueue();
    return this.syncQueue;
  }

  async clearLocalChanges() {
    this.syncQueue = [];
    await AsyncStorage.setItem('sync_queue', '[]');
  }

  // ===================================================
  // 🎯 FREIWILLIGE PFADE OFFLINE-API
  // ===================================================

  async getFreiwilligePfadeOffline() {
    // Versuche zuerst Online-Daten zu laden
    if (this.isOnline) {
      const success = await this.cacheFreiwilligePfadeData();
      if (success) return this.offlineData.freiwilligePfade;
    }

    // Fallback zu Offline-Daten
    const cachedData = await this.loadCachedData();
    return cachedData?.freiwilligePfade || [];
  }

  async getTagesimpulsOffline() {
    const heute = new Date().toDateString();
    
    // Prüfe lokalen Tagesimpuls
    const localImpulse = await AsyncStorage.getItem('local_tagesimpulse') || '{}';
    const impulse = JSON.parse(localImpulse);
    
    if (impulse[heute]) {
      return impulse[heute];
    }

    // Generiere neuen Offline-Impuls aus gecachten Daten
    const cachedData = await this.loadCachedData();
    if (cachedData) {
      const verfügbareInhalte = [
        ...cachedData.wissenssnacks,
        ...cachedData.reflexionsfragen
      ];

      if (verfügbareInhalte.length > 0) {
        const zufälligerInhalt = verfügbareInhalte[Math.floor(Math.random() * verfügbareInhalte.length)];
        
        const neuerImpuls = {
          ...zufälligerInhalt,
          datum: heute,
          offline: true,
          generiert: new Date().toISOString()
        };

        // Speichere lokalen Impuls
        impulse[heute] = neuerImpuls;
        await AsyncStorage.setItem('local_tagesimpulse', JSON.stringify(impulse));
        
        return neuerImpuls;
      }
    }

    return null;
  }

  async startPfadOffline(pfadId) {
    try {
      const offlineStarts = await AsyncStorage.getItem('offline_starts') || '{}';
      const starts = JSON.parse(offlineStarts);
      
      starts[pfadId] = {
        gestartet: true,
        start_datum: new Date().toISOString(),
        offline: true
      };

      await AsyncStorage.setItem('offline_starts', JSON.stringify(starts));

      // Zur Sync-Queue hinzufügen
      this.addToSyncQueue({
        type: 'start_pfad',
        pfadId,
        endpoint: `/api/freiwillige-pfade/${pfadId}/start`,
        method: 'POST',
        data: {}
      });

      console.log('🌱 Pfad offline gestartet');
      return true;

    } catch (error) {
      console.error('❌ Fehler beim Offline-Start:', error);
      return false;
    }
  }

  // ===================================================
  // 📊 OFFLINE-STATUS & UTILITIES
  // ===================================================

  getOfflineStatus() {
    return {
      isOnline: this.isOnline,
      lastSync: this.offlineData.lastSync,
      pendingSync: this.syncQueue.length,
      cachedData: !!this.offlineData.freiwilligePfade.length
    };
  }

  async getOfflineStorageInfo() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => 
        key.startsWith('offline_') || 
        key.startsWith('local_') || 
        key === 'sync_queue'
      );

      const info = {
        totalKeys: offlineKeys.length,
        keys: offlineKeys,
        estimatedSize: 0
      };

      // Schätze Speichergröße
      for (const key of offlineKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          info.estimatedSize += value.length;
        }
      }

      return info;
    } catch (error) {
      console.error('❌ Fehler beim Abrufen der Offline-Info:', error);
      return null;
    }
  }

  async clearOfflineData() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => 
        key.startsWith('offline_') || 
        key.startsWith('local_') || 
        key === 'sync_queue'
      );

      await AsyncStorage.multiRemove(offlineKeys);
      
      this.offlineData = {
        freiwilligePfade: [],
        wissenssnacks: [],
        reflexionsfragen: [],
        storytelling: [],
        tagesimpulse: {},
        lernjournal: [],
        lastSync: null
      };
      
      this.syncQueue = [];

      console.log('🗑️ Offline-Daten gelöscht');
      return true;

    } catch (error) {
      console.error('❌ Fehler beim Löschen der Offline-Daten:', error);
      return false;
    }
  }

  // ===================================================
  // 🔍 OFFLINE-SUCHE
  // ===================================================

  async searchOfflineContent(query) {
    const cachedData = await this.loadCachedData();
    if (!cachedData) return [];

    const allContent = [
      ...cachedData.freiwilligePfade,
      ...cachedData.wissenssnacks,
      ...cachedData.storytelling
    ];

    return allContent.filter(item => 
      JSON.stringify(item).toLowerCase().includes(query.toLowerCase())
    );
  }
}

// ===================================================
// 📱 SINGLETON EXPORT
// ===================================================

const offlineManager = new OfflineManager();

export default offlineManager;

// ===================================================
// 🔧 HELPER HOOKS für React Native
// ===================================================

export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = React.useState(true);
  const [syncStatus, setSyncStatus] = React.useState(null);

  React.useEffect(() => {
    const updateStatus = () => {
      const status = offlineManager.getOfflineStatus();
      setIsOnline(status.isOnline);
      setSyncStatus(status);
    };

    updateStatus();
    
    // Update alle 5 Sekunden
    const interval = setInterval(updateStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return { isOnline, syncStatus };
};

export const useOfflineData = (dataType) => {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        let result = [];
        
        switch (dataType) {
          case 'freiwillige-pfade':
            result = await offlineManager.getFreiwilligePfadeOffline();
            break;
          case 'tagesimpuls':
            result = await offlineManager.getTagesimpulsOffline();
            break;
          case 'journal':
            result = await offlineManager.getOfflineJournal();
            break;
          default:
            result = [];
        }
        
        setData(result);
      } catch (error) {
        console.error(`❌ Fehler beim Laden von ${dataType}:`, error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dataType]);

  return { data, loading };
}; 
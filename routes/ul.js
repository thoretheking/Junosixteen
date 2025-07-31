const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

const db = admin.firestore();

// K-Means Clustering Implementation (vereinfacht)
class SimpleKMeans {
  constructor(k = 3) {
    this.k = k;
    this.centroids = [];
    this.clusters = [];
  }

  // Euklidische Distanz berechnen
  distance(point1, point2) {
    return Math.sqrt(
      Math.pow(point1.avgTime - point2.avgTime, 2) +
      Math.pow(point1.errors - point2.errors, 2) +
      Math.pow(point1.clicks - point2.clicks, 2)
    );
  }

  // Clustering durchführen
  cluster(data) {
    if (data.length < this.k) {
      return data.map((point, index) => ({ ...point, cluster: index }));
    }

    // Initiale Zentroide zufällig setzen
    this.centroids = [];
    for (let i = 0; i < this.k; i++) {
      const randomIndex = Math.floor(Math.random() * data.length);
      this.centroids.push({ ...data[randomIndex] });
    }

    let hasChanged = true;
    let iterations = 0;
    const maxIterations = 100;

    while (hasChanged && iterations < maxIterations) {
      hasChanged = false;
      iterations++;

      // Punkte zu nächstem Zentroid zuordnen
      data.forEach(point => {
        let minDistance = Infinity;
        let closestCluster = 0;

        this.centroids.forEach((centroid, index) => {
          const dist = this.distance(point, centroid);
          if (dist < minDistance) {
            minDistance = dist;
            closestCluster = index;
          }
        });

        if (point.cluster !== closestCluster) {
          hasChanged = true;
          point.cluster = closestCluster;
        }
      });

      // Zentroide neu berechnen
      for (let i = 0; i < this.k; i++) {
        const clusterPoints = data.filter(point => point.cluster === i);
        if (clusterPoints.length > 0) {
          this.centroids[i] = {
            avgTime: clusterPoints.reduce((sum, p) => sum + p.avgTime, 0) / clusterPoints.length,
            errors: clusterPoints.reduce((sum, p) => sum + p.errors, 0) / clusterPoints.length,
            clicks: clusterPoints.reduce((sum, p) => sum + p.clicks, 0) / clusterPoints.length
          };
        }
      }
    }

    return data;
  }
}

// Benutzerverhalten analysieren und Cluster bestimmen
router.post('/cluster-analyze', async (req, res) => {
  try {
    const { avgTime, errors, clicks, moduleId } = req.body;
    const uid = req.user.uid;

    if (avgTime === undefined || errors === undefined || clicks === undefined) {
      return res.status(400).json({ error: 'avgTime, errors und clicks sind erforderlich' });
    }

    // Aktuelles Nutzerverhalten
    const userBehavior = {
      uid,
      avgTime: parseFloat(avgTime),
      errors: parseInt(errors),
      clicks: parseInt(clicks),
      moduleId: moduleId ? parseInt(moduleId) : null,
      timestamp: new Date()
    };

    // Verhalten in Datenbank speichern
    await db.collection('userBehavior').add({
      ...userBehavior,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Alle Verhaltensdaten für Clustering abrufen
    const behaviorSnapshot = await db.collection('userBehavior')
      .orderBy('timestamp', 'desc')
      .limit(100) // Letzte 100 Datenpunkte für Clustering
      .get();

    const behaviorData = [];
    behaviorSnapshot.forEach(doc => {
      const data = doc.data();
      behaviorData.push({
        uid: data.uid,
        avgTime: data.avgTime,
        errors: data.errors,
        clicks: data.clicks
      });
    });

    // K-Means Clustering durchführen
    const kmeans = new SimpleKMeans(3);
    const clusteredData = kmeans.cluster(behaviorData);

    // Aktuellen Benutzer im Cluster finden
    const userClusterData = clusteredData.find(data => data.uid === uid);
    let clusterType = 'Typ_A'; // Default

    if (userClusterData) {
      // Cluster-Typen basierend auf Charakteristika zuordnen
      const cluster = userClusterData.cluster;
      const clusterStats = getClusterStats(clusteredData, cluster);

      if (clusterStats.avgErrors < 2 && clusterStats.avgTime < 15000) {
        clusterType = 'Typ_A'; // Schnell und präzise
      } else if (clusterStats.avgErrors >= 2 && clusterStats.avgTime >= 15000) {
        clusterType = 'Typ_C'; // Langsam, mehr Fehler - braucht Unterstützung
      } else {
        clusterType = 'Typ_B'; // Durchschnittlich
      }
    }

    // Cluster-Zuordnung in Benutzerprofil speichern
    await db.collection('users').doc(uid).update({
      cluster: clusterType,
      lastClusterUpdate: admin.firestore.FieldValue.serverTimestamp(),
      behaviorMetrics: {
        avgTime: userBehavior.avgTime,
        errors: userBehavior.errors,
        clicks: userBehavior.clicks,
        lastAnalyzed: admin.firestore.FieldValue.serverTimestamp()
      }
    });

    // Cluster-Statistik aktualisieren
    await db.collection('clusterStats').add({
      uid,
      oldCluster: null, // TODO: Vorherige Cluster-Zuordnung vergleichen
      newCluster: clusterType,
      confidence: calculateConfidence(userBehavior, clusterStats),
      moduleId: moduleId || null,
      analyzedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      cluster: clusterType,
      clusterDescription: getClusterDescription(clusterType),
      behaviorMetrics: userBehavior,
      recommendations: getClusterRecommendations(clusterType),
      confidence: calculateConfidence(userBehavior, getClusterStats(clusteredData, userClusterData?.cluster || 0))
    });

  } catch (error) {
    console.error('UL-Cluster-Analyse-Fehler:', error);
    res.status(500).json({ error: 'Fehler bei der Cluster-Analyse' });
  }
});

// Cluster-Statistiken berechnen
function getClusterStats(data, clusterIndex) {
  const clusterData = data.filter(point => point.cluster === clusterIndex);
  
  if (clusterData.length === 0) {
    return { avgTime: 0, avgErrors: 0, avgClicks: 0, count: 0 };
  }

  return {
    avgTime: clusterData.reduce((sum, p) => sum + p.avgTime, 0) / clusterData.length,
    avgErrors: clusterData.reduce((sum, p) => sum + p.errors, 0) / clusterData.length,
    avgClicks: clusterData.reduce((sum, p) => sum + p.clicks, 0) / clusterData.length,
    count: clusterData.length
  };
}

// Cluster-Beschreibungen
function getClusterDescription(clusterType) {
  const descriptions = {
    'Typ_A': {
      name: 'Analytischer Lerner',
      characteristics: 'Schnell, präzise, wenige Fehler',
      approach: 'Faktenbasiert, strukturiert',
      color: '#3B82F6'
    },
    'Typ_B': {
      name: 'Praktischer Lerner',
      characteristics: 'Durchschnittliches Tempo, ausgeglichen',
      approach: 'Beispielorientiert, pragmatisch',
      color: '#10B981'
    },
    'Typ_C': {
      name: 'Visueller Lerner',
      characteristics: 'Braucht mehr Zeit, profitiert von Wiederholung',
      approach: 'Visuell, kreativ, unterstützend',
      color: '#F59E0B'
    }
  };

  return descriptions[clusterType] || descriptions['Typ_A'];
}

// Cluster-spezifische Empfehlungen
function getClusterRecommendations(clusterType) {
  const recommendations = {
    'Typ_A': [
      'Erhöhe die Schwierigkeit der Fragen',
      'Biete zusätzliche Detailinformationen',
      'Verwende komplexere Szenarien',
      'Fokus auf Theorie und Hintergründe'
    ],
    'Typ_B': [
      'Nutze praktische Arbeitsbeispiele',
      'Biete ausgewogene Schwierigkeit',
      'Verwende realistische Szenarien',
      'Kombiniere Theorie mit Praxis'
    ],
    'Typ_C': [
      'Verwende mehr visuelle Hilfsmittel',
      'Reduziere die Zeitlimits',
      'Biete Wiederholungsmöglichkeiten',
      'Nutze Schritt-für-Schritt-Anleitungen'
    ]
  };

  return recommendations[clusterType] || recommendations['Typ_A'];
}

// Vertrauen in die Cluster-Zuordnung berechnen
function calculateConfidence(userBehavior, clusterStats) {
  if (!clusterStats || clusterStats.count === 0) {
    return 0.5; // Niedrige Konfidenz bei wenig Daten
  }

  // Distanz zu Cluster-Zentrum berechnen
  const distance = Math.sqrt(
    Math.pow(userBehavior.avgTime - clusterStats.avgTime, 2) +
    Math.pow(userBehavior.errors - clusterStats.avgErrors, 2) +
    Math.pow(userBehavior.clicks - clusterStats.avgClicks, 2)
  );

  // Konfidenz umgekehrt proportional zur Distanz
  const maxDistance = 50; // Erwartete maximale Distanz
  const confidence = Math.max(0.1, 1 - (distance / maxDistance));
  
  return Math.min(1, confidence);
}

// Benutzer-spezifische Lernmuster abrufen
router.get('/learning-pattern', async (req, res) => {
  try {
    const uid = req.user.uid;

    // Verhaltensdaten der letzten 30 Tage abrufen
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const behaviorSnapshot = await db.collection('userBehavior')
      .where('uid', '==', uid)
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .orderBy('timestamp', 'asc')
      .get();

    const behaviorHistory = [];
    behaviorSnapshot.forEach(doc => {
      behaviorHistory.push(doc.data());
    });

    if (behaviorHistory.length === 0) {
      return res.json({
        pattern: 'insufficient_data',
        message: 'Nicht genügend Daten für Musteranalyse',
        recommendations: ['Spiele mehr Module um Lernmuster zu erkennen']
      });
    }

    // Trend-Analyse
    const avgTimeToday = behaviorHistory.slice(-5).reduce((sum, b) => sum + b.avgTime, 0) / Math.min(5, behaviorHistory.length);
    const avgTimeWeekAgo = behaviorHistory.slice(0, 5).reduce((sum, b) => sum + b.avgTime, 0) / Math.min(5, behaviorHistory.length);
    
    const improvement = avgTimeWeekAgo > avgTimeToday;
    const errorTrend = behaviorHistory.map(b => b.errors);
    const recentErrors = errorTrend.slice(-5).reduce((sum, e) => sum + e, 0);
    const earlyErrors = errorTrend.slice(0, 5).reduce((sum, e) => sum + e, 0);

    // Lernmuster bestimmen
    let pattern = 'stable';
    if (improvement && recentErrors < earlyErrors) {
      pattern = 'improving';
    } else if (!improvement && recentErrors > earlyErrors) {
      pattern = 'struggling';
    }

    // Aktuelle Cluster-Info
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    res.json({
      pattern,
      currentCluster: userData?.cluster || 'unknown',
      clusterDescription: getClusterDescription(userData?.cluster || 'Typ_A'),
      metrics: {
        averageTime: avgTimeToday,
        averageErrors: recentErrors / 5,
        totalSessions: behaviorHistory.length,
        improvement: improvement ? 'verbessert' : 'stabil'
      },
      recommendations: getPatternRecommendations(pattern, userData?.cluster),
      chartData: behaviorHistory.map(b => ({
        timestamp: b.timestamp,
        avgTime: b.avgTime,
        errors: b.errors,
        moduleId: b.moduleId
      }))
    });

  } catch (error) {
    console.error('Learning-Pattern-Fehler:', error);
    res.status(500).json({ error: 'Fehler bei der Musteranalyse' });
  }
});

// Muster-spezifische Empfehlungen
function getPatternRecommendations(pattern, cluster) {
  const recommendations = {
    'improving': [
      'Fantastisch! Du machst große Fortschritte!',
      'Erhöhe die Schwierigkeit für mehr Herausforderung',
      'Versuche Risiko-Level für Bonuspunkte'
    ],
    'stable': [
      'Du lernst konstant - das ist großartig!',
      'Probiere verschiedene Module aus',
      'Achte auf Speed-Boni für Extrapunkte'
    ],
    'struggling': [
      'Keine Sorge - jeder lernt in seinem Tempo',
      'Nimm dir mehr Zeit für jede Frage',
      'Wiederhole schwierige Module'
    ]
  };

  return recommendations[pattern] || recommendations['stable'];
}

// Global Cluster-Statistiken (Admin)
router.get('/cluster-overview', async (req, res) => {
  try {
    // Admin-Check
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.data()?.isAdmin) {
      return res.status(403).json({ error: 'Admin-Berechtigung erforderlich' });
    }

    // Alle Benutzer-Cluster abrufen
    const usersSnapshot = await db.collection('users')
      .where('cluster', 'in', ['Typ_A', 'Typ_B', 'Typ_C'])
      .get();

    const clusterCounts = { 'Typ_A': 0, 'Typ_B': 0, 'Typ_C': 0 };
    const clusterPerformance = { 'Typ_A': [], 'Typ_B': [], 'Typ_C': [] };

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const cluster = userData.cluster;
      
      if (cluster) {
        clusterCounts[cluster]++;
        if (userData.totalPoints) {
          clusterPerformance[cluster].push(userData.totalPoints);
        }
      }
    });

    // Durchschnittsleistung pro Cluster
    const clusterAverages = {};
    Object.keys(clusterPerformance).forEach(cluster => {
      const points = clusterPerformance[cluster];
      clusterAverages[cluster] = points.length > 0 
        ? points.reduce((sum, p) => sum + p, 0) / points.length
        : 0;
    });

    res.json({
      totalUsers: usersSnapshot.size,
      clusterDistribution: clusterCounts,
      clusterAverages,
      recommendations: {
        'Typ_A': 'Biete fortgeschrittene Inhalte und komplexere Herausforderungen',
        'Typ_B': 'Nutze praktische Beispiele und ausgewogene Schwierigkeit',
        'Typ_C': 'Fokus auf visuelle Hilfsmittel und längere Zeitlimits'
      }
    });

  } catch (error) {
    console.error('Cluster-Overview-Fehler:', error);
    res.status(500).json({ error: 'Fehler bei der Cluster-Übersicht' });
  }
});

module.exports = router; 
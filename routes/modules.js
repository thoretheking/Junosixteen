const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

const db = admin.firestore();

// Alle Module abrufen
router.get('/', async (req, res) => {
  try {
    const { language = 'de' } = req.query;
    const uid = req.user.uid;

    // Benutzer-Info abrufen
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    const userLevel = userData?.level || 1;
    const userCluster = userData?.cluster || 'Typ_A';

    // Module abrufen
    const modulesSnapshot = await db.collection('modules')
      .orderBy('moduleId', 'asc')
      .get();

    const modules = [];
    
    for (const doc of modulesSnapshot.docs) {
      const moduleData = doc.data();
      const moduleId = moduleData.moduleId;

      // Verfügbarkeit prüfen (sequenziell)
      const isAvailable = moduleId <= userLevel;
      const isCompleted = userData?.progress?.completedModules?.includes(moduleId) || false;

      // Video-Info abrufen
      let videoInfo = null;
      if (moduleData.videoId) {
        const videoDoc = await db.collection('videos').doc(moduleData.videoId).get();
        if (videoDoc.exists) {
          const videoData = videoDoc.data();
          videoInfo = {
            id: moduleData.videoId,
            title: videoData.title,
            url: videoData.url,
            duration: videoData.duration,
            language: videoData.language
          };
        }
      }

      // Fragen für Modul abrufen
      const questionsSnapshot = await db.collection('questions')
        .where('moduleId', '==', moduleId)
        .where('language', '==', language)
        .where('isActive', '==', true)
        .get();

      const questions = [];
      questionsSnapshot.forEach(qDoc => {
        const qData = qDoc.data();
        questions.push({
          id: qDoc.id,
          question: qData.question,
          answers: qData.answers,
          level: qData.level,
          isRiskQuestion: qData.isRiskQuestion,
          timeLimit: qData.timeLimit || 30
        });
      });

      // Modul-Status bestimmen
      let status = 'locked';
      if (isCompleted) {
        status = 'completed';
      } else if (isAvailable) {
        status = 'available';
      } else if (moduleId === userLevel + 1) {
        status = 'next';
      }

      modules.push({
        id: doc.id,
        moduleId,
        title: moduleData.title?.[language] || moduleData.title?.de || `Modul ${moduleId}`,
        description: moduleData.description?.[language] || moduleData.description?.de || '',
        category: moduleData.category || 'general',
        difficulty: moduleData.difficulty || 'medium',
        estimatedTime: moduleData.estimatedTime || 5,
        points: moduleData.points || 200,
        isRiskLevel: [5, 10].includes(moduleId),
        status,
        isAvailable,
        isCompleted,
        videoInfo,
        questionCount: questions.length,
        questions: isAvailable ? questions : [], // Nur verfügbare Module zeigen Fragen
        theme: getModuleTheme(moduleId),
        adaptedForCluster: userCluster
      });
    }

    res.json({
      modules,
      userProgress: {
        currentLevel: userLevel,
        completedModules: userData?.progress?.completedModules || [],
        totalModules: modules.length,
        cluster: userCluster
      }
    });

  } catch (error) {
    console.error('Module-Abruf-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Module' });
  }
});

// Einzelnes Modul abrufen
router.get('/:moduleId', async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { language = 'de' } = req.query;
    const uid = req.user.uid;

    // Berechtigung prüfen
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    const userLevel = userData?.level || 1;

    if (parseInt(moduleId) > userLevel) {
      return res.status(403).json({ error: 'Modul noch nicht freigeschaltet' });
    }

    // Modul-Daten abrufen
    const moduleSnapshot = await db.collection('modules')
      .where('moduleId', '==', parseInt(moduleId))
      .limit(1)
      .get();

    if (moduleSnapshot.empty) {
      return res.status(404).json({ error: 'Modul nicht gefunden' });
    }

    const moduleDoc = moduleSnapshot.docs[0];
    const moduleData = moduleDoc.data();

    // Video-Info abrufen
    let videoInfo = null;
    if (moduleData.videoId) {
      const videoDoc = await db.collection('videos').doc(moduleData.videoId).get();
      if (videoDoc.exists) {
        const videoData = videoDoc.data();
        videoInfo = {
          id: moduleData.videoId,
          title: videoData.title,
          url: videoData.url,
          duration: videoData.duration,
          description: videoData.description
        };

        // Video-View-Count erhöhen
        await db.collection('videos').doc(moduleData.videoId).update({
          viewCount: admin.firestore.FieldValue.increment(1)
        });
      }
    }

    // Fragen abrufen (adaptive Auswahl basierend auf Cluster)
    const userCluster = userData?.cluster || 'Typ_A';
    let questionsQuery = db.collection('questions')
      .where('moduleId', '==', parseInt(moduleId))
      .where('language', '==', language)
      .where('isActive', '==', true);

    // Cluster-spezifische Fragen bevorzugen
    if (Math.random() > 0.3) { // 70% der Zeit cluster-spezifische Fragen
      questionsQuery = questionsQuery.where('cluster', '==', userCluster);
    }

    const questionsSnapshot = await questionsQuery.limit(10).get();
    
    // Falls keine cluster-spezifischen Fragen, allgemeine Fragen verwenden
    if (questionsSnapshot.empty) {
      const fallbackSnapshot = await db.collection('questions')
        .where('moduleId', '==', parseInt(moduleId))
        .where('language', '==', language)
        .where('isActive', '==', true)
        .limit(10)
        .get();
      
      const questions = [];
      fallbackSnapshot.forEach(doc => {
        const qData = doc.data();
        questions.push({
          id: doc.id,
          question: qData.question,
          answers: qData.answers,
          correctAnswer: qData.correctAnswer,
          explanation: qData.explanation,
          timeLimit: qData.timeLimit || 30,
          isRiskQuestion: qData.isRiskQuestion || false
        });
      });

      return res.json({
        module: {
          id: moduleDoc.id,
          moduleId: parseInt(moduleId),
          title: moduleData.title?.[language] || moduleData.title?.de,
          description: moduleData.description?.[language] || moduleData.description?.de,
          videoInfo,
          questions: shuffleArray(questions),
          theme: getModuleTheme(parseInt(moduleId)),
          isRiskLevel: [5, 10].includes(parseInt(moduleId))
        }
      });
    }

    const questions = [];
    questionsSnapshot.forEach(doc => {
      const qData = doc.data();
      questions.push({
        id: doc.id,
        question: qData.question,
        answers: qData.answers,
        correctAnswer: qData.correctAnswer,
        explanation: qData.explanation,
        timeLimit: qData.timeLimit || 30,
        isRiskQuestion: qData.isRiskQuestion || false
      });
    });

    res.json({
      module: {
        id: moduleDoc.id,
        moduleId: parseInt(moduleId),
        title: moduleData.title?.[language] || moduleData.title?.de,
        description: moduleData.description?.[language] || moduleData.description?.de,
        videoInfo,
        questions: shuffleArray(questions),
        theme: getModuleTheme(parseInt(moduleId)),
        isRiskLevel: [5, 10].includes(parseInt(moduleId)),
        adaptedFor: userCluster
      }
    });

  } catch (error) {
    console.error('Einzelmodul-Abruf-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Moduls' });
  }
});

// Modul als abgeschlossen markieren
router.post('/:moduleId/complete', async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { score, timeSpent, correctAnswers, totalQuestions } = req.body;
    const uid = req.user.uid;

    // Mindestanforderungen prüfen
    const passingScore = 0.7; // 70% richtige Antworten erforderlich
    const actualScore = correctAnswers / totalQuestions;

    if (actualScore < passingScore) {
      return res.status(400).json({ 
        error: 'Mindestpunktzahl nicht erreicht',
        required: passingScore,
        achieved: actualScore,
        message: 'Du benötigst mindestens 70% richtige Antworten um das Modul abzuschließen.'
      });
    }

    // Benutzer-Daten aktualisieren
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    const currentCompleted = userData?.progress?.completedModules || [];
    const moduleIdInt = parseInt(moduleId);

    // Prüfen ob Modul bereits abgeschlossen
    if (currentCompleted.includes(moduleIdInt)) {
      return res.status(400).json({ error: 'Modul bereits abgeschlossen' });
    }

    // Completion-Record erstellen
    await db.collection('moduleCompletions').add({
      uid,
      moduleId: moduleIdInt,
      score: actualScore,
      timeSpent,
      correctAnswers,
      totalQuestions,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      points: score || 0
    });

    // Benutzer-Fortschritt aktualisieren
    await userRef.update({
      'progress.completedModules': admin.firestore.FieldValue.arrayUnion(moduleIdInt),
      'progress.currentModule': Math.min(moduleIdInt + 1, 10),
      lastActivity: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Modul erfolgreich abgeschlossen!',
      score: actualScore,
      moduleId: moduleIdInt,
      nextModule: Math.min(moduleIdInt + 1, 10),
      certificateEligible: currentCompleted.length + 1 >= 10
    });

  } catch (error) {
    console.error('Modul-Completion-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Abschließen des Moduls' });
  }
});

// Modul-Statistiken abrufen
router.get('/:moduleId/stats', async (req, res) => {
  try {
    const { moduleId } = req.params;

    // Completion-Statistiken
    const completionsSnapshot = await db.collection('moduleCompletions')
      .where('moduleId', '==', parseInt(moduleId))
      .get();

    let totalCompletions = 0;
    let totalScore = 0;
    let totalTime = 0;
    const scores = [];

    completionsSnapshot.forEach(doc => {
      const data = doc.data();
      totalCompletions++;
      totalScore += data.score;
      totalTime += data.timeSpent;
      scores.push(data.score);
    });

    // Durchschnittswerte berechnen
    const avgScore = totalCompletions > 0 ? totalScore / totalCompletions : 0;
    const avgTime = totalCompletions > 0 ? totalTime / totalCompletions : 0;

    // Schwierigkeitsverteilung
    const excellentCount = scores.filter(s => s >= 0.9).length;
    const goodCount = scores.filter(s => s >= 0.8 && s < 0.9).length;
    const passCount = scores.filter(s => s >= 0.7 && s < 0.8).length;
    const failCount = scores.filter(s => s < 0.7).length;

    res.json({
      moduleId: parseInt(moduleId),
      totalCompletions,
      averageScore: avgScore,
      averageTime: avgTime,
      distribution: {
        excellent: excellentCount,
        good: goodCount,
        pass: passCount,
        fail: failCount
      },
      theme: getModuleTheme(parseInt(moduleId))
    });

  } catch (error) {
    console.error('Modul-Stats-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Statistiken' });
  }
});

// Hilfsfunktionen

function getModuleTheme(moduleId) {
  const themes = {
    1: { color: '#3B82F6', icon: '👋', theme: 'Händehygiene und Grundlagen' },
    2: { color: '#3B82F6', icon: '🚽', theme: 'Toiletten-Hygiene' },
    3: { color: '#3B82F6', icon: '🔧', theme: 'Arbeitsplatz-Sicherheit' },
    4: { color: '#3B82F6', icon: '👥', theme: 'Teamwork und Kommunikation' },
    5: { color: '#F59E0B', icon: '⚠️', theme: 'RISIKO: Notfall-Situationen' },
    6: { color: '#3B82F6', icon: '✅', theme: 'Qualitätskontrolle' },
    7: { color: '#3B82F6', icon: '🔒', theme: 'Datenschutz und Compliance' },
    8: { color: '#3B82F6', icon: '😊', theme: 'Kundenservice' },
    9: { color: '#3B82F6', icon: '👑', theme: 'Führung und Verantwortung' },
    10: { color: '#EF4444', icon: '🏆', theme: 'FINALES RISIKO: Gesamtverständnis' }
  };
  
  return themes[moduleId] || themes[1];
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Seed-Daten für Module erstellen (nur für Entwicklung)
router.post('/seed', async (req, res) => {
  try {
    // Admin-Check
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.data()?.isAdmin) {
      return res.status(403).json({ error: 'Admin-Berechtigung erforderlich' });
    }

    const modules = [
      {
        moduleId: 1,
        title: { de: 'Händehygiene Grundlagen', en: 'Hand Hygiene Basics' },
        description: { de: 'Lernen Sie die Grundlagen der Händehygiene', en: 'Learn the basics of hand hygiene' },
        category: 'hygiene',
        difficulty: 'easy',
        estimatedTime: 3,
        points: 200
      },
      {
        moduleId: 2,
        title: { de: 'Toiletten-Hygiene', en: 'Toilet Hygiene' },
        description: { de: 'Wichtige Hygieneregeln für Toilettenbereiche', en: 'Important hygiene rules for toilet areas' },
        category: 'hygiene',
        difficulty: 'easy',
        estimatedTime: 3,
        points: 300
      },
      // Weitere Module können hier hinzugefügt werden...
    ];

    const batch = db.batch();
    modules.forEach(module => {
      const moduleRef = db.collection('modules').doc();
      batch.set(moduleRef, {
        ...module,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true
      });
    });

    await batch.commit();

    res.json({
      message: 'Module-Seed-Daten erfolgreich erstellt',
      count: modules.length
    });

  } catch (error) {
    console.error('Module-Seed-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Seed-Daten' });
  }
});

module.exports = router; 
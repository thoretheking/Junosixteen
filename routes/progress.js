const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

const db = admin.firestore();

// Benutzer-Fortschritt abrufen
router.get('/', async (req, res) => {
  try {
    const uid = req.user.uid;

    // Benutzer-Daten abrufen
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    const userData = userDoc.data();
    const currentLevel = userData.level || 1;
    const completedModules = userData.progress?.completedModules || [];
    const totalPoints = userData.totalPoints || 0;
    const currentPoints = userData.currentPoints || 0;

    // Deadline-Status prüfen
    let deadlineInfo = null;
    if (userData.deadlineEnd) {
      const now = new Date();
      const deadline = userData.deadlineEnd.toDate();
      const timeRemaining = deadline.getTime() - now.getTime();
      
      deadlineInfo = {
        deadline,
        timeRemaining,
        isExpired: timeRemaining <= 0,
        daysRemaining: Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)),
        formattedDeadline: deadline.toLocaleDateString('de-DE')
      };
    }

    // Modul-Completion-Details abrufen
    const completionsSnapshot = await db.collection('moduleCompletions')
      .where('uid', '==', uid)
      .orderBy('completedAt', 'desc')
      .get();

    const completionDetails = [];
    completionsSnapshot.forEach(doc => {
      const data = doc.data();
      completionDetails.push({
        moduleId: data.moduleId,
        score: data.score,
        timeSpent: data.timeSpent,
        completedAt: data.completedAt,
        points: data.points
      });
    });

    // Fortschritts-Berechnung
    const totalModules = 10;
    const progressPercentage = (completedModules.length / totalModules) * 100;
    const nextModule = Math.min(currentLevel + 1, totalModules);

    // Achievements/Badges
    const badges = userData.badges || [];
    const availableBadges = [
      { id: 'first_correct', name: 'Erste richtige Antwort', icon: '🎯' },
      { id: 'speed_demon', name: 'Blitzschnell', icon: '⚡' },
      { id: 'perfectionist', name: '5 perfekte Antworten', icon: '💎' },
      { id: 'risk_taker', name: 'Risiko-Level gemeistert', icon: '🔥' },
      { id: 'survivor', name: 'Risiko überlebt', icon: '🛡️' },
      { id: 'champion', name: 'Level 10 erreicht', icon: '👑' }
    ];

    const earnedBadges = availableBadges.filter(badge => badges.includes(badge.id));
    const unearnedBadges = availableBadges.filter(badge => !badges.includes(badge.id));

    // Lernstreak berechnen
    const streak = await calculateLearningStreak(uid);

    res.json({
      progress: {
        currentLevel,
        completedModules,
        totalModules,
        progressPercentage,
        nextModule,
        totalPoints,
        currentPoints,
        completionDetails
      },
      badges: {
        earned: earnedBadges,
        unearned: unearnedBadges,
        total: earnedBadges.length
      },
      streak,
      deadlineInfo,
      cluster: userData.cluster || 'Typ_A',
      certificateEligible: completedModules.length >= totalModules,
      lastActivity: userData.lastActivity
    });

  } catch (error) {
    console.error('Progress-Abruf-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Fortschritts' });
  }
});

// Lernstreak berechnen
async function calculateLearningStreak(uid) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let currentDate = new Date(today);
  let hasActivityToday = false;

  // Prüfe die letzten 30 Tage auf Aktivität
  for (let i = 0; i < 30; i++) {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const activitySnapshot = await db.collection('moduleCompletions')
      .where('uid', '==', uid)
      .where('completedAt', '>=', admin.firestore.Timestamp.fromDate(currentDate))
      .where('completedAt', '<', admin.firestore.Timestamp.fromDate(nextDay))
      .limit(1)
      .get();

    if (!activitySnapshot.empty) {
      if (i === 0) hasActivityToday = true;
      streak++;
    } else {
      // Wenn kein heutiger Tag, aber Streak vorhanden, dann brechen
      if (i > 0 || hasActivityToday) break;
    }

    currentDate.setDate(currentDate.getDate() - 1);
  }

  return {
    days: streak,
    hasActivityToday,
    message: streak > 1 ? `${streak} Tage in Folge!` : streak === 1 ? 'Erster Tag!' : 'Noch kein Streak'
  };
}

// Zertifikat generieren
router.post('/certificate', async (req, res) => {
  try {
    const uid = req.user.uid;
    const { language = 'de' } = req.body;

    // Berechtigung prüfen
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    
    if (!userData) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    const completedModules = userData.progress?.completedModules || [];
    if (completedModules.length < 10) {
      return res.status(400).json({ 
        error: 'Zertifikat noch nicht verfügbar',
        completed: completedModules.length,
        required: 10
      });
    }

    // Prüfe ob bereits ein Zertifikat existiert
    const existingCertSnapshot = await db.collection('certificates')
      .where('uid', '==', uid)
      .limit(1)
      .get();

    let certificate;
    if (!existingCertSnapshot.empty) {
      // Existierendes Zertifikat
      certificate = existingCertSnapshot.docs[0].data();
    } else {
      // Neues Zertifikat erstellen
      const certificateData = {
        uid,
        userName: userData.displayName || userData.email,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        level: userData.level,
        totalPoints: userData.totalPoints,
        language,
        certificateId: generateCertificateId(),
        isValid: true,
        modules: completedModules
      };

      const certificateRef = await db.collection('certificates').add(certificateData);
      certificate = { id: certificateRef.id, ...certificateData };
    }

    // Zertifikat-Daten zusammenstellen
    const certificateContent = {
      id: certificate.id,
      certificateId: certificate.certificateId,
      userName: certificate.userName,
      completedAt: certificate.completedAt,
      level: certificate.level,
      totalPoints: certificate.totalPoints,
      language: certificate.language,
      title: getCertificateTitle(language),
      description: getCertificateDescription(language),
      signature: 'JunoSixteen Learning Platform',
      downloadUrl: `/certificates/${certificate.certificateId}.pdf`
    };

    res.json({
      success: true,
      certificate: certificateContent,
      message: language === 'de' ? 'Zertifikat erfolgreich generiert!' : 'Certificate generated successfully!'
    });

  } catch (error) {
    console.error('Zertifikat-Generation-Fehler:', error);
    res.status(500).json({ error: 'Fehler bei der Zertifikatserstellung' });
  }
});

// Zertifikat-ID generieren
function generateCertificateId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'JUNO-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Zertifikat-Titel basierend auf Sprache
function getCertificateTitle(language) {
  const titles = {
    de: 'Zertifikat für erfolgreiche Teilnahme',
    en: 'Certificate of Successful Completion',
    es: 'Certificado de Finalización Exitosa',
    fr: 'Certificat de Réussite',
    it: 'Certificato di Completamento',
    pt: 'Certificado de Conclusão',
    nl: 'Certificaat van Voltooiing'
  };
  return titles[language] || titles.de;
}

// Zertifikat-Beschreibung basierend auf Sprache
function getCertificateDescription(language) {
  const descriptions = {
    de: 'hat erfolgreich alle 10 Module der JunoSixteen Schulungsplattform abgeschlossen',
    en: 'has successfully completed all 10 modules of the JunoSixteen training platform',
    es: 'ha completado exitosamente los 10 módulos de la plataforma de capacitación JunoSixteen',
    fr: 'a terminé avec succès les 10 modules de la plateforme de formation JunoSixteen',
    it: 'ha completato con successo tutti i 10 moduli della piattaforma di formazione JunoSixteen',
    pt: 'concluiu com sucesso todos os 10 módulos da plataforma de treinamento JunoSixteen',
    nl: 'heeft succesvol alle 10 modules van het JunoSixteen trainingsplatform voltooid'
  };
  return descriptions[language] || descriptions.de;
}

// Detaillierte Statistiken
router.get('/stats', async (req, res) => {
  try {
    const uid = req.user.uid;
    const { timeframe = '30d' } = req.query;

    // Zeitraum berechnen
    const now = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
    }

    // Aktivitätsdaten abrufen
    const completionsSnapshot = await db.collection('moduleCompletions')
      .where('uid', '==', uid)
      .where('completedAt', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .orderBy('completedAt', 'asc')
      .get();

    // Verhaltensdaten abrufen
    const behaviorSnapshot = await db.collection('userBehavior')
      .where('uid', '==', uid)
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .orderBy('timestamp', 'asc')
      .get();

    // Statistiken berechnen
    const completions = [];
    let totalTimeSpent = 0;
    let totalQuestions = 0;
    let correctAnswers = 0;

    completionsSnapshot.forEach(doc => {
      const data = doc.data();
      completions.push({
        date: data.completedAt.toDate().toISOString().split('T')[0],
        moduleId: data.moduleId,
        score: data.score,
        timeSpent: data.timeSpent
      });
      totalTimeSpent += data.timeSpent;
      totalQuestions += data.totalQuestions || 0;
      correctAnswers += data.correctAnswers || 0;
    });

    const behaviorData = [];
    behaviorSnapshot.forEach(doc => {
      const data = doc.data();
      behaviorData.push({
        date: data.timestamp.toDate().toISOString().split('T')[0],
        avgTime: data.avgTime,
        errors: data.errors,
        clicks: data.clicks
      });
    });

    // Durchschnittswerte
    const avgAccuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const avgTimePerModule = completions.length > 0 ? totalTimeSpent / completions.length : 0;

    // Trend-Analyse
    const recentCompletions = completions.slice(-5);
    const earlyCompletions = completions.slice(0, 5);
    
    const recentAvgScore = recentCompletions.length > 0 
      ? recentCompletions.reduce((sum, c) => sum + c.score, 0) / recentCompletions.length 
      : 0;
    
    const earlyAvgScore = earlyCompletions.length > 0 
      ? earlyCompletions.reduce((sum, c) => sum + c.score, 0) / earlyCompletions.length 
      : 0;

    const trend = recentAvgScore > earlyAvgScore ? 'improving' : 
                  recentAvgScore < earlyAvgScore ? 'declining' : 'stable';

    res.json({
      timeframe,
      summary: {
        totalCompletions: completions.length,
        totalTimeSpent,
        avgAccuracy,
        avgTimePerModule,
        trend
      },
      chartData: {
        completions,
        behavior: behaviorData
      },
      insights: generateInsights(completions, behaviorData, trend)
    });

  } catch (error) {
    console.error('Progress-Stats-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Statistiken' });
  }
});

// Insights generieren
function generateInsights(completions, behaviorData, trend) {
  const insights = [];

  if (trend === 'improving') {
    insights.push({
      type: 'positive',
      message: 'Deine Leistung verbessert sich stetig!',
      icon: '📈'
    });
  }

  if (completions.length >= 5) {
    insights.push({
      type: 'achievement',
      message: `Du hast bereits ${completions.length} Module abgeschlossen!`,
      icon: '🏆'
    });
  }

  if (behaviorData.length > 0) {
    const avgErrors = behaviorData.reduce((sum, b) => sum + b.errors, 0) / behaviorData.length;
    if (avgErrors < 1) {
      insights.push({
        type: 'positive',
        message: 'Du machst sehr wenige Fehler - weiter so!',
        icon: '💎'
      });
    }
  }

  return insights;
}

// Rangliste für Benutzer
router.get('/leaderboard', async (req, res) => {
  try {
    const { type = 'points', limit = 10 } = req.query;
    const uid = req.user.uid;

    let orderField = 'totalPoints';
    if (type === 'level') orderField = 'level';
    if (type === 'modules') orderField = 'progress.completedModules';

    const usersSnapshot = await db.collection('users')
      .orderBy(orderField, 'desc')
      .limit(parseInt(limit))
      .get();

    const leaderboard = [];
    let userRank = null;

    usersSnapshot.forEach((doc, index) => {
      const userData = doc.data();
      const entry = {
        rank: index + 1,
        uid: doc.id,
        displayName: userData.displayName || 'Anonym',
        avatar: userData.avatar,
        totalPoints: userData.totalPoints || 0,
        level: userData.level || 1,
        completedModules: userData.progress?.completedModules?.length || 0,
        badges: userData.badges?.length || 0
      };

      if (doc.id === uid) {
        userRank = entry;
      }

      leaderboard.push(entry);
    });

    // Falls Benutzer nicht in Top-Liste, eigene Position finden
    if (!userRank) {
      const userPosition = await findUserPosition(uid, orderField);
      userRank = userPosition;
    }

    res.json({
      leaderboard,
      userRank,
      type
    });

  } catch (error) {
    console.error('Leaderboard-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Rangliste' });
  }
});

// Benutzer-Position in Rangliste finden
async function findUserPosition(uid, orderField) {
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) return null;

  const userData = userDoc.data();
  const userValue = userData[orderField] || 0;

  const higherUsersSnapshot = await db.collection('users')
    .where(orderField, '>', userValue)
    .get();

  return {
    rank: higherUsersSnapshot.size + 1,
    uid,
    displayName: userData.displayName || 'Anonym',
    avatar: userData.avatar,
    totalPoints: userData.totalPoints || 0,
    level: userData.level || 1,
    completedModules: userData.progress?.completedModules?.length || 0,
    badges: userData.badges?.length || 0
  };
}

module.exports = router; 
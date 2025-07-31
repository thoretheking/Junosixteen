const express = require('express');
const admin = require('firebase-admin');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const db = admin.firestore();
const storage = admin.storage();

// Multer-Konfiguration für File-Uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB Limit
  },
  fileFilter: (req, file, cb) => {
    // Video-Formate
    if (file.fieldname === 'video') {
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
      if (allowedVideoTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Nur MP4, WebM und OGG Video-Dateien sind erlaubt'), false);
      }
    }
    // Fragekatalog-Formate
    else if (file.fieldname === 'questions') {
      const allowedFileTypes = ['text/csv', 'application/json', 'text/plain'];
      if (allowedFileTypes.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
        cb(null, true);
      } else {
        cb(new Error('Nur CSV und JSON-Dateien sind erlaubt'), false);
      }
    } else {
      cb(null, true);
    }
  }
});

// Admin-Berechtigung prüfen
const checkAdminAuth = async (req, res, next) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();
    
    if (!userData?.isAdmin) {
      return res.status(403).json({ error: 'Admin-Berechtigung erforderlich' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Fehler bei der Berechtigungsprüfung' });
  }
};

// Video für Modul hochladen
router.post('/upload-video', checkAdminAuth, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Keine Video-Datei hochgeladen' });
    }

    const { moduleId, title, description, language = 'de' } = req.body;
    
    if (!moduleId || !title) {
      return res.status(400).json({ error: 'ModuleId und Titel sind erforderlich' });
    }

    // Video zu Firebase Storage hochladen
    const fileName = `videos/${moduleId}_${Date.now()}_${req.file.originalname}`;
    const file = storage.bucket().file(fileName);
    
    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
        metadata: {
          moduleId,
          title,
          uploadedBy: req.user.uid,
          uploadedAt: new Date().toISOString()
        }
      }
    });

    stream.on('error', (error) => {
      console.error('Upload-Fehler:', error);
      res.status(500).json({ error: 'Video-Upload fehlgeschlagen' });
    });

    stream.on('finish', async () => {
      try {
        // Video-URL generieren
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '03-01-2500' // Langfristige URL
        });

        // Video-Metadaten in Firestore speichern
        const videoData = {
          moduleId: parseInt(moduleId),
          title,
          description: description || '',
          language,
          fileName,
          url,
          duration: null, // Wird später durch Frontend-Analyse gefüllt
          uploadedBy: req.user.uid,
          uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
          isActive: true,
          viewCount: 0
        };

        const videoRef = await db.collection('videos').add(videoData);

        // Modul aktualisieren
        await db.collection('modules').doc(moduleId).update({
          videoId: videoRef.id,
          hasVideo: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({
          message: 'Video erfolgreich hochgeladen',
          videoId: videoRef.id,
          url,
          fileName
        });

      } catch (dbError) {
        console.error('Datenbank-Fehler:', dbError);
        res.status(500).json({ error: 'Fehler beim Speichern der Video-Metadaten' });
      }
    });

    stream.end(req.file.buffer);

  } catch (error) {
    console.error('Video-Upload-Fehler:', error);
    res.status(500).json({ error: 'Video-Upload fehlgeschlagen' });
  }
});

// Fragekatalog hochladen
router.post('/upload-questions', checkAdminAuth, upload.single('questions'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Keine Datei hochgeladen' });
    }

    const { moduleId, language = 'de', replace = false } = req.body;
    let questions = [];

    // CSV-Parsing
    if (req.file.mimetype === 'text/csv' || req.file.originalname.endsWith('.csv')) {
      const csvString = req.file.buffer.toString('utf8');
      const csvLines = csvString.split('\n');
      
      for (let i = 1; i < csvLines.length; i++) { // Skip header
        const line = csvLines[i].trim();
        if (line) {
          const columns = line.split(',').map(col => col.replace(/"/g, '').trim());
          
          if (columns.length >= 6) {
            questions.push({
              moduleId: moduleId ? parseInt(moduleId) : parseInt(columns[0]),
              question: columns[1],
              answers: [columns[2], columns[3], columns[4], columns[5]],
              correctAnswer: parseInt(columns[6]) || 0,
              language: language,
              level: parseInt(columns[7]) || 1,
              isRiskQuestion: columns[8]?.toLowerCase() === 'true' || false,
              timeLimit: parseInt(columns[9]) || 30,
              points: parseInt(columns[10]) || 100
            });
          }
        }
      }
    }
    // JSON-Parsing
    else if (req.file.mimetype === 'application/json') {
      const jsonData = JSON.parse(req.file.buffer.toString('utf8'));
      questions = Array.isArray(jsonData) ? jsonData : jsonData.questions || [];
    }

    if (questions.length === 0) {
      return res.status(400).json({ error: 'Keine gültigen Fragen in der Datei gefunden' });
    }

    // Validierung
    const validQuestions = questions.filter(q => 
      q.question && 
      q.answers && 
      q.answers.length === 4 && 
      q.correctAnswer !== undefined &&
      q.correctAnswer >= 0 && 
      q.correctAnswer < 4
    );

    if (validQuestions.length === 0) {
      return res.status(400).json({ error: 'Keine gültigen Fragen gefunden' });
    }

    // Bestehende Fragen löschen falls replace = true
    if (replace && moduleId) {
      const existingQuestionsSnapshot = await db.collection('questions')
        .where('moduleId', '==', parseInt(moduleId))
        .get();
      
      const batch = db.batch();
      existingQuestionsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    // Neue Fragen speichern
    const batch = db.batch();
    const uploadedQuestions = [];

    for (const question of validQuestions) {
      const questionData = {
        ...question,
        uploadedBy: req.user.uid,
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true,
        usageCount: 0
      };

      const questionRef = db.collection('questions').doc();
      batch.set(questionRef, questionData);
      uploadedQuestions.push({ id: questionRef.id, ...questionData });
    }

    await batch.commit();

    // Statistik aktualisieren
    await db.collection('uploadStats').add({
      type: 'questions',
      moduleId: moduleId ? parseInt(moduleId) : null,
      fileName: req.file.originalname,
      questionCount: validQuestions.length,
      language,
      uploadedBy: req.user.uid,
      uploadedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      message: 'Fragekatalog erfolgreich hochgeladen',
      uploaded: validQuestions.length,
      skipped: questions.length - validQuestions.length,
      questions: uploadedQuestions.map(q => ({
        id: q.id,
        question: q.question,
        moduleId: q.moduleId,
        level: q.level
      }))
    });

  } catch (error) {
    console.error('Fragekatalog-Upload-Fehler:', error);
    res.status(500).json({ error: 'Fragekatalog-Upload fehlgeschlagen', details: error.message });
  }
});

// Admin Dashboard - Übersicht
router.get('/dashboard', checkAdminAuth, async (req, res) => {
  try {
    // Benutzer-Statistiken
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;
    let activeUsers = 0;
    let completedUsers = 0;
    
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.lastActivity && userData.lastActivity.toDate() > oneDayAgo) {
        activeUsers++;
      }
      if (userData.level === 10 && userData.progress?.completedModules?.length >= 10) {
        completedUsers++;
      }
    });

    // Modul-Statistiken
    const modulesSnapshot = await db.collection('modules').get();
    const totalModules = modulesSnapshot.size;

    // Fragen-Statistiken
    const questionsSnapshot = await db.collection('questions').get();
    const totalQuestions = questionsSnapshot.size;

    // Video-Statistiken
    const videosSnapshot = await db.collection('videos').get();
    const totalVideos = videosSnapshot.size;

    // Aktuelle Deadlines
    const deadlinesSnapshot = await db.collection('deadlines')
      .where('isActive', '==', true)
      .orderBy('endDate', 'asc')
      .limit(5)
      .get();

    const activeDeadlines = [];
    deadlinesSnapshot.forEach(doc => {
      activeDeadlines.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          completed: completedUsers,
          completionRate: totalUsers > 0 ? (completedUsers / totalUsers * 100).toFixed(1) : 0
        },
        content: {
          modules: totalModules,
          questions: totalQuestions,
          videos: totalVideos
        }
      },
      activeDeadlines,
      recentUploads: {
        questions: await getRecentUploads('questions'),
        videos: await getRecentUploads('videos')
      }
    });

  } catch (error) {
    console.error('Dashboard-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Dashboards' });
  }
});

// Hilfsfunktion für letzte Uploads
async function getRecentUploads(type, limit = 5) {
  const snapshot = await db.collection(type)
    .orderBy('uploadedAt', 'desc')
    .limit(limit)
    .get();
  
  const uploads = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    uploads.push({
      id: doc.id,
      name: type === 'questions' ? data.question?.substring(0, 50) + '...' : data.title,
      uploadedAt: data.uploadedAt,
      moduleId: data.moduleId
    });
  });
  
  return uploads;
}

// Alle Benutzer verwalten
router.get('/users', checkAdminAuth, async (req, res) => {
  try {
    const { limit = 50, orderBy = 'createdAt', order = 'desc' } = req.query;
    
    const usersSnapshot = await db.collection('users')
      .orderBy(orderBy, order)
      .limit(parseInt(limit))
      .get();

    const users = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        uid: doc.id,
        email: userData.email,
        displayName: userData.displayName,
        level: userData.level,
        totalPoints: userData.totalPoints,
        progress: userData.progress,
        lastActivity: userData.lastActivity,
        createdAt: userData.createdAt,
        deadlineStatus: getDeadlineStatus(userData)
      });
    });

    res.json({ users });

  } catch (error) {
    console.error('User-Management-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Benutzer' });
  }
});

// Deadline-Status prüfen
function getDeadlineStatus(userData) {
  if (!userData.deadlineEnd) return 'not_set';
  
  const now = new Date();
  const deadline = userData.deadlineEnd.toDate();
  
  if (now > deadline) return 'expired';
  if (userData.level >= 10) return 'completed';
  return 'active';
}

// Benutzer-Deadline setzen
router.post('/set-deadline/:uid', checkAdminAuth, async (req, res) => {
  try {
    const { uid } = req.params;
    const { deadlineMode, daysAfterStart, startDate, endDate } = req.body;

    let calculatedStartDate, calculatedEndDate;

    if (deadlineMode === 'relative') {
      calculatedStartDate = new Date();
      calculatedEndDate = new Date();
      calculatedEndDate.setDate(calculatedEndDate.getDate() + parseInt(daysAfterStart));
    } else if (deadlineMode === 'absolute') {
      calculatedStartDate = new Date(startDate);
      calculatedEndDate = new Date(endDate);
    } else {
      return res.status(400).json({ error: 'Ungültiger Deadline-Modus' });
    }

    await db.collection('users').doc(uid).update({
      deadlineStart: admin.firestore.Timestamp.fromDate(calculatedStartDate),
      deadlineEnd: admin.firestore.Timestamp.fromDate(calculatedEndDate),
      deadlineMode,
      deadlineSetBy: req.user.uid,
      deadlineSetAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      message: 'Deadline erfolgreich gesetzt',
      uid,
      startDate: calculatedStartDate,
      endDate: calculatedEndDate
    });

  } catch (error) {
    console.error('Deadline-Set-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Setzen der Deadline' });
  }
});

// Content-Management - Module
router.get('/modules', checkAdminAuth, async (req, res) => {
  try {
    const modulesSnapshot = await db.collection('modules').orderBy('moduleId', 'asc').get();
    const modules = [];

    for (const doc of modulesSnapshot.docs) {
      const moduleData = doc.data();
      
      // Fragen-Count für Modul
      const questionsSnapshot = await db.collection('questions')
        .where('moduleId', '==', moduleData.moduleId)
        .get();
      
      // Video-Info
      let videoInfo = null;
      if (moduleData.videoId) {
        const videoDoc = await db.collection('videos').doc(moduleData.videoId).get();
        if (videoDoc.exists) {
          videoInfo = videoDoc.data();
        }
      }

      modules.push({
        id: doc.id,
        ...moduleData,
        questionCount: questionsSnapshot.size,
        videoInfo
      });
    }

    res.json({ modules });

  } catch (error) {
    console.error('Module-Management-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Module' });
  }
});

module.exports = router; 
const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

const db = admin.firestore();
const auth = admin.auth();

// Benutzer registrieren
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName, language = 'de', avatar = 'default' } = req.body;

    // Firebase User erstellen
    const userRecord = await auth.createUser({
      email,
      password,
      displayName
    });

    // User-Profil in Firestore speichern
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName,
      language,
      avatar,
      level: 1,
      totalPoints: 0,
      currentPoints: 0,
      cluster: null,
      badges: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      deadlineStart: null,
      deadlineEnd: null,
      isAdmin: false,
      progress: {
        completedModules: [],
        currentModule: 1,
        totalModules: 10
      }
    });

    res.status(201).json({
      message: 'Benutzer erfolgreich registriert',
      uid: userRecord.uid,
      email: userRecord.email
    });

  } catch (error) {
    console.error('Registrierungsfehler:', error);
    res.status(400).json({ 
      error: 'Registrierung fehlgeschlagen', 
      details: error.message 
    });
  }
});

// Benutzer anmelden
router.post('/login', async (req, res) => {
  try {
    const { idToken } = req.body;

    // Token verifizieren
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // User-Daten aus Firestore abrufen
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Benutzerprofil nicht gefunden' });
    }

    const userData = userDoc.data();
    
    // Deadline-Status prüfen
    const now = new Date();
    let deadlineStatus = 'active';
    
    if (userData.deadlineEnd && now > userData.deadlineEnd.toDate()) {
      deadlineStatus = 'expired';
    }

    res.json({
      message: 'Anmeldung erfolgreich',
      user: {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        language: userData.language,
        avatar: userData.avatar,
        level: userData.level,
        totalPoints: userData.totalPoints,
        currentPoints: userData.currentPoints,
        progress: userData.progress,
        deadlineStatus,
        isAdmin: userData.isAdmin || false
      }
    });

  } catch (error) {
    console.error('Anmeldungsfehler:', error);
    res.status(401).json({ 
      error: 'Anmeldung fehlgeschlagen', 
      details: error.message 
    });
  }
});

// Benutzerprofil aktualisieren
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const { language, avatar, displayName } = req.body;
    const updates = {};

    if (language) updates.language = language;
    if (avatar) updates.avatar = avatar;
    if (displayName) updates.displayName = displayName;
    
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('users').doc(uid).update(updates);

    res.json({
      message: 'Profil erfolgreich aktualisiert',
      updates
    });

  } catch (error) {
    console.error('Profil-Update-Fehler:', error);
    res.status(400).json({ 
      error: 'Profil-Update fehlgeschlagen', 
      details: error.message 
    });
  }
});

// Verfügbare Avatare abrufen
router.get('/avatars', (req, res) => {
  const avatars = [
    { id: 'manga_1', name: 'Manga Style 1', category: 'manga', image: '/avatars/manga_1.png' },
    { id: 'manga_2', name: 'Manga Style 2', category: 'manga', image: '/avatars/manga_2.png' },
    { id: 'realistic_1', name: 'Realistisch 1', category: 'realistic', image: '/avatars/realistic_1.png' },
    { id: 'realistic_2', name: 'Realistisch 2', category: 'realistic', image: '/avatars/realistic_2.png' },
    { id: 'comic_1', name: 'Comic Style 1', category: 'comic', image: '/avatars/comic_1.png' },
    { id: 'comic_2', name: 'Comic Style 2', category: 'comic', image: '/avatars/comic_2.png' },
    { id: 'business_1', name: 'Business 1', category: 'business', image: '/avatars/business_1.png' },
    { id: 'business_2', name: 'Business 2', category: 'business', image: '/avatars/business_2.png' }
  ];

  res.json({ avatars });
});

// Verfügbare Sprachen abrufen
router.get('/languages', (req, res) => {
  const languages = [
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' }
  ];

  res.json({ languages });
});

module.exports = router; 
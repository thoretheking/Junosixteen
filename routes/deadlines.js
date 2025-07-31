const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

const db = admin.firestore();

// Deadline-Status prüfen
router.get('/check', async (req, res) => {
  try {
    const uid = req.user.uid;

    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    const userData = userDoc.data();
    const now = new Date();

    let deadlineStatus = {
      hasDeadline: false,
      isExpired: false,
      timeRemaining: 0,
      daysRemaining: 0,
      canExtend: false,
      status: 'none'
    };

    if (userData.deadlineEnd) {
      const deadline = userData.deadlineEnd.toDate();
      const timeRemaining = deadline.getTime() - now.getTime();
      const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

      deadlineStatus = {
        hasDeadline: true,
        deadline,
        deadlineStart: userData.deadlineStart?.toDate(),
        isExpired: timeRemaining <= 0,
        timeRemaining: Math.max(0, timeRemaining),
        daysRemaining: Math.max(0, daysRemaining),
        canExtend: userData.allowExtension !== false,
        deadlineMode: userData.deadlineMode || 'absolute',
        setBy: userData.deadlineSetBy,
        formattedDeadline: deadline.toLocaleDateString('de-DE'),
        status: timeRemaining <= 0 ? 'expired' : 
                daysRemaining <= 1 ? 'urgent' : 
                daysRemaining <= 3 ? 'warning' : 'active'
      };

      // Warnung bei abgelaufener Deadline
      if (deadlineStatus.isExpired && userData.level < 10) {
        const onMissedDeadline = userData.deadlineConfig?.onMissedDeadline || 'warning';
        
        switch (onMissedDeadline) {
          case 'reset':
            // Fortschritt zurücksetzen
            await resetUserProgress(uid, 'deadline_expired');
            deadlineStatus.action = 'progress_reset';
            deadlineStatus.message = 'Dein Fortschritt wurde aufgrund der abgelaufenen Frist zurückgesetzt.';
            break;
          case 'soft-lock':
            deadlineStatus.action = 'soft_lock';
            deadlineStatus.message = 'Du kannst eine Verlängerung beantragen, um fortzufahren.';
            break;
          default:
            deadlineStatus.action = 'warning';
            deadlineStatus.message = 'Deine Frist ist abgelaufen. Kontaktiere deinen Vorgesetzten.';
        }
      }
    }

    res.json(deadlineStatus);

  } catch (error) {
    console.error('Deadline-Check-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Prüfen der Deadline' });
  }
});

// Verlängerung beantragen
router.post('/extend-request', async (req, res) => {
  try {
    const uid = req.user.uid;
    const { reason, requestedDays = 7 } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ error: 'Bitte gib einen ausführlichen Grund an (mindestens 10 Zeichen)' });
    }

    // Prüfen ob bereits eine Anfrage existiert
    const existingRequestSnapshot = await db.collection('deadlineExtensions')
      .where('uid', '==', uid)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!existingRequestSnapshot.empty) {
      return res.status(400).json({ error: 'Es existiert bereits eine ausstehende Verlängerungsanfrage' });
    }

    // Benutzer-Info abrufen
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (!userData.deadlineEnd) {
      return res.status(400).json({ error: 'Keine aktive Deadline gefunden' });
    }

    // Verlängerungsanfrage erstellen
    const extensionData = {
      uid,
      userName: userData.displayName || userData.email,
      currentDeadline: userData.deadlineEnd,
      requestedDays: Math.min(Math.max(1, parseInt(requestedDays)), 30), // 1-30 Tage
      reason: reason.trim(),
      status: 'pending',
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
      userLevel: userData.level,
      completedModules: userData.progress?.completedModules?.length || 0
    };

    const extensionRef = await db.collection('deadlineExtensions').add(extensionData);

    res.json({
      success: true,
      extensionId: extensionRef.id,
      message: 'Verlängerungsanfrage erfolgreich eingereicht',
      status: 'pending',
      requestedDays: extensionData.requestedDays
    });

  } catch (error) {
    console.error('Extension-Request-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Einreichen der Verlängerungsanfrage' });
  }
});

// Verlängerungsanfragen verwalten (Admin)
router.get('/extensions', async (req, res) => {
  try {
    // Admin-Check
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.data()?.isAdmin) {
      return res.status(403).json({ error: 'Admin-Berechtigung erforderlich' });
    }

    const { status = 'pending', limit = 50 } = req.query;

    let query = db.collection('deadlineExtensions');
    
    if (status !== 'all') {
      query = query.where('status', '==', status);
    }

    const extensionsSnapshot = await query
      .orderBy('requestedAt', 'desc')
      .limit(parseInt(limit))
      .get();

    const extensions = [];
    extensionsSnapshot.forEach(doc => {
      const data = doc.data();
      extensions.push({
        id: doc.id,
        uid: data.uid,
        userName: data.userName,
        currentDeadline: data.currentDeadline,
        requestedDays: data.requestedDays,
        reason: data.reason,
        status: data.status,
        requestedAt: data.requestedAt,
        userLevel: data.userLevel,
        completedModules: data.completedModules,
        processedAt: data.processedAt,
        processedBy: data.processedBy,
        adminComment: data.adminComment
      });
    });

    res.json({ extensions });

  } catch (error) {
    console.error('Extensions-List-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Verlängerungsanfragen' });
  }
});

// Verlängerungsanfrage genehmigen/ablehnen (Admin)
router.post('/extensions/:extensionId/process', async (req, res) => {
  try {
    // Admin-Check
    const adminDoc = await db.collection('users').doc(req.user.uid).get();
    if (!adminDoc.data()?.isAdmin) {
      return res.status(403).json({ error: 'Admin-Berechtigung erforderlich' });
    }

    const { extensionId } = req.params;
    const { action, adminComment = '', adjustedDays } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Ungültige Aktion' });
    }

    // Verlängerungsanfrage abrufen
    const extensionDoc = await db.collection('deadlineExtensions').doc(extensionId).get();
    if (!extensionDoc.exists) {
      return res.status(404).json({ error: 'Verlängerungsanfrage nicht gefunden' });
    }

    const extensionData = extensionDoc.data();
    
    if (extensionData.status !== 'pending') {
      return res.status(400).json({ error: 'Anfrage bereits bearbeitet' });
    }

    // Verlängerungsanfrage aktualisieren
    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      processedBy: req.user.uid,
      adminComment: adminComment.trim()
    };

    if (action === 'approve') {
      const extensionDays = adjustedDays ? parseInt(adjustedDays) : extensionData.requestedDays;
      updateData.approvedDays = extensionDays;

      // Benutzer-Deadline verlängern
      const currentDeadline = extensionData.currentDeadline.toDate();
      const newDeadline = new Date(currentDeadline);
      newDeadline.setDate(newDeadline.getDate() + extensionDays);

      await db.collection('users').doc(extensionData.uid).update({
        deadlineEnd: admin.firestore.Timestamp.fromDate(newDeadline),
        lastExtension: {
          extensionId,
          oldDeadline: extensionData.currentDeadline,
          newDeadline: admin.firestore.Timestamp.fromDate(newDeadline),
          extensionDays,
          grantedAt: admin.firestore.FieldValue.serverTimestamp(),
          grantedBy: req.user.uid
        }
      });
    }

    await db.collection('deadlineExtensions').doc(extensionId).update(updateData);

    res.json({
      success: true,
      action,
      extensionId,
      message: action === 'approve' ? 'Verlängerung genehmigt' : 'Verlängerung abgelehnt'
    });

  } catch (error) {
    console.error('Extension-Process-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Bearbeiten der Verlängerungsanfrage' });
  }
});

// Globale Deadline-Konfiguration setzen (Admin)
router.post('/config', async (req, res) => {
  try {
    // Admin-Check
    const adminDoc = await db.collection('users').doc(req.user.uid).get();
    if (!adminDoc.data()?.isAdmin) {
      return res.status(403).json({ error: 'Admin-Berechtigung erforderlich' });
    }

    const { 
      deadlineMode = 'relative', 
      daysAfterStart = 7, 
      startDate, 
      endDate,
      onMissedDeadline = 'warning',
      allowExtension = true,
      applyToExisting = false 
    } = req.body;

    if (!['relative', 'absolute'].includes(deadlineMode)) {
      return res.status(400).json({ error: 'Ungültiger Deadline-Modus' });
    }

    if (!['reset', 'soft-lock', 'warning'].includes(onMissedDeadline)) {
      return res.status(400).json({ error: 'Ungültiges Verhalten bei verpasster Deadline' });
    }

    let calculatedStartDate, calculatedEndDate;

    if (deadlineMode === 'relative') {
      calculatedStartDate = new Date();
      calculatedEndDate = new Date();
      calculatedEndDate.setDate(calculatedEndDate.getDate() + parseInt(daysAfterStart));
    } else {
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start- und Enddatum sind für absoluten Modus erforderlich' });
      }
      calculatedStartDate = new Date(startDate);
      calculatedEndDate = new Date(endDate);
    }

    // Globale Konfiguration speichern
    const configData = {
      deadlineMode,
      daysAfterStart: deadlineMode === 'relative' ? parseInt(daysAfterStart) : null,
      startDate: admin.firestore.Timestamp.fromDate(calculatedStartDate),
      endDate: admin.firestore.Timestamp.fromDate(calculatedEndDate),
      onMissedDeadline,
      allowExtension,
      setBy: req.user.uid,
      setAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true
    };

    await db.collection('deadlineConfigs').add(configData);

    // Auf bestehende Benutzer anwenden falls gewünscht
    if (applyToExisting) {
      const usersSnapshot = await db.collection('users').get();
      const batch = db.batch();

      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (!userData.isAdmin) { // Admins ausschließen
          batch.update(doc.ref, {
            deadlineStart: configData.startDate,
            deadlineEnd: configData.endDate,
            deadlineMode,
            deadlineConfig: {
              onMissedDeadline,
              allowExtension
            },
            deadlineSetBy: req.user.uid,
            deadlineSetAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      });

      await batch.commit();
    }

    res.json({
      success: true,
      config: configData,
      appliedToExisting: applyToExisting,
      message: 'Deadline-Konfiguration erfolgreich gesetzt'
    });

  } catch (error) {
    console.error('Deadline-Config-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Setzen der Deadline-Konfiguration' });
  }
});

// Fortschritt zurücksetzen (interne Funktion)
async function resetUserProgress(uid, reason) {
  try {
    await db.collection('users').doc(uid).update({
      level: 1,
      currentPoints: 0,
      progress: {
        completedModules: [],
        currentModule: 1,
        totalModules: 10
      },
      badges: [],
      resetReason: reason,
      resetAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Reset-Log erstellen
    await db.collection('progressResets').add({
      uid,
      reason,
      resetAt: admin.firestore.FieldValue.serverTimestamp(),
      triggeredBy: 'system'
    });

  } catch (error) {
    console.error('Progress-Reset-Fehler:', error);
  }
}

// Deadline-Statistiken (Admin)
router.get('/stats', async (req, res) => {
  try {
    // Admin-Check
    const adminDoc = await db.collection('users').doc(req.user.uid).get();
    if (!adminDoc.data()?.isAdmin) {
      return res.status(403).json({ error: 'Admin-Berechtigung erforderlich' });
    }

    // Benutzer mit Deadlines
    const usersWithDeadlinesSnapshot = await db.collection('users')
      .where('deadlineEnd', '!=', null)
      .get();

    let totalWithDeadlines = 0;
    let activeDeadlines = 0;
    let expiredDeadlines = 0;
    let completedOnTime = 0;
    const now = new Date();

    usersWithDeadlinesSnapshot.forEach(doc => {
      const userData = doc.data();
      totalWithDeadlines++;

      const deadline = userData.deadlineEnd.toDate();
      const isExpired = now > deadline;
      const isCompleted = userData.level >= 10;

      if (isCompleted) {
        completedOnTime++;
      } else if (isExpired) {
        expiredDeadlines++;
      } else {
        activeDeadlines++;
      }
    });

    // Verlängerungsanfragen
    const extensionsSnapshot = await db.collection('deadlineExtensions').get();
    let pendingExtensions = 0;
    let approvedExtensions = 0;
    let rejectedExtensions = 0;

    extensionsSnapshot.forEach(doc => {
      const data = doc.data();
      switch (data.status) {
        case 'pending': pendingExtensions++; break;
        case 'approved': approvedExtensions++; break;
        case 'rejected': rejectedExtensions++; break;
      }
    });

    res.json({
      deadlines: {
        total: totalWithDeadlines,
        active: activeDeadlines,
        expired: expiredDeadlines,
        completedOnTime,
        completionRate: totalWithDeadlines > 0 ? (completedOnTime / totalWithDeadlines * 100).toFixed(1) : 0
      },
      extensions: {
        pending: pendingExtensions,
        approved: approvedExtensions,
        rejected: rejectedExtensions,
        total: pendingExtensions + approvedExtensions + rejectedExtensions
      }
    });

  } catch (error) {
    console.error('Deadline-Stats-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Deadline-Statistiken' });
  }
});

// Deadline-Erinnerungen senden (Cronjob-Endpoint)
router.post('/reminders', async (req, res) => {
  try {
    // Admin-Check oder Cronjob-Token
    const { cronToken } = req.body;
    if (cronToken !== process.env.CRON_TOKEN) {
      const adminDoc = await db.collection('users').doc(req.user.uid).get();
      if (!adminDoc.data()?.isAdmin) {
        return res.status(403).json({ error: 'Berechtigung erforderlich' });
      }
    }

    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // Benutzer mit bald ablaufenden Deadlines finden
    const usersSnapshot = await db.collection('users')
      .where('deadlineEnd', '>=', admin.firestore.Timestamp.fromDate(now))
      .where('deadlineEnd', '<=', admin.firestore.Timestamp.fromDate(threeDaysFromNow))
      .get();

    const reminders = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const deadline = userData.deadlineEnd.toDate();
      const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (userData.level < 10) { // Noch nicht abgeschlossen
        reminders.push({
          uid: doc.id,
          email: userData.email,
          displayName: userData.displayName,
          deadline,
          daysRemaining,
          completedModules: userData.progress?.completedModules?.length || 0
        });
      }
    });

    // Hier könnten E-Mail-Benachrichtigungen gesendet werden
    // await sendReminderEmails(reminders);

    res.json({
      success: true,
      remindersSent: reminders.length,
      reminders: reminders.map(r => ({
        uid: r.uid,
        daysRemaining: r.daysRemaining,
        completedModules: r.completedModules
      }))
    });

  } catch (error) {
    console.error('Reminders-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Senden der Erinnerungen' });
  }
});

module.exports = router; 
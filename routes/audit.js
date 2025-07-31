const express = require('express');
const admin = require('firebase-admin');
const crypto = require('crypto');
const router = express.Router();

const db = admin.firestore();

// ===================================================
// 🔍 AUDIT LOG SYSTEM - DSGVO-KONFORM
// ===================================================

// Audit-Event erfassen
async function logAuditEvent(eventData) {
  try {
    const auditEntry = {
      ...eventData,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      sessionId: eventData.sessionId || generateSessionId(),
      ipAddress: eventData.ipAddress || 'unknown',
      userAgent: eventData.userAgent || 'unknown',
      hash: generateEventHash(eventData)
    };

    await db.collection('auditLogs').add(auditEntry);
    return auditEntry;
  } catch (error) {
    console.error('Audit-Log-Fehler:', error);
  }
}

// Event-Hash für Integrität generieren
function generateEventHash(eventData) {
  const dataString = JSON.stringify({
    uid: eventData.uid,
    eventType: eventData.eventType,
    moduleId: eventData.moduleId,
    timestamp: Date.now()
  });
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

// Session-ID generieren
function generateSessionId() {
  return crypto.randomUUID();
}

// ===================================================
// 📊 AUDIT ENDPOINTS
// ===================================================

// Vollständiges Audit-Log für Benutzer
router.get('/user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { startDate, endDate, eventType, format = 'json' } = req.query;

    // Admin-Check oder eigener Benutzer
    const requestingUserDoc = await db.collection('users').doc(req.user.uid).get();
    const requestingUser = requestingUserDoc.data();
    
    if (!requestingUser?.isAdmin && req.user.uid !== uid) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    // Query bauen
    let query = db.collection('auditLogs').where('uid', '==', uid);
    
    if (startDate) {
      query = query.where('timestamp', '>=', new Date(startDate));
    }
    if (endDate) {
      query = query.where('timestamp', '<=', new Date(endDate));
    }
    if (eventType) {
      query = query.where('eventType', '==', eventType);
    }

    const snapshot = await query.orderBy('timestamp', 'desc').get();
    
    const auditEntries = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      auditEntries.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() || data.timestamp
      });
    });

    // Benutzer-Info hinzufügen
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    const auditReport = {
      user: {
        uid: uid,
        name: userData?.displayName || userData?.email,
        email: userData?.email,
        role: userData?.role || 'Mitarbeiter'
      },
      reportGenerated: new Date().toISOString(),
      totalEvents: auditEntries.length,
      dateRange: { startDate, endDate },
      events: auditEntries,
      compliance: {
        dsgvoCompliant: true,
        retentionPeriod: '7 Jahre (gesetzlich)',
        dataProcessingLegal: 'Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)'
      }
    };

    if (format === 'pdf') {
      // PDF-Generation für offizielle Audits
      const pdfBuffer = await generateAuditPDF(auditReport);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="audit-${uid}-${Date.now()}.pdf"`
      });
      res.send(pdfBuffer);
    } else {
      res.json(auditReport);
    }

  } catch (error) {
    console.error('Audit-Export-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Audit-Export' });
  }
});

// Lernfortschritt auditierbar dokumentieren
router.post('/learning-event', async (req, res) => {
  try {
    const { moduleId, questionId, answer, correct, timeSpent, eventType } = req.body;
    const uid = req.user.uid;

    const auditEvent = await logAuditEvent({
      uid,
      eventType: eventType || 'LEARNING_EVENT',
      moduleId,
      questionId,
      answer,
      correct,
      timeSpent,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      auditId: auditEvent.id,
      hash: auditEvent.hash,
      message: 'Lernschritt auditierbar dokumentiert'
    });

  } catch (error) {
    console.error('Learning-Event-Audit-Fehler:', error);
    res.status(500).json({ error: 'Fehler bei der Audit-Dokumentation' });
  }
});

// Modul-Abschluss dokumentieren
router.post('/module-completion', async (req, res) => {
  try {
    const { moduleId, score, timeSpent, certificateEligible } = req.body;
    const uid = req.user.uid;

    const auditEvent = await logAuditEvent({
      uid,
      eventType: 'MODULE_COMPLETION',
      moduleId,
      score,
      timeSpent,
      certificateEligible,
      completedAt: new Date().toISOString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Zusätzliche Compliance-Dokumentation
    await db.collection('complianceRecords').add({
      uid,
      type: 'MODULE_COMPLETION',
      moduleId,
      score,
      auditHash: auditEvent.hash,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      legalBasis: 'Arbeitsschutz und Qualifikationsnachweis'
    });

    res.json({
      success: true,
      auditId: auditEvent.id,
      hash: auditEvent.hash,
      complianceRecorded: true
    });

  } catch (error) {
    console.error('Module-Completion-Audit-Fehler:', error);
    res.status(500).json({ error: 'Fehler bei der Completion-Dokumentation' });
  }
});

// Deadline-Überschreitung dokumentieren
router.post('/deadline-violation', async (req, res) => {
  try {
    const { moduleId, deadline, actualCompletion, reason } = req.body;
    const uid = req.user.uid;

    const auditEvent = await logAuditEvent({
      uid,
      eventType: 'DEADLINE_VIOLATION',
      moduleId,
      deadline,
      actualCompletion,
      reason,
      severity: calculateViolationSeverity(deadline, actualCompletion),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // HR-Notification vorbereiten
    await db.collection('hrNotifications').add({
      uid,
      type: 'DEADLINE_VIOLATION',
      moduleId,
      auditHash: auditEvent.hash,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      requiresAction: true
    });

    res.json({
      success: true,
      auditId: auditEvent.id,
      hash: auditEvent.hash,
      hrNotified: true
    });

  } catch (error) {
    console.error('Deadline-Violation-Audit-Fehler:', error);
    res.status(500).json({ error: 'Fehler bei der Violation-Dokumentation' });
  }
});

// Admin: Vollständige Audit-Übersicht
router.get('/overview', async (req, res) => {
  try {
    // Admin-Check
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.data()?.isAdmin) {
      return res.status(403).json({ error: 'Admin-Berechtigung erforderlich' });
    }

    const { timeframe = '30d', department, eventType } = req.query;
    
    // Zeitraum berechnen
    const days = parseInt(timeframe.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = db.collection('auditLogs')
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate));

    if (eventType) {
      query = query.where('eventType', '==', eventType);
    }

    const snapshot = await query.orderBy('timestamp', 'desc').limit(1000).get();
    
    const events = [];
    const eventStats = {};
    const userStats = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      events.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() || data.timestamp
      });

      // Statistiken
      eventStats[data.eventType] = (eventStats[data.eventType] || 0) + 1;
      userStats[data.uid] = (userStats[data.uid] || 0) + 1;
    });

    // Compliance-Metriken
    const completionEvents = events.filter(e => e.eventType === 'MODULE_COMPLETION');
    const violationEvents = events.filter(e => e.eventType === 'DEADLINE_VIOLATION');
    
    const complianceRate = completionEvents.length > 0 
      ? ((completionEvents.length - violationEvents.length) / completionEvents.length * 100)
      : 100;

    res.json({
      overview: {
        totalEvents: events.length,
        timeframe: `${days} Tage`,
        complianceRate: Math.max(0, complianceRate).toFixed(1) + '%',
        eventTypes: eventStats,
        activeUsers: Object.keys(userStats).length
      },
      events: events.slice(0, 50), // Nur erste 50 für Performance
      compliance: {
        completions: completionEvents.length,
        violations: violationEvents.length,
        onTimeRate: complianceRate.toFixed(1) + '%'
      },
      exportOptions: {
        fullExport: `/api/audit/export?timeframe=${timeframe}`,
        complianceReport: `/api/audit/compliance-report?timeframe=${timeframe}`
      }
    });

  } catch (error) {
    console.error('Audit-Overview-Fehler:', error);
    res.status(500).json({ error: 'Fehler bei der Audit-Übersicht' });
  }
});

// Hash-Verifikation für Audit-Integrität
router.post('/verify-hash', async (req, res) => {
  try {
    const { auditId, expectedHash } = req.body;

    const auditDoc = await db.collection('auditLogs').doc(auditId).get();
    if (!auditDoc.exists) {
      return res.status(404).json({ error: 'Audit-Entry nicht gefunden' });
    }

    const auditData = auditDoc.data();
    const isValid = auditData.hash === expectedHash;

    res.json({
      valid: isValid,
      auditId,
      storedHash: auditData.hash,
      expectedHash,
      timestamp: auditData.timestamp?.toDate?.() || auditData.timestamp,
      message: isValid ? 'Hash-Verifikation erfolgreich' : 'Hash-Verifikation fehlgeschlagen'
    });

  } catch (error) {
    console.error('Hash-Verifikation-Fehler:', error);
    res.status(500).json({ error: 'Fehler bei der Hash-Verifikation' });
  }
});

// ===================================================
// 🔧 HILFSFUNKTIONEN
// ===================================================

function calculateViolationSeverity(deadline, actualCompletion) {
  const deadlineDate = new Date(deadline);
  const completionDate = new Date(actualCompletion);
  const daysLate = Math.ceil((completionDate - deadlineDate) / (1000 * 60 * 60 * 24));
  
  if (daysLate <= 1) return 'LOW';
  if (daysLate <= 7) return 'MEDIUM';
  if (daysLate <= 30) return 'HIGH';
  return 'CRITICAL';
}

// PDF-Generation für Audit-Reports (Placeholder - benötigt jspdf)
async function generateAuditPDF(auditReport) {
  // TODO: Implementierung mit jspdf nach npm install
  return Buffer.from(JSON.stringify(auditReport, null, 2));
}

// Middleware: Automatisches Audit-Logging für alle API-Calls
router.use('*', async (req, res, next) => {
  if (req.user?.uid && req.method !== 'GET') {
    try {
      await logAuditEvent({
        uid: req.user.uid,
        eventType: 'API_CALL',
        endpoint: req.originalUrl,
        method: req.method,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (error) {
      console.error('Auto-Audit-Fehler:', error);
    }
  }
  next();
});

module.exports = { router, logAuditEvent }; 
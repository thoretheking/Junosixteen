const express = require('express');
const admin = require('firebase-admin');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const { logAuditEvent } = require('./audit');
const db = admin.firestore();

// ===================================================
// 🔗 GENERIC INTEGRATION API FOR EXTERNAL SYSTEMS
// ===================================================

// Rate Limiting für Integration-Endpoints
const integrationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100, // Limit jede IP auf 100 Requests per Window
  message: { error: 'Zu viele Integration-Anfragen, versuche es später erneut' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(integrationRateLimit);

// ===================================================
// 🚀 WEBHOOK ENDPOINTS
// ===================================================

// Lernfortschritt an externes System übertragen
router.post('/webhook/progress', async (req, res) => {
  try {
    const { uid, moduleId, score, completed, certificateEligible } = req.body;
    const integrationKey = req.headers['x-integration-key'];

    // Integration validieren
    const integration = await validateIntegration(integrationKey);
    if (!integration.valid) {
      return res.status(401).json({ error: 'Ungültige Integration-Authentifizierung' });
    }

    // Benutzer-Daten abrufen
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    const userData = userDoc.data();
    
    // Webhook-Payload zusammenstellen
    const webhookData = {
      event: 'learning_progress_updated',
      timestamp: new Date().toISOString(),
      user: {
        uid: uid,
        email: userData.email,
        name: userData.displayName || userData.email,
        role: userData.role || 'Mitarbeiter',
        department: userData.department || 'Unbekannt',
        employeeId: userData.employeeId || uid
      },
      progress: {
        moduleId: parseInt(moduleId),
        moduleName: getModuleName(moduleId),
        score: parseFloat(score),
        completed: Boolean(completed),
        completedAt: completed ? new Date().toISOString() : null,
        certificateEligible: Boolean(certificateEligible),
        totalModules: 10,
        completedModules: userData.progress?.completedModules?.length || 0,
        currentLevel: userData.level || 1,
        totalPoints: userData.totalPoints || 0,
        cluster: userData.cluster || 'Typ_A'
      },
      compliance: {
        auditTrail: true,
        dsgvoCompliant: true,
        retentionPeriod: '7 Jahre',
        dataProcessingLegal: 'Art. 6 Abs. 1 lit. f DSGVO'
      },
      source: 'JunoSixteen Learning Platform',
      version: '1.0'
    };

    // An externes System senden
    const deliveryResult = await deliverWebhook(integration.config, webhookData);

    // Audit-Log
    await logAuditEvent({
      uid,
      eventType: 'WEBHOOK_DELIVERED',
      integrationId: integration.config.id,
      moduleId,
      success: deliveryResult.success,
      externalSystem: integration.config.systemName,
      webhookUrl: integration.config.webhookUrl,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      delivered: deliveryResult.success,
      externalSystem: integration.config.systemName,
      webhookId: deliveryResult.webhookId,
      message: 'Lernfortschritt erfolgreich übertragen'
    });

  } catch (error) {
    console.error('Webhook-Fehler:', error);
    res.status(500).json({ error: 'Fehler bei der Webhook-Übertragung' });
  }
});

// Zertifikat-Benachrichtigung an externes System
router.post('/webhook/certificate', async (req, res) => {
  try {
    const { uid, certificateId, certificateData } = req.body;
    const integrationKey = req.headers['x-integration-key'];
    const signature = req.headers['x-signature'];

    const integration = await validateIntegration(integrationKey, signature, req.body);
    if (!integration.valid) {
      return res.status(401).json({ error: 'Ungültige Integration-Authentifizierung' });
    }

    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    const userData = userDoc.data();

    const webhookData = {
      event: 'certificate_issued',
      timestamp: new Date().toISOString(),
      user: {
        uid: uid,
        email: userData.email,
        name: userData.displayName || userData.email,
        role: userData.role || 'Mitarbeiter',
        department: userData.department || 'Unbekannt',
        employeeId: userData.employeeId || uid
      },
      certificate: {
        certificateId: certificateId,
        issuedAt: certificateData.completedAt,
        level: certificateData.level,
        totalPoints: certificateData.totalPoints,
        modules: certificateData.modules?.length || 10,
        cluster: certificateData.cluster,
        hash: certificateData.hash,
        verificationUrl: `${process.env.BASE_URL}/api/certificates/verify/${certificateId}`,
        downloadUrl: `${process.env.BASE_URL}/api/certificates/generate?format=pdf&uid=${uid}`,
        validUntil: null // Kein Ablauf
      },
      compliance: {
        auditTrail: true,
        qualificationProof: true,
        legalBasis: 'Arbeitsschutz und Qualifikationsnachweis'
      },
      source: 'JunoSixteen Learning Platform',
      version: '1.0'
    };

    const deliveryResult = await deliverWebhook(integration.config, webhookData);

    await logAuditEvent({
      uid,
      eventType: 'CERTIFICATE_WEBHOOK_DELIVERED',
      certificateId,
      integrationId: integration.config.id,
      success: deliveryResult.success,
      externalSystem: integration.config.systemName,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      delivered: deliveryResult.success,
      externalSystem: integration.config.systemName,
      webhookId: deliveryResult.webhookId,
      message: 'Zertifikat-Benachrichtigung erfolgreich übertragen'
    });

  } catch (error) {
    console.error('Certificate-Webhook-Fehler:', error);
    res.status(500).json({ error: 'Fehler bei der Zertifikat-Benachrichtigung' });
  }
});

// Deadline-Verletzung an externes System melden
router.post('/webhook/deadline-violation', async (req, res) => {
  try {
    const { uid, moduleId, deadline, actualCompletion, severity } = req.body;
    const integrationKey = req.headers['x-integration-key'];
    const signature = req.headers['x-signature'];

    const integration = await validateIntegration(integrationKey, signature, req.body);
    if (!integration.valid) {
      return res.status(401).json({ error: 'Ungültige Integration-Authentifizierung' });
    }

    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    const userData = userDoc.data();

    const webhookData = {
      event: 'deadline_violation',
      timestamp: new Date().toISOString(),
      severity: severity || 'MEDIUM',
      user: {
        uid: uid,
        email: userData.email,
        name: userData.displayName || userData.email,
        role: userData.role || 'Mitarbeiter',
        department: userData.department || 'Unbekannt',
        employeeId: userData.employeeId || uid,
        supervisor: userData.supervisor || null
      },
      violation: {
        moduleId: parseInt(moduleId),
        moduleName: getModuleName(moduleId),
        deadline: deadline,
        actualCompletion: actualCompletion,
        daysLate: Math.ceil((new Date(actualCompletion) - new Date(deadline)) / (1000 * 60 * 60 * 24)),
        severity: severity,
        requiresAction: ['HIGH', 'CRITICAL'].includes(severity)
      },
      recommendations: getViolationRecommendations(severity),
      compliance: {
        hrNotificationRequired: ['HIGH', 'CRITICAL'].includes(severity),
        auditTrail: true,
        escalationLevel: severity
      },
      source: 'JunoSixteen Learning Platform',
      version: '1.0'
    };

    const deliveryResult = await deliverWebhook(integration.config, webhookData);

    await logAuditEvent({
      uid,
      eventType: 'DEADLINE_VIOLATION_WEBHOOK',
      moduleId,
      deadline,
      severity,
      integrationId: integration.config.id,
      success: deliveryResult.success,
      externalSystem: integration.config.systemName,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      delivered: deliveryResult.success,
      severity: severity,
      requiresAction: ['HIGH', 'CRITICAL'].includes(severity),
      webhookId: deliveryResult.webhookId,
      message: 'Deadline-Verletzung erfolgreich gemeldet'
    });

  } catch (error) {
    console.error('Deadline-Violation-Webhook-Fehler:', error);
    res.status(500).json({ error: 'Fehler bei der Deadline-Verletzung-Meldung' });
  }
});

// ===================================================
// 📊 DATA SYNCHRONIZATION ENDPOINTS
// ===================================================

// Benutzer-Daten für externes System exportieren
router.get('/export/users', async (req, res) => {
  try {
    const integrationKey = req.headers['x-integration-key'];
    const signature = req.headers['x-signature'];

    const integration = await validateIntegration(integrationKey, signature, {});
    if (!integration.valid) {
      return res.status(401).json({ error: 'Ungültige Integration-Authentifizierung' });
    }

    // Admin-Check oder Service-Account
    const requestingUserDoc = await db.collection('users').doc(req.user?.uid || 'system').get();
    const requestingUser = requestingUserDoc.data();
    
    if (!requestingUser?.isAdmin && !integration.config.serviceAccount) {
      return res.status(403).json({ error: 'Admin-Berechtigung oder Service-Account erforderlich' });
    }

    const { department, role, completedOnly, format = 'json' } = req.query;

    // Query bauen
    let query = db.collection('users');
    
    if (department) {
      query = query.where('department', '==', department);
    }
    if (role) {
      query = query.where('role', '==', role);
    }

    const snapshot = await query.limit(1000).get();
    
    const users = [];
    snapshot.forEach(doc => {
      const userData = doc.data();
      const completedModules = userData.progress?.completedModules?.length || 0;
      
      // Filter für nur abgeschlossene Benutzer
      if (completedOnly === 'true' && completedModules < 10) {
        return;
      }

      users.push({
        uid: doc.id,
        email: userData.email,
        name: userData.displayName || userData.email,
        role: userData.role || 'Mitarbeiter',
        department: userData.department || 'Unbekannt',
        employeeId: userData.employeeId || doc.id,
        progress: {
          completedModules: completedModules,
          totalModules: 10,
          currentLevel: userData.level || 1,
          totalPoints: userData.totalPoints || 0,
          cluster: userData.cluster || 'Typ_A',
          badges: userData.badges?.length || 0
        },
        compliance: {
          lastActivity: userData.lastActivity?.toDate?.() || userData.lastActivity,
          certificateEligible: completedModules >= 10,
          deadlineCompliance: calculateDeadlineCompliance(userData)
        },
        lastUpdated: userData.lastUpdated?.toDate?.() || userData.createdAt?.toDate?.() || null
      });
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      totalUsers: users.length,
      filters: { department, role, completedOnly },
      externalSystem: integration.config.systemName,
      users: users,
      compliance: {
        dsgvoCompliant: true,
        dataMinimization: true,
        purposeLimitation: 'HR Integration',
        legalBasis: 'Art. 6 Abs. 1 lit. f DSGVO'
      }
    };

    // Audit-Log
    await logAuditEvent({
      uid: req.user?.uid || 'system',
      eventType: 'USER_DATA_EXPORTED',
      integrationId: integration.config.id,
      userCount: users.length,
      filters: { department, role, completedOnly },
      externalSystem: integration.config.systemName,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    if (format === 'csv') {
      const csvData = convertToCSV(users);
      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="junosixteen-users-export.csv"'
      });
      res.send(csvData);
    } else {
      res.json(exportData);
    }

  } catch (error) {
    console.error('User-Export-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Benutzer-Export' });
  }
});

// Einzelne Benutzer-Fortschrittsdaten abrufen
router.get('/user/:uid/progress', async (req, res) => {
  try {
    const { uid } = req.params;
    const integrationKey = req.headers['x-integration-key'];
    const signature = req.headers['x-signature'];

    const integration = await validateIntegration(integrationKey, signature, { uid });
    if (!integration.valid) {
      return res.status(401).json({ error: 'Ungültige Integration-Authentifizierung' });
    }

    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    const userData = userDoc.data();
    const completedModules = userData.progress?.completedModules || [];

    // Detaillierte Fortschrittsdaten
    const progressData = {
      user: {
        uid: uid,
        email: userData.email,
        name: userData.displayName || userData.email,
        role: userData.role || 'Mitarbeiter',
        department: userData.department || 'Unbekannt',
        employeeId: userData.employeeId || uid
      },
      progress: {
        overallProgress: Math.round((completedModules.length / 10) * 100),
        completedModules: completedModules.length,
        totalModules: 10,
        currentLevel: userData.level || 1,
        totalPoints: userData.totalPoints || 0,
        currentPoints: userData.currentPoints || 0,
        cluster: userData.cluster || 'Typ_A',
        badges: userData.badges || [],
        streak: userData.streak || 0
      },
      modules: await getDetailedModuleProgress(uid),
      certificates: await getCertificateStatus(uid),
      compliance: {
        lastActivity: userData.lastActivity?.toDate?.() || userData.lastActivity,
        deadlineCompliance: calculateDeadlineCompliance(userData),
        auditTrail: true
      },
      lastUpdated: new Date().toISOString()
    };

    // Audit-Log
    await logAuditEvent({
      uid: uid,
      eventType: 'PROGRESS_DATA_REQUESTED',
      integrationId: integration.config.id,
      externalSystem: integration.config.systemName,
      requestedBy: req.user?.uid || 'external-system',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json(progressData);

  } catch (error) {
    console.error('Progress-Abruf-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Fortschritts-Abruf' });
  }
});

// ===================================================
// ⚙️ INTEGRATION MANAGEMENT
// ===================================================

// Neue Integration registrieren (Admin)
router.post('/register', async (req, res) => {
  try {
    // Admin-Check
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.data()?.isAdmin) {
      return res.status(403).json({ error: 'Admin-Berechtigung erforderlich' });
    }

    const { systemName, webhookUrl, description } = req.body;

    if (!systemName || !webhookUrl) {
      return res.status(400).json({ error: 'systemName und webhookUrl erforderlich' });
    }

    // Integration-Keys generieren
    const integrationKey = generateIntegrationKey();
    const secretKey = generateSecretKey();

    const integrationData = {
      systemName,
      webhookUrl,
      description: description || '',
      integrationKey,
      secretKey,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: req.user.uid,
      lastUsed: null,
      requestCount: 0,
      version: '1.0'
    };

    const integrationRef = await db.collection('integrations').add(integrationData);

    res.json({
      success: true,
      integrationId: integrationRef.id,
      systemName: systemName,
      integrationKey: integrationKey,
      secretKey: secretKey,
      webhookUrl: webhookUrl,
      message: 'Integration erfolgreich registriert',
      documentation: {
        authenticationHeader: 'x-integration-key',
        endpoints: {
          progress: '/api/integration/webhook/progress',
          certificate: '/api/integration/webhook/certificate',
          userExport: '/api/integration/export/users'
        }
      }
    });

  } catch (error) {
    console.error('Integration-Registrierung-Fehler:', error);
    res.status(500).json({ error: 'Fehler bei der Integration-Registrierung' });
  }
});

// ===================================================
// 🔧 HILFSFUNKTIONEN
// ===================================================

// Integration validieren
async function validateIntegration(integrationKey) {
  try {
    if (!integrationKey) {
      return { valid: false, error: 'Integration-Key fehlt' };
    }

    const integrationQuery = await db.collection('integrations')
      .where('integrationKey', '==', integrationKey)
      .where('active', '==', true)
      .limit(1)
      .get();

    if (integrationQuery.empty) {
      return { valid: false, error: 'Ungültiger Integration-Key' };
    }

    const integrationDoc = integrationQuery.docs[0];
    const integrationData = integrationDoc.data();

    // Nutzung tracken
    await integrationDoc.ref.update({
      lastUsed: admin.firestore.FieldValue.serverTimestamp(),
      requestCount: admin.firestore.FieldValue.increment(1)
    });

    return { 
      valid: true, 
      config: { 
        id: integrationDoc.id, 
        ...integrationData 
      } 
    };

  } catch (error) {
    console.error('Integration-Validierung-Fehler:', error);
    return { valid: false, error: 'Validierung fehlgeschlagen' };
  }
}

// Webhook ausliefern
async function deliverWebhook(integrationConfig, payload) {
  try {
    const response = await fetch(integrationConfig.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-integration-key': integrationConfig.integrationKey,
        'x-source': 'JunoSixteen',
        'User-Agent': 'JunoSixteen-Webhook/1.0'
      },
      body: JSON.stringify(payload),
      timeout: 30000
    });

    const webhookId = crypto.randomUUID();

    return {
      success: response.ok,
      status: response.status,
      webhookId: webhookId,
      deliveredAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Webhook-Delivery-Fehler:', error);
    return {
      success: false,
      error: error.message,
      webhookId: crypto.randomUUID(),
      deliveredAt: new Date().toISOString()
    };
  }
}

// Integration-Key generieren
function generateIntegrationKey() {
  return 'juno_' + crypto.randomBytes(16).toString('hex');
}

// Secret-Key generieren
function generateSecretKey() {
  return crypto.randomBytes(32).toString('hex');
}

// Modul-Name abrufen
function getModuleName(moduleId) {
  const moduleNames = {
    1: 'Händehygiene und Grundlagen',
    2: 'Toiletten-Hygiene',
    3: 'Arbeitsplatz-Sicherheit',
    4: 'Teamwork und Kommunikation',
    5: 'RISIKO: Notfall-Situationen',
    6: 'Qualitätskontrolle',
    7: 'Datenschutz und Compliance',
    8: 'Kundenservice',
    9: 'Führung und Verantwortung',
    10: 'FINALES RISIKO: Gesamtverständnis'
  };
  return moduleNames[moduleId] || `Modul ${moduleId}`;
}

// Verletzungs-Empfehlungen
function getViolationRecommendations(severity) {
  const recommendations = {
    'LOW': ['Freundliche Erinnerung senden', 'Nächsten Termin planen'],
    'MEDIUM': ['Supervisor informieren', 'Unterstützung anbieten', 'Deadline erweitern'],
    'HIGH': ['HR-Abteilung einschalten', 'Coaching anbieten', 'Eskalation prüfen'],
    'CRITICAL': ['Sofortige Intervention', 'Disziplinarmaßnahmen prüfen', 'Training wiederholen']
  };
  return recommendations[severity] || recommendations['MEDIUM'];
}

// Deadline-Compliance berechnen
function calculateDeadlineCompliance(userData) {
  // Vereinfachte Berechnung - kann erweitert werden
  const completedModules = userData.progress?.completedModules?.length || 0;
  const expectedProgress = Math.min(10, Math.floor((Date.now() - (userData.createdAt?.toDate?.() || new Date())) / (1000 * 60 * 60 * 24 * 7))); // 1 Modul pro Woche erwartet
  
  if (expectedProgress === 0) return 100;
  return Math.round((completedModules / expectedProgress) * 100);
}

// CSV-Konvertierung
function convertToCSV(users) {
  const headers = ['UID', 'Email', 'Name', 'Role', 'Department', 'Completed Modules', 'Total Points', 'Level', 'Cluster', 'Certificate Eligible'];
  const rows = users.map(user => [
    user.uid,
    user.email,
    user.name,
    user.role,
    user.department,
    user.progress.completedModules,
    user.progress.totalPoints,
    user.progress.currentLevel,
    user.progress.cluster,
    user.compliance.certificateEligible ? 'Yes' : 'No'
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// Detaillierte Modul-Fortschrittsdaten
async function getDetailedModuleProgress(uid) {
  // Placeholder - kann erweitert werden
  return [];
}

// Zertifikat-Status
async function getCertificateStatus(uid) {
  const certificateQuery = await db.collection('certificates')
    .where('uid', '==', uid)
    .limit(1)
    .get();

  if (certificateQuery.empty) {
    return { issued: false };
  }

  const certificateData = certificateQuery.docs[0].data();
  return {
    issued: true,
    certificateId: certificateData.certificateId,
    issuedAt: certificateData.completedAt?.toDate?.() || certificateData.completedAt,
    hash: certificateData.hash,
    valid: certificateData.isValid !== false
  };
}

module.exports = router; 
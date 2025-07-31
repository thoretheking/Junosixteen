const express = require('express');
const admin = require('firebase-admin');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const { logAuditEvent } = require('./audit');
const db = admin.firestore();

// ===================================================
// 📜 CERTIFICATE SYSTEM WITH PDF & HASH VALIDATION
// ===================================================

// Zertifikat generieren mit Hash-Validierung
router.post('/generate', async (req, res) => {
  try {
    const uid = req.user.uid;
    const { language = 'de', format = 'json' } = req.body;

    // Berechtigung prüfen
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    
    if (!userData) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Fortschritt prüfen
    const completedModules = userData.progress?.completedModules || [];
    if (completedModules.length < 10) {
      return res.status(400).json({ 
        error: 'Zertifikat noch nicht verfügbar',
        completed: completedModules.length,
        required: 10,
        message: `Noch ${10 - completedModules.length} Module erforderlich`
      });
    }

    // Prüfe ob bereits ein Zertifikat existiert
    const existingCertQuery = await db.collection('certificates')
      .where('uid', '==', uid)
      .limit(1)
      .get();

    let certificate;
    if (!existingCertQuery.empty) {
      // Existierendes Zertifikat aktualisieren
      const existingDoc = existingCertQuery.docs[0];
      certificate = { id: existingDoc.id, ...existingDoc.data() };
      
      // Aktualisiere nur bei Verbesserungen
      if (userData.totalPoints > (certificate.totalPoints || 0)) {
        await existingDoc.ref.update({
          totalPoints: userData.totalPoints,
          level: userData.level,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
        certificate.totalPoints = userData.totalPoints;
        certificate.level = userData.level;
      }
    } else {
      // Neues Zertifikat erstellen
      const certificateData = {
        uid,
        userName: userData.displayName || userData.email,
        userEmail: userData.email,
        userRole: userData.role || 'Mitarbeiter',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        level: userData.level,
        totalPoints: userData.totalPoints,
        currentPoints: userData.currentPoints,
        language,
        certificateId: generateCertificateId(),
        isValid: true,
        modules: completedModules,
        cluster: userData.cluster || 'Typ_A',
        badges: userData.badges || [],
        generatedBy: 'JunoSixteen System',
        version: '1.0'
      };

      // Hash für Integrität generieren
      certificateData.hash = generateCertificateHash(certificateData);

      const certificateRef = await db.collection('certificates').add(certificateData);
      certificate = { id: certificateRef.id, ...certificateData };

      // Audit-Log
      await logAuditEvent({
        uid,
        eventType: 'CERTIFICATE_GENERATED',
        certificateId: certificate.certificateId,
        language,
        format,
        hash: certificate.hash,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    // Zertifikat-Content zusammenstellen
    const certificateContent = buildCertificateContent(certificate, language);

    if (format === 'pdf') {
      const pdfBuffer = await generateCertificatePDF(certificateContent);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificate.certificateId}.pdf"`
      });
      res.send(pdfBuffer);
    } else {
      res.json({
        success: true,
        certificate: certificateContent,
        verification: {
          hash: certificate.hash,
          verificationUrl: `/api/certificates/verify/${certificate.certificateId}`,
          qrCode: generateQRCodeData(certificate.certificateId, certificate.hash)
        },
        message: language === 'de' ? 'Zertifikat erfolgreich generiert!' : 'Certificate generated successfully!'
      });
    }

  } catch (error) {
    console.error('Zertifikat-Generation-Fehler:', error);
    res.status(500).json({ error: 'Fehler bei der Zertifikatserstellung' });
  }
});

// Zertifikat verifizieren (öffentlicher Endpoint)
router.get('/verify/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;
    const { hash } = req.query;

    const certificateQuery = await db.collection('certificates')
      .where('certificateId', '==', certificateId)
      .limit(1)
      .get();

    if (certificateQuery.empty) {
      return res.status(404).json({ 
        valid: false,
        error: 'Zertifikat nicht gefunden',
        certificateId 
      });
    }

    const certificateDoc = certificateQuery.docs[0];
    const certificateData = certificateDoc.data();

    // Hash-Validierung
    const isHashValid = hash ? certificateData.hash === hash : true;
    const isActive = certificateData.isValid !== false;
    const isExpired = checkCertificateExpiry(certificateData);

    const verification = {
      valid: isHashValid && isActive && !isExpired,
      certificateId,
      hashValid: isHashValid,
      active: isActive,
      expired: isExpired,
      issuedTo: certificateData.userName,
      email: certificateData.userEmail,
      issuedAt: certificateData.completedAt?.toDate?.() || certificateData.completedAt,
      level: certificateData.level,
      totalPoints: certificateData.totalPoints,
      modules: certificateData.modules?.length || 0,
      issuer: 'JunoSixteen Learning Platform',
      details: isHashValid && isActive && !isExpired ? certificateData : null
    };

    // Verifikations-Audit-Log
    await logAuditEvent({
      uid: certificateData.uid,
      eventType: 'CERTIFICATE_VERIFIED',
      certificateId,
      verificationResult: verification.valid,
      verifierIP: req.ip,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json(verification);

  } catch (error) {
    console.error('Zertifikat-Verifikation-Fehler:', error);
    res.status(500).json({ 
      valid: false,
      error: 'Fehler bei der Verifikation' 
    });
  }
});

// Bulk-Zertifikat-Generierung (Admin)
router.post('/bulk-generate', async (req, res) => {
  try {
    // Admin-Check
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.data()?.isAdmin) {
      return res.status(403).json({ error: 'Admin-Berechtigung erforderlich' });
    }

    const { userIds, language = 'de', department } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ error: 'userIds array erforderlich' });
    }

    const results = {
      generated: [],
      failed: [],
      alreadyExists: []
    };

    for (const uid of userIds) {
      try {
        const userDoc = await db.collection('users').doc(uid).get();
        const userData = userDoc.data();

        if (!userData) {
          results.failed.push({ uid, reason: 'Benutzer nicht gefunden' });
          continue;
        }

        const completedModules = userData.progress?.completedModules || [];
        if (completedModules.length < 10) {
          results.failed.push({ 
            uid, 
            reason: `Nur ${completedModules.length}/10 Module abgeschlossen` 
          });
          continue;
        }

        // Prüfe existierendes Zertifikat
        const existingCert = await db.collection('certificates')
          .where('uid', '==', uid)
          .limit(1)
          .get();

        if (!existingCert.empty) {
          results.alreadyExists.push({ 
            uid, 
            certificateId: existingCert.docs[0].data().certificateId 
          });
          continue;
        }

        // Neues Zertifikat erstellen
        const certificateData = {
          uid,
          userName: userData.displayName || userData.email,
          userEmail: userData.email,
          userRole: userData.role || 'Mitarbeiter',
          department: department || userData.department || 'Unbekannt',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          level: userData.level,
          totalPoints: userData.totalPoints,
          language,
          certificateId: generateCertificateId(),
          isValid: true,
          modules: completedModules,
          cluster: userData.cluster || 'Typ_A',
          generatedBy: `Bulk-Generation (Admin: ${req.user.uid})`,
          version: '1.0'
        };

        certificateData.hash = generateCertificateHash(certificateData);

        const certificateRef = await db.collection('certificates').add(certificateData);
        
        results.generated.push({
          uid,
          certificateId: certificateData.certificateId,
          userName: certificateData.userName,
          hash: certificateData.hash
        });

        // Audit-Log
        await logAuditEvent({
          uid,
          eventType: 'BULK_CERTIFICATE_GENERATED',
          certificateId: certificateData.certificateId,
          adminUid: req.user.uid,
          department,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

      } catch (error) {
        results.failed.push({ uid, reason: error.message });
      }
    }

    res.json({
      success: true,
      summary: {
        requested: userIds.length,
        generated: results.generated.length,
        failed: results.failed.length,
        alreadyExists: results.alreadyExists.length
      },
      results
    });

  } catch (error) {
    console.error('Bulk-Zertifikat-Generation-Fehler:', error);
    res.status(500).json({ error: 'Fehler bei der Bulk-Generierung' });
  }
});

// Zertifikat widerrufen (Admin)
router.post('/revoke/:certificateId', async (req, res) => {
  try {
    // Admin-Check
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.data()?.isAdmin) {
      return res.status(403).json({ error: 'Admin-Berechtigung erforderlich' });
    }

    const { certificateId } = req.params;
    const { reason } = req.body;

    const certificateQuery = await db.collection('certificates')
      .where('certificateId', '==', certificateId)
      .limit(1)
      .get();

    if (certificateQuery.empty) {
      return res.status(404).json({ error: 'Zertifikat nicht gefunden' });
    }

    const certificateDoc = certificateQuery.docs[0];
    const certificateData = certificateDoc.data();

    // Zertifikat als ungültig markieren
    await certificateDoc.ref.update({
      isValid: false,
      revokedAt: admin.firestore.FieldValue.serverTimestamp(),
      revokedBy: req.user.uid,
      revocationReason: reason || 'Administrativ widerrufen',
      revokedHash: crypto.createHash('sha256').update(`${certificateId}-revoked-${Date.now()}`).digest('hex')
    });

    // Audit-Log
    await logAuditEvent({
      uid: certificateData.uid,
      eventType: 'CERTIFICATE_REVOKED',
      certificateId,
      revokedBy: req.user.uid,
      reason: reason || 'Administrativ widerrufen',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Zertifikat erfolgreich widerrufen',
      certificateId,
      revokedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Zertifikat-Widerruf-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Widerrufen des Zertifikats' });
  }
});

// ===================================================
// 🔧 HILFSFUNKTIONEN
// ===================================================

// Eindeutige Zertifikat-ID generieren
function generateCertificateId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `JUNO-${timestamp}-${random}`.toUpperCase();
}

// Zertifikat-Hash für Integrität generieren
function generateCertificateHash(certificateData) {
  const hashData = {
    uid: certificateData.uid,
    certificateId: certificateData.certificateId,
    userName: certificateData.userName,
    completedAt: certificateData.completedAt,
    level: certificateData.level,
    totalPoints: certificateData.totalPoints,
    modules: certificateData.modules
  };
  
  const dataString = JSON.stringify(hashData);
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

// Zertifikat-Content aufbauen
function buildCertificateContent(certificate, language) {
  const templates = {
    de: {
      title: 'Zertifikat für erfolgreiche Teilnahme',
      subtitle: 'JunoSixteen Lernplattform',
      description: 'hat erfolgreich alle Module der gamifizierten Schulungsplattform abgeschlossen',
      details: 'Abgeschlossene Module',
      issued: 'Ausgestellt am',
      points: 'Erreichte Punkte',
      level: 'Erreichte Stufe',
      cluster: 'Lerntyp',
      signature: 'JunoSixteen Zertifizierungsstelle'
    },
    en: {
      title: 'Certificate of Successful Completion',
      subtitle: 'JunoSixteen Learning Platform',
      description: 'has successfully completed all modules of the gamified training platform',
      details: 'Completed Modules',
      issued: 'Issued on',
      points: 'Points Achieved',
      level: 'Level Reached',
      cluster: 'Learning Type',
      signature: 'JunoSixteen Certification Authority'
    }
  };

  const template = templates[language] || templates.de;

  return {
    id: certificate.id,
    certificateId: certificate.certificateId,
    hash: certificate.hash,
    userName: certificate.userName,
    userEmail: certificate.userEmail,
    userRole: certificate.userRole,
    completedAt: certificate.completedAt?.toDate?.() || certificate.completedAt,
    level: certificate.level,
    totalPoints: certificate.totalPoints,
    cluster: certificate.cluster,
    modules: certificate.modules,
    badges: certificate.badges,
    language: certificate.language,
    template,
    verification: {
      qrCode: generateQRCodeData(certificate.certificateId, certificate.hash),
      verificationUrl: `${process.env.BASE_URL || 'https://junosixteen.com'}/verify/${certificate.certificateId}`,
      hash: certificate.hash
    },
    metadata: {
      generatedBy: certificate.generatedBy,
      version: certificate.version,
      issuer: 'JunoSixteen Learning Platform',
      isValid: certificate.isValid
    }
  };
}

// QR-Code-Daten für Verifikation generieren
function generateQRCodeData(certificateId, hash) {
  const verificationData = {
    certificateId,
    hash,
    verifyUrl: `${process.env.BASE_URL || 'https://junosixteen.com'}/api/certificates/verify/${certificateId}?hash=${hash}`
  };
  return JSON.stringify(verificationData);
}

// Zertifikat-Ablauf prüfen
function checkCertificateExpiry(certificateData) {
  // Standardmäßig kein Ablauf, aber konfigurierbar
  const expiryYears = process.env.CERTIFICATE_EXPIRY_YEARS || 0;
  if (expiryYears === 0) return false;

  const issuedDate = certificateData.completedAt?.toDate?.() || new Date(certificateData.completedAt);
  const expiryDate = new Date(issuedDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + parseInt(expiryYears));

  return new Date() > expiryDate;
}

// PDF-Generation (Placeholder - benötigt jspdf nach npm install)
async function generateCertificatePDF(certificateContent) {
  // TODO: Vollständige PDF-Implementierung mit jspdf
  const pdfContent = `
    =====================================
    ${certificateContent.template.title}
    =====================================
    
    ${certificateContent.template.subtitle}
    
    ${certificateContent.userName}
    ${certificateContent.template.description}
    
    ${certificateContent.template.details}: ${certificateContent.modules?.length || 0}/10
    ${certificateContent.template.points}: ${certificateContent.totalPoints}
    ${certificateContent.template.level}: ${certificateContent.level}
    ${certificateContent.template.cluster}: ${certificateContent.cluster}
    
    ${certificateContent.template.issued}: ${new Date(certificateContent.completedAt).toLocaleDateString()}
    
    Zertifikat-ID: ${certificateContent.certificateId}
    Hash: ${certificateContent.hash}
    
    Verifikation: ${certificateContent.verification.verificationUrl}
    
    ${certificateContent.template.signature}
    =====================================
  `;

  return Buffer.from(pdfContent, 'utf-8');
}

module.exports = router; 
/**
 * Consent Management Service
 * DSGVO/GDPR compliant consent handling
 */

export interface ConsentFlags {
  telemetry: boolean;          // Telemetrie-Daten sammeln
  analytics: boolean;           // Analytics (anonymisiert)
  abTesting: boolean;           // A/B Testing Teilnahme
  tts: boolean;                 // Text-to-Speech verwenden
  thirdParty: boolean;          // Drittanbieter-Services (Maps, etc.)
  marketing: boolean;           // Marketing-Kommunikation
  personalizedContent: boolean; // Personalisierte Inhalte
}

export interface ConsentRecord {
  userId: string;
  flags: ConsentFlags;
  timestamp: Date;
  version: string; // Version der Consent-Richtlinien
  ipAddress?: string;
  userAgent?: string;
}

export interface ConsentChangeLog {
  userId: string;
  changedFlags: Partial<ConsentFlags>;
  previousFlags: ConsentFlags;
  newFlags: ConsentFlags;
  timestamp: Date;
  reason?: string; // Optional: Grund für Änderung
}

export class ConsentService {
  private readonly CURRENT_POLICY_VERSION = '1.0.0';
  private readonly DEFAULT_CONSENTS: ConsentFlags = {
    telemetry: false,
    analytics: false,
    abTesting: false,
    tts: false,
    thirdParty: false,
    marketing: false,
    personalizedContent: false
  };

  /**
   * Erstellt initiale Consent-Flags für neuen Benutzer
   */
  createInitialConsent(
    userId: string,
    explicitConsents: Partial<ConsentFlags> = {},
    metadata?: { ipAddress?: string; userAgent?: string }
  ): ConsentRecord {
    const flags: ConsentFlags = {
      ...this.DEFAULT_CONSENTS,
      ...explicitConsents
    };

    return {
      userId,
      flags,
      timestamp: new Date(),
      version: this.CURRENT_POLICY_VERSION,
      ...metadata
    };
  }

  /**
   * Aktualisiert Consent-Flags
   */
  updateConsent(
    currentConsent: ConsentRecord,
    updates: Partial<ConsentFlags>,
    reason?: string
  ): {
    newConsent: ConsentRecord;
    changeLog: ConsentChangeLog;
  } {
    const previousFlags = { ...currentConsent.flags };
    const newFlags: ConsentFlags = {
      ...currentConsent.flags,
      ...updates
    };

    const newConsent: ConsentRecord = {
      ...currentConsent,
      flags: newFlags,
      timestamp: new Date(),
      version: this.CURRENT_POLICY_VERSION
    };

    const changeLog: ConsentChangeLog = {
      userId: currentConsent.userId,
      changedFlags: updates,
      previousFlags,
      newFlags,
      timestamp: new Date(),
      reason
    };

    return { newConsent, changeLog };
  }

  /**
   * Prüft ob spezifisches Consent gegeben wurde
   */
  hasConsent(consent: ConsentRecord, flag: keyof ConsentFlags): boolean {
    return consent.flags[flag] === true;
  }

  /**
   * Prüft ob alle essentiellen Consents gegeben wurden
   */
  hasEssentialConsents(consent: ConsentRecord): boolean {
    // Essentiell für Basis-Funktionalität (keine personalisierten Features)
    // In diesem Fall: keine essentiellen Consents erforderlich
    return true;
  }

  /**
   * Prüft ob Consent-Version aktuell ist
   */
  isConsentCurrent(consent: ConsentRecord): boolean {
    return consent.version === this.CURRENT_POLICY_VERSION;
  }

  /**
   * Prüft ob Consent abgelaufen ist (nach 12 Monaten)
   */
  isConsentExpired(consent: ConsentRecord, maxAgeMonths: number = 12): boolean {
    const consentDate = new Date(consent.timestamp);
    const expiryDate = new Date(consentDate);
    expiryDate.setMonth(expiryDate.getMonth() + maxAgeMonths);
    
    return new Date() > expiryDate;
  }

  /**
   * Prüft ob Re-Consent erforderlich ist
   */
  requiresReConsent(consent: ConsentRecord): {
    required: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];

    if (!this.isConsentCurrent(consent)) {
      reasons.push('Datenschutzrichtlinien wurden aktualisiert');
    }

    if (this.isConsentExpired(consent)) {
      reasons.push('Consent ist abgelaufen (>12 Monate)');
    }

    return {
      required: reasons.length > 0,
      reasons
    };
  }

  /**
   * Widerruft alle Consents
   */
  revokeAllConsents(consent: ConsentRecord): ConsentRecord {
    return {
      ...consent,
      flags: this.DEFAULT_CONSENTS,
      timestamp: new Date()
    };
  }

  /**
   * Generiert Consent-Banner-Text basierend auf fehlenden Consents
   */
  generateConsentBannerContent(
    currentConsent: ConsentRecord,
    requestedFlags: Array<keyof ConsentFlags>
  ): {
    title: string;
    description: string;
    flags: Array<{
      key: keyof ConsentFlags;
      label: string;
      description: string;
      required: boolean;
      current: boolean;
    }>;
  } {
    const flagDescriptions: Record<keyof ConsentFlags, { label: string; description: string; required: boolean }> = {
      telemetry: {
        label: 'Telemetrie',
        description: 'Wir sammeln anonyme Nutzungsdaten zur Verbesserung der App',
        required: false
      },
      analytics: {
        label: 'Analytics',
        description: 'Anonymisierte Statistiken über App-Nutzung',
        required: false
      },
      abTesting: {
        label: 'A/B Testing',
        description: 'Teilnahme an Tests für neue Features',
        required: false
      },
      tts: {
        label: 'Text-to-Speech',
        description: 'Vorlesen von Texten durch Sprach-Synthese',
        required: false
      },
      thirdParty: {
        label: 'Drittanbieter-Services',
        description: 'Nutzung von externen Services (z.B. Karten)',
        required: false
      },
      marketing: {
        label: 'Marketing',
        description: 'Informationen über neue Features und Updates',
        required: false
      },
      personalizedContent: {
        label: 'Personalisierte Inhalte',
        description: 'Inhalte basierend auf Ihrem Lernverhalten',
        required: false
      }
    };

    return {
      title: 'Datenschutz-Einstellungen',
      description: 'Wir respektieren Ihre Privatsphäre. Bitte wählen Sie, welche Datenverarbeitung Sie erlauben möchten:',
      flags: requestedFlags.map(key => ({
        key,
        label: flagDescriptions[key].label,
        description: flagDescriptions[key].description,
        required: flagDescriptions[key].required,
        current: currentConsent.flags[key]
      }))
    };
  }

  /**
   * Validiert Consent-Record
   */
  validateConsent(consent: ConsentRecord): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!consent.userId) {
      errors.push('userId fehlt');
    }

    if (!consent.timestamp) {
      errors.push('timestamp fehlt');
    }

    if (!consent.version) {
      errors.push('version fehlt');
    }

    if (!consent.flags) {
      errors.push('flags fehlen');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Exportiert Consent-Daten für DSGVO-Anfrage
   */
  exportConsentData(
    consent: ConsentRecord,
    changeLogs: ConsentChangeLog[]
  ): {
    current: ConsentRecord;
    history: ConsentChangeLog[];
    summary: {
      totalChanges: number;
      lastUpdate: Date;
      activeConsents: string[];
      revokedConsents: string[];
    };
  } {
    const activeConsents = Object.entries(consent.flags)
      .filter(([_, value]) => value === true)
      .map(([key]) => key);

    const revokedConsents = Object.entries(consent.flags)
      .filter(([_, value]) => value === false)
      .map(([key]) => key);

    return {
      current: consent,
      history: changeLogs,
      summary: {
        totalChanges: changeLogs.length,
        lastUpdate: consent.timestamp,
        activeConsents,
        revokedConsents
      }
    };
  }
}


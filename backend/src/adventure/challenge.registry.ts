/**
 * Challenge Registry - Thematische Challenges pro World
 * Integriert mit HRM/TRM System
 */

import { World } from '../common/types.js';

export interface Challenge {
  id: string;
  world: World;
  title: string;
  description: string;
  timeLimitMs: number;
  isBoss: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  a11yHint?: string;
  instructions: string[];
  successCriteria: {
    minScore?: number;
    minTime?: number;
    maxErrors?: number;
  };
}

/**
 * Challenge Registry - Alle verfügbaren Challenges
 */
export const CHALLENGE_REGISTRY: Record<string, Challenge> = {
  // ===================================================
  // HEALTH / CLEANROOM
  // ===================================================
  
  protective_gear_order: {
    id: 'protective_gear_order',
    world: 'health',
    title: 'Schutzkleidung anlegen',
    description: 'Tippe die korrekte Reihenfolge der Schutzkleidung',
    timeLimitMs: 10000,
    isBoss: true,
    difficulty: 'hard',
    instructions: [
      '1. Wähle die Items in der richtigen Reihenfolge',
      '2. Korrekte Reihenfolge: Handschuhe → Maske → Kittel → Haube',
      '3. Du hast 10 Sekunden Zeit'
    ],
    successCriteria: {
      maxErrors: 0
    },
    a11yHint: 'Nutze Pfeiltasten oder Touch um die Reihenfolge zu wählen'
  },

  contamination_swipe: {
    id: 'contamination_swipe',
    world: 'health',
    title: 'Kontaminations-Alarm',
    description: 'Wische alle Partikel weg bevor die Zeit abläuft',
    timeLimitMs: 15000,
    isBoss: true,
    difficulty: 'hard',
    instructions: [
      '1. Wische über die roten Partikel',
      '2. Mindestens 10 Partikel müssen entfernt werden',
      '3. Du hast 15 Sekunden Zeit'
    ],
    successCriteria: {
      minScore: 10
    },
    a11yHint: 'Tippe auf rote Bereiche um sie zu entfernen'
  },

  hygiene_protocol: {
    id: 'hygiene_protocol',
    world: 'health',
    title: 'Hygiene-Protokoll',
    description: 'Führe die Händedesinfektion korrekt durch',
    timeLimitMs: 8000,
    isBoss: false,
    difficulty: 'easy',
    instructions: [
      '1. Folge den Schritten auf dem Bildschirm',
      '2. Richtige Technik verwenden',
      '3. Mindestens 30 Sekunden'
    ],
    successCriteria: {
      minTime: 30000,
      maxErrors: 1
    },
    a11yHint: 'Folge den visuellen Hinweisen'
  },

  sterile_zone_entry: {
    id: 'sterile_zone_entry',
    world: 'health',
    title: 'Sterilbereich betreten',
    description: 'Markiere die korrekten Eingangsschritte',
    timeLimitMs: 12000,
    isBoss: false,
    difficulty: 'medium',
    instructions: [
      '1. Wähle die notwendigen Schritte',
      '2. Alle 5 Schritte müssen korrekt sein',
      '3. Reihenfolge beachten'
    ],
    successCriteria: {
      minScore: 5,
      maxErrors: 0
    },
    a11yHint: 'Liste der Schritte mit Checkboxen'
  },

  // ===================================================
  // IT / CYBER DEFENSE
  // ===================================================

  phishing_detect: {
    id: 'phishing_detect',
    world: 'it',
    title: 'Phishing-Alarm',
    description: 'Identifiziere die Phishing-E-Mail',
    timeLimitMs: 12000,
    isBoss: true,
    difficulty: 'hard',
    instructions: [
      '1. Untersuche die E-Mails',
      '2. Finde die gefälschte E-Mail',
      '3. Achte auf verdächtige Merkmale'
    ],
    successCriteria: {
      minScore: 1,
      maxErrors: 0
    },
    a11yHint: 'Liste von E-Mails, wähle die verdächtige aus'
  },

  firewall_blocks: {
    id: 'firewall_blocks',
    world: 'it',
    title: 'Firewall konfigurieren',
    description: 'Platziere die Firewall-Regeln korrekt',
    timeLimitMs: 10000,
    isBoss: false,
    difficulty: 'medium',
    instructions: [
      '1. Ziehe 3 Blöcke an die richtige Position',
      '2. Rote Bereiche = blockieren',
      '3. Grüne Bereiche = erlauben'
    ],
    successCriteria: {
      minScore: 3,
      maxErrors: 0
    },
    a11yHint: 'Drag & Drop oder Button-basiert'
  },

  password_builder: {
    id: 'password_builder',
    world: 'it',
    title: 'Sicheres Passwort erstellen',
    description: 'Baue ein Passwort nach den Sicherheitsregeln',
    timeLimitMs: 15000,
    isBoss: true,
    difficulty: 'hard',
    instructions: [
      '1. Mindestens 12 Zeichen',
      '2. Groß- und Kleinbuchstaben',
      '3. Zahlen und Sonderzeichen',
      '4. Keine Wörterbuch-Wörter'
    ],
    successCriteria: {
      minScore: 4
    },
    a11yHint: 'Eingabefeld mit Live-Feedback zur Passwortstärke'
  },

  security_breach_response: {
    id: 'security_breach_response',
    world: 'it',
    title: 'Security Breach Response',
    description: 'Reagiere korrekt auf den Sicherheitsvorfall',
    timeLimitMs: 20000,
    isBoss: true,
    difficulty: 'hard',
    instructions: [
      '1. Priorisiere die Maßnahmen',
      '2. 5 Schritte in korrekter Reihenfolge',
      '3. Zeit ist kritisch'
    ],
    successCriteria: {
      minScore: 5,
      maxErrors: 1
    },
    a11yHint: 'Sortierbare Liste mit Prioritäten'
  },

  // ===================================================
  // LEGAL / COMPLIANCE
  // ===================================================

  gdpr_clause_pick: {
    id: 'gdpr_clause_pick',
    world: 'legal',
    title: 'DSGVO-Artikel wählen',
    description: 'Wähle den richtigen DSGVO-Artikel für den Fall',
    timeLimitMs: 12000,
    isBoss: false,
    difficulty: 'medium',
    instructions: [
      '1. Lies den Fall',
      '2. Wähle den passenden Artikel',
      '3. Nur eine Antwort ist korrekt'
    ],
    successCriteria: {
      minScore: 1,
      maxErrors: 0
    },
    a11yHint: 'Liste von Artikeln mit Beschreibungen'
  },

  data_breach_response: {
    id: 'data_breach_response',
    world: 'legal',
    title: 'Datenleck-Maßnahmen',
    description: 'Setze die korrekten Maßnahmen um',
    timeLimitMs: 15000,
    isBoss: true,
    difficulty: 'hard',
    instructions: [
      '1. 72-Stunden-Regel beachten',
      '2. Alle notwendigen Schritte wählen',
      '3. Reihenfolge ist wichtig'
    ],
    successCriteria: {
      minScore: 6,
      maxErrors: 1
    },
    a11yHint: 'Checkliste mit Timer'
  },

  contract_review: {
    id: 'contract_review',
    world: 'legal',
    title: 'Vertrags-Review',
    description: 'Finde die problematischen Klauseln',
    timeLimitMs: 18000,
    isBoss: false,
    difficulty: 'medium',
    instructions: [
      '1. Lies den Vertrag',
      '2. Markiere problematische Passagen',
      '3. Mindestens 3 müssen gefunden werden'
    ],
    successCriteria: {
      minScore: 3,
      maxErrors: 2
    },
    a11yHint: 'Scrollbarer Text mit Markier-Funktion'
  },

  deadline_management: {
    id: 'deadline_management',
    world: 'legal',
    title: 'Fristen-Management',
    description: 'Ordne die Fristen nach Priorität',
    timeLimitMs: 10000,
    isBoss: false,
    difficulty: 'easy',
    instructions: [
      '1. 5 Fristen gegeben',
      '2. Sortiere nach Dringlichkeit',
      '3. Gesetzliche Fristen zuerst'
    ],
    successCriteria: {
      minScore: 5,
      maxErrors: 0
    },
    a11yHint: 'Sortierbare Liste mit Datums-Anzeige'
  },

  // ===================================================
  // PUBLIC / BÜRGERSERVICE
  // ===================================================

  application_priority: {
    id: 'application_priority',
    world: 'public',
    title: 'Antrags-Priorisierung',
    description: 'Priorisiere die eingehenden Anträge',
    timeLimitMs: 12000,
    isBoss: false,
    difficulty: 'medium',
    instructions: [
      '1. 6 Anträge gegeben',
      '2. Sortiere nach Dringlichkeit',
      '3. Eilanträge zuerst'
    ],
    successCriteria: {
      minScore: 6,
      maxErrors: 1
    },
    a11yHint: 'Drag & Drop Liste mit Prioritäts-Labels'
  },

  citizen_communication: {
    id: 'citizen_communication',
    world: 'public',
    title: 'Bürgerkommunikation',
    description: 'Wähle die richtige Antwort auf die Anfrage',
    timeLimitMs: 15000,
    isBoss: false,
    difficulty: 'easy',
    instructions: [
      '1. Lies die Bürgeranfrage',
      '2. Wähle die passende Antwort',
      '3. Freundlich und korrekt'
    ],
    successCriteria: {
      minScore: 1,
      maxErrors: 0
    },
    a11yHint: 'Multiple-Choice mit Vorschau'
  },

  document_filing: {
    id: 'document_filing',
    world: 'public',
    title: 'Akten zuordnen',
    description: 'Ordne die Dokumente den richtigen Akten zu',
    timeLimitMs: 10000,
    isBoss: false,
    difficulty: 'medium',
    instructions: [
      '1. 5 Dokumente gegeben',
      '2. Ordne jedem die richtige Akte zu',
      '3. Alle müssen korrekt sein'
    ],
    successCriteria: {
      minScore: 5,
      maxErrors: 0
    },
    a11yHint: 'Matching-Game mit Drag & Drop'
  },

  critical_citizen_case: {
    id: 'critical_citizen_case',
    world: 'public',
    title: 'Kritischer Bürgerfall',
    description: 'Handle den dringenden Fall korrekt',
    timeLimitMs: 20000,
    isBoss: true,
    difficulty: 'hard',
    instructions: [
      '1. Lies den Fall sorgfältig',
      '2. Triff die richtigen Entscheidungen',
      '3. 4 Schritte müssen korrekt sein'
    ],
    successCriteria: {
      minScore: 4,
      maxErrors: 0
    },
    a11yHint: 'Entscheidungs-Baum mit Multiple-Choice'
  },

  // ===================================================
  // FACTORY / ARBEITSSICHERHEIT
  // ===================================================

  hazard_identification: {
    id: 'hazard_identification',
    world: 'factory',
    title: 'Gefahren identifizieren',
    description: 'Markiere alle Gefahrenstellen',
    timeLimitMs: 12000,
    isBoss: true,
    difficulty: 'hard',
    instructions: [
      '1. Untersuche das Bild der Fabrikhalle',
      '2. Markiere mindestens 5 Gefahrenstellen',
      '3. Alle müssen korrekt sein'
    ],
    successCriteria: {
      minScore: 5,
      maxErrors: 1
    },
    a11yHint: 'Bild mit klickbaren Bereichen oder Liste'
  },

  emergency_stop: {
    id: 'emergency_stop',
    world: 'factory',
    title: 'Not-Aus betätigen',
    description: 'Reagiere schnell auf den Notfall',
    timeLimitMs: 8000,
    isBoss: false,
    difficulty: 'easy',
    instructions: [
      '1. Warte auf das Signal',
      '2. Drücke Not-Aus im richtigen Moment',
      '3. Reaktionszeit ist kritisch'
    ],
    successCriteria: {
      minTime: 1000,
      maxErrors: 0
    },
    a11yHint: 'Großer Button mit visuellen/audio Signalen'
  },

  supply_chain_sort: {
    id: 'supply_chain_sort',
    world: 'factory',
    title: 'Lieferkette organisieren',
    description: 'Ordne die Produktionsschritte korrekt',
    timeLimitMs: 15000,
    isBoss: false,
    difficulty: 'medium',
    instructions: [
      '1. 6 Produktionsschritte gegeben',
      '2. Sortiere in logische Reihenfolge',
      '3. Alle müssen korrekt sein'
    ],
    successCriteria: {
      minScore: 6,
      maxErrors: 0
    },
    a11yHint: 'Sortierbare Liste mit Beschreibungen'
  },

  production_emergency: {
    id: 'production_emergency',
    world: 'factory',
    title: 'Produktions-Notfall',
    description: 'Handle den kritischen Produktionsvorfall',
    timeLimitMs: 18000,
    isBoss: true,
    difficulty: 'hard',
    instructions: [
      '1. Analyse der Situation',
      '2. Sofortmaßnahmen einleiten',
      '3. 5 Schritte in korrekter Reihenfolge',
      '4. Sicherheit hat Priorität'
    ],
    successCriteria: {
      minScore: 5,
      maxErrors: 1
    },
    a11yHint: 'Entscheidungs-Baum mit Prioritäten'
  },

  quality_control: {
    id: 'quality_control',
    world: 'factory',
    title: 'Qualitätskontrolle',
    description: 'Finde die fehlerhaften Teile',
    timeLimitMs: 10000,
    isBoss: false,
    difficulty: 'medium',
    instructions: [
      '1. Untersuche die Produktionslinie',
      '2. Markiere fehlerhafte Teile',
      '3. Mindestens 8 von 10 richtig'
    ],
    successCriteria: {
      minScore: 8,
      maxErrors: 2
    },
    a11yHint: 'Bildergalerie mit Markier-Funktion'
  },
};

/**
 * Get challenges by world
 */
export function getChallengesByWorld(world: World): Challenge[] {
  return Object.values(CHALLENGE_REGISTRY).filter(c => c.world === world);
}

/**
 * Get boss challenges by world
 */
export function getBossChallengesByWorld(world: World): Challenge[] {
  return Object.values(CHALLENGE_REGISTRY).filter(
    c => c.world === world && c.isBoss
  );
}

/**
 * Get challenge by ID
 */
export function getChallengeById(id: string): Challenge | undefined {
  return CHALLENGE_REGISTRY[id];
}

/**
 * Get random challenge for world (excluding boss challenges)
 */
export function getRandomChallenge(world: World): Challenge | undefined {
  const challenges = Object.values(CHALLENGE_REGISTRY).filter(
    c => c.world === world && !c.isBoss
  );
  
  if (challenges.length === 0) return undefined;
  
  return challenges[Math.floor(Math.random() * challenges.length)];
}

/**
 * Validate challenge result
 */
export function validateChallengeResult(
  challengeId: string,
  result: { score?: number; time?: number; errors?: number }
): boolean {
  const challenge = CHALLENGE_REGISTRY[challengeId];
  if (!challenge) return false;

  const criteria = challenge.successCriteria;

  // Check score
  if (criteria.minScore !== undefined && (result.score ?? 0) < criteria.minScore) {
    return false;
  }

  // Check time
  if (criteria.minTime !== undefined && (result.time ?? 0) < criteria.minTime) {
    return false;
  }

  // Check errors
  if (criteria.maxErrors !== undefined && (result.errors ?? 0) > criteria.maxErrors) {
    return false;
  }

  return true;
}



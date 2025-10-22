import { Challenge } from './types';

export const CHALLENGES: Record<string, Challenge> = {
  // === HEALTH/CLEANROOM CHALLENGES ===
  protective_gear_order: {
    id: 'protective_gear_order',
    world: 'health',
    title: 'Schutzkleidung anlegen',
    description: 'Reihenfolge tippen: Handschuhe → Maske → Kittel → Haube.',
    instructions: 'Wähle die richtige Reihenfolge zum Anlegen der Schutzkleidung.',
    timeLimitMs: 15000,
    difficulty: 'easy',
    evaluate: (seq: string[]) => JSON.stringify(seq) === JSON.stringify(['gloves', 'mask', 'gown', 'cap']),
    a11yHint: 'Wähle die richtige Reihenfolge. Mit Pfeiltasten navigierbar.',
    successMessage: '✅ Perfekt! Schutzkleidung korrekt angelegt.',
    failMessage: '❌ Falsche Reihenfolge. Die richtige ist: Handschuhe → Maske → Kittel → Haube.'
  },
  
  contamination_swipe: {
    id: 'contamination_swipe',
    world: 'health',
    title: 'Kontaminations-Alarm',
    description: 'Wische Keime vor Ablauf der Zeit weg.',
    instructions: 'Tippe auf die roten Keime um sie zu eliminieren. Mindestens 10 Keime in 15 Sekunden!',
    timeLimitMs: 15000,
    difficulty: 'medium',
    evaluate: (hits: number) => hits >= 10,
    a11yHint: 'Tippe auf Keime um sie zu eliminieren. Ziel: 10 Keime.',
    successMessage: '🧽 Großartig! Alle Keime eliminiert.',
    failMessage: '🦠 Zu langsam! Kontamination nicht verhindert.'
  },
  
  secure_sample: {
    id: 'secure_sample',
    world: 'health',
    title: 'Probe sichern',
    description: 'Probe in den richtigen Behälter einordnen.',
    instructions: 'Ziehe die Probe in den korrekten Sicherheitsbehälter (blau markiert).',
    timeLimitMs: 12000,
    difficulty: 'easy',
    evaluate: (container: string) => container === 'secure_blue',
    a11yHint: 'Probe in blauen Sicherheitsbehälter ziehen.',
    successMessage: '🧪 Probe erfolgreich gesichert.',
    failMessage: '☢️ Falsche Lagerung! Probe kontaminiert.'
  },

  // === IT/CYBER DEFENSE CHALLENGES ===
  firewall_blocks: {
    id: 'firewall_blocks',
    world: 'it',
    title: 'Firewall konfigurieren',
    description: 'Blockiere verdächtige IP-Adressen.',
    instructions: 'Wähle alle verdächtigen IPs aus der Liste. Rote IPs blockieren, grüne erlauben.',
    timeLimitMs: 20000,
    difficulty: 'medium',
    evaluate: (blocked: string[]) => {
      const suspicious = ['192.168.1.666', '10.0.0.1337', '172.16.255.999'];
      return suspicious.every(ip => blocked.includes(ip)) && blocked.length === suspicious.length;
    },
    a11yHint: 'Wähle verdächtige IP-Adressen zum Blockieren aus.',
    successMessage: '🛡️ Firewall erfolgreich konfiguriert.',
    failMessage: '🚨 Sicherheitslücke! Falsche IPs blockiert.'
  },
  
  phishing_detect: {
    id: 'phishing_detect',
    world: 'it',
    title: 'Phishing erkennen',
    description: 'Identifiziere die Phishing-E-Mail.',
    instructions: 'Prüfe Absender, Links und Sprache. Welche E-Mail ist verdächtig?',
    timeLimitMs: 25000,
    difficulty: 'hard',
    evaluate: (selectedEmail: string) => selectedEmail === 'suspicious_bank_email',
    a11yHint: 'Prüfe E-Mail-Details auf Phishing-Indikatoren.',
    successMessage: '🕵️ Phishing-Versuch erfolgreich erkannt!',
    failMessage: '🎣 Phishing-E-Mail übersehen. Sicherheitsrisiko!'
  },
  
  password_build: {
    id: 'password_build',
    world: 'it',
    title: 'Sicheres Passwort',
    description: 'Erstelle ein sicheres Passwort.',
    instructions: 'Kombiniere Großbuchstaben, Zahlen und Sonderzeichen. Mindestens 12 Zeichen.',
    timeLimitMs: 30000,
    difficulty: 'medium',
    evaluate: (password: string) => {
      return password.length >= 12 &&
             /[A-Z]/.test(password) &&
             /[0-9]/.test(password) &&
             /[^A-Za-z0-9]/.test(password);
    },
    a11yHint: 'Erstelle Passwort mit Großbuchstaben, Zahlen und Sonderzeichen.',
    successMessage: '🔐 Starkes Passwort erstellt!',
    failMessage: '🔓 Passwort zu schwach. Mehr Komplexität erforderlich.'
  },

  // === LEGAL/COMPLIANCE CHALLENGES ===
  gdpr_clause_pick: {
    id: 'gdpr_clause_pick',
    world: 'legal',
    title: 'DSGVO-Artikel wählen',
    description: 'Welcher Artikel regelt das Auskunftsrecht?',
    instructions: 'Wähle den korrekten DSGVO-Artikel für das Auskunftsrecht der betroffenen Person.',
    timeLimitMs: 18000,
    difficulty: 'medium',
    evaluate: (article: string) => article === 'art15',
    a11yHint: 'Wähle den DSGVO-Artikel für Auskunftsrecht.',
    successMessage: '⚖️ Korrekt! Artikel 15 regelt das Auskunftsrecht.',
    failMessage: '📋 Falsch. Artikel 15 DSGVO regelt das Auskunftsrecht.'
  },
  
  leak_stop: {
    id: 'leak_stop',
    world: 'legal',
    title: 'Datenleck stoppen',
    description: 'Sofortmaßnahmen bei Datenleck einleiten.',
    instructions: 'Reihenfolge der Sofortmaßnahmen: 1) Leck stoppen 2) Melden 3) Dokumentieren 4) Betroffene informieren',
    timeLimitMs: 22000,
    difficulty: 'hard',
    evaluate: (sequence: string[]) => 
      JSON.stringify(sequence) === JSON.stringify(['stop_leak', 'report_authority', 'document', 'notify_affected']),
    a11yHint: 'Wähle die korrekte Reihenfolge der Sofortmaßnahmen.',
    successMessage: '🚨 Datenleck erfolgreich eingedämmt!',
    failMessage: '💥 Falsche Reihenfolge. Datenschutzverstoß verschlimmert!'
  },

  // === PUBLIC ADMIN CHALLENGES ===
  form_order: {
    id: 'form_order',
    world: 'public',
    title: 'Antragsreihenfolge',
    description: 'Sortiere Anträge nach Priorität.',
    instructions: 'Dringende Anträge zuerst, dann nach Eingangsdatum sortieren.',
    timeLimitMs: 20000,
    difficulty: 'medium',
    evaluate: (order: string[]) => order[0] === 'urgent_application' && order[1] === 'standard_old',
    a11yHint: 'Sortiere Anträge nach Dringlichkeit und Datum.',
    successMessage: '📋 Anträge korrekt priorisiert.',
    failMessage: '⏰ Falsche Prioritätensetzung. Dringende Fälle zuerst!'
  },
  
  file_catch: {
    id: 'file_catch',
    world: 'public',
    title: 'Akten zuordnen',
    description: 'Ordne Akten den richtigen Sachbearbeitern zu.',
    instructions: 'Ziehe jede Akte zum zuständigen Sachbearbeiter basierend auf dem Fachgebiet.',
    timeLimitMs: 25000,
    difficulty: 'medium',
    evaluate: (assignments: Record<string, string>) => 
      assignments['tax_file'] === 'tax_officer' && 
      assignments['building_permit'] === 'building_officer',
    a11yHint: 'Ordne Akten nach Fachgebiet den Sachbearbeitern zu.',
    successMessage: '📁 Alle Akten korrekt zugeordnet.',
    failMessage: '📄 Falsche Zuordnung. Verzögerungen im Verfahren!'
  },

  // === FACTORY/SAFETY CHALLENGES ===
  hazard_mark: {
    id: 'hazard_mark',
    world: 'factory',
    title: 'Gefahrenstellen markieren',
    description: 'Markiere alle Sicherheitsrisiken.',
    instructions: 'Tippe auf alle roten Gefahrenstellen in der Fabrikhalle.',
    timeLimitMs: 18000,
    difficulty: 'medium',
    evaluate: (markedHazards: string[]) => {
      const allHazards = ['exposed_wire', 'oil_spill', 'loose_railing', 'blocked_exit'];
      return allHazards.every(hazard => markedHazards.includes(hazard));
    },
    a11yHint: 'Identifiziere und markiere alle Sicherheitsrisiken.',
    successMessage: '⚠️ Alle Gefahrenstellen erfolgreich markiert.',
    failMessage: '💥 Gefahrenstellen übersehen. Unfallrisiko!'
  },
  
  emergency_stop: {
    id: 'emergency_stop',
    world: 'factory',
    title: 'Not-Aus auslösen',
    description: 'Schnell den richtigen Not-Aus-Schalter finden.',
    instructions: 'Finde und drücke den roten Not-Aus-Schalter für Maschine A3.',
    timeLimitMs: 8000,
    difficulty: 'easy',
    evaluate: (button: string) => button === 'emergency_stop_a3',
    a11yHint: 'Suche den Not-Aus-Schalter für Maschine A3.',
    successMessage: '🔴 Maschine sicher gestoppt!',
    failMessage: '⚡ Zu langsam! Sicherheitsvorfall eingetreten.'
  },
  
  chain_stack: {
    id: 'chain_stack',
    world: 'factory',
    title: 'Lieferkette organisieren',
    description: 'Ordne die Produktionsschritte.',
    instructions: 'Bringe die Produktionsschritte in die richtige Reihenfolge: Material → Bearbeitung → Qualität → Versand',
    timeLimitMs: 20000,
    difficulty: 'medium',
    evaluate: (steps: string[]) => 
      JSON.stringify(steps) === JSON.stringify(['material', 'processing', 'quality', 'shipping']),
    a11yHint: 'Ordne Produktionsschritte von Material bis Versand.',
    successMessage: '🏭 Produktionskette optimal organisiert.',
    failMessage: '📦 Falsche Reihenfolge. Produktionsausfall!'
  }
};

// Helper: Get challenges by world
export function getChallengesByWorld(world: string): Challenge[] {
  return Object.values(CHALLENGES).filter(challenge => challenge.world === world);
}

// Helper: Get random challenge for world
export function getRandomChallenge(world: string, difficulty?: string): Challenge | null {
  const worldChallenges = getChallengesByWorld(world);
  const filtered = difficulty ? 
    worldChallenges.filter(c => c.difficulty === difficulty) : 
    worldChallenges;
  
  if (filtered.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex];
}

// Helper: Validate challenge input
export function validateChallengeInput(challenge: Challenge, input: any): boolean {
  try {
    return challenge.evaluate(input);
  } catch (error) {
    console.error(`Challenge ${challenge.id} evaluation failed:`, error);
    return false;
  }
} 
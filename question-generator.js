// ===================================================
// 🎮 JUNOSIXTEEN - QUESTION GENERATOR
// Advanced Multi-Modal Learning System
// ===================================================

const fs = require('fs');
const path = require('path');

// ===================================================
// 🎯 THEMENBEREICHE (88+ BEREICHE)
// ===================================================

const THEMENBEREICHE = [
  'Datenschutz', 'DSGVO', 'IT-Sicherheit', 'Cybersecurity', 'KI & Ethik',
  'EU AI Act', 'Algorithmic Bias', 'DEI', 'Rassismus', 'Menschenrechte',
  'Pflegeethik', 'Medizinethik', 'Kommunikation', 'Leadership', 'Change Management',
  'Konfliktmanagement', 'Teamführung', 'Projektmanagement', 'Zeitmanagement', 'Stressmanagement',
  'Burnout-Prävention', 'Work-Life-Balance', 'Resilienz', 'Selbstorganisation', 'Digitale Kompetenz',
  'Cloud Computing', 'Blockchain', 'Machine Learning', 'Deep Learning', 'Natural Language Processing',
  'Computer Vision', 'Robotics', 'IoT', 'Big Data', 'Data Analytics',
  'Business Intelligence', 'Agile Methoden', 'Scrum', 'Kanban', 'DevOps',
  'Software Engineering', 'Clean Code', 'Testing', 'Code Review', 'Version Control',
  'Continuous Integration', 'Deployment', 'Monitoring', 'Performance Optimization', 'Scalability',
  'Microservices', 'API Design', 'Database Design', 'SQL', 'NoSQL',
  'Web Development', 'Frontend Development', 'Backend Development', 'Mobile Development', 'UI/UX Design',
  'User Research', 'Information Architecture', 'Interaction Design', 'Visual Design', 'Accessibility',
  'Usability Testing', 'A/B Testing', 'Conversion Optimization', 'SEO', 'Content Marketing',
  'Social Media Marketing', 'Email Marketing', 'Performance Marketing', 'Brand Management', 'Customer Experience',
  'Sales Management', 'Account Management', 'Business Development', 'Negotiation', 'Presentation Skills',
  'Public Speaking', 'Meeting Management', 'Remote Work', 'Virtual Collaboration', 'Digital Communication',
  'Cross-Cultural Communication', 'Internationale Zusammenarbeit', 'Globalisation', 'Supply Chain', 'Logistics',
  'Quality Management', 'Risk Management', 'Compliance', 'Audit', 'Finance',
  'Controlling', 'Budgeting', 'Investment', 'Startup', 'Innovation Management',
  'Design Thinking', 'Lean Startup', 'Business Model Canvas', 'Strategy', 'Market Research'
];

// ===================================================
// 🏷️ THEMENKATEGORIEN
// ===================================================

const THEMENKATEGORIEN = {
  'Tech & IT': {
    beschreibung: 'Technologie und IT-Grundlagen',
    icon: '💻',
    bereiche: ['IT-Sicherheit', 'Cybersecurity', 'Cloud Computing', 'Blockchain', 'DevOps']
  },
  'KI & Data': {
    beschreibung: 'Künstliche Intelligenz und Datenanalyse', 
    icon: '🤖',
    bereiche: ['KI & Ethik', 'Machine Learning', 'Big Data', 'Data Analytics']
  },
  'Recht & Compliance': {
    beschreibung: 'Rechtliche Themen und Compliance',
    icon: '⚖️',
    bereiche: ['Datenschutz', 'DSGVO', 'EU AI Act', 'Compliance', 'Audit']
  },
  'Leadership & Management': {
    beschreibung: 'Führung und Management',
    icon: '👔',
    bereiche: ['Leadership', 'Change Management', 'Teamführung', 'Projektmanagement']
  },
  'Persönlichkeit & Skills': {
    beschreibung: 'Soft Skills und persönliche Entwicklung',
    icon: '🧠',
    bereiche: ['Kommunikation', 'Resilienz', 'Zeitmanagement', 'Work-Life-Balance']
  },
  'Ethik & Gesellschaft': {
    beschreibung: 'Ethische und gesellschaftliche Themen',
    icon: '🤝',
    bereiche: ['DEI', 'Menschenrechte', 'Pflegeethik', 'Algorithmic Bias']
  }
};

// ===================================================
// 🎯 LEVEL CONFIGURATION  
// ===================================================

const LEVEL_CONFIG = {
  1: { difficulty: 'sehr_einfach', baseScore: 200, questionTypes: ['default'] },
  2: { difficulty: 'einfach', baseScore: 250, questionTypes: ['default'] },
  3: { difficulty: 'einfach', baseScore: 300, questionTypes: ['default', 'team'] },
  4: { difficulty: 'mittel', baseScore: 350, questionTypes: ['default', 'team'] },
  5: { difficulty: 'mittel', baseScore: 400, questionTypes: ['default', 'team', 'risk'] }, // Risiko-Level
  6: { difficulty: 'mittel', baseScore: 450, questionTypes: ['default', 'team'] },
  7: { difficulty: 'schwer', baseScore: 500, questionTypes: ['default', 'team'] },
  8: { difficulty: 'schwer', baseScore: 550, questionTypes: ['default', 'team'] },
  9: { difficulty: 'expert', baseScore: 600, questionTypes: ['default', 'team'] },
  10: { difficulty: 'expert', baseScore: 700, questionTypes: ['default', 'team', 'risk'] } // Risiko-Level
};

// ===================================================
// 📚 CONTENT TEMPLATES
// ===================================================

const CONTENT_TEMPLATES = {
  grundlagen: ['Basics', 'Einführung', 'Grundwissen', 'Fundamentals'],
  advanced: ['Advanced', 'Praxis', 'Anwendung', 'Vertiefung'],
  expert: ['Expert', 'Spezialisierung', 'Mastery', 'Professional']
};

// ===================================================
// 🎨 LERNFORMAT-TYPEN 
// ===================================================

const LERNFORMAT_TYPEN = {
  WISSENSSNACK: 'wissenssnack',
  MICROLEARNING: 'microlearning', 
  STORYTELLING: 'storytelling',
  REFLEXION: 'reflexion',
  PERSOENLICHKEIT: 'persoenlichkeit',
  DEFAULT: 'default'
};

// ===================================================
// ⏰ ZEITKATEGORIEN FÜR MICROLEARNING
// ===================================================

const ZEIT_KATEGORIEN = {
  QUICK: { dauer: 60, label: '1 Min', icon: '⚡' },
  SHORT: { dauer: 180, label: '3 Min', icon: '🎯' },
  MEDIUM: { dauer: 300, label: '5 Min', icon: '📚' },
  DEEP: { dauer: 600, label: '10 Min', icon: '🧠' }
};

// ===================================================
// 🍿 WISSENSSNACKS-DEFINITION
// ===================================================

const WISSENSSNACKS = {
  'Was ist Ethik?': {
    id: 'ethik_basics',
    bereich: 'Ethik',
    dauer: 90,
    visuell: 'ethics-basics.svg',
    content: {
      titel: 'Ethik in 90 Sekunden',
      untertitel: 'Die Kunst des richtigen Handelns',
      abschnitte: [
        {
          typ: 'definition',
          text: 'Ethik fragt: "Was ist das Richtige?"',
          visuell: 'question-mark-icon'
        },
        {
          typ: 'beispiel',
          text: 'Beispiel: Darf KI über Menschen entscheiden?',
          visuell: 'ai-decision-icon'
        },
        {
          typ: 'anwendung',
          text: 'Im Beruf: Ehrlichkeit vs. Diplomatie',
          visuell: 'workplace-ethics-icon'
        }
      ],
      reflexion: 'Wo triffst du täglich ethische Entscheidungen?'
    }
  },
  '3 Arten von Bias': {
    id: 'bias_types',
    bereich: 'KI & Ethik',
    dauer: 120,
    visuell: 'bias-types.svg',
    content: {
      titel: 'Bias erkennen & vermeiden',
      untertitel: 'Unsere mentalen Abkürzungen verstehen',
      abschnitte: [
        {
          typ: 'typ1',
          text: '1. Bestätigungsfehler: Wir suchen bestätigende Infos',
          visuell: 'confirmation-bias-icon'
        },
        {
          typ: 'typ2', 
          text: '2. Ankereffekt: Erste Info beeinflusst stark',
          visuell: 'anchoring-bias-icon'
        },
        {
          typ: 'typ3',
          text: '3. Verfügbarkeitsheuristik: Erinnerbare = wahrscheinlich',
          visuell: 'availability-bias-icon'
        }
      ],
      reflexion: 'Welcher Bias beeinflusst dich am meisten?'
    }
  },
  'Pflegedokumentation kompakt': {
    id: 'pflege_docs',
    bereich: 'Pflegeethik',
    dauer: 150,
    visuell: 'care-documentation.svg',
    content: {
      titel: 'Dokumentation, die schützt',
      untertitel: 'Rechtssicher & patientenorientiert',
      abschnitte: [
        {
          typ: 'grundregel',
          text: 'Regel: Was nicht dokumentiert ist, ist nicht geschehen',
          visuell: 'documentation-rule-icon'
        },
        {
          typ: 'qualitaet',
          text: 'Qualität: Objektiv, messbar, nachvollziehbar',
          visuell: 'quality-standards-icon'
        },
        {
          typ: 'schutz',
          text: 'Schutz: Für Patient, Pfleger und Einrichtung',
          visuell: 'protection-icon'
        }
      ],
      reflexion: 'Was machst du bei unklaren Situationen?'
    }
  }
};

// ===================================================
// 🗺️ STORYTELLING-REIHEN DEFINITION
// ===================================================

const STORYTELLING_REIHEN = {
  'Meine Diversity-Reise': {
    id: 'diversity_journey',
    kategorie: '🏛️ Gesellschaft & Werte',
    beschreibung: 'Eine emotionale Reise durch Identität, Vorurteile und Handlungskompetenz',
    kapitel: [
      {
        titel: 'Kapitel 1: Wer bin ich?',
        bereich: 'DEI',
        fokus: 'Identität & Selbstreflexion',
        dauer: 300,
        visuell: 'identity-exploration.svg'
      },
      {
        titel: 'Kapitel 2: Vorurteile erkennen',
        bereich: 'Rassismus',
        fokus: 'Unconscious Bias verstehen',
        dauer: 240,
        visuell: 'bias-awareness.svg'
      },
      {
        titel: 'Kapitel 3: Macht & Privilegien',
        bereich: 'Menschenrechte',
        fokus: 'Strukturelle Ungleichheit',
        dauer: 360,
        visuell: 'power-dynamics.svg'
      },
      {
        titel: 'Kapitel 4: Inklusive Sprache',
        bereich: 'Kommunikation',
        fokus: 'Wertschätzende Kommunikation',
        dauer: 180,
        visuell: 'inclusive-language.svg'
      },
      {
        titel: 'Kapitel 5: Aktiv werden',
        bereich: 'Pädagogik',
        fokus: 'Allyship & Handlungsstrategien',
        dauer: 420,
        visuell: 'action-strategies.svg'
      }
    ],
    belohnung: {
      badge: 'Diversity Champion',
      xp: 2500,
      juno_coins: 100
    }
  },
  'Leadership Journey': {
    id: 'leadership_journey',
    kategorie: '💼 Beruf & Karriere',
    beschreibung: 'Vom Einzelkämpfer zur inspirierenden Führungskraft',
    kapitel: [
      {
        titel: 'Kapitel 1: Selbstführung',
        bereich: 'Selbstorganisation',
        fokus: 'Eigene Stärken & Werte',
        dauer: 300,
        visuell: 'self-leadership.svg'
      },
      {
        titel: 'Kapitel 2: Menschen verstehen',
        bereich: 'Psychologie',
        fokus: 'Empathie & Menschenkenntnis',
        dauer: 360,
        visuell: 'people-understanding.svg'
      },
      {
        titel: 'Kapitel 3: Konflikte lösen',
        bereich: 'Konfliktmanagement',
        fokus: 'Mediation & Deeskalation',
        dauer: 420,
        visuell: 'conflict-resolution.svg'
      },
      {
        titel: 'Kapitel 4: Teams inspirieren',
        bereich: 'Leadership',
        fokus: 'Motivation & Vision',
        dauer: 480,
        visuell: 'team-inspiration.svg'
      },
      {
        titel: 'Kapitel 5: Wandel gestalten',
        bereich: 'Change Management',
        fokus: 'Transformation führen',
        dauer: 540,
        visuell: 'change-leadership.svg'
      }
    ],
    belohnung: {
      badge: 'Leadership Master',
      xp: 3000,
      juno_coins: 150
    }
  }
};

// ===================================================
// 🧠 PERSÖNLICHKEITSENTWICKLUNG BONUSPFADE
// ===================================================

const PERSOENLICHKEIT_PFADE = {
  'Resilienz Masterclass': {
    id: 'resilience_master',
    kategorie: '🧠 Psychologie & Persönlichkeitsentwicklung',
    kosten: { juno_coins: 50, xp_requirement: 1000 },
    module: [
      'Stress verstehen', 'Emotionsregulation', 'Mentale Stärke',
      'Krisenkompetenz', 'Selbstwirksamkeit'
    ],
    belohnung: {
      badge: 'Resilience Expert',
      skill: 'Krisenmeister',
      xp: 1500
    }
  },
  'Mental Load Management': {
    id: 'mental_load',
    kategorie: '🧠 Psychologie & Persönlichkeitsentwicklung', 
    kosten: { juno_coins: 75, xp_requirement: 1500 },
    module: [
      'Unsichtbare Arbeit erkennen', 'Belastung messen',
      'Grenzen setzen', 'Delegation lernen', 'Balance finden'
    ],
    belohnung: {
      badge: 'Balance Master',
      skill: 'Energie-Experte',
      xp: 2000
    }
  }
};

// ===================================================
// 🌱 FREIWILLIGE LERNPFADE - OHNE ZWANG & DEADLINES
// "Lernfortschritt ohne Zwang"-Logik nach Imprint-Vorbild
// ===================================================

const FREIWILLIGE_PFADE = {
  'Tägliche Wissensimpulse': {
    id: 'daily_impulse',
    typ: 'freiwillig',
    kategorie: '🌱 Persönliches Wachstum',
    beschreibung: 'Täglich neue Erkenntnisse - ganz ohne Druck oder Deadlines',
    eigenschaften: {
      kein_zeitdruck: true,
      keine_deadlines: true,
      freie_reihenfolge: true,
      pausierbar: true,
      wiederholbar: true
    },
    motivation: {
      titel: 'Lernen aus innerer Motivation',
      beschreibung: 'Entdecke täglich neue Perspektiven in deinem eigenen Tempo',
      icon: '🌱'
    },
    module: [
      {
        titel: 'Ethik-Moment des Tages',
        dauer: 60,
        typ: 'wissenssnack',
        quelle: 'ethik_basics',
        belohnung: { xp: 50, badge_progress: 1 }
      },
      {
        titel: 'Bias-Bewusstsein stärken',
        dauer: 90,
        typ: 'reflexion',
        quelle: 'bias_types',
        belohnung: { xp: 75, badge_progress: 1 }
      },
      {
        titel: 'Kommunikations-Tipp',
        dauer: 45,
        typ: 'microlearning',
        bereich: 'Kommunikation',
        belohnung: { xp: 40, badge_progress: 1 }
      }
    ],
    belohnung: {
      typ: 'sammlung',
      badge: 'Wissensentdecker',
      beschreibung: 'Sammle 30 Tagesimpulse für dieses Badge',
      fortschritt_basiert: true
    }
  },

  'Ethik-Explorer': {
    id: 'ethics_explorer',
    typ: 'freiwillig',
    kategorie: '🤔 Philosophie & Ethik',
    beschreibung: 'Entdecke ethische Dilemmata in deinem eigenen Tempo',
    eigenschaften: {
      kein_zeitdruck: true,
      keine_deadlines: true,
      freie_reihenfolge: true,
      pausierbar: true,
      wiederholbar: true
    },
    motivation: {
      titel: 'Ethische Reflexion ohne Bewertung',
      beschreibung: 'Kein richtig oder falsch - nur persönliche Entwicklung',
      icon: '🤔'
    },
    szenarien: [
      {
        titel: 'KI-Entscheidungen im Krankenhaus',
        kontext: 'Medizinethik',
        dauer: 'flexibel',
        reflexion: 'Wer trägt Verantwortung bei KI-Diagnosen?'
      },
      {
        titel: 'Datenschutz vs. Sicherheit',
        kontext: 'Digitale Ethik',
        dauer: 'flexibel',
        reflexion: 'Wo liegt die Balance zwischen Privatsphäre und Schutz?'
      },
      {
        titel: 'Diversität in Teams',
        kontext: 'Arbeitsethik',
        dauer: 'flexibel',
        reflexion: 'Wie schaffe ich wirklich inklusive Räume?'
      }
    ],
    belohnung: {
      typ: 'reflexion',
      badge: 'Ethik-Philosoph',
      beschreibung: 'Für tiefe ethische Reflexionen',
      ohne_bewertung: true
    }
  },

  'Mein Lernjournal': {
    id: 'learning_journal',
    typ: 'freiwillig',
    kategorie: '📝 Selbstreflexion',
    beschreibung: 'Dokumentiere deine Lernreise - nur für dich',
    eigenschaften: {
      kein_zeitdruck: true,
      keine_deadlines: true,
      freie_reihenfolge: true,
      pausierbar: true,
      wiederholbar: true,
      privat: true
    },
    motivation: {
      titel: 'Persönliche Entwicklung verfolgen',
      beschreibung: 'Reflektiere deine Erkenntnisse ohne äußeren Druck',
      icon: '📝'
    },
    funktionen: [
      {
        typ: 'freie_reflexion',
        titel: 'Was habe ich heute gelernt?',
        speicher: 'lokal',
        bewertung: false
      },
      {
        typ: 'erkenntnisse',
        titel: 'Meine wichtigsten Aha-Momente',
        speicher: 'lokal',
        bewertung: false
      },
      {
        typ: 'anwendung',
        titel: 'Wie setze ich das im Alltag um?',
        speicher: 'lokal',
        bewertung: false
      }
    ],
    belohnung: {
      typ: 'selbstwirksamkeit',
      badge: 'Reflektor',
      beschreibung: 'Für kontinuierliche Selbstreflexion',
      privat: true
    }
  },

  'Neugier-Pfad': {
    id: 'curiosity_path',
    typ: 'freiwillig',
    kategorie: '🔍 Entdecken & Staunen',
    beschreibung: 'Folge deiner Neugier ohne vorgegebene Richtung',
    eigenschaften: {
      kein_zeitdruck: true,
      keine_deadlines: true,
      freie_reihenfolge: true,
      pausierbar: true,
      wiederholbar: true,
      algorithmus_frei: true
    },
    motivation: {
      titel: 'Lerne was dich wirklich interessiert',
      beschreibung: 'Kein Curriculum - nur deine Neugier als Kompass',
      icon: '🔍'
    },
    bereiche: [
      {
        titel: 'Psychologie des Alltags',
        themen: ['Warum vergessen wir Namen?', 'Wie entstehen Gewohnheiten?', 'Was motiviert Menschen wirklich?'],
        zugang: 'sofort_verfügbar'
      },
      {
        titel: 'Philosophie für den Alltag',
        themen: ['Was ist Glück?', 'Brauchen wir Ziele?', 'Was bedeutet Authentizität?'],
        zugang: 'sofort_verfügbar'
      },
      {
        titel: 'Zukunft der Arbeit',
        themen: ['KI als Kollege', 'Remote Leadership', 'Sinnvolle Arbeit finden'],
        zugang: 'sofort_verfügbar'
      }
    ],
    belohnung: {
      typ: 'entdeckung',
      badge: 'Entdecker',
      beschreibung: 'Für unermüdliche Neugier',
      überraschung: true
    }
  },

  'Stil-Labor': {
    id: 'style_lab',
    typ: 'freiwillig',
    kategorie: '🎨 Persönlicher Lernstil',
    beschreibung: 'Experimentiere mit verschiedenen Lernformaten',
    eigenschaften: {
      kein_zeitdruck: true,
      keine_deadlines: true,
      freie_reihenfolge: true,
      pausierbar: true,
      wiederholbar: true,
      experimentell: true
    },
    motivation: {
      titel: 'Finde deinen idealen Lernstil',
      beschreibung: 'Probiere aus, was zu dir passt - ohne Bewertung',
      icon: '🎨'
    },
    formate: [
      {
        typ: 'visuell',
        titel: 'Infografik-Lernen',
        beschreibung: 'Komplexe Themen in Bildern verstehen',
        verfügbar: true
      },
      {
        typ: 'auditiv',
        titel: 'Podcast-Style Learning',
        beschreibung: 'Lernen durch Zuhören und Diskussion',
        verfügbar: true
      },
      {
        typ: 'interaktiv',
        titel: 'Learning by Doing',
        beschreibung: 'Praktische Übungen und Simulationen',
        verfügbar: true
      },
      {
        typ: 'reflexiv',
        titel: 'Tiefe Reflexion',
        beschreibung: 'Langsames, durchdachtes Lernen',
        verfügbar: true
      }
    ],
    belohnung: {
      typ: 'selbstkenntnis',
      badge: 'Stil-Experte',
      beschreibung: 'Kennt den eigenen Lernstil',
      personalisiert: true
    }
  }
};

// ===================================================
// 💭 REFLEXIONSFRAGEN-POOL
// ===================================================

const REFLEXIONSFRAGEN = {
  allgemein: [
    'Was hat dich in diesem Modul überrascht?',
    'Was nimmst du für deinen Alltag mit?',
    'Wie würdest du das Gelernte anderen erklären?',
    'Welche Situation aus deinem Leben passt dazu?',
    'Was möchtest du als nächstes vertiefen?'
  ],
  ethik: [
    'Wo triffst du täglich ethische Entscheidungen?',
    'Welche Werte sind dir am wichtigsten?',
    'Wie balancierst du verschiedene Interessen?',
    'Wann ist Kompromiss, wann Prinzipientreue wichtiger?'
  ],
  leadership: [
    'Wie motivierst du andere am besten?',
    'Was macht für dich gute Führung aus?',
    'Welche Führungssituation war für dich schwierig?',
    'Wie gehst du mit Konflikten um?'
  ],
  persoenlichkeit: [
    'Was stärkt deine Resilienz?',
    'Wie erkennst du deine Grenzen?',
    'Was hilft dir bei Stress?',
    'Welche Gewohnheit möchtest du ändern?'
  ]
};

// ===================================================
// 🎯 QUESTION GENERATOR CLASS
// ===================================================

class QuestionGenerator {
  constructor() {
    this.questionPool = {};
    this.statistics = {
      totalGenerated: 0,
      byLevel: {},
      byBereich: {},
      byType: { default: 0, risk: 0, team: 0 }
    };
  }

  generateQuestionsForLevelBereich(level, bereich, count = 20) {
    const questions = [];
    const config = LEVEL_CONFIG[level];
    
    for (let i = 0; i < count; i++) {
      const questionType = config.questionTypes[Math.floor(Math.random() * config.questionTypes.length)];
      const question = this.generateSingleQuestion(level, bereich, questionType, i);
      questions.push(question);
    }
    
    return questions;
  }

  generateSingleQuestion(level, bereich, type, index) {
    const config = LEVEL_CONFIG[level];
    const baseScore = config.baseScore;
    const difficulty = config.difficulty;
    
    this.updateStatistics(level, bereich, type);
    
    switch (type) {
      case 'risk':
        return this.generateRiskQuestion(level, bereich, difficulty, baseScore);
      case 'team':
        return this.generateTeamQuestion(level, bereich, difficulty, baseScore);
      default:
        return this.generateDefaultQuestion(level, bereich, difficulty, baseScore, index);
    }
  }

  generateDefaultQuestion(level, bereich, difficulty, baseScore, index) {
    return {
      id: `${bereich}_L${level}_${index}_${Date.now()}`,
      type: 'default',
      level,
      bereich,
      difficulty,
      frage: `Was ist ein wichtiger Aspekt von ${bereich} (Level ${level})?`,
      antworten: [
        `${bereich} Grundlagen`,
        `${bereich} Anwendung (korrekt)`,
        `${bereich} Theorie`,
        `${bereich} Praxis`
      ],
      correct: 1,
      scoreValue: baseScore,
      erklaerung: `Dies ist die korrekte Antwort für ${bereich} auf Level ${level}.`,
      deadline: this.generateDeadline(),
      position: index + 1
    };
  }

  generateRiskQuestion(level, bereich, difficulty, baseScore) {
    return {
      id: `${bereich}_L${level}_RISK_${Date.now()}`,
      type: 'risk',
      level,
      bereich,
      difficulty,
      teile: [
        {
          frage: `Risiko-Teil 1: ${bereich} Grundverständnis`,
          antworten: ['Option A', 'Option B (korrekt)', 'Option C', 'Option D'],
          correct: 1
        },
        {
          frage: `Risiko-Teil 2: ${bereich} Anwendung`,
          antworten: ['Anwendung A', 'Anwendung B', 'Anwendung C (korrekt)', 'Anwendung D'],
          correct: 2
        }
      ],
      scoreValue: Math.round(baseScore * 1.5),
      erklaerung: `Risiko-Frage für ${bereich} - beide Teile müssen korrekt beantwortet werden.`,
      deadline: this.generateDeadline(),
      risikoMultiplier: 1.5
    };
  }

  generateTeamQuestion(level, bereich, difficulty, baseScore) {
    return {
      id: `${bereich}_L${level}_TEAM_${Date.now()}`,
      type: 'team',
      level,
      bereich,
      difficulty,
      frage: `Team-Szenario: Wie würdet ihr ${bereich} im Team umsetzen?`,
      antworten: [
        'Einzeln bearbeiten',
        'Gemeinsam diskutieren (korrekt)',
        'Aufteilen und später zusammenführen',
        'Experten konsultieren'
      ],
      correct: 1,
      scoreValue: baseScore,
      erklaerung: `Team-Fragen fördern Zusammenarbeit und gemeinsames Lernen.`,
      deadline: this.generateDeadline(),
      teamBonus: true
    };
  }

  generateDeadline(daysFromNow = 7) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + daysFromNow);
    deadline.setHours(23, 59, 0, 0);
    return deadline.toISOString();
  }

  updateStatistics(level, bereich, type) {
    this.statistics.totalGenerated++;
    this.statistics.byLevel[level] = (this.statistics.byLevel[level] || 0) + 1;
    this.statistics.byBereich[bereich] = (this.statistics.byBereich[bereich] || 0) + 1;
    this.statistics.byType[type]++;
  }
}

// ===================================================
// 🔧 HELPER FUNCTIONS
// ===================================================

function generateQuestions(level, bereich, count = 20) {
  const generator = new QuestionGenerator();
  return generator.generateQuestionsForLevelBereich(level, bereich, count);
}

// ===================================================
// 📤 MODULE EXPORTS
// ===================================================

module.exports = {
  // Core Question System
  QuestionGenerator,
  generateQuestions,
  THEMENBEREICHE,
  THEMENKATEGORIEN,
  LEVEL_CONFIG,
  CONTENT_TEMPLATES,
  
  // Learning Formats & Content
  LERNFORMAT_TYPEN,
  ZEIT_KATEGORIEN,
  WISSENSSNACKS,
  STORYTELLING_REIHEN,
  PERSOENLICHKEIT_PFADE,
  REFLEXIONSFRAGEN,
  
  // 🌱 Freiwillige Pfade ohne Zwang
  FREIWILLIGE_PFADE
}; 
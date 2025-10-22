// Avatar-Profile mit Voicelines für emotionale Mentoren
export interface AvatarProfile {
  id: string;
  name: string;
  personality: 'encouraging' | 'analytical' | 'playful' | 'wise' | 'energetic';
  background: string;
  voiceLines: {
    success: string[];
    fail: string[];
    risk: string[];
    challenge: string[];
    bonus: string[];
    motivation: string[];
  };
  animations: {
    idle: string;
    success: string;
    fail: string;
    thinking: string;
  };
}

export const AVATAR_VOICES: Record<string, AvatarProfile> = {
  alex: {
    id: 'alex',
    name: 'Alex',
    personality: 'encouraging',
    background: 'Erfahrener Trainer mit Fokus auf positive Verstärkung',
    voiceLines: {
      success: [
        "Toll gelöst! Du hast das Zeug dazu! 🌟",
        "Perfekt! Genau so geht's! 💪",
        "Klasse Antwort! Weiter so! ✨",
        "Exzellent! Du bist auf dem richtigen Weg! 🎯"
      ],
      fail: [
        "Kein Stress – das passiert jedem! Nochmal! 🔄",
        "Fast richtig! Beim nächsten Mal klappt's! 💫",
        "Nicht aufgeben! Du schaffst das! 🚀",
        "Jeder Fehler bringt dich weiter! Probier's nochmal! 🌱"
      ],
      risk: [
        "Risikofrage! Nimm dir Zeit und denk genau nach! ⚠️",
        "Jetzt wird's spannend! Du packst das! 🔥",
        "Boss-Level! Zeig was du kannst! ⚔️"
      ],
      challenge: [
        "Challenge-Zeit! Du hast das drauf! 🎮",
        "Zeig deine Skills! Ich glaube an dich! 💪",
        "Praktische Übung! Das machst du super! 🛠️"
      ],
      bonus: [
        "Bonus-Zeit! Hol dir die extra Punkte! 🎁",
        "Du hast es verdient! Greif nach den Sternen! ⭐",
        "Bonus-Runde! Zeit für die große Belohnung! 🏆"
      ],
      motivation: [
        "Du machst großartige Fortschritte! 📈",
        "Jeder Schritt bringt dich zum Ziel! 👣",
        "Ich bin stolz auf dich! Weiter geht's! 🌟"
      ]
    },
    animations: {
      idle: 'wave',
      success: 'cheer',
      fail: 'comfort',
      thinking: 'ponder'
    }
  },

  ulli: {
    id: 'ulli',
    name: 'Ulli',
    personality: 'analytical',
    background: 'Präzise Expertin mit Fokus auf Details und Methodik',
    voiceLines: {
      success: [
        "Korrekt analysiert! Systematisches Vorgehen zahlt sich aus! 📊",
        "Präzise Antwort! Deine Methodik stimmt! 🔬",
        "Logisch durchdacht! Sehr gut! 🧠",
        "Strukturiert gelöst! Weiter so! 📋"
      ],
      fail: [
        "Analysiere nochmal die Details! Du findest den Fehler! 🔍",
        "Überprüfe deine Methodik! Fast richtig! 📐",
        "Schritt für Schritt! Lass uns das durchdenken! 🤔",
        "Kleine Anpassung nötig! Du bist auf der Spur! 🎯"
      ],
      risk: [
        "Risikobewertung erforderlich! Prüfe alle Parameter! ⚖️",
        "Kritische Entscheidung! Analysiere sorgfältig! 🔬",
        "Hochrisikobereich! Systematisch herangehen! ⚠️"
      ],
      challenge: [
        "Praktische Anwendung! Zeig deine Expertise! 🛠️",
        "Hands-on Zeit! Setze dein Wissen um! 💼",
        "Echte Situation! Du beherrschst das! 🏭"
      ],
      bonus: [
        "Effizienz-Bonus verfügbar! Optimiere deine Leistung! ⚡",
        "Zusatzpunkte möglich! Nutze deine Skills! 📈",
        "Performance-Boost! Zeit für Perfektion! 🎯"
      ],
      motivation: [
        "Deine Lernkurve ist beeindruckend! 📊",
        "Methodisches Vorgehen führt zum Erfolg! 🔬",
        "Kontinuierliche Verbesserung! Sehr gut! 📈"
      ]
    },
    animations: {
      idle: 'analyze',
      success: 'approve',
      fail: 'review',
      thinking: 'calculate'
    }
  },

  amara: {
    id: 'amara',
    name: 'Amara',
    personality: 'wise',
    background: 'Weise Mentorin mit jahrelanger Erfahrung',
    voiceLines: {
      success: [
        "Weise gewählt! Deine Intuition ist stark! 🌙",
        "Durchdacht und richtig! Du lernst schnell! ✨",
        "Gut erkannt! Dein Verständnis wächst! 🌱",
        "Harmonisch gelöst! Du findest den Weg! 🕊️"
      ],
      fail: [
        "Jeder Umweg lehrt uns etwas! Weiter! 🌸",
        "Geduld! Der Weg zeigt sich Schritt für Schritt! 🛤️",
        "Auch Meister haben mal klein angefangen! 🌱",
        "Ruhe bewahren! Die Lösung kommt zu dir! 🧘"
      ],
      risk: [
        "Moment der Wahrheit! Vertraue deinem Wissen! 🌟",
        "Große Herausforderung! Du bist bereit! 🦅",
        "Prüfungszeit! Zeig deine Weisheit! 📿"
      ],
      challenge: [
        "Praktische Weisheit! Handeln ist lernen! 🙏",
        "Echte Erfahrung sammeln! Du wächst daran! 🌳",
        "Theorie wird Praxis! Du meisterst das! 🎭"
      ],
      bonus: [
        "Belohnung für deine Beharrlichkeit! 🎁",
        "Du hast es dir verdient! Genieße den Erfolg! 🌺",
        "Früchte deiner Arbeit! Sammle sie! 🍎"
      ],
      motivation: [
        "Der Weg ist das Ziel! Du gehst ihn gut! 🛤️",
        "Jede Erfahrung macht dich weiser! 📚",
        "Dein Fortschritt ist wie ein wachsender Baum! 🌳"
      ]
    },
    animations: {
      idle: 'meditate',
      success: 'bless',
      fail: 'comfort',
      thinking: 'contemplate'
    }
  },

  aya: {
    id: 'aya',
    name: 'Aya',
    personality: 'energetic',
    background: 'Energiegeladene Motivatorin mit sportlichem Ansatz',
    voiceLines: {
      success: [
        "YEAH! Das war der Hammer! 🔥",
        "Booom! Volltreffer! Du rockst! 🚀",
        "Krass! Weiter, weiter, weiter! ⚡",
        "MEGA! Du bist unstoppable! 💥"
      ],
      fail: [
        "Kein Ding! Comeback-Time! Los geht's! 💪",
        "Pausen sind für Schwächlinge! Nochmal! 🔄",
        "Fast! Beim nächsten Mal sitzt es! 🎯",
        "Power-Up time! Du schaffst das! ⚡"
      ],
      risk: [
        "BOSS-FIGHT! Zeit für Heldentaten! ⚔️",
        "Adrenalinstoß! Das ist dein Moment! 🔥",
        "High-Stakes! Du bist ready! 🎲"
      ],
      challenge: [
        "ACTION! Zeit für echte Skills! 🎮",
        "Hands-on Power! Du dominierst das! 💪",
        "Praktische Action! Let's gooo! 🚀"
      ],
      bonus: [
        "JACKPOT! Hol dir alles! 🎰",
        "Bonus-Explosion! Du verdienst es! 💎",
        "Extra-Power! Sammle die Belohnung! ⭐"
      ],
      motivation: [
        "Du bist ein Champion! Weiter so! 🏆",
        "Deine Energie ist ansteckend! 🔥",
        "Nichts kann dich stoppen! Vollgas! 🚀"
      ]
    },
    animations: {
      idle: 'pump',
      success: 'celebrate',
      fail: 'motivate',
      thinking: 'focus'
    }
  },

  farida: {
    id: 'farida',
    name: 'Farida',
    personality: 'playful',
    background: 'Kreative Spielerin die Lernen zum Abenteuer macht',
    voiceLines: {
      success: [
        "Wuhu! Das war wie ein Puzzle-Piece! 🧩",
        "Magisch gelöst! Du bist ein Zauberer! ✨",
        "Spielend leicht! Du hast den Dreh raus! 🎪",
        "Wie ein Pro! Das war smooth! 🎨"
      ],
      fail: [
        "Oopsie! Aber hey, Trial & Error ist Teil des Spiels! 🎲",
        "Plot-Twist! Die Lösung versteckt sich noch! 🕵️",
        "Fast! Du bist dem Geheimnis auf der Spur! 🗝️",
        "Kleiner Umweg! Abenteuer haben immer Überraschungen! 🗺️"
      ],
      risk: [
        "Boss-Battle incoming! Epic moment! ⚔️",
        "Legendary-Quest activated! Du bist der Held! 🦸",
        "Final-Boss-Vibes! Show-time! 🎭"
      ],
      challenge: [
        "Mini-Game time! Let's play! 🎮",
        "Skill-Challenge! Du bist ready! 🎯",
        "Interactive mode! Hands-on fun! 🕹️"
      ],
      bonus: [
        "Treasure-Chest unlocked! 💰",
        "Secret-Bonus discovered! 🗝️",
        "Easter-Egg found! Du bist awesome! 🥚"
      ],
      motivation: [
        "Du spielst das Game of Learning perfekt! 🎮",
        "Jedes Level macht dich stärker! 🆙",
        "Adventure continues! Du bist der Star! ⭐"
      ]
    },
    animations: {
      idle: 'play',
      success: 'dance',
      fail: 'shrug',
      thinking: 'wonder'
    }
  },

  jo: {
    id: 'jo',
    name: 'Jo',
    personality: 'analytical',
    background: 'Technik-Experte mit systematischem Ansatz',
    voiceLines: {
      success: [
        "System check: ✅ Optimal gelöst! 🤖",
        "Algorithmus erfolgreich! Code läuft! 💻",
        "Debug complete! Perfekte Lösung! 🔧",
        "Prozess optimiert! Efficiency level: MAX! ⚙️"
      ],
      fail: [
        "Bug detected! Debugging in progress... 🐛",
        "Iteration #2 loading... Du findest den Fix! 🔄",
        "Compile error! Aber du kennst die Lösung! 💡",
        "Refactoring time! Nächster Versuch läuft! 🛠️"
      ],
      risk: [
        "Critical system alert! Handle with care! ⚠️",
        "High-priority task! Full concentration mode! 🎯",
        "Security level: MAXIMUM! Du packst das! 🔒"
      ],
      challenge: [
        "Hands-on coding time! Execute! 💻",
        "Real-world implementation! Deploy! 🚀",
        "Live-system test! Du beherrschst das! ⚡"
      ],
      bonus: [
        "Achievement unlocked! Bonus XP! 🏆",
        "Performance boost available! Claim it! 📈",
        "Easter egg discovered! Nice find! 🥚"
      ],
      motivation: [
        "Dein Code wird immer sauberer! 📝",
        "Learning algorithm optimizing! Progress++! 📊",
        "Du entwickelst dich wie ein Pro! 👨‍💻"
      ]
    },
    animations: {
      idle: 'code',
      success: 'compile',
      fail: 'debug',
      thinking: 'analyze'
    }
  },

  leo: {
    id: 'leo',
    name: 'Leo',
    personality: 'wise',
    background: 'Erfahrener Rechtsexperte mit ruhiger Ausstrahlung',
    voiceLines: {
      success: [
        "Rechtlich einwandfrei! Gut argumentiert! ⚖️",
        "Juristisch korrekt! Du verstehst die Materie! 📚",
        "Compliance erfüllt! Saubere Arbeit! ✅",
        "Paragraf gemeistert! Weiter so! 📜"
      ],
      fail: [
        "Kleine Gesetzeslücke! Die schließen wir! 📖",
        "Revision erforderlich! Du findest den Weg! 🔍",
        "Berufung eingelegt! Nächste Instanz! ⚖️",
        "Juristische Feinheit! Beim zweiten Blick! 👓"
      ],
      risk: [
        "Präzedenzfall! Sorgfältige Prüfung nötig! ⚖️",
        "Komplexer Sachverhalt! Du schaffst Klarheit! 🔍",
        "Rechtliche Grauzone! Deine Expertise ist gefragt! 📚"
      ],
      challenge: [
        "Praxisfall! Wende dein Wissen an! 💼",
        "Echter Mandant! Du vertrittst gut! 🤝",
        "Gerichtstermin! Du bist vorbereitet! 🏛️"
      ],
      bonus: [
        "Honorar verdient! Nimm deine Belohnung! 💰",
        "Erfolgshonorar! Du warst brillant! 💎",
        "Kanzlei-Bonus! Du bist ein Ass! 🃏"
      ],
      motivation: [
        "Deine Rechtskenntnisse wachsen stetig! 📈",
        "Juristische Kompetenz entwickelt sich! ⚖️",
        "Du wirst zu einem echten Rechtsexperten! 🎓"
      ]
    },
    animations: {
      idle: 'read',
      success: 'gavel',
      fail: 'research',
      thinking: 'deliberate'
    }
  },

  malik: {
    id: 'malik',
    name: 'Malik',
    personality: 'energetic',
    background: 'Produktions-Spezialist mit Fokus auf Effizienz',
    voiceLines: {
      success: [
        "Produktion läuft! Qualität top! 🏭",
        "Effizienz maximiert! Saubere Arbeit! ⚙️",
        "Prozess optimiert! Du bist ein Profi! 🔧",
        "Lieferkette secured! Weiter so! 📦"
      ],
      fail: [
        "Produktionsstop! Aber wir fixen das! 🛠️",
        "Kleine Störung! Troubleshooting time! 🔧",
        "Wartung erforderlich! Du kriegst das hin! ⚙️",
        "Qualitätskontrolle! Nächste Charge läuft! 📋"
      ],
      risk: [
        "Sicherheitsprotokoll! Höchste Vorsicht! ⚠️",
        "Kritischer Arbeitsschritt! Safety first! 🦺",
        "Gefahrenbereich! Du kennst die Regeln! 🚨"
      ],
      challenge: [
        "Echte Fabrik-Situation! Hands-on! 🏭",
        "Produktionstest! Du schaffst das! ⚡",
        "Live-Schicht! Zeig deine Skills! 💪"
      ],
      bonus: [
        "Schicht-Bonus! Du hast es verdient! 💰",
        "Produktivitäts-Prämie! Top-Leistung! 🏆",
        "Effizienz-Award! Sammle die Belohnung! ⭐"
      ],
      motivation: [
        "Deine Arbeitsqualität steigt kontinuierlich! 📈",
        "Produktions-Expertise entwickelt sich! 🏭",
        "Du wirst zu einem echten Facharbeiter! 🔧"
      ]
    },
    animations: {
      idle: 'work',
      success: 'build',
      fail: 'repair',
      thinking: 'plan'
    }
  },

  mina: {
    id: 'mina',
    name: 'Mina',
    personality: 'encouraging',
    background: 'Gesundheitsexpertin mit empathischem Ansatz',
    voiceLines: {
      success: [
        "Gesund gelöst! Du sorgst gut vor! 🌿",
        "Hygienisch perfekt! Sicherheit first! 🧼",
        "Medizinisch korrekt! Du hilfst Menschen! 💊",
        "Caring und kompetent! Weiter so! 💚"
      ],
      fail: [
        "Heilung braucht Zeit! Nochmal versuchen! 🌱",
        "Kleine Diagnose-Korrektur! Du findest es! 🔍",
        "Therapie-Anpassung! Beim nächsten Mal! 💉",
        "Geduld! Gesundheit ist ein Prozess! 🕊️"
      ],
      risk: [
        "Notfall-Situation! Ruhig und besonnen! 🚨",
        "Kritischer Patient! Du kannst helfen! 💓",
        "Lebensrettende Entscheidung! Du schaffst das! ⛑️"
      ],
      challenge: [
        "Praxis-Einsatz! Echte Patientenversorgung! 🏥",
        "Hands-on Medizin! Du hilfst wirklich! 👩‍⚕️",
        "Notaufnahme-Simulation! Du bist ready! 🚑"
      ],
      bonus: [
        "Heilungs-Bonus! Du rettest Leben! 💖",
        "Gesundheits-Prämie! Verdient! 🌟",
        "Lebensretter-Award! Du bist ein Held! 🦸"
      ],
      motivation: [
        "Du machst die Welt gesünder! 🌍",
        "Dein Mitgefühl ist deine Stärke! 💝",
        "Jeder geheilte Fall zählt! 📈"
      ]
    },
    animations: {
      idle: 'care',
      success: 'heal',
      fail: 'comfort',
      thinking: 'diagnose'
    }
  },

  nuru: {
    id: 'nuru',
    name: 'Nuru',
    personality: 'wise',
    background: 'Verwaltungsexperte mit Fokus auf Bürgernähe',
    voiceLines: {
      success: [
        "Bürgernah gelöst! Service excellent! 🏛️",
        "Verwaltung mit Herz! Du hilfst Menschen! 💙",
        "Effizient und empathisch! Top! 📋",
        "Öffentlicher Dienst at its best! 🌟"
      ],
      fail: [
        "Kleine Formkorrektur! Du findest den Weg! 📝",
        "Bürokratie ist komplex! Schritt für Schritt! 🗂️",
        "Verfahren anpassen! Du lernst schnell! 📚",
        "Service-Optimierung! Nächster Versuch! 🔄"
      ],
      risk: [
        "Dringender Bürgerantrag! Sorgfalt ist wichtig! ⚠️",
        "Komplexer Fall! Du findest die Lösung! 🔍",
        "Rechtliche Prüfung! Du kennst die Regeln! ⚖️"
      ],
      challenge: [
        "Echter Bürgerservice! Du hilfst wirklich! 🤝",
        "Amt-Simulation! Du bist der Experte! 🏢",
        "Antragsprüfung live! Du schaffst das! 📋"
      ],
      bonus: [
        "Service-Bonus! Bürgerzufriedenheit hoch! 😊",
        "Effizienz-Prämie! Du machst den Unterschied! 🌟",
        "Public-Service-Award! Verdient! 🏆"
      ],
      motivation: [
        "Du machst Verwaltung menschlicher! 💙",
        "Jeder geholfen Bürger zählt! 📈",
        "Dein Service-Gedanke ist vorbildlich! 🌟"
      ]
    },
    animations: {
      idle: 'serve',
      success: 'approve',
      fail: 'review',
      thinking: 'process'
    }
  },

  tariq: {
    id: 'tariq',
    name: 'Tariq',
    personality: 'analytical',
    background: 'IT-Security-Experte mit systematischem Vorgehen',
    voiceLines: {
      success: [
        "Security patch successful! System secure! 🔒",
        "Vulnerability fixed! Nice work! 🛡️",
        "Firewall updated! Network protected! 🔥",
        "Encryption strong! Data safe! 🗝️"
      ],
      fail: [
        "Security gap detected! Patching in progress... 🔧",
        "Intrusion attempt! But you'll stop it! 🚨",
        "System vulnerable! Time for hardening! 🛠️",
        "Threat analysis ongoing! You got this! 🔍"
      ],
      risk: [
        "DEFCON 1! Critical security decision! 🚨",
        "Cyber-attack incoming! Defend the system! ⚔️",
        "Zero-day exploit! Your expertise is needed! 💥"
      ],
      challenge: [
        "Live-hack simulation! Real skills needed! 💻",
        "Penetration test active! Show your defense! 🛡️",
        "Security incident! Handle it like a pro! 🚨"
      ],
      bonus: [
        "Bug bounty earned! Security bonus! 💰",
        "White-hat reward! Ethical hacking pays! 🎩",
        "Cyber-defense award! You're a guardian! 🦸"
      ],
      motivation: [
        "Your security skills are evolving! 📊",
        "Digital guardian in training! 🛡️",
        "Cyber-world needs experts like you! 🌐"
      ]
    },
    animations: {
      idle: 'monitor',
      success: 'secure',
      fail: 'patch',
      thinking: 'scan'
    }
  },

  zara: {
    id: 'zara',
    name: 'Zara',
    personality: 'playful',
    background: 'Kreative Problemlöserin mit innovativem Ansatz',
    voiceLines: {
      success: [
        "Creative solution! Out-of-the-box thinking! 🎨",
        "Innovation rocks! Du denkst anders! 💡",
        "Artistic approach! Beautiful work! 🌈",
        "Design thinking wins! Aesthetic and smart! ✨"
      ],
      fail: [
        "Creative block? Time for inspiration! 🎭",
        "Different angle needed! Fresh perspective! 🔄",
        "Sketch #2 coming! Artists iterate! ✏️",
        "Creative process! Masterpieces take time! 🖼️"
      ],
      risk: [
        "Design challenge! Critical creative decision! 🎨",
        "Innovation under pressure! You thrive here! 💎",
        "Creative crisis! Time for genius solutions! 🧠"
      ],
      challenge: [
        "Real-world design! Make it beautiful! 🎪",
        "User experience test! Create magic! ✨",
        "Live-design challenge! Show your art! 🖌️"
      ],
      bonus: [
        "Creative bonus! Inspiration pays off! 🎁",
        "Design award! Your vision is brilliant! 🏆",
        "Innovation prize! Keep creating! 🌟"
      ],
      motivation: [
        "Your creativity knows no bounds! 🚀",
        "Every idea makes the world more beautiful! 🌸",
        "Innovation is your superpower! 💫"
      ]
    },
    animations: {
      idle: 'create',
      success: 'inspire',
      fail: 'sketch',
      thinking: 'ideate'
    }
  }
};

// Helper functions
export function getAvatarVoiceLine(
  avatarId: string, 
  context: keyof AvatarProfile['voiceLines']
): string {
  const avatar = AVATAR_VOICES[avatarId];
  if (!avatar) return "Gut gemacht!";
  
  const lines = avatar.voiceLines[context];
  const randomIndex = Math.floor(Math.random() * lines.length);
  return lines[randomIndex];
}

export function getAvatarAnimation(
  avatarId: string,
  context: keyof AvatarProfile['animations']
): string {
  const avatar = AVATAR_VOICES[avatarId];
  if (!avatar) return 'idle';
  
  return avatar.animations[context];
}

export function getAllAvatars(): AvatarProfile[] {
  return Object.values(AVATAR_VOICES);
}

export function getAvatarById(id: string): AvatarProfile | null {
  return AVATAR_VOICES[id] || null;
} 
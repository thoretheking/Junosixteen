/**
 * Story Generator System
 * Dynamische Story-Generierung für Missionen (LLM-ready)
 */

import { World } from '../common/types.js';

export interface StoryContext {
  world: World;
  missionId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  userLevel: number;
  previousMissions?: string[];
  userPreferences?: {
    storyStyle?: 'serious' | 'playful' | 'dramatic';
    detailLevel?: 'brief' | 'medium' | 'detailed';
  };
}

export interface GeneratedStory {
  briefing: string;
  questIntros: string[]; // 10 Intro-Texte für jede Frage
  debriefSuccess: string;
  debriefFail: string;
  cliffhanger: string;
  
  // Additional story elements
  characterDialogue?: string[];
  plotTwists?: string[];
  environmentDescription?: string;
}

/**
 * Story Templates pro World
 */
const STORY_TEMPLATES: Record<World, {
  theme: string;
  setting: string;
  protagonist: string;
  antagonist: string;
  goal: string;
}> = {
  health: {
    theme: 'Medizinische Präzision',
    setting: 'Hochmodernes CleanRoom-Labor',
    protagonist: 'Du - Der neue Hygiene-Spezialist',
    antagonist: 'Unsichtbare Kontamination',
    goal: 'Sterile Umgebung sichern und Leben retten',
  },
  it: {
    theme: 'Cyber-Kriegsführung',
    setting: 'Hochsicherheits-Rechenzentrum',
    protagonist: 'Du - Elite Cyber-Defender',
    antagonist: 'Internationale Hacker-Gruppe',
    goal: 'Netzwerk verteidigen und Daten schützen',
  },
  legal: {
    theme: 'Rechtliche Präzedenzfälle',
    setting: 'Modernes Anwaltsbüro',
    protagonist: 'Du - Compliance-Officer',
    antagonist: 'Komplexe Rechtslage',
    goal: 'Compliance sicherstellen und Verstöße verhindern',
  },
  public: {
    theme: 'Öffentlicher Dienst',
    setting: 'Bürgeramt der Zukunft',
    protagonist: 'Du - Service-Champion',
    antagonist: 'Bürokratische Hürden',
    goal: 'Bürgern helfen und Verwaltung humanisieren',
  },
  factory: {
    theme: 'Industrielle Sicherheit',
    setting: 'High-Tech-Produktionshalle',
    protagonist: 'Du - Sicherheitsbeauftragter',
    antagonist: 'Produktionsrisiken',
    goal: 'Null Unfälle erreichen und Qualität sichern',
  },
};

/**
 * Generate story briefing
 */
export function generateBriefing(context: StoryContext): string {
  const template = STORY_TEMPLATES[context.world];
  const difficulty = getDifficultyModifier(context.difficulty);

  const briefings: Record<World, string[]> = {
    health: [
      `🏥 MISSION BRIEFING - ${template.theme}\n\n` +
      `Setting: ${template.setting}\n` +
      `Deine Rolle: ${template.protagonist}\n\n` +
      `Die Lage ist ${difficulty.adjective}. Ein neuer Patient wird erwartet und der CleanRoom muss ` +
      `absolut steril sein. Jeder Fehler kann tödlich sein.\n\n` +
      `Dein Ziel: ${template.goal}\n` +
      `Schwierigkeit: ${difficulty.level}\n\n` +
      `Bereite dich vor. Die Mission beginnt JETZT!`,
    ],
    it: [
      `💻 MISSION BRIEFING - ${template.theme}\n\n` +
      `Setting: ${template.setting}\n` +
      `Deine Rolle: ${template.protagonist}\n\n` +
      `WARNUNG: Eine ${difficulty.adjective} Cyber-Attacke wurde entdeckt. ` +
      `${template.antagonist} versucht in unser Netzwerk einzudringen.\n\n` +
      `Dein Ziel: ${template.goal}\n` +
      `Schwierigkeit: ${difficulty.level}\n\n` +
      `Alle Systeme scharf. Security-Level ${difficulty.level.toUpperCase()}. Los geht's!`,
    ],
    legal: [
      `⚖️ MISSION BRIEFING - ${template.theme}\n\n` +
      `Setting: ${template.setting}\n` +
      `Deine Rolle: ${template.protagonist}\n\n` +
      `Ein ${difficulty.adjective} Fall ist auf deinem Schreibtisch gelandet. ` +
      `Die Rechtslage ist kompliziert und die Fristen sind knapp.\n\n` +
      `Dein Ziel: ${template.goal}\n` +
      `Schwierigkeit: ${difficulty.level}\n\n` +
      `Die Uhr tickt. Der Fall wartet. Recht muss gesprochen werden!`,
    ],
    public: [
      `🏛️ MISSION BRIEFING - ${template.theme}\n\n` +
      `Setting: ${template.setting}\n` +
      `Deine Rolle: ${template.protagonist}\n\n` +
      `${difficulty.adjective} Tag am Bürgeramt. Die Warteschlange ist lang und ` +
      `die Bürger brauchen deine Hilfe.\n\n` +
      `Dein Ziel: ${template.goal}\n` +
      `Schwierigkeit: ${difficulty.level}\n\n` +
      `Schalter offen. Service-Level ${difficulty.level.toUpperCase()}. Auf geht's!`,
    ],
    factory: [
      `🏭 MISSION BRIEFING - ${template.theme}\n\n` +
      `Setting: ${template.setting}\n` +
      `Deine Rolle: ${template.protagonist}\n\n` +
      `Die Produktion läuft auf ${difficulty.adjective} Niveau. ` +
      `Deine Aufgabe: Sicherheit gewährleisten und Unfälle verhindern.\n\n` +
      `Dein Ziel: ${template.goal}\n` +
      `Schwierigkeit: ${difficulty.level}\n\n` +
      `Schicht beginnt. Sicherheitsstufe ${difficulty.level.toUpperCase()}. Los geht's!`,
    ],
  };

  return briefings[context.world][0];
}

/**
 * Generate quest intros (für jede Frage)
 */
export function generateQuestIntros(context: StoryContext): string[] {
  const intros: string[] = [];

  for (let i = 1; i <= 10; i++) {
    if (i === 1) {
      intros.push('🎯 Erste Herausforderung: Grundlagen meistern!');
    } else if (i === 5) {
      intros.push('⚠️ RISIKOFRAGE! Konzentration ist gefragt!');
    } else if (i === 9) {
      intros.push('🤝 TEAMFRAGE! Gemeinsam stark!');
    } else if (i === 10) {
      intros.push('⚠️ FINALE RISIKOFRAGE! Alles oder nichts!');
    } else {
      intros.push(`Frage ${i} von 10 - Du schaffst das!`);
    }
  }

  return intros;
}

/**
 * Generate debrief (success)
 */
export function generateDebriefSuccess(context: StoryContext): string {
  const debriefs: Record<World, string[]> = {
    health: [
      '🏆 MISSION ERFOLGREICH!\n\n' +
      'Ausgezeichnet! Du hast alle Sicherheitsprotokolle gemeistert. ' +
      'Der CleanRoom ist jetzt absolut steril und der Patient ist sicher.\n\n' +
      '✅ Alle Hygiene-Standards eingehalten\n' +
      '✅ Null Kontaminationen\n' +
      '✅ Leben gerettet\n\n' +
      'Du bist bereit für die nächste Herausforderung!',
    ],
    it: [
      '🏆 MISSION ERFOLGREICH!\n\n' +
      'System gesichert! Du hast alle Cyber-Angriffe erfolgreich abgewehrt. ' +
      'Das Netzwerk ist wieder sicher.\n\n' +
      '✅ Alle Bedrohungen neutralisiert\n' +
      '✅ Firewall steht\n' +
      '✅ Daten geschützt\n\n' +
      'Die Hacker ziehen sich zurück. Du hast gewonnen!',
    ],
    legal: [
      '🏆 MISSION ERFOLGREICH!\n\n' +
      'Rechtlich einwandfrei! Du hast alle Fälle erfolgreich gelöst. ' +
      'Die Compliance ist gesichert.\n\n' +
      '✅ Alle Fristen eingehalten\n' +
      '✅ DSGVO-konform\n' +
      '✅ Rechtssicherheit gegeben\n\n' +
      'Der Mandant ist zufrieden!',
    ],
    public: [
      '🏆 MISSION ERFOLGREICH!\n\n' +
      'Bürgerzufriedenheit 100%! Du hast allen effizient und freundlich geholfen. ' +
      'Die Verwaltung dankt dir!\n\n' +
      '✅ Alle Anträge bearbeitet\n' +
      '✅ Service-Qualität exzellent\n' +
      '✅ Bürger glücklich\n\n' +
      'Du machst den Unterschied!',
    ],
    factory: [
      '🏆 MISSION ERFOLGREICH!\n\n' +
      'Null Unfälle! Du hast alle Sicherheitsprotokolle perfekt umgesetzt. ' +
      'Die Produktion läuft sicher!\n\n' +
      '✅ Keine Verletzungen\n' +
      '✅ Qualität gesichert\n' +
      '✅ Produktion on track\n\n' +
      'Die Schicht war ein voller Erfolg!',
    ],
  };

  return debriefs[context.world][0];
}

/**
 * Generate debrief (fail)
 */
export function generateDebriefFail(context: StoryContext): string {
  const debriefs: Record<World, string[]> = {
    health: [
      '❌ MISSION GESCHEITERT\n\n' +
      'Leider hast du die Mission nicht bestanden. Aber keine Sorge - ' +
      'jeder Experte hat mal klein angefangen.\n\n' +
      '💡 Tipps fürs nächste Mal:\n' +
      '• Mehr Zeit für Hygiene-Protokolle nehmen\n' +
      '• Bei Unsicherheit Hinweise nutzen\n' +
      '• Reihenfolge ist wichtig!\n\n' +
      'Versuch es nochmal - du lernst aus jedem Fehler!',
    ],
    it: [
      '❌ MISSION GESCHEITERT\n\n' +
      'Security Breach! Diesmal haben die Hacker gewonnen. ' +
      'Aber du lernst aus jedem Angriff!\n\n' +
      '💡 Tipps fürs nächste Mal:\n' +
      '• Phishing-Mails genauer prüfen\n' +
      '• Firewall-Regeln beachten\n' +
      '• Bei Risikofragen Zeit nehmen\n\n' +
      'Kein Cyber-Defender gewinnt jeden Kampf. Weiter geht\'s!',
    ],
    legal: [
      '❌ MISSION GESCHEITERT\n\n' +
      'Gesetzesverstoß! Diesmal hat die Rechtslage gewonnen. ' +
      'Aber Juristen lernen ein Leben lang!\n\n' +
      '💡 Tipps fürs nächste Mal:\n' +
      '• DSGVO-Artikel wiederholen\n' +
      '• Fristen genau beachten\n' +
      '• Bei Unsicherheit Gesetze nachschlagen\n\n' +
      'Selbst erfahrene Anwälte machen Fehler. Weitermachen!',
    ],
    public: [
      '❌ MISSION GESCHEITERT\n\n' +
      'Service-Ausfall! Diesmal waren die Prozesse zu komplex. ' +
      'Aber der beste Service kommt durch Übung!\n\n' +
      '💡 Tipps fürs nächste Mal:\n' +
      '• Prioritäten setzen\n' +
      '• Freundlich bleiben\n' +
      '• Prozesse verinnerlichen\n\n' +
      'Jeder Service-Champion hat mal angefangen. Du schaffst das!',
    ],
    factory: [
      '❌ MISSION GESCHEITERT\n\n' +
      'Sicherheitsvorfall! Diesmal ist etwas schiefgegangen. ' +
      'Aber aus Fehlern lernen wir am meisten!\n\n' +
      '💡 Tipps fürs nächste Mal:\n' +
      '• Sicherheitsprotokolle wiederholen\n' +
      '• Gefahren früher erkennen\n' +
      '• Not-Aus-Prozeduren üben\n\n' +
      'Sicherheit ist ein Lernprozess. Nochmal versuchen!',
    ],
  };

  return debriefs[context.world][0];
}

/**
 * Generate cliffhanger
 */
export function generateCliffhanger(context: StoryContext): string {
  const cliffhangers: Record<World, string[]> = {
    health: [
      '🚨 EILMELDUNG: Ein mysteriöser Kontaminationsvorfall wurde gemeldet. ' +
      'Die Quelle ist unbekannt. Bist du bereit für die nächste Mission?',
      
      '⚠️ WARNUNG: Ein neuer Virus-Stamm wurde entdeckt. ' +
      'Die Protokolle müssen angepasst werden. Deine Expertise wird gebraucht!',
    ],
    it: [
      '🚨 WARNUNG: Ein Zero-Day-Exploit wurde entdeckt. ' +
      'Alle Systeme sind gefährdet. Bist du bereit für die nächste Herausforderung?',
      
      '⚠️ ALERT: Unbekannte Hacker-Gruppe plant Großangriff. ' +
      'Intel deutet auf koordinierte Attacke hin. Die Verteidigung muss stehen!',
    ],
    legal: [
      '🚨 EILMELDUNG: Ein kritischer Datenschutzvorfall erfordert sofortige Aufmerksamkeit. ' +
      'Die Fristen sind extrem knapp. Bist du bereit?',
      
      '⚠️ BREAKING: Neue EU-Verordnung in Kraft. ' +
      'Alle Verträge müssen geprüft werden. Die Uhr tickt!',
    ],
    public: [
      '🚨 DRINGEND: Ein Bürger mit kritischem Anliegen wartet am Schalter. ' +
      'Der Fall ist komplex. Kannst du helfen?',
      
      '⚠️ EILANTRAG: VIP-Bürger benötigt Sonderbehandlung. ' +
      'Die Erwartungen sind hoch. Bist du bereit?',
    ],
    factory: [
      '🚨 ALARM: Not-Aus ausgelöst in Halle 3! ' +
      'Ein kritischer Vorfall erfordert deine Expertise. Sofort!',
      
      '⚠️ PRODUKTIONSSTOPP: Qualitätskontrolle hat Mängel gefunden. ' +
      'Die gesamte Linie muss überprüft werden. Deine Mission!',
    ],
  };

  const worldCliffhangers = cliffhangers[context.world];
  return worldCliffhangers[Math.floor(Math.random() * worldCliffhangers.length)];
}

/**
 * Get difficulty modifier for story tone
 */
function getDifficultyModifier(difficulty: 'easy' | 'medium' | 'hard'): {
  level: string;
  adjective: string;
  intensity: string;
} {
  const modifiers = {
    easy: {
      level: 'Einsteiger',
      adjective: 'überschaubar',
      intensity: 'ruhig',
    },
    medium: {
      level: 'Fortgeschritten',
      adjective: 'herausfordernd',
      intensity: 'angespannt',
    },
    hard: {
      level: 'Experte',
      adjective: 'kritisch',
      intensity: 'hochspannend',
    },
  };

  return modifiers[difficulty];
}

/**
 * Generate progress story elements
 */
export function generateProgressNarrative(
  questIndex: number,
  context: StoryContext
): string {
  if (questIndex === 1) {
    return '🎯 Der Einstieg - lass uns mit den Grundlagen beginnen!';
  }

  if (questIndex === 5) {
    return '⚠️ RISIKOFRAGE! Die Situation wird ernst. Höchste Konzentration!';
  }

  if (questIndex === 9) {
    return '🤝 TEAMFRAGE! Deine Kollegen zählen auf dich. Gemeinsam schaffen wir das!';
  }

  if (questIndex === 10) {
    return '⚠️ FINALE RISIKOFRAGE! Das ist die letzte Hürde. Alles oder nichts!';
  }

  const midpoints = [
    'Gut gemacht! Weiter so!',
    'Du machst Fortschritte!',
    'Bleib fokussiert!',
    'Fast geschafft!',
  ];

  return midpoints[questIndex % midpoints.length];
}

/**
 * Generate character dialogue (Avatar)
 */
export function generateAvatarDialogue(
  avatarId: string,
  situation: 'intro' | 'success' | 'fail' | 'risk' | 'team' | 'finale',
  context: StoryContext
): string {
  const dialogues: Record<string, Record<string, string[]>> = {
    alex: {
      intro: ['Hey! Bereit für ein Abenteuer? Los geht\'s! 🌟'],
      success: ['Toll gelöst! Du hast das Zeug dazu! 🎉'],
      fail: ['Kein Stress – das passiert jedem! Nochmal! 🔄'],
      risk: ['Risikofrage! Nimm dir Zeit und denk genau nach! ⚠️'],
      team: ['Teamwork! Zeig was du kannst! 🤝'],
      finale: ['Das ist es! Die letzte Frage! Du schaffst das! 🎯'],
    },
    ulli: {
      intro: ['Analysiere systematisch. Logik ist der Schlüssel! 📊'],
      success: ['Korrekt analysiert! Systematisches Vorgehen zahlt sich aus! ✅'],
      fail: ['Analysiere nochmal die Details! Du findest den Fehler! 🔍'],
      risk: ['Risiko erkannt! Prüfe alle Optionen sorgfältig! ⚠️'],
      team: ['Teamanalyse! Gemeinsam sind wir stärker! 👥'],
      finale: ['Finale Analyse! Systematisch durchdenken! 🎯'],
    },
    // ... weitere Avatare
  };

  const avatarDialogues = dialogues[avatarId] || dialogues.alex;
  const situationDialogues = avatarDialogues[situation] || ['Weiter so!'];

  return situationDialogues[0];
}

/**
 * Generate plot twist for mission
 */
export function generatePlotTwist(context: StoryContext): string | null {
  // 10% Chance für Plot-Twist
  if (Math.random() > 0.1) return null;

  const twists: Record<World, string[]> = {
    health: [
      '🎭 PLOT TWIST: Der Patient hat eine seltene Allergie! Die Protokolle müssen angepasst werden!',
      '🎭 PLOT TWIST: Stromausfall! Du musst im Notlicht arbeiten!',
    ],
    it: [
      '🎭 PLOT TWIST: Der Angriff kam von innen! Ein Insider-Threat!',
      '🎭 PLOT TWIST: Doppelter Angriff! Eine Ablenkung war geplant!',
    ],
    legal: [
      '🎭 PLOT TWIST: Neue Beweise aufgetaucht! Der Fall muss neu bewertet werden!',
      '🎭 PLOT TWIST: Frist wurde verkürzt! Nur noch 24 Stunden!',
    ],
    public: [
      '🎭 PLOT TWIST: VIP-Besuch angekündigt! Alles muss perfekt laufen!',
      '🎭 PLOT TWIST: System-Ausfall! Du musst manuell arbeiten!',
    ],
    factory: [
      '🎭 PLOT TWIST: Maschinenausfall! Notfallprozeduren erforderlich!',
      '🎭 PLOT TWIST: Qualitätskontrolle hat kritische Mängel gefunden!',
    ],
  };

  const worldTwists = twists[context.world];
  return worldTwists[Math.floor(Math.random() * worldTwists.length)];
}

/**
 * Generate complete story
 */
export function generateCompleteStory(context: StoryContext): GeneratedStory {
  return {
    briefing: generateBriefing(context),
    questIntros: generateQuestIntros(context),
    debriefSuccess: generateDebriefSuccess(context),
    debriefFail: generateDebriefFail(context),
    cliffhanger: generateCliffhanger(context),
    characterDialogue: [
      generateAvatarDialogue(context.userPreferences?.storyStyle || 'alex', 'intro', context),
    ],
    plotTwists: [generatePlotTwist(context)].filter(Boolean) as string[],
    environmentDescription: STORY_TEMPLATES[context.world].setting,
  };
}

/**
 * LLM Integration Point (Future)
 */
export async function generateStoryWithLLM(
  context: StoryContext,
  llmEndpoint?: string
): Promise<GeneratedStory> {
  if (!llmEndpoint) {
    // Fallback to template-based generation
    return generateCompleteStory(context);
  }

  try {
    // TODO: Implement LLM API call
    // const response = await fetch(llmEndpoint, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     prompt: `Generate an engaging learning mission story for ${context.world}...`,
    //     context,
    //   }),
    // });
    // const llmStory = await response.json();
    // return llmStory;

    // For now, use template
    return generateCompleteStory(context);
  } catch (error) {
    console.error('LLM story generation failed, using template:', error);
    return generateCompleteStory(context);
  }
}



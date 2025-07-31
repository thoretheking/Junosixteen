// ===================================================
// 🎯 QUESTION POOL GENERATOR FOR ALL 88+ BEREICHE
// ===================================================

const fs = require('fs');
const path = require('path');
const { QuestionGenerator, THEMENBEREICHE, LEVEL_CONFIG } = require('./question-generator');

// ===================================================
// 🏗️ MASSIVE QUESTION POOL GENERATION
// ===================================================

class MassiveQuestionPoolGenerator {
  constructor() {
    this.questionGenerator = new QuestionGenerator();
    this.statistics = {
      totalGenerated: 0,
      byBereich: {},
      byLevel: {},
      byType: { default: 0, risk: 0, team: 0 },
      generationTime: 0,
      startTime: Date.now()
    };
    this.outputDir = './question-pools';
  }

  // Erstelle alle Fragenpools für alle Bereiche
  async generateAllPools() {
    console.log('🚀 GENERIERE MASSIVE FRAGENPOOLS FÜR ALLE BEREICHE');
    console.log('====================================================');
    console.log(`📊 Bereiche: ${THEMENBEREICHE.length}`);
    console.log(`📋 Level pro Bereich: 10`);
    console.log(`❓ Fragen pro Level: 100`);
    console.log(`🎯 Geschätzte Gesamtfragen: ${THEMENBEREICHE.length * 10 * 100}+`);
    console.log('====================================================\n');

    // Erstelle output Verzeichnis
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    let bereichIndex = 0;
    for (const bereich of THEMENBEREICHE) {
      bereichIndex++;
      console.log(`\n🔄 [${bereichIndex}/${THEMENBEREICHE.length}] Generiere ${bereich}...`);
      await this.generateBereichPool(bereich);
      
      // Fortschritt anzeigen
      const percentage = ((bereichIndex / THEMENBEREICHE.length) * 100).toFixed(1);
      console.log(`   ✅ ${bereich} abgeschlossen (${percentage}%)`);
    }

    // Statistiken speichern
    await this.saveStatistics();
    await this.generateCompleteIndex();
    
    this.statistics.generationTime = Date.now() - this.statistics.startTime;
    this.printFinalStatistics();
  }

  // Generiere Fragenpool für einen Bereich (alle 10 Level)
  async generateBereichPool(bereich) {
    const bereichPool = {};
    this.statistics.byBereich[bereich] = { total: 0, byLevel: {} };

    for (let level = 1; level <= 10; level++) {
      const questions = await this.generateLevelQuestions(bereich, level);
      bereichPool[level] = questions;
      
      this.statistics.byBereich[bereich].byLevel[level] = questions.length;
      this.statistics.byBereich[bereich].total += questions.length;
      this.statistics.totalGenerated += questions.length;
      
      if (!this.statistics.byLevel[level]) {
        this.statistics.byLevel[level] = 0;
      }
      this.statistics.byLevel[level] += questions.length;
    }

    // Speichere Bereich-Pool als JSON
    const filename = `${bereich.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}.json`;
    const filepath = path.join(this.outputDir, filename);
    
    try {
      fs.writeFileSync(filepath, JSON.stringify(bereichPool, null, 2));
      console.log(`   💾 Gespeichert: ${filepath} (${this.statistics.byBereich[bereich].total} Fragen)`);
    } catch (error) {
      console.error(`   ❌ Fehler beim Speichern von ${bereich}:`, error.message);
    }
  }

  // Generiere Fragen für ein Level in einem Bereich
  async generateLevelQuestions(bereich, level, count = 100) {
    const questions = [];
    const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[1];

    // Verteilung der Fragetypen
    const typeDistribution = {
      default: Math.floor(count * 0.7),  // 70% Standard-Fragen
      risk: Math.floor(count * 0.2),     // 20% Risiko-Fragen
      team: Math.floor(count * 0.1)      // 10% Team-Fragen
    };

    // Generiere Standard-Fragen
    for (let i = 0; i < typeDistribution.default; i++) {
      const question = this.generateAdvancedQuestion(bereich, level, 'default', i);
      questions.push(question);
      this.statistics.byType.default++;
    }

    // Generiere Risiko-Fragen
    for (let i = 0; i < typeDistribution.risk; i++) {
      const question = this.generateAdvancedQuestion(bereich, level, 'risk', i);
      questions.push(question);
      this.statistics.byType.risk++;
    }

    // Generiere Team-Fragen
    for (let i = 0; i < typeDistribution.team; i++) {
      const question = this.generateAdvancedQuestion(bereich, level, 'team', i);
      questions.push(question);
      this.statistics.byType.team++;
    }

    return this.shuffleArray(questions);
  }

  // Generiere erweiterte Frage mit realistischem Content
  generateAdvancedQuestion(bereich, level, type, index) {
    const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[1];
    const baseScore = config.baseScore;
    const difficulty = config.difficulty;

    const questionTemplates = this.getQuestionTemplates(bereich, level);
    const template = questionTemplates[Math.floor(Math.random() * questionTemplates.length)];

    switch (type) {
      case 'risk':
        return this.generateAdvancedRiskQuestion(bereich, level, template, baseScore, index);
      case 'team':
        return this.generateAdvancedTeamQuestion(bereich, level, template, baseScore, index);
      default:
        return this.generateAdvancedDefaultQuestion(bereich, level, template, baseScore, index);
    }
  }

  // Erweiterte Standard-Frage
  generateAdvancedDefaultQuestion(bereich, level, template, baseScore, index) {
    return {
      id: `${bereich}_L${level}_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: 'default',
      level,
      bereich,
      difficulty: LEVEL_CONFIG[level]?.difficulty || 'medium',
      frage: template.question.replace('{bereich}', bereich).replace('{level}', level),
      antworten: template.answers.map(a => a.replace('{bereich}', bereich)),
      correct: template.correctAnswer,
      scoreValue: baseScore + Math.floor(Math.random() * 20 - 10), // ±10 Varianz
      erklaerung: template.explanation.replace('{bereich}', bereich),
      deadline: this.generateDeadline(level),
      position: index + 1,
      tags: this.generateTags(bereich, level),
      metadata: {
        generatedAt: new Date().toISOString(),
        generator: 'MassiveQuestionPoolGenerator',
        version: '1.0'
      }
    };
  }

  // Erweiterte Risiko-Frage
  generateAdvancedRiskQuestion(bereich, level, template, baseScore, index) {
    return {
      id: `${bereich}_L${level}_RISK_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: 'risk',
      level,
      bereich,
      difficulty: LEVEL_CONFIG[level]?.difficulty || 'hard',
      teile: [
        {
          frage: `Risiko-Situation: ${template.question.replace('{bereich}', bereich)} - Teil 1`,
          antworten: template.riskPart1 || template.answers,
          correct: template.riskCorrect1 || template.correctAnswer
        },
        {
          frage: `Konsequenzen-Analyse: Was passiert bei falscher Entscheidung? - Teil 2`,
          antworten: template.riskPart2 || this.generateConsequenceAnswers(bereich),
          correct: template.riskCorrect2 || 1
        }
      ],
      scoreValue: Math.round(baseScore * 1.5) + Math.floor(Math.random() * 30 - 15),
      erklaerung: `RISIKO-FRAGE: ${template.riskExplanation || template.explanation} - Beide Teile müssen korrekt sein!`,
      deadline: this.generateDeadline(level, 1.5),
      risikoMultiplier: 1.5,
      warnung: 'Falsche Antwort führt zu Level-Reset!',
      tags: [...this.generateTags(bereich, level), 'risk', 'critical'],
      metadata: {
        generatedAt: new Date().toISOString(),
        generator: 'MassiveQuestionPoolGenerator',
        version: '1.0',
        isHighStakes: true
      }
    };
  }

  // Erweiterte Team-Frage
  generateAdvancedTeamQuestion(bereich, level, template, baseScore, index) {
    return {
      id: `${bereich}_L${level}_TEAM_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: 'team',
      level,
      bereich,
      difficulty: LEVEL_CONFIG[level]?.difficulty || 'medium',
      frage: `Team-Szenario (${bereich}): ${template.teamQuestion || template.question.replace('{bereich}', bereich)}`,
      antworten: template.teamAnswers || this.generateTeamAnswers(bereich),
      correct: template.teamCorrect || 1,
      scoreValue: baseScore + 20, // Team-Bonus
      erklaerung: template.teamExplanation || `Team-Arbeit ist bei ${bereich} besonders wichtig für optimale Ergebnisse.`,
      deadline: this.generateDeadline(level, 0.8), // Mehr Zeit für Team-Diskussion
      teamBonus: true,
      teamSize: Math.floor(Math.random() * 5) + 3, // 3-7 Personen
      collaborationRequired: true,
      tags: [...this.generateTags(bereich, level), 'team', 'collaboration'],
      metadata: {
        generatedAt: new Date().toISOString(),
        generator: 'MassiveQuestionPoolGenerator',
        version: '1.0',
        isTeamQuestion: true
      }
    };
  }

  // Fragenvorlagen für verschiedene Bereiche
  getQuestionTemplates(bereich, level) {
    const templates = [
      {
        question: `Was ist der wichtigste Aspekt von {bereich} auf Level ${level}?`,
        answers: [
          `Grundlagen von {bereich}`,
          `Praktische Anwendung von {bereich}`,
          `Theoretisches Verständnis von {bereich}`,
          `{bereich} in der Teamarbeit`
        ],
        correctAnswer: 1,
        explanation: `Die praktische Anwendung ist auf Level ${level} bei {bereich} entscheidend.`
      },
      {
        question: `Welche Herausforderung ist bei {bereich} Level ${level} am häufigsten?`,
        answers: [
          `Technische Komplexität`,
          `Zeitmanagement`,
          `Kommunikation im Team`,
          `Qualitätssicherung`
        ],
        correctAnswer: 0 + (level % 4),
        explanation: `Auf Level ${level} ist dies die größte Herausforderung bei {bereich}.`
      },
      {
        question: `Wie lösen Sie ein komplexes Problem in {bereich}?`,
        answers: [
          `Systematische Analyse`,
          `Sofortige Aktion`,
          `Team-Brainstorming`,
          `Experten konsultieren`
        ],
        correctAnswer: Math.floor(level / 3) % 4,
        explanation: `Diese Herangehensweise ist für Level ${level} in {bereich} optimal.`
      }
    ];

    // Bereichsspezifische Templates
    if (bereich.includes('IT') || bereich.includes('Software') || bereich.includes('Data')) {
      templates.push({
        question: `Welche Technologie ist für {bereich} Level ${level} am relevantesten?`,
        answers: [
          `Cloud-basierte Lösungen`,
          `Machine Learning Algorithmen`,
          `Blockchain-Technologie`,
          `Microservices-Architektur`
        ],
        correctAnswer: level % 4,
        explanation: `Diese Technologie ist auf Level ${level} für {bereich} besonders wichtig.`
      });
    }

    if (bereich.includes('Management') || bereich.includes('Leadership') || bereich.includes('Team')) {
      templates.push({
        question: `Welcher Führungsstil ist bei {bereich} Level ${level} am effektivsten?`,
        answers: [
          `Demokratisch und partizipativ`,
          `Direktiv und entscheidungsfreudig`,
          `Coaching-orientiert`,
          `Transformational und visionär`
        ],
        correctAnswer: (level - 1) % 4,
        explanation: `Dieser Führungsstil passt optimal zu Level ${level} bei {bereich}.`
      });
    }

    return templates;
  }

  // Team-Antworten generieren
  generateTeamAnswers(bereich) {
    return [
      `Jeder arbeitet individuell an seinem Teil`,
      `Regelmäßige Team-Meetings und Abstimmung`,
      `Ein Experte leitet, andere folgen`,
      `Aufgaben werden gleichmäßig verteilt`
    ];
  }

  // Konsequenz-Antworten für Risiko-Fragen
  generateConsequenceAnswers(bereich) {
    return [
      `Minimale Auswirkungen, kann ignoriert werden`,
      `Serious consequences requiring immediate action`,
      `Moderate impact with recovery possible`,
      `Katastrophale Folgen für das gesamte System`
    ];
  }

  // Tags für bessere Kategorisierung
  generateTags(bereich, level) {
    const basicTags = [bereich.toLowerCase(), `level_${level}`];
    
    if (level <= 3) basicTags.push('beginner');
    else if (level <= 7) basicTags.push('intermediate');
    else basicTags.push('advanced');

    if (bereich.includes('IT')) basicTags.push('technology');
    if (bereich.includes('Management')) basicTags.push('leadership');
    if (bereich.includes('Ethik')) basicTags.push('ethics');
    
    return basicTags;
  }

  // Deadline generieren basierend auf Level und Typ
  generateDeadline(level, multiplier = 1) {
    const baseTimes = {
      1: 60, 2: 55, 3: 50, 4: 45, 5: 40,
      6: 35, 7: 30, 8: 25, 9: 20, 10: 15
    };
    
    return Math.round((baseTimes[level] || 30) * multiplier);
  }

  // Array mischen
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Statistiken speichern
  async saveStatistics() {
    const statsFile = path.join(this.outputDir, 'generation-statistics.json');
    const stats = {
      ...this.statistics,
      generatedAt: new Date().toISOString(),
      estimatedSize: `${(this.statistics.totalGenerated * 0.5 / 1024).toFixed(1)} KB per question (estimated)`,
      bereiche: THEMENBEREICHE.length,
      levels: 10,
      avgQuestionsPerBereich: Math.round(this.statistics.totalGenerated / THEMENBEREICHE.length)
    };

    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
    console.log(`\n📊 Statistiken gespeichert: ${statsFile}`);
  }

  // Vollständiger Index aller Pools
  async generateCompleteIndex() {
    const indexFile = path.join(this.outputDir, 'complete-index.json');
    const index = {
      version: '1.0',
      generatedAt: new Date().toISOString(),
      totalBereiche: THEMENBEREICHE.length,
      totalQuestions: this.statistics.totalGenerated,
      bereiche: THEMENBEREICHE.map(bereich => ({
        name: bereich,
        filename: `${bereich.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}.json`,
        questionCount: this.statistics.byBereich[bereich]?.total || 0,
        levels: 10
      })),
      statistics: this.statistics
    };

    fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));
    console.log(`📋 Vollständiger Index erstellt: ${indexFile}`);
  }

  // Finale Statistiken ausgeben
  printFinalStatistics() {
    console.log('\n🎉 GENERATION ABGESCHLOSSEN!');
    console.log('====================================================');
    console.log(`✅ Bereiche generiert: ${Object.keys(this.statistics.byBereich).length}`);
    console.log(`✅ Gesamte Fragen: ${this.statistics.totalGenerated.toLocaleString()}`);
    console.log(`✅ Standard-Fragen: ${this.statistics.byType.default.toLocaleString()}`);
    console.log(`✅ Risiko-Fragen: ${this.statistics.byType.risk.toLocaleString()}`);
    console.log(`✅ Team-Fragen: ${this.statistics.byType.team.toLocaleString()}`);
    console.log(`⏱️  Generierungszeit: ${(this.statistics.generationTime / 1000).toFixed(2)} Sekunden`);
    console.log(`💾 Output-Verzeichnis: ${path.resolve(this.outputDir)}`);
    console.log(`📊 Durchschnitt pro Bereich: ${Math.round(this.statistics.totalGenerated / THEMENBEREICHE.length)} Fragen`);
    console.log('====================================================');
    console.log('🚀 FRAGENPOOLS SIND BEREIT FÜR DEN PRODUKTIONSEINSATZ!');
  }
}

// ===================================================
// 🚀 EXECUTION
// ===================================================

if (require.main === module) {
  console.log('🎯 STARTE MASSIVE FRAGENPOOL-GENERIERUNG...\n');
  
  const generator = new MassiveQuestionPoolGenerator();
  generator.generateAllPools().then(() => {
    console.log('\n✅ ALLE FRAGENPOOLS ERFOLGREICH GENERIERT!');
    process.exit(0);
  }).catch(error => {
    console.error('\n❌ FEHLER BEI DER GENERIERUNG:', error);
    process.exit(1);
  });
}

module.exports = MassiveQuestionPoolGenerator; 
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Node.js Wrapper für Mangle Engine
 * Simuliert Go-Engine API für nahtlose Integration
 */
class MangleEngine {
  constructor() {
    this.facts = new Map();
    this.rules = new Map();
    this.verbose = process.env.NODE_ENV === 'development';
  }

  /**
   * Fügt eine Regel zur Engine hinzu
   * @param {string} ruleId - Eindeutige Regel-ID
   * @param {string} rule - Mangle-Regel im Prolog-Format
   */
  addRule(ruleId, rule) {
    this.rules.set(ruleId, rule);
    if (this.verbose) {
      console.log(`🔧 Added rule ${ruleId}: ${rule}`);
    }
  }

  /**
   * Fügt Facts zur Engine hinzu
   * @param {string} factId - Eindeutige Fact-ID
   * @param {string} fact - Fact im Prolog-Format
   */
  addFact(factId, fact) {
    this.facts.set(factId, fact);
    if (this.verbose) {
      console.log(`📊 Added fact ${factId}: ${fact}`);
    }
  }

  /**
   * Führt eine Query gegen die Engine aus
   * @param {string} query - Query im Prolog-Format
   * @returns {Promise<Object>} Query-Ergebnisse
   */
  async query(query) {
    try {
      // JunoSixteen spezifische Regel-Logik
      const result = this.evaluateJunoSixteenRules(query);
      
      if (this.verbose) {
        console.log(`🔍 Query: ${query}`);
        console.log(`📤 Result: ${JSON.stringify(result)}`);
      }

      return {
        success: true,
        results: result.results || [],
        facts_used: result.facts_used || [],
        rules_applied: result.rules_applied || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Query failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * JunoSixteen-spezifische Regel-Evaluierung
   * @param {string} query - Query string
   * @returns {Object} Evaluierungsergebnis
   */
  evaluateJunoSixteenRules(query) {
    const results = [];
    const facts_used = [];
    const rules_applied = [];

    // Level-Progress Regeln
    if (query.includes('canStart') || query.includes('can_start')) {
      return this.evaluateProgressRules(query);
    }

    // Game-Mechanik Regeln
    if (query.includes('apply_multiplier') || query.includes('risk_success')) {
      return this.evaluateGameRules(query);
    }

    // Empfehlungs-Regeln
    if (query.includes('recommend_snack') || query.includes('missed_concept')) {
      return this.evaluateRecommendationRules(query);
    }

    // Zertifikat-Regeln
    if (query.includes('award_certificate') || query.includes('completed_all_levels')) {
      return this.evaluateCertificateRules(query);
    }

    // Fallback: Leere Ergebnisse
    return { results: [], facts_used: [], rules_applied: [] };
  }

  /**
   * Evaluiert Progress-Regeln (Level-Freischaltung)
   */
  evaluateProgressRules(query) {
    const results = [];
    const facts_used = [];
    const rules_applied = ['progress_evaluation'];

    // Beispiel: can_start(U,L)?
    const match = query.match(/can_start\(([^,]+),\s*(\w+)\)/);
    if (match) {
      const user = match[1].replace(/['"]/g, '');
      const levelVar = match[2];

      // Prüfe completed_level Facts
      for (const [factId, fact] of this.facts) {
        if (fact.includes('completed_level') && fact.includes(user)) {
          const levelMatch = fact.match(/completed_level\([^,]+,\s*(\d+)\)/);
          if (levelMatch) {
            const completedLevel = parseInt(levelMatch[1]);
            const nextLevel = completedLevel + 1;

            results.push({
              U: user,
              L: nextLevel
            });
            facts_used.push(factId);
          }
        }
      }
    }

    return { results, facts_used, rules_applied };
  }

  /**
   * Evaluiert Game-Mechanik Regeln
   */
  evaluateGameRules(query) {
    const results = [];
    const facts_used = [];
    const rules_applied = ['game_mechanics'];

    // Beispiel: apply_multiplier(U,L,M)?
    if (query.includes('apply_multiplier')) {
      const match = query.match(/apply_multiplier\(([^,]+),\s*([^,]+),\s*(\w+)\)/);
      if (match) {
        const user = match[1].replace(/['"]/g, '');
        const level = parseInt(match[2]) || 0;

        // Prüfe Risiko-Erfolg
        let hasRiskSuccess = false;
        for (const [factId, fact] of this.facts) {
          if (fact.includes('risk_success') && fact.includes(user)) {
            hasRiskSuccess = true;
            facts_used.push(factId);
            break;
          }
        }

        if (hasRiskSuccess) {
          results.push({
            U: user,
            L: level,
            M: 2.0 // Verdopplung bei Risiko-Erfolg
          });
        }
      }
    }

    return { results, facts_used, rules_applied };
  }

  /**
   * Evaluiert Empfehlungs-Regeln
   */
  evaluateRecommendationRules(query) {
    const results = [];
    const facts_used = [];
    const rules_applied = ['recommendation_engine'];

    // Beispiel: recommend_snack(U,M)?
    if (query.includes('recommend_snack')) {
      const match = query.match(/recommend_snack\(([^,]+),\s*(\w+)\)/);
      if (match) {
        const user = match[1].replace(/['"]/g, '');

        // Prüfe missed_concept Facts
        for (const [factId, fact] of this.facts) {
          if (fact.includes('missed_concept') && fact.includes(user)) {
            results.push({
              U: user,
              M: 'datenschutz_basics',
              priority: 'high'
            });
            facts_used.push(factId);
          }
        }
      }
    }

    return { results, facts_used, rules_applied };
  }

  /**
   * Evaluiert Zertifikat-Regeln
   */
  evaluateCertificateRules(query) {
    const results = [];
    const facts_used = [];
    const rules_applied = ['certificate_evaluation'];

    // Beispiel: award_certificate(U,Course)?
    if (query.includes('award_certificate')) {
      const match = query.match(/award_certificate\(([^,]+),\s*([^)]+)\)/);
      if (match) {
        const user = match[1].replace(/['"]/g, '');
        const course = match[2].replace(/['"]/g, '');

        // Prüfe completed_all_levels und no violations
        let allLevelsCompleted = false;
        let hasViolations = false;

        for (const [factId, fact] of this.facts) {
          if (fact.includes('completed_all_levels') && fact.includes(user)) {
            allLevelsCompleted = true;
            facts_used.push(factId);
          }
          if (fact.includes('violation') && fact.includes(user)) {
            hasViolations = true;
          }
        }

        if (allLevelsCompleted && !hasViolations) {
          results.push({
            U: user,
            Course: course,
            eligible: true
          });
        }
      }
    }

    return { results, facts_used, rules_applied };
  }

  /**
   * Lädt Facts aus JSON-Datei
   * @param {string} filePath - Pfad zur Facts-Datei
   */
  async loadFactsFromFile(filePath) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      const facts = JSON.parse(data);
      
      // Konvertiere JSON Facts zu Prolog-Format
      this.convertJSONFactsToProlog(facts);
      
      if (this.verbose) {
        console.log(`📁 Loaded facts from ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to load facts from ${filePath}:`, error.message);
    }
  }

  /**
   * Konvertiert JSON Facts zu Prolog-Format
   * @param {Object} jsonFacts - Facts im JSON-Format
   */
  convertJSONFactsToProlog(jsonFacts) {
    let factId = 0;

    // answered_correct Facts
    if (jsonFacts.answered_correct) {
      jsonFacts.answered_correct.forEach(fact => {
        const [user, level, question, timestamp] = fact;
        this.addFact(`ac_${factId++}`, `answered_correct("${user}", ${level}, ${question}, "${timestamp}").`);
      });
    }

    // answered_wrong Facts
    if (jsonFacts.answered_wrong) {
      jsonFacts.answered_wrong.forEach(fact => {
        const [user, level, question, timestamp] = fact;
        this.addFact(`aw_${factId++}`, `answered_wrong("${user}", ${level}, ${question}, "${timestamp}").`);
      });
    }

    // deadline Facts
    if (jsonFacts.deadline) {
      jsonFacts.deadline.forEach(fact => {
        const [level, deadline] = fact;
        this.addFact(`dl_${factId++}`, `deadline(${level}, "${deadline}").`);
      });
    }

    // level_completions Facts
    if (jsonFacts.level_completions) {
      jsonFacts.level_completions.forEach(completion => {
        this.addFact(`lc_${factId++}`, `completed_level("${completion.userId}", ${completion.level}).`);
        this.addFact(`lc_time_${factId++}`, `level_completion_time("${completion.userId}", ${completion.level}, "${completion.timestamp}").`);
      });
    }

    // game_events Facts
    if (jsonFacts.game_events) {
      jsonFacts.game_events.forEach(event => {
        if (event.eventType === 'risk_success') {
          this.addFact(`ge_${factId++}`, `risk_success("${event.userId}", ${event.level}).`);
        }
        this.addFact(`ge_event_${factId++}`, `game_event("${event.userId}", ${event.level}, "${event.eventType}").`);
      });
    }
  }

  /**
   * Reset der Engine (alle Facts und Regeln löschen)
   */
  reset() {
    this.facts.clear();
    this.rules.clear();
    if (this.verbose) {
      console.log('🔄 Engine reset');
    }
  }

  /**
   * Statistiken der Engine
   * @returns {Object} Engine-Statistiken
   */
  getStats() {
    return {
      facts_count: this.facts.size,
      rules_count: this.rules.size,
      memory_usage: process.memoryUsage(),
      uptime: process.uptime()
    };
  }
}

// Singleton-Pattern für globale Engine-Instanz
let engineInstance = null;

export function getMangleEngine() {
  if (!engineInstance) {
    engineInstance = new MangleEngine();
  }
  return engineInstance;
}

export { MangleEngine }; 
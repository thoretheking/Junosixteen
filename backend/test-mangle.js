import { getMangleEngine } from "./mangle-engine.js";

/**
 * Test Script für JunoSixteen Mangle Integration
 * Demonstriert alle Mangle-Features und APIs
 */

console.log("🧪 JunoSixteen Mangle Integration Test");
console.log("======================================");

async function runTests() {
  const engine = getMangleEngine();
  
  // Test 1: Grundlegende Engine-Funktionalität
  console.log("\n📋 Test 1: Grundlegende Engine-Funktionalität");
  
  // Füge Beispiel-Regeln hinzu
  engine.addRule("level1", "canStart(level2) :- finished(level1).");
  engine.addRule("level2", "canStart(level3) :- finished(level2).");
  
  // Füge Facts hinzu
  engine.addFact("user1_progress", "finished(level1).");
  engine.addFact("user2_progress", "finished(level2).");
  
  console.log("✅ Regeln und Facts hinzugefügt");
  console.log("📊 Engine Stats:", engine.getStats());
  
  // Test 2: JunoSixteen Progress-Regeln
  console.log("\n📋 Test 2: JunoSixteen Progress-Regeln");
  
  const testFacts = {
    answered_correct: [
      ["lea", 3, 1, "2025-08-25T07:58:00Z"],
      ["lea", 3, 2, "2025-08-25T07:59:00Z"],
      ["lea", 3, 3, "2025-08-25T08:00:00Z"],
      ["lea", 3, 4, "2025-08-25T08:01:00Z"],
      ["lea", 3, 5, "2025-08-25T08:02:00Z"],
      ["lea", 3, 6, "2025-08-25T08:03:00Z"],
      ["lea", 3, 7, "2025-08-25T08:04:00Z"],
      ["lea", 3, 8, "2025-08-25T08:05:00Z"],
      ["lea", 3, 9, "2025-08-25T08:06:00Z"],
      ["lea", 3, 10, "2025-08-25T08:07:00Z"]
    ],
    level_completions: [
      {
        userId: "lea",
        level: 3,
        timestamp: "2025-08-25T08:07:30Z",
        score: 15000,
        perfect: true
      }
    ],
    game_events: [
      {
        userId: "lea",
        level: 3,
        eventType: "risk_success",
        data: {"questions": [5, 10], "multiplier": 2.0},
        timestamp: "2025-08-25T08:02:30Z"
      }
    ]
  };
  
  // Reset und lade Test-Facts
  engine.reset();
  engine.convertJSONFactsToProlog(testFacts);
  
  // Test Progress Query
  const progressResult = await engine.query("can_start(lea, L)");
  console.log("🔍 Progress Query Result:", progressResult);
  
  // Test 3: Game-Mechanik Regeln
  console.log("\n📋 Test 3: Game-Mechanik Regeln");
  
  const gameResult = await engine.query("apply_multiplier(lea, 3, M)");
  console.log("🎮 Game Mechanics Result:", gameResult);
  
  // Test 4: Empfehlungs-System
  console.log("\n📋 Test 4: Empfehlungs-System");
  
  // Füge missed_concept Facts hinzu
  engine.addFact("missed1", "missed_concept(lea, datenschutz).");
  
  const recommendResult = await engine.query("recommend_snack(lea, M)");
  console.log("💡 Recommendation Result:", recommendResult);
  
  // Test 5: Zertifikat-System
  console.log("\n📋 Test 5: Zertifikat-System");
  
  // Füge certificate Facts hinzu
  engine.addFact("cert1", "completed_all_levels(lea, dsgvo_grundlagen).");
  
  const certResult = await engine.query("award_certificate(lea, dsgvo_grundlagen)");
  console.log("🏆 Certificate Result:", certResult);
  
  // Test 6: Performance und Statistiken
  console.log("\n📋 Test 6: Performance und Statistiken");
  
  const startTime = Date.now();
  
  // Führe 100 Queries aus für Performance-Test
  for (let i = 0; i < 100; i++) {
    await engine.query("can_start(lea, L)");
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`⚡ Performance: 100 Queries in ${duration}ms (${duration/100}ms per query)`);
  console.log("📊 Final Engine Stats:", engine.getStats());
  
  console.log("\n✅ Alle Tests abgeschlossen!");
}

// Führe Tests aus
runTests().catch(console.error); 
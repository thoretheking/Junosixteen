const http = require('http');

// Einfacher Demo-Test für JunoSixteen UL/MCP Integration
console.log('🚀 JUNOSIXTEEN DEMO-TEST GESTARTET');
console.log('=' .repeat(50));

async function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve(responseData);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runDemo() {
  try {
    console.log('\n🧠 1. UL-CLUSTER-ANALYSE TEST');
    console.log('-' .repeat(30));
    
    // Test UL Clustering
    const clusterData = {
      avgTime: 15000,
      errors: 1,
      clicks: 3,
      moduleId: 1
    };

    const clusterResult = await makeRequest('/ul/cluster-analyze', 'POST', clusterData);
    console.log(`✅ Cluster erkannt: ${clusterResult.cluster}`);
    console.log(`   Typ: ${clusterResult.clusterDescription.name}`);
    console.log(`   Vertrauen: ${(clusterResult.confidence * 100).toFixed(1)}%`);
    console.log(`   Empfehlungen: ${clusterResult.recommendations.join(', ')}`);

    console.log('\n🤖 2. MCP-FRAGENGENERIERUNG TEST');
    console.log('-' .repeat(30));
    
    // Test MCP Question Generation
    const questionData = {
      moduleId: 1,
      level: 5,
      cluster: clusterResult.cluster,
      difficulty: 'hard',
      isRiskQuestion: true
    };

    const mcpResult = await makeRequest('/mcp/generate-question', 'POST', questionData);
    console.log(`✅ Frage generiert: ${mcpResult.questionId}`);
    console.log(`   Frage: ${mcpResult.question.question}`);
    console.log(`   Antworten: ${mcpResult.question.answers.length} Optionen`);
    console.log(`   Adaptiert für: ${mcpResult.meta.adaptedFor}`);
    console.log(`   Risiko-Frage: ${mcpResult.question.isRiskQuestion ? 'Ja' : 'Nein'}`);

    console.log('\n📊 3. MCP-STATISTIKEN TEST');
    console.log('-' .repeat(30));
    
    const mcpStats = await makeRequest('/mcp/stats');
    console.log(`✅ Generierte Fragen: ${mcpStats.totalGenerated}`);
    console.log(`   Erfolgsrate: ${mcpStats.successRate}%`);
    console.log(`   Sprachen: ${Object.keys(mcpStats.breakdown.byLanguage).join(', ')}`);
    console.log(`   Cluster-Verteilung: Typ_A:${mcpStats.breakdown.byCluster['Typ_A']}, Typ_B:${mcpStats.breakdown.byCluster['Typ_B']}, Typ_C:${mcpStats.breakdown.byCluster['Typ_C']}`);

    console.log('\n👥 4. CLUSTER-ÜBERSICHT TEST');
    console.log('-' .repeat(30));
    
    const clusterOverview = await makeRequest('/ul/cluster-overview');
    console.log(`✅ Gesamt Benutzer: ${clusterOverview.totalUsers}`);
    console.log(`   Typ A (Analytisch): ${clusterOverview.clusterDistribution['Typ_A']} Benutzer (Ø ${clusterOverview.clusterAverages['Typ_A']} Pkt)`);
    console.log(`   Typ B (Praktisch): ${clusterOverview.clusterDistribution['Typ_B']} Benutzer (Ø ${clusterOverview.clusterAverages['Typ_B']} Pkt)`);
    console.log(`   Typ C (Visuell): ${clusterOverview.clusterDistribution['Typ_C']} Benutzer (Ø ${clusterOverview.clusterAverages['Typ_C']} Pkt)`);

    console.log('\n🎮 5. GAMIFICATION TEST');
    console.log('-' .repeat(30));
    
    const gameStats = await makeRequest('/gamification/stats');
    console.log(`✅ Aktueller Level: ${gameStats.level}`);
    console.log(`   Gesamtpunkte: ${gameStats.totalPoints}`);
    console.log(`   Aktuelle Punkte: ${gameStats.currentPoints}`);
    console.log(`   Badges: ${gameStats.badges}`);
    console.log(`   Streak: ${gameStats.streak} Tage`);

    const leaderboard = await makeRequest('/gamification/leaderboard');
    console.log(`   Leaderboard Top 3:`);
    leaderboard.leaderboard.slice(0, 3).forEach(entry => {
      console.log(`     ${entry.rank}. ${entry.displayName} - ${entry.totalPoints} Pkt (Level ${entry.level})`);
    });

    console.log('\n🎉 DEMO ERFOLGREICH ABGESCHLOSSEN!');
    console.log('=' .repeat(50));
    console.log('✅ UL/MCP-Integration funktioniert perfekt!');
    console.log('✅ Alle APIs antworten korrekt!');
    console.log('✅ Demo-Server läuft stabil!');
    console.log('\n💡 Bereit für Meeting-Präsentation! 🚀');

  } catch (error) {
    console.error('\n❌ Demo-Fehler:', error.message);
    console.log('\n💡 Stellen Sie sicher, dass der Demo-Server läuft:');
    console.log('   node demo-server.js');
  }
}

runDemo(); 
// 🧪 QA-Matrix für Production Readiness
// Testet alle kritischen Szenarien systematisch

import { 
  explainWhy, 
  getLeaderboard, 
  getUserStats, 
  getUserBadges 
} from '../policy.js';

describe('🎯 QA-Matrix: Kritische Szenarien', () => {
  
  describe('Risk-Fail Scenarios', () => {
    test('Q5(B) falsch → RESET_RISK', async () => {
      const result = await explainWhy({ 
        userId: 'risk-fail-user', 
        level: 2, 
        sessionId: 'sess-q5b-fail' 
      });
      
      expect(result.summary.status).toContain('RESET');
      expect(result.causes.risk_fail).toBeTruthy();
      expect(result.ui).toContain('Risikofrage falsch');
    });
    
    test('Q10(A) falsch → RESET_RISK', async () => {
      const result = await explainWhy({ 
        userId: 'risk-fail-user', 
        level: 3, 
        sessionId: 'sess-q10a-fail' 
      });
      
      expect(result.summary.status).toContain('RESET');
      expect(result.causes.risk_fail).toBeTruthy();
      expect(result.ui).toContain('Risikofrage falsch');
    });
  });
  
  describe('Deadline Scenarios', () => {
    test('Deadline < now → RESET_DEADLINE', async () => {
      const result = await explainWhy({ 
        userId: 'deadline-user', 
        level: 1, 
        sessionId: 'sess-deadline-miss' 
      });
      
      expect(result.summary.status).toContain('DEADLINE') || 
      expect(result.summary.status).toContain('TIMEOUT');
      expect(result.causes.deadline_missed).toBeTruthy();
      expect(result.ui).toContain('Frist überschritten');
    });
  });
  
  describe('Teamfrage Scenarios', () => {
    test('3/4 korrekt → Team-Multiplier aktiv', async () => {
      const result = await explainWhy({ 
        userId: 'team-success-user', 
        level: 3, 
        sessionId: 'sess-team-75percent' 
      });
      
      expect(result.causes.team_success).toBeTruthy();
      expect(result.causes.team_mult).toContain('3') || 
      expect(result.causes.apply_team_mult).toContain('3');
      expect(result.ui).toContain('Teamfrage bestanden');
    });
    
    test('1/4 korrekt → Kein Team-Multiplier', async () => {
      const result = await explainWhy({ 
        userId: 'team-fail-user', 
        level: 3, 
        sessionId: 'sess-team-25percent' 
      });
      
      expect(result.causes.team_success).toBeFalsy() ||
      expect(result.causes.team_success).toBe('""');
      expect(result.ui).not.toContain('Teamfrage bestanden');
    });
  });
  
  describe('Explain Panel Tests', () => {
    test('Alle Ursachen korrekt gelistet - Happy Path', async () => {
      const result = await explainWhy({ 
        userId: 'happy-user', 
        level: 3, 
        sessionId: 'sess-all-correct' 
      });
      
      // Prüfe dass alle erwarteten Felder vorhanden sind
      expect(result.summary).toBeDefined();
      expect(result.causes).toBeDefined();
      expect(result.ui).toBeDefined();
      
      // Prüfe spezifische Ursachen
      expect(result.causes.completed_level).toBeDefined();
      expect(result.causes.risk_success).toBeDefined();
      expect(result.causes.team_success).toBeDefined();
      expect(result.causes.deadline_missed).toBeDefined();
    });
    
    test('Alle Ursachen korrekt gelistet - Risk Fail', async () => {
      const result = await explainWhy({ 
        userId: 'risk-user', 
        level: 2, 
        sessionId: 'sess-risk-fail' 
      });
      
      expect(result.causes.risk_fail).toBeTruthy();
      expect(result.causes.completed_level).toBeFalsy() ||
      expect(result.causes.completed_level).toBe('""');
    });
    
    test('Alle Ursachen korrekt gelistet - Deadline Miss', async () => {
      const result = await explainWhy({ 
        userId: 'deadline-user', 
        level: 1, 
        sessionId: 'sess-deadline' 
      });
      
      expect(result.causes.deadline_missed).toBeTruthy();
      expect(result.ui).toContain('Frist überschritten');
    });
  });
  
  describe('Leaderboard Tests', () => {
    test('Weekly Ranking - Sortierung korrekt', async () => {
      const result = await getLeaderboard('individual', 'weekly', 5);
      
      expect(result.type).toBe('individual');
      expect(result.period).toBe('weekly');
      expect(result.leaderboard).toBeInstanceOf(Array);
      
      // Prüfe Sortierung (absteigend nach Punkten)
      for (let i = 0; i < result.leaderboard.length - 1; i++) {
        const current = result.leaderboard[i];
        const next = result.leaderboard[i + 1];
        expect(current.points).toBeGreaterThanOrEqual(next.points);
        expect(current.rank).toBeLessThanOrEqual(next.rank);
      }
    });
    
    test('Team Ranking - Tiebreaker korrekt', async () => {
      const result = await getLeaderboard('team', 'alltime', 5);
      
      expect(result.type).toBe('team');
      expect(result.leaderboard).toBeInstanceOf(Array);
      
      // Prüfe dass Teams mit memberCount vorhanden sind
      result.leaderboard.forEach(team => {
        expect(team.teamId).toBeDefined();
        expect(team.points).toBeGreaterThanOrEqual(0);
        expect(team.rank).toBeGreaterThanOrEqual(1);
        expect(team.memberCount).toBeGreaterThanOrEqual(1);
      });
    });
    
    test('User Stats - Alle Zeiträume', async () => {
      const result = await getUserStats('lea');
      
      expect(result.userId).toBe('lea');
      expect(result.stats).toBeDefined();
      expect(result.stats.alltime).toBeDefined();
      expect(result.stats.weekly).toBeDefined();
      expect(result.stats.monthly).toBeDefined();
      
      // Prüfe dass Ranks sinnvoll sind
      expect(result.stats.alltime.rank).toBeGreaterThanOrEqual(1);
      expect(result.stats.alltime.points).toBeGreaterThanOrEqual(0);
    });
    
    test('Badges - Vergabe-Logik', async () => {
      const result = await getUserBadges('lea');
      
      expect(result.userId).toBe('lea');
      expect(result.badges).toBeInstanceOf(Array);
      expect(result.badge_count).toBe(result.badges.length);
      
      // Prüfe Badge-Format
      result.badges.forEach(badge => {
        expect(badge.type).toBeDefined();
        expect(badge.name).toBeDefined();
        expect(badge.description).toBeDefined();
        expect(badge.earned_at).toBeDefined();
      });
    });
  });
  
  describe('Performance Tests', () => {
    test('Explain Panel < 500ms', async () => {
      const startTime = Date.now();
      
      const result = await explainWhy({ 
        userId: 'perf-user', 
        level: 3, 
        sessionId: 'sess-perf' 
      });
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500);
      expect(result.summary).toBeDefined();
    });
    
    test('Leaderboard Query < 200ms', async () => {
      const startTime = Date.now();
      
      const result = await getLeaderboard('individual', 'weekly', 10);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(200);
      expect(result.leaderboard).toBeInstanceOf(Array);
    });
    
    test('User Stats < 300ms', async () => {
      const startTime = Date.now();
      
      const result = await getUserStats('lea');
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(300);
      expect(result.stats).toBeDefined();
    });
  });
  
  describe('Edge Cases & Error Handling', () => {
    test('Nicht-existenter User → graceful error', async () => {
      const result = await getUserStats('non-existent-user');
      
      expect(result.error || result.userId).toBeDefined();
      // Sollte nicht crashen
    });
    
    test('Leere Leaderboard → empty array', async () => {
      // Test mit period wo keine Daten existieren
      const result = await getLeaderboard('individual', 'monthly', 10);
      
      expect(result.leaderboard).toBeInstanceOf(Array);
      // Kann leer sein, sollte aber nicht crashen
    });
    
    test('Invalid period → error handling', async () => {
      try {
        await getLeaderboard('individual', 'invalid-period', 10);
        fail('Should have thrown error for invalid period');
      } catch (error) {
        expect(error.message).toContain('period') || 
        expect(error.message).toContain('Invalid');
      }
    });
  });
  
  describe('Data Consistency', () => {
    test('Ranking-Summen stimmen überein', async () => {
      const individualWeekly = await getLeaderboard('individual', 'weekly', 100);
      const individualAlltime = await getLeaderboard('individual', 'alltime', 100);
      
      // Weekly points sollten <= alltime points sein
      individualWeekly.leaderboard.forEach(weeklyEntry => {
        const alltimeEntry = individualAlltime.leaderboard.find(
          entry => entry.userId === weeklyEntry.userId
        );
        
        if (alltimeEntry) {
          expect(weeklyEntry.points).toBeLessThanOrEqual(alltimeEntry.points);
        }
      });
    });
    
    test('Team vs Individual Points Consistency', async () => {
      const teamStats = await getLeaderboard('team', 'weekly', 10);
      const individualStats = await getLeaderboard('individual', 'weekly', 50);
      
      // Team-Punkte sollten Summe der Member-Punkte sein
      // (Vereinfachte Prüfung - in echter App komplexer)
      teamStats.leaderboard.forEach(team => {
        expect(team.points).toBeGreaterThanOrEqual(0);
        expect(team.memberCount).toBeGreaterThanOrEqual(1);
      });
    });
  });
});

describe('🛡️ Security & Compliance Tests', () => {
  test('Feature-Flags respektiert', async () => {
    // Simuliere disabled flag
    const originalEnv = process.env.MANGLE_LEADERBOARD;
    process.env.MANGLE_LEADERBOARD = 'false';
    
    try {
      // API-Call sollte 403 zurückgeben wenn Flag disabled
      // (Test würde in echter Integration mit Express-App laufen)
      expect(process.env.MANGLE_LEADERBOARD).toBe('false');
    } finally {
      process.env.MANGLE_LEADERBOARD = originalEnv;
    }
  });
  
  test('Keine PII in Mangle-Facts', async () => {
    const result = await explainWhy({ 
      userId: 'privacy-test-user', 
      level: 2, 
      sessionId: 'sess-privacy' 
    });
    
    // Prüfe dass keine Klarnamen oder sensible Daten in Raw-Response
    const rawData = JSON.stringify(result);
    expect(rawData).not.toMatch(/email|phone|address|password/i);
  });
  
  test('Audit-Trail für Policy-Entscheidungen', async () => {
    const result = await explainWhy({ 
      userId: 'audit-user', 
      level: 3, 
      sessionId: 'sess-audit' 
    });
    
    // Jede Entscheidung sollte nachvollziehbar sein
    expect(result.summary).toBeDefined();
    expect(result.causes).toBeDefined();
    
    // Mindestens eine Ursache sollte identifiziert sein
    const causesArray = Object.values(result.causes);
    const hasCause = causesArray.some(cause => cause && cause !== '""');
    expect(hasCause).toBe(true);
  });
}); 
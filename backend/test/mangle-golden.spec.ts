import { checkPolicy, mangleClient } from '../src/integrations/mangleClient';

describe('🧪 Mangle Golden Tests', () => {
  beforeAll(async () => {
    // Warte bis Mangle Service verfügbar ist
    let retries = 10;
    while (retries > 0) {
      try {
        await mangleClient.healthCheck();
        console.log('✅ Mangle service is ready');
        break;
      } catch (error) {
        console.log(`⏳ Waiting for Mangle service... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries--;
      }
    }
    
    if (retries === 0) {
      throw new Error('❌ Mangle service not available after 10 seconds');
    }
  });

  describe('🎯 Happy Path Scenarios', () => {
    test('Alle Fragen korrekt → PASSED', async () => {
      const request = {
        userId: 'lea',
        sessionId: 'sess-happy-001',
        level: 3,
        watched: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        answers: [
          { idx: 1, part: '-' as const, correct: true },
          { idx: 2, part: '-' as const, correct: true },
          { idx: 3, part: '-' as const, correct: true },
          { idx: 4, part: '-' as const, correct: true },
          { idx: 5, part: 'A' as const, correct: true },
          { idx: 5, part: 'B' as const, correct: true },
          { idx: 6, part: '-' as const, correct: true },
          { idx: 7, part: '-' as const, correct: true },
          { idx: 8, part: '-' as const, correct: true },
          { idx: 9, part: '-' as const, correct: true },
          { idx: 10, part: 'A' as const, correct: true },
          { idx: 10, part: 'B' as const, correct: true }
        ],
        teamAnswers: [
          { memberId: 'lea', correct: true },
          { memberId: 'max', correct: true },
          { memberId: 'kim', correct: true }
        ],
        deadlineISO: '2025-12-31T23:59:00Z'
      };

      const result = await checkPolicy(request);
      
      expect(result.status).toBe('PASSED');
      expect(result.pointsFinal).toBeGreaterThan(0);
      expect(result.debug?.factsCount).toBeGreaterThan(20);
      expect(result.debug?.queryTime).toBeLessThan(5000);
    }, 10000);

    test('Team erfolgreich → Punkte x3 Bonus', async () => {
      const request = {
        userId: 'team-leader',
        sessionId: 'sess-team-success',
        level: 2,
        watched: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        answers: [
          { idx: 1, part: '-' as const, correct: true },
          { idx: 2, part: '-' as const, correct: true },
          { idx: 3, part: '-' as const, correct: true },
          { idx: 4, part: '-' as const, correct: true },
          { idx: 5, part: 'A' as const, correct: true },
          { idx: 5, part: 'B' as const, correct: true },
          { idx: 6, part: '-' as const, correct: true },
          { idx: 7, part: '-' as const, correct: true },
          { idx: 8, part: '-' as const, correct: true },
          { idx: 9, part: '-' as const, correct: true }, // Teamfrage
          { idx: 10, part: 'A' as const, correct: true },
          { idx: 10, part: 'B' as const, correct: true }
        ],
        teamAnswers: [
          { memberId: 'member1', correct: true },
          { memberId: 'member2', correct: true },
          { memberId: 'member3', correct: true },
          { memberId: 'member4', correct: false } // 75% success
        ],
        deadlineISO: '2025-12-31T23:59:00Z'
      };

      const result = await checkPolicy(request);
      
      expect(result.status).toBe('PASSED');
      expect(result.pointsFinal).toBeGreaterThan(100); // Mit Team-Bonus
    });
  });

  describe('❌ Failure Scenarios', () => {
    test('Risikofrage Teil A falsch → RESET_RISK', async () => {
      const request = {
        userId: 'risk-fail-user',
        sessionId: 'sess-risk-fail-001',
        level: 2,
        watched: [1, 2, 3, 4, 5],
        answers: [
          { idx: 1, part: '-' as const, correct: true },
          { idx: 2, part: '-' as const, correct: true },
          { idx: 3, part: '-' as const, correct: true },
          { idx: 4, part: '-' as const, correct: true },
          { idx: 5, part: 'A' as const, correct: false }, // Risk fail!
          { idx: 5, part: 'B' as const, correct: true }
        ],
        deadlineISO: '2025-12-31T23:59:00Z'
      };

      const result = await checkPolicy(request);
      
      expect(result.status).toBe('RESET_RISK');
      expect(result.pointsFinal).toBeUndefined();
      expect(result.nextQuestion).toBeUndefined();
    });

    test('Risikofrage Teil B falsch → RESET_RISK', async () => {
      const request = {
        userId: 'risk-fail-user-b',
        sessionId: 'sess-risk-fail-002',
        level: 3,
        watched: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        answers: [
          { idx: 10, part: 'A' as const, correct: true },
          { idx: 10, part: 'B' as const, correct: false } // Risk fail!
        ],
        deadlineISO: '2025-12-31T23:59:00Z'
      };

      const result = await checkPolicy(request);
      
      expect(result.status).toBe('RESET_RISK');
    });

    test('Deadline verpasst → RESET_DEADLINE', async () => {
      const request = {
        userId: 'deadline-miss-user',
        sessionId: 'sess-deadline-001',
        level: 1,
        watched: [1, 2],
        answers: [
          { idx: 1, part: '-' as const, correct: true }
        ],
        deadlineISO: '2025-08-20T23:59:00Z' // In der Vergangenheit
      };

      const result = await checkPolicy(request);
      
      expect(result.status).toBe('RESET_DEADLINE');
      expect(result.pointsFinal).toBeUndefined();
    });
  });

  describe('🔄 In Progress Scenarios', () => {
    test('Erste 3 Fragen korrekt → IN_PROGRESS + next_question = 4', async () => {
      const request = {
        userId: 'progress-user',
        sessionId: 'sess-progress-001',
        level: 1,
        watched: [1, 2, 3],
        answers: [
          { idx: 1, part: '-' as const, correct: true },
          { idx: 2, part: '-' as const, correct: true },
          { idx: 3, part: '-' as const, correct: true }
        ],
        deadlineISO: '2025-12-31T23:59:00Z'
      };

      const result = await checkPolicy(request);
      
      expect(result.status).toBe('IN_PROGRESS');
      expect(result.nextQuestion).toBe(4);
      expect(result.pointsRaw).toBeGreaterThan(0);
    });

    test('Nach Risikofrage 5 (beide korrekt) → nächste Frage 6', async () => {
      const request = {
        userId: 'risk-pass-user',
        sessionId: 'sess-risk-pass-001',
        level: 2,
        watched: [1, 2, 3, 4, 5],
        answers: [
          { idx: 1, part: '-' as const, correct: true },
          { idx: 2, part: '-' as const, correct: true },
          { idx: 3, part: '-' as const, correct: true },
          { idx: 4, part: '-' as const, correct: true },
          { idx: 5, part: 'A' as const, correct: true },
          { idx: 5, part: 'B' as const, correct: true }
        ],
        deadlineISO: '2025-12-31T23:59:00Z'
      };

      const result = await checkPolicy(request);
      
      expect(result.status).toBe('IN_PROGRESS');
      expect(result.nextQuestion).toBe(6);
    });
  });

  describe('🔢 Punktelogik Tests', () => {
    test('Basis-Punkte ohne Multiplikatoren', async () => {
      const request = {
        userId: 'points-basic',
        sessionId: 'sess-points-001',
        level: 1,
        watched: [1, 2, 3],
        answers: [
          { idx: 1, part: '-' as const, correct: true }, // 1 Punkt
          { idx: 2, part: '-' as const, correct: true }, // 1 Punkt
          { idx: 3, part: '-' as const, correct: true }  // 2 Punkte
        ],
        deadlineISO: '2025-12-31T23:59:00Z'
      };

      const result = await checkPolicy(request);
      
      expect(result.status).toBe('IN_PROGRESS');
      expect(result.pointsRaw).toBe(4); // 1+1+2
    });

    test('Risk-Bonus: Punkte x2 bei korrekten Risikofragen', async () => {
      const request = {
        userId: 'points-risk',
        sessionId: 'sess-points-risk',
        level: 2,
        watched: [5],
        answers: [
          { idx: 5, part: 'A' as const, correct: true },
          { idx: 5, part: 'B' as const, correct: true } // 3 Basis * 2 = 6
        ],
        deadlineISO: '2025-12-31T23:59:00Z'
      };

      const result = await checkPolicy(request);
      
      expect(result.status).toBe('IN_PROGRESS');
      expect(result.pointsRaw).toBe(6); // Risk-Bonus
    });
  });

  describe('🔧 Edge Cases', () => {
    test('Leere Antworten → IN_PROGRESS, next_question = 1', async () => {
      const request = {
        userId: 'empty-user',
        sessionId: 'sess-empty',
        level: 1,
        watched: [],
        answers: [],
        deadlineISO: '2025-12-31T23:59:00Z'
      };

      const result = await checkPolicy(request);
      
      expect(result.status).toBe('IN_PROGRESS');
      expect(result.nextQuestion).toBe(1);
      expect(result.pointsRaw).toBe(0);
    });

    test('Nur Risikofrage Teil A beantwortet → nächste ist Teil B', async () => {
      const request = {
        userId: 'risk-partial',
        sessionId: 'sess-risk-partial',
        level: 2,
        watched: [5],
        answers: [
          { idx: 5, part: 'A' as const, correct: true }
          // Teil B fehlt noch
        ],
        deadlineISO: '2025-12-31T23:59:00Z'
      };

      const result = await checkPolicy(request);
      
      expect(result.status).toBe('IN_PROGRESS');
      expect(result.nextQuestion).toBe(5); // Noch Teil B von Frage 5
    });

    test('Team ohne Antworten → normale Punktevergabe', async () => {
      const request = {
        userId: 'no-team',
        sessionId: 'sess-no-team',
        level: 1,
        watched: [9],
        answers: [
          { idx: 9, part: '-' as const, correct: true }
        ],
        // teamAnswers fehlen
        deadlineISO: '2025-12-31T23:59:00Z'
      };

      const result = await checkPolicy(request);
      
      expect(result.status).toBe('IN_PROGRESS');
      expect(result.pointsRaw).toBe(5); // Basis ohne Team-Multiplikator
    });
  });

  describe('🚀 Performance Tests', () => {
    test('Große Anzahl Facts → unter 2 Sekunden', async () => {
      const answers = [];
      for (let i = 1; i <= 10; i++) {
        if (i === 5 || i === 10) {
          answers.push({ idx: i, part: 'A' as const, correct: true });
          answers.push({ idx: i, part: 'B' as const, correct: true });
        } else {
          answers.push({ idx: i, part: '-' as const, correct: true });
        }
      }

      const request = {
        userId: 'perf-test',
        sessionId: 'sess-perf',
        level: 5,
        watched: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        answers,
        teamAnswers: Array.from({ length: 20 }, (_, i) => ({
          memberId: `member-${i}`,
          correct: i % 3 === 0 // 33% success
        })),
        deadlineISO: '2025-12-31T23:59:00Z'
      };

      const startTime = Date.now();
      const result = await checkPolicy(request);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(2000);
      expect(result.status).toBe('PASSED');
      expect(result.debug?.queryTime).toBeLessThan(1000);
    });
  });
}); 
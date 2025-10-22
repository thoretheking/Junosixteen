import { describe, it, expect, beforeEach } from '@jest/globals';

/**
 * Risk-Guard System Unit Tests
 * Tests für das Risiko-Fragen-System mit 2 Versuchen und Cooldown
 */

interface RiskAttempt {
  questionId: string;
  userId: string;
  attemptsUsed: number;
  maxAttempts: number;
  cooldownMs: number;
  lockUntil: number | null;
  lastAttemptAt: number;
}

class RiskGuard {
  private attempts: Map<string, RiskAttempt> = new Map();
  
  constructor(
    private readonly maxAttempts: number = 2,
    private readonly cooldownMs: number = 30000 // 30 Sekunden
  ) {}
  
  /**
   * Versucht, eine Risiko-Frage zu beantworten
   */
  attempt(userId: string, questionId: string): RiskAttempt {
    const key = `${userId}:${questionId}`;
    const now = Date.now();
    
    let attemptRecord = this.attempts.get(key);
    
    // Erstelle neuen Versuchs-Eintrag falls nicht vorhanden
    if (!attemptRecord) {
      attemptRecord = {
        questionId,
        userId,
        attemptsUsed: 0,
        maxAttempts: this.maxAttempts,
        cooldownMs: this.cooldownMs,
        lockUntil: null,
        lastAttemptAt: now
      };
      this.attempts.set(key, attemptRecord);
    }
    
    // Prüfe ob noch in Cooldown
    if (attemptRecord.lockUntil && attemptRecord.lockUntil > now) {
      throw new Error(`cooldown_active: ${Math.ceil((attemptRecord.lockUntil - now) / 1000)}s remaining`);
    }
    
    // Cooldown abgelaufen - Reset
    if (attemptRecord.lockUntil && attemptRecord.lockUntil <= now) {
      attemptRecord.attemptsUsed = 0;
      attemptRecord.lockUntil = null;
    }
    
    // Prüfe ob noch Versuche übrig
    if (attemptRecord.attemptsUsed >= this.maxAttempts) {
      throw new Error('out_of_attempts');
    }
    
    // Erhöhe Versuche
    attemptRecord.attemptsUsed++;
    attemptRecord.lastAttemptAt = now;
    
    return { ...attemptRecord };
  }
  
  /**
   * Markiert eine Risiko-Frage als fehlgeschlagen und aktiviert Cooldown
   */
  failRiskQuestion(userId: string, questionId: string): RiskAttempt {
    const key = `${userId}:${questionId}`;
    const now = Date.now();
    
    let attemptRecord = this.attempts.get(key);
    
    if (!attemptRecord) {
      attemptRecord = {
        questionId,
        userId,
        attemptsUsed: this.maxAttempts, // Alle Versuche aufgebraucht
        maxAttempts: this.maxAttempts,
        cooldownMs: this.cooldownMs,
        lockUntil: now + this.cooldownMs,
        lastAttemptAt: now
      };
      this.attempts.set(key, attemptRecord);
    } else {
      attemptRecord.attemptsUsed = this.maxAttempts;
      attemptRecord.lockUntil = now + this.cooldownMs;
      attemptRecord.lastAttemptAt = now;
    }
    
    return { ...attemptRecord };
  }
  
  /**
   * Gibt aktuelle Versuchsinformationen zurück
   */
  getAttemptInfo(userId: string, questionId: string): RiskAttempt | null {
    const key = `${userId}:${questionId}`;
    const record = this.attempts.get(key);
    
    if (!record) return null;
    
    return { ...record };
  }
  
  /**
   * Setzt Versuche für einen Benutzer zurück
   */
  reset(userId: string, questionId: string): void {
    const key = `${userId}:${questionId}`;
    this.attempts.delete(key);
  }
}

describe('Risk-Guard System', () => {
  let riskGuard: RiskGuard;
  const testUserId = 'user123';
  const testQuestionId = 'risk_q5';
  
  beforeEach(() => {
    riskGuard = new RiskGuard(2, 30000);
  });
  
  describe('Versuchs-Zählung', () => {
    it('sollte den ersten Versuch zulassen', () => {
      const result = riskGuard.attempt(testUserId, testQuestionId);
      
      expect(result.attemptsUsed).toBe(1);
      expect(result.maxAttempts).toBe(2);
      expect(result.lockUntil).toBeNull();
    });
    
    it('sollte den zweiten Versuch zulassen', () => {
      riskGuard.attempt(testUserId, testQuestionId);
      const result = riskGuard.attempt(testUserId, testQuestionId);
      
      expect(result.attemptsUsed).toBe(2);
      expect(result.maxAttempts).toBe(2);
    });
    
    it('sollte nach 2 Versuchen keine weiteren Versuche zulassen', () => {
      riskGuard.attempt(testUserId, testQuestionId);
      riskGuard.attempt(testUserId, testQuestionId);
      
      expect(() => {
        riskGuard.attempt(testUserId, testQuestionId);
      }).toThrow('out_of_attempts');
    });
    
    it('sollte Versuche pro Benutzer und Frage separat zählen', () => {
      const user1 = 'user1';
      const user2 = 'user2';
      const question1 = 'q1';
      const question2 = 'q2';
      
      const result1 = riskGuard.attempt(user1, question1);
      const result2 = riskGuard.attempt(user2, question1);
      const result3 = riskGuard.attempt(user1, question2);
      
      expect(result1.attemptsUsed).toBe(1);
      expect(result2.attemptsUsed).toBe(1);
      expect(result3.attemptsUsed).toBe(1);
    });
  });
  
  describe('Cooldown-System', () => {
    it('sollte Cooldown nach Fehlschlag aktivieren', () => {
      const result = riskGuard.failRiskQuestion(testUserId, testQuestionId);
      
      expect(result.lockUntil).not.toBeNull();
      expect(result.lockUntil! > Date.now()).toBe(true);
      expect(result.attemptsUsed).toBe(2); // Alle Versuche aufgebraucht
    });
    
    it('sollte während Cooldown keine Versuche zulassen', () => {
      riskGuard.failRiskQuestion(testUserId, testQuestionId);
      
      expect(() => {
        riskGuard.attempt(testUserId, testQuestionId);
      }).toThrow(/cooldown_active/);
    });
    
    it('sollte Cooldown-Restzeit korrekt angeben', () => {
      riskGuard.failRiskQuestion(testUserId, testQuestionId);
      
      try {
        riskGuard.attempt(testUserId, testQuestionId);
        expect(true).toBe(false); // sollte nicht erreicht werden
      } catch (error: any) {
        expect(error.message).toMatch(/cooldown_active: \d+s remaining/);
      }
    });
    
    it('sollte nach Ablauf des Cooldowns Versuche zurücksetzen', () => {
      // Erstelle RiskGuard mit 1ms Cooldown für schnellen Test
      const fastRiskGuard = new RiskGuard(2, 1);
      
      fastRiskGuard.failRiskQuestion(testUserId, testQuestionId);
      
      // Warte 2ms
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const result = fastRiskGuard.attempt(testUserId, testQuestionId);
          expect(result.attemptsUsed).toBe(1); // Reset erfolgreich
          expect(result.lockUntil).toBeNull();
          resolve();
        }, 2);
      });
    });
  });
  
  describe('Boss-Challenge Szenarien', () => {
    it('sollte bei Boss-Challenge-Fail sofort Cooldown aktivieren', () => {
      // Simuliere Boss-Challenge (Frage 5 oder 10)
      const bossQuestionId = 'risk_q5';
      
      const result = riskGuard.failRiskQuestion(testUserId, bossQuestionId);
      
      expect(result.lockUntil).not.toBeNull();
      expect(result.attemptsUsed).toBe(2);
    });
    
    it('sollte verschiedene Boss-Challenges separat behandeln', () => {
      const boss1 = 'risk_q5';
      const boss2 = 'risk_q10';
      
      riskGuard.failRiskQuestion(testUserId, boss1);
      const result = riskGuard.attempt(testUserId, boss2);
      
      expect(result.attemptsUsed).toBe(1); // boss2 hat eigene Versuche
    });
  });
  
  describe('Versuchs-Informationen', () => {
    it('sollte null zurückgeben wenn keine Versuche vorhanden', () => {
      const info = riskGuard.getAttemptInfo(testUserId, testQuestionId);
      expect(info).toBeNull();
    });
    
    it('sollte korrekte Versuchsinformationen zurückgeben', () => {
      riskGuard.attempt(testUserId, testQuestionId);
      const info = riskGuard.getAttemptInfo(testUserId, testQuestionId);
      
      expect(info).not.toBeNull();
      expect(info!.attemptsUsed).toBe(1);
      expect(info!.maxAttempts).toBe(2);
      expect(info!.userId).toBe(testUserId);
      expect(info!.questionId).toBe(testQuestionId);
    });
  });
  
  describe('Reset-Funktionalität', () => {
    it('sollte Versuche korrekt zurücksetzen', () => {
      riskGuard.attempt(testUserId, testQuestionId);
      riskGuard.attempt(testUserId, testQuestionId);
      
      riskGuard.reset(testUserId, testQuestionId);
      
      const result = riskGuard.attempt(testUserId, testQuestionId);
      expect(result.attemptsUsed).toBe(1); // Wieder bei 1
    });
    
    it('sollte Cooldown beim Reset entfernen', () => {
      riskGuard.failRiskQuestion(testUserId, testQuestionId);
      riskGuard.reset(testUserId, testQuestionId);
      
      const result = riskGuard.attempt(testUserId, testQuestionId);
      expect(result.attemptsUsed).toBe(1);
      expect(result.lockUntil).toBeNull();
    });
  });
  
  describe('Edge Cases', () => {
    it('sollte mit gleichzeitigen Anfragen korrekt umgehen', () => {
      const result1 = riskGuard.attempt(testUserId, testQuestionId);
      const result2 = riskGuard.attempt(testUserId, testQuestionId);
      
      expect(result1.attemptsUsed).toBe(1);
      expect(result2.attemptsUsed).toBe(2);
    });
    
    it('sollte mit verschiedenen Cooldown-Zeiten korrekt arbeiten', () => {
      const shortCooldown = new RiskGuard(2, 1000); // 1 Sekunde
      const longCooldown = new RiskGuard(2, 60000); // 1 Minute
      
      const short = shortCooldown.failRiskQuestion(testUserId, 'q1');
      const long = longCooldown.failRiskQuestion(testUserId, 'q2');
      
      expect(short.cooldownMs).toBe(1000);
      expect(long.cooldownMs).toBe(60000);
    });
    
    it('sollte lastAttemptAt korrekt aktualisieren', () => {
      const before = Date.now();
      riskGuard.attempt(testUserId, testQuestionId);
      const after = Date.now();
      
      const info = riskGuard.getAttemptInfo(testUserId, testQuestionId);
      
      expect(info!.lastAttemptAt).toBeGreaterThanOrEqual(before);
      expect(info!.lastAttemptAt).toBeLessThanOrEqual(after);
    });
  });
});


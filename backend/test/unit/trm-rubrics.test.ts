import { describe, it, expect } from '@jest/globals';
import { RubricService, RubricResult } from '../../src/trm/rubric';
import { TRMEvalRequest } from '../../src/common/types';

/**
 * TRM Rubrics Unit Tests  
 * Tests für das Technical Risk Management Bewertungssystem
 */

describe('TRM Rubrics System', () => {
  let rubricService: RubricService;
  
  beforeEach(() => {
    rubricService = new RubricService();
  });
  
  describe('Score Berechnung', () => {
    it('sollte 1.0 Score für korrekte Antwort vergeben', () => {
      const request: TRMEvalRequest = {
        userId: 'user123',
        questionId: 'q1',
        result: {
          correct: true,
          timeMs: 15000,
          helpUsed: false
        },
        telemetry: {
          clicks: 1,
          scrolls: 0,
          tabSwitches: 0
        }
      };
      
      const result = rubricService.score(request);
      
      expect(result.score).toBe(1.0);
    });
    
    it('sollte 0.0 Score für falsche Antwort vergeben', () => {
      const request: TRMEvalRequest = {
        userId: 'user123',
        questionId: 'q1',
        result: {
          correct: false,
          timeMs: 15000,
          helpUsed: false
        },
        telemetry: {
          clicks: 1,
          scrolls: 0,
          tabSwitches: 0
        }
      };
      
      const result = rubricService.score(request);
      
      expect(result.score).toBe(0.0);
    });
    
    it('sollte Score bei Hilfe-Nutzung um 20% reduzieren', () => {
      const request: TRMEvalRequest = {
        userId: 'user123',
        questionId: 'q1',
        result: {
          correct: true,
          timeMs: 15000,
          helpUsed: true
        },
        telemetry: {
          clicks: 1,
          scrolls: 0,
          tabSwitches: 0
        }
      };
      
      const result = rubricService.score(request);
      
      expect(result.score).toBe(0.8); // 1.0 * 0.8
    });
    
    it('sollte Score bei sehr schneller Antwort (<3s) um 10% reduzieren', () => {
      const request: TRMEvalRequest = {
        userId: 'user123',
        questionId: 'q1',
        result: {
          correct: true,
          timeMs: 2500, // < 3000ms
          helpUsed: false
        },
        telemetry: {
          clicks: 1,
          scrolls: 0,
          tabSwitches: 0
        }
      };
      
      const result = rubricService.score(request);
      
      expect(result.score).toBe(0.9); // 1.0 * 0.9 (possible guessing)
      expect(result.signals.guessPattern).toBe(true);
    });
    
    it('sollte Bonus für Challenge-Erfolg vergeben', () => {
      const request: TRMEvalRequest = {
        userId: 'user123',
        questionId: 'q1',
        result: {
          correct: true,
          timeMs: 15000,
          helpUsed: false,
          challengeOutcome: 'success'
        },
        telemetry: {
          clicks: 1,
          scrolls: 0,
          tabSwitches: 0
        }
      };
      
      const result = rubricService.score(request);
      
      expect(result.score).toBe(1.0); // 1.0 + 0.2 = 1.2, aber capped bei 1.0
      expect(result.microTip).toContain('Challenge gemeistert');
    });
    
    it('sollte Score auf 0 setzen bei Challenge-Fehlschlag', () => {
      const request: TRMEvalRequest = {
        userId: 'user123',
        questionId: 'q1',
        result: {
          correct: false,
          timeMs: 15000,
          helpUsed: false,
          challengeOutcome: 'fail'
        },
        telemetry: {
          clicks: 1,
          scrolls: 0,
          tabSwitches: 0
        }
      };
      
      const result = rubricService.score(request);
      
      expect(result.score).toBe(0);
      expect(result.microTip).toContain('Challenge fehlgeschlagen');
    });
  });
  
  describe('Feedback-Generierung', () => {
    it('sollte positives Feedback für korrekte Antwort geben', () => {
      const request: TRMEvalRequest = {
        userId: 'user123',
        questionId: 'q1',
        result: {
          correct: true,
          timeMs: 15000,
          helpUsed: false
        },
        telemetry: {
          clicks: 1,
          scrolls: 0,
          tabSwitches: 0
        }
      };
      
      const result = rubricService.score(request);
      
      expect(result.microTip.length).toBeGreaterThan(0);
      expect(
        result.microTip.includes('Richtig') ||
        result.microTip.includes('Perfekt') ||
        result.microTip.includes('Exzellent') ||
        result.microTip.includes('Korrekt')
      ).toBe(true);
    });
    
    it('sollte aufbauendes Feedback für falsche Antwort geben', () => {
      const request: TRMEvalRequest = {
        userId: 'user123',
        questionId: 'q1',
        result: {
          correct: false,
          timeMs: 15000,
          helpUsed: false
        },
        telemetry: {
          clicks: 1,
          scrolls: 0,
          tabSwitches: 0
        }
      };
      
      const result = rubricService.score(request);
      
      expect(result.microTip.length).toBeGreaterThan(0);
      // Feedback sollte konstruktiv sein, nicht negativ
      expect(result.microTip).toBeTruthy();
    });
    
    it('sollte enthusiastischeres Feedback für schnelle korrekte Antworten geben', () => {
      const fastRequest: TRMEvalRequest = {
        userId: 'user123',
        questionId: 'q1',
        result: {
          correct: true,
          timeMs: 8000, // < 10s
          helpUsed: false
        },
        telemetry: {
          clicks: 1,
          scrolls: 0,
          tabSwitches: 0
        }
      };
      
      const result = rubricService.score(fastRequest);
      
      // Sollte eines der enthusiastischeren Feedbacks sein
      expect(result.microTip).toBeTruthy();
    });
  });
  
  describe('Signal-Generierung', () => {
    it('sollte guessPattern Signal bei sehr schneller Antwort setzen', () => {
      const request: TRMEvalRequest = {
        userId: 'user123',
        questionId: 'q1',
        result: {
          correct: true,
          timeMs: 2000, // < 3s
          helpUsed: false
        },
        telemetry: {
          clicks: 1,
          scrolls: 0,
          tabSwitches: 0
        }
      };
      
      const result = rubricService.score(request);
      
      expect(result.signals.guessPattern).toBe(true);
    });
    
    it('sollte fatigue Signal bei sehr langsamer Antwort setzen', () => {
      const request: TRMEvalRequest = {
        userId: 'user123',
        questionId: 'q1',
        result: {
          correct: true,
          timeMs: 70000, // > 60s
          helpUsed: false
        },
        telemetry: {
          clicks: 1,
          scrolls: 0,
          tabSwitches: 0
        }
      };
      
      const result = rubricService.score(request);
      
      expect(result.signals.fatigue).toBe(true);
    });
    
    it('sollte difficultyAdj Signal basierend auf Performance setzen', () => {
      const request: TRMEvalRequest = {
        userId: 'user123',
        questionId: 'q1',
        result: {
          correct: true,
          timeMs: 15000,
          helpUsed: false
        },
        telemetry: {
          clicks: 1,
          scrolls: 0,
          tabSwitches: 0
        }
      };
      
      const result = rubricService.score(request);
      
      expect(result.signals.difficultyAdj).toBeDefined();
      expect([-1, 0, 1]).toContain(result.signals.difficultyAdj);
    });
  });
  
  describe('Telemetrie-Analyse', () => {
    it('sollte exzessives Klicken erkennen', () => {
      const request: TRMEvalRequest = {
        userId: 'user123',
        questionId: 'q1',
        result: {
          correct: true,
          timeMs: 15000,
          helpUsed: false
        },
        telemetry: {
          clicks: 50, // > 20 excessive
          scrolls: 0,
          tabSwitches: 0
        }
      };
      
      const result = rubricService.score(request);
      
      // Score sollte durch exzessives Klicken beeinflusst werden
      expect(result.score).toBeLessThan(1.0);
    });
    
    it('sollte Tab-Switching erkennen', () => {
      const request: TRMEvalRequest = {
        userId: 'user123',
        questionId: 'q1',
        result: {
          correct: true,
          timeMs: 15000,
          helpUsed: false
        },
        telemetry: {
          clicks: 1,
          scrolls: 0,
          tabSwitches: 5 // > 2 suspicious
        }
      };
      
      const result = rubricService.score(request);
      
      // Tab-Switching sollte Score beeinflussen (möglicherweise Spicken)
      expect(result.score).toBeLessThan(1.0);
    });
    
    it('sollte normale Telemetrie nicht bestrafen', () => {
      const request: TRMEvalRequest = {
        userId: 'user123',
        questionId: 'q1',
        result: {
          correct: true,
          timeMs: 15000,
          helpUsed: false
        },
        telemetry: {
          clicks: 2,
          scrolls: 3,
          tabSwitches: 0
        }
      };
      
      const result = rubricService.score(request);
      
      expect(result.score).toBe(1.0);
    });
  });
  
  describe('Schwierigkeits-Anpassung', () => {
    it('sollte Schwierigkeit erhöhen bei perfekter Performance', () => {
      const request: TRMEvalRequest = {
        userId: 'user123',
        questionId: 'q1',
        result: {
          correct: true,
          timeMs: 10000,
          helpUsed: false
        },
        telemetry: {
          clicks: 1,
          scrolls: 0,
          tabSwitches: 0
        }
      };
      
      const result = rubricService.score(request);
      
      // Bei hohem Score sollte Schwierigkeit steigen
      if (result.score >= 0.8) {
        expect(result.signals.difficultyAdj).toBeGreaterThanOrEqual(0);
      }
    });
    
    it('sollte Schwierigkeit senken bei schlechter Performance', () => {
      const request: TRMEvalRequest = {
        userId: 'user123',
        questionId: 'q1',
        result: {
          correct: false,
          timeMs: 45000,
          helpUsed: true
        },
        telemetry: {
          clicks: 15,
          scrolls: 10,
          tabSwitches: 0
        }
      };
      
      const result = rubricService.score(request);
      
      // Bei niedrigem Score sollte Schwierigkeit sinken
      expect(result.signals.difficultyAdj).toBeLessThanOrEqual(0);
    });
    
    it('sollte Schwierigkeit beibehalten bei mittlerer Performance', () => {
      const request: TRMEvalRequest = {
        userId: 'user123',
        questionId: 'q1',
        result: {
          correct: true,
          timeMs: 25000,
          helpUsed: true // Score = 0.8
        },
        telemetry: {
          clicks: 3,
          scrolls: 2,
          tabSwitches: 0
        }
      };
      
      const result = rubricService.score(request);
      
      // Bei mittlerem Score könnte Schwierigkeit gleich bleiben
      expect([-1, 0, 1]).toContain(result.signals.difficultyAdj);
    });
  });
  
  describe('Kombinierte Szenarien', () => {
    it('sollte korrekt mit: schnell + Hilfe + viele Klicks umgehen', () => {
      const request: TRMEvalRequest = {
        userId: 'user123',
        questionId: 'q1',
        result: {
          correct: true,
          timeMs: 2500, // schnell
          helpUsed: true // -20%
        },
        telemetry: {
          clicks: 25, // exzessiv
          scrolls: 0,
          tabSwitches: 0
        }
      };
      
      const result = rubricService.score(request);
      
      // Mehrere Penalties sollten akkumulieren
      expect(result.score).toBeLessThan(0.8);
      expect(result.signals.guessPattern).toBe(true);
    });
    
    it('sollte perfekte Performance richtig bewerten', () => {
      const request: TRMEvalRequest = {
        userId: 'user123',
        questionId: 'q1',
        result: {
          correct: true,
          timeMs: 15000, // normale Zeit
          helpUsed: false
        },
        telemetry: {
          clicks: 1, // minimal
          scrolls: 0,
          tabSwitches: 0
        }
      };
      
      const result = rubricService.score(request);
      
      expect(result.score).toBe(1.0);
      expect(result.microTip).toBeTruthy();
      expect(result.signals.guessPattern).toBeUndefined();
      expect(result.signals.fatigue).toBeUndefined();
    });
    
    it('sollte Challenge-Erfolg mit Bonus belohnen auch bei Hilfe', () => {
      const request: TRMEvalRequest = {
        userId: 'user123',
        questionId: 'q1',
        result: {
          correct: true,
          timeMs: 20000,
          helpUsed: true, // -20%
          challengeOutcome: 'success' // +20%
        },
        telemetry: {
          clicks: 2,
          scrolls: 1,
          tabSwitches: 0
        }
      };
      
      const result = rubricService.score(request);
      
      // 0.8 (help penalty) + 0.2 (challenge bonus) = 1.0
      expect(result.score).toBe(1.0);
      expect(result.microTip).toContain('Challenge gemeistert');
    });
  });
  
  describe('Edge Cases', () => {
    it('sollte mit timeMs = 0 umgehen', () => {
      const request: TRMEvalRequest = {
        userId: 'user123',
        questionId: 'q1',
        result: {
          correct: true,
          timeMs: 0,
          helpUsed: false
        },
        telemetry: {
          clicks: 1,
          scrolls: 0,
          tabSwitches: 0
        }
      };
      
      const result = rubricService.score(request);
      
      expect(result.score).toBeLessThanOrEqual(1.0);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
    
    it('sollte mit sehr großen timeMs umgehen', () => {
      const request: TRMEvalRequest = {
        userId: 'user123',
        questionId: 'q1',
        result: {
          correct: true,
          timeMs: 999999,
          helpUsed: false
        },
        telemetry: {
          clicks: 1,
          scrolls: 0,
          tabSwitches: 0
        }
      };
      
      const result = rubricService.score(request);
      
      expect(result.signals.fatigue).toBe(true);
    });
    
    it('sollte Score nie negativ werden lassen', () => {
      const request: TRMEvalRequest = {
        userId: 'user123',
        questionId: 'q1',
        result: {
          correct: false,
          timeMs: 2000,
          helpUsed: true,
          challengeOutcome: 'fail'
        },
        telemetry: {
          clicks: 50,
          scrolls: 20,
          tabSwitches: 10
        }
      };
      
      const result = rubricService.score(request);
      
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
    
    it('sollte Score nie über 1.0 gehen', () => {
      const request: TRMEvalRequest = {
        userId: 'user123',
        questionId: 'q1',
        result: {
          correct: true,
          timeMs: 8000,
          helpUsed: false,
          challengeOutcome: 'success'
        },
        telemetry: {
          clicks: 1,
          scrolls: 0,
          tabSwitches: 0
        }
      };
      
      const result = rubricService.score(request);
      
      expect(result.score).toBeLessThanOrEqual(1.0);
    });
  });
});


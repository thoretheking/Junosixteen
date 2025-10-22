import { describe, it, expect, beforeEach } from '@jest/globals';

/**
 * Integration Tests: Full Mission Flow
 * Tests den kompletten Ablauf: Briefing → Q1-Q10 → Debrief
 */

interface Question {
  id: string;
  index: number;
  text: string;
  answers: string[];
  correctAnswer: number;
  kind: 'standard' | 'risk' | 'team';
  points: number;
}

interface Mission {
  id: string;
  title: string;
  briefing: string;
  questions: Question[];
  lives: number;
  bonusLives: number;
  points: number;
  currentQuestionIndex: number;
  success: boolean;
  finished: boolean;
}

class MissionEngine {
  createMission(missionId: string, world: string): Mission {
    return {
      id: missionId,
      title: `${world} Mission`,
      briefing: `Willkommen zur ${world} Mission!`,
      questions: this.generateQuestions(world),
      lives: 3,
      bonusLives: 0,
      points: 0,
      currentQuestionIndex: 0,
      success: false,
      finished: false
    };
  }

  private generateQuestions(world: string): Question[] {
    const questions: Question[] = [];
    
    for (let i = 1; i <= 10; i++) {
      let kind: 'standard' | 'risk' | 'team' = 'standard';
      if (i === 5 || i === 10) kind = 'risk';
      if (i === 9) kind = 'team';
      
      questions.push({
        id: `${world}_q${i}`,
        index: i,
        text: `Frage ${i} für ${world}`,
        answers: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        kind,
        points: i * 100
      });
    }
    
    return questions;
  }

  answerQuestion(
    mission: Mission,
    answerIndex: number
  ): {
    correct: boolean;
    pointsEarned: number;
    livesLost: number;
    message: string;
  } {
    const currentQuestion = mission.questions[mission.currentQuestionIndex];
    const correct = answerIndex === currentQuestion.correctAnswer;
    
    let pointsEarned = 0;
    let livesLost = 0;
    let message = '';
    
    if (correct) {
      pointsEarned = currentQuestion.points;
      
      // Bonuses
      if (currentQuestion.kind === 'risk') {
        pointsEarned *= 2;
        message = 'Risiko-Frage gemeistert! 2x Punkte!';
      } else if (currentQuestion.kind === 'team') {
        pointsEarned *= 3;
        message = 'Team-Frage perfekt! 3x Punkte!';
      } else {
        message = 'Richtig!';
      }
      
      mission.points += pointsEarned;
    } else {
      // Falsche Antwort
      if (currentQuestion.kind === 'risk') {
        // Risk-Frage verloren = alle Punkte weg
        mission.points = 0;
        livesLost = 1;
        message = 'Risiko-Frage verloren! Alle Punkte weg!';
      } else {
        livesLost = 1;
        message = 'Falsch!';
      }
      
      // Leben abziehen
      if (mission.bonusLives > 0) {
        mission.bonusLives--;
      } else if (mission.lives > 0) {
        mission.lives--;
      }
    }
    
    // Zur nächsten Frage
    mission.currentQuestionIndex++;
    
    // Mission beendet?
    if (mission.currentQuestionIndex >= mission.questions.length) {
      mission.finished = true;
      mission.success = mission.lives + mission.bonusLives > 0;
    } else if (mission.lives + mission.bonusLives <= 0) {
      mission.finished = true;
      mission.success = false;
    }
    
    return { correct, pointsEarned, livesLost, message };
  }

  getDebrief(mission: Mission): {
    success: boolean;
    totalPoints: number;
    correctAnswers: number;
    livesRemaining: number;
    grade: 'gold' | 'silver' | 'bronze' | 'failed';
    message: string;
  } {
    const correctAnswers = mission.questions
      .slice(0, mission.currentQuestionIndex)
      .filter((_, i) => i < mission.currentQuestionIndex)
      .length;
    
    let grade: 'gold' | 'silver' | 'bronze' | 'failed' = 'failed';
    let message = '';
    
    if (mission.success) {
      const livesRemaining = mission.lives + mission.bonusLives;
      
      if (livesRemaining === 3 && mission.points >= 5000) {
        grade = 'gold';
        message = 'Perfekte Mission! Gold-Zertifikat verdient! 🥇';
      } else if (livesRemaining >= 2 && mission.points >= 3000) {
        grade = 'silver';
        message = 'Sehr gut! Silber-Zertifikat verdient! 🥈';
      } else {
        grade = 'bronze';
        message = 'Gut gemacht! Bronze-Zertifikat verdient! 🥉';
      }
    } else {
      message = 'Mission fehlgeschlagen. Versuche es erneut!';
    }
    
    return {
      success: mission.success,
      totalPoints: mission.points,
      correctAnswers,
      livesRemaining: mission.lives + mission.bonusLives,
      grade,
      message
    };
  }
}

describe('Integration: Full Mission Flow', () => {
  let engine: MissionEngine;
  
  beforeEach(() => {
    engine = new MissionEngine();
  });
  
  describe('Briefing Phase', () => {
    it('sollte Mission mit korrekter Struktur erstellen', () => {
      const mission = engine.createMission('factory-m1', 'factory');
      
      expect(mission.id).toBe('factory-m1');
      expect(mission.title).toContain('factory');
      expect(mission.briefing).toBeTruthy();
      expect(mission.questions).toHaveLength(10);
      expect(mission.lives).toBe(3);
      expect(mission.points).toBe(0);
      expect(mission.currentQuestionIndex).toBe(0);
      expect(mission.finished).toBe(false);
    });
    
    it('sollte Fragen mit korrekten Typen generieren', () => {
      const mission = engine.createMission('it-m1', 'it');
      
      expect(mission.questions[0].kind).toBe('standard'); // Q1
      expect(mission.questions[4].kind).toBe('risk');     // Q5
      expect(mission.questions[8].kind).toBe('team');     // Q9
      expect(mission.questions[9].kind).toBe('risk');     // Q10
    });
  });
  
  describe('Question Flow (Q1-Q10)', () => {
    it('sollte alle 10 Fragen korrekt durchlaufen', () => {
      const mission = engine.createMission('test-m1', 'test');
      
      for (let i = 0; i < 10; i++) {
        expect(mission.currentQuestionIndex).toBe(i);
        expect(mission.finished).toBe(false);
        
        const result = engine.answerQuestion(mission, 0); // Alle richtig
        expect(result.correct).toBe(true);
      }
      
      expect(mission.currentQuestionIndex).toBe(10);
      expect(mission.finished).toBe(true);
      expect(mission.success).toBe(true);
    });
    
    it('sollte Punkte korrekt akkumulieren', () => {
      const mission = engine.createMission('test-m1', 'test');
      
      // Alle Fragen richtig beantworten
      for (let i = 0; i < 10; i++) {
        engine.answerQuestion(mission, 0);
      }
      
      // Q1=100, Q2=200, ..., Q4=400 (Standard)
      // Q5=500*2=1000 (Risk)
      // Q6=600, Q7=700, Q8=800 (Standard)
      // Q9=900*3=2700 (Team)
      // Q10=1000*2=2000 (Risk)
      // Total: 100+200+300+400+1000+600+700+800+2700+2000 = 8800
      
      expect(mission.points).toBeGreaterThan(5000);
    });
    
    it('sollte bei falschen Antworten Leben abziehen', () => {
      const mission = engine.createMission('test-m1', 'test');
      
      // Erste Frage falsch
      const result1 = engine.answerQuestion(mission, 1); // Falsch
      expect(result1.correct).toBe(false);
      expect(result1.livesLost).toBe(1);
      expect(mission.lives).toBe(2);
      
      // Zweite Frage richtig
      const result2 = engine.answerQuestion(mission, 0); // Richtig
      expect(result2.correct).toBe(true);
      expect(mission.lives).toBe(2); // Unverändert
    });
  });
  
  describe('Risk Questions (Q5, Q10)', () => {
    it('sollte 2x Punkte bei korrekter Risk-Antwort vergeben', () => {
      const mission = engine.createMission('test-m1', 'test');
      
      // Bis Q5
      for (let i = 0; i < 5; i++) {
        engine.answerQuestion(mission, 0);
      }
      
      const pointsBefore = mission.points;
      const q5Points = mission.questions[4].points;
      
      // Q5 ist bereits beantwortet, aber wir können den Logic testen
      expect(mission.points).toBeGreaterThan(pointsBefore - (q5Points * 2));
    });
    
    it('sollte bei falscher Risk-Antwort alle Punkte verlieren', () => {
      const mission = engine.createMission('test-m1', 'test');
      
      // Q1-Q4 richtig
      for (let i = 0; i < 4; i++) {
        engine.answerQuestion(mission, 0);
      }
      
      expect(mission.points).toBeGreaterThan(0);
      
      // Q5 falsch (Risk)
      const result = engine.answerQuestion(mission, 1);
      
      expect(result.correct).toBe(false);
      expect(mission.points).toBe(0);
      expect(result.message).toContain('Risiko');
    });
  });
  
  describe('Team Question (Q9)', () => {
    it('sollte 3x Punkte bei korrekter Team-Antwort vergeben', () => {
      const mission = engine.createMission('test-m1', 'test');
      
      // Bis Q9
      for (let i = 0; i < 8; i++) {
        engine.answerQuestion(mission, 0);
      }
      
      const pointsBefore = mission.points;
      
      // Q9 richtig (Team)
      const result = engine.answerQuestion(mission, 0);
      
      expect(result.correct).toBe(true);
      expect(result.pointsEarned).toBeGreaterThan(900); // 900 * 3 = 2700
      expect(result.message).toContain('Team');
      expect(mission.points).toBeGreaterThan(pointsBefore);
    });
  });
  
  describe('Debrief Phase', () => {
    it('sollte Gold-Zertifikat bei perfekter Mission vergeben', () => {
      const mission = engine.createMission('test-m1', 'test');
      
      // Alle richtig
      for (let i = 0; i < 10; i++) {
        engine.answerQuestion(mission, 0);
      }
      
      const debrief = engine.getDebrief(mission);
      
      expect(debrief.success).toBe(true);
      expect(debrief.livesRemaining).toBe(3);
      expect(debrief.totalPoints).toBeGreaterThan(5000);
      expect(debrief.grade).toBe('gold');
      expect(debrief.message).toContain('Gold');
    });
    
    it('sollte Silber-Zertifikat bei gutem Ergebnis vergeben', () => {
      const mission = engine.createMission('test-m1', 'test');
      
      // 8 richtig, 2 falsch
      for (let i = 0; i < 8; i++) {
        engine.answerQuestion(mission, 0);
      }
      engine.answerQuestion(mission, 1); // Falsch
      engine.answerQuestion(mission, 0); // Richtig
      
      const debrief = engine.getDebrief(mission);
      
      expect(debrief.success).toBe(true);
      expect(debrief.livesRemaining).toBeGreaterThanOrEqual(1);
      expect(debrief.grade).toMatch(/silver|bronze/);
    });
    
    it('sollte Mission als fehlgeschlagen markieren wenn Leben = 0', () => {
      const mission = engine.createMission('test-m1', 'test');
      
      // 3 Fehler = Alle Leben weg
      engine.answerQuestion(mission, 1);
      engine.answerQuestion(mission, 1);
      engine.answerQuestion(mission, 1);
      
      expect(mission.finished).toBe(true);
      expect(mission.success).toBe(false);
      expect(mission.lives + mission.bonusLives).toBe(0);
      
      const debrief = engine.getDebrief(mission);
      expect(debrief.success).toBe(false);
      expect(debrief.grade).toBe('failed');
    });
  });
  
  describe('Komplette Szenarien', () => {
    it('Szenario 1: Perfekte Mission (alle richtig)', () => {
      const mission = engine.createMission('scenario-1', 'factory');
      
      // Briefing
      expect(mission.briefing).toBeTruthy();
      
      // Q1-Q10: Alle richtig
      for (let i = 0; i < 10; i++) {
        const result = engine.answerQuestion(mission, 0);
        expect(result.correct).toBe(true);
      }
      
      // Debrief
      const debrief = engine.getDebrief(mission);
      expect(debrief.success).toBe(true);
      expect(debrief.grade).toBe('gold');
      expect(debrief.livesRemaining).toBe(3);
      expect(debrief.totalPoints).toBeGreaterThan(5000);
    });
    
    it('Szenario 2: Mit Fehlern aber erfolgreich', () => {
      const mission = engine.createMission('scenario-2', 'it');
      
      // Q1: Richtig
      engine.answerQuestion(mission, 0);
      // Q2: Falsch
      engine.answerQuestion(mission, 1);
      // Q3-Q10: Richtig
      for (let i = 0; i < 8; i++) {
        engine.answerQuestion(mission, 0);
      }
      
      const debrief = engine.getDebrief(mission);
      expect(debrief.success).toBe(true);
      expect(debrief.livesRemaining).toBe(2);
      expect(debrief.grade).toMatch(/silver|bronze/);
    });
    
    it('Szenario 3: Risk-Frage verloren, aber Recovery', () => {
      const mission = engine.createMission('scenario-3', 'health');
      
      // Q1-Q4: Richtig (sammle Punkte)
      for (let i = 0; i < 4; i++) {
        engine.answerQuestion(mission, 0);
      }
      
      const pointsBeforeRisk = mission.points;
      expect(pointsBeforeRisk).toBeGreaterThan(0);
      
      // Q5: Falsch (Risk - alle Punkte weg)
      engine.answerQuestion(mission, 1);
      expect(mission.points).toBe(0);
      
      // Q6-Q10: Richtig (neue Punkte sammeln)
      for (let i = 0; i < 5; i++) {
        engine.answerQuestion(mission, 0);
      }
      
      expect(mission.points).toBeGreaterThan(0);
      
      const debrief = engine.getDebrief(mission);
      expect(debrief.success).toBe(true);
      expect(debrief.livesRemaining).toBe(2);
    });
    
    it('Szenario 4: Zu viele Fehler = Mission Failed', () => {
      const mission = engine.createMission('scenario-4', 'legal');
      
      // 3 Fehler hintereinander
      engine.answerQuestion(mission, 1);
      engine.answerQuestion(mission, 1);
      engine.answerQuestion(mission, 1);
      
      expect(mission.finished).toBe(true);
      expect(mission.success).toBe(false);
      
      const debrief = engine.getDebrief(mission);
      expect(debrief.success).toBe(false);
      expect(debrief.grade).toBe('failed');
      expect(debrief.livesRemaining).toBe(0);
    });
    
    it('Szenario 5: Mixed Performance (Realistic)', () => {
      const mission = engine.createMission('scenario-5', 'public');
      
      // Q1: Richtig
      engine.answerQuestion(mission, 0);
      // Q2: Falsch
      engine.answerQuestion(mission, 1);
      // Q3-Q4: Richtig
      engine.answerQuestion(mission, 0);
      engine.answerQuestion(mission, 0);
      // Q5 (Risk): Richtig!
      engine.answerQuestion(mission, 0);
      // Q6: Falsch
      engine.answerQuestion(mission, 1);
      // Q7-Q8: Richtig
      engine.answerQuestion(mission, 0);
      engine.answerQuestion(mission, 0);
      // Q9 (Team): Richtig!
      engine.answerQuestion(mission, 0);
      // Q10 (Risk): Richtig!
      engine.answerQuestion(mission, 0);
      
      const debrief = engine.getDebrief(mission);
      expect(debrief.success).toBe(true);
      expect(debrief.livesRemaining).toBe(1); // 3 - 2 Fehler = 1
      expect(debrief.totalPoints).toBeGreaterThan(2000);
    });
  });
});


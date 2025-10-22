/**
 * Rubric Service
 * Evaluates user performance and generates signals
 */

import { TRMEvalRequest } from '../common/types.js';

export interface RubricResult {
  score: number; // 0.0 - 1.0
  microTip: string;
  signals: {
    difficultyAdj?: -1 | 0 | 1;
    fatigue?: boolean;
    guessPattern?: boolean;
  };
}

export class RubricService {
  /**
   * Score an answer and generate feedback
   */
  score(req: TRMEvalRequest): RubricResult {
    let score = req.result.correct ? 1.0 : 0.0;
    let microTip = '';
    const signals: RubricResult['signals'] = {};

    // Base feedback
    if (req.result.correct) {
      microTip = this.getSuccessFeedback(req);
    } else {
      microTip = this.getFailFeedback(req);
    }

    // Adjust score based on time and help usage
    if (req.result.correct) {
      // Penalty for help usage
      if (req.result.helpUsed) {
        score *= 0.8;
      }

      // Time-based adjustment
      if (req.result.timeMs < 3000) {
        // Very fast - possible guessing
        signals.guessPattern = true;
        score *= 0.9;
      } else if (req.result.timeMs > 60000) {
        // Very slow - possible fatigue
        signals.fatigue = true;
      }
    }

    // Challenge outcome affects score
    if (req.result.challengeOutcome === 'success') {
      score = Math.min(1.0, score + 0.2); // Bonus for overcoming challenge
      microTip += ' Großartig, Challenge gemeistert!';
    } else if (req.result.challengeOutcome === 'fail') {
      score = 0;
      microTip = 'Challenge fehlgeschlagen. Beim nächsten Mal!';
    }

    // Analyze telemetry for patterns
    this.analyzeTelemetry(req.telemetry, signals);

    // Determine difficulty adjustment
    signals.difficultyAdj = this.determineDifficultyAdjustment(score, signals);

    return { score, microTip, signals };
  }

  /**
   * Get success feedback message
   */
  private getSuccessFeedback(req: TRMEvalRequest): string {
    const messages = [
      'Richtig! Weiter so! ✅',
      'Perfekt gelöst! 🌟',
      'Exzellent! Du machst Fortschritte! 🎯',
      'Genau richtig! Stark! 💪',
      'Korrekt! Du bist auf einem guten Weg! 🚀',
    ];

    // Faster answers get more enthusiastic feedback
    if (req.result.timeMs < 10000) {
      return messages[Math.floor(Math.random() * 2)]; // More enthusiastic
    }

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Get fail feedback message
   */
  private getFailFeedback(req: TRMEvalRequest): string {
    const messages = [
      'Nicht ganz. Versuch es nochmal! 💡',
      'Fast! Überlege dir die Details nochmal. 🤔',
      'Nicht richtig. Aber aus Fehlern lernt man! 📚',
      'Leider falsch. Die richtige Antwort war anders. 🔄',
      'Nicht korrekt. Beim nächsten Mal! 💪',
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Analyze telemetry data for behavioral signals
   */
  private analyzeTelemetry(telemetry: Record<string, any>, signals: RubricResult['signals']): void {
    // Check for rapid clicking pattern
    if (telemetry.clicks && telemetry.clicks > 5) {
      signals.guessPattern = true;
    }

    // Check for focus loss
    if (telemetry.focusLost && telemetry.focusLost > 3) {
      signals.fatigue = true;
    }

    // Check for excessive retries
    if (telemetry.retries && telemetry.retries > 2) {
      signals.fatigue = true;
    }

    // Device context (mobile users might be slower)
    if (telemetry.device === 'mobile' && telemetry.timeMs > 30000) {
      // Don't count as fatigue on mobile
      signals.fatigue = false;
    }
  }

  /**
   * Determine difficulty adjustment based on performance
   */
  private determineDifficultyAdjustment(
    score: number,
    signals: RubricResult['signals']
  ): -1 | 0 | 1 {
    // Lower difficulty if struggling
    if (score < 0.5 || signals.fatigue) {
      return -1;
    }

    // Raise difficulty if doing well
    if (score >= 0.9 && !signals.guessPattern) {
      return 1;
    }

    // Keep current difficulty
    return 0;
  }

  /**
   * Calculate aggregate signals for mission
   */
  calculateAggregateSignals(attempts: any[]): {
    scoreAvg: number;
    helpRate: number;
    difficultyAdj: -1 | 0 | 1;
    fatigue: boolean;
    guessPattern: boolean;
  } {
    if (attempts.length === 0) {
      return {
        scoreAvg: 0,
        helpRate: 0,
        difficultyAdj: 0,
        fatigue: false,
        guessPattern: false,
      };
    }

    const scoreSum = attempts.reduce((sum, a) => sum + a.score, 0);
    const helpCount = attempts.filter(a => a.helpUsed).length;
    const fatigueCount = attempts.filter(a => a.signals?.fatigue).length;
    const guessCount = attempts.filter(a => a.signals?.guessPattern).length;

    const scoreAvg = scoreSum / attempts.length;
    const helpRate = helpCount / attempts.length;

    // Determine overall difficulty adjustment
    let difficultyAdj: -1 | 0 | 1 = 0;
    if (scoreAvg < 0.55 || helpRate > 0.25) {
      difficultyAdj = -1;
    } else if (scoreAvg > 0.82 && helpRate < 0.1) {
      difficultyAdj = 1;
    }

    return {
      scoreAvg,
      helpRate,
      difficultyAdj,
      fatigue: fatigueCount > attempts.length * 0.3,
      guessPattern: guessCount > attempts.length * 0.3,
    };
  }
}



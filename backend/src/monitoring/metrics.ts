/**
 * Metrics Collection Service
 * Tracks: learning velocity, risk-fail rate, challenge-success rate, drop-off
 */

export interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags: Record<string, string>;
}

export class MetricsCollector {
  private metrics: Metric[] = [];
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  
  /**
   * Erhöht einen Counter
   */
  increment(name: string, value: number = 1, tags: Record<string, string> = {}): void {
    const key = this.getKey(name, tags);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
    
    this.recordMetric(name, current + value, tags);
  }
  
  /**
   * Setzt einen Gauge-Wert
   */
  gauge(name: string, value: number, tags: Record<string, string> = {}): void {
    const key = this.getKey(name, tags);
    this.gauges.set(key, value);
    
    this.recordMetric(name, value, tags);
  }
  
  /**
   * Misst Dauer eines Vorgangs
   */
  async timing<T>(
    name: string,
    fn: () => Promise<T>,
    tags: Record<string, string> = {}
  ): Promise<T> {
    const start = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.recordMetric(`${name}.duration`, duration, tags);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.recordMetric(`${name}.duration`, duration, { ...tags, error: 'true' });
      throw error;
    }
  }
  
  /**
   * Berechnet Learning Velocity
   * (Punkte pro Minute in den letzten Missionen)
   */
  calculateLearningVelocity(
    userId: string,
    recentMissions: Array<{ points: number; duration: number }>
  ): number {
    if (recentMissions.length === 0) return 0;
    
    const totalPoints = recentMissions.reduce((sum, m) => sum + m.points, 0);
    const totalMinutes = recentMissions.reduce((sum, m) => sum + m.duration, 0) / 60000;
    
    const velocity = totalMinutes > 0 ? totalPoints / totalMinutes : 0;
    
    this.gauge('learning.velocity', velocity, { userId });
    return velocity;
  }
  
  /**
   * Berechnet Risk-Fail Rate
   * (Anteil fehlgeschlagener Risk-Fragen)
   */
  calculateRiskFailRate(
    userId: string,
    riskQuestions: Array<{ correct: boolean }>
  ): number {
    if (riskQuestions.length === 0) return 0;
    
    const failed = riskQuestions.filter(q => !q.correct).length;
    const rate = failed / riskQuestions.length;
    
    this.gauge('risk.fail_rate', rate, { userId });
    return rate;
  }
  
  /**
   * Berechnet Challenge-Success Rate
   */
  calculateChallengeSuccessRate(
    userId: string,
    challenges: Array<{ success: boolean }>
  ): number {
    if (challenges.length === 0) return 0;
    
    const successful = challenges.filter(c => c.success).length;
    const rate = successful / challenges.length;
    
    this.gauge('challenge.success_rate', rate, { userId });
    return rate;
  }
  
  /**
   * Trackt Drop-Off an spezifischen Punkten
   */
  trackDropOff(userId: string, questionIndex: number, reason: string): void {
    this.increment('mission.drop_off', 1, {
      userId,
      question: questionIndex.toString(),
      reason
    });
  }
  
  /**
   * Trackt Mission Completion
   */
  trackMissionComplete(
    userId: string,
    missionId: string,
    duration: number,
    success: boolean,
    points: number
  ): void {
    this.increment('mission.completed', 1, {
      userId,
      missionId,
      success: success.toString()
    });
    
    this.gauge('mission.duration', duration, { userId, missionId });
    this.gauge('mission.points', points, { userId, missionId, success: success.toString() });
  }
  
  /**
   * Trackt Question Answer
   */
  trackQuestionAnswer(
    userId: string,
    questionId: string,
    correct: boolean,
    timeMs: number,
    questionType: 'standard' | 'risk' | 'team'
  ): void {
    this.increment('question.answered', 1, {
      userId,
      type: questionType,
      correct: correct.toString()
    });
    
    this.gauge('question.time', timeMs, {
      userId,
      questionId,
      type: questionType
    });
  }
  
  /**
   * Holt aggregierte Metriken für Zeitraum
   */
  getMetrics(
    name?: string,
    startTime?: number,
    endTime?: number
  ): Metric[] {
    let filtered = this.metrics;
    
    if (name) {
      filtered = filtered.filter(m => m.name === name);
    }
    
    if (startTime) {
      filtered = filtered.filter(m => m.timestamp >= startTime);
    }
    
    if (endTime) {
      filtered = filtered.filter(m => m.timestamp <= endTime);
    }
    
    return filtered;
  }
  
  /**
   * Berechnet Durchschnitt für Metrik
   */
  getAverage(name: string, tags: Record<string, string> = {}): number {
    const metrics = this.getMetrics(name).filter(m =>
      Object.entries(tags).every(([k, v]) => m.tags[k] === v)
    );
    
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }
  
  /**
   * Berechnet Percentile (p50, p95, p99)
   */
  getPercentile(name: string, percentile: number, tags: Record<string, string> = {}): number {
    const metrics = this.getMetrics(name).filter(m =>
      Object.entries(tags).every(([k, v]) => m.tags[k] === v)
    );
    
    if (metrics.length === 0) return 0;
    
    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    
    return values[Math.max(0, index)];
  }
  
  /**
   * Exportiert Metriken (für Prometheus, StatsD, etc.)
   */
  export(): {
    counters: Record<string, number>;
    gauges: Record<string, number>;
    metrics: Metric[];
  } {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      metrics: this.metrics
    };
  }
  
  /**
   * Private Helper: Zeichnet Metrik auf
   */
  private recordMetric(name: string, value: number, tags: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      tags
    });
    
    // Optional: In Production an Monitoring-Service senden
    // console.log('[METRIC]', { name, value, tags });
  }
  
  /**
   * Private Helper: Generiert Key für Counter/Gauge
   */
  private getKey(name: string, tags: Record<string, string>): string {
    const tagStr = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    
    return tagStr ? `${name}{${tagStr}}` : name;
  }
}

// Global Metrics Collector
export const metrics = new MetricsCollector();

/**
 * Middleware für Express zum automatischen Metrics-Tracking
 */
export function metricsMiddleware(req: any, res: any, next: any) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    metrics.increment('http.requests', 1, {
      method: req.method,
      path: req.route?.path || req.path,
      status: res.statusCode.toString()
    });
    
    metrics.gauge('http.response_time', duration, {
      method: req.method,
      path: req.route?.path || req.path
    });
  });
  
  next();
}


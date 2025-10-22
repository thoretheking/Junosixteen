/**
 * Distributed Tracing Service
 * Tracks request flow: hrm.plan → trm.eval → gamification.update
 */

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'success' | 'error';
  tags: Record<string, string | number | boolean>;
  logs: Array<{ timestamp: number; message: string; level: 'info' | 'warn' | 'error' }>;
}

export class Tracer {
  private spans: Map<string, Span> = new Map();
  
  /**
   * Startet einen neuen Trace
   */
  startTrace(name: string, tags: Record<string, any> = {}): Span {
    const traceId = this.generateId();
    const spanId = this.generateId();
    
    const span: Span = {
      traceId,
      spanId,
      name,
      startTime: Date.now(),
      status: 'pending',
      tags,
      logs: []
    };
    
    this.spans.set(spanId, span);
    return span;
  }
  
  /**
   * Startet einen Child-Span
   */
  startSpan(parentSpan: Span, name: string, tags: Record<string, any> = {}): Span {
    const spanId = this.generateId();
    
    const span: Span = {
      traceId: parentSpan.traceId,
      spanId,
      parentSpanId: parentSpan.spanId,
      name,
      startTime: Date.now(),
      status: 'pending',
      tags,
      logs: []
    };
    
    this.spans.set(spanId, span);
    return span;
  }
  
  /**
   * Beendet einen Span
   */
  endSpan(span: Span, status: 'success' | 'error' = 'success'): void {
    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;
    
    // In Production: Send to monitoring service (Jaeger, Zipkin, etc.)
    this.exportSpan(span);
  }
  
  /**
   * Fügt einen Log-Eintrag zu einem Span hinzu
   */
  log(span: Span, message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    span.logs.push({
      timestamp: Date.now(),
      message,
      level
    });
  }
  
  /**
   * Fügt Tags zu einem Span hinzu
   */
  setTags(span: Span, tags: Record<string, any>): void {
    Object.assign(span.tags, tags);
  }
  
  /**
   * Holt einen Span per ID
   */
  getSpan(spanId: string): Span | undefined {
    return this.spans.get(spanId);
  }
  
  /**
   * Holt alle Spans eines Traces
   */
  getTrace(traceId: string): Span[] {
    return Array.from(this.spans.values())
      .filter(span => span.traceId === traceId)
      .sort((a, b) => a.startTime - b.startTime);
  }
  
  /**
   * Exportiert Span zu Monitoring-Service
   */
  private exportSpan(span: Span): void {
    // In Production: Send to Jaeger, Zipkin, OpenTelemetry, etc.
    console.log('[TRACE]', {
      traceId: span.traceId,
      spanId: span.spanId,
      name: span.name,
      duration: span.duration,
      status: span.status
    });
  }
  
  /**
   * Generiert eindeutige ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global Tracer Instance
export const tracer = new Tracer();

/**
 * Middleware für Express zum automatischen Tracing
 */
export function tracingMiddleware(req: any, res: any, next: any) {
  const span = tracer.startTrace(`HTTP ${req.method} ${req.path}`, {
    'http.method': req.method,
    'http.url': req.url,
    'http.user_agent': req.get('user-agent')
  });
  
  // Füge Span zu Request hinzu
  req.span = span;
  
  // Trace Response
  res.on('finish', () => {
    tracer.setTags(span, {
      'http.status_code': res.statusCode
    });
    tracer.endSpan(span, res.statusCode >= 400 ? 'error' : 'success');
  });
  
  next();
}

/**
 * Helper: Trace HRM → TRM → Gamification Flow
 */
export async function traceGameFlow<T>(
  userId: string,
  missionId: string,
  questionId: string,
  flow: (span: Span) => Promise<T>
): Promise<T> {
  const rootSpan = tracer.startTrace('game_flow', {
    userId,
    missionId,
    questionId
  });
  
  try {
    // HRM Planning
    const hrmSpan = tracer.startSpan(rootSpan, 'hrm.plan', { userId, missionId });
    tracer.log(hrmSpan, 'Generating HRM plan for mission');
    // ... HRM logic would go here
    tracer.endSpan(hrmSpan, 'success');
    
    // TRM Evaluation
    const trmSpan = tracer.startSpan(rootSpan, 'trm.eval', { questionId });
    tracer.log(trmSpan, 'Evaluating answer with TRM');
    // ... TRM logic would go here
    tracer.endSpan(trmSpan, 'success');
    
    // Execute actual flow
    const result = await flow(rootSpan);
    
    // Gamification Update
    const gamSpan = tracer.startSpan(rootSpan, 'gamification.update', { userId });
    tracer.log(gamSpan, 'Updating points and badges');
    // ... Gamification logic would go here
    tracer.endSpan(gamSpan, 'success');
    
    tracer.endSpan(rootSpan, 'success');
    return result;
  } catch (error: any) {
    tracer.log(rootSpan, `Error: ${error.message}`, 'error');
    tracer.endSpan(rootSpan, 'error');
    throw error;
  }
}


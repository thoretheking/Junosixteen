// Use built-in fetch (Node.js 18+) or polyfill
const fetch = globalThis.fetch || require('node-fetch');

export interface MangleFact {
  [key: string]: any;
}

export interface MangleRequest {
  program?: string;  // optional: überschreibt geladene Regeln
  query: string;
  facts: MangleFact[];
  params?: Record<string, any>;
}

export interface MangleResponse {
  ok: boolean;
  tables: Record<string, Array<Record<string, any>>>;
  error?: string;
}

export interface PolicyDecisionRequest {
  userId: string;
  sessionId: string;
  level: number;
  watched: number[];
  answers: Array<{
    idx: number;
    part?: "A" | "B" | "-";
    correct: boolean;
  }>;
  teamAnswers?: Array<{
    memberId: string;
    correct: boolean;
  }>;
  deadlineISO: string;
  basePoints?: Record<number, number>;
}

export interface PolicyDecisionResponse {
  status: "PASSED" | "IN_PROGRESS" | "RESET_RISK" | "RESET_DEADLINE";
  pointsFinal?: number;
  pointsRaw?: number;
  nextQuestion?: number;
  debug?: {
    factsCount: number;
    queryTime: number;
    rawResponse: MangleResponse;
  };
}

export class MangleClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl?: string, timeout = 5000) {
    this.baseUrl = baseUrl || process.env.MANGLE_URL || 'http://localhost:8088';
    this.timeout = timeout;
  }

  async eval(request: MangleRequest): Promise<MangleResponse> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(`${this.baseUrl}/eval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Mangle service error: HTTP ${response.status}`);
      }

      const data = await response.json() as MangleResponse;
      
      if (!data.ok && data.error) {
        throw new Error(`Mangle evaluation error: ${data.error}`);
      }

      console.log(`Mangle query executed in ${Date.now() - startTime}ms`);
      return data;
    } catch (error) {
      console.error('Mangle client error:', error);
      throw new Error(`Failed to evaluate Mangle query: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async healthCheck(): Promise<{ status: string; engine: string; version: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Health check failed: HTTP ${response.status}`);
      }
      
      return await response.json() as { status: string; engine: string; version: string };
    } catch (error) {
      throw new Error(`Mangle service unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Convenience method für Policy Decisions
  async evaluatePolicy(request: PolicyDecisionRequest): Promise<PolicyDecisionResponse> {
    const facts = this.convertToFacts(request);
    const queries = [
      `current_status("${request.sessionId}", _Status).`,
      `points_final("${request.sessionId}", _Points).`,
      `points_raw("${request.sessionId}", _Raw).`,
      `next_question("${request.sessionId}", _Next).`
    ];

    const startTime = Date.now();
    const responses: MangleResponse[] = [];

    // Parallel queries für bessere Performance
    for (const query of queries) {
      try {
        const response = await this.eval({
          query,
          facts,
          params: {}
        });
        responses.push(response);
      } catch (error) {
        console.warn(`Query failed: ${query}`, error);
        responses.push({ ok: false, tables: {}, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    const queryTime = Date.now() - startTime;

    // Parse responses
    const status = this.extractValue(responses[0], 'current_status') || 'IN_PROGRESS';
    const pointsFinal = this.extractValue(responses[1], 'points_final');
    const pointsRaw = this.extractValue(responses[2], 'points_raw');
    const nextQuestion = this.extractValue(responses[3], 'next_question');

    return {
      status: status as PolicyDecisionResponse['status'],
      pointsFinal,
      pointsRaw,
      nextQuestion,
      debug: {
        factsCount: facts.length,
        queryTime,
        rawResponse: responses[0] // Include first response for debugging
      }
    };
  }

  private convertToFacts(request: PolicyDecisionRequest): MangleFact[] {
    const facts: MangleFact[] = [];

    // Basic session facts
    facts.push({ 
      predicate: 'session',
      args: [request.userId, request.sessionId]
    });
    facts.push({ 
      predicate: 'level',
      args: [request.sessionId, request.level]
    });

    // Watched videos
    request.watched.forEach(idx => {
      facts.push({
        predicate: 'watched',
        args: [request.sessionId, idx]
      });
    });

    // Answers
    request.answers.forEach(answer => {
      facts.push({
        predicate: 'answered',
        args: [request.sessionId, answer.idx, answer.part || '-', answer.correct]
      });
    });

    // Team answers
    if (request.teamAnswers) {
      request.teamAnswers.forEach(teamAnswer => {
        facts.push({
          predicate: 'team_answer',
          args: [request.sessionId, teamAnswer.memberId, teamAnswer.correct]
        });
      });
    }

    // Deadline
    facts.push({
      predicate: 'deadline',
      args: [request.sessionId, request.deadlineISO]
    });

    // Current time
    facts.push({
      predicate: 'now',
      args: [new Date().toISOString()]
    });

    // Base points (default if not provided)
    const basePoints = request.basePoints || {
      1: 1, 2: 1, 3: 2, 4: 2, 5: 3,
      6: 3, 7: 4, 8: 4, 9: 5, 10: 6
    };

    Object.entries(basePoints).forEach(([idx, points]) => {
      facts.push({
        predicate: 'base_points',
        args: [parseInt(idx), points]
      });
    });

    // Question indices
    for (let i = 1; i <= 10; i++) {
      facts.push({
        predicate: 'q',
        args: [i]
      });
    }

    return facts;
  }

  private extractValue(response: MangleResponse, tableName: string): any {
    if (!response.ok || !response.tables[tableName]) {
      return undefined;
    }
    
    const table = response.tables[tableName];
    if (table.length === 0) {
      return undefined;
    }

    // Return the second column value (first is usually the predicate name)
    const firstRow = table[0];
    const keys = Object.keys(firstRow);
    return keys.length > 1 ? firstRow[keys[1]] : firstRow[keys[0]];
  }
}

// Singleton instance
export const mangleClient = new MangleClient();

// Convenience functions
export async function evalMangle(facts: MangleFact[], rules: string[], query: string): Promise<MangleResponse> {
  const program = rules.join('\n');
  return mangleClient.eval({
    program,
    query,
    facts,
    params: {}
  });
}

export async function checkPolicy(request: PolicyDecisionRequest): Promise<PolicyDecisionResponse> {
  return mangleClient.evaluatePolicy(request);
} 
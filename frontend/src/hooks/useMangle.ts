import { useState, useCallback } from 'react';

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
    rawResponse: any;
  };
}

export interface MangleError {
  error: string;
  message?: string;
  details?: any;
}

export function useMangle() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<MangleError | null>(null);
  const [lastDecision, setLastDecision] = useState<PolicyDecisionResponse | null>(null);

  const checkPolicy = useCallback(async (request: PolicyDecisionRequest): Promise<PolicyDecisionResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/policy/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: PolicyDecisionResponse = await response.json();
      setLastDecision(data);
      return data;
    } catch (err) {
      const mangleError: MangleError = {
        error: 'Policy check failed',
        message: err instanceof Error ? err.message : 'Unknown error',
        details: err
      };
      setError(mangleError);
      throw mangleError;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/policy/health`);
      
      if (!response.ok) {
        throw new Error(`Health check failed: HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      throw new Error(`Mangle service unavailable: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, []);

  const debugEval = useCallback(async (facts: any[], rules: string[], query: string) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/policy/debug`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ facts, rules, query }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Debug eval failed: HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      throw new Error(`Debug evaluation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setLastDecision(null);
    setLoading(false);
  }, []);

  return {
    // Main functions
    checkPolicy,
    checkHealth,
    debugEval,
    
    // State
    loading,
    error,
    lastDecision,
    
    // Utilities
    clearError,
    reset,
    
    // Computed values
    isHealthy: !error && lastDecision?.debug?.queryTime !== undefined,
    hasError: !!error,
  };
}

// Utility functions for common scenarios
export const createPolicyRequest = (
  userId: string,
  sessionId: string,
  level: number,
  gameState: {
    watched: number[];
    answers: Array<{ idx: number; part?: string; correct: boolean }>;
    teamAnswers?: Array<{ memberId: string; correct: boolean }>;
    deadline: string;
  }
): PolicyDecisionRequest => {
  return {
    userId,
    sessionId,
    level,
    watched: gameState.watched,
    answers: gameState.answers.map(answer => ({
      idx: answer.idx,
      part: (answer.part as "A" | "B" | "-") || "-",
      correct: answer.correct
    })),
    teamAnswers: gameState.teamAnswers,
    deadlineISO: gameState.deadline
  };
};

export const getPolicyStatusMessage = (status: PolicyDecisionResponse['status']): string => {
  switch (status) {
    case 'PASSED':
      return '🎉 Level erfolgreich abgeschlossen!';
    case 'IN_PROGRESS':
      return '⏳ Level läuft noch...';
    case 'RESET_RISK':
      return '⚠️ Risikofrage falsch - Level wird zurückgesetzt';
    case 'RESET_DEADLINE':
      return '⏰ Deadline verpasst - Fortschritt wird zurückgesetzt';
    default:
      return '❓ Unbekannter Status';
  }
};

export const getPolicyStatusColor = (status: PolicyDecisionResponse['status']): string => {
  switch (status) {
    case 'PASSED':
      return 'text-green-600';
    case 'IN_PROGRESS':
      return 'text-blue-600';
    case 'RESET_RISK':
      return 'text-red-600';
    case 'RESET_DEADLINE':
      return 'text-orange-600';
    default:
      return 'text-gray-600';
  }
}; 
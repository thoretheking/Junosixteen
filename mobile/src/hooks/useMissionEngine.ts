/**
 * useMissionEngine Hook
 * Client-side mission engine integrating with HRM/TRM backend
 */

import { useState, useCallback } from 'react';
import { World, Quest, HRMPlanResponse, TRMEvalResponse } from '../types/hrm-trm';
import { api } from '../services/ApiService';

export interface MissionState {
  idx: number;
  lives: number;
  points: number;
  lockUntil: number;
  questSet: Quest[];
  hypothesisId: string | null;
  missionId: string | null;
  briefing: string | null;
  debriefSuccess: string | null;
  debriefFail: string | null;
  cliffhanger: string | null;
}

export interface SubmitAnswerContext {
  hypothesisId: string;
  missionId: string;
  quest: Quest;
  optionId: string;
  timeMs: number;
  helpUsed?: boolean;
}

export function useMissionEngine(userId: string) {
  const [state, setState] = useState<MissionState>({
    idx: 1,
    lives: 3,
    points: 0,
    lockUntil: 0,
    questSet: [],
    hypothesisId: null,
    missionId: null,
    briefing: null,
    debriefSuccess: null,
    debriefFail: null,
    cliffhanger: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Start a new mission
   */
  const startMission = useCallback(
    async (missionId: string, world: World, difficulty?: 'easy' | 'medium' | 'hard') => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.post<HRMPlanResponse>('/hrm/plan', {
          userId,
          goal: { missionId, world },
          context: {
            lang: 'de',
            difficulty: difficulty || 'medium',
          },
        });

        setState({
          idx: 1,
          lives: 3,
          points: 0,
          lockUntil: 0,
          questSet: response.questSet,
          hypothesisId: response.hypothesisId,
          missionId,
          briefing: response.briefing,
          debriefSuccess: response.debriefSuccess,
          debriefFail: response.debriefFail,
          cliffhanger: response.cliffhanger,
        });

        // Log telemetry
        await api.post('/telemetry/event', {
          eventType: 'mission_started',
          userId,
          missionId,
          data: { world, difficulty },
        });

        return response;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to start mission';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  /**
   * Submit an answer
   */
  const submitAnswer = useCallback(
    async (ctx: SubmitAnswerContext, runChallenge?: (challengeId: string) => Promise<'success' | 'fail' | null>) => {
      const now = Date.now();

      // Check cooldown
      if (state.lockUntil > now) {
        console.warn('Cooldown active, ignoring answer');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Check if answer is correct
        const correct = ctx.quest.options.find(o => o.id === ctx.optionId)?.correct ?? false;

        // Run challenge if wrong and challenge ID exists
        let challengeOutcome: 'success' | 'fail' | null = null;
        if (!correct && ctx.quest.onWrongChallengeId && runChallenge) {
          // Log challenge start
          await api.post('/telemetry/event', {
            eventType: 'challenge_start',
            userId,
            missionId: ctx.missionId,
            questId: ctx.quest.id,
            data: { challengeId: ctx.quest.onWrongChallengeId },
          });

          challengeOutcome = await runChallenge(ctx.quest.onWrongChallengeId);

          // Log challenge finish
          await api.post('/telemetry/event', {
            eventType: 'challenge_finish',
            userId,
            missionId: ctx.missionId,
            questId: ctx.quest.id,
            data: { challengeId: ctx.quest.onWrongChallengeId, outcome: challengeOutcome },
          });
        }

        // Collect telemetry
        const telemetry = {
          clicks: 1,
          focusLost: 0,
          retries: 0,
          device: 'mobile',
        };

        // Submit to TRM for evaluation
        const response = await api.post<TRMEvalResponse>('/trm/eval', {
          userId,
          missionId: ctx.missionId,
          hypothesisId: ctx.hypothesisId,
          questId: ctx.quest.id,
          result: {
            selectedOptionId: ctx.optionId,
            correct,
            timeMs: ctx.timeMs,
            helpUsed: ctx.helpUsed || false,
            challengeOutcome,
          },
          telemetry,
        });

        // Log answer click
        await api.post('/telemetry/event', {
          eventType: 'answer_click',
          userId,
          missionId: ctx.missionId,
          questId: ctx.quest.id,
          data: { correct, challengeOutcome, scoreDelta: response.scoreDelta },
        });

        // Update state based on response
        setState(s => {
          let newLives = s.lives;
          let newIdx = s.idx;
          let newLockUntil = s.lockUntil;

          // Risk-Guard & Leben
          if (!correct && challengeOutcome !== 'success') {
            newLives = Math.max(0, s.lives - 1);

            // Apply cooldown if risk question
            if (ctx.quest.kind === 'risk' && ctx.quest.riskConfig) {
              newLockUntil = now + ctx.quest.riskConfig.cooldownMs;

              // Log cooldown
              api.post('/telemetry/event', {
                eventType: 'risk_cooldown_start',
                userId,
                missionId: ctx.missionId,
                questId: ctx.quest.id,
                data: { cooldownMs: ctx.quest.riskConfig.cooldownMs },
              });
            }
          } else if (correct || challengeOutcome === 'success') {
            // Move to next question
            newIdx = s.idx + 1;
          }

          return {
            ...s,
            lives: newLives,
            points: s.points + response.scoreDelta,
            idx: newIdx,
            lockUntil: newLockUntil,
          };
        });

        // Update HRM with signals (async, don't wait)
        if (response.convergeHint) {
          api.post('/hrm/update', {
            hypothesisId: ctx.hypothesisId,
            signals: response.signals,
          }).catch(err => console.error('Failed to update HRM:', err));
        }

        return response;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to submit answer';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId, state.lockUntil]
  );

  /**
   * Finish mission
   */
  const finishMission = useCallback(
    async (success: boolean) => {
      if (!state.missionId) return;

      try {
        await api.post('/telemetry/event', {
          eventType: 'mission_finished',
          userId,
          missionId: state.missionId,
          data: {
            success,
            finalLives: state.lives,
            finalPoints: state.points,
            questsCompleted: state.idx - 1,
          },
        });
      } catch (err) {
        console.error('Failed to log mission finish:', err);
      }
    },
    [userId, state.missionId, state.lives, state.points, state.idx]
  );

  /**
   * Get current quest
   */
  const getCurrentQuest = useCallback((): Quest | null => {
    if (state.idx <= 0 || state.idx > state.questSet.length) {
      return null;
    }
    return state.questSet[state.idx - 1];
  }, [state.idx, state.questSet]);

  /**
   * Check if mission is finished
   */
  const isMissionFinished = useCallback((): boolean => {
    return state.lives <= 0 || state.idx > state.questSet.length;
  }, [state.lives, state.idx, state.questSet.length]);

  /**
   * Check if cooldown is active
   */
  const isCooldownActive = useCallback((): boolean => {
    return state.lockUntil > Date.now();
  }, [state.lockUntil]);

  /**
   * Get remaining cooldown time
   */
  const getRemainingCooldown = useCallback((): number => {
    const remaining = state.lockUntil - Date.now();
    return Math.max(0, remaining);
  }, [state.lockUntil]);

  return {
    state,
    loading,
    error,
    startMission,
    submitAnswer,
    finishMission,
    getCurrentQuest,
    isMissionFinished,
    isCooldownActive,
    getRemainingCooldown,
  };
}



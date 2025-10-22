import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RiskControl } from './types';

interface RiskState {
  controls: Record<string, RiskControl>; // key = question.id
  currentCooldown: {
    questionId: string;
    remainingMs: number;
    active: boolean;
  } | null;
  activeBossChallenge: string | null;
  telemetry: {
    riskAttempts: Array<{
      questionId: string;
      attempts: number;
      success: boolean;
      timestamp: string;
      bossChallengePassed?: boolean;
    }>;
  };
}

const initialState: RiskState = {
  controls: {},
  currentCooldown: null,
  activeBossChallenge: null,
  telemetry: {
    riskAttempts: []
  }
};

const riskSlice = createSlice({
  name: 'risk',
  initialState,
  reducers: {
    initRisk: (state, action: PayloadAction<{ 
      qid: string; 
      maxAttempts: number; 
      cooldownMs: number;
      adaptiveHelp?: RiskControl['adaptiveHelp'];
    }>) => {
      const { qid, maxAttempts, cooldownMs, adaptiveHelp } = action.payload;
      state.controls[qid] = { 
        maxAttempts, 
        attemptsUsed: 0, 
        cooldownMs,
        adaptiveHelp
      };
    },
    
    attemptRisk: (state, action: PayloadAction<{ qid: string }>) => {
      const control = state.controls[action.payload.qid];
      if (!control) return;
      
      const now = Date.now();
      if (control.lockUntil && now < control.lockUntil) {
        console.warn(`Risk question ${action.payload.qid} still in cooldown`);
        return; // Block attempt during cooldown
      }
      
      control.attemptsUsed += 1;
      console.log(`Risk attempt ${control.attemptsUsed}/${control.maxAttempts} for ${action.payload.qid}`);
    },
    
    failRisk: (state, action: PayloadAction<{ qid: string; triggerBossChallenge: string }>) => {
      const { qid, triggerBossChallenge } = action.payload;
      const control = state.controls[qid];
      if (!control) return;
      
      // Trigger Boss-Challenge
      state.activeBossChallenge = triggerBossChallenge;
      console.log(`Risk failed for ${qid}, triggering boss challenge: ${triggerBossChallenge}`);
    },
    
    bossChallengePassed: (state, action: PayloadAction<{ qid: string; challengeId: string }>) => {
      const { qid } = action.payload;
      state.activeBossChallenge = null;
      
      // Boss-Challenge erfolgreich → zurück zur Risikofrage (keine Erhöhung der Versuche)
      console.log(`Boss challenge passed for ${qid}, returning to risk question`);
    },
    
    bossChallengeFailed: (state, action: PayloadAction<{ qid: string; challengeId: string }>) => {
      const { qid } = action.payload;
      const control = state.controls[qid];
      if (!control) return;
      
      control.bossChallengeFailed = true;
      state.activeBossChallenge = null;
      
      // Start Cooldown
      control.lockUntil = Date.now() + control.cooldownMs;
      state.currentCooldown = {
        questionId: qid,
        remainingMs: control.cooldownMs,
        active: true
      };
      
      console.log(`Boss challenge failed for ${qid}, starting ${control.cooldownMs}ms cooldown`);
    },
    
    startCooldown: (state, action: PayloadAction<{ qid: string }>) => {
      const { qid } = action.payload;
      const control = state.controls[qid];
      if (!control) return;
      
      control.lockUntil = Date.now() + control.cooldownMs;
      state.currentCooldown = {
        questionId: qid,
        remainingMs: control.cooldownMs,
        active: true
      };
    },
    
    updateCooldown: (state, action: PayloadAction<{ remainingMs: number }>) => {
      if (!state.currentCooldown) return;
      
      state.currentCooldown.remainingMs = action.payload.remainingMs;
      
      if (action.payload.remainingMs <= 0) {
        state.currentCooldown = null;
      }
    },
    
    passRisk: (state, action: PayloadAction<{ qid: string }>) => {
      const control = state.controls[action.payload.qid];
      if (!control) return;
      
      // Record successful risk completion for telemetry
      state.telemetry.riskAttempts.push({
        questionId: action.payload.qid,
        attempts: control.attemptsUsed,
        success: true,
        timestamp: new Date().toISOString(),
        bossChallengePassed: control.bossChallengeFailed === false
      });
      
      console.log(`Risk question ${action.payload.qid} passed after ${control.attemptsUsed} attempts`);
    },
    
    outOfAttempts: (state, action: PayloadAction<{ qid: string; missionFailType: 'reset' | 'fail' }>) => {
      const { qid, missionFailType } = action.payload;
      const control = state.controls[qid];
      if (!control) return;
      
      // Record failed risk for telemetry
      state.telemetry.riskAttempts.push({
        questionId: qid,
        attempts: control.attemptsUsed,
        success: false,
        timestamp: new Date().toISOString(),
        bossChallengePassed: false
      });
      
      console.log(`Risk question ${qid} failed - ${missionFailType} triggered`);
    },
    
    useHint: (state, action: PayloadAction<{ qid: string; cost: number }>) => {
      const control = state.controls[action.payload.qid];
      if (!control) return;
      
      control.hintUsed = true;
      console.log(`Hint used for risk question ${action.payload.qid}, cost: ${action.payload.cost} points`);
    },
    
    useRiskInsurance: (state, action: PayloadAction<{ qid: string }>) => {
      const control = state.controls[action.payload.qid];
      if (!control) return;
      
      // Risk-Versicherung aktiviert → bei Fail kein Leben verlieren
      console.log(`Risk insurance activated for ${action.payload.qid}`);
    },
    
    useTeamBoost: (state, action: PayloadAction<{ qid: string; boostType: 'time' | 'eliminate' }>) => {
      const { qid, boostType } = action.payload;
      console.log(`Team boost (${boostType}) used for risk question ${qid}`);
    },
    
    resetRisk: (state, action: PayloadAction<{ qid?: string }>) => {
      if (action.payload.qid) {
        // Reset specific risk question
        delete state.controls[action.payload.qid];
      } else {
        // Reset all risk controls
        state.controls = {};
        state.currentCooldown = null;
        state.activeBossChallenge = null;
      }
    },
    
    // Adaptive Difficulty
    enableAdaptiveHelp: (state, action: PayloadAction<{ 
      qid: string; 
      reducedOptions?: boolean; 
      extraTimeMs?: number;
      reason: string;
    }>) => {
      const control = state.controls[action.payload.qid];
      if (!control) return;
      
      control.adaptiveHelp = {
        reducedOptions: action.payload.reducedOptions,
        extraTimeMs: action.payload.extraTimeMs,
        reason: action.payload.reason
      };
      
      console.log(`Adaptive help enabled for ${action.payload.qid}: ${action.payload.reason}`);
    }
  }
});

export const {
  initRisk,
  attemptRisk,
  failRisk,
  bossChallengePassed,
  bossChallengeFailed,
  startCooldown,
  updateCooldown,
  passRisk,
  outOfAttempts,
  useHint,
  useRiskInsurance,
  useTeamBoost,
  resetRisk,
  enableAdaptiveHelp
} = riskSlice.actions;

export default riskSlice.reducer;

// Selectors
export const selectRiskControl = (questionId: string) => (state: { risk: RiskState }) => 
  state.risk.controls[questionId];

export const selectCurrentCooldown = (state: { risk: RiskState }) => 
  state.risk.currentCooldown;

export const selectActiveBossChallenge = (state: { risk: RiskState }) => 
  state.risk.activeBossChallenge;

export const selectRiskTelemetry = (state: { risk: RiskState }) => 
  state.risk.telemetry;

// Computed selectors
export const selectCanAttemptRisk = (questionId: string) => (state: { risk: RiskState }) => {
  const control = state.risk.controls[questionId];
  if (!control) return true; // First attempt
  
  const now = Date.now();
  const inCooldown = control.lockUntil && now < control.lockUntil;
  const hasAttemptsLeft = control.attemptsUsed < control.maxAttempts;
  
  return !inCooldown && hasAttemptsLeft;
};

export const selectRiskAttemptInfo = (questionId: string) => (state: { risk: RiskState }) => {
  const control = state.risk.controls[questionId];
  if (!control) return null;
  
  const now = Date.now();
  const cooldownActive = control.lockUntil ? now < control.lockUntil : false;
  const cooldownRemainingMs = control.lockUntil ? Math.max(0, control.lockUntil - now) : 0;
  
  return {
    attemptsUsed: control.attemptsUsed,
    maxAttempts: control.maxAttempts,
    cooldownActive,
    cooldownRemainingMs,
    hintUsed: control.hintUsed,
    adaptiveHelp: control.adaptiveHelp
  };
}; 
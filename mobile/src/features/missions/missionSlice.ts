import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MissionProgress, LifeCount } from './types';

const initialMissionProgress: MissionProgress = {
  missionId: '',
  currentQuestionIndex: 1,
  lives: 3,
  points: 0,
  bonusLives: 0,
  finished: false,
  success: false,
  startedAt: undefined,
  finishedAt: undefined,
  answeredQuestions: [],
  completedChallenges: [],
  currentStreak: 0
};

interface MissionState {
  currentMission: MissionProgress | null;
  isLoading: boolean;
  error: string | null;
  showingChallenge: string | null;
  bonusGameAvailable: boolean;
}

const initialState: MissionState = {
  currentMission: null,
  isLoading: false,
  error: null,
  showingChallenge: null,
  bonusGameAvailable: false
};

const missionSlice = createSlice({
  name: 'mission',
  initialState,
  reducers: {
    startMission: (state, action: PayloadAction<{ missionId: string; lives?: LifeCount }>) => {
      const { missionId, lives = 3 } = action.payload;
      state.currentMission = {
        ...initialMissionProgress,
        missionId,
        lives,
        startedAt: new Date().toISOString()
      };
      state.isLoading = false;
      state.error = null;
      state.showingChallenge = null;
      state.bonusGameAvailable = false;
    },
    
    correctAnswer: (state, action: PayloadAction<{ questionId: string; points: number }>) => {
      if (!state.currentMission) return;
      
      const { questionId, points } = action.payload;
      state.currentMission.points += points;
      state.currentMission.currentQuestionIndex += 1;
      state.currentMission.answeredQuestions.push(questionId);
      state.currentMission.currentStreak += 1;
      
      // Check if mission completed (question 10)
      if (state.currentMission.currentQuestionIndex > 10) {
        state.currentMission.finished = true;
        state.currentMission.success = true;
        state.currentMission.finishedAt = new Date().toISOString();
        state.bonusGameAvailable = true;
      }
    },
    
    wrongAnswer: (state, action: PayloadAction<{ questionId: string; challengeId?: string }>) => {
      if (!state.currentMission) return;
      
      const { questionId, challengeId } = action.payload;
      state.currentMission.answeredQuestions.push(questionId);
      state.currentMission.currentStreak = 0; // Reset streak on wrong answer
      
      if (challengeId) {
        state.showingChallenge = challengeId;
      } else {
        // No challenge available, lose life directly
        missionSlice.caseReducers.loseLife(state, { type: 'mission/loseLife', payload: undefined });
      }
    },
    
    challengeCompleted: (state, action: PayloadAction<{ challengeId: string; success: boolean }>) => {
      if (!state.currentMission) return;
      
      const { challengeId, success } = action.payload;
      state.currentMission.completedChallenges.push(challengeId);
      state.showingChallenge = null;
      
      if (!success) {
        missionSlice.caseReducers.loseLife(state, { type: 'mission/loseLife', payload: undefined });
      }
      // If successful, just continue to next question (no life lost)
    },
    
    loseLife: (state) => {
      if (!state.currentMission) return;
      
      state.currentMission.lives = Math.max(0, state.currentMission.lives - 1) as LifeCount;
      
      // Check if mission failed
      if (state.currentMission.lives === 0) {
        state.currentMission.finished = true;
        state.currentMission.success = false;
        state.currentMission.finishedAt = new Date().toISOString();
        state.bonusGameAvailable = false;
      }
    },
    
    gainLife: (state, action: PayloadAction<{ amount?: number }>) => {
      if (!state.currentMission) return;
      
      const amount = action.payload?.amount || 1;
      const totalLives = state.currentMission.lives + state.currentMission.bonusLives;
      const newTotal = Math.min(5, totalLives + amount);
      
      // Distribute between regular and bonus lives
      if (newTotal <= 3) {
        state.currentMission.lives = newTotal as LifeCount;
      } else {
        state.currentMission.lives = 3;
        state.currentMission.bonusLives = (newTotal - 3) as LifeCount;
      }
    },
    
    bonusGameCompleted: (state, action: PayloadAction<{ success: boolean; bonusPoints: number }>) => {
      if (!state.currentMission) return;
      
      const { success, bonusPoints } = action.payload;
      state.bonusGameAvailable = false;
      
      if (success) {
        state.currentMission.points += bonusPoints;
        // Gain 1 life from bonus game
        missionSlice.caseReducers.gainLife(state, { 
          type: 'mission/gainLife', 
          payload: { amount: 1 } 
        });
      }
    },
    
    finishMission: (state, action: PayloadAction<{ success: boolean; bonus?: number }>) => {
      if (!state.currentMission) return;
      
      const { success, bonus } = action.payload;
      state.currentMission.finished = true;
      state.currentMission.success = success;
      state.currentMission.finishedAt = new Date().toISOString();
      
      if (bonus) {
        state.currentMission.points += bonus;
      }
      
      if (success) {
        state.bonusGameAvailable = true;
      }
    },
    
    resetMission: (state) => {
      state.currentMission = null;
      state.isLoading = false;
      state.error = null;
      state.showingChallenge = null;
      state.bonusGameAvailable = false;
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    
    dismissChallenge: (state) => {
      state.showingChallenge = null;
    },
    
    addBonusPoints: (state, action: PayloadAction<{ points: number; reason: string }>) => {
      if (!state.currentMission) return;
      
      const { points } = action.payload;
      state.currentMission.points += points;
    }
  }
});

export const {
  startMission,
  correctAnswer,
  wrongAnswer,
  challengeCompleted,
  loseLife,
  gainLife,
  bonusGameCompleted,
  finishMission,
  resetMission,
  setLoading,
  setError,
  dismissChallenge,
  addBonusPoints
} = missionSlice.actions;

export default missionSlice.reducer;

// Selectors
export const selectCurrentMission = (state: { mission: MissionState }) => state.mission.currentMission;
export const selectIsLoading = (state: { mission: MissionState }) => state.mission.isLoading;
export const selectError = (state: { mission: MissionState }) => state.mission.error;
export const selectShowingChallenge = (state: { mission: MissionState }) => state.mission.showingChallenge;
export const selectBonusGameAvailable = (state: { mission: MissionState }) => state.mission.bonusGameAvailable;

// Computed selectors
export const selectTotalLives = (state: { mission: MissionState }) => {
  const mission = state.mission.currentMission;
  if (!mission) return 0;
  return mission.lives + mission.bonusLives;
};

export const selectMissionProgress = (state: { mission: MissionState }) => {
  const mission = state.mission.currentMission;
  if (!mission) return 0;
  return (mission.currentQuestionIndex - 1) / 10 * 100;
};

export const selectCanContinue = (state: { mission: MissionState }) => {
  const mission = state.mission.currentMission;
  if (!mission) return false;
  return mission.lives > 0 && !mission.finished;
}; 
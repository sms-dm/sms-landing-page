import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { OnboardingSession, OnboardingToken, Vessel } from '@/types';
import { onboardingService } from '@/services/onboarding';

interface OnboardingState {
  activeSession: OnboardingSession | null;
  activeToken: OnboardingToken | null;
  activeVessel: Vessel | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: OnboardingState = {
  activeSession: null,
  activeToken: null,
  activeVessel: null,
  isLoading: false,
  error: null,
};

export const startOnboardingSession = createAsyncThunk(
  'onboarding/startSession',
  async (token: string) => {
    const response = await onboardingService.validateTokenAndStart(token);
    return response;
  }
);

export const updateSessionProgress = createAsyncThunk(
  'onboarding/updateProgress',
  async ({ sessionId, progress }: { sessionId: string; progress: any }) => {
    const response = await onboardingService.updateProgress(sessionId, progress);
    return response;
  }
);

export const completeSession = createAsyncThunk(
  'onboarding/completeSession',
  async (sessionId: string) => {
    const response = await onboardingService.completeSession(sessionId);
    return response;
  }
);

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateActiveSession: (state, action: PayloadAction<Partial<OnboardingSession>>) => {
      if (state.activeSession) {
        state.activeSession = { ...state.activeSession, ...action.payload };
      }
    },
    clearSession: (state) => {
      state.activeSession = null;
      state.activeToken = null;
      state.activeVessel = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Start session
    builder
      .addCase(startOnboardingSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startOnboardingSession.fulfilled, (state, action) => {
        state.activeSession = action.payload.session;
        state.activeToken = action.payload.token;
        state.activeVessel = action.payload.vessel;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(startOnboardingSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to start onboarding session';
      });
    
    // Update progress
    builder
      .addCase(updateSessionProgress.fulfilled, (state, action) => {
        if (state.activeSession) {
          state.activeSession.progress = action.payload.progress;
          state.activeSession.lastActivityAt = new Date();
        }
      });
    
    // Complete session
    builder
      .addCase(completeSession.fulfilled, (state) => {
        if (state.activeSession) {
          state.activeSession.completedAt = new Date();
        }
      });
  },
});

export const { clearError, updateActiveSession, clearSession } = onboardingSlice.actions;
export default onboardingSlice.reducer;
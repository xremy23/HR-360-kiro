import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@types/index';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  verificationSent: boolean;
  orgJoined: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  verificationSent: false,
  orgJoined: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setVerificationSent: (state, action: PayloadAction<boolean>) => {
      state.verificationSent = action.payload;
    },
    setOrgJoined: (state, action: PayloadAction<boolean>) => {
      state.orgJoined = action.payload;
    },
    setAuthSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
      state.isLoading = false;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.verificationSent = false;
      state.orgJoined = false;
    },
    restoreSession: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    }
  }
});

export const {
  setLoading,
  setError,
  setVerificationSent,
  setOrgJoined,
  setAuthSuccess,
  updateUser,
  logout,
  restoreSession
} = authSlice.actions;

export default authSlice.reducer;

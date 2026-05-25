import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CheckIn, CheckInHistory } from '@types/index';

interface CheckInState {
  currentCheckIn: CheckIn | null;
  history: CheckInHistory[];
  teamCheckIns: { [userId: string]: CheckIn };
  isLoading: boolean;
  error: string | null;
  lastCheckInTime: string | null;
}

const initialState: CheckInState = {
  currentCheckIn: null,
  history: [],
  teamCheckIns: {},
  isLoading: false,
  error: null,
  lastCheckInTime: null
};

const checkinSlice = createSlice({
  name: 'checkin',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setCurrentCheckIn: (state, action: PayloadAction<CheckIn>) => {
      state.currentCheckIn = action.payload;
      state.lastCheckInTime = action.payload.timestamp;
      state.error = null;
    },
    setHistory: (state, action: PayloadAction<CheckInHistory[]>) => {
      state.history = action.payload;
    },
    addToHistory: (state, action: PayloadAction<CheckInHistory>) => {
      state.history.unshift(action.payload);
    },
    setTeamCheckIns: (state, action: PayloadAction<{ [userId: string]: CheckIn }>) => {
      state.teamCheckIns = action.payload;
    },
    updateTeamCheckIn: (state, action: PayloadAction<{ userId: string; checkIn: CheckIn }>) => {
      state.teamCheckIns[action.payload.userId] = action.payload.checkIn;
    },
    clearCheckInData: (state) => {
      state.currentCheckIn = null;
      state.history = [];
      state.teamCheckIns = {};
      state.lastCheckInTime = null;
    }
  }
});

export const {
  setLoading,
  setError,
  setCurrentCheckIn,
  setHistory,
  addToHistory,
  setTeamCheckIns,
  updateTeamCheckIn,
  clearCheckInData
} = checkinSlice.actions;

export default checkinSlice.reducer;

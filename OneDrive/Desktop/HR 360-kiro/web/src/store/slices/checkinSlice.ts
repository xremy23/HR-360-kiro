import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CheckIn {
  id: string;
  userId: string;
  status: 'safe' | 'injured' | 'missing' | 'unknown';
  location?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
  timestamp: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

interface CheckInState {
  checkIns: CheckIn[];
  lastCheckIn: CheckIn | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CheckInState = {
  checkIns: [],
  lastCheckIn: null,
  isLoading: false,
  error: null,
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
    setCheckIns: (state, action: PayloadAction<CheckIn[]>) => {
      state.checkIns = action.payload;
    },
    addCheckIn: (state, action: PayloadAction<CheckIn>) => {
      state.checkIns.push(action.payload);
      state.lastCheckIn = action.payload;
    },
    updateCheckInSyncStatus: (
      state,
      action: PayloadAction<{ id: string; syncStatus: 'pending' | 'synced' | 'failed' }>
    ) => {
      const checkIn = state.checkIns.find((c) => c.id === action.payload.id);
      if (checkIn) {
        checkIn.syncStatus = action.payload.syncStatus;
      }
    },
  },
});

export const {
  setLoading,
  setError,
  setCheckIns,
  addCheckIn,
  updateCheckInSyncStatus,
} = checkinSlice.actions;
export default checkinSlice.reducer;

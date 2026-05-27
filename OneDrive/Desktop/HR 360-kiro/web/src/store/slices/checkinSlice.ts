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
  items: CheckIn[];
  checkIns: CheckIn[];
  lastCheckIn: CheckIn | null;
  loading: boolean;
  error: string | null;
}

const initialState: CheckInState = {
  items: [],
  checkIns: [],
  lastCheckIn: null,
  loading: false,
  error: null,
};

const checkinSlice = createSlice({
  name: 'checkin',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setItems: (state, action: PayloadAction<CheckIn[]>) => {
      state.items = action.payload;
      state.checkIns = action.payload;
      state.loading = false;
      state.error = null;
    },
    setCheckIns: (state, action: PayloadAction<CheckIn[]>) => {
      state.checkIns = action.payload;
      state.items = action.payload;
    },
    addCheckIn: (state, action: PayloadAction<CheckIn>) => {
      state.checkIns.push(action.payload);
      state.items.push(action.payload);
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
      const itemCheckIn = state.items.find((c) => c.id === action.payload.id);
      if (itemCheckIn) {
        itemCheckIn.syncStatus = action.payload.syncStatus;
      }
    },
  },
});

export const {
  setLoading,
  setError,
  setItems,
  setCheckIns,
  addCheckIn,
  updateCheckInSyncStatus,
} = checkinSlice.actions;
export default checkinSlice.reducer;

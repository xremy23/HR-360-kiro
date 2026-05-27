import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Incident {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  startTime: string;
  endTime?: string;
  isDrill: boolean;
  status: 'active' | 'resolved';
  description?: string;
  createdAt: string;
}

interface IncidentState {
  items: Incident[];
  incidents: Incident[];
  activeIncidents: Incident[];
  loading: boolean;
  error: string | null;
}

const initialState: IncidentState = {
  items: [],
  incidents: [],
  activeIncidents: [],
  loading: false,
  error: null,
};

const incidentSlice = createSlice({
  name: 'incident',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setItems: (state, action: PayloadAction<Incident[]>) => {
      state.items = action.payload;
      state.incidents = action.payload;
      state.activeIncidents = action.payload.filter((i) => i.status === 'active');
      state.loading = false;
      state.error = null;
    },
    setIncidents: (state, action: PayloadAction<Incident[]>) => {
      state.incidents = action.payload;
      state.items = action.payload;
      state.activeIncidents = action.payload.filter((i) => i.status === 'active');
    },
    addIncident: (state, action: PayloadAction<Incident>) => {
      state.incidents.push(action.payload);
      state.items.push(action.payload);
      if (action.payload.status === 'active') {
        state.activeIncidents.push(action.payload);
      }
    },
    updateIncident: (state, action: PayloadAction<Incident>) => {
      const index = state.incidents.findIndex((i) => i.id === action.payload.id);
      if (index !== -1) {
        state.incidents[index] = action.payload;
        state.items[index] = action.payload;
        // Update active incidents
        state.activeIncidents = state.incidents.filter((i) => i.status === 'active');
      }
    },
    deleteIncident: (state, action: PayloadAction<string>) => {
      state.incidents = state.incidents.filter((i) => i.id !== action.payload);
      state.items = state.items.filter((i) => i.id !== action.payload);
      state.activeIncidents = state.activeIncidents.filter((i) => i.id !== action.payload);
    },
  },
});

export const {
  setLoading,
  setError,
  setItems,
  setIncidents,
  addIncident,
  updateIncident,
  deleteIncident,
} = incidentSlice.actions;
export default incidentSlice.reducer;

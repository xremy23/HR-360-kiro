import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CommunityReport {
  id: string;
  title: string;
  description: string;
  category: 'natural_disaster' | 'hazard' | 'safety_concern' | 'infrastructure' | 'other';
  severity: 'low' | 'medium' | 'high';
  location?: { latitude: number; longitude: number; address?: string };
  imageUrls?: string[];
  status: 'active' | 'resolved' | 'archived';
  upvotes: number;
  upvotedBy?: string[];
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  userId: string;
  userName?: string;
}

interface CommunityReportState {
  items: CommunityReport[];
  reports: CommunityReport[];
  loading: boolean;
  error: string | null;
  filter: {
    severity: 'all' | 'low' | 'medium' | 'high';
    category: string;
  };
}

const initialState: CommunityReportState = {
  items: [],
  reports: [],
  loading: false,
  error: null,
  filter: {
    severity: 'all',
    category: 'all',
  },
};

const communityReportSlice = createSlice({
  name: 'communityReport',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setReports: (state, action: PayloadAction<CommunityReport[]>) => {
      state.reports = action.payload;
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    setItems: (state, action: PayloadAction<CommunityReport[]>) => {
      state.items = action.payload;
      state.reports = action.payload;
    },
    addReport: (state, action: PayloadAction<CommunityReport>) => {
      state.reports.push(action.payload);
      state.items.push(action.payload);
    },
    updateReport: (state, action: PayloadAction<CommunityReport>) => {
      const index = state.reports.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.reports[index] = action.payload;
        state.items[index] = action.payload;
      }
    },
    deleteReport: (state, action: PayloadAction<string>) => {
      state.reports = state.reports.filter((r) => r.id !== action.payload);
      state.items = state.items.filter((r) => r.id !== action.payload);
    },
    upvoteReport: (state, action: PayloadAction<{ reportId: string; userId: string }>) => {
      const report = state.reports.find((r) => r.id === action.payload.reportId);
      if (report) {
        if (!report.upvotedBy?.includes(action.payload.userId)) {
          report.upvotes += 1;
          if (!report.upvotedBy) {
            report.upvotedBy = [];
          }
          report.upvotedBy.push(action.payload.userId);
        }
      }
    },
    removeUpvote: (state, action: PayloadAction<{ reportId: string; userId: string }>) => {
      const report = state.reports.find((r) => r.id === action.payload.reportId);
      if (report && report.upvotedBy?.includes(action.payload.userId)) {
        report.upvotes -= 1;
        report.upvotedBy = report.upvotedBy.filter((uid) => uid !== action.payload.userId);
      }
    },
    setSeverityFilter: (state, action: PayloadAction<'all' | 'low' | 'medium' | 'high'>) => {
      state.filter.severity = action.payload;
    },
    setCategoryFilter: (state, action: PayloadAction<string>) => {
      state.filter.category = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  setReports,
  setItems,
  addReport,
  updateReport,
  deleteReport,
  upvoteReport,
  removeUpvote,
  setSeverityFilter,
  setCategoryFilter,
} = communityReportSlice.actions;

export default communityReportSlice.reducer;

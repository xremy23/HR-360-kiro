import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface KBGuide {
  id: string | number;
  title: string;
  content: string;
  category: string;
  description?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  author?: string;
}

interface KBState {
  guides: KBGuide[];
  selectedGuide: KBGuide | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
}

const initialState: KBState = {
  guides: [],
  selectedGuide: null,
  isLoading: false,
  error: null,
  searchQuery: '',
};

const kbSlice = createSlice({
  name: 'kb',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setGuides: (state, action: PayloadAction<KBGuide[]>) => {
      state.guides = action.payload;
    },
    addGuide: (state, action: PayloadAction<KBGuide>) => {
      state.guides.push(action.payload);
    },
    updateGuide: (state, action: PayloadAction<KBGuide>) => {
      const index = state.guides.findIndex((g) => g.id === action.payload.id);
      if (index !== -1) {
        state.guides[index] = action.payload;
      }
    },
    deleteGuide: (state, action: PayloadAction<string | number>) => {
      state.guides = state.guides.filter((g) => g.id !== action.payload);
    },
    selectGuide: (state, action: PayloadAction<KBGuide | null>) => {
      state.selectedGuide = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  setGuides,
  addGuide,
  updateGuide,
  deleteGuide,
  selectGuide,
  setSearchQuery,
} = kbSlice.actions;
export default kbSlice.reducer;

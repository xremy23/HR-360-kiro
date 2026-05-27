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
  items: KBGuide[];
  guides: KBGuide[];
  selectedGuide: KBGuide | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
}

const initialState: KBState = {
  items: [],
  guides: [],
  selectedGuide: null,
  loading: false,
  error: null,
  searchQuery: '',
};

const kbSlice = createSlice({
  name: 'kb',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setItems: (state, action: PayloadAction<KBGuide[]>) => {
      state.items = action.payload;
      state.guides = action.payload;
      state.loading = false;
      state.error = null;
    },
    setGuides: (state, action: PayloadAction<KBGuide[]>) => {
      state.guides = action.payload;
      state.items = action.payload;
    },
    addGuide: (state, action: PayloadAction<KBGuide>) => {
      state.guides.push(action.payload);
      state.items.push(action.payload);
    },
    updateGuide: (state, action: PayloadAction<KBGuide>) => {
      const index = state.guides.findIndex((g) => g.id === action.payload.id);
      if (index !== -1) {
        state.guides[index] = action.payload;
        state.items[index] = action.payload;
      }
    },
    deleteGuide: (state, action: PayloadAction<string | number>) => {
      state.guides = state.guides.filter((g) => g.id !== action.payload);
      state.items = state.items.filter((g) => g.id !== action.payload);
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
  setItems,
  setGuides,
  addGuide,
  updateGuide,
  deleteGuide,
  selectGuide,
  setSearchQuery,
} = kbSlice.actions;
export default kbSlice.reducer;

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { KBGuide } from '@types/index';

interface KBState {
  guides: KBGuide[];
  selectedGuide: KBGuide | null;
  filteredGuides: KBGuide[];
  searchQuery: string;
  selectedCategory: string | null;
  isLoading: boolean;
  error: string | null;
  acknowledgedGuideIds: string[];
}

const initialState: KBState = {
  guides: [],
  selectedGuide: null,
  filteredGuides: [],
  searchQuery: '',
  selectedCategory: null,
  isLoading: false,
  error: null,
  acknowledgedGuideIds: []
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
      state.filteredGuides = action.payload;
    },
    addGuide: (state, action: PayloadAction<KBGuide>) => {
      state.guides.push(action.payload);
      state.filteredGuides.push(action.payload);
    },
    updateGuide: (state, action: PayloadAction<KBGuide>) => {
      const index = state.guides.findIndex(g => g.id === action.payload.id);
      if (index !== -1) {
        state.guides[index] = action.payload;
      }
      state.filteredGuides = state.guides.filter(g => {
        let matches = true;
        if (state.searchQuery) {
          matches = g.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                   g.content.toLowerCase().includes(state.searchQuery.toLowerCase());
        }
        if (state.selectedCategory) {
          matches = matches && g.category === state.selectedCategory;
        }
        return matches;
      });
    },
    deleteGuide: (state, action: PayloadAction<string>) => {
      state.guides = state.guides.filter(g => g.id !== action.payload);
      state.filteredGuides = state.filteredGuides.filter(g => g.id !== action.payload);
    },
    setSelectedGuide: (state, action: PayloadAction<KBGuide | null>) => {
      state.selectedGuide = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.filteredGuides = state.guides.filter(g => {
        let matches = true;
        if (action.payload) {
          matches = g.title.toLowerCase().includes(action.payload.toLowerCase()) ||
                   g.content.toLowerCase().includes(action.payload.toLowerCase());
        }
        if (state.selectedCategory) {
          matches = matches && g.category === state.selectedCategory;
        }
        return matches;
      });
    },
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
      state.filteredGuides = state.guides.filter(g => {
        let matches = true;
        if (state.searchQuery) {
          matches = g.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                   g.content.toLowerCase().includes(state.searchQuery.toLowerCase());
        }
        if (action.payload) {
          matches = matches && g.category === action.payload;
        }
        return matches;
      });
    },
    addAcknowledgedGuide: (state, action: PayloadAction<string>) => {
      if (!state.acknowledgedGuideIds.includes(action.payload)) {
        state.acknowledgedGuideIds.push(action.payload);
      }
    },
    setAcknowledgedGuides: (state, action: PayloadAction<string[]>) => {
      state.acknowledgedGuideIds = action.payload;
    }
  }
});

export const {
  setLoading,
  setError,
  setGuides,
  addGuide,
  updateGuide,
  deleteGuide,
  setSelectedGuide,
  setSearchQuery,
  setSelectedCategory,
  addAcknowledgedGuide,
  setAcknowledgedGuides
} = kbSlice.actions;

export default kbSlice.reducer;

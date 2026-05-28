import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'hr' | 'manager' | 'employee';
  orgId: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UserState {
  items: User[];
  selectedUser: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  items: [],
  selectedUser: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setItems: (state, action: PayloadAction<User[]>) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    addUser: (state, action: PayloadAction<User>) => {
      state.items.push(action.payload);
    },
    updateUser: (state, action: PayloadAction<User>) => {
      const index = state.items.findIndex((u) => u.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteUser: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((u) => u.id !== action.payload);
    },
    selectUser: (state, action: PayloadAction<User | null>) => {
      state.selectedUser = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  setItems,
  addUser,
  updateUser,
  deleteUser,
  selectUser,
} = userSlice.actions;
export default userSlice.reducer;

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SyncError {
  itemId: string;
  entityType: string;
  error: string;
  timestamp: Date;
  retryCount: number;
}

export interface ConflictedItem {
  itemId: string;
  entityType: string;
  localData: any;
  serverData: any;
}

export interface OfflineState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingSyncCount: number;
  syncErrors: SyncError[];
  conflictedItems: ConflictedItem[];
  dataFreshness: {
    [entityType: string]: Date | null;
  };
  offlineMode: {
    enabled: boolean;
    cacheSize: number; // in MB
    maxCacheAge: number; // in milliseconds
  };
}

const initialState: OfflineState = {
  isOnline: true,
  isSyncing: false,
  lastSyncTime: null,
  pendingSyncCount: 0,
  syncErrors: [],
  conflictedItems: [],
  dataFreshness: {
    kb_guides: null,
    alerts: null,
    check_ins: null,
    contacts: null,
    tobag_items: null,
    incidents: null,
  },
  offlineMode: {
    enabled: true,
    cacheSize: 50, // 50 MB
    maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    /**
     * Set online/offline status
     */
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },

    /**
     * Set syncing status
     */
    setSyncingStatus: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },

    /**
     * Update last sync time
     */
    setLastSyncTime: (state, action: PayloadAction<Date>) => {
      state.lastSyncTime = action.payload;
    },

    /**
     * Update pending sync count
     */
    setPendingSyncCount: (state, action: PayloadAction<number>) => {
      state.pendingSyncCount = action.payload;
    },

    /**
     * Add sync error
     */
    addSyncError: (state, action: PayloadAction<SyncError>) => {
      const existingIndex = state.syncErrors.findIndex(
        e => e.itemId === action.payload.itemId
      );
      if (existingIndex >= 0) {
        state.syncErrors[existingIndex] = action.payload;
      } else {
        state.syncErrors.push(action.payload);
      }
    },

    /**
     * Remove sync error
     */
    removeSyncError: (state, action: PayloadAction<string>) => {
      state.syncErrors = state.syncErrors.filter(e => e.itemId !== action.payload);
    },

    /**
     * Clear all sync errors
     */
    clearSyncErrors: (state) => {
      state.syncErrors = [];
    },

    /**
     * Add conflicted item
     */
    addConflictedItem: (state, action: PayloadAction<ConflictedItem>) => {
      const existingIndex = state.conflictedItems.findIndex(
        c => c.itemId === action.payload.itemId
      );
      if (existingIndex >= 0) {
        state.conflictedItems[existingIndex] = action.payload;
      } else {
        state.conflictedItems.push(action.payload);
      }
    },

    /**
     * Remove conflicted item
     */
    removeConflictedItem: (state, action: PayloadAction<string>) => {
      state.conflictedItems = state.conflictedItems.filter(
        c => c.itemId !== action.payload
      );
    },

    /**
     * Clear all conflicted items
     */
    clearConflictedItems: (state) => {
      state.conflictedItems = [];
    },

    /**
     * Update data freshness for entity type
     */
    updateDataFreshness: (
      state,
      action: PayloadAction<{ entityType: string; timestamp: Date }>
    ) => {
      state.dataFreshness[action.payload.entityType] = action.payload.timestamp;
    },

    /**
     * Check if data is fresh
     */
    isDataFresh: (
      state,
      action: PayloadAction<{ entityType: string; maxAge: number }>
    ) => {
      const freshness = state.dataFreshness[action.payload.entityType];
      if (!freshness) return false;

      const age = Date.now() - freshness.getTime();
      return age < action.payload.maxAge;
    },

    /**
     * Update offline mode settings
     */
    updateOfflineSettings: (
      state,
      action: PayloadAction<Partial<typeof initialState.offlineMode>>
    ) => {
      state.offlineMode = { ...state.offlineMode, ...action.payload };
    },

    /**
     * Reset offline state
     */
    resetOfflineState: () => initialState,
  },
});

export const {
  setOnlineStatus,
  setSyncingStatus,
  setLastSyncTime,
  setPendingSyncCount,
  addSyncError,
  removeSyncError,
  clearSyncErrors,
  addConflictedItem,
  removeConflictedItem,
  clearConflictedItems,
  updateDataFreshness,
  isDataFresh,
  updateOfflineSettings,
  resetOfflineState,
} = offlineSlice.actions;

export default offlineSlice.reducer;

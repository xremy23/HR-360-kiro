/**
 * useOfflineSync Hook
 * React hook for managing offline sync functionality
 */

import { useEffect, useState, useCallback } from 'react';
import { offlineSyncService, SyncStatus } from '../services/offlineSyncService';

export interface UseOfflineSyncReturn {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  syncStatus: SyncStatus | null;
  queueOperation: (
    type: 'create' | 'update' | 'delete',
    resource: any,
    endpoint: string,
    data?: any
  ) => Promise<string>;
  syncNow: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
}

/**
 * Hook for offline sync functionality
 */
export function useOfflineSync(): UseOfflineSyncReturn {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  // Initialize sync service on mount
  useEffect(() => {
    const initializeSync = async () => {
      try {
        await offlineSyncService.initialize();
        const status = await offlineSyncService.getSyncStatus();
        setSyncStatus(status);
      } catch (error) {
        console.error('Failed to initialize offline sync:', error);
      }
    };

    initializeSync();

    // Subscribe to status changes
    const unsubscribe = offlineSyncService.onStatusChange((status) => {
      setSyncStatus(status);
    });

    // Cleanup
    return () => {
      unsubscribe();
      offlineSyncService.stopSyncLoop();
    };
  }, []);

  // Queue operation
  const queueOperation = useCallback(
    async (
      type: 'create' | 'update' | 'delete',
      resource: any,
      endpoint: string,
      data?: any
    ): Promise<string> => {
      return offlineSyncService.queueOperation(type, resource, endpoint, data);
    },
    []
  );

  // Sync now
  const syncNow = useCallback(async () => {
    await offlineSyncService.syncPendingOperations();
  }, []);

  // Clear offline data
  const clearOfflineData = useCallback(async () => {
    await offlineSyncService.clearOfflineData();
  }, []);

  return {
    isOnline: syncStatus?.isOnline ?? navigator.onLine,
    isSyncing: syncStatus?.isSyncing ?? false,
    pendingCount: syncStatus?.pendingCount ?? 0,
    syncStatus,
    queueOperation,
    syncNow,
    clearOfflineData,
  };
}

export default useOfflineSync;

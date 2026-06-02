/**
 * Offline Sync Service
 * Handles offline-first synchronization of data
 * Queues operations when offline and syncs when online
 */

import { apiService, ApiError } from './apiService';
import { indexedDBService } from './indexedDBService';

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: 'alert' | 'checkin' | 'incident' | 'contact' | 'tobag' | 'profile';
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  data?: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retries: number;
  maxRetries: number;
  error?: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime?: number;
  syncErrors: string[];
}

class OfflineSyncService {
  private isOnline = navigator.onLine;
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private statusListeners: ((status: SyncStatus) => void)[] = [];
  private readonly SYNC_INTERVAL = 5000; // 5 seconds
  private readonly MAX_RETRIES = 3;

  constructor() {
    this.setupOnlineOfflineListeners();
  }

  /**
   * Initialize the sync service
   */
  async initialize(): Promise<void> {
    await indexedDBService.initialize();
    this.startSyncLoop();
  }

  /**
   * Setup online/offline event listeners
   */
  private setupOnlineOfflineListeners(): void {
    window.addEventListener('online', () => {
      console.log('🟢 Online detected');
      this.isOnline = true;
      this.notifyStatusChange();
      this.syncPendingOperations();
    });

    window.addEventListener('offline', () => {
      console.log('🔴 Offline detected');
      this.isOnline = false;
      this.notifyStatusChange();
    });
  }

  /**
   * Start the sync loop
   */
  private startSyncLoop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncPendingOperations();
      }
    }, this.SYNC_INTERVAL);
  }

  /**
   * Stop the sync loop
   */
  stopSyncLoop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Queue an operation for sync
   */
  async queueOperation(
    type: 'create' | 'update' | 'delete',
    resource: SyncOperation['resource'],
    endpoint: string,
    data?: any
  ): Promise<string> {
    const method = type === 'delete' ? 'DELETE' : type === 'create' ? 'POST' : 'PUT';

    const operation: SyncOperation = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      resource,
      endpoint,
      method,
      data,
      timestamp: Date.now(),
      status: 'pending',
      retries: 0,
      maxRetries: this.MAX_RETRIES,
    };

    await indexedDBService.addPendingOperation({
      url: endpoint,
      method,
      headers: {},
      body: data,
    });

    console.log(`📝 Queued ${type} operation for ${resource}:`, operation.id);
    this.notifyStatusChange();

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncPendingOperations();
    }

    return operation.id;
  }

  /**
   * Sync all pending operations
   */
  async syncPendingOperations(): Promise<void> {
    if (this.isSyncing || !this.isOnline) {
      return;
    }

    this.isSyncing = true;
    this.notifyStatusChange();

    try {
      const pendingOps = await indexedDBService.getPendingOperations();

      if (pendingOps.length === 0) {
        console.log('✅ No pending operations to sync');
        this.isSyncing = false;
        this.notifyStatusChange();
        return;
      }

      console.log(`🔄 Syncing ${pendingOps.length} pending operations...`);

      for (const op of pendingOps) {
        try {
          await this.syncOperation(op);
          await indexedDBService.removePendingOperation(op.id);
          console.log(`✅ Synced operation: ${op.id}`);
        } catch (error) {
          console.error(`❌ Failed to sync operation ${op.id}:`, error);
          // Continue with next operation
        }
      }

      console.log('✅ Sync complete');
    } catch (error) {
      console.error('❌ Sync failed:', error);
    } finally {
      this.isSyncing = false;
      this.notifyStatusChange();
    }
  }

  /**
   * Sync a single operation
   */
  private async syncOperation(op: any): Promise<void> {
    try {
      const method = op.method.toLowerCase();

      if (method === 'get') {
        await apiService.get(op.url);
      } else if (method === 'post') {
        await apiService.post(op.url, op.body);
      } else if (method === 'put') {
        await apiService.put(op.url, op.body);
      } else if (method === 'delete') {
        await apiService.delete(op.url);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        // Don't retry on 4xx errors (client errors)
        if (error.statusCode >= 400 && error.statusCode < 500) {
          throw error;
        }
      }
      throw error;
    }
  }

  /**
   * Get current sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const pendingOps = await indexedDBService.getPendingOperations();

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: pendingOps.length,
      lastSyncTime: undefined,
      syncErrors: [],
    };
  }

  /**
   * Subscribe to sync status changes
   */
  onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.statusListeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of status change
   */
  private async notifyStatusChange(): Promise<void> {
    const status = await this.getSyncStatus();
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in sync status listener:', error);
      }
    });
  }

  /**
   * Cache data for offline access
   */
  async cacheData(key: string, data: any, ttl?: number): Promise<void> {
    await indexedDBService.setCachedData(key, data, ttl);
  }

  /**
   * Get cached data
   */
  async getCachedData(key: string): Promise<any | null> {
    return indexedDBService.getCachedData(key);
  }

  /**
   * Clear all offline data
   */
  async clearOfflineData(): Promise<void> {
    await indexedDBService.clearAll();
    console.log('🗑️ Cleared all offline data');
  }

  /**
   * Get online status
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Get sync status
   */
  isSyncingNow(): boolean {
    return this.isSyncing;
  }
}

export const offlineSyncService = new OfflineSyncService();

export default offlineSyncService;

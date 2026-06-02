/**
 * Enhanced Sync Service - Manages offline queue syncing
 * Processes queued operations when connection is restored
 */

import axios, { AxiosError } from 'axios';
import { Store } from '@reduxjs/toolkit';
import offlineDbService, { OfflineOperation } from './offlineDbService';
import apiService from './apiService';
import {
  setSyncing,
  setQueueSize,
  setLastSyncTime,
  setSyncError,
  setStats,
} from '../store/slices/offlineSlice';

export interface SyncResult {
  successful: OfflineOperation[];
  failed: OfflineOperation[];
  retrying: OfflineOperation[];
}

class EnhancedSyncService {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private maxRetries = 5;
  private store: Store | null = null;

  /**
   * Initialize with Redux store
   */
  initialize(store: Store): void {
    this.store = store;
    console.log('[SyncService] Initialized with Redux store');
  }

  /**
   * Start sync process
   */
  async syncQueue(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('[SyncService] Sync already in progress');
      return {
        successful: [],
        failed: [],
        retrying: [],
      };
    }

    this.isSyncing = true;

    // Update Redux state
    if (this.store) {
      this.store.dispatch(setSyncing(true));
    }

    console.log('[SyncService] Starting sync process');

    try {
      const operationsForRetry = await offlineDbService.getOperationsForRetry();

      if (operationsForRetry.length === 0) {
        console.log('[SyncService] No operations to sync');
        this.isSyncing = false;

        // Update Redux state
        if (this.store) {
          this.store.dispatch(setSyncing(false));
          await this.updateReduxStats();
        }

        return {
          successful: [],
          failed: [],
          retrying: [],
        };
      }

      console.log(
        `[SyncService] Processing ${operationsForRetry.length} operations`
      );

      const result: SyncResult = {
        successful: [],
        failed: [],
        retrying: [],
      };

      // Process each operation
      for (const operation of operationsForRetry) {
        const syncResult = await this.syncOperation(operation);

        if (syncResult.success) {
          result.successful.push(operation);
        } else if (syncResult.shouldRetry) {
          result.retrying.push(operation);
        } else {
          result.failed.push(operation);
        }
      }

      // Update last sync time if any succeeded
      if (result.successful.length > 0) {
        await offlineDbService.updateLastSyncTime();
      }

      console.log('[SyncService] Sync complete', {
        successful: result.successful.length,
        failed: result.failed.length,
        retrying: result.retrying.length,
      });

      // Update Redux state
      if (this.store) {
        this.store.dispatch(setSyncing(false));
        if (result.failed.length > 0) {
          this.store.dispatch(setSyncError('Some operations failed to sync'));
        } else if (result.successful.length > 0) {
          this.store.dispatch(setSyncError(null));
          this.store.dispatch(setLastSyncTime(new Date().toISOString()));
        }
        await this.updateReduxStats();
      }

      this.isSyncing = false;
      return result;
    } catch (error) {
      console.error('[SyncService] Error during sync:', error);

      // Update Redux state with error
      if (this.store) {
        this.store.dispatch(setSyncing(false));
        this.store.dispatch(setSyncError((error as Error).message));
      }

      this.isSyncing = false;
      return {
        successful: [],
        failed: [],
        retrying: [],
      };
    }
  }

  /**
   * Sync single operation
   */
  private async syncOperation(
    operation: OfflineOperation
  ): Promise<{
    success: boolean;
    shouldRetry: boolean;
    error?: string;
  }> {
    try {
      console.log(
        `[SyncService] Syncing operation: ${operation.method} ${operation.endpoint}`
      );

      let response;

      // Execute the operation based on method
      switch (operation.method) {
        case 'POST':
          response = await apiService.post(operation.endpoint, operation.data);
          break;
        case 'PUT':
          response = await apiService.put(operation.endpoint, operation.data);
          break;
        case 'DELETE':
          response = await apiService.delete(operation.endpoint);
          break;
        default:
          throw new Error(`Unknown method: ${operation.method}`);
      }

      if (response.success) {
        // Remove from queue on success
        await offlineDbService.removeOperation(operation.id);
        console.log(
          `[SyncService] Operation successful: ${operation.id}`
        );
        return { success: true, shouldRetry: false };
      } else {
        throw new Error(response.message || 'Unknown error');
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      const shouldRetry = this.shouldRetryOperation(
        axiosError,
        operation.retryCount
      );

      if (shouldRetry) {
        // Update retry count
        await offlineDbService.updateOperation(operation.id, {
          retryCount: operation.retryCount + 1,
          lastError: (error as Error).message,
        });

        console.log(
          `[SyncService] Operation will be retried: ${operation.id} (attempt ${
            operation.retryCount + 1
          }/${this.maxRetries})`
        );

        return { success: false, shouldRetry: true };
      } else {
        // Give up on this operation
        console.error(
          `[SyncService] Operation failed permanently: ${operation.id}`,
          error
        );

        return {
          success: false,
          shouldRetry: false,
          error: (error as Error).message,
        };
      }
    }
  }

  /**
   * Determine if operation should be retried
   */
  private shouldRetryOperation(
    error: AxiosError,
    retryCount: number
  ): boolean {
    // Don't retry if max retries exceeded
    if (retryCount >= this.maxRetries) {
      console.log(
        `[SyncService] Max retries (${this.maxRetries}) exceeded`
      );
      return false;
    }

    // Retry on network errors
    if (!error.response) {
      console.log('[SyncService] Network error - will retry');
      return true;
    }

    const status = error.response.status;

    // Retry on server errors (5xx)
    if (status >= 500 && status < 600) {
      console.log(`[SyncService] Server error (${status}) - will retry`);
      return true;
    }

    // Retry on timeout (408)
    if (status === 408) {
      console.log('[SyncService] Timeout - will retry');
      return true;
    }

    // Retry on rate limiting (429)
    if (status === 429) {
      console.log('[SyncService] Rate limited - will retry');
      return true;
    }

    // Don't retry on client errors (4xx except 408, 429)
    if (status >= 400 && status < 500) {
      console.log(`[SyncService] Client error (${status}) - won't retry`);
      return false;
    }

    // Retry by default
    return true;
  }

  /**
   * Start periodic sync (every 10 seconds)
   */
  startPeriodicSync(): void {
    if (this.syncInterval) {
      console.log('[SyncService] Periodic sync already running');
      return;
    }

    console.log('[SyncService] Starting periodic sync (every 10 seconds)');

    // Sync immediately
    this.syncQueue();

    // Then sync every 10 seconds
    this.syncInterval = setInterval(() => {
      this.syncQueue();
    }, 10000);
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('[SyncService] Periodic sync stopped');
    }
  }

  /**
   * Get sync status
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Handle connection restored
   */
  async onConnectionRestored(): Promise<SyncResult> {
    console.log('[SyncService] Connection restored - starting sync');
    return this.syncQueue();
  }

  /**
   * Handle connection lost
   */
  onConnectionLost(): void {
    console.log('[SyncService] Connection lost - queuing future operations');
    // Stop periodic sync during offline
    this.stopPeriodicSync();
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<{
    size: number;
    isSyncing: boolean;
    stats: any;
  }> {
    const size = await offlineDbService.getQueueSize();
    const stats = await offlineDbService.getStats();

    return {
      size,
      isSyncing: this.isSyncing,
      stats,
    };
  }

  /**
   * Update Redux stats
   */
  private async updateReduxStats(): Promise<void> {
    if (!this.store) return;

    try {
      const stats = await offlineDbService.getStats();
      this.store.dispatch(setStats(stats));
      this.store.dispatch(setQueueSize(stats.queueSize));
    } catch (error) {
      console.error('[SyncService] Error updating Redux stats:', error);
    }
  }
}

export default new EnhancedSyncService();

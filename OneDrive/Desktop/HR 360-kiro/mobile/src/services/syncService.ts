import NetInfo from '@react-native-community/netinfo';
import { dbService } from './dbService';
import { authService } from './authService';
import { SyncQueue, CheckIn, Contact, ToBagItem } from '@types/index';

export type SyncPriority = 'critical' | 'high' | 'normal' | 'low';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingSyncCount: number;
  syncErrors: SyncError[];
}

export interface SyncError {
  itemId: string;
  entityType: string;
  error: string;
  timestamp: Date;
  retryCount: number;
}

export interface SyncConflict {
  itemId: string;
  entityType: string;
  localData: any;
  serverData: any;
  resolution: 'local' | 'server' | 'merge';
}

class SyncService {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private onSyncStatusChange: ((status: SyncStatus) => void) | null = null;
  private lastSyncTime: Date | null = null;
  private syncErrors: Map<string, SyncError> = new Map();
  private syncConflicts: Map<string, SyncConflict> = new Map();
  private isOnline = false;
  private maxRetries = 3;
  private retryDelayMs = 1000;

  async initialize(): Promise<void> {
    // Check initial network status
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected || false;
    this.handleNetworkChange(this.isOnline);

    // Listen for network changes
    NetInfo.addEventListener(state => {
      this.handleNetworkChange(state.isConnected || false);
    });
  }

  private handleNetworkChange(isOnline: boolean): void {
    this.isOnline = isOnline;

    if (isOnline && !this.isSyncing) {
      this.startSyncInterval();
    } else if (!isOnline && this.syncInterval) {
      this.stopSyncInterval();
    }

    this.notifySyncStatusChange();
  }

  private startSyncInterval(): void {
    if (this.syncInterval) return;

    // Sync immediately
    this.sync();

    // Then sync every 30 seconds
    this.syncInterval = setInterval(() => {
      this.sync();
    }, 30000);
  }

  private stopSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync with priority levels
   * Critical items sync first, then high, normal, low
   */
  async syncWithPriority(priority: SyncPriority = 'normal'): Promise<void> {
    if (this.isSyncing || !authService.isAuthenticated() || !this.isOnline) {
      return;
    }

    this.isSyncing = true;

    try {
      const pendingItems = await dbService.getPendingSyncItems();
      
      // Filter by priority
      const priorityMap: Record<SyncPriority, number> = {
        critical: 4,
        high: 3,
        normal: 2,
        low: 1,
      };

      const filteredItems = pendingItems.filter(item => {
        const itemPriority = this.getItemPriority(item.entityType);
        return priorityMap[itemPriority] >= priorityMap[priority];
      });

      // Sort by priority (critical first)
      filteredItems.sort((a, b) => {
        const priorityA = priorityMap[this.getItemPriority(a.entityType)];
        const priorityB = priorityMap[this.getItemPriority(b.entityType)];
        return priorityB - priorityA;
      });

      // Sync items with retry logic
      for (const item of filteredItems) {
        await this.syncItemWithRetry(item);
      }

      this.lastSyncTime = new Date();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.isSyncing = false;
      this.notifySyncStatusChange();
    }
  }

  /**
   * Standard sync (all priorities)
   */
  async sync(): Promise<void> {
    await this.syncWithPriority('low');
  }

  /**
   * Sync item with retry logic and exponential backoff
   */
  private async syncItemWithRetry(item: SyncQueue, retryCount: number = 0): Promise<void> {
    try {
      await this.syncItem(item);
      await dbService.markSyncItemAsSynced(item.id);
      
      // Clear error if previously failed
      this.syncErrors.delete(item.id);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      if (retryCount < this.maxRetries) {
        // Exponential backoff
        const delay = this.retryDelayMs * Math.pow(2, retryCount);
        console.warn(`Retrying sync for ${item.entityType} ${item.entityId} in ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        await this.syncItemWithRetry(item, retryCount + 1);
      } else {
        // Max retries exceeded
        console.error(`Failed to sync ${item.entityType} ${item.entityId} after ${this.maxRetries} retries:`, error);
        
        this.syncErrors.set(item.id, {
          itemId: item.id,
          entityType: item.entityType,
          error: errorMsg,
          timestamp: new Date(),
          retryCount,
        });
      }
    }
  }

  private async syncItem(item: SyncQueue): Promise<void> {
    const api = authService.getApi();

    switch (item.entityType) {
      case 'check_in':
        await api.post('/checkins', item.data);
        break;

      case 'contact':
        if (item.action === 'create') {
          await api.post('/contacts', item.data);
        } else if (item.action === 'update') {
          await api.put(`/contacts/${item.entityId}`, item.data);
        } else if (item.action === 'delete') {
          await api.delete(`/contacts/${item.entityId}`);
        }
        break;

      case 'tobag_item':
        if (item.action === 'create') {
          await api.post('/tobag', item.data);
        } else if (item.action === 'update') {
          await api.put(`/tobag/${item.entityId}`, item.data);
        } else if (item.action === 'delete') {
          await api.delete(`/tobag/${item.entityId}`);
        }
        break;

      case 'sos':
        await api.post('/sos/escalate', item.data);
        break;

      case 'alert':
        if (item.action === 'create') {
          await api.post('/alerts', item.data);
        } else if (item.action === 'update') {
          await api.put(`/alerts/${item.entityId}`, item.data);
        }
        break;

      case 'incident':
        if (item.action === 'create') {
          await api.post('/incidents', item.data);
        } else if (item.action === 'update') {
          await api.put(`/incidents/${item.entityId}`, item.data);
        }
        break;

      default:
        console.warn(`Unknown entity type: ${item.entityType}`);
    }
  }

  /**
   * Get priority for entity type
   */
  private getItemPriority(entityType: string): SyncPriority {
    const priorityMap: Record<string, SyncPriority> = {
      sos: 'critical',
      alert: 'critical',
      incident: 'high',
      check_in: 'high',
      contact: 'normal',
      tobag_item: 'low',
    };
    return priorityMap[entityType] || 'normal';
  }

  /**
   * Pull updates from server
   */
  async pullUpdates(): Promise<void> {
    if (!authService.isAuthenticated() || !this.isOnline) {
      return;
    }

    try {
      const api = authService.getApi();
      const user = authService.getUser();

      if (!user) return;

      // Pull KB guides
      const guidesResponse = await api.get(`/kb?orgId=${user.orgId}`);
      for (const guide of guidesResponse.data) {
        await dbService.saveKBGuide(guide);
      }

      // Pull alerts
      const alertsResponse = await api.get(`/alerts?orgId=${user.orgId}`);
      // Store alerts in Redux or local storage

      // Pull check-in history for team
      if (user.teamId) {
        const checkInsResponse = await api.get(`/checkins?teamId=${user.teamId}`);
        // Store in Redux for dashboard
      }

      // Update data freshness
      await dbService.updateDataFreshness('kb_guides', new Date());
      await dbService.updateDataFreshness('alerts', new Date());
      await dbService.updateDataFreshness('check_ins', new Date());
    } catch (error) {
      console.error('Error pulling updates:', error);
    }
  }

  /**
   * Get conflicted items
   */
  async getConflictedItems(): Promise<SyncConflict[]> {
    return Array.from(this.syncConflicts.values());
  }

  /**
   * Resolve conflict
   */
  async resolveConflict(itemId: string, resolution: 'local' | 'server' | 'merge'): Promise<void> {
    const conflict = this.syncConflicts.get(itemId);
    if (!conflict) return;

    if (resolution === 'local') {
      // Keep local data, retry sync
      const item = await dbService.getSyncItem(itemId);
      if (item) {
        await this.syncItemWithRetry(item);
      }
    } else if (resolution === 'server') {
      // Use server data, update local
      await dbService.updateFromServer(conflict.entityType, conflict.serverData);
    } else if (resolution === 'merge') {
      // Merge local and server data
      const merged = { ...conflict.serverData, ...conflict.localData };
      await dbService.updateFromServer(conflict.entityType, merged);
    }

    this.syncConflicts.delete(itemId);
  }

  /**
   * Get sync status
   */
  getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      pendingSyncCount: this.syncErrors.size,
      syncErrors: Array.from(this.syncErrors.values()),
    };
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  /**
   * Get pending sync count
   */
  async getPendingSyncCount(): Promise<number> {
    const items = await dbService.getPendingSyncItems();
    return items.length;
  }

  /**
   * Notify sync status change
   */
  private notifySyncStatusChange(): void {
    if (this.onSyncStatusChange) {
      this.onSyncStatusChange(this.getSyncStatus());
    }
  }

  onSyncStatusChanged(callback: (status: SyncStatus) => void): void {
    this.onSyncStatusChange = callback;
  }

  isSyncingNow(): boolean {
    return this.isSyncing;
  }

  async forceSync(): Promise<void> {
    await this.syncWithPriority('critical');
  }

  destroy(): void {
    this.stopSyncInterval();
  }
}

export const syncService = new SyncService();

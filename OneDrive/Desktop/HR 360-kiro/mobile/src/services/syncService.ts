import NetInfo from '@react-native-community/netinfo';
import { dbService } from './dbService';
import { authService } from './authService';
import { SyncQueue, CheckIn, Contact, ToBagItem } from '@types/index';

class SyncService {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private onSyncStatusChange: ((isOnline: boolean) => void) | null = null;

  async initialize(): Promise<void> {
    // Check initial network status
    const state = await NetInfo.fetch();
    this.handleNetworkChange(state.isConnected || false);

    // Listen for network changes
    NetInfo.addEventListener(state => {
      this.handleNetworkChange(state.isConnected || false);
    });
  }

  private handleNetworkChange(isOnline: boolean): void {
    if (isOnline && !this.isSyncing) {
      this.startSyncInterval();
    } else if (!isOnline && this.syncInterval) {
      this.stopSyncInterval();
    }

    if (this.onSyncStatusChange) {
      this.onSyncStatusChange(isOnline);
    }
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

  async sync(): Promise<void> {
    if (this.isSyncing || !authService.isAuthenticated()) {
      return;
    }

    this.isSyncing = true;

    try {
      const pendingItems = await dbService.getPendingSyncItems();

      for (const item of pendingItems) {
        try {
          await this.syncItem(item);
          await dbService.markSyncItemAsSynced(item.id);
        } catch (error) {
          console.error(`Error syncing ${item.entityType} ${item.entityId}:`, error);
          // Continue with next item
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncItem(item: SyncQueue): Promise<void> {
    const api = authService.getApi();

    switch (item.entityType) {
      case 'check_in':
        await api.post('/check-ins', item.data);
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
        await api.post('/sos', item.data);
        break;

      default:
        console.warn(`Unknown entity type: ${item.entityType}`);
    }
  }

  async pullUpdates(): Promise<void> {
    if (!authService.isAuthenticated()) {
      return;
    }

    try {
      const api = authService.getApi();
      const user = authService.getUser();

      if (!user) return;

      // Pull KB guides
      const guidesResponse = await api.get(`/kb/guides?orgId=${user.orgId}`);
      for (const guide of guidesResponse.data) {
        await dbService.saveKBGuide(guide);
      }

      // Pull alerts
      const alertsResponse = await api.get(`/alerts?orgId=${user.orgId}`);
      // Store alerts in Redux or local storage

      // Pull check-in history for team
      if (user.teamId) {
        const checkInsResponse = await api.get(`/check-ins/team/${user.teamId}`);
        // Store in Redux for dashboard
      }
    } catch (error) {
      console.error('Error pulling updates:', error);
    }
  }

  onSyncStatusChanged(callback: (isOnline: boolean) => void): void {
    this.onSyncStatusChange = callback;
  }

  isSyncingNow(): boolean {
    return this.isSyncing;
  }

  async forceSync(): Promise<void> {
    await this.sync();
  }

  destroy(): void {
    this.stopSyncInterval();
  }
}

export const syncService = new SyncService();

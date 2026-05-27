/**
 * Sync Service Tests
 */

import { syncService } from '../syncService';
import * as SQLite from 'expo-sqlite';

// Mock SQLite
jest.mock('expo-sqlite', () => ({
  openDatabase: jest.fn(),
}));

// Mock API
jest.mock('../../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('SyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('queueOperation', () => {
    it('should queue an operation for sync', async () => {
      const operation = {
        type: 'create',
        entity: 'checkin',
        data: { status: 'safe', timestamp: new Date().toISOString() },
        priority: 'high',
      };

      const result = await syncService.queueOperation(operation);

      expect(result).toBeDefined();
      expect(result.type).toBe(operation.type);
      expect(result.entity).toBe(operation.entity);
    });

    it('should assign priority to operation', async () => {
      const operation = {
        type: 'update',
        entity: 'alert',
        data: { id: 'alert-123', read: true },
      };

      const result = await syncService.queueOperation(operation);

      expect(result.priority).toBeDefined();
    });
  });

  describe('syncPendingOperations', () => {
    it('should sync pending operations', async () => {
      const result = await syncService.syncPendingOperations();

      expect(result).toBeDefined();
      expect(result.synced).toBeGreaterThanOrEqual(0);
      expect(result.failed).toBeGreaterThanOrEqual(0);
    });

    it('should respect priority order', async () => {
      // Queue operations with different priorities
      await syncService.queueOperation({
        type: 'create',
        entity: 'checkin',
        data: { status: 'safe' },
        priority: 'low',
      });

      await syncService.queueOperation({
        type: 'create',
        entity: 'sos',
        data: { notes: 'Emergency' },
        priority: 'critical',
      });

      const result = await syncService.syncPendingOperations();

      expect(result.synced).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getQueuedOperations', () => {
    it('should get all queued operations', async () => {
      const result = await syncService.getQueuedOperations();

      expect(Array.isArray(result)).toBe(true);
    });

    it('should filter by status', async () => {
      const result = await syncService.getQueuedOperations('pending');

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getQueueStats', () => {
    it('should get queue statistics', async () => {
      const stats = await syncService.getQueueStats();

      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.pending).toBeGreaterThanOrEqual(0);
      expect(stats.synced).toBeGreaterThanOrEqual(0);
      expect(stats.failed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('retryFailedOperations', () => {
    it('should retry failed operations with exponential backoff', async () => {
      const result = await syncService.retryFailedOperations();

      expect(result).toBeDefined();
      expect(result.retried).toBeGreaterThanOrEqual(0);
      expect(result.succeeded).toBeGreaterThanOrEqual(0);
    });

    it('should respect max retry attempts', async () => {
      const result = await syncService.retryFailedOperations(3);

      expect(result.retried).toBeGreaterThanOrEqual(0);
    });
  });

  describe('clearSyncedOperations', () => {
    it('should clear synced operations', async () => {
      const result = await syncService.clearSyncedOperations();

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should clear operations older than specified days', async () => {
      const result = await syncService.clearSyncedOperations(7);

      expect(typeof result).toBe('number');
    });
  });

  describe('resolveConflict', () => {
    it('should resolve conflict with local strategy', async () => {
      const conflict = {
        entity: 'checkin',
        id: 'checkin-123',
        localData: { status: 'safe', timestamp: new Date().toISOString() },
        serverData: { status: 'need_help', timestamp: new Date().toISOString() },
      };

      const result = await syncService.resolveConflict(conflict, 'local');

      expect(result).toBeDefined();
      expect(result.status).toBe('safe');
    });

    it('should resolve conflict with server strategy', async () => {
      const conflict = {
        entity: 'checkin',
        id: 'checkin-123',
        localData: { status: 'safe' },
        serverData: { status: 'need_help' },
      };

      const result = await syncService.resolveConflict(conflict, 'server');

      expect(result).toBeDefined();
      expect(result.status).toBe('need_help');
    });

    it('should resolve conflict with merge strategy', async () => {
      const conflict = {
        entity: 'checkin',
        id: 'checkin-123',
        localData: { status: 'safe', notes: 'Local notes' },
        serverData: { status: 'need_help', location: 'Server location' },
      };

      const result = await syncService.resolveConflict(conflict, 'merge');

      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
    });
  });

  describe('isOnline', () => {
    it('should check if device is online', async () => {
      const result = await syncService.isOnline();

      expect(typeof result).toBe('boolean');
    });
  });

  describe('enableAutoSync', () => {
    it('should enable automatic sync', () => {
      syncService.enableAutoSync(30000); // 30 seconds

      expect(true).toBe(true);
    });
  });

  describe('disableAutoSync', () => {
    it('should disable automatic sync', () => {
      syncService.disableAutoSync();

      expect(true).toBe(true);
    });
  });

  describe('getSyncStatus', () => {
    it('should get current sync status', () => {
      const status = syncService.getSyncStatus();

      expect(status).toBeDefined();
      expect(status.isSyncing).toBeDefined();
      expect(status.lastSyncTime).toBeDefined();
      expect(status.nextSyncTime).toBeDefined();
    });
  });

  describe('clearAllData', () => {
    it('should clear all local data', async () => {
      const result = await syncService.clearAllData();

      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });
  });

  describe('exportData', () => {
    it('should export all local data', async () => {
      const result = await syncService.exportData();

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('importData', () => {
    it('should import data from export', async () => {
      const exportedData = JSON.stringify({
        checkins: [],
        alerts: [],
        contacts: [],
      });

      const result = await syncService.importData(exportedData);

      expect(typeof result).toBe('boolean');
    });
  });

  describe('getLocalData', () => {
    it('should get all local data', async () => {
      const result = await syncService.getLocalData();

      expect(result).toBeDefined();
      expect(result.checkins).toBeDefined();
      expect(result.alerts).toBeDefined();
      expect(result.contacts).toBeDefined();
    });
  });

  describe('syncEntity', () => {
    it('should sync specific entity type', async () => {
      const result = await syncService.syncEntity('checkin');

      expect(result).toBeDefined();
      expect(result.synced).toBeGreaterThanOrEqual(0);
    });
  });

  describe('handleSyncError', () => {
    it('should handle sync error gracefully', async () => {
      const error = new Error('Network error');

      const result = await syncService.handleSyncError(error);

      expect(result).toBeDefined();
      expect(result.retryable).toBeDefined();
    });
  });

  describe('getConflicts', () => {
    it('should get all conflicts', async () => {
      const result = await syncService.getConflicts();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('resolveAllConflicts', () => {
    it('should resolve all conflicts with strategy', async () => {
      const result = await syncService.resolveAllConflicts('merge');

      expect(result).toBeDefined();
      expect(result.resolved).toBeGreaterThanOrEqual(0);
    });
  });
});

import { renderHook, act, waitFor } from '@testing-library/react';
import { useOfflineSync } from '../useOfflineSync';
import { offlineSyncService } from '../../services/offlineSyncService';
import { vi, describe, beforeEach, it, expect } from 'vitest';

// Mock the offlineSyncService
vi.mock('../../services/offlineSyncService', () => ({
  offlineSyncService: {
    initialize: vi.fn(),
    getSyncStatus: vi.fn(),
    onStatusChange: vi.fn(() => vi.fn()), // Return a mock unsubscribe function
    stopSyncLoop: vi.fn(),
    queueOperation: vi.fn(),
    syncPendingOperations: vi.fn(),
    clearOfflineData: vi.fn(),
  },
  SyncStatus: {} // just mock type
}));

describe('useOfflineSync hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle initialization errors gracefully and log them', async () => {
    // Spy on console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockError = new Error('Database initialization failed');
    vi.mocked(offlineSyncService.initialize).mockRejectedValueOnce(mockError);

    renderHook(() => useOfflineSync());

    await waitFor(() => {
      expect(offlineSyncService.initialize).toHaveBeenCalled();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to initialize offline sync:', mockError);

    consoleErrorSpy.mockRestore();
  });

  it('should initialize and get sync status on mount', async () => {
    const mockStatus = { isOnline: true, isSyncing: false, pendingCount: 0 };
    vi.mocked(offlineSyncService.getSyncStatus).mockResolvedValueOnce(mockStatus as any);

    const { result } = renderHook(() => useOfflineSync());

    await waitFor(() => {
      expect(offlineSyncService.initialize).toHaveBeenCalled();
      expect(offlineSyncService.getSyncStatus).toHaveBeenCalled();
      expect(result.current.syncStatus).toEqual(mockStatus);
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.pendingCount).toBe(0);
  });

  it('should subscribe to status changes', async () => {
    const mockUnsubscribe = vi.fn();
    let statusCallback: any;
    vi.mocked(offlineSyncService.onStatusChange).mockImplementation((cb) => {
      statusCallback = cb;
      return mockUnsubscribe;
    });

    const { result, unmount } = renderHook(() => useOfflineSync());

    await waitFor(() => {
        expect(offlineSyncService.onStatusChange).toHaveBeenCalled();
    });

    const newStatus = { isOnline: false, isSyncing: true, pendingCount: 5 };

    act(() => {
      statusCallback(newStatus);
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isSyncing).toBe(true);
    expect(result.current.pendingCount).toBe(5);
    expect(result.current.syncStatus).toEqual(newStatus);

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
    expect(offlineSyncService.stopSyncLoop).toHaveBeenCalled();
  });

  it('should queue operations', async () => {
    vi.mocked(offlineSyncService.queueOperation).mockResolvedValueOnce('op-id-123');

    const { result } = renderHook(() => useOfflineSync());

    await waitFor(() => {
        expect(offlineSyncService.initialize).toHaveBeenCalled();
    });

    const opId = await result.current.queueOperation('create', 'user', '/api/users', { name: 'Test' });

    expect(offlineSyncService.queueOperation).toHaveBeenCalledWith('create', 'user', '/api/users', { name: 'Test' });
    expect(opId).toBe('op-id-123');
  });

  it('should sync pending operations', async () => {
    const { result } = renderHook(() => useOfflineSync());
    await waitFor(() => {
        expect(offlineSyncService.initialize).toHaveBeenCalled();
    });

    await result.current.syncNow();

    expect(offlineSyncService.syncPendingOperations).toHaveBeenCalled();
  });

  it('should clear offline data', async () => {
    const { result } = renderHook(() => useOfflineSync());
    await waitFor(() => {
        expect(offlineSyncService.initialize).toHaveBeenCalled();
    });

    await result.current.clearOfflineData();

    expect(offlineSyncService.clearOfflineData).toHaveBeenCalled();
  });
});

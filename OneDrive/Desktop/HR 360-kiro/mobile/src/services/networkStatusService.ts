/**
 * Network Status Service - Monitors connection status
 * Detects when device goes online/offline and triggers sync
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Store } from '@reduxjs/toolkit';
import { setOnline } from '../store/slices/offlineSlice';
import enhancedSyncService from './enhancedSyncService';

class NetworkStatusService {
  private store: Store | null = null;
  private isMonitoring = false;
  private unsubscribe: (() => void) | null = null;
  private lastKnownState: boolean | null = null;

  /**
   * Initialize network monitoring
   */
  async initialize(store: Store): Promise<void> {
    if (this.isMonitoring) {
      console.log('[NetworkStatus] Already monitoring');
      return;
    }

    this.store = store;
    console.log('[NetworkStatus] Initializing network monitoring');

    try {
      // Check initial connection status
      const initialState = await NetInfo.fetch();
      await this.handleConnectionChange(initialState);

      // Subscribe to connection changes
      this.unsubscribe = NetInfo.addEventListener((state) => {
        this.handleConnectionChange(state);
      });

      this.isMonitoring = true;
      console.log('[NetworkStatus] Network monitoring started');
    } catch (error) {
      console.error('[NetworkStatus] Error initializing:', error);
    }
  }

  /**
   * Handle connection state changes
   */
  private async handleConnectionChange(state: NetInfoState): Promise<void> {
    const isConnected = state.isConnected === true;

    // Only act if connection status actually changed
    if (isConnected === this.lastKnownState) {
      return;
    }

    this.lastKnownState = isConnected;

    console.log('[NetworkStatus] Connection changed:', {
      isConnected,
      type: state.type,
      isInternetReachable: state.isInternetReachable,
    });

    if (!this.store) {
      console.warn('[NetworkStatus] Store not initialized');
      return;
    }

    // Dispatch Redux action
    this.store.dispatch(setOnline(isConnected));

    if (isConnected) {
      console.log('[NetworkStatus] Connection restored - starting sync');
      // Start sync when connection is restored
      try {
        await enhancedSyncService.onConnectionRestored();
      } catch (error) {
        console.error('[NetworkStatus] Error during sync on reconnect:', error);
      }
    } else {
      console.log('[NetworkStatus] Connection lost - stopping sync');
      // Stop periodic sync when connection is lost
      enhancedSyncService.onConnectionLost();
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    this.isMonitoring = false;
    console.log('[NetworkStatus] Network monitoring stopped');
  }

  /**
   * Get current connection status
   */
  async getConnectionStatus(): Promise<{
    isConnected: boolean;
    type: string;
    isInternetReachable: boolean | null;
  }> {
    try {
      const state = await NetInfo.fetch();
      return {
        isConnected: state.isConnected === true,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
      };
    } catch (error) {
      console.error('[NetworkStatus] Error getting connection status:', error);
      return {
        isConnected: false,
        type: 'unknown',
        isInternetReachable: false,
      };
    }
  }

  /**
   * Check if monitoring is active
   */
  isActive(): boolean {
    return this.isMonitoring;
  }
}

export default new NetworkStatusService();

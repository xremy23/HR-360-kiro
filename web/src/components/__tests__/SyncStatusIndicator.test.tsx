import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncStatusIndicator } from '../SyncStatusIndicator';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { useDarkMode } from '../../hooks/useDarkMode';

// Mock the hooks
vi.mock('../../hooks/useOfflineSync', () => ({
  useOfflineSync: vi.fn(),
}));

vi.mock('../../hooks/useDarkMode', () => ({
  useDarkMode: vi.fn(),
}));

describe('SyncStatusIndicator', () => {
  const mockSyncNow = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    (useDarkMode as any).mockReturnValue(false);
  });

  it('renders nothing when online, not syncing, and 0 pending items', () => {
    (useOfflineSync as any).mockReturnValue({
      isOnline: true,
      isSyncing: false,
      pendingCount: 0,
      syncNow: mockSyncNow,
    });

    const { container } = render(<SyncStatusIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('renders offline status when disconnected', () => {
    (useOfflineSync as any).mockReturnValue({
      isOnline: false,
      isSyncing: false,
      pendingCount: 0,
      syncNow: mockSyncNow,
    });

    render(<SyncStatusIndicator />);
    expect(screen.getByText('🔴 Offline')).toBeInTheDocument();
  });

  it('renders syncing status when online and syncing', () => {
    (useOfflineSync as any).mockReturnValue({
      isOnline: true,
      isSyncing: true,
      pendingCount: 0,
      syncNow: mockSyncNow,
    });

    render(<SyncStatusIndicator />);
    expect(screen.getByText('🔄 Syncing...')).toBeInTheDocument();
  });

  it('renders pending items and sync button when online with pending items', () => {
    (useOfflineSync as any).mockReturnValue({
      isOnline: true,
      isSyncing: false,
      pendingCount: 5,
      syncNow: mockSyncNow,
    });

    render(<SyncStatusIndicator />);
    expect(screen.getByText('📝 5 pending')).toBeInTheDocument();

    const syncButton = screen.getByRole('button', { name: /sync now/i });
    expect(syncButton).toBeInTheDocument();

    fireEvent.click(syncButton);
    expect(mockSyncNow).toHaveBeenCalledTimes(1);
  });

  it('renders detailed status when showDetails is true', () => {
    (useOfflineSync as any).mockReturnValue({
      isOnline: true,
      isSyncing: true,
      pendingCount: 3,
      syncNow: mockSyncNow,
    });

    render(<SyncStatusIndicator showDetails={true} />);

    // Should show the details section
    expect(screen.getByText(/✅ Connected/)).toBeInTheDocument();
    expect(screen.getByText(/• Syncing\.\.\./)).toBeInTheDocument();
    expect(screen.getByText(/• 3 pending/)).toBeInTheDocument();
  });

  it('renders disconnected detailed status when showDetails is true', () => {
    (useOfflineSync as any).mockReturnValue({
      isOnline: false,
      isSyncing: false,
      pendingCount: 3,
      syncNow: mockSyncNow,
    });

    render(<SyncStatusIndicator showDetails={true} />);

    // Should show the details section
    expect(screen.getByText(/❌ Disconnected/)).toBeInTheDocument();
    expect(screen.getByText(/• 3 pending/)).toBeInTheDocument();
  });

  it('applies dark mode styles correctly', () => {
    (useOfflineSync as any).mockReturnValue({
      isOnline: false,
      isSyncing: false,
      pendingCount: 0,
      syncNow: mockSyncNow,
    });

    (useDarkMode as any).mockReturnValue(true);

    const { container } = render(<SyncStatusIndicator />);
    const indicator = container.querySelector('.sync-status-indicator');

    // In dark mode, offline background color should be #3F1F1F
    // Note: getComputedStyle or style checks in jsdom can be tricky,
    // but React inline styles are added to the DOM element directly.
    expect(indicator).toHaveStyle({ backgroundColor: '#3F1F1F' });
  });
});

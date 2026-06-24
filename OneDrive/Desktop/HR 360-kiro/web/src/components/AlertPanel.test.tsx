import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AlertPanel from './AlertPanel';

describe('AlertPanel Component', () => {
  beforeEach(() => {
    // Set a consistent system time for relative time calculations
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-10-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const baseAlert = {
    id: 'test-123',
    title: 'Test Alert Title',
    message: 'This is a test alert message',
    severity: 'advisory' as const,
    createdAt: '2023-10-10T11:50:00Z', // 10 minutes ago
    isDrill: false,
  };

  it('renders the alert title and message correctly', () => {
    render(<AlertPanel alert={baseAlert} />);

    expect(screen.getByText('Test Alert Title')).toBeInTheDocument();
    expect(screen.getByText('This is a test alert message')).toBeInTheDocument();
  });

  it('displays the correct relative time format', () => {
    render(<AlertPanel alert={baseAlert} />);

    // 10 minutes ago
    expect(screen.getByText('10m ago')).toBeInTheDocument();
  });

  it('displays "Just now" for recent alerts', () => {
    const recentAlert = {
      ...baseAlert,
      createdAt: '2023-10-10T11:59:30Z', // 30 seconds ago
    };
    render(<AlertPanel alert={recentAlert} />);

    expect(screen.getByText('Just now')).toBeInTheDocument();
  });

  it('displays hours ago for older alerts', () => {
    const olderAlert = {
      ...baseAlert,
      createdAt: '2023-10-10T10:00:00Z', // 2 hours ago
    };
    render(<AlertPanel alert={olderAlert} />);

    expect(screen.getByText('2h ago')).toBeInTheDocument();
  });

  it('displays days ago for very old alerts', () => {
    const veryOldAlert = {
      ...baseAlert,
      createdAt: '2023-10-08T12:00:00Z', // 2 days ago
    };
    render(<AlertPanel alert={veryOldAlert} />);

    expect(screen.getByText('2d ago')).toBeInTheDocument();
  });

  it('does not display DRILL badge when isDrill is false', () => {
    render(<AlertPanel alert={baseAlert} />);

    expect(screen.queryByText('DRILL')).not.toBeInTheDocument();
  });

  it('displays DRILL badge when isDrill is true', () => {
    const drillAlert = { ...baseAlert, isDrill: true };
    render(<AlertPanel alert={drillAlert} />);

    expect(screen.getByText('DRILL')).toBeInTheDocument();
  });

  it('applies correct styling without errors for different severities', () => {
    const severities = ['advisory', 'watch', 'emergency', 'unknown'] as any;

    for (const severity of severities) {
      const alert = { ...baseAlert, severity };
      const { unmount } = render(<AlertPanel alert={alert} />);
      expect(screen.getByText('Test Alert Title')).toBeInTheDocument();
      unmount();
    }
  });
});

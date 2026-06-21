/**
 * Sync Status Indicator Component
 * Displays offline/online status and sync progress
 */

import React from 'react';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useDarkMode } from '../hooks/useDarkMode';

interface SyncStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  className = '',
  showDetails = false,
}) => {
  const { isOnline, isSyncing, pendingCount, syncNow } = useOfflineSync();
  const isDarkMode = useDarkMode();

  if (isOnline && !isSyncing && pendingCount === 0) {
    // All good, don't show anything
    return null;
  }

  // Color mappings responsive to dark mode
  const bgColor = isOnline 
    ? (isDarkMode ? '#1E293B' : '#f0f9ff')
    : (isDarkMode ? '#3F1F1F' : '#fef2f2');
  
  const borderColor = isOnline
    ? (isDarkMode ? '#0EA5E9' : '#bfdbfe')
    : (isDarkMode ? '#DC2626' : '#fecaca');
  
  const textColor = isOnline
    ? (isDarkMode ? '#87CEEB' : '#1e40af')
    : (isDarkMode ? '#FCA5A5' : '#991b1b');
  
  const dotColor = isOnline ? '#10b981' : '#ef4444';

  return (
    <div
      className={`sync-status-indicator ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '500',
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        color: textColor,
      }}
    >
      {/* Status indicator dot */}
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: isOnline ? '#10b981' : '#ef4444',
          animation: isSyncing ? 'pulse 1s infinite' : 'none',
        }}
      />

      {/* Status text */}
      <span>
        {!isOnline && '🔴 Offline'}
        {isOnline && isSyncing && '🔄 Syncing...'}
        {isOnline && !isSyncing && pendingCount > 0 && `📝 ${pendingCount} pending`}
      </span>

      {/* Sync button */}
      {isOnline && pendingCount > 0 && !isSyncing && (
        <button
          onClick={syncNow}
          style={{
            marginLeft: '8px',
            padding: '2px 6px',
            fontSize: '11px',
            backgroundColor: isDarkMode ? '#1E40AF' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Sync Now
        </button>
      )}

      {/* Details */}
      {showDetails && (
        <div
          style={{
            marginLeft: '12px',
            fontSize: '11px',
            opacity: 0.7,
          }}
        >
          {isOnline ? '✅ Connected' : '❌ Disconnected'}
          {isSyncing && ' • Syncing...'}
          {pendingCount > 0 && ` • ${pendingCount} pending`}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default SyncStatusIndicator;

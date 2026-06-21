/**
 * NotificationCenter Component
 * Displays push notification history and allows management
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { markAsRead, markAllAsRead, removeNotification, setShowCenter } from '../store/slices/notificationSlice';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/designSystem';
import { useDarkMode } from '../hooks/useDarkMode';

const NotificationCenter: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { notifications, unreadCount, showCenter } = useSelector((state: RootState) => state.notification);
  const isDarkMode = useDarkMode();

  if (!showCenter) {
    return null;
  }

  // Color mappings for UI - responsive to dark mode
  const uiColors = {
    borderLight: isDarkMode ? '#27272A' : colors.neutral[200],
    text: isDarkMode ? '#FAFAFA' : colors.neutral[900],
    textSecondary: isDarkMode ? '#A1A1AA' : colors.neutral[600],
    primaryLight: isDarkMode ? '#1F3F3E' : '#E8F4F3',
    greyLight: isDarkMode ? '#27272A' : colors.neutral[100],
    primaryDark: isDarkMode ? '#03A39A' : '#027370',
    background: isDarkMode ? '#18181B' : colors.primary.white,
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return '⚠️';
      case 'incident':
        return '🚨';
      case 'sos':
        return '🆘';
      case 'checkin':
        return '✓';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'alert':
        return '#FFA500';
      case 'incident':
        return '#FF4444';
      case 'sos':
        return '#FF0000';
      case 'checkin':
        return '#00AA00';
      default:
        return colors.primary.teal;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => dispatch(setShowCenter(false))}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 99998,
          animation: 'fadeIn 0.2s ease-out',
        }}
      />
      
      {/* Notification Panel */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: 'min(100%, 400px)',
          backgroundColor: uiColors.background,
          boxShadow: shadows.lg,
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.3s ease-out',
          overflow: 'hidden',
        }}
      >
      {/* Header */}
      <div
        style={{
          padding: spacing.lg,
          borderBottom: `1px solid ${uiColors.borderLight}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: typography.fontSize.h2.size, color: uiColors.text }}>
            Notifications
          </h2>
          {unreadCount > 0 && (
            <p
              style={{
                margin: `${spacing.xs} 0 0 0`,
                fontSize: typography.fontSize.body2.size,
                color: uiColors.textSecondary,
              }}
            >
              {unreadCount} new
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => dispatch(setShowCenter(false))}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: uiColors.textSecondary,
            padding: 0,
          }}
        >
          ✕
        </button>
      </div>

      {/* Actions */}
      {unreadCount > 0 && (
        <div style={{ padding: spacing.md, borderBottom: `1px solid ${uiColors.borderLight}` }}>
          <button
            onClick={() => dispatch(markAllAsRead())}
            style={{
              width: '100%',
              padding: `${spacing.sm} ${spacing.md}`,
              backgroundColor: colors.primary.teal,
              color: colors.primary.white,
              border: 'none',
              borderRadius: borderRadius.md,
              cursor: 'pointer',
              fontSize: typography.fontSize.body2.size,
              fontWeight: 'bold',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.backgroundColor = uiColors.primaryDark)}
            onMouseOut={e => (e.currentTarget.style.backgroundColor = colors.primary.teal)}
          >
            Mark all as read
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: spacing.md }}>
        {notifications.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: uiColors.textSecondary,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: spacing.md }}>📭</div>
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              style={{
                padding: spacing.md,
                marginBottom: spacing.sm,
                backgroundColor: notification.isRead 
                  ? uiColors.background 
                  : uiColors.primaryLight,
                borderLeft: `4px solid ${getNotificationColor(notification.type)}`,
                borderRadius: borderRadius.md,
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: `1px solid ${uiColors.borderLight}`,
              }}
              onMouseOver={e => (e.currentTarget.style.backgroundColor = uiColors.greyLight)}
              onMouseOut={e => (e.currentTarget.style.backgroundColor = notification.isRead ? uiColors.background : uiColors.primaryLight)}
              onClick={() => !notification.isRead && dispatch(markAsRead(notification.id))}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: spacing.xs }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                  <span style={{ fontSize: '20px' }}>{getNotificationIcon(notification.type)}</span>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: typography.fontSize.body2.size, fontWeight: 'bold', color: uiColors.text }}>
                      {notification.title}
                    </h3>
                    <p style={{ margin: `${spacing.xs} 0 0 0`, fontSize: typography.fontSize.caption.size, color: uiColors.textSecondary }}>
                      {formatTime(notification.timestamp)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={e => {
                    e.stopPropagation();
                    dispatch(removeNotification(notification.id));
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '16px',
                    cursor: 'pointer',
                    color: uiColors.textSecondary,
                    padding: 0,
                    marginLeft: spacing.sm,
                  }}
                >
                  ✕
                </button>
              </div>

              <p style={{ margin: 0, fontSize: typography.fontSize.body2.size, color: uiColors.text, lineHeight: '1.4' }}>
                {notification.body}
              </p>

              {!notification.isRead && (
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: colors.primary.teal,
                    marginTop: spacing.sm,
                  }}
                />
              )}
            </div>
          ))
        )}
      </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          [data-notification-panel] {
            max-width: 100% !important;
            width: 100vw !important;
          }
        }
      `}</style>
    </>
  );
};

export default NotificationCenter;

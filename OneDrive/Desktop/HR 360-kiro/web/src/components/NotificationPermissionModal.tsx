/**
 * NotificationPermissionModal Component
 * Requests push notification permission from the user
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { setPermission, setDeviceTokenRegistered } from '../store/slices/notificationSlice';
import toast from 'react-hot-toast';
import { colors, spacing, borderRadius, typography } from '../styles/designSystem';
import { useDarkMode } from '../hooks/useDarkMode';

const NotificationPermissionModal: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { permission, deviceTokenRegistered } = useSelector((state: RootState) => state.notification);
  const [isLoading, setIsLoading] = useState(false);
  const isDarkMode = useDarkMode();

  // Don't show if permission already given or declined
  if (permission && permission.permission !== 'prompt') {
    return null;
  }

  const requestNotificationPermission = async () => {
    try {
      setIsLoading(true);

      // Check if browser supports notifications
      if (!('Notification' in window)) {
        toast.error('Your browser does not support notifications');
        return;
      }

      // Check if browser supports service workers (required for push notifications)
      if (!('serviceWorker' in navigator)) {
        toast.error('Your browser does not support service workers');
        return;
      }

      // Request permission
      const permission = await Notification.requestPermission();

      dispatch(
        setPermission({
          permission: permission as 'granted' | 'denied' | 'default',
          timestamp: new Date().toISOString(),
        })
      );

      if (permission === 'granted') {
        toast.success('Notifications enabled! You will receive alerts.');
        
        // Note: Push notifications require backend infrastructure (VAPID keys, Web Push API)
        // For now, just mark permission as granted - in-app notifications will be used
        dispatch(setDeviceTokenRegistered(true));
        console.log('Notification permission granted');
      } else if (permission === 'denied') {
        toast.error('Notifications have been disabled. You can enable them in browser settings.');
      }

      onClose?.();
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to enable notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    dispatch(
      setPermission({
        permission: 'default',
        timestamp: new Date().toISOString(),
      })
    );
    onClose?.();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: isDarkMode ? '#18181B' : colors.primary.white,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        <h2 style={{ margin: `0 0 ${spacing.sm} 0`, color: isDarkMode ? '#FAFAFA' : colors.primary.black, fontSize: typography.fontSize.h5.size }}>
          🔔 Stay Updated
        </h2>

        <p
          style={{
            margin: `0 0 ${spacing.md} 0`,
            color: isDarkMode ? '#A1A1AA' : colors.neutral[600],
            fontSize: typography.fontSize.body3.size,
            lineHeight: '1.6',
          }}
        >
          Enable push notifications to receive real-time alerts about emergencies, check-in reminders, and important
          updates.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm, marginBottom: spacing.md }}>
          <button
            onClick={handleDismiss}
            disabled={isLoading}
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              border: `2px solid ${isDarkMode ? '#27272A' : colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              backgroundColor: isDarkMode ? '#27272A' : colors.primary.white,
              color: isDarkMode ? '#A1A1AA' : colors.neutral[600],
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: typography.fontSize.label2.size,
              fontWeight: 'bold',
              transition: 'all 0.2s',
              opacity: isLoading ? 0.6 : 1,
            }}
            onMouseOver={e => !isLoading && (e.currentTarget.style.backgroundColor = isDarkMode ? '#3F3F46' : colors.neutral[100])}
            onMouseOut={e => (e.currentTarget.style.backgroundColor = isDarkMode ? '#27272A' : colors.primary.white)}
          >
            Not Now
          </button>

          <button
            onClick={requestNotificationPermission}
            disabled={isLoading}
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              border: 'none',
              borderRadius: borderRadius.md,
              backgroundColor: colors.primary.teal,
              color: colors.primary.white,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: typography.fontSize.label2.size,
              fontWeight: 'bold',
              transition: 'all 0.2s',
              opacity: isLoading ? 0.8 : 1,
            }}
            onMouseOver={e => !isLoading && (e.currentTarget.style.backgroundColor = colors.secondary.darkTeal)}
            onMouseOut={e => (e.currentTarget.style.backgroundColor = colors.primary.teal)}
          >
            {isLoading ? 'Enabling...' : 'Enable'}
          </button>
        </div>

        <p style={{ margin: 0, fontSize: typography.fontSize.caption.size, color: isDarkMode ? '#71717A' : colors.neutral[500], textAlign: 'center' }}>
          You can change this in settings anytime.
        </p>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationPermissionModal;

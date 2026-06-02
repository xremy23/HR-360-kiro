/**
 * WebSocket Connection Indicator Component
 * Shows real-time connection status
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { colors, typography, spacing } from '../styles/designSystem';

interface WebSocketIndicatorProps {
  onPress?: () => void;
}

const WebSocketIndicator: React.FC<WebSocketIndicatorProps> = ({ onPress }) => {
  const isConnected = useSelector((state: RootState) => state.websocket.isConnected);
  const isReconnecting = useSelector((state: RootState) => state.websocket.isReconnecting);
  const error = useSelector((state: RootState) => state.websocket.error);
  const connectionAttempts = useSelector((state: RootState) => state.websocket.connectionAttempts);
  const lastMessageTime = useSelector((state: RootState) => state.websocket.lastMessageTime);

  // Don't show indicator if connected and no error
  if (isConnected && !error) {
    return null;
  }

  // Determine display state
  let backgroundColor = colors.success;
  let icon = '✓';
  let message = 'Connected';

  if (error) {
    backgroundColor = colors.error;
    icon = '⚠️';
    message = 'Connection Error';
  } else if (isReconnecting) {
    backgroundColor = colors.warning;
    icon = '↻';
    message = 'Reconnecting';
  } else if (!isConnected) {
    backgroundColor = colors.neutral[500];
    icon = '⚫';
    message = 'Offline';
  }

  // Format last message time
  let lastMessageText = '';
  if (lastMessageTime) {
    const seconds = Math.floor((Date.now() - lastMessageTime) / 1000);
    if (seconds < 60) {
      lastMessageText = `Last update: ${seconds}s ago`;
    } else {
      const minutes = Math.floor(seconds / 60);
      lastMessageText = `Last update: ${minutes}m ago`;
    }
  }

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.left}>
          {isReconnecting ? (
            <ActivityIndicator size="small" color={colors.primary.white} style={styles.spinner} />
          ) : (
            <Text style={styles.icon}>{icon}</Text>
          )}
        </View>

        <View style={styles.middle}>
          <Text style={styles.message}>{message}</Text>
          {error && (
            <Text style={styles.error} numberOfLines={1}>
              {error}
            </Text>
          )}
          {isReconnecting && (
            <Text style={styles.subtext}>
              Reconnecting... (attempt {connectionAttempts})
            </Text>
          )}
          {lastMessageText && isConnected && (
            <Text style={styles.subtext}>{lastMessageText}</Text>
          )}
        </View>

        <View style={styles.right}>
          <Text style={styles.statusDot}>
            {isConnected ? '🟢' : isReconnecting ? '🟡' : '🔴'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 4,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  icon: {
    fontSize: 14,
  },
  spinner: {
    marginRight: 2,
  },
  middle: {
    flex: 1,
  },
  message: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: '600',
    color: colors.primary.white,
  },
  subtext: {
    fontSize: typography.fontSize.caption.size,
    color: colors.primary.white,
    opacity: 0.9,
    marginTop: 2,
  },
  error: {
    fontSize: typography.fontSize.caption.size,
    color: colors.primary.white,
    opacity: 0.9,
    marginTop: 2,
  },
  right: {
    width: 20,
    alignItems: 'center',
  },
  statusDot: {
    fontSize: 12,
  },
});

export default WebSocketIndicator;

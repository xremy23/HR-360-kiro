/**
 * Offline Indicator Component
 * Shows connection status, queue size, and sync progress
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { colors, typography, spacing } from '../styles/designSystem';

interface OfflineIndicatorProps {
  onPress?: () => void;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onPress }) => {
  const isOnline = useSelector((state: RootState) => state.offline.isOnline);
  const isSyncing = useSelector((state: RootState) => state.offline.isSyncing);
  const queueSize = useSelector((state: RootState) => state.offline.queueSize);
  const syncError = useSelector((state: RootState) => state.offline.syncError);
  const lastSyncTime = useSelector((state: RootState) => state.offline.lastSyncTime);

  // Don't show indicator if online and no queue
  if (isOnline && queueSize === 0 && !isSyncing) {
    return null;
  }

  // Determine indicator style
  let backgroundColor = colors.success;
  let icon = '✓';
  let message = 'Connected';

  if (!isOnline) {
    backgroundColor = colors.warning;
    icon = '📡';
    message = 'Offline';
  } else if (isSyncing) {
    backgroundColor = colors.primary.teal;
    icon = '↻';
    message = 'Syncing';
  } else if (queueSize > 0) {
    backgroundColor = colors.warning;
    icon = '⏱';
    message = `${queueSize} queued`;
  } else if (syncError) {
    backgroundColor = colors.error;
    icon = '⚠️';
    message = 'Sync failed';
  }

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.left}>
          {isSyncing ? (
            <ActivityIndicator size="small" color={colors.primary.white} style={styles.spinner} />
          ) : (
            <Text style={styles.icon}>{icon}</Text>
          )}
        </View>

        <View style={styles.middle}>
          <Text style={styles.message}>{message}</Text>
          {queueSize > 0 && (
            <Text style={styles.subtext}>{queueSize} operation{queueSize !== 1 ? 's' : ''}</Text>
          )}
          {syncError && (
            <Text style={styles.subtext} numberOfLines={1}>
              {syncError}
            </Text>
          )}
          {lastSyncTime && !isSyncing && isOnline && queueSize === 0 && (
            <Text style={styles.subtext}>
              Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
            </Text>
          )}
        </View>

        <View style={styles.right}>
          <Text style={styles.indicator}>
            {!isOnline ? '●' : isSyncing ? '◐' : queueSize > 0 ? '◈' : '◯'}
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
  right: {
    width: 20,
    alignItems: 'center',
  },
  indicator: {
    fontSize: 10,
    color: colors.primary.white,
  },
});

export default OfflineIndicator;

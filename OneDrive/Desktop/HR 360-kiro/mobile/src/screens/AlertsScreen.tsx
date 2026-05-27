/**
 * Alerts Screen - View emergency alerts
 * Display broadcast alerts from organization
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';
import { RootState } from '../store';
import apiService, { ApiError } from '../services/apiService';

interface AlertsScreenProps {
  navigation: any;
}

const AlertsScreen: React.FC<AlertsScreenProps> = ({ navigation }) => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch alerts on mount
  useEffect(() => {
    fetchAlerts();
  }, []);

  // Fetch alerts from backend
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getAlerts({ pageSize: 100 });

      if (response.success) {
        setAlerts(response.data);
      } else {
        setError(response.error?.message || 'Failed to load alerts');
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load alerts');
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filterStatus === 'unread') return !alert.read;
    if (filterStatus === 'read') return alert.read;
    return true;
  });

  const handleAlertPress = (alert: any) => {
    setSelectedAlert(alert);
  };

  const handleMarkAsRead = (alertId: string) => {
    // TODO: Call API to mark alert as read
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return colors.error;
      case 'high':
        return colors.warning;
      case 'medium':
        return colors.primary.teal;
      case 'low':
        return colors.success;
      default:
        return colors.neutral[400];
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return 'ℹ️';
      case 'low':
        return '✓';
      default:
        return '📢';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Emergency Alerts</Text>
        <Text style={styles.headerSubtitle}>
          {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading State */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.teal} />
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      ) : (
        <>
          {/* Filter Tabs */}
          <View style={styles.filterTabs}>
        <FilterTab
          label="All"
          isActive={filterStatus === 'all'}
          onPress={() => setFilterStatus('all')}
        />
        <FilterTab
          label="Unread"
          isActive={filterStatus === 'unread'}
          onPress={() => setFilterStatus('unread')}
        />
        <FilterTab
          label="Read"
          isActive={filterStatus === 'read'}
          onPress={() => setFilterStatus('read')}
        />
      </View>

      {/* Alerts List */}
      <FlatList
        data={filteredAlerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AlertCard
            alert={item}
            onPress={() => handleAlertPress(item)}
            onMarkAsRead={() => handleMarkAsRead(item.id)}
            getSeverityColor={getSeverityColor}
            getSeverityIcon={getSeverityIcon}
          />
        )}
        contentContainerStyle={styles.alertsList}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📭</Text>
            <Text style={styles.emptyStateTitle}>No alerts</Text>
            <Text style={styles.emptyStateText}>
              You're all caught up! No new alerts at this time.
            </Text>
          </View>
        }
      />
        </>
      )}

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setSelectedAlert(null)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>

            <View
              style={[
                styles.modalHeader,
                { backgroundColor: getSeverityColor(selectedAlert.severity) },
              ]}
            >
              <Text style={styles.modalHeaderIcon}>
                {getSeverityIcon(selectedAlert.severity)}
              </Text>
              <Text style={styles.modalHeaderTitle}>{selectedAlert.title}</Text>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Severity</Text>
                <Text style={styles.modalValue}>
                  {selectedAlert.severity.toUpperCase()}
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Message</Text>
                <Text style={styles.modalValue}>{selectedAlert.message}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Time</Text>
                <Text style={styles.modalValue}>
                  {new Date(selectedAlert.createdAt).toLocaleString()}
                </Text>
              </View>

              {selectedAlert.actionUrl && (
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>Take Action</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

interface FilterTabProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const FilterTab: React.FC<FilterTabProps> = ({ label, isActive, onPress }) => (
  <TouchableOpacity
    style={[
      styles.filterTab,
      isActive && styles.filterTabActive,
    ]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.filterTabText,
        isActive && styles.filterTabTextActive,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

interface AlertCardProps {
  alert: any;
  onPress: () => void;
  onMarkAsRead: () => void;
  getSeverityColor: (severity: string) => string;
  getSeverityIcon: (severity: string) => string;
}

const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onPress,
  onMarkAsRead,
  getSeverityColor,
  getSeverityIcon,
}) => (
  <TouchableOpacity
    style={[
      styles.alertCard,
      !alert.read && styles.alertCardUnread,
    ]}
    onPress={onPress}
  >
    <View
      style={[
        styles.alertSeverityIndicator,
        { backgroundColor: getSeverityColor(alert.severity) },
      ]}
    >
      <Text style={styles.alertSeverityIcon}>
        {getSeverityIcon(alert.severity)}
      </Text>
    </View>

    <View style={styles.alertContent}>
      <Text style={styles.alertTitle}>{alert.title}</Text>
      <Text style={styles.alertMessage} numberOfLines={2}>
        {alert.message}
      </Text>
      <Text style={styles.alertTime}>
        {new Date(alert.createdAt).toLocaleTimeString()}
      </Text>
    </View>

    {!alert.read && (
      <View style={styles.unreadIndicator} />
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary.white,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.primary.teal,
  },
  headerTitle: {
    fontSize: typography.fontSize.h1.size,
    fontWeight: typography.fontSize.h1.weight,
    color: colors.primary.white,
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.body2.size,
    color: colors.secondary.lightTeal,
  },
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
  errorText: {
    flex: 1,
    fontSize: typography.fontSize.body2.size,
    color: colors.primary.white,
    fontWeight: '600',
  },
  retryText: {
    fontSize: typography.fontSize.label2.size,
    color: colors.primary.white,
    fontWeight: '700',
    marginLeft: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[600],
    marginTop: spacing.lg,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: colors.primary.teal,
  },
  filterTabText: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.neutral[500],
  },
  filterTabTextActive: {
    color: colors.primary.teal,
  },
  alertsList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  alertCardUnread: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.primary.teal,
  },
  alertSeverityIndicator: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  alertSeverityIcon: {
    fontSize: 24,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.primary.black,
    marginBottom: spacing.xs,
  },
  alertMessage: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  alertTime: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[500],
  },
  unreadIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary.teal,
    marginLeft: spacing.md,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.primary.white,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: '80%',
  },
  modalClose: {
    alignSelf: 'flex-end',
    padding: spacing.lg,
  },
  modalCloseText: {
    fontSize: 24,
    color: colors.neutral[500],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  modalHeaderIcon: {
    fontSize: 32,
  },
  modalHeaderTitle: {
    flex: 1,
    fontSize: typography.fontSize.h2.size,
    fontWeight: typography.fontSize.h2.weight,
    color: colors.primary.white,
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  modalSection: {
    marginBottom: spacing.lg,
  },
  modalLabel: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.neutral[600],
    marginBottom: spacing.sm,
  },
  modalValue: {
    fontSize: typography.fontSize.body1.size,
    color: colors.primary.black,
    lineHeight: 22,
  },
  actionButton: {
    backgroundColor: colors.primary.teal,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    ...shadows.md,
  },
  actionButtonText: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.primary.white,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.h2.size,
    fontWeight: typography.fontSize.h2.weight,
    color: colors.primary.black,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[500],
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});

export default AlertsScreen;

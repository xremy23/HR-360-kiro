/**
 * Home Screen - Main dashboard for mobile app
 * Shows quick actions, recent check-ins, and alerts
 * UPDATED: Redux integration with real-time updates
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';
import { RootState, AppDispatch } from '../store/store';
import { setItems as setCheckInItems, setLoading as setCheckInLoading, setError as setCheckInError } from '../store/slices/checkinSlice';
import { setItems as setAlertItems, setLoading as setAlertLoading, setError as setAlertError } from '../store/slices/alertsSlice';
import apiService, { ApiError } from '../services/apiService';
import OfflineIndicator from '../components/OfflineIndicator';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [showQueueDetails, setShowQueueDetails] = useState(false);
  
  // Redux selectors
  const user = useSelector((state: RootState) => state.auth.user);
  const checkIns = useSelector((state: RootState) => state.checkin.items);
  const checkInsLoading = useSelector((state: RootState) => state.checkin.loading);
  const checkInsError = useSelector((state: RootState) => state.checkin.error);
  
  const alerts = useSelector((state: RootState) => state.alerts.items);
  const alertsLoading = useSelector((state: RootState) => state.alerts.loading);
  const alertsError = useSelector((state: RootState) => state.alerts.error);
  
  const isOffline = useSelector((state: RootState) => state.offline.isOnline === false);
  const queueSize = useSelector((state: RootState) => state.offline.queueSize);
  const isSyncing = useSelector((state: RootState) => state.offline.isSyncing);

  // Fetch data on mount and set up polling for real-time updates
  useEffect(() => {
    // Fetch immediately on mount
    fetchHomeData();
    
    // Poll for updates every 10 seconds to reflect status changes
    const pollInterval = setInterval(() => {
      console.log('Polling for check-in updates...');
      fetchHomeData();
    }, 10000);
    
    // Cleanup interval on unmount
    return () => {
      console.log('Clearing poll interval');
      clearInterval(pollInterval);
    };
  }, [dispatch]);

  // Fetch data from backend
  const fetchHomeData = async () => {
    try {
      // Fetch check-ins
      dispatch(setCheckInLoading(true));
      dispatch(setCheckInError(null));
      try {
        const checkInsResponse = await apiService.getCheckInHistory({ pageSize: 10 });
        console.log('Check-ins response:', checkInsResponse);
        if (checkInsResponse.success && checkInsResponse.data) {
          console.log('Dispatching check-in items:', checkInsResponse.data);
          dispatch(setCheckInItems(checkInsResponse.data));
        } else {
          console.warn('Check-ins response not successful or no data:', checkInsResponse);
          dispatch(setCheckInError('Failed to load check-ins'));
        }
      } catch (err) {
        const apiError = err as ApiError;
        console.error('Check-ins fetch error:', apiError);
        dispatch(setCheckInError(apiError.message || 'Failed to load check-ins'));
      } finally {
        dispatch(setCheckInLoading(false));
      }

      // Fetch alerts
      dispatch(setAlertLoading(true));
      dispatch(setAlertError(null));
      try {
        const alertsResponse = await apiService.getAlerts({ pageSize: 5 });
        console.log('Alerts response:', alertsResponse);
        if (alertsResponse.success && alertsResponse.data) {
          console.log('Dispatching alert items:', alertsResponse.data);
          dispatch(setAlertItems(alertsResponse.data));
        } else {
          console.warn('Alerts response not successful or no data:', alertsResponse);
          dispatch(setAlertError('Failed to load alerts'));
        }
      } catch (err) {
        const apiError = err as ApiError;
        console.error('Alerts fetch error:', apiError);
        dispatch(setAlertError(apiError.message || 'Failed to load alerts'));
      } finally {
        dispatch(setAlertLoading(false));
      }
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Error fetching home data:', err);
      dispatch(setCheckInError(apiError.message || 'Failed to load data'));
      dispatch(setAlertError(apiError.message || 'Failed to load data'));
      dispatch(setCheckInLoading(false));
      dispatch(setAlertLoading(false));
    }
  };

  // Get last check-in from Redux
  const lastCheckIn = checkIns.length > 0 ? checkIns[0] : null;

  // Handle check-in button press
  const handleCheckIn = (status: 'safe' | 'need_help' | 'sos') => {
    navigation.navigate('CheckIn', { status });
  };

  // Handle navigation
  const handleViewKB = () => {
    navigation.navigate('KnowledgeBase');
  };

  const handleViewContacts = () => {
    navigation.navigate('Contacts');
  };

  const handleViewToBag = () => {
    navigation.navigate('ToBag');
  };

  const handleViewAlerts = () => {
    navigation.navigate('Alerts');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Offline Indicator Banner */}
      <OfflineIndicator 
        onPress={() => setShowQueueDetails(!showQueueDetails)}
      />

      {/* Queue Details (when offline or syncing) */}
      {showQueueDetails && (queueSize > 0 || isSyncing) && (
        <View style={styles.queueDetails}>
          <Text style={styles.queueDetailsTitle}>Sync Status</Text>
          <Text style={styles.queueDetailsText}>
            {isSyncing ? '↻ Syncing operations...' : `⏱ ${queueSize} operation${queueSize !== 1 ? 's' : ''} pending`}
          </Text>
          <Text style={styles.queueDetailsSubtext}>
            Data will sync automatically when online
          </Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Welcome, {user?.firstName || 'User'}
        </Text>
        <Text style={styles.subheading}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      </View>

      {/* Offline Notice */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>📡 You're offline. Data will sync when online.</Text>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <ActionButton
            label="I'm Safe"
            color={colors.success}
            icon="✓"
            onPress={() => handleCheckIn('safe')}
          />
          <ActionButton
            label="Need Help"
            color={colors.warning}
            icon="!"
            onPress={() => handleCheckIn('need_help')}
          />
          <ActionButton
            label="SOS"
            color={colors.error}
            icon="🆘"
            onPress={() => handleCheckIn('sos')}
          />
        </View>
      </View>

      {/* Last Check-In Status */}
      {checkInsLoading ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last Check-In</Text>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={colors.primary.teal} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      ) : checkInsError ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last Check-In</Text>
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>⚠️ {checkInsError}</Text>
          </View>
        </View>
      ) : lastCheckIn ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last Check-In</Text>
          <View style={[styles.card, { borderLeftColor: getStatusColor(lastCheckIn.status), borderLeftWidth: 4 }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Status: {lastCheckIn.status.toUpperCase()}</Text>
              <Text style={styles.cardTime}>
                {new Date(lastCheckIn.timestamp).toLocaleTimeString()}
              </Text>
            </View>
            {lastCheckIn.notes && (
              <Text style={styles.cardDescription}>{lastCheckIn.notes}</Text>
            )}
          </View>
        </View>
      ) : null}

      {/* Recent Alerts */}
      {alertsLoading ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Alerts</Text>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={colors.primary.teal} />
            <Text style={styles.loadingText}>Loading alerts...</Text>
          </View>
        </View>
      ) : alertsError ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Alerts</Text>
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>⚠️ {alertsError}</Text>
          </View>
        </View>
      ) : alerts.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Alerts</Text>
            <TouchableOpacity onPress={handleViewAlerts}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {alerts.slice(0, 2).map((alert: any) => (
            <View key={alert.id} style={[styles.card, styles.alertCard]}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertTime}>
                {new Date(alert.createdAt).toLocaleTimeString()}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Navigation Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resources</Text>
        <View style={styles.resourceGrid}>
          <ResourceCard
            title="Knowledge Base"
            description="Emergency guides"
            icon="📚"
            onPress={handleViewKB}
          />
          <ResourceCard
            title="Contacts"
            description="Emergency contacts"
            icon="📞"
            onPress={handleViewContacts}
          />
          <ResourceCard
            title="To-Go Bag"
            description="Essentials checklist"
            icon="🎒"
            onPress={handleViewToBag}
          />
          <ResourceCard
            title="Settings"
            description="App preferences"
            icon="⚙️"
            onPress={() => navigation.navigate('Settings')}
          />
        </View>
      </View>
    </ScrollView>
  );
};

interface ActionButtonProps {
  label: string;
  color: string;
  icon: string;
  onPress: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ label, color, icon, onPress }) => (
  <TouchableOpacity
    style={[styles.actionButton, { backgroundColor: color }]}
    onPress={onPress}
  >
    <Text style={styles.actionIcon}>{icon}</Text>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

interface ResourceCardProps {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ title, description, icon, onPress }) => (
  <TouchableOpacity style={styles.resourceCard} onPress={onPress}>
    <Text style={styles.resourceIcon}>{icon}</Text>
    <Text style={styles.resourceTitle}>{title}</Text>
    <Text style={styles.resourceDescription}>{description}</Text>
  </TouchableOpacity>
);

const getStatusColor = (status: string | undefined): string => {
  if (!status) return colors.neutral[300];
  
  switch (status.toLowerCase()) {
    case 'safe':
      return colors.success;
    case 'need_help':
      return colors.warning;
    case 'sos':
      return colors.error;
    default:
      return colors.neutral[300];
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary.white,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.primary.teal,
  },
  greeting: {
    fontSize: typography.fontSize.h1.size,
    fontWeight: typography.fontSize.h1.weight,
    color: colors.primary.white,
    marginBottom: spacing.sm,
  },
  subheading: {
    fontSize: typography.fontSize.body2.size,
    color: colors.secondary.lightTeal,
  },
  offlineBanner: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
  },
  offlineText: {
    fontSize: typography.fontSize.body2.size,
    color: colors.primary.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.h2.size,
    fontWeight: typography.fontSize.h2.weight,
    color: colors.primary.black,
  },
  viewAll: {
    fontSize: typography.fontSize.body2.size,
    color: colors.primary.teal,
    fontWeight: '600',
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  actionLabel: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.primary.white,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.primary.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  loadingCard: {
    backgroundColor: colors.primary.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  loadingText: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[600],
    marginTop: spacing.md,
  },
  errorCard: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  errorText: {
    fontSize: typography.fontSize.body2.size,
    color: colors.primary.white,
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.primary.black,
  },
  cardTime: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[500],
  },
  cardDescription: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  alertCard: {
    backgroundColor: colors.neutral[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  alertTitle: {
    fontSize: typography.fontSize.body1.size,
    fontWeight: '600',
    color: colors.primary.black,
    marginBottom: spacing.sm,
  },
  alertTime: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[500],
  },
  resourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  resourceCard: {
    width: '48%',
    backgroundColor: colors.primary.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  resourceIcon: {
    fontSize: 32,
    marginBottom: spacing.md,
  },
  resourceTitle: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.primary.black,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  resourceDescription: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  queueDetails: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
  },
  queueDetailsTitle: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: '600',
    color: colors.primary.white,
    marginBottom: spacing.xs,
  },
  queueDetailsText: {
    fontSize: typography.fontSize.body2.size,
    color: colors.primary.white,
    marginBottom: spacing.xs,
  },
  queueDetailsSubtext: {
    fontSize: typography.fontSize.caption.size,
    color: colors.primary.white,
    opacity: 0.9,
  },
});

export default HomeScreen;

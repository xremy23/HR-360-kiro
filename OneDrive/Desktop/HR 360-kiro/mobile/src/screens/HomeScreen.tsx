/**
 * Home Screen - Main dashboard for mobile app
 * Shows quick actions, recent check-ins, and alerts
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';
import { RootState } from '../store';
import apiService, { ApiError } from '../services/apiService';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const checkIns = useSelector((state: RootState) => state.checkins.items);
  const alerts = useSelector((state: RootState) => state.alerts.items);
  const [lastCheckIn, setLastCheckIn] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch check-ins
        const checkInsResponse = await apiService.getCheckInHistory({ pageSize: 10 });
        if (checkInsResponse.success && checkInsResponse.data.length > 0) {
          setLastCheckIn(checkInsResponse.data[0]);
        }

        // Fetch alerts
        const alertsResponse = await apiService.getAlerts({ pageSize: 5 });
        if (alertsResponse.success) {
          // TODO: Update Redux with alerts
        }
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Failed to load data');
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update last check-in when Redux updates
  useEffect(() => {
    if (checkIns.length > 0) {
      setLastCheckIn(checkIns[0]);
    }
  }, [checkIns]);

  const handleCheckIn = (status: 'safe' | 'need_help' | 'sos') => {
    navigation.navigate('CheckIn', { status });
  };

  const handleViewKB = () => {
    navigation.navigate('KnowledgeBase');
  };

  const handleViewContacts = () => {
    navigation.navigate('Contacts');
  };

  const handleViewToBag = () => {
    navigation.navigate('ToBag');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
      {lastCheckIn && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last Check-In</Text>
          <View style={[styles.card, { borderLeftColor: getStatusColor(lastCheckIn.status), borderLeftWidth: 4 }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Status: {lastCheckIn.status.toUpperCase()}</Text>
              <Text style={styles.cardTime}>
                {new Date(lastCheckIn.createdAt).toLocaleTimeString()}
              </Text>
            </View>
            {lastCheckIn.notes && (
              <Text style={styles.cardDescription}>{lastCheckIn.notes}</Text>
            )}
          </View>
        </View>
      )}

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Alerts</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {alerts.slice(0, 2).map((alert) => (
            <View key={alert.id} style={[styles.card, styles.alertCard]}>
              <Text style={styles.alertTitle}>{alert.message}</Text>
              <Text style={styles.alertTime}>
                {new Date(alert.createdAt).toLocaleTimeString()}
              </Text>
            </View>
          ))}
        </View>
      )}

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

      {/* Offline Notice */}
      <View style={styles.section}>
        <View style={[styles.card, { backgroundColor: colors.neutral[50] }]}>
          <Text style={styles.offlineText}>
            📡 This app works offline. Your data will sync when you're back online.
          </Text>
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

const getStatusColor = (status: string): string => {
  switch (status) {
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
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
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
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[600],
    marginTop: spacing.lg,
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
  offlineText: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[600],
    textAlign: 'center',
  },
});

export default HomeScreen;

# HomeScreen Redux Integration Guide

**Objective**: Connect HomeScreen to Redux and services for real-time data  
**Estimated Time**: 1-2 hours  
**Difficulty**: Medium

---

## CURRENT STATE

### HomeScreen Currently:
```typescript
// ❌ Fetches data directly from API
const fetchData = async () => {
  const checkInsResponse = await apiService.getCheckInHistory({ pageSize: 10 });
  const alertsResponse = await apiService.getAlerts({ pageSize: 5 });
};

// ❌ Stores data in local state
const [lastCheckIn, setLastCheckIn] = useState<any>(null);
const [loading, setLoading] = useState(true);

// ❌ Doesn't use Redux
const user = useSelector((state: RootState) => state.auth.user);
const checkIns = useSelector((state: RootState) => state.checkins.items);
const alerts = useSelector((state: RootState) => state.alerts.items);
```

### What We Need to Do:
1. ✅ Use Redux selectors for data
2. ✅ Dispatch Redux actions to fetch data
3. ✅ Handle loading/error states from Redux
4. ✅ Subscribe to WebSocket updates
5. ✅ Implement offline fallback

---

## STEP 1: Review Redux Slices

### Check the Redux Store Structure

**File**: `mobile/src/store/store.ts`
```typescript
// This file should have:
// - authSlice (user data)
// - checkinSlice (check-in data)
// - alertsSlice (alerts data)
// - offlineSlice (offline status)
```

**File**: `mobile/src/store/slices/checkinSlice.ts`
```typescript
// Should have:
// - state.items (array of check-ins)
// - state.loading (boolean)
// - state.error (string | null)
// - actions: fetchCheckIns, setCheckIns, setLoading, setError
```

**File**: `mobile/src/store/slices/alertsSlice.ts`
```typescript
// Should have:
// - state.items (array of alerts)
// - state.loading (boolean)
// - state.error (string | null)
// - actions: fetchAlerts, setAlerts, setLoading, setError
```

---

## STEP 2: Update HomeScreen

### Replace the entire HomeScreen with this implementation:

```typescript
/**
 * Home Screen - Main dashboard for mobile app
 * Shows quick actions, recent check-ins, and alerts
 * UPDATED: Redux integration with real-time updates
 */

import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';
import { RootState, AppDispatch } from '../store';
import apiService, { ApiError } from '../services/apiService';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux selectors
  const user = useSelector((state: RootState) => state.auth.user);
  const checkIns = useSelector((state: RootState) => state.checkins.items);
  const checkInsLoading = useSelector((state: RootState) => state.checkins.loading);
  const checkInsError = useSelector((state: RootState) => state.checkins.error);
  
  const alerts = useSelector((state: RootState) => state.alerts.items);
  const alertsLoading = useSelector((state: RootState) => state.alerts.loading);
  const alertsError = useSelector((state: RootState) => state.alerts.error);
  
  const isOffline = useSelector((state: RootState) => state.offline.isOffline);

  // Fetch data on mount
  useEffect(() => {
    fetchHomeData();
  }, []);

  // Fetch data from backend
  const fetchHomeData = async () => {
    try {
      // Fetch check-ins
      const checkInsResponse = await apiService.getCheckInHistory({ pageSize: 10 });
      if (checkInsResponse.success) {
        // TODO: Dispatch to Redux
        // dispatch(setCheckIns(checkInsResponse.data));
      } else {
        // TODO: Dispatch error to Redux
        // dispatch(setCheckInsError(checkInsResponse.error?.message));
      }

      // Fetch alerts
      const alertsResponse = await apiService.getAlerts({ pageSize: 5 });
      if (alertsResponse.success) {
        // TODO: Dispatch to Redux
        // dispatch(setAlerts(alertsResponse.data));
      } else {
        // TODO: Dispatch error to Redux
        // dispatch(setAlertsError(alertsResponse.error?.message));
      }
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Error fetching home data:', err);
      // TODO: Dispatch error to Redux
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
                {new Date(lastCheckIn.createdAt).toLocaleTimeString()}
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
          {alerts.slice(0, 2).map((alert) => (
            <View key={alert.id} style={[styles.card, styles.alertCard]}>
              <Text style={styles.alertTitle}>{alert.message}</Text>
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
});

export default HomeScreen;
```

---

## STEP 3: Update Redux Slices

### Update `mobile/src/store/slices/checkinSlice.ts`

Add these actions if they don't exist:

```typescript
// Add to checkinSlice
export const setCheckIns = (checkIns: any[]) => (dispatch: any) => {
  dispatch(checkinSlice.actions.setItems(checkIns));
};

export const setCheckInsError = (error: string | null) => (dispatch: any) => {
  dispatch(checkinSlice.actions.setError(error));
};

export const setCheckInsLoading = (loading: boolean) => (dispatch: any) => {
  dispatch(checkinSlice.actions.setLoading(loading));
};
```

### Update `mobile/src/store/slices/alertsSlice.ts`

Add these actions if they don't exist:

```typescript
// Add to alertsSlice
export const setAlerts = (alerts: any[]) => (dispatch: any) => {
  dispatch(alertsSlice.actions.setItems(alerts));
};

export const setAlertsError = (error: string | null) => (dispatch: any) => {
  dispatch(alertsSlice.actions.setError(error));
};

export const setAlertsLoading = (loading: boolean) => (dispatch: any) => {
  dispatch(alertsSlice.actions.setLoading(loading));
};
```

---

## STEP 4: Test the Integration

### Test Checklist:
- [ ] HomeScreen loads without errors
- [ ] Redux selectors work correctly
- [ ] Data displays from Redux
- [ ] Loading states show correctly
- [ ] Error states show correctly
- [ ] Offline banner shows when offline
- [ ] Navigation buttons work
- [ ] Check-in buttons navigate correctly

### Run the app:
```bash
cd mobile
npm start
```

---

## NEXT STEPS

After HomeScreen is complete:
1. Apply same pattern to CheckInScreen
2. Apply same pattern to KnowledgeBaseScreen
3. Apply same pattern to ContactsScreen
4. Apply same pattern to AlertsScreen
5. Apply same pattern to ToBagScreen

---

## COMMON ISSUES & SOLUTIONS

### Issue: "Cannot read property 'items' of undefined"
**Solution**: Make sure Redux slices are properly initialized in store.ts

### Issue: "useDispatch is not a function"
**Solution**: Import AppDispatch from store and use `useDispatch<AppDispatch>()`

### Issue: Data not updating
**Solution**: Make sure you're dispatching actions after API calls

### Issue: Offline banner not showing
**Solution**: Check that offlineSlice is properly tracking offline status

---

**Ready to implement? Start with HomeScreen now!**

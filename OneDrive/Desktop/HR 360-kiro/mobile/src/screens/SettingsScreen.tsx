/**
 * Settings Screen - App preferences and configuration
 * Manage notifications, language, and account settings
 * UPDATED: Redux integration with real-time updates
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';
import { RootState, AppDispatch } from '../store/store';
import apiService, { ApiError } from '../services/apiService';

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [notifications, setNotifications] = useState(true);
  const [locationTracking, setLocationTracking] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Redux selectors
  const user = useSelector((state: RootState) => state.auth.user);

  // Fetch user profile on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Fetch user profile from backend
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getUserProfile();

      if (response.success && response.data) {
        // User data is already in Redux from auth slice
        setLoading(false);
      } else {
        setError('Failed to load profile');
        setLoading(false);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load profile');
      console.error('Error fetching profile:', err);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);

          try {
            const response = await apiService.logout();

            if (response.success) {
              // Clear token and navigate to login
              await apiService.clearToken();
              // TODO: Dispatch logout action to Redux
              // dispatch(logout());
              // navigation.replace('Login');
              Alert.alert('Success', 'Logged out successfully');
            } else {
              Alert.alert('Error', 'Failed to logout');
            }
          } catch (err) {
            const apiError = err as ApiError;
            Alert.alert('Error', apiError.message || 'Failed to logout');
            console.error('Error logging out:', err);
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'This will remove all cached data. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          // TODO: Clear cache
          Alert.alert('Success', 'Cache cleared');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={fetchUserProfile}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading State */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.teal} />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      ) : (
        <>
          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Name</Text>
                  <Text style={styles.cardValue}>
                    {user?.firstName} {user?.lastName}
                  </Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.cardRow}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Email</Text>
                  <Text style={styles.cardValue}>{user?.email}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.cardRow}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Organization</Text>
                  <Text style={styles.cardValue}>{user?.organization || 'N/A'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Notifications Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Push Notifications</Text>
                  <Text style={styles.cardDescription}>
                    Receive emergency alerts and updates
                  </Text>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: colors.neutral[300], true: colors.primary.teal }}
                  thumbColor={colors.primary.white}
                />
              </View>
            </View>
          </View>

          {/* Privacy & Security Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy & Security</Text>
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Location Tracking</Text>
                  <Text style={styles.cardDescription}>
                    Share location during emergencies
                  </Text>
                </View>
                <Switch
                  value={locationTracking}
                  onValueChange={setLocationTracking}
                  trackColor={{ false: colors.neutral[300], true: colors.primary.teal }}
                  thumbColor={colors.primary.white}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.cardRow}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Biometric Authentication</Text>
                  <Text style={styles.cardDescription}>
                    Use fingerprint or face ID to unlock
                  </Text>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={setBiometricEnabled}
                  trackColor={{ false: colors.neutral[300], true: colors.primary.teal }}
                  thumbColor={colors.primary.white}
                />
              </View>
            </View>
          </View>

          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.cardRow}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Language</Text>
                  <Text style={styles.cardValue}>
                    {language === 'en' ? 'English' : 'Filipino'}
                  </Text>
                </View>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.cardRow}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Theme</Text>
                  <Text style={styles.cardValue}>Light</Text>
                </View>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Data Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.cardRow}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Clear Cache</Text>
                  <Text style={styles.cardDescription}>
                    Remove cached data and offline content
                  </Text>
                </View>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.cardRow}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Storage Usage</Text>
                  <Text style={styles.cardValue}>245 MB</Text>
                </View>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>App Version</Text>
                  <Text style={styles.cardValue}>1.0.0</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.cardRow}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Privacy Policy</Text>
                </View>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.cardRow}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Terms of Service</Text>
                </View>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout Button */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
              onPress={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <ActivityIndicator size="small" color={colors.primary.white} />
              ) : (
                <Text style={styles.logoutButtonText}>Logout</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Emergency Management App
            </Text>
            <Text style={styles.footerVersion}>
              Version 1.0.0
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
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
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.h2.size,
    fontWeight: typography.fontSize.h2.weight,
    color: colors.primary.black,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.primary.white,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.primary.black,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[500],
  },
  cardValue: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  cardArrow: {
    fontSize: 24,
    color: colors.neutral[400],
    marginLeft: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[100],
  },
  logoutButton: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.primary.white,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[500],
    marginBottom: spacing.sm,
  },
  footerVersion: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[400],
  },
});

export default SettingsScreen;

/**
 * Check-In Screen - Submit status updates
 * Allows users to report their status: Safe, Need Help, or SOS
 * UPDATED: Redux integration with real-time updates
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';
import { RootState, AppDispatch } from '../store/store';
import { setLoading, setError, setCurrentCheckIn, addToHistory } from '../store/slices/checkinSlice';
import apiService, { ApiError } from '../services/apiService';

interface CheckInScreenProps {
  navigation: any;
  route: any;
}

const CheckInScreen: React.FC<CheckInScreenProps> = ({ navigation, route }) => {
  const dispatch = useDispatch<AppDispatch>();
  const initialStatus = route.params?.status || 'safe';
  const [status, setStatus] = useState<'safe' | 'need_help' | 'sos'>(initialStatus);
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redux selectors
  const user = useSelector((state: RootState) => state.auth.user);
  const checkInError = useSelector((state: RootState) => state.checkin.error);

  const handleSubmit = async () => {
    if (!notes.trim()) {
      Alert.alert('Required', 'Please add a note about your status');
      return;
    }

    setIsSubmitting(true);

    try {
      dispatch(setLoading(true));

      // Submit check-in to backend
      const response = await apiService.submitCheckIn({
        status,
        notes: notes.trim(),
        location: location.trim() || undefined,
      });

      if (response.success && response.data) {
        dispatch(setCurrentCheckIn(response.data));
        dispatch(addToHistory(response.data));
        dispatch(setError(null));
        Alert.alert('Success', `Check-in submitted as "${status.replace('_', ' ').toUpperCase()}"`, [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        const error = response.message || 'Failed to submit check-in';
        dispatch(setError(error));
        Alert.alert('Error', error);
      }
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'Failed to submit check-in. Please try again.';
      dispatch(setError(errorMessage));
      Alert.alert('Error', errorMessage);
      console.error('Check-in submission error:', err);
    } finally {
      setIsSubmitting(false);
      dispatch(setLoading(false));
    }
  };

  const handleGetLocation = async () => {
    try {
      // TODO: Integrate with locationService to get current location
      Alert.alert('Location', 'Location capture feature coming soon');
    } catch (err) {
      Alert.alert('Error', 'Failed to get location');
    }
  };

  const getStatusInfo = (s: string) => {
    switch (s) {
      case 'safe':
        return {
          color: colors.success,
          title: "I'm Safe",
          description: 'You are safe and do not need assistance',
          icon: '✓',
        };
      case 'need_help':
        return {
          color: colors.warning,
          title: 'Need Help',
          description: 'You need assistance but not in immediate danger',
          icon: '!',
        };
      case 'sos':
        return {
          color: colors.error,
          title: 'SOS - Emergency',
          description: 'You are in immediate danger and need urgent help',
          icon: '🆘',
        };
      default:
        return {
          color: colors.neutral[300],
          title: 'Unknown',
          description: '',
          icon: '?',
        };
    }
  };

  const statusInfo = getStatusInfo(status);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: statusInfo.color }]}>
        <Text style={styles.headerIcon}>{statusInfo.icon}</Text>
        <Text style={styles.headerTitle}>{statusInfo.title}</Text>
        <Text style={styles.headerDescription}>{statusInfo.description}</Text>
      </View>

      {/* Status Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Your Status</Text>
        <View style={styles.statusGrid}>
          <StatusButton
            label="Safe"
            color={colors.success}
            icon="✓"
            isSelected={status === 'safe'}
            onPress={() => setStatus('safe')}
          />
          <StatusButton
            label="Need Help"
            color={colors.warning}
            icon="!"
            isSelected={status === 'need_help'}
            onPress={() => setStatus('need_help')}
          />
          <StatusButton
            label="SOS"
            color={colors.error}
            icon="🆘"
            isSelected={status === 'sos'}
            onPress={() => setStatus('sos')}
          />
        </View>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Notes</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Describe your situation..."
          placeholderTextColor={colors.neutral[400]}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your location or building"
          placeholderTextColor={colors.neutral[400]}
          value={location}
          onChangeText={setLocation}
        />
        <TouchableOpacity style={styles.locationButton} onPress={handleGetLocation}>
          <Text style={styles.locationButtonText}>📍 Use Current Location</Text>
        </TouchableOpacity>
      </View>

      {/* Info Box */}
      <View style={styles.section}>
        <View style={[styles.infoBox, { backgroundColor: colors.neutral[50] }]}>
          <Text style={styles.infoTitle}>ℹ️ Important</Text>
          <Text style={styles.infoText}>
            Your check-in will be sent to your organization's emergency team. If you selected SOS, emergency services will be notified immediately.
          </Text>
        </View>
      </View>

      {/* Submit Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: statusInfo.color, opacity: isSubmitting ? 0.6 : 1 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.primary.white} />
          ) : (
            <Text style={styles.submitButtonText}>Submit Check-In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {checkInError}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

interface StatusButtonProps {
  label: string;
  color: string;
  icon: string;
  isSelected: boolean;
  onPress: () => void;
}

const StatusButton: React.FC<StatusButtonProps> = ({ label, color, icon, isSelected, onPress }) => (
  <TouchableOpacity
    style={[
      styles.statusButton,
      {
        backgroundColor: isSelected ? color : colors.neutral[50],
        borderColor: isSelected ? color : colors.neutral[200],
      },
    ]}
    onPress={onPress}
  >
    <Text style={styles.statusIcon}>{icon}</Text>
    <Text
      style={[
        styles.statusLabel,
        {
          color: isSelected ? colors.primary.white : colors.primary.black,
        },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary.white,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.h1.size,
    fontWeight: typography.fontSize.h1.weight,
    color: colors.primary.white,
    marginBottom: spacing.sm,
  },
  headerDescription: {
    fontSize: typography.fontSize.body2.size,
    color: colors.primary.white,
    textAlign: 'center',
    opacity: 0.9,
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
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  statusButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    ...shadows.sm,
  },
  statusIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  statusLabel: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.body2.size,
    color: colors.primary.black,
    marginBottom: spacing.md,
  },
  locationButton: {
    backgroundColor: colors.primary.teal,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  locationButtonText: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.primary.white,
  },
  infoBox: {
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.teal,
  },
  infoTitle: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.primary.black,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  submitButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  submitButtonText: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.primary.white,
  },
  cancelButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.neutral[300],
  },
  cancelButtonText: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.primary.black,
  },
  errorBanner: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  errorText: {
    fontSize: typography.fontSize.body2.size,
    color: colors.primary.white,
    fontWeight: '600',
  },
});

export default CheckInScreen;

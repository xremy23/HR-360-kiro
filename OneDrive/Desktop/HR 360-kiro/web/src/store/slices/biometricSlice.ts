/**
 * Biometric Slice - Redux state for biometric authentication
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface BiometricDevice {
  id: string;
  deviceName: string;
  biometricType: 'fingerprint' | 'faceId' | 'both';
  lastUsedAt?: Date;
  createdAt: Date;
}

export interface BiometricStatus {
  enabled: boolean;
  type?: 'fingerprint' | 'faceId' | 'both';
}

export interface BiometricState {
  status: BiometricStatus;
  devices: BiometricDevice[];
  isSupported: boolean;
  isEnrolling: boolean;
  enrollmentStep: 'type-selection' | 'device-name' | 'enrollment' | 'complete';
  selectedType: 'fingerprint' | 'faceId' | 'both' | null;
  deviceName: string;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: BiometricState = {
  status: {
    enabled: false,
  },
  devices: [],
  isSupported: false,
  isEnrolling: false,
  enrollmentStep: 'type-selection',
  selectedType: null,
  deviceName: '',
  loading: false,
  error: null,
  successMessage: null,
};

const biometricSlice = createSlice({
  name: 'biometric',
  initialState,
  reducers: {
    // Status
    setStatus: (state, action: PayloadAction<BiometricStatus>) => {
      state.status = action.payload;
    },

    // Devices
    setDevices: (state, action: PayloadAction<BiometricDevice[]>) => {
      state.devices = action.payload;
    },

    addDevice: (state, action: PayloadAction<BiometricDevice>) => {
      state.devices.push(action.payload);
    },

    removeDevice: (state, action: PayloadAction<string>) => {
      state.devices = state.devices.filter(d => d.id !== action.payload);
    },

    // Support detection
    setIsSupported: (state, action: PayloadAction<boolean>) => {
      state.isSupported = action.payload;
    },

    // Enrollment flow
    startEnrollment: (state) => {
      state.isEnrolling = true;
      state.enrollmentStep = 'type-selection';
      state.selectedType = null;
      state.deviceName = '';
      state.error = null;
      state.successMessage = null;
    },

    setEnrollmentStep: (state, action: PayloadAction<'type-selection' | 'device-name' | 'enrollment' | 'complete'>) => {
      state.enrollmentStep = action.payload;
    },

    setSelectedType: (state, action: PayloadAction<'fingerprint' | 'faceId' | 'both'>) => {
      state.selectedType = action.payload;
    },

    setDeviceName: (state, action: PayloadAction<string>) => {
      state.deviceName = action.payload;
    },

    completeEnrollment: (state) => {
      state.isEnrolling = false;
      state.enrollmentStep = 'complete';
      state.successMessage = 'Biometric device enrolled successfully!';
    },

    cancelEnrollment: (state) => {
      state.isEnrolling = false;
      state.enrollmentStep = 'type-selection';
      state.selectedType = null;
      state.deviceName = '';
      state.error = null;
    },

    // Loading and error states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    setSuccessMessage: (state, action: PayloadAction<string | null>) => {
      state.successMessage = action.payload;
    },

    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
});

export const {
  setStatus,
  setDevices,
  addDevice,
  removeDevice,
  setIsSupported,
  startEnrollment,
  setEnrollmentStep,
  setSelectedType,
  setDeviceName,
  completeEnrollment,
  cancelEnrollment,
  setLoading,
  setError,
  setSuccessMessage,
  clearMessages,
} = biometricSlice.actions;

export default biometricSlice.reducer;

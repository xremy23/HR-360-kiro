/**
 * Biometric Service
 * Handles biometric authentication device management
 */

import { apiService } from './apiService';

export interface BiometricDevice {
  id: string;
  deviceName: string;
  biometricType: 'fingerprint' | 'faceId' | 'both';
  lastUsedAt?: string;
  createdAt: string;
}

export interface BiometricStatus {
  enabled: boolean;
  type?: 'fingerprint' | 'faceId' | 'both';
  deviceCount: number;
}

export interface BiometricSupport {
  fingerprintSupported: boolean;
  faceIdSupported: boolean;
  webauthnSupported: boolean;
}

/**
 * Check if device supports biometric authentication
 */
export const checkBiometricSupport = async (): Promise<BiometricSupport> => {
  try {
    // Check for Web Authentication API support
    const webauthnSupported = window.PublicKeyCredential !== undefined;

    // Check for biometric support via feature detection
    let fingerprintSupported = false;
    let faceIdSupported = false;

    if (webauthnSupported && window.PublicKeyCredential) {
      try {
        const available = await (PublicKeyCredential as any).isUserVerifyingPlatformAuthenticatorAvailable();
        fingerprintSupported = available;
        faceIdSupported = available; // Platform authenticator could be fingerprint or face
      } catch (err) {
        console.warn('Error checking biometric support:', err);
      }
    }

    return {
      fingerprintSupported,
      faceIdSupported,
      webauthnSupported,
    };
  } catch (error) {
    console.error('Error checking biometric support:', error);
    return {
      fingerprintSupported: false,
      faceIdSupported: false,
      webauthnSupported: false,
    };
  }
};

/**
 * Get biometric status for current user
 */
export const getBiometricStatus = async (): Promise<BiometricStatus> => {
  try {
    const response = await apiService.get('/users/biometric/status');

    if (!response.success || !response.data) {
      throw new Error('Failed to get biometric status');
    }

    return response.data;
  } catch (error) {
    console.error('Error getting biometric status:', error);
    throw error;
  }
};

/**
 * Get list of enrolled biometric devices
 */
export const getBiometricDevices = async (): Promise<BiometricDevice[]> => {
  try {
    const response = await apiService.get('/users/biometric/devices');

    if (!response.success || !response.data) {
      throw new Error('Failed to get biometric devices');
    }

    return Array.isArray(response.data) ? response.data : response.data.devices || [];
  } catch (error) {
    console.error('Error getting biometric devices:', error);
    throw error;
  }
};

/**
 * Enable biometric authentication
 */
export const enableBiometric = async (biometricType: 'fingerprint' | 'faceId' | 'both'): Promise<any> => {
  try {
    const response = await apiService.post('/users/biometric/enable', {
      biometricType,
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to enable biometric authentication');
    }

    return response.data;
  } catch (error) {
    console.error('Error enabling biometric authentication:', error);
    throw error;
  }
};

/**
 * Disable biometric authentication
 */
export const disableBiometric = async (): Promise<void> => {
  try {
    const response = await apiService.post('/users/biometric/disable', {});

    if (!response.success) {
      throw new Error('Failed to disable biometric authentication');
    }
  } catch (error) {
    console.error('Error disabling biometric authentication:', error);
    throw error;
  }
};

/**
 * Register a new biometric device
 */
export const registerBiometricDevice = async (data: {
  deviceName: string;
  biometricType: 'fingerprint' | 'faceId' | 'both';
}): Promise<BiometricDevice> => {
  try {
    const response = await apiService.post('/users/biometric/register-device', {
      deviceName: data.deviceName,
      biometricType: data.biometricType,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to register biometric device');
    }

    return response.data;
  } catch (error) {
    console.error('Error registering biometric device:', error);
    throw error;
  }
};

/**
 * Remove a biometric device
 */
export const removeBiometricDevice = async (deviceId: string): Promise<void> => {
  try {
    const response = await apiService.delete(`/users/biometric/devices/${deviceId}`);

    if (!response.success) {
      throw new Error('Failed to remove biometric device');
    }
  } catch (error) {
    console.error('Error removing biometric device:', error);
    throw error;
  }
};

/**
 * Update biometric device name
 */
export const updateBiometricDevice = async (
  deviceId: string,
  deviceName: string
): Promise<BiometricDevice> => {
  try {
    const response = await apiService.put(
      `/users/biometric/devices/${deviceId}`,
      { deviceName }
    );

    if (!response.success || !response.data) {
      throw new Error('Failed to update biometric device');
    }

    return response.data;
  } catch (error) {
    console.error('Error updating biometric device:', error);
    throw error;
  }
};

/**
 * Authenticate using biometric
 */
export const authenticateWithBiometric = async (): Promise<{ token: string }> => {
  try {
    // This would use WebAuthn API to challenge and verify biometric
    // For now, returning a placeholder that would be implemented with WebAuthn
    throw new Error('Biometric authentication not yet implemented');
  } catch (error) {
    console.error('Error authenticating with biometric:', error);
    throw error;
  }
};

export const biometricService = {
  checkBiometricSupport,
  getBiometricStatus,
  getBiometricDevices,
  enableBiometric,
  disableBiometric,
  registerBiometricDevice,
  removeBiometricDevice,
  updateBiometricDevice,
  authenticateWithBiometric,
};

export default biometricService;

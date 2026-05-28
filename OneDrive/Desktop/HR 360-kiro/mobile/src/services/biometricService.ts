/**
 * Biometric Authentication Service
 * Handles fingerprint, face recognition, and other biometric authentication
 */

import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { authService } from './authService';

export interface BiometricConfig {
  enabled: boolean;
  type: 'fingerprint' | 'face' | 'iris' | 'unknown';
  isAvailable: boolean;
  enrolledCount: number;
}

export interface BiometricAuthResult {
  success: boolean;
  authenticated: boolean;
  error?: string;
  biometricType?: string;
}

class BiometricService {
  private biometricConfig: BiometricConfig | null = null;
  private isInitialized = false;

  /**
   * Initialize biometric service
   */
  async initialize(): Promise<void> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        console.warn('Device does not support biometric authentication');
        return;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        console.warn('No biometric data enrolled on device');
        return;
      }

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const type = this.mapAuthType(types);

      this.biometricConfig = {
        enabled: false,
        type,
        isAvailable: true,
        enrolledCount: await this.getEnrolledCount(),
      };

      this.isInitialized = true;
      console.log('Biometric service initialized:', this.biometricConfig);
    } catch (error) {
      console.error('Biometric service initialization error:', error);
    }
  }

  /**
   * Check if biometric authentication is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  /**
   * Get supported biometric types
   */
  async getSupportedTypes(): Promise<string[]> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return types.map(type => this.getTypeName(type));
    } catch (error) {
      console.error('Error getting supported biometric types:', error);
      return [];
    }
  }

  /**
   * Enable biometric authentication
   */
  async enableBiometric(): Promise<BiometricAuthResult> {
    try {
      if (!this.biometricConfig?.isAvailable) {
        return {
          success: false,
          authenticated: false,
          error: 'Biometric authentication not available on this device',
        };
      }

      // Authenticate with biometric
      const result = await this.authenticate('Enable biometric authentication');
      if (!result.authenticated) {
        return result;
      }

      // Store biometric preference
      await SecureStore.setItemAsync('biometric_enabled', 'true');
      await SecureStore.setItemAsync('biometric_type', this.biometricConfig.type);

      // Notify backend
      const api = authService.getApi();
      await api.post('/users/biometric/enable', {
        type: this.biometricConfig.type,
      });

      if (this.biometricConfig) {
        this.biometricConfig.enabled = true;
      }

      return {
        success: true,
        authenticated: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        authenticated: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Disable biometric authentication
   */
  async disableBiometric(): Promise<BiometricAuthResult> {
    try {
      // Authenticate with biometric first
      const result = await this.authenticate('Disable biometric authentication');
      if (!result.authenticated) {
        return result;
      }

      // Remove biometric preference
      await SecureStore.deleteItemAsync('biometric_enabled');
      await SecureStore.deleteItemAsync('biometric_type');

      // Notify backend
      const api = authService.getApi();
      await api.post('/users/biometric/disable');

      if (this.biometricConfig) {
        this.biometricConfig.enabled = false;
      }

      return {
        success: true,
        authenticated: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        authenticated: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Authenticate with biometric
   */
  async authenticate(reason: string = 'Authenticate'): Promise<BiometricAuthResult> {
    try {
      if (!this.biometricConfig?.isAvailable) {
        return {
          success: false,
          authenticated: false,
          error: 'Biometric authentication not available',
        };
      }

      const authenticated = await LocalAuthentication.authenticateAsync({
        reason,
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
      });

      if (authenticated.success) {
        return {
          success: true,
          authenticated: true,
          biometricType: this.biometricConfig.type,
        };
      } else {
        return {
          success: false,
          authenticated: false,
          error: 'Biometric authentication failed',
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        authenticated: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if biometric is enabled
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync('biometric_enabled');
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric status:', error);
      return false;
    }
  }

  /**
   * Get biometric configuration
   */
  getBiometricConfig(): BiometricConfig | null {
    return this.biometricConfig;
  }

  /**
   * Get enrolled biometric count
   */
  private async getEnrolledCount(): Promise<number> {
    try {
      // This is a placeholder - actual implementation depends on device
      // Most devices don't expose enrolled count directly
      return 1;
    } catch (error) {
      console.error('Error getting enrolled count:', error);
      return 0;
    }
  }

  /**
   * Map authentication type
   */
  private mapAuthType(types: LocalAuthentication.AuthenticationType[]): 'fingerprint' | 'face' | 'iris' | 'unknown' {
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'face';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'fingerprint';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'iris';
    }
    return 'unknown';
  }

  /**
   * Get type name
   */
  private getTypeName(type: LocalAuthentication.AuthenticationType): string {
    switch (type) {
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return 'Fingerprint';
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return 'Face Recognition';
      case LocalAuthentication.AuthenticationType.IRIS:
        return 'Iris Recognition';
      default:
        return 'Unknown';
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.biometricConfig = null;
    this.isInitialized = false;
  }
}

export const biometricService = new BiometricService();

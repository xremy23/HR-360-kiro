/**
 * BiometricEnrollmentFlow Component
 * Multi-step flow for enrolling biometric authentication
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import {
  startEnrollment,
  setEnrollmentStep,
  setSelectedType,
  setDeviceName,
  completeEnrollment,
  cancelEnrollment,
  setError,
  clearMessages,
} from '../store/slices/biometricSlice';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/designSystem';

const BiometricEnrollmentFlow: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    isEnrolling,
    enrollmentStep,
    selectedType,
    deviceName,
    loading,
    error,
    successMessage,
    isSupported,
  } = useSelector((state: RootState) => state.biometric);
  const [isProcessing, setIsProcessing] = useState(false);

  // Detect biometric support on mount
  useEffect(() => {
    detectBiometricSupport();
  }, []);

  const detectBiometricSupport = async () => {
    try {
      if (window.PublicKeyCredential) {
        const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        console.log('Biometric support available:', available);
      }
    } catch (error) {
      console.warn('Error detecting biometric support:', error);
    }
  };

  const handleStartEnrollment = () => {
    dispatch(clearMessages());
    dispatch(startEnrollment());
  };

  const handleSelectType = (type: 'fingerprint' | 'faceId' | 'both') => {
    dispatch(setSelectedType(type));
    dispatch(setEnrollmentStep('device-name'));
  };

  const handleDeviceNameSubmit = () => {
    if (!deviceName.trim()) {
      dispatch(setError('Please enter a device name'));
      return;
    }
    dispatch(setEnrollmentStep('enrollment'));
  };

  const handleEnrollment = async () => {
    if (!selectedType) {
      dispatch(setError('Please select a biometric type'));
      return;
    }

    try {
      setIsProcessing(true);
      dispatch(clearMessages());

      // In a real implementation, this would use WebAuthn API
      // For now, we'll simulate the enrollment
      const fakeCredentialId = Math.random().toString(36).substring(7);
      const fakePublicKey = Math.random().toString(36).substring(7);

      // Call backend to register device
      await apiService.post('/users/biometric/enable', {
        biometricType: selectedType,
      });

      toast.success('Biometric authentication enabled!');
      dispatch(completeEnrollment());

      setTimeout(() => {
        dispatch(cancelEnrollment());
        onClose?.();
      }, 2000);
    } catch (error) {
      console.error('Enrollment error:', error);
      const message = error instanceof Error ? error.message : 'Failed to enable biometric authentication';
      dispatch(setError(message));
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isEnrolling) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          maxWidth: '450px',
          width: '90%',
          boxShadow: shadows.lg,
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: spacing.lg }}>
          <h2 style={{ margin: 0, color: colors.text, fontSize: typography.sizes.lg }}>
            🔐 Set Up Biometric Authentication
          </h2>
          <p style={{ margin: `${spacing.sm} 0 0 0`, color: colors.textSecondary, fontSize: typography.sizes.sm }}>
            Step {['type-selection', 'device-name', 'enrollment', 'complete'].indexOf(enrollmentStep) + 1} of 4
          </p>
        </div>

        {/* Step 1: Type Selection */}
        {enrollmentStep === 'type-selection' && (
          <div>
            <p style={{ margin: `0 0 ${spacing.md} 0`, color: colors.textSecondary }}>
              Choose your preferred biometric authentication method:
            </p>

            <div style={{ display: 'grid', gap: spacing.md }}>
              <button
                onClick={() => handleSelectType('fingerprint')}
                style={{
                  padding: spacing.lg,
                  border: `2px solid ${colors.borderLight}`,
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.white,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = colors.primary;
                  e.currentTarget.style.backgroundColor = colors.primaryLight;
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = colors.borderLight;
                  e.currentTarget.style.backgroundColor = colors.white;
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: spacing.sm }}>👆</div>
                <div style={{ fontWeight: 'bold', color: colors.text }}>Fingerprint</div>
                <div style={{ fontSize: typography.sizes.sm, color: colors.textSecondary }}>Quick and secure</div>
              </button>

              <button
                onClick={() => handleSelectType('faceId')}
                style={{
                  padding: spacing.lg,
                  border: `2px solid ${colors.borderLight}`,
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.white,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = colors.primary;
                  e.currentTarget.style.backgroundColor = colors.primaryLight;
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = colors.borderLight;
                  e.currentTarget.style.backgroundColor = colors.white;
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: spacing.sm }}>👤</div>
                <div style={{ fontWeight: 'bold', color: colors.text }}>Face Recognition</div>
                <div style={{ fontSize: typography.sizes.sm, color: colors.textSecondary }}>Hands-free access</div>
              </button>

              <button
                onClick={() => handleSelectType('both')}
                style={{
                  padding: spacing.lg,
                  border: `2px solid ${colors.borderLight}`,
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.white,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = colors.primary;
                  e.currentTarget.style.backgroundColor = colors.primaryLight;
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = colors.borderLight;
                  e.currentTarget.style.backgroundColor = colors.white;
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: spacing.sm }}>🔐</div>
                <div style={{ fontWeight: 'bold', color: colors.text }}>Both (Recommended)</div>
                <div style={{ fontSize: typography.sizes.sm, color: colors.textSecondary }}>Maximum flexibility</div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Device Name */}
        {enrollmentStep === 'device-name' && (
          <div>
            <label style={{ display: 'block', marginBottom: spacing.sm, fontWeight: 'bold', color: colors.text }}>
              Device Name
            </label>
            <input
              type="text"
              placeholder="e.g., My iPhone, Work Laptop"
              value={deviceName}
              onChange={e => dispatch(setDeviceName(e.target.value))}
              style={{
                width: '100%',
                padding: `${spacing.sm} ${spacing.md}`,
                border: `1px solid ${colors.borderLight}`,
                borderRadius: borderRadius.md,
                fontSize: typography.sizes.sm,
                marginBottom: spacing.md,
                boxSizing: 'border-box',
              }}
            />
            <p style={{ margin: 0, fontSize: typography.sizes.sm, color: colors.textSecondary }}>
              This helps you identify which device this biometric is registered on.
            </p>
          </div>
        )}

        {/* Step 3: Enrollment */}
        {enrollmentStep === 'enrollment' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: spacing.lg }}>
              {selectedType === 'fingerprint' ? '👆' : selectedType === 'faceId' ? '👤' : '🔐'}
            </div>
            <h3 style={{ margin: `0 0 ${spacing.md} 0`, color: colors.text }}>
              {selectedType === 'fingerprint'
                ? 'Place your finger on the sensor'
                : selectedType === 'faceId'
                  ? 'Position your face'
                  : 'Ready to enroll'}
            </h3>
            <p style={{ margin: `0 0 ${spacing.lg} 0`, color: colors.textSecondary }}>
              {selectedType === 'fingerprint'
                ? 'Keep your finger steady for a few seconds'
                : 'Look directly at your device camera'}
            </p>

            <div
              style={{
                padding: spacing.lg,
                backgroundColor: colors.greyLight,
                borderRadius: borderRadius.md,
                marginBottom: spacing.lg,
                animation: 'pulse 2s infinite',
              }}
            >
              <div style={{ color: colors.primary, fontSize: '32px' }}>⏳</div>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {enrollmentStep === 'complete' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: spacing.lg }}>✓</div>
            <h3 style={{ margin: `0 0 ${spacing.sm} 0`, color: colors.success }}>Enrollment Complete!</h3>
            <p style={{ margin: 0, color: colors.textSecondary }}>
              Your biometric authentication has been successfully enabled.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: spacing.md,
              backgroundColor: '#FFE8E8',
              borderRadius: borderRadius.md,
              marginBottom: spacing.md,
              color: '#CC0000',
              fontSize: typography.sizes.sm,
            }}
          >
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div
            style={{
              padding: spacing.md,
              backgroundColor: '#E8F5E9',
              borderRadius: borderRadius.md,
              marginBottom: spacing.md,
              color: '#00AA00',
              fontSize: typography.sizes.sm,
            }}
          >
            {successMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm, marginTop: spacing.lg }}>
          <button
            onClick={() => {
              dispatch(cancelEnrollment());
              onClose?.();
            }}
            disabled={isProcessing}
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              border: `2px solid ${colors.borderLight}`,
              borderRadius: borderRadius.md,
              backgroundColor: colors.white,
              color: colors.textSecondary,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontSize: typography.sizes.sm,
              fontWeight: 'bold',
              opacity: isProcessing ? 0.6 : 1,
            }}
          >
            {enrollmentStep === 'complete' ? 'Close' : 'Cancel'}
          </button>

          {enrollmentStep !== 'complete' && (
            <button
              onClick={
                enrollmentStep === 'type-selection'
                  ? undefined
                  : enrollmentStep === 'device-name'
                    ? handleDeviceNameSubmit
                    : handleEnrollment
              }
              disabled={
                isProcessing ||
                (enrollmentStep === 'device-name' && !deviceName.trim())
              }
              style={{
                padding: `${spacing.sm} ${spacing.md}`,
                border: 'none',
                borderRadius: borderRadius.md,
                backgroundColor: colors.primary,
                color: colors.white,
                cursor:
                  isProcessing || (enrollmentStep === 'device-name' && !deviceName.trim())
                    ? 'not-allowed'
                    : 'pointer',
                fontSize: typography.sizes.sm,
                fontWeight: 'bold',
                opacity:
                  isProcessing || (enrollmentStep === 'device-name' && !deviceName.trim())
                    ? 0.6
                    : 1,
              }}
            >
              {isProcessing ? 'Processing...' : 'Next'}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default BiometricEnrollmentFlow;

/**
 * BiometricSettingsPage
 * Manage biometric authentication devices
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import {
  setStatus,
  setDevices,
  removeDevice,
  startEnrollment,
  setError,
  setSuccessMessage,
  setLoading,
} from '../store/slices/biometricSlice';
import BiometricEnrollmentFlow from '../components/BiometricEnrollmentFlow';
import { biometricService } from '../services/biometricService';
import toast from 'react-hot-toast';

const BiometricSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { status, devices, isSupported, isEnrolling, loading, error } = useSelector(
    (state: RootState) => state.biometric
  );
  const [showEnrollment, setShowEnrollment] = useState(false);

  // Load biometric status and devices on mount
  useEffect(() => {
    loadBiometricData();
  }, []);

  const loadBiometricData = async () => {
    try {
      dispatch(setLoading(true));

      // Check device support
      const support = await biometricService.checkBiometricSupport();
      const isSupp = support.fingerprintSupported || support.faceIdSupported;
      dispatch(setStatus({ isSupported: isSupp }));

      // Get biometric status
      const bioStatus = await biometricService.getBiometricStatus();
      dispatch(setStatus(bioStatus));

      // Get enrolled devices
      const enrolledDevices = await biometricService.getBiometricDevices();
      dispatch(setDevices(enrolledDevices));

      dispatch(setError(null));
    } catch (err) {
      console.error('Error loading biometric data:', err);
      dispatch(setError('Failed to load biometric settings'));
      toast.error('Failed to load biometric settings');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleAddDevice = () => {
    if (!isSupported) {
      toast.error('Your device does not support biometric authentication');
      return;
    }
    dispatch(startEnrollment());
    setShowEnrollment(true);
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!window.confirm('Are you sure you want to remove this device?')) {
      return;
    }

    try {
      dispatch(setLoading(true));
      await biometricService.removeBiometricDevice(deviceId);
      dispatch(removeDevice(deviceId));
      toast.success('Device removed successfully');
    } catch (err) {
      console.error('Error removing device:', err);
      toast.error('Failed to remove device');
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-24">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-teal to-secondary-medium sticky top-0 z-40 shadow-md">
        <div className="px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary-light hover:bg-opacity-20 transition text-primary-white"
          >
            ←
          </button>
          <div>
            <h1 className="font-display text-h3 text-primary-white">Biometric Auth</h1>
            <p className="font-sans text-body3 text-secondary-light">Manage your biometric devices</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {/* Status Card */}
        <div className="bg-primary-white rounded-xl shadow-md p-6 mb-6">
          <div className="mb-4">
            <h2 className="font-sans text-h5 text-primary-black dark:text-white font-semibold mb-2">
              🔐 Biometric Status
            </h2>
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full ${
                  status.enabled ? 'bg-success' : 'bg-warning'
                }`}
              ></div>
              <span className="font-sans text-body2 text-neutral-700">
                {status.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {status.enabled && status.type && (
            <div className="text-sm">
              <span className="font-sans text-body3 text-neutral-600">Type: </span>
              <span className="font-sans text-label2 text-primary-teal font-semibold">
                {status.type === 'both'
                  ? 'Fingerprint & Face'
                  : status.type === 'fingerprint'
                  ? 'Fingerprint'
                  : 'Face Recognition'}
              </span>
            </div>
          )}

          {!isSupported && (
            <div className="mt-4 p-3 bg-warning bg-opacity-10 border border-warning rounded-lg">
              <p className="font-sans text-body3 text-neutral-700">
                ⚠️ Your device does not support biometric authentication.
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-error bg-opacity-10 border border-error rounded-lg p-4 mb-6">
            <p className="font-sans text-body3 text-error">{error}</p>
          </div>
        )}

        {/* Devices Section */}
        <div className="mb-6">
          <h2 className="font-sans text-h5 text-primary-black dark:text-white font-semibold mb-4">
            Enrolled Devices
          </h2>

          {devices.length === 0 ? (
            <div className="bg-primary-white rounded-xl shadow-md p-8 text-center">
              <div className="text-5xl mb-3">📱</div>
              <p className="font-sans text-body2 text-neutral-600 mb-4">
                No biometric devices enrolled yet
              </p>
              <p className="font-sans text-body3 text-neutral-500">
                Add a device to use biometric authentication
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="bg-primary-white rounded-xl shadow-md p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="font-sans text-label1 text-primary-black dark:text-white font-semibold">
                      {device.deviceName}
                    </h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs bg-primary-teal bg-opacity-10 text-primary-teal px-2 py-1 rounded-full font-sans">
                        {device.biometricType === 'both'
                          ? 'Fingerprint & Face'
                          : device.biometricType === 'fingerprint'
                          ? 'Fingerprint'
                          : 'Face'}
                      </span>
                      {device.lastUsedAt && (
                        <span className="font-sans text-body3 text-neutral-500">
                          Last used: {new Date(device.lastUsedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveDevice(device.id)}
                    disabled={loading}
                    className="px-4 py-2 bg-error hover:bg-opacity-90 text-primary-white rounded-lg font-sans text-label2 font-semibold transition disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Device Button */}
        <button
          onClick={handleAddDevice}
          disabled={loading || !isSupported || isEnrolling}
          className={`w-full py-4 rounded-lg font-sans text-label1 font-semibold transition ${
            isSupported && !loading && !isEnrolling
              ? 'bg-primary-teal hover:bg-secondary-dark text-primary-white'
              : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
          }`}
        >
          {loading ? '⏳ Loading...' : '➕ Add New Device'}
        </button>

        {/* Info Section */}
        <div className="mt-8 bg-primary-white rounded-xl shadow-md p-6">
          <h3 className="font-sans text-h6 text-primary-black dark:text-white font-semibold mb-3">
            ℹ️ About Biometric Authentication
          </h3>
          <ul className="space-y-2">
            <li className="font-sans text-body3 text-neutral-700">
              ✓ Faster and more secure than passwords
            </li>
            <li className="font-sans text-body3 text-neutral-700">
              ✓ Your biometric data stays on your device
            </li>
            <li className="font-sans text-body3 text-neutral-700">
              ✓ Support for multiple devices per account
            </li>
            <li className="font-sans text-body3 text-neutral-700">
              ✓ Can be removed or updated at any time
            </li>
          </ul>
        </div>
      </main>

      {/* Biometric Enrollment Modal */}
      {showEnrollment && (
        <BiometricEnrollmentFlow
          onClose={() => {
            setShowEnrollment(false);
            loadBiometricData();
          }}
        />
      )}
    </div>
  );
};

export default BiometricSettingsPage;


/**
 * LocationSharingPage
 * Manage location tracking and sharing
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import {
  setCurrentLocation,
  setLocationHistory,
  startTracking,
  stopTracking,
  setPreferences,
  setError,
  setLoading,
} from '../store/slices/locationSlice';
import LocationMap from '../components/LocationMap';
import { locationService } from '../services/locationService';
import toast from 'react-hot-toast';

const LocationSharingPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isTracking, currentLocation, preferences, loading, error } = useSelector(
    (state: RootState) => state.location
  );
  const [trackingWatchId, setTrackingWatchId] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(false);

  // Request location permission on mount
  useEffect(() => {
    requestLocationPermission();
    loadLocationHistory();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const permission = await locationService.requestLocationPermission();
      if (permission !== 'granted') {
        toast.error('Location permission denied');
      }
    } catch (err) {
      console.error('Error requesting location permission:', err);
    }
  };

  const loadLocationHistory = async () => {
    try {
      dispatch(setLoading(true));
      const history = await locationService.getLocationHistory({ limit: 50 });
      dispatch(setLocationHistory(history));
      dispatch(setError(null));
    } catch (err) {
      console.error('Error loading location history:', err);
      dispatch(setError('Failed to load location history'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleToggleTracking = async () => {
    try {
      if (isTracking && trackingWatchId !== null) {
        // Stop tracking
        locationService.stopTracking(trackingWatchId);
        setTrackingWatchId(null);
        dispatch(stopTracking());
        toast.success('Location tracking stopped');
      } else {
        // Start tracking
        dispatch(setLoading(true));

        // Get initial location
        const initialLocation = await locationService.getCurrentLocation();
        dispatch(setCurrentLocation(initialLocation));

        // Send to backend
        await locationService.trackLocation(initialLocation);

        // Start continuous tracking
        const watchId = await locationService.startTracking(async (location) => {
          dispatch(setCurrentLocation(location));
          try {
            await locationService.trackLocation(location);
          } catch (err) {
            console.error('Error tracking location:', err);
          }
        }, 30000); // Update every 30 seconds

        setTrackingWatchId(watchId);
        dispatch(startTracking());
        toast.success('Location tracking started');
      }
    } catch (err) {
      console.error('Error toggling tracking:', err);
      toast.error('Failed to update tracking status');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleShareWithAdmins = async () => {
    try {
      await locationService.updateLocationPreferences({
        shareWithAdmins: !preferences.shareWithAdmins,
      });
      dispatch(setPreferences({ shareWithAdmins: !preferences.shareWithAdmins }));
      toast.success('Sharing preferences updated');
    } catch (err) {
      console.error('Error updating preferences:', err);
      toast.error('Failed to update preferences');
    }
  };

  const handleShareWithTeam = async () => {
    try {
      await locationService.updateLocationPreferences({
        shareWithTeam: !preferences.shareWithTeam,
      });
      dispatch(setPreferences({ shareWithTeam: !preferences.shareWithTeam }));
      toast.success('Sharing preferences updated');
    } catch (err) {
      console.error('Error updating preferences:', err);
      toast.error('Failed to update preferences');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
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
            <h1 className="font-display text-h3 text-primary-white">Location Sharing</h1>
            <p className="font-sans text-body3 text-secondary-light">Track and share your location</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {/* Status Card */}
        <div className="bg-primary-white rounded-xl shadow-md p-6 mb-6">
          <div className="mb-4">
            <h2 className="font-sans text-h5 text-primary-black font-semibold mb-2">
              📍 Tracking Status
            </h2>
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full ${
                  isTracking ? 'bg-success animate-pulse' : 'bg-neutral-400'
                }`}
              ></div>
              <span className="font-sans text-body2 text-neutral-700">
                {isTracking ? 'Actively Tracking' : 'Not Tracking'}
              </span>
            </div>
          </div>

          {currentLocation && (
            <div className="text-sm space-y-2">
              <div>
                <span className="font-sans text-body3 text-neutral-600">Latitude: </span>
                <span className="font-sans text-label2 text-primary-teal font-mono">
                  {currentLocation.latitude.toFixed(6)}
                </span>
              </div>
              <div>
                <span className="font-sans text-body3 text-neutral-600">Longitude: </span>
                <span className="font-sans text-label2 text-primary-teal font-mono">
                  {currentLocation.longitude.toFixed(6)}
                </span>
              </div>
              <div>
                <span className="font-sans text-body3 text-neutral-600">Accuracy: </span>
                <span className="font-sans text-label2 text-primary-teal font-mono">
                  ±{currentLocation.accuracy.toFixed(1)}m
                </span>
              </div>
              <div>
                <span className="font-sans text-body3 text-neutral-600">Last Updated: </span>
                <span className="font-sans text-label2 text-primary-teal font-mono">
                  {new Date(currentLocation.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-error bg-opacity-10 border border-error rounded-lg p-4 mb-6">
            <p className="font-sans text-body3 text-error">{error}</p>
          </div>
        )}

        {/* Tracking Toggle Button */}
        <button
          onClick={handleToggleTracking}
          disabled={loading}
          className={`w-full py-4 rounded-lg font-sans text-label1 font-semibold transition mb-6 ${
            isTracking
              ? 'bg-error hover:bg-opacity-90 text-primary-white'
              : 'bg-success hover:bg-opacity-90 text-primary-white'
          } disabled:opacity-50`}
        >
          {loading ? '⏳ Loading...' : isTracking ? '⏹️ Stop Tracking' : '▶️ Start Tracking'}
        </button>

        {/* Map Card */}
        <div className="bg-primary-white rounded-xl shadow-md overflow-hidden mb-6">
          <button
            onClick={() => setShowMap(!showMap)}
            className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition"
          >
            <h3 className="font-sans text-h6 text-primary-black font-semibold">
              🗺️ Location Map
            </h3>
            <span className="text-xl">{showMap ? '▼' : '▶'}</span>
          </button>
          {showMap && (
            <div className="h-96 bg-neutral-100 border-t border-neutral-200">
              <LocationMap />
            </div>
          )}
        </div>

        {/* Sharing Preferences */}
        <div className="mb-6">
          <h3 className="font-sans text-h5 text-primary-black font-semibold mb-4">
            Sharing Preferences
          </h3>

          {/* Share with Admins */}
          <div className="bg-primary-white rounded-xl shadow-md p-4 mb-3 flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-sans text-label1 text-primary-black font-semibold">
                Share with Admins
              </h4>
              <p className="font-sans text-body3 text-neutral-600 mt-1">
                Allow admins to see your location
              </p>
            </div>
            <button
              onClick={handleShareWithAdmins}
              disabled={loading}
              className={`w-12 h-7 rounded-full transition ${
                preferences.shareWithAdmins ? 'bg-primary-teal' : 'bg-neutral-300'
              } disabled:opacity-50`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-primary-white transition transform ${
                  preferences.shareWithAdmins ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>

          {/* Share with Team */}
          <div className="bg-primary-white rounded-xl shadow-md p-4 flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-sans text-label1 text-primary-black font-semibold">
                Share with Team
              </h4>
              <p className="font-sans text-body3 text-neutral-600 mt-1">
                Allow your team to see your location
              </p>
            </div>
            <button
              onClick={handleShareWithTeam}
              disabled={loading}
              className={`w-12 h-7 rounded-full transition ${
                preferences.shareWithTeam ? 'bg-primary-teal' : 'bg-neutral-300'
              } disabled:opacity-50`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-primary-white transition transform ${
                  preferences.shareWithTeam ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-primary-white rounded-xl shadow-md p-6">
          <h3 className="font-sans text-h6 text-primary-black font-semibold mb-3">
            ℹ️ Location Tracking
          </h3>
          <ul className="space-y-2">
            <li className="font-sans text-body3 text-neutral-700">
              ✓ Tracks your location every 30 seconds when enabled
            </li>
            <li className="font-sans text-body3 text-neutral-700">
              ✓ Location data is encrypted and secure
            </li>
            <li className="font-sans text-body3 text-neutral-700">
              ✓ You can disable tracking or stop sharing at any time
            </li>
            <li className="font-sans text-body3 text-neutral-700">
              ✓ Location history is kept for 90 days
            </li>
            <li className="font-sans text-body3 text-neutral-700">
              ✓ Battery-efficient geolocation updates
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default LocationSharingPage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { RootState, AppDispatch } from '../store/store';
import toast from 'react-hot-toast';
import apiService from '../services/apiService';

const MobileSettings: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [notifications, setNotifications] = useState(true);
  const [location, setLocation] = useState(false);
  const [camera, setCamera] = useState(false);
  const [hasOrganization, setHasOrganization] = useState<boolean | null>(null);
  const [loadingOrgStatus, setLoadingOrgStatus] = useState(true);

  React.useEffect(() => {
    checkOrganizationStatus();
  }, []);

  const checkOrganizationStatus = async () => {
    setLoadingOrgStatus(true);
    try {
      const response = await apiService.getOrganization();
      // Check if response has data (organization exists) or is null (no organization)
      const hasOrg = response.success && response.data !== null && response.data !== undefined;
      setHasOrganization(hasOrg);
      console.log('Organization status:', hasOrg, 'Response:', response);
    } catch (error) {
      console.error('Failed to check org status:', error);
      // Default to showing create org button if check fails
      setHasOrganization(false);
    } finally {
      setLoadingOrgStatus(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleNotificationToggle = () => {
    setNotifications(!notifications);
    toast.success(
      !notifications ? 'Notifications enabled' : 'Notifications disabled'
    );
  };

  const handleLocationToggle = async () => {
    try {
      if (!location) {
        // Request location permission
        const response = await apiService.post('/users/location/enable');
        if (response.success) {
          setLocation(true);
          toast.success('Location tracking enabled');
        } else {
          toast.error('Failed to enable location tracking');
        }
      } else {
        // Disable location tracking
        const response = await apiService.post('/users/location/disable');
        if (response.success) {
          setLocation(false);
          toast.success('Location tracking disabled');
        } else {
          toast.error('Failed to disable location tracking');
        }
      }
    } catch (error) {
      console.error('Location toggle error:', error);
      toast.error('Failed to update location settings');
    }
  };

  const handleCameraToggle = async () => {
    try {
      if (!camera) {
        // Request camera permission
        const response = await apiService.post('/users/camera/enable');
        if (response.success) {
          setCamera(true);
          toast.success('Camera access enabled');
        } else {
          toast.error('Failed to enable camera access');
        }
      } else {
        // Disable camera access
        const response = await apiService.post('/users/camera/disable');
        if (response.success) {
          setCamera(false);
          toast.success('Camera access disabled');
        } else {
          toast.error('Failed to disable camera access');
        }
      }
    } catch (error) {
      console.error('Camera toggle error:', error);
      toast.error('Failed to update camera settings');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
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
            <h1 className="font-display text-h3 text-primary-white">Settings</h1>
            <p className="font-sans text-body3 text-secondary-light">Manage your preferences</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 pb-24">
        {/* Profile Section */}
        <div className="bg-primary-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-teal to-secondary-medium flex items-center justify-center text-primary-white text-2xl">
              👤
            </div>
            <div>
              <h2 className="font-sans text-h5 text-primary-black font-semibold">
                {user?.name}
              </h2>
              <p className="font-sans text-body2 text-neutral-600">{user?.email}</p>
              <p className="font-sans text-label2 text-primary-teal font-semibold mt-1">
                {user?.role.toUpperCase()}
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/edit-profile')}
            className="w-full px-4 py-2 border-2 border-primary-teal text-primary-teal rounded-lg font-sans text-label1 font-semibold hover:bg-primary-teal hover:text-primary-white transition">
            Edit Profile
          </button>
        </div>

        {/* Notifications Section */}
        <div className="mb-6">
          <h3 className="font-sans text-h5 text-primary-black font-semibold mb-4">
            Notifications
          </h3>

          {/* Push Notifications */}
          <div className="bg-primary-white rounded-xl shadow-md p-4 mb-3 flex items-center justify-between">
            <div>
              <h4 className="font-sans text-label1 text-primary-black font-semibold">
                Push Notifications
              </h4>
              <p className="font-sans text-body3 text-neutral-600 mt-1">
                Receive alerts and updates
              </p>
            </div>
            <button
              onClick={handleNotificationToggle}
              className={`w-12 h-7 rounded-full transition ${
                notifications ? 'bg-primary-teal' : 'bg-neutral-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-primary-white transition transform ${
                  notifications ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>

          {/* Email Notifications */}
          <div className="bg-primary-white rounded-xl shadow-md p-4 flex items-center justify-between">
            <div>
              <h4 className="font-sans text-label1 text-primary-black font-semibold">
                Email Notifications
              </h4>
              <p className="font-sans text-body3 text-neutral-600 mt-1">
                Get email updates
              </p>
            </div>
            <button className="w-12 h-7 rounded-full bg-primary-teal transition">
              <div className="w-6 h-6 rounded-full bg-primary-white transition transform translate-x-5"></div>
            </button>
          </div>
        </div>

        {/* Privacy & Permissions Section */}
        <div className="mb-6">
          <h3 className="font-sans text-h5 text-primary-black font-semibold mb-4">
            Privacy & Permissions
          </h3>

          {/* Location */}
          <div className="bg-primary-white rounded-xl shadow-md p-4 mb-3 flex items-center justify-between">
            <div>
              <h4 className="font-sans text-label1 text-primary-black font-semibold">
                📍 Location Access
              </h4>
              <p className="font-sans text-body3 text-neutral-600 mt-1">
                Allow location tracking
              </p>
            </div>
            <button
              onClick={handleLocationToggle}
              className={`w-12 h-7 rounded-full transition ${
                location ? 'bg-primary-teal' : 'bg-neutral-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-primary-white transition transform ${
                  location ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>

          {/* Camera */}
          <div className="bg-primary-white rounded-xl shadow-md p-4 flex items-center justify-between">
            <div>
              <h4 className="font-sans text-label1 text-primary-black font-semibold">
                📷 Camera Access
              </h4>
              <p className="font-sans text-body3 text-neutral-600 mt-1">
                Allow camera access
              </p>
            </div>
            <button
              onClick={handleCameraToggle}
              className={`w-12 h-7 rounded-full transition ${
                camera ? 'bg-primary-teal' : 'bg-neutral-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-primary-white transition transform ${
                  camera ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>
        </div>

        {/* Organization Section */}
        <div className="mb-6">
          <h3 className="font-sans text-h5 text-primary-black font-semibold mb-4">
            Organization
          </h3>

          {loadingOrgStatus ? (
            <div className="bg-primary-white rounded-xl shadow-md p-4 text-center">
              <p className="font-sans text-body2 text-neutral-600">Loading...</p>
            </div>
          ) : !hasOrganization ? (
            // Show create org and join org buttons when user has no organization
            <div className="space-y-3">
              <button
                onClick={() => navigate('/org-settings')}
                className="w-full bg-primary-white rounded-xl shadow-md p-4 text-left hover:shadow-lg transition"
              >
                <h4 className="font-sans text-label1 text-primary-black font-semibold">
                  ➕ Create Organization
                </h4>
                <p className="font-sans text-body3 text-neutral-600 mt-1">
                  Set up your organization to manage your team
                </p>
              </button>

              <button
                onClick={() => navigate('/join-org')}
                className="w-full bg-primary-white rounded-xl shadow-md p-4 text-left hover:shadow-lg transition"
              >
                <h4 className="font-sans text-label1 text-primary-black font-semibold">
                  🔗 Join Organization
                </h4>
                <p className="font-sans text-body3 text-neutral-600 mt-1">
                  Join an existing organization with an invite code
                </p>
              </button>
            </div>
          ) : (
            // Show organization settings button when user is part of org
            <button
              onClick={() => navigate('/org-settings')}
              className="w-full bg-primary-white rounded-xl shadow-md p-4 text-left hover:shadow-lg transition"
            >
              <h4 className="font-sans text-label1 text-primary-black font-semibold">
                🏢 Organization Settings
              </h4>
              <p className="font-sans text-body3 text-neutral-600 mt-1">
                Manage organization and team members
              </p>
            </button>
          )}
        </div>

        {/* App Section */}
        <div className="mb-6">
          <h3 className="font-sans text-h5 text-primary-black font-semibold mb-4">
            App
          </h3>

          <div className="bg-primary-white rounded-xl shadow-md p-4 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <span className="font-sans text-body2 text-neutral-600">App Version</span>
              <span className="font-sans text-label1 text-primary-black font-semibold">
                1.0.0
              </span>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <span className="font-sans text-body2 text-neutral-600">Last Updated</span>
              <span className="font-sans text-label1 text-primary-black font-semibold">
                Today
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-sans text-body2 text-neutral-600">Storage Used</span>
              <span className="font-sans text-label1 text-primary-black font-semibold">
                12.5 MB
              </span>
            </div>
          </div>
        </div>

        {/* Help & Support */}
        <div className="mb-6">
          <h3 className="font-sans text-h5 text-primary-black font-semibold mb-4">
            Help & Support
          </h3>

          <div className="space-y-3">
            <button className="w-full bg-primary-white rounded-xl shadow-md p-4 text-left hover:shadow-lg transition">
              <h4 className="font-sans text-label1 text-primary-black font-semibold">
                ❓ FAQ
              </h4>
              <p className="font-sans text-body3 text-neutral-600 mt-1">
                Frequently asked questions
              </p>
            </button>

            <button className="w-full bg-primary-white rounded-xl shadow-md p-4 text-left hover:shadow-lg transition">
              <h4 className="font-sans text-label1 text-primary-black font-semibold">
                📞 Contact Support
              </h4>
              <p className="font-sans text-body3 text-neutral-600 mt-1">
                Get help from our team
              </p>
            </button>

            <button className="w-full bg-primary-white rounded-xl shadow-md p-4 text-left hover:shadow-lg transition">
              <h4 className="font-sans text-label1 text-primary-black font-semibold">
                📋 Privacy Policy
              </h4>
              <p className="font-sans text-body3 text-neutral-600 mt-1">
                Read our privacy policy
              </p>
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-error hover:bg-opacity-90 text-primary-white font-sans font-semibold py-4 rounded-lg transition"
        >
          🚪 Logout
        </button>
      </main>
    </div>
  );
};

export default MobileSettings;

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import AppRouter from './AppRouter';
import { RootState, AppDispatch } from './store/store';
import { loginSuccess, logout } from './store/slices/authSlice';
import NotificationPermissionModal from './components/NotificationPermissionModal';
import { setPermission } from './store/slices/notificationSlice';
import { getDeviceType } from './utils/deviceDetection';
import apiService from './services/apiService';

/**
 * CICT Safety Portal - Main App Component
 * Disaster preparedness and emergency response application
 * 
 * Features:
 * - Check-in status monitoring (Safe / Need Help)
 * - Real-time weather and earthquake alerts
 * - Disaster alerts aggregation
 * - Team member safety coordination
 * - Multi-role access control (Safety Admin, HR Admin, Employees)
 */
const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  const { permission } = useSelector((state: RootState) => state.notification);

  // Validate session and restore user on app initialization
  useEffect(() => {
    const validateSession = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      // First, try to restore from localStorage if we have both token and user
      if (storedToken && storedUser) {
        try {
          const user = JSON.parse(storedUser);
          console.log('Restoring user from localStorage:', user.email);
          
          // Restore immediately from localStorage - this is the source of truth for login
          // We'll try to refresh from backend but won't fail if it doesn't work
          dispatch(loginSuccess({
            user,
            token: storedToken,
          }));
          
          // Optionally verify token with backend (non-blocking)
          // Only clear session on explicit 401 (token actually expired)
          try {
            const response = await apiService.getCurrentUser();
            
            if (response.success && response.data) {
              // Backend has more recent user data, update it
              console.log('Refreshed user data from backend');
              dispatch(loginSuccess({
                user: {
                  id: response.data.id || user.id,
                  email: response.data.email || user.email,
                  name: response.data.name || user.name,
                  role: response.data.role || user.role,
                  organizationId: response.data.organizationId || user.organizationId,
                  avatar: response.data.avatar || user.avatar,
                },
                token: storedToken,
              }));
            }
          } catch (validationError: any) {
            // Check if it's a 401 unauthorized (token expired)
            if (validationError?.statusCode === 401) {
              console.warn('Token expired (401), clearing session');
              dispatch(logout());
            } else {
              // Network error or backend offline - keep using cached user
              console.warn('Backend validation failed (non-401), keeping cached user:', validationError?.message);
              // Don't logout - user is already logged in from localStorage
            }
          }
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          dispatch(logout());
        }
      }
    };

    validateSession();
  }, [dispatch]); // Run once on app mount

  // Show notification permission modal only on first load if permission hasn't been set
  useEffect(() => {
    // Only show modal if:
    // 1. User is authenticated
    // 2. Permission has not been set (null means never asked)
    // Permission states:
    // - null: Never asked (show modal)
    // - { permission: 'granted', timestamp } : User granted (don't show)
    // - { permission: 'denied', timestamp } : User denied (don't show)
    // - { permission: 'default', timestamp } : User dismissed (don't show)
    if (isAuthenticated && !permission) {
      // Permission is not cached, safe to show modal
      console.log('Showing notification permission modal');
    }
  }, [isAuthenticated, permission]);

  const handlePermissionModalClose = () => {
    // Mark permission as acknowledged by setting it to 'default'
    // This persists to localStorage via the reducer
    dispatch(setPermission({
      permission: 'default',
      timestamp: new Date().toISOString()
    }));
  };

  return (
    <div>
      <AppRouter />
      
      {/* Notification Permission Modal - only if permission not yet set */}
      {isAuthenticated && !permission && (
        <NotificationPermissionModal 
          onClose={handlePermissionModalClose}
        />
      )}
    </div>
  );
};

export default App;

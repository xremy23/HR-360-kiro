import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store/store';
import { getDeviceType, canAccessAdminConsole } from './utils/deviceDetection';
import { pwaService } from './services/pwaService';
import { indexedDBService } from './services/indexedDBService';

// Pages
import LoginPage from './pages/LoginPage';
import EmployeeApp from './pages/EmployeeApp';
import DesktopApp from './pages/DesktopApp';
import AdminConsole from './pages/AdminConsole';
import NotFoundPage from './pages/NotFoundPage';

const AppRouter: React.FC = () => {
  const { user, isAuthenticated, loading, accessMode } = useSelector((state: RootState) => state.auth);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      // Initialize PWA
      pwaService.initialize();
      indexedDBService.initialize();

      // Set device type
      const detected = getDeviceType();
      setDeviceType(detected);
      console.log('Device detected:', detected, 'Window width:', window.innerWidth);

      // Handle window resize
      const handleResize = () => {
        const newDeviceType = getDeviceType();
        setDeviceType(newDeviceType);
        console.log('Window resized - Device type updated:', newDeviceType, 'Width:', window.innerWidth);
      };
      window.addEventListener('resize', handleResize);

      // Listen for online/offline changes
      const unsubscribe = pwaService.onOnlineStatusChange((online) => {
        setIsOnline(online);
        if (online) {
          // Trigger background sync when coming online
          pwaService.requestBackgroundSync('sync-data');
        }
      });

      setIsInitialized(true);
      return () => {
        unsubscribe();
        window.removeEventListener('resize', handleResize);
      };
    } catch (error) {
      console.error('AppRouter initialization error:', error);
      setIsInitialized(true); // Still initialize even if there's an error
    }
  }, []);

  if (!isInitialized) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div>
          <h2>Loading...</h2>
          <p>Initializing application</p>
        </div>
      </div>
    );
  }

  // Show loading screen while verifying magic link (only if loading after authenticated)
  if (loading && isAuthenticated) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div>
          <h2>Verifying magic link...</h2>
          <p>Please wait while we log you in</p>
        </div>
      </div>
    );
  }

  // Determine which app to show
  const isAdminOnDesktop = 
    user && 
    ['admin', 'hr'].includes(user.role) && 
    deviceType === 'desktop' &&
    user.organizationId; // Admin should see DesktopApp, not auto-redirect to AdminConsole

  let appToRender;

  // Determine which app to show based on authentication and device
  if (!isAuthenticated) {
    // Guests can access the app without login - show EmployeeApp for mobile/tablet or DesktopApp for desktop
    if (deviceType === 'desktop') {
      appToRender = <DesktopApp />;
    } else {
      appToRender = <EmployeeApp />;
    }
  } else if (isAuthenticated && deviceType === 'desktop') {
    appToRender = <DesktopApp />;
  } else if (deviceType === 'tablet') {
    appToRender = <EmployeeApp />;
  } else {
    appToRender = <EmployeeApp />;
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/*" element={appToRender} />
      </Routes>

      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-20">
          📡 Offline Mode - Changes will sync when online
        </div>
      )}
    </Router>
  );
};

export default AppRouter;

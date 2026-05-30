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
import AdminConsole from './pages/AdminConsole';
import NotFoundPage from './pages/NotFoundPage';

// Components
import ChatbotButton from './components/ChatbotButton';

const AppRouter: React.FC = () => {
  const { user, isAuthenticated, loading } = useSelector((state: RootState) => state.auth);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      // Initialize PWA
      pwaService.initialize();
      indexedDBService.initialize();

      // Set device type
      setDeviceType(getDeviceType());

      // Listen for online/offline changes
      const unsubscribe = pwaService.onOnlineStatusChange((online) => {
        setIsOnline(online);
        if (online) {
          // Trigger background sync when coming online
          pwaService.requestBackgroundSync('sync-data');
        }
      });

      setIsInitialized(true);
      return unsubscribe;
    } catch (error) {
      console.error('AppRouter initialization error:', error);
      setIsInitialized(true); // Still initialize even if there's an error
    }
  }, []);

  if (!isInitialized) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  // Show loading screen while verifying magic link
  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Verifying magic link...</div>;
  }

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  // Check if user can access admin console
  const canAccessAdmin = user && canAccessAdminConsole(user.role, deviceType);

  return (
    <Router>
      <Routes>
        {/* Admin Console - Desktop only */}
        {canAccessAdmin && (
          <Route path="/admin/*" element={<AdminConsole />} />
        )}

        {/* Employee App - All devices */}
        <Route path="/*" element={<EmployeeApp />} />

        {/* Redirect admin on mobile to employee app */}
        {!canAccessAdmin && user?.role === 'admin' && (
          <Route path="/admin/*" element={<Navigate to="/" replace />} />
        )}

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Chatbot Button - Available everywhere */}
      {isAuthenticated && <ChatbotButton />}

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

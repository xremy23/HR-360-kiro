import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { setLoading as setCheckInLoading, setError as setCheckInError, setItems as setCheckInItems } from '../store/slices/checkinSlice';
import { setLoading as setAlertLoading, setError as setAlertError, setItems as setAlertItems } from '../store/slices/alertSlice';
import { setLoading as setKBLoading, setError as setKBError, setItems as setKBItems } from '../store/slices/kbSlice';
import DesktopLayout from '../components/DesktopLayout';
import ChatbotWidget from '../components/ChatbotWidget';
import DesktopHome from './DesktopHome';
import AdminConsole from './AdminConsole';
import SafetyAdminConsole from './SafetyAdminConsole';
import MobileKB from './MobileKB';
import MobileAlerts from './MobileAlerts';
import MobileContacts from './MobileContacts';
import IncidentManagement from './IncidentManagement';
import MobileSettings from './MobileSettings';
import LoginPage from './LoginPage';
import EditProfile from './EditProfile';
import OrganizationSettings from './OrganizationSettings';
import JoinOrganization from './JoinOrganization';
import BiometricSettingsPage from './BiometricSettingsPage';
import LocationSharingPage from './LocationSharingPage';
import WorkplaceAdminConsole from './WorkplaceAdminConsole';
import { chatbotService } from '../services/chatbotService';
import { websocketService } from '../services/websocketService';

const DesktopApp: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { token } = useSelector((state: RootState) => state.auth);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Initialize WebSocket and fetch data on mount
  useEffect(() => {
    let isComponentMounted = true;

    const initializeApp = async () => {
      try {
        // Initialize WebSocket connection for real-time updates
        if (token && isComponentMounted) {
          console.log('Connecting WebSocket...', 'Token:', token?.substring(0, 20) + '...');
          try {
            await websocketService.connect(token);
            console.log('WebSocket connected successfully');
          } catch (wsError) {
            console.warn('WebSocket connection failed (non-blocking):', wsError);
          }
        } else {
          console.log('No token available for WebSocket connection');
        }

        // Cache knowledge base for chatbot offline support (non-blocking)
        // Don't await - just fire and forget, errors are logged but don't block
        chatbotService.cacheKnowledgeBase().catch((error) => {
          // Error already logged in cacheKnowledgeBase
        });

        // Initialize empty data states
        if (isComponentMounted) {
          dispatch(setCheckInLoading(false));
          dispatch(setCheckInItems([]));

          dispatch(setAlertLoading(false));
          dispatch(setAlertItems([]));

          dispatch(setKBLoading(false));
          dispatch(setKBItems([]));
        }
      } catch (error) {
        console.error('Error in DesktopApp initialization:', error);
        if (isComponentMounted) {
          dispatch(setCheckInError(''));
          dispatch(setAlertError(''));
          dispatch(setKBError(''));
        }
      } finally {
        if (isComponentMounted) setIsInitialized(true);
      }
    };

    initializeApp();

    // Cleanup
    return () => {
      isComponentMounted = false;
      websocketService.disconnect();
    };
  }, [token, dispatch]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-neutral-950">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Loading...</h2>
          <p className="text-neutral-600 dark:text-neutral-400">Initializing app</p>
        </div>
      </div>
    );
  }

  return (
    <DesktopLayout>
      <Routes>
        <Route path="/" element={<DesktopHome />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin-console/*" element={<AdminConsole />} />
        <Route path="/safety-admin/*" element={<SafetyAdminConsole />} />
        <Route path="/workplace-admin/*" element={<WorkplaceAdminConsole />} />
        <Route path="/kb" element={<MobileKB />} />
        <Route path="/alerts" element={<MobileAlerts />} />
        <Route path="/contacts" element={<MobileContacts />} />
        <Route path="/incidents" element={<IncidentManagement />} />
        <Route path="/settings" element={<MobileSettings />} />
        <Route path="/biometric-settings" element={<BiometricSettingsPage />} />
        <Route path="/location-sharing" element={<LocationSharingPage />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/org-settings" element={<OrganizationSettings />} />
        <Route path="/join-org" element={<JoinOrganization />} />
      </Routes>

      {/* Floating Chatbot Widget */}
      <ChatbotWidget />
    </DesktopLayout>
  );
};

export default DesktopApp;

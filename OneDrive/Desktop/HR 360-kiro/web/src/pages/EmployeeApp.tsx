import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { setLoading as setCheckInLoading, setError as setCheckInError, setItems as setCheckInItems } from '../store/slices/checkinSlice';
import { setLoading as setAlertLoading, setError as setAlertError, setItems as setAlertItems } from '../store/slices/alertSlice';
import { setLoading as setKBLoading, setError as setKBError, setItems as setKBItems } from '../store/slices/kbSlice';
import { getDeviceType } from '../utils/deviceDetection';
import MobileLayout from '../components/MobileLayout';
import MobileHome from './MobileHome';
import MobileAlerts from './MobileAlerts';
import MobileKB from './MobileKB';
import MobileToBag from './MobileToBag';
import MobileContacts from './MobileContacts';
import IncidentManagement from './IncidentManagement';
import MobileSettings from './MobileSettings';
import LoginPage from './LoginPage';
import EditProfile from './EditProfile';
import OrganizationSettings from './OrganizationSettings';
import JoinOrganization from './JoinOrganization';
import BiometricSettingsPage from './BiometricSettingsPage';
import LocationSharingPage from './LocationSharingPage';
import CommunityReporting from './CommunityReporting';
import BulkImportPage from './BulkImportPage';
import Chatbot from '../components/Chatbot';
import { chatbotService } from '../services/chatbotService';
import { websocketService } from '../services/websocketService';
import apiService from '../services/apiService';

const EmployeeApp: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { token } = useSelector((state: RootState) => state.auth);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  // Initialize WebSocket and fetch data on mount
  useEffect(() => {
    let isComponentMounted = true;
    
    // Set device type
    setDeviceType(getDeviceType());
    
    const initializeApp = async () => {
      try {
      // Initialize WebSocket connection for real-time updates (only once)
        if (token && isComponentMounted) {
          console.log('Connecting WebSocket...', 'Token:', token?.substring(0, 20) + '...');
          try {
            await websocketService.connect(token);
            console.log('WebSocket connected successfully');
          } catch (wsError) {
            console.warn('WebSocket connection failed (non-blocking):', wsError);
            // Don't block app if WebSocket fails - real-time updates are nice-to-have
            // App continues loading
          }
        } else {
          console.log('No token available for WebSocket connection');
        }

        // Cache knowledge base for chatbot offline support (non-blocking)
        // Don't await - just fire and forget
        chatbotService.cacheKnowledgeBase().catch((error) => {
          console.warn('Failed to cache knowledge base:', error);
        });

        // Fetch check-ins
        if (isComponentMounted) dispatch(setCheckInLoading(true));
        try {
          const checkInsResponse = await apiService.getCheckIns();
          if (isComponentMounted) {
            if (checkInsResponse.success && checkInsResponse.data) {
              dispatch(setCheckInItems(checkInsResponse.data));
            } else {
              dispatch(setCheckInError('Failed to load check-ins'));
              dispatch(setCheckInItems([]));
            }
          }
        } catch (error) {
          if (isComponentMounted) {
            dispatch(setCheckInError('Failed to load check-ins'));
            dispatch(setCheckInItems([]));
          }
        } finally {
          if (isComponentMounted) dispatch(setCheckInLoading(false));
        }

        // Fetch alerts
        if (isComponentMounted) dispatch(setAlertLoading(false));
        dispatch(setAlertItems([]));

        // Use mock KB data (no need to fetch if not available)
        if (isComponentMounted) dispatch(setKBLoading(false));
        dispatch(setKBItems([]));
      } catch (error) {
        console.error('Error in EmployeeApp initialization:', error);
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

    // Cleanup: prevent state updates and disconnect on unmount
    return () => {
      isComponentMounted = false;
      websocketService.disconnect();
    };
  }, [token, dispatch]);

  if (!isInitialized) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Loading...</h2>
          <p>Initializing app</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <MobileLayout
            showHeader={true}
            headerTitle="HR 360"
            onMenuClick={() => setShowMenu(!showMenu)}
            showMenu={showMenu}
          >
            <Routes>
              <Route path="/" element={<MobileHome onMenuClick={() => setShowMenu(!showMenu)} showMenu={showMenu} />} />
              <Route path="/alerts" element={<MobileAlerts />} />
              <Route path="/kb" element={<MobileKB />} />
              <Route path="/tobag" element={<MobileToBag />} />
              <Route path="/contacts" element={<MobileContacts />} />
              <Route path="/incidents" element={<IncidentManagement />} />
              <Route path="/community-reports" element={<CommunityReporting />} />
              <Route path="/bulk-import" element={<BulkImportPage />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="/settings" element={<MobileSettings />} />
              <Route path="/biometric-settings" element={<BiometricSettingsPage />} />
              <Route path="/location-sharing" element={<LocationSharingPage />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/org-settings" element={<OrganizationSettings />} />
              <Route path="/join-org" element={<JoinOrganization />} />
            </Routes>
          </MobileLayout>
        }
      />
    </Routes>
  );
};

export default EmployeeApp;

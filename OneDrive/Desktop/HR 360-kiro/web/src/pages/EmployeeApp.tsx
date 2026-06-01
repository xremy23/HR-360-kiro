import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import { setLoading as setCheckInLoading, setError as setCheckInError, setItems as setCheckInItems } from '../store/slices/checkinSlice';
import { setLoading as setAlertLoading, setError as setAlertError, setItems as setAlertItems } from '../store/slices/alertSlice';
import { setLoading as setKBLoading, setError as setKBError, setItems as setKBItems } from '../store/slices/kbSlice';
import MobileHome from './MobileHome';
import MobileCheckIn from './MobileCheckIn';
import MobileAlerts from './MobileAlerts';
import MobileKB from './MobileKB';
import MobileSettings from './MobileSettings';
import EditProfile from './EditProfile';
import OrganizationSettings from './OrganizationSettings';
import Chatbot from '../components/Chatbot';
import { chatbotService } from '../services/chatbotService';

const EmployeeApp: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cache knowledge base for chatbot offline support (non-blocking)
        try {
          await chatbotService.cacheKnowledgeBase();
        } catch (error) {
          console.warn('Failed to cache knowledge base:', error);
          // Don't block app initialization if KB caching fails
        }

        // Fetch check-ins
        dispatch(setCheckInLoading(true));
        // TODO: Replace with actual API call
        // const checkInsResponse = await apiService.getCheckIns();
        // if (checkInsResponse.success) {
        //   dispatch(setCheckInItems(checkInsResponse.data));
        // } else {
        //   dispatch(setCheckInError('Failed to load check-ins'));
        // }
        dispatch(setCheckInItems([]));

        // Fetch alerts
        dispatch(setAlertLoading(true));
        // TODO: Replace with actual API call
        // const alertsResponse = await apiService.getAlerts();
        // if (alertsResponse.success) {
        //   dispatch(setAlertItems(alertsResponse.data));
        // } else {
        //   dispatch(setAlertError('Failed to load alerts'));
        // }
        dispatch(setAlertItems([]));

        // Fetch KB guides
        dispatch(setKBLoading(true));
        // TODO: Replace with actual API call
        // const kbResponse = await apiService.getKBGuides();
        // if (kbResponse.success) {
        //   dispatch(setKBItems(kbResponse.data));
        // } else {
        //   dispatch(setKBError('Failed to load KB guides'));
        // }
        dispatch(setKBItems([]));
      } catch (error) {
        console.error('Error in EmployeeApp fetchData:', error);
        dispatch(setCheckInError('Failed to load data'));
        dispatch(setAlertError('Failed to load data'));
        dispatch(setKBError('Failed to load data'));
      } finally {
        setIsInitialized(true);
      }
    };

    fetchData();
  }, [dispatch]);

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
      <Route path="/" element={<MobileHome />} />
      <Route path="/checkin" element={<MobileCheckIn />} />
      <Route path="/alerts" element={<MobileAlerts />} />
      <Route path="/kb" element={<MobileKB />} />
      <Route path="/contacts" element={<div className="p-4">Contacts coming soon</div>} />
      <Route path="/chatbot" element={<Chatbot />} />
      <Route path="/settings" element={<MobileSettings />} />
      <Route path="/edit-profile" element={<EditProfile />} />
      <Route path="/org-settings" element={<OrganizationSettings />} />
    </Routes>
  );
};

export default EmployeeApp;

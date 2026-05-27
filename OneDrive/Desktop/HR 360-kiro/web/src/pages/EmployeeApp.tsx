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

const EmployeeApp: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
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
        dispatch(setCheckInError('Failed to load data'));
        dispatch(setAlertError('Failed to load data'));
        dispatch(setKBError('Failed to load data'));
      }
    };

    fetchData();
  }, [dispatch]);
  return (
    <Routes>
      <Route path="/" element={<MobileHome />} />
      <Route path="/checkin" element={<MobileCheckIn />} />
      <Route path="/alerts" element={<MobileAlerts />} />
      <Route path="/kb" element={<MobileKB />} />
      <Route path="/contacts" element={<div className="p-4">Contacts coming soon</div>} />
      <Route path="/settings" element={<MobileSettings />} />
    </Routes>
  );
};

export default EmployeeApp;

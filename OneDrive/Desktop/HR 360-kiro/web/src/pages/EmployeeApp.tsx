import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MobileHome from './MobileHome';
import MobileCheckIn from './MobileCheckIn';
import MobileAlerts from './MobileAlerts';
import MobileKB from './MobileKB';
import MobileSettings from './MobileSettings';

const EmployeeApp: React.FC = () => {
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

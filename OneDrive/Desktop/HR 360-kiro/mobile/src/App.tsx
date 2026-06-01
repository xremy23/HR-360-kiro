/**
 * Main App Component (Web/PWA Version)
 * Sets up routing and Redux store for web
 */

import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import store from './store/store';
import DeviceRedirect from './DeviceRedirect';

// Screens
import HomeScreen from './screens/HomeScreen';
import CheckInScreen from './screens/CheckInScreen';
import KnowledgeBaseScreen from './screens/KnowledgeBaseScreen';
import ContactsScreen from './screens/ContactsScreen';
import ToBagScreen from './screens/ToBagScreen';
import AlertsScreen from './screens/AlertsScreen';
import SettingsScreen from './screens/SettingsScreen';

/**
 * Main App Component
 */
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <DeviceRedirect>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/check-in" element={<CheckInScreen />} />
            <Route path="/knowledge-base" element={<KnowledgeBaseScreen />} />
            <Route path="/contacts" element={<ContactsScreen />} />
            <Route path="/to-bag" element={<ToBagScreen />} />
            <Route path="/alerts" element={<AlertsScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DeviceRedirect>
      </Router>
    </Provider>
  );
};

export default App;

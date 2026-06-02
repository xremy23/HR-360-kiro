import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import AppRouter from './AppRouter';
import { RootState, AppDispatch } from './store/store';
import NotificationPermissionModal from './components/NotificationPermissionModal';
import NotificationCenter from './components/NotificationCenter';
import { setShowCenter } from './store/slices/notificationSlice';
import { getDeviceType } from './utils/deviceDetection';

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { showCenter, permission } = useSelector((state: RootState) => state.notification);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // Show notification permission modal on first load (if not desktop admin)
  useEffect(() => {
    if (isAuthenticated && !permission) {
      const deviceType = getDeviceType();
      // Show modal for non-admin or desktop users
      setShowPermissionModal(true);
    }
  }, [isAuthenticated, permission]);

  return (
    <div>
      <AppRouter />
      
      {/* Notification Permission Modal - on first load */}
      {isAuthenticated && showPermissionModal && (
        <NotificationPermissionModal 
          onClose={() => setShowPermissionModal(false)}
        />
      )}

      {/* Notification Center - controlled by Redux */}
      {isAuthenticated && showCenter && (
        <NotificationCenter 
          onClose={() => dispatch(setShowCenter(false))}
        />
      )}
    </div>
  );
};

export default App;

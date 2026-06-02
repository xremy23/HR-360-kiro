import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { setShowCenter } from '../store/slices/notificationSlice';

interface MobileLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  headerTitle?: string;
  onMenuClick?: () => void;
  showMenu?: boolean;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  showHeader = true,
  headerTitle = 'HR 360',
  onMenuClick,
  showMenu = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { unreadCount } = useSelector((state: RootState) => state.notification);

  const navItems = [
    { icon: '🏠', label: 'Home', path: '/' },
    { icon: '✓', label: 'Check In', path: '/checkin' },
    { icon: '💬', label: 'Assistant', path: '/chatbot' },
    { icon: '📚', label: 'KB', path: '/kb' },
    { icon: '⚙️', label: 'Settings', path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col h-screen bg-neutral-50">
      {/* Header */}
      {showHeader && (
        <header className="bg-gradient-to-r from-primary-teal to-secondary-medium sticky top-0 z-40 shadow-md flex-shrink-0">
          <div className="px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="font-display text-h2 text-primary-white">{headerTitle}</h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <button
                onClick={() => dispatch(setShowCenter(true))}
                className="relative w-10 h-10 flex items-center justify-center rounded-full bg-secondary-light bg-opacity-20 hover:bg-opacity-30 transition"
                title="Notifications"
              >
                <span className="text-primary-white text-xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-primary-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {onMenuClick && (
                <button
                  onClick={onMenuClick}
                  className="relative w-10 h-10 flex items-center justify-center rounded-full bg-secondary-light bg-opacity-20 hover:bg-opacity-30 transition"
                >
                  <span className="text-primary-white text-xl">☰</span>
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation - Fixed */}
      <nav className="fixed bottom-0 left-0 right-0 bg-primary-white border-t border-neutral-200 shadow-lg z-50 flex-shrink-0">
        <div className="flex items-center justify-around h-20">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center justify-center py-3 transition ${
                isActive(item.path)
                  ? 'text-primary-teal'
                  : 'text-neutral-600 hover:text-primary-teal'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="font-sans text-caption text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default MobileLayout;

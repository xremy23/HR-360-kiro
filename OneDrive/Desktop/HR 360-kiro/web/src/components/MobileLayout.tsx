import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { setShowCenter } from '../store/slices/notificationSlice';
import { logout } from '../store/slices/authSlice';
import NotificationCenter from './NotificationCenter';

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
  const { isGuest, accessMode } = useSelector((state: RootState) => state.auth);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const applyDarkMode = (isDark: boolean) => {
    const htmlElement = document.documentElement;
    if (isDark) {
      htmlElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      htmlElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  };

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    let isDark = true; // Default to dark mode
    
    if (savedDarkMode === 'true') {
      isDark = true;
    } else if (savedDarkMode === 'false') {
      isDark = false;
    } else {
      // First visit - default to dark mode
      isDark = true;
    }
    
    setIsDarkMode(isDark);
    applyDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    applyDarkMode(newDarkMode);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  // Navigation items for authenticated users
  const authNavItems = [
    { icon: '🏠', label: 'Home', path: '/' },
    { icon: '📚', label: 'KB', path: '/kb' },
    { icon: '📞', label: 'Contacts', path: '/contacts' },
    { icon: '💬', label: 'Assistant', path: '/chatbot' },
    { icon: '🎒', label: 'Go-Bag', path: '/tobag' },
  ];

  // Navigation items for guest users
  const guestNavItems = [
    { icon: '🏠', label: 'Home', path: '/' },
    { icon: '📚', label: 'KB', path: '/kb' },
    { icon: '📞', label: 'Contacts', path: '/contacts' },
    { icon: '💬', label: 'Assistant', path: '/chatbot' },
    { icon: '🎒', label: 'Go-Bag', path: '/tobag' },
  ];

  const navItems = isGuest ? guestNavItems : authNavItems;

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors">
      {/* Modern Header - Clean White Design */}
      {showHeader && (
        <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-40 flex-shrink-0 transition-colors">
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary-teal dark:bg-[#038F8D] rounded-lg flex-shrink-0">
                  <span className="text-base">🚨</span>
                </div>
                <div className="min-w-0">
                  <h1 className="font-display text-base font-bold text-primary-black dark:text-white">{headerTitle}</h1>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Disaster Coordination</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 ml-2">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition active:bg-neutral-200 dark:active:bg-neutral-700"
                title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
              >
                <span className="text-xl">{isDarkMode ? '🌙' : '☀️'}</span>
              </button>

              {/* Notification Bell */}
              <button
                type="button"
                onClick={() => dispatch(setShowCenter(true))}
                style={{ pointerEvents: 'auto' }}
                className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition active:bg-neutral-200 dark:active:bg-neutral-700"
              >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-error rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Menu Button */}
              {onMenuClick && (
                <button
                  onClick={onMenuClick}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition active:bg-neutral-200 dark:active:bg-neutral-700"
                >
                  <span className="text-xl">≡</span>
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Mobile Menu - Global Overlay (shown on all pages) */}
      {showMenu && (
        <div className="fixed inset-0 z-40 top-14">
          <div className="absolute top-0 right-0 w-48 bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 shadow-lg divide-y divide-neutral-100 dark:divide-neutral-800">
            {accessMode !== 'guest' ? (
              <>
                <button
                  onClick={() => {
                    navigate('/settings');
                    onMenuClick?.();
                  }}
                  className="w-full text-left px-4 py-3 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 font-sans text-sm font-medium transition flex items-center gap-3"
                >
                  <span className="text-lg">⚙️</span>
                  Settings
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    onMenuClick?.();
                  }}
                  className="w-full text-left px-4 py-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 font-sans text-sm font-medium transition flex items-center gap-3"
                >
                  <span className="text-lg">🚪</span>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    navigate('/settings');
                    onMenuClick?.();
                  }}
                  className="w-full text-left px-4 py-3 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 font-sans text-sm font-medium transition flex items-center gap-3"
                >
                  <span className="text-lg">⚙️</span>
                  Settings
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu Backdrop */}
      {showMenu && (
        <div
          className="fixed inset-0 z-30 top-14"
          onClick={() => onMenuClick?.()}
        />
      )}

      {/* Notification Center - Inside MobileLayout to fix z-index */}
      <NotificationCenter />

      {/* Modern Bottom Navigation - Minimal Tabs */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 z-50 flex-shrink-0 transition-colors">
        <div className="flex items-stretch justify-around h-16">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition font-sans text-xs font-semibold relative ${
                  active ? 'text-primary-teal dark:text-[#49D7D1]' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {/* Active indicator line */}
                {active && <div className="absolute top-0 left-0 right-0 h-1 bg-primary-teal dark:bg-[#49D7D1]" />}
                
                <span className="text-lg">{item.icon}</span>
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MobileLayout;

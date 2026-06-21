import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { setShowCenter } from '../store/slices/notificationSlice';
import { logout } from '../store/slices/authSlice';
import { Home, Book, AlertCircle, Phone, Settings, LogOut, Sun, Moon, Menu, X } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

const DesktopLayout: React.FC<DesktopLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isGuest } = useSelector((state: RootState) => state.auth);
  const { unreadCount } = useSelector((state: RootState) => state.notification);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? saved === 'true' : true;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Hide layout on login page
  const isLoginPage = location.pathname === '/login';

  // Apply dark mode on mount and when isDarkMode changes
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isDarkMode) {
      htmlElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      htmlElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/', id: 'home' },
    { icon: Book, label: 'Knowledge Base', path: '/kb', id: 'kb' },
    { icon: AlertCircle, label: 'Alerts', path: '/alerts', id: 'alerts' },
    { icon: Phone, label: 'Call Directory', path: '/contacts', id: 'contacts' },
    { icon: Settings, label: 'Settings', path: '/settings', id: 'settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Show full-screen login page without sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-stone-50 dark:bg-neutral-950 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-white dark:bg-neutral-900 border-r border-stone-200 dark:border-neutral-800 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-neutral-800 h-16">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#038F8D] to-[#024645] flex items-center justify-center text-white font-bold">
                360
              </div>
              <span className="font-black text-sm text-[#038F8D] dark:text-[#49D7D1]">HR 360</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-stone-100 dark:hover:bg-neutral-800 rounded-lg transition"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  active
                    ? 'bg-[#038F8D]/15 text-[#038F8D] dark:text-[#49D7D1]'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800'
                }`}
                title={!sidebarOpen ? item.label : ''}
              >
                <IconComponent size={20} className="flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="text-sm font-semibold flex-1 text-left">{item.label}</span>
                    {active && <div className="w-2 h-2 rounded-full bg-[#038F8D] dark:bg-[#49D7D1]" />}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-stone-200 dark:border-neutral-800 space-y-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800 transition"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun size={20} className="flex-shrink-0" /> : <Moon size={20} className="flex-shrink-0" />}
            {sidebarOpen && <span className="text-sm font-semibold flex-1 text-left">{isDarkMode ? 'Light' : 'Dark'}</span>}
          </button>

          {/* Guest Login Button */}
          {isGuest && (
            <button
              onClick={() => navigate('/login')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-[#038F8D] to-[#024645] text-white hover:from-[#02706e] hover:to-[#001d1b] transition font-semibold text-sm"
              title="Sign in to your account"
            >
              <span className="text-base flex-shrink-0">🔐</span>
              {sidebarOpen && <span className="flex-1 text-left">Sign In</span>}
            </button>
          )}

          {/* Logout Button */}
          {!isGuest && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 transition"
            >
              <LogOut size={20} className="flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-semibold flex-1 text-left">Logout</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-neutral-900 border-b border-stone-200 dark:border-neutral-800 flex items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
              {navItems.find((item) => isActive(item.path))?.label || 'HR 360'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button
              onClick={() => dispatch(setShowCenter(true))}
              className="relative p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-neutral-800 transition"
            >
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* User Profile */}
            {!isGuest && user && (
              <div className="flex items-center gap-3 pl-4 border-l border-stone-200 dark:border-neutral-800">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#038F8D] to-[#024645] flex items-center justify-center text-white font-bold text-sm">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">{user.role}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </div>
      </main>

      {/* Notification Center */}
      <NotificationCenter />
    </div>
  );
};

export default DesktopLayout;

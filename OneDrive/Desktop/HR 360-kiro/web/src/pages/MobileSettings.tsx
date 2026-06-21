import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { RootState, AppDispatch } from '../store/store';
import { ChevronRight, Bell, Lock, Building2, HelpCircle, LogOut, Sun, Moon, Zap } from 'lucide-react';

const MobileSettings: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, accessMode } = useSelector((state: RootState) => state.auth);
  const [notifications, setNotifications] = useState(true);
  const [location, setLocation] = useState(false);
  const [camera, setCamera] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    // Default to dark mode (true), unless explicitly set to light
    return saved !== null ? saved === 'true' : true;
  });

  // Apply dark mode on mount
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
    const htmlElement = document.documentElement;
    if (newDarkMode) {
      htmlElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      htmlElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  };

  const handleNotificationToggle = () => {
    setNotifications(!notifications);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="w-full min-h-screen bg-stone-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="px-4 py-6 space-y-3 border-b border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 font-mono">⚙️ PREFERENCES</span>
            <h1 className="text-xl font-black text-[#038F8D] dark:text-[#49D7D1] leading-tight">Settings</h1>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl border border-stone-200 dark:border-neutral-800 hover:bg-stone-100 dark:hover:bg-neutral-900 transition"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
          </button>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {accessMode === 'guest' ? 'Manage device preferences' : 'Manage your profile and preferences'}
        </p>
      </div>

      {/* Main Content */}
      <main className="px-4 py-6 pb-24 space-y-6">
        {/* Guest Mode - Sign In CTA */}
        {accessMode === 'guest' && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full bg-gradient-to-r from-[#038F8D] to-[#49D7D1] hover:from-[#02706e] hover:to-[#3bc0bb] text-white font-bold text-xs py-3.5 rounded-2xl transition shadow-md active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <span>🔐 Sign In to Your Account</span>
          </button>
          <p className="text-[10px] text-stone-500 dark:text-stone-400 text-center">
            Sign in to access team features, status updates, and organization settings
          </p>
        </div>
        )}

        {/* Profile Section - Authenticated Only */}
        {accessMode !== 'guest' && (
        <div className="space-y-3">
          <h2 className="font-extrabold text-xs flex items-center gap-1.5 uppercase tracking-wide text-stone-500 dark:text-neutral-400">
            👤 Your Profile
          </h2>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-stone-100 dark:border-neutral-850 p-4 shadow-xs">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#038F8D] to-[#49D7D1] flex items-center justify-center text-white text-lg font-black shadow-md">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">{user?.name}</h3>
                <p className="font-sans text-xs text-stone-500 dark:text-stone-400 truncate">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#038F8D]/15 text-[#038F8D] dark:text-[#49D7D1]">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/edit-profile')}
              className="w-full px-4 py-2.5 border border-[#038F8D] text-[#038F8D] dark:text-[#49D7D1] rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#038F8D]/5 transition flex items-center justify-center gap-2"
            >
              <span>Edit Profile</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        )}

        {/* Notifications */}
        <div className="space-y-3">
          <h2 className="font-extrabold text-xs flex items-center gap-1.5 uppercase tracking-wide text-stone-500 dark:text-neutral-400">
            <Bell size={14} /> Notifications
          </h2>
          
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-stone-100 dark:border-neutral-850 p-4 flex items-center justify-between shadow-xs">
            <div>
              <h3 className="font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">Push Alerts</h3>
              <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">Crisis updates & alerts</p>
            </div>
            <button
              onClick={handleNotificationToggle}
              className={`relative w-12 h-6 rounded-full transition-all shrink-0 ${
                notifications ? 'bg-[#038F8D]' : 'bg-stone-300 dark:bg-neutral-700'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
                  notifications ? 'right-0.5' : 'left-0.5'
                }`}
              ></div>
            </button>
          </div>
        </div>

        {/* Privacy & Security */}
        {accessMode !== 'guest' && (
        <div className="space-y-3">
          <h2 className="font-extrabold text-xs flex items-center gap-1.5 uppercase tracking-wide text-stone-500 dark:text-neutral-400">
            <Lock size={14} /> Privacy & Security
          </h2>

          <button
            type="button"
            onClick={() => navigate('/biometric-settings')}
            className="w-full bg-white dark:bg-neutral-900 rounded-2xl border border-stone-100 dark:border-neutral-850 p-4 text-left hover:border-[#038F8D] dark:hover:border-[#038F8D] transition shadow-xs group"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">🔐 Biometric Auth</h3>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">Fingerprint & face recognition</p>
              </div>
              <ChevronRight size={14} className="text-stone-400 dark:text-neutral-600 group-hover:text-[#038F8D] transition" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/location-sharing')}
            className="w-full bg-white dark:bg-neutral-900 rounded-2xl border border-stone-100 dark:border-neutral-850 p-4 text-left hover:border-[#038F8D] dark:hover:border-[#038F8D] transition shadow-xs group"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">📍 Location Sharing</h3>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">Share with team during crisis</p>
              </div>
              <ChevronRight size={14} className="text-stone-400 dark:text-neutral-600 group-hover:text-[#038F8D] transition" />
            </div>
          </button>
        </div>
        )}

        {/* Organization - Authenticated Only */}
        {accessMode !== 'guest' && (
        <div className="space-y-3">
          <h2 className="font-extrabold text-xs flex items-center gap-1.5 uppercase tracking-wide text-stone-500 dark:text-neutral-400">
            <Building2 size={14} /> Organization
          </h2>

          {accessMode === 'authenticated-no-org' ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => navigate('/org-settings')}
                className="w-full bg-white dark:bg-neutral-900 rounded-2xl border border-stone-100 dark:border-neutral-850 p-4 text-left hover:border-[#038F8D] dark:hover:border-[#038F8D] transition shadow-xs group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">➕ Create Organization</h3>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">Set up a new organization</p>
                  </div>
                  <ChevronRight size={14} className="text-stone-400 dark:text-neutral-600 group-hover:text-[#038F8D] transition" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/join-org')}
                className="w-full bg-white dark:bg-neutral-900 rounded-2xl border border-stone-100 dark:border-neutral-850 p-4 text-left hover:border-[#038F8D] dark:hover:border-[#038F8D] transition shadow-xs group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">🔗 Join Organization</h3>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">Join with an invite code</p>
                  </div>
                  <ChevronRight size={14} className="text-stone-400 dark:text-neutral-600 group-hover:text-[#038F8D] transition" />
                </div>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/org-settings')}
              className="w-full bg-white dark:bg-neutral-900 rounded-2xl border border-stone-100 dark:border-neutral-850 p-4 text-left hover:border-[#038F8D] dark:hover:border-[#038F8D] transition shadow-xs group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">🏢 Organization Settings</h3>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">Manage organization & team</p>
                </div>
                <ChevronRight size={14} className="text-stone-400 dark:text-neutral-600 group-hover:text-[#038F8D] transition" />
              </div>
            </button>
          )}
        </div>
        )}

        {/* App Info */}
        <div className="space-y-3">
          <h2 className="font-extrabold text-xs flex items-center gap-1.5 uppercase tracking-wide text-stone-500 dark:text-neutral-400">
            <Zap size={14} /> App Information
          </h2>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-stone-100 dark:border-neutral-850 p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-neutral-800">
              <span className="text-[10px] text-stone-600 dark:text-stone-400 font-semibold">App Version</span>
              <span className="text-[10px] font-bold text-[#038F8D] dark:text-[#49D7D1]">1.0.0</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-stone-600 dark:text-stone-400 font-semibold">Storage Used</span>
              <span className="text-[10px] font-bold text-neutral-900 dark:text-white">12.5 MB</span>
            </div>
          </div>
        </div>

        {/* Logout Button - Authenticated Only */}
        {accessMode !== 'guest' && (
        <button
          onClick={handleLogout}
          className="w-full bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs py-3.5 rounded-2xl transition shadow-sm active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider"
        >
          <LogOut size={14} />
          <span>End Session</span>
        </button>
        )}
      </main>
    </div>
  );
};

export default MobileSettings;

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store/store';
import { logout } from '../store/slices/authSlice';
import { AppDispatch } from '../store/store';

const MobileHome: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const quickActions = [
    {
      id: 'checkin',
      icon: '✓',
      label: 'Check In',
      description: 'Update your status',
      color: 'bg-primary-teal',
      path: '/checkin',
    },
    {
      id: 'alerts',
      icon: '🔔',
      label: 'Alerts',
      description: 'View active alerts',
      color: 'bg-secondary-medium',
      path: '/alerts',
    },
    {
      id: 'kb',
      icon: '📚',
      label: 'Knowledge Base',
      description: 'Emergency guides',
      color: 'bg-secondary-dark',
      path: '/kb',
    },
    {
      id: 'contacts',
      icon: '👥',
      label: 'Contacts',
      description: 'Emergency contacts',
      color: 'bg-secondary-light',
      path: '/contacts',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'checkin',
      title: 'Last Check-In',
      time: '2 hours ago',
      status: 'Safe',
    },
    {
      id: 2,
      type: 'alert',
      title: 'Active Alert',
      time: 'Just now',
      status: 'Weather Warning',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-teal to-secondary-medium sticky top-0 z-40 shadow-md">
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-h2 text-primary-white">HR 360</h1>
            <p className="font-sans text-body3 text-secondary-light">
              Welcome, {user?.name?.split(' ')[0]}
            </p>
          </div>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="relative w-10 h-10 flex items-center justify-center rounded-full bg-secondary-light bg-opacity-20 hover:bg-opacity-30 transition"
          >
            <span className="text-primary-white text-xl">☰</span>
          </button>
        </div>

        {/* Mobile Menu */}
        {showMenu && (
          <div className="bg-secondary-dark border-t border-secondary-light border-opacity-20 px-4 py-3 space-y-2">
            <button
              onClick={() => navigate('/settings')}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary-light hover:bg-opacity-10 text-primary-white font-sans text-body2 transition"
            >
              ⚙️ Settings
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-error hover:bg-opacity-10 text-error font-sans text-body2 transition"
            >
              🚪 Logout
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 pb-24">
        {/* Status Card */}
        <div className="bg-primary-white rounded-2xl shadow-md p-6 mb-6 border-l-4 border-primary-teal">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sans text-h4 text-primary-black">Your Status</h2>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success bg-opacity-10">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              <span className="font-sans text-label2 text-success">Safe</span>
            </span>
          </div>
          <p className="font-sans text-body2 text-neutral-600 mb-4">
            Last updated 2 hours ago
          </p>
          <button
            onClick={() => navigate('/checkin')}
            className="w-full bg-primary-teal hover:bg-secondary-medium text-primary-white font-sans font-semibold py-3 rounded-lg transition"
          >
            Update Status
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="font-sans text-h5 text-primary-black mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => navigate(action.path)}
                className={`${action.color} rounded-xl p-4 text-primary-white shadow-md hover:shadow-lg transition transform hover:scale-105`}
              >
                <div className="text-3xl mb-2">{action.icon}</div>
                <h3 className="font-sans text-label1 font-semibold text-left">{action.label}</h3>
                <p className="font-sans text-body3 text-opacity-80 text-left mt-1">
                  {action.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="font-sans text-h5 text-primary-black mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="bg-primary-white rounded-lg p-4 shadow-sm border-l-4 border-primary-teal"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-sans text-label1 text-primary-black font-semibold">
                      {activity.title}
                    </h3>
                    <p className="font-sans text-body3 text-neutral-500 mt-1">
                      {activity.time}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-primary-teal bg-opacity-10 text-primary-teal font-sans text-label2 font-semibold">
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-primary-white border-t border-neutral-200 shadow-lg">
        <div className="flex items-center justify-around">
          {[
            { icon: '🏠', label: 'Home', path: '/' },
            { icon: '✓', label: 'Check In', path: '/checkin' },
            { icon: '📚', label: 'KB', path: '/kb' },
            { icon: '🔔', label: 'Alerts', path: '/alerts' },
            { icon: '⚙️', label: 'Settings', path: '/settings' },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex-1 flex flex-col items-center justify-center py-3 text-neutral-600 hover:text-primary-teal transition"
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="font-sans text-caption">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default MobileHome;

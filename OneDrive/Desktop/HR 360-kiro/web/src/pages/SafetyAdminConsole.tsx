import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { logout } from '../store/slices/authSlice';
import apiService from '../services/apiService';

interface CheckInAlert {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'safe' | 'need_help';
  timestamp: string;
  notes?: string;
  location?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  team?: string;
  position?: string;
}

const SafetyAdminConsole: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? saved === 'true' : false;
  });
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [checkInAlerts, setCheckInAlerts] = useState<CheckInAlert[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Apply dark mode on mount and when it changes
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      html.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [darkMode]);

  // Load safety data on mount
  useEffect(() => {
    loadSafetyData();
  }, []);

  const loadSafetyData = async () => {
    setLoading(true);
    try {
      // Fetch check-in alerts from team members
      try {
        const checkInsResponse = await apiService.getCheckIns({ pageSize: 100 });
        if (checkInsResponse.success && checkInsResponse.data) {
          const mappedAlerts: CheckInAlert[] = (checkInsResponse.data as any[]).map(checkin => ({
            id: checkin.id,
            userId: checkin.userId,
            userName: checkin.userName || 'Unknown User',
            userEmail: checkin.userEmail || checkin.email || 'unknown@email.com',
            status: checkin.status || 'safe',
            timestamp: checkin.createdAt || new Date().toISOString(),
            notes: checkin.notes,
            location: checkin.location,
          })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setCheckInAlerts(mappedAlerts);
        }
      } catch (err) {
        console.warn('Failed to fetch check-in alerts:', err);
      }

      // Fetch team members
      try {
        const usersResponse = await apiService.getOrganizationUsers({ pageSize: 100 });
        if (usersResponse.success && usersResponse.data) {
          const mappedMembers: TeamMember[] = (usersResponse.data as any[]).map(u => ({
            id: u.id,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
            email: u.email,
            team: u.team,
            position: u.position,
          }));
          setTeamMembers(mappedMembers);
        }
      } catch (err) {
        console.warn('Failed to fetch team members:', err);
      }
    } catch (error) {
      console.error('Failed to load safety data:', error);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  // Poll for check-in updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadSafetyData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    const html = document.documentElement;
    if (newDarkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  };

  const handleSignOut = () => {
    dispatch(logout());
  };

  const getNeedHelpAlerts = () => {
    return checkInAlerts.filter(alert => alert.status === 'need_help');
  };

  const getSafeAlerts = () => {
    return checkInAlerts.filter(alert => alert.status === 'safe');
  };

  if (!isInitialized || loading) {
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
          <h2>Loading Safety Admin Console...</h2>
          <p>Fetching team check-in status</p>
          <p style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
            (This may take a moment on first load)
          </p>
        </div>
      </div>
    );
  }

  // Check if user is authorized to access safety admin console
  if (!user || !['admin', 'safety_admin'].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  const needHelpAlerts = getNeedHelpAlerts();
  const safeAlerts = getSafeAlerts();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#038F8D]">Safety Admin Console</h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Monitor team member check-in status and safety alerts
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleToggleDarkMode}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                darkMode
                  ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border-l-4 border-[#038F8D]`}>
            <h3 className="text-lg font-semibold mb-2">Total Team Members</h3>
            <p className="text-4xl font-bold text-[#038F8D]">{teamMembers.length}</p>
          </div>
          <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border-l-4 border-green-500`}>
            <h3 className="text-lg font-semibold mb-2">Safe Check-ins</h3>
            <p className="text-4xl font-bold text-green-500">{safeAlerts.length}</p>
          </div>
          <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border-l-4 border-orange-500`}>
            <h3 className="text-lg font-semibold mb-2">Need Help Alerts</h3>
            <p className="text-4xl font-bold text-orange-500">{needHelpAlerts.length}</p>
          </div>
        </div>

        {/* Need Help Alerts Section */}
        {needHelpAlerts.length > 0 && (
          <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} mb-8 border-2 border-orange-500`}>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              Critical: Members Need Help ({needHelpAlerts.length})
            </h2>
            <div className="space-y-4">
              {needHelpAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-orange-50'} border border-orange-500 flex justify-between items-start`}
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{alert.userName}</h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {alert.userEmail}
                    </p>
                    {alert.notes && (
                      <p className={`text-sm mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <strong>Notes:</strong> {alert.notes}
                      </p>
                    )}
                    {alert.location && (
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        📍 {alert.location}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-semibold">
                      Need Help
                    </span>
                    <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Check-ins Section */}
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className="text-2xl font-bold mb-4">Recent Check-ins</h2>
          {checkInAlerts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Member Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Email</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Time</th>
                    <th className="px-4 py-3 text-left font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {checkInAlerts.slice(0, 20).map((alert, idx) => (
                    <tr
                      key={alert.id}
                      className={`border-t ${
                        darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">{alert.userName}</td>
                      <td className="px-4 py-3">{alert.userEmail}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            alert.status === 'safe'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                          }`}
                        >
                          {alert.status === 'safe' ? '✓ Safe' : '⚠️ Need Help'}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(alert.timestamp).toLocaleString()}
                      </td>
                      <td className={`px-4 py-3 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {alert.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {checkInAlerts.length > 20 && (
                <p className={`text-xs mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Showing 20 of {checkInAlerts.length} check-ins. Load more functionality coming soon.
                </p>
              )}
            </div>
          ) : (
            <div className={`p-8 text-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                No check-ins yet. Team members will appear here when they submit their status.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SafetyAdminConsole;

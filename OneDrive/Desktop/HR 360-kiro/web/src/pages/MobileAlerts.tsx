import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { setLoading, setError, setItems } from '../store/slices/alertSlice';
import apiService from '../services/apiService';

const MobileAlerts: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { items: reduxAlerts, loading, error } = useSelector((state: RootState) => state.alert);
  const { token } = useSelector((state: RootState) => state.auth);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  // Fetch alerts on mount and set up polling for real-time updates
  useEffect(() => {
    const fetchAlerts = async () => {
      dispatch(setLoading(true));
      try {
        const response = await apiService.getAlerts({ pageSize: 100 });
        if (response.success && response.data) {
          // Filter to only active alerts
          const activeAlerts = response.data.filter((alert: any) =>
            alert.isActive !== false && (!alert.resolved_at || new Date(alert.resolved_at) > new Date())
          );
          dispatch(setItems(activeAlerts));
        } else {
          dispatch(setError('Failed to load alerts'));
        }
      } catch (err) {
        console.error('Error fetching alerts:', err);
        // Silently fail - show empty list if backend is down
        dispatch(setItems([]));
      } finally {
        dispatch(setLoading(false));
      }
    };

    // Initial fetch
    fetchAlerts();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);

    return () => clearInterval(interval);
  }, [dispatch, token]);

  const alerts = reduxAlerts.length > 0 ? reduxAlerts : [];

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter((a) => a.severity === filter);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-error';
      case 'high':
        return 'bg-warning';
      case 'medium':
        return 'bg-info';
      case 'low':
        return 'bg-success';
      default:
        return 'bg-neutral-400';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return 'ℹ️';
      case 'low':
        return '✓';
      default:
        return '•';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'weather':
        return '🌤️';
      case 'volcanic':
        return '🌋';
      case 'disaster':
        return '🛡️';
      case 'infrastructure':
        return '🛣️';
      case 'drill':
        return '🚪';
      case 'system':
        return '⚙️';
      default:
        return '📢';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-40">
        <div className="px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-neutral-700"
          >
            ←
          </button>
          <div>
            <h1 className="font-display text-lg font-bold text-primary-black dark:text-white">Alerts</h1>
            <p className="font-sans text-xs text-neutral-500">
              {filteredAlerts.length} active alert{filteredAlerts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 pb-24 space-y-4">
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-sans text-xs font-bold whitespace-nowrap uppercase tracking-wider transition ${
                filter === f
                  ? 'bg-primary-teal text-white'
                  : 'bg-white dark:bg-neutral-900 text-neutral-600 border border-neutral-200 dark:border-neutral-700 hover:border-primary-teal'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">⏳</div>
            <p className="font-sans text-sm text-neutral-600">Loading alerts...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">❌</div>
            <p className="font-sans text-sm text-neutral-600">{error}</p>
          </div>
        ) : filteredAlerts.length > 0 ? (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white dark:bg-neutral-900 rounded-lg shadow-sm hover:shadow-md transition border-l-4 ${
                  alert.severity === 'critical'
                    ? 'border-error'
                    : alert.severity === 'high'
                    ? 'border-warning'
                    : alert.severity === 'medium'
                    ? 'border-info'
                    : 'border-success'
                }`}
              >
                <div className="p-4">
                  {/* Alert Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                        alert.severity === 'critical'
                          ? 'bg-error text-white'
                          : alert.severity === 'high'
                          ? 'bg-warning text-white'
                          : alert.severity === 'medium'
                          ? 'bg-info text-white'
                          : 'bg-success text-white'
                      }`}
                    >
                      {alert.severity === 'critical' && '🚨'}
                      {alert.severity === 'high' && '⚠️'}
                      {alert.severity === 'medium' && 'ℹ️'}
                      {alert.severity === 'low' && '✓'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-sans text-sm font-bold text-primary-black dark:text-white">
                        {alert.title}
                      </h3>
                      <p className="font-sans text-xs text-neutral-500 mt-0.5">
                        {getTimeAgo(alert.startTime)}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded flex-shrink-0 ${
                        alert.severity === 'critical'
                          ? 'bg-error text-white'
                          : alert.severity === 'high'
                          ? 'bg-warning text-white'
                          : alert.severity === 'medium'
                          ? 'bg-info text-white'
                          : 'bg-success text-white'
                      }`}
                    >
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>

                  {/* Alert Description */}
                  <p className="font-sans text-xs text-neutral-700 mb-3">
                    {alert.description}
                  </p>

                  {/* Alert Type Badge */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 rounded font-sans text-xs text-neutral-600 font-semibold">
                      {getTypeIcon(alert.type)} {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                    </span>
                    <button className="text-primary-teal hover:text-primary-teal/80 text-xs font-bold transition">
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">✓</div>
            <h3 className="font-sans text-sm font-bold text-primary-black dark:text-white mb-1">No Alerts</h3>
            <p className="font-sans text-xs text-neutral-600">
              You're all caught up! No {filter !== 'all' ? filter + ' ' : ''}alerts at the moment.
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-primary-teal bg-opacity-5 rounded-lg p-3 border border-primary-teal border-opacity-20">
          <p className="font-sans text-xs text-primary-black dark:text-white">
            <strong>🔔 Notifications:</strong> Enable in settings to receive real-time alerts.
          </p>
        </div>
      </main>
    </div>
  );
};

export default MobileAlerts;


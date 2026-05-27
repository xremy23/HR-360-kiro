import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { setLoading, setError, setItems } from '../store/slices/alertSlice';

const MobileAlerts: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { items: reduxAlerts, loading, error } = useSelector((state: RootState) => state.alert);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  // Fetch alerts on mount
  useEffect(() => {
    const fetchAlerts = async () => {
      dispatch(setLoading(true));
      try {
        // TODO: Replace with actual API call
        // const response = await apiService.getAlerts();
        // if (response.success) {
        //   dispatch(setItems(response.data));
        // } else {
        //   dispatch(setError('Failed to load alerts'));
        // }
        
        // Mock alerts for demo
        const mockAlerts = [
          {
            id: '1',
            title: 'Severe Weather Warning',
            description: 'Tornado warning in effect until 6:00 PM',
            severity: 'critical' as const,
            type: 'weather' as const,
            startTime: new Date(Date.now() - 30 * 60000).toISOString(),
            isActive: true,
            createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
          },
          {
            id: '2',
            title: 'Building Evacuation Drill',
            description: 'Scheduled evacuation drill at 2:00 PM',
            severity: 'high' as const,
            type: 'drill' as const,
            startTime: new Date(Date.now() - 2 * 60000).toISOString(),
            isActive: true,
            createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
          },
          {
            id: '3',
            title: 'System Maintenance',
            description: 'Scheduled maintenance window tonight',
            severity: 'medium' as const,
            type: 'system' as const,
            startTime: new Date(Date.now() - 5 * 60000).toISOString(),
            isActive: true,
            createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
          },
        ];
        dispatch(setItems(mockAlerts));
      } catch (err) {
        dispatch(setError((err as any).message || 'Failed to load alerts'));
      }
    };

    fetchAlerts();
  }, [dispatch]);

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
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-teal to-secondary-medium sticky top-0 z-40 shadow-md">
        <div className="px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary-light hover:bg-opacity-20 transition text-primary-white"
          >
            ←
          </button>
          <div>
            <h1 className="font-display text-h3 text-primary-white">Alerts</h1>
            <p className="font-sans text-body3 text-secondary-light">
              {filteredAlerts.length} active alert{filteredAlerts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 pb-24">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full font-sans text-label2 font-semibold whitespace-nowrap transition ${
                filter === f
                  ? 'bg-primary-teal text-primary-white'
                  : 'bg-primary-white text-primary-black border-2 border-neutral-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

      {/* Alerts List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-2xl mb-4">⏳</div>
            <h3 className="font-sans text-h4 text-primary-black mb-2">Loading Alerts</h3>
            <p className="font-sans text-body2 text-neutral-600">Please wait...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-2xl mb-4">❌</div>
            <h3 className="font-sans text-h4 text-primary-black mb-2">Error</h3>
            <p className="font-sans text-body2 text-neutral-600">{error}</p>
          </div>
        ) : filteredAlerts.length > 0 ? (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-primary-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition border-l-4"
                style={{
                  borderLeftColor: getSeverityColor(alert.severity).replace('bg-', '#'),
                }}
              >
                <div className="p-4">
                  {/* Alert Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`${getSeverityColor(alert.severity)} text-primary-white rounded-lg w-10 h-10 flex items-center justify-center text-lg flex-shrink-0`}>
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-sans text-label1 text-primary-black font-semibold">
                        {alert.title}
                      </h3>
                      <p className="font-sans text-body3 text-neutral-500 mt-1">
                        {getTimeAgo(alert.startTime)}
                      </p>
                    </div>
                    <span className={`${getSeverityColor(alert.severity)} text-primary-white px-2 py-1 rounded text-caption font-semibold flex-shrink-0`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>

                  {/* Alert Description */}
                  <p className="font-sans text-body2 text-neutral-700 mb-3">
                    {alert.description}
                  </p>

                  {/* Alert Type Badge */}
                  <div className="flex items-center gap-2">
                    <span className="inline-block px-3 py-1 bg-neutral-100 rounded-full font-sans text-caption text-neutral-600">
                      {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="bg-neutral-50 px-4 py-3 border-t border-neutral-200">
                  <button className="w-full text-primary-teal font-sans text-label1 font-semibold hover:text-secondary-medium transition">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">✓</div>
            <h3 className="font-sans text-h4 text-primary-black mb-2">No Alerts</h3>
            <p className="font-sans text-body2 text-neutral-600">
              You're all caught up! No {filter !== 'all' ? filter + ' ' : ''}alerts at the moment.
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-secondary-light bg-opacity-10 rounded-lg p-4 border border-secondary-light border-opacity-30">
          <p className="font-sans text-body3 text-primary-black">
            <strong>🔔 Notifications:</strong> Enable notifications in settings to receive real-time alerts.
          </p>
        </div>
      </main>
    </div>
  );
};

export default MobileAlerts;

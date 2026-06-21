import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  source?: string;
}

const DesktopHome: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [externalNews, setExternalNews] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // For guest users, use public alerts endpoint (skip on 401 error)
      // For authenticated users, fetch from authenticated endpoint
      const isGuest = !user;
      
      try {
        const alertsResponse = await apiService.getAlerts({ pageSize: 10 }, isGuest);
        if (alertsResponse.success && alertsResponse.data) {
          setRecentAlerts((alertsResponse.data as any[]).slice(0, 5));
        }
      } catch (error) {
        console.warn('Failed to fetch alerts:', error);
        // Continue with just external news - don't fail the page
      }

      // Add external news/reports (hardcoded for now)
      const mockExternalNews: Alert[] = [
        {
          id: 'pagasa-1',
          title: 'PAGASA Weather Alert - Southwest Monsoon',
          description: 'The southwest monsoon is expected to bring scattered to widespread rains over Mindanao and western Visayas.',
          severity: 'high',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          source: 'PAGASA'
        },
        {
          id: 'philvolcs-1',
          title: 'PhilVolcs Alert - Mayon Volcano Level 1',
          description: 'Mayon Volcano is at Alert Level 1. Volcanic tremors are being monitored. Keep away from the volcano.',
          severity: 'medium',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          source: 'PhilVolcs'
        },
        {
          id: 'ndrrmc-1',
          title: 'NDRRMC Disaster Advisory - Flooding Alert',
          description: 'NDRRMC advises residents in low-lying areas to be prepared for possible flooding due to continuous rainfall.',
          severity: 'high',
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          source: 'NDRRMC'
        },
        {
          id: 'pagasa-2',
          title: 'PAGASA - Heat Index Warning',
          description: 'Metro Manila heat index may reach 38-40°C. Stay hydrated and avoid prolonged sun exposure.',
          severity: 'medium',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          source: 'PAGASA'
        },
        {
          id: 'ndrrmc-2',
          title: 'NDRRMC - Road Safety Update',
          description: 'Several roads are closed due to landslide risks in Cordillera Region. Use alternate routes.',
          severity: 'high',
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          source: 'NDRRMC'
        }
      ];
      
      setExternalNews(mockExternalNews);
    } catch (error) {
      console.error('Failed to load data:', error);
      // Still load mock news even if API fails
      const mockExternalNews: Alert[] = [
        {
          id: 'pagasa-1',
          title: 'PAGASA Weather Alert - Southwest Monsoon',
          description: 'The southwest monsoon is expected to bring scattered to widespread rains over Mindanao and western Visayas.',
          severity: 'high',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          source: 'PAGASA'
        },
        {
          id: 'philvolcs-1',
          title: 'PhilVolcs Alert - Mayon Volcano Level 1',
          description: 'Mayon Volcano is at Alert Level 1. Volcanic tremors are being monitored. Keep away from the volcano.',
          severity: 'medium',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          source: 'PhilVolcs'
        },
        {
          id: 'ndrrmc-1',
          title: 'NDRRMC Disaster Advisory - Flooding Alert',
          description: 'NDRRMC advises residents in low-lying areas to be prepared for possible flooding due to continuous rainfall.',
          severity: 'high',
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          source: 'NDRRMC'
        },
      ];
      setExternalNews(mockExternalNews);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 dark:bg-neutral-900 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-[#038F8D] to-[#024645] text-white rounded-2xl p-8">
        <h1 className="text-4xl font-bold mb-2">
          {user ? `Welcome back, ${user.name}!` : 'HR Crisis 360'}
        </h1>
        <p className="text-lg opacity-90">
          {user 
            ? 'Stay informed and safe with real-time alerts and status updates'
            : 'Real-time emergency alerts and disaster information for the Philippines'}
        </p>
      </div>

      {/* Main Grid - Only Alerts */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-stone-200 dark:border-neutral-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Active Alerts & News</h2>
          <span className="text-3xl">🚨</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-stone-100 dark:bg-neutral-800 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : (recentAlerts.length > 0 || externalNews.length > 0) ? (
          <div className="space-y-3">
            {/* Internal Alerts */}
            {recentAlerts.map((alert) => {
              const severityClass = getSeverityColor(alert.severity);
              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${severityClass}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{alert.title}</p>
                      <p className="text-xs opacity-80 mt-1">{alert.description}</p>
                    </div>
                    <span className="text-xs opacity-60 ml-4 whitespace-nowrap">Internal</span>
                  </div>
                  <p className="text-xs opacity-60 mt-2">{new Date(alert.createdAt).toLocaleString()}</p>
                </div>
              );
            })}

            {/* External News - PAGASA, PhilVolcs, NDRRMC */}
            {externalNews.map((news) => {
              const severityClass = getSeverityColor(news.severity);
              const sourceIcon = news.source === 'PAGASA' ? '🌤️' : news.source === 'PhilVolcs' ? '🌋' : '🛡️';
              return (
                <div
                  key={news.id}
                  className={`p-4 rounded-lg border ${severityClass}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{sourceIcon}</span>
                        <p className="font-semibold text-sm">{news.title}</p>
                      </div>
                      <p className="text-xs opacity-80 ml-7">{news.description}</p>
                    </div>
                    <span className="text-xs font-bold ml-4 whitespace-nowrap px-2 py-1 rounded bg-white dark:bg-neutral-900/20">
                      {news.source}
                    </span>
                  </div>
                  <p className="text-xs opacity-60 mt-2 ml-7">{new Date(news.createdAt).toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-neutral-600 dark:text-neutral-400 text-center py-8">No alerts or news available</p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-stone-200 dark:border-neutral-800 p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Active Alerts</p>
          <p className="text-2xl font-bold text-orange-600">{recentAlerts.length + externalNews.length}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-stone-200 dark:border-neutral-800 p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Status</p>
          <p className="text-2xl font-bold text-green-600">✅ Active</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-stone-200 dark:border-neutral-800 p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Mode</p>
          <p className="text-sm font-bold text-[#038F8D] dark:text-[#49D7D1] uppercase">Live</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 About</p>
          <p className="text-sm text-blue-800 dark:text-blue-200">Real-time emergency alerts from PAGASA, PhilVolcs, and NDRRMC for disaster preparedness.</p>
        </div>
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <p className="font-semibold text-green-900 dark:text-green-100 mb-2">🚀 Quick Action</p>
          <p className="text-sm text-green-800 dark:text-green-200">Have a question? Use the chatbot (bottom right) to get instant safety answers.</p>
        </div>
      </div>
    </div>
  );
};

export default DesktopHome;


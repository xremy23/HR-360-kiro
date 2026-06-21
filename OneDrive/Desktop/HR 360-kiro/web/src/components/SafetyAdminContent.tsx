import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Clock, MapPin } from 'lucide-react';

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

interface SafetyAdminContentProps {
  alerts: CheckInAlert[];
  darkMode: boolean;
  onRefresh: () => void;
}

export function SafetyAdminContent({
  alerts,
  darkMode,
  onRefresh,
}: SafetyAdminContentProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'need_help' | 'safe'>('all');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const getNeedHelpAlerts = () => alerts.filter(a => a.status === 'need_help');
  const getSafeAlerts = () => alerts.filter(a => a.status === 'safe');

  const filteredAlerts = (() => {
    switch (activeFilter) {
      case 'need_help':
        return getNeedHelpAlerts();
      case 'safe':
        return getSafeAlerts();
      default:
        return alerts;
    }
  })();

  const handleRefresh = () => {
    onRefresh();
    setLastRefresh(new Date());
  };

  return (
    <div className={`p-6 rounded-2xl border ${
      darkMode ? 'bg-[#121416] border-neutral-800' : 'bg-white border-stone-200'
    } space-y-6`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#038F8D]">Check-in Alert Dashboard</h2>
          <p className={`text-xs mt-1 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 rounded-lg bg-[#038F8D] hover:bg-[#02706e] text-white font-semibold text-xs transition"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-neutral-900' : 'bg-stone-50'} border ${darkMode ? 'border-neutral-800' : 'border-stone-200'}`}>
          <p className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
            Total Check-ins
          </p>
          <p className="text-3xl font-bold text-[#038F8D] mt-2">{alerts.length}</p>
        </div>
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-neutral-900' : 'bg-stone-50'} border border-green-500 border-opacity-30`}>
          <p className={`text-xs font-bold uppercase tracking-wider text-green-600`}>
            Safe
          </p>
          <p className="text-3xl font-bold text-green-600 mt-2">{getSafeAlerts().length}</p>
        </div>
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-neutral-900' : 'bg-stone-50'} border border-orange-500 border-opacity-30`}>
          <p className={`text-xs font-bold uppercase tracking-wider text-orange-600`}>
            Need Help
          </p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{getNeedHelpAlerts().length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeFilter === 'all'
              ? 'bg-[#038F8D]/15 text-[#038F8D] border border-[#038F8D]/30'
              : `border ${darkMode ? 'border-neutral-800 text-stone-400' : 'border-stone-200 text-stone-600'}`
          }`}
        >
          All ({alerts.length})
        </button>
        <button
          onClick={() => setActiveFilter('need_help')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeFilter === 'need_help'
              ? 'bg-orange-500/15 text-orange-600 border border-orange-500/30'
              : `border ${darkMode ? 'border-neutral-800 text-stone-400' : 'border-stone-200 text-stone-600'}`
          }`}
        >
          ⚠️ Need Help ({getNeedHelpAlerts().length})
        </button>
        <button
          onClick={() => setActiveFilter('safe')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeFilter === 'safe'
              ? 'bg-green-500/15 text-green-600 border border-green-500/30'
              : `border ${darkMode ? 'border-neutral-800 text-stone-400' : 'border-stone-200 text-stone-600'}`
          }`}
        >
          ✓ Safe ({getSafeAlerts().length})
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border flex items-start gap-4 ${
                alert.status === 'need_help'
                  ? darkMode
                    ? 'bg-orange-900/20 border-orange-700'
                    : 'bg-orange-50 border-orange-200'
                  : darkMode
                    ? 'bg-green-900/20 border-green-700'
                    : 'bg-green-50 border-green-200'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {alert.status === 'need_help' ? (
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-sm">{alert.userName}</h4>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    alert.status === 'need_help'
                      ? 'bg-orange-600 text-white'
                      : 'bg-green-600 text-white'
                  }`}>
                    {alert.status === 'need_help' ? 'Need Help' : 'Safe'}
                  </span>
                </div>
                <p className={`text-xs ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                  {alert.userEmail}
                </p>
                {alert.notes && (
                  <p className={`text-xs mt-2 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                    <strong>Notes:</strong> {alert.notes}
                  </p>
                )}
                {alert.location && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                    <MapPin className="w-3 h-3" />
                    {alert.location}
                  </p>
                )}
                <p className={`text-xs mt-2 flex items-center gap-1 ${darkMode ? 'text-stone-500' : 'text-stone-500'}`}>
                  <Clock className="w-3 h-3" />
                  {new Date(alert.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className={`p-6 text-center rounded-lg ${darkMode ? 'bg-neutral-900' : 'bg-stone-50'}`}>
            <p className={darkMode ? 'text-stone-400' : 'text-stone-600'}>
              {activeFilter === 'all'
                ? 'No check-ins yet'
                : activeFilter === 'need_help'
                ? 'No members need help'
                : 'No safe check-ins yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Dashboard Page - Main console view for admins/HR
 * Shows real-time incident status, check-ins, and alerts
 */

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { setLoading as setAlertLoading, setError as setAlertError, setItems as setAlertItems, addAlert } from '../store/slices/alertSlice';
import { setLoading as setCheckInLoading, setError as setCheckInError, setItems as setCheckInItems, addCheckIn } from '../store/slices/checkinSlice';
import { setLoading as setIncidentLoading, setError as setIncidentError, setItems as setIncidentItems, addIncident } from '../store/slices/incidentSlice';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';
import websocketService from '../services/websocketService';
import apiService, { ApiError } from '../services/apiService';
import IncidentCard from '../components/IncidentCard';
import CheckInSummary from '../components/CheckInSummary';
import AlertPanel from '../components/AlertPanel';
import LiveActivityFeed from '../components/LiveActivityFeed';

interface DashboardStats {
  activeIncidents: number;
  totalCheckIns: number;
  pendingSOS: number;
  responseRate: number;
}

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const alertData = useSelector((state: RootState) => state.alert);
  const checkInData = useSelector((state: RootState) => state.checkin);
  
  const [stats, setStats] = useState<DashboardStats>({
    activeIncidents: 0,
    totalCheckIns: 0,
    pendingSOS: 0,
    responseRate: 0,
  });
  const [incidents, setIncidents] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(false);

  // Fetch alerts, check-ins, and incidents on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch alerts
        dispatch(setAlertLoading(true));
        const alertsResponse = await apiService.getAlerts({ pageSize: 100 });
        if (alertsResponse.success && alertsResponse.data) {
          dispatch(setAlertItems(alertsResponse.data));
        } else {
          dispatch(setAlertError('Failed to load alerts'));
        }

        // Fetch check-ins
        dispatch(setCheckInLoading(true));
        const checkInsResponse = await apiService.getCheckIns({ pageSize: 100 });
        if (checkInsResponse.success && checkInsResponse.data) {
          dispatch(setCheckInItems(checkInsResponse.data));
        } else {
          dispatch(setCheckInError('Failed to load check-ins'));
        }

        // Fetch incidents
        dispatch(setIncidentLoading(true));
        const incidentsResponse = await apiService.getIncidents({ pageSize: 100 });
        if (incidentsResponse.success && incidentsResponse.data) {
          dispatch(setIncidentItems(incidentsResponse.data));
          setIncidents(incidentsResponse.data);
          setStats((prev) => ({
            ...prev,
            activeIncidents: incidentsResponse.data.filter((i: any) => i.status === 'active').length,
          }));
        } else {
          dispatch(setIncidentError('Failed to load incidents'));
        }
      } catch (error) {
        const apiError = error as ApiError;
        dispatch(setAlertError(apiError.message || 'Failed to load alerts'));
        dispatch(setCheckInError(apiError.message || 'Failed to load check-ins'));
        dispatch(setIncidentError(apiError.message || 'Failed to load incidents'));
      }
    };

    fetchData();
  }, [dispatch]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribeIncident = websocketService.on('incident:created', (data) => {
      setIncidents((prev) => [data, ...prev]);
      setStats((prev) => ({ ...prev, activeIncidents: prev.activeIncidents + 1 }));
    });

    const unsubscribeAlert = websocketService.on('alert:created', (data) => {
      dispatch(addAlert(data));
    });

    const unsubscribeCheckIn = websocketService.on('checkin:created', (data) => {
      dispatch(addCheckIn(data));
      setStats((prev) => ({ ...prev, totalCheckIns: prev.totalCheckIns + 1 }));
    });

    const unsubscribeSOS = websocketService.on('sos:created', (data) => {
      setStats((prev) => ({ ...prev, pendingSOS: prev.pendingSOS + 1 }));
    });

    const unsubscribeConnected = websocketService.on('connected', () => {
      setIsLive(true);
    });

    const unsubscribeDisconnected = websocketService.on('disconnected', () => {
      setIsLive(false);
    });

    return () => {
      unsubscribeIncident();
      unsubscribeAlert();
      unsubscribeCheckIn();
      unsubscribeSOS();
      unsubscribeConnected();
      unsubscribeDisconnected();
    };
  }, [dispatch]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.primary.white,
        padding: spacing.xl,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.xxl,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: typography.fontSize.display2.size,
              fontWeight: typography.fontSize.display2.weight,
              color: colors.primary.black,
              margin: 0,
              marginBottom: spacing.sm,
            }}
          >
            Crisis Dashboard
          </h1>
          <p
            style={{
              fontSize: typography.fontSize.body2.size,
              color: colors.neutral[500],
              margin: 0,
            }}
          >
            Real-time emergency management console
          </p>
        </div>

        {/* Live Status Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
            padding: `${spacing.md} ${spacing.lg}`,
            backgroundColor: isLive ? colors.success : colors.error,
            borderRadius: borderRadius.full,
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: borderRadius.full,
              backgroundColor: colors.primary.white,
              animation: isLive ? 'pulse 2s infinite' : 'none',
            }}
          />
          <span
            style={{
              fontSize: typography.fontSize.label2.size,
              fontWeight: typography.fontSize.label2.weight,
              color: colors.primary.white,
            }}
          >
            {isLive ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: spacing.lg,
          marginBottom: spacing.xxl,
        }}
      >
        <StatCard
          label="Active Incidents"
          value={stats.activeIncidents}
          color={colors.error}
        />
        <StatCard
          label="Check-Ins"
          value={stats.totalCheckIns}
          color={colors.primary.teal}
        />
        <StatCard
          label="Pending SOS"
          value={stats.pendingSOS}
          color={colors.warning}
        />
        <StatCard
          label="Response Rate"
          value={`${stats.responseRate}%`}
          color={colors.success}
        />
      </div>

      {/* Main Content Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: spacing.xl,
          marginBottom: spacing.xxl,
        }}
      >
        {/* Left Column - Incidents and Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
          {/* Active Incidents */}
          <div>
            <h2
              style={{
                fontSize: typography.fontSize.h2.size,
                fontWeight: typography.fontSize.h2.weight,
                color: colors.primary.black,
                marginBottom: spacing.lg,
              }}
            >
              Active Incidents
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              {incidents.length > 0 ? (
                incidents.map((incident) => (
                  <IncidentCard key={incident.id} incident={incident} />
                ))
              ) : (
                <div
                  style={{
                    padding: spacing.xl,
                    backgroundColor: colors.neutral[50],
                    borderRadius: borderRadius.md,
                    textAlign: 'center',
                    color: colors.neutral[500],
                  }}
                >
                  No active incidents
                </div>
              )}
            </div>
          </div>

          {/* Alerts */}
          <div>
            <h2
              style={{
                fontSize: typography.fontSize.h2.size,
                fontWeight: typography.fontSize.h2.weight,
                color: colors.primary.black,
                marginBottom: spacing.lg,
              }}
            >
              Recent Alerts
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              {alertData.loading ? (
                <div
                  style={{
                    padding: spacing.xl,
                    backgroundColor: colors.neutral[50],
                    borderRadius: borderRadius.md,
                    textAlign: 'center',
                    color: colors.neutral[500],
                  }}
                >
                  Loading alerts...
                </div>
              ) : alertData.error ? (
                <div
                  style={{
                    padding: spacing.xl,
                    backgroundColor: colors.error,
                    borderRadius: borderRadius.md,
                    textAlign: 'center',
                    color: colors.primary.white,
                  }}
                >
                  {alertData.error}
                </div>
              ) : alertData.items.length > 0 ? (
                alertData.items.slice(0, 3).map((alert) => (
                  <AlertPanel key={alert.id} alert={alert} />
                ))
              ) : (
                <div
                  style={{
                    padding: spacing.xl,
                    backgroundColor: colors.neutral[50],
                    borderRadius: borderRadius.md,
                    textAlign: 'center',
                    color: colors.neutral[500],
                  }}
                >
                  No recent alerts
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Activity Feed */}
        <div>
          <h2
            style={{
              fontSize: typography.fontSize.h2.size,
              fontWeight: typography.fontSize.h2.weight,
              color: colors.primary.black,
              marginBottom: spacing.lg,
            }}
          >
            Live Activity
          </h2>
          <LiveActivityFeed />
        </div>
      </div>

      {/* Check-In Summary */}
      <div>
        <h2
          style={{
            fontSize: typography.fontSize.h2.size,
            fontWeight: typography.fontSize.h2.weight,
            color: colors.primary.black,
            marginBottom: spacing.lg,
          }}
        >
          Check-In Summary
        </h2>
        <CheckInSummary />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => (
  <div
    style={{
      padding: spacing.lg,
      backgroundColor: colors.primary.white,
      border: `2px solid ${color}`,
      borderRadius: borderRadius.md,
      boxShadow: shadows.sm,
    }}
  >
    <p
      style={{
        fontSize: typography.fontSize.body2.size,
        color: colors.neutral[600],
        margin: 0,
        marginBottom: spacing.sm,
      }}
    >
      {label}
    </p>
    <p
      style={{
        fontSize: typography.fontSize.display3.size,
        fontWeight: typography.fontSize.display3.weight,
        color: color,
        margin: 0,
      }}
    >
      {value}
    </p>
  </div>
);

export default Dashboard;

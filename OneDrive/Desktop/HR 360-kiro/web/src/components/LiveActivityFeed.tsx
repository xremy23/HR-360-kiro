/**
 * Live Activity Feed Component
 * Displays real-time activity stream
 */

import React, { useState, useEffect } from 'react';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';
import websocketService from '../services/websocketService';

interface Activity {
  id: string;
  type: 'incident' | 'alert' | 'checkin' | 'sos';
  action: string;
  timestamp: string;
  details: string;
}

const LiveActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const unsubscribeIncident = websocketService.on('incident:created', (data) => {
      addActivity({
        type: 'incident',
        action: 'Incident Created',
        details: `${data.type} - ${data.severity}`,
      });
    });

    const unsubscribeAlert = websocketService.on('alert:created', (data) => {
      addActivity({
        type: 'alert',
        action: 'Alert Broadcast',
        details: data.title,
      });
    });

    const unsubscribeCheckIn = websocketService.on('checkin:created', (data) => {
      addActivity({
        type: 'checkin',
        action: 'Check-In Received',
        details: `Status: ${data.status}`,
      });
    });

    const unsubscribeSOS = websocketService.on('sos:created', (data) => {
      addActivity({
        type: 'sos',
        action: 'SOS Triggered',
        details: 'Immediate assistance needed',
      });
    });

    return () => {
      unsubscribeIncident();
      unsubscribeAlert();
      unsubscribeCheckIn();
      unsubscribeSOS();
    };
  }, []);

  const addActivity = (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity: Activity = {
      ...activity,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => [newActivity, ...prev].slice(0, 10)); // Keep last 10
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'incident':
        return colors.error;
      case 'alert':
        return colors.warning;
      case 'checkin':
        return colors.success;
      case 'sos':
        return colors.error;
      default:
        return colors.neutral[400];
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'incident':
        return '🚨';
      case 'alert':
        return '📢';
      case 'checkin':
        return '✓';
      case 'sos':
        return '🆘';
      default:
        return '•';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div
      style={{
        padding: spacing.lg,
        backgroundColor: colors.primary.white,
        border: `1px solid ${colors.neutral[200]}`,
        borderRadius: borderRadius.md,
        boxShadow: shadows.md,
        maxHeight: '500px',
        overflowY: 'auto',
      }}
    >
      {activities.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {activities.map((activity) => (
            <div
              key={activity.id}
              style={{
                display: 'flex',
                gap: spacing.md,
                paddingBottom: spacing.md,
                borderBottom: `1px solid ${colors.neutral[100]}`,
              }}
            >
              <div
                style={{
                  fontSize: '20px',
                  minWidth: '24px',
                  textAlign: 'center',
                }}
              >
                {getActivityIcon(activity.type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: typography.fontSize.label1.size,
                    fontWeight: typography.fontSize.label1.weight,
                    color: colors.primary.black,
                    margin: 0,
                    marginBottom: spacing.xs,
                  }}
                >
                  {activity.action}
                </p>
                <p
                  style={{
                    fontSize: typography.fontSize.body3.size,
                    color: colors.neutral[600],
                    margin: 0,
                    marginBottom: spacing.xs,
                    wordBreak: 'break-word',
                  }}
                >
                  {activity.details}
                </p>
                <p
                  style={{
                    fontSize: typography.fontSize.caption.size,
                    color: colors.neutral[500],
                    margin: 0,
                  }}
                >
                  {formatTime(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: spacing.xl,
            textAlign: 'center',
            color: colors.neutral[500],
          }}
        >
          <p
            style={{
              fontSize: typography.fontSize.body2.size,
              margin: 0,
            }}
          >
            Waiting for activity...
          </p>
        </div>
      )}

      <style>{`
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: ${colors.neutral[100]};
          border-radius: ${borderRadius.full};
        }
        div::-webkit-scrollbar-thumb {
          background: ${colors.neutral[300]};
          border-radius: ${borderRadius.full};
        }
        div::-webkit-scrollbar-thumb:hover {
          background: ${colors.neutral[400]};
        }
      `}</style>
    </div>
  );
};

export default LiveActivityFeed;

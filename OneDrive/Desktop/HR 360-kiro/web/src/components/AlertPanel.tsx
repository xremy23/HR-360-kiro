/**
 * Alert Panel Component
 * Displays alert information with severity indicator
 */

import React from 'react';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';

interface AlertPanelProps {
  alert: {
    id: string;
    title: string;
    message: string;
    severity: 'advisory' | 'watch' | 'emergency';
    createdAt: string;
    isDrill: boolean;
  };
}

const AlertPanel: React.FC<AlertPanelProps> = ({ alert }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'emergency':
        return colors.error;
      case 'watch':
        return colors.warning;
      case 'advisory':
        return colors.info;
      default:
        return colors.neutral[400];
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div
      style={{
        padding: spacing.lg,
        backgroundColor: colors.primary.white,
        border: `1px solid ${colors.neutral[200]}`,
        borderLeft: `4px solid ${getSeverityColor(alert.severity)}`,
        borderRadius: borderRadius.md,
        boxShadow: shadows.sm,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
        <div>
          <h4
            style={{
              fontSize: typography.fontSize.h5.size,
              fontWeight: typography.fontSize.h5.weight,
              color: colors.primary.black,
              margin: 0,
              marginBottom: spacing.xs,
            }}
          >
            {alert.title}
          </h4>
          <p
            style={{
              fontSize: typography.fontSize.body3.size,
              color: colors.neutral[600],
              margin: 0,
              lineHeight: '1.5',
            }}
          >
            {alert.message}
          </p>
        </div>
        {alert.isDrill && (
          <span
            style={{
              padding: `${spacing.xs} ${spacing.sm}`,
              backgroundColor: colors.info,
              color: colors.primary.white,
              borderRadius: borderRadius.sm,
              fontSize: typography.fontSize.label2.size,
              fontWeight: typography.fontSize.label2.weight,
              whiteSpace: 'nowrap',
              marginLeft: spacing.md,
            }}
          >
            DRILL
          </span>
        )}
      </div>

      <p
        style={{
          fontSize: typography.fontSize.caption.size,
          color: colors.neutral[500],
          margin: 0,
        }}
      >
        {formatTime(alert.createdAt)}
      </p>
    </div>
  );
};

export default AlertPanel;

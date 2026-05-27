/**
 * Check-In Summary Component
 * Displays check-in statistics and status breakdown
 */

import React, { useState, useEffect } from 'react';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';
import websocketService from '../services/websocketService';

interface CheckInStats {
  total: number;
  safe: number;
  needHelp: number;
  sos: number;
  unaccounted: number;
}

const CheckInSummary: React.FC = () => {
  const [stats, setStats] = useState<CheckInStats>({
    total: 0,
    safe: 0,
    needHelp: 0,
    sos: 0,
    unaccounted: 0,
  });

  useEffect(() => {
    const unsubscribe = websocketService.on('checkin:created', (data) => {
      setStats((prev) => {
        const updated = { ...prev, total: prev.total + 1 };
        if (data.status === 'safe') updated.safe++;
        else if (data.status === 'need_help') updated.needHelp++;
        else if (data.status === 'sos') updated.sos++;
        else if (data.status === 'unaccounted') updated.unaccounted++;
        return updated;
      });
    });

    return () => unsubscribe();
  }, []);

  const getPercentage = (value: number) => {
    if (stats.total === 0) return 0;
    return Math.round((value / stats.total) * 100);
  };

  return (
    <div
      style={{
        padding: spacing.xl,
        backgroundColor: colors.primary.white,
        border: `1px solid ${colors.neutral[200]}`,
        borderRadius: borderRadius.md,
        boxShadow: shadows.md,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: spacing.lg,
        }}
      >
        <StatusItem
          label="Safe"
          value={stats.safe}
          percentage={getPercentage(stats.safe)}
          color={colors.success}
        />
        <StatusItem
          label="Need Help"
          value={stats.needHelp}
          percentage={getPercentage(stats.needHelp)}
          color={colors.warning}
        />
        <StatusItem
          label="SOS"
          value={stats.sos}
          percentage={getPercentage(stats.sos)}
          color={colors.error}
        />
        <StatusItem
          label="Unaccounted"
          value={stats.unaccounted}
          percentage={getPercentage(stats.unaccounted)}
          color={colors.neutral[400]}
        />
      </div>

      {/* Progress Bar */}
      <div style={{ marginTop: spacing.xl }}>
        <div
          style={{
            display: 'flex',
            height: '8px',
            borderRadius: borderRadius.full,
            overflow: 'hidden',
            backgroundColor: colors.neutral[200],
          }}
        >
          {stats.safe > 0 && (
            <div
              style={{
                flex: stats.safe,
                backgroundColor: colors.success,
              }}
            />
          )}
          {stats.needHelp > 0 && (
            <div
              style={{
                flex: stats.needHelp,
                backgroundColor: colors.warning,
              }}
            />
          )}
          {stats.sos > 0 && (
            <div
              style={{
                flex: stats.sos,
                backgroundColor: colors.error,
              }}
            />
          )}
          {stats.unaccounted > 0 && (
            <div
              style={{
                flex: stats.unaccounted,
                backgroundColor: colors.neutral[400],
              }}
            />
          )}
        </div>
      </div>

      <p
        style={{
          fontSize: typography.fontSize.body3.size,
          color: colors.neutral[600],
          margin: `${spacing.lg} 0 0 0`,
          textAlign: 'center',
        }}
      >
        Total Check-Ins: {stats.total}
      </p>
    </div>
  );
};

interface StatusItemProps {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

const StatusItem: React.FC<StatusItemProps> = ({ label, value, percentage, color }) => (
  <div
    style={{
      padding: spacing.md,
      backgroundColor: colors.neutral[50],
      borderRadius: borderRadius.md,
      textAlign: 'center',
      borderTop: `3px solid ${color}`,
    }}
  >
    <p
      style={{
        fontSize: typography.fontSize.body3.size,
        color: colors.neutral[600],
        margin: 0,
        marginBottom: spacing.xs,
      }}
    >
      {label}
    </p>
    <p
      style={{
        fontSize: typography.fontSize.h3.size,
        fontWeight: typography.fontSize.h3.weight,
        color: color,
        margin: 0,
        marginBottom: spacing.xs,
      }}
    >
      {value}
    </p>
    <p
      style={{
        fontSize: typography.fontSize.caption.size,
        color: colors.neutral[500],
        margin: 0,
      }}
    >
      {percentage}%
    </p>
  </div>
);

export default CheckInSummary;

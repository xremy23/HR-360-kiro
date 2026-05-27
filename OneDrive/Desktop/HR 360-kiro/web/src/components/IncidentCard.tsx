/**
 * Incident Card Component
 * Displays incident details with real-time status
 */

import React from 'react';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';

interface IncidentCardProps {
  incident: {
    id: string;
    type: string;
    severity: 'advisory' | 'watch' | 'emergency';
    startTime: string;
    isDrill: boolean;
  };
}

const IncidentCard: React.FC<IncidentCardProps> = ({ incident }) => {
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

  const getSeverityLabel = (severity: string) => {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      style={{
        padding: spacing.lg,
        backgroundColor: colors.primary.white,
        border: `2px solid ${getSeverityColor(incident.severity)}`,
        borderRadius: borderRadius.md,
        boxShadow: shadows.md,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm }}>
          <h3
            style={{
              fontSize: typography.fontSize.h4.size,
              fontWeight: typography.fontSize.h4.weight,
              color: colors.primary.black,
              margin: 0,
              textTransform: 'capitalize',
            }}
          >
            {incident.type}
          </h3>
          {incident.isDrill && (
            <span
              style={{
                padding: `${spacing.xs} ${spacing.sm}`,
                backgroundColor: colors.info,
                color: colors.primary.white,
                borderRadius: borderRadius.sm,
                fontSize: typography.fontSize.label2.size,
                fontWeight: typography.fontSize.label2.weight,
              }}
            >
              DRILL
            </span>
          )}
        </div>
        <p
          style={{
            fontSize: typography.fontSize.body3.size,
            color: colors.neutral[500],
            margin: 0,
          }}
        >
          Started at {formatTime(incident.startTime)}
        </p>
      </div>

      <div
        style={{
          padding: `${spacing.md} ${spacing.lg}`,
          backgroundColor: getSeverityColor(incident.severity),
          color: colors.primary.white,
          borderRadius: borderRadius.md,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: typography.fontSize.label1.size,
            fontWeight: typography.fontSize.label1.weight,
            margin: 0,
          }}
        >
          {getSeverityLabel(incident.severity)}
        </p>
      </div>
    </div>
  );
};

export default IncidentCard;

/**
 * Incident Management Page
 * Create, view, and manage incidents
 */

import React, { useState } from 'react';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';
import websocketService from '../services/websocketService';

interface Incident {
  id: string;
  type: string;
  severity: 'advisory' | 'watch' | 'emergency';
  startTime: string;
  endTime?: string;
  isDrill: boolean;
  status: 'active' | 'resolved';
}

const IncidentManagement: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    severity: 'watch' as const,
    isDrill: false,
  });

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type) {
      alert('Please enter incident type');
      return;
    }

    // Send via WebSocket
    websocketService.send({
      type: 'incident',
      action: 'created',
      data: {
        ...formData,
        startTime: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

    setFormData({ type: '', severity: 'watch', isDrill: false });
    setShowForm(false);
  };

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
            }}
          >
            Incident Management
          </h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: `${spacing.md} ${spacing.lg}`,
            backgroundColor: colors.primary.teal,
            color: colors.primary.white,
            border: 'none',
            borderRadius: borderRadius.md,
            fontSize: typography.fontSize.label1.size,
            fontWeight: typography.fontSize.label1.weight,
            cursor: 'pointer',
            boxShadow: shadows.md,
            transition: 'all 200ms ease-in-out',
          }}
          onMouseOver={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = colors.secondary.mediumTeal;
          }}
          onMouseOut={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = colors.primary.teal;
          }}
        >
          {showForm ? 'Cancel' : 'Create Incident'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div
          style={{
            padding: spacing.xl,
            backgroundColor: colors.neutral[50],
            border: `2px solid ${colors.primary.teal}`,
            borderRadius: borderRadius.md,
            marginBottom: spacing.xl,
          }}
        >
          <h2
            style={{
              fontSize: typography.fontSize.h3.size,
              fontWeight: typography.fontSize.h3.weight,
              color: colors.primary.black,
              marginTop: 0,
              marginBottom: spacing.lg,
            }}
          >
            Create New Incident
          </h2>

          <form onSubmit={handleCreateIncident}>
            <div style={{ marginBottom: spacing.lg }}>
              <label
                style={{
                  display: 'block',
                  fontSize: typography.fontSize.label1.size,
                  fontWeight: typography.fontSize.label1.weight,
                  color: colors.primary.black,
                  marginBottom: spacing.sm,
                }}
              >
                Incident Type
              </label>
              <input
                type="text"
                placeholder="e.g., Fire, Earthquake, Medical Emergency"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={{
                  width: '100%',
                  padding: spacing.md,
                  fontSize: typography.fontSize.body1.size,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label
                style={{
                  display: 'block',
                  fontSize: typography.fontSize.label1.size,
                  fontWeight: typography.fontSize.label1.weight,
                  color: colors.primary.black,
                  marginBottom: spacing.sm,
                }}
              >
                Severity Level
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                style={{
                  width: '100%',
                  padding: spacing.md,
                  fontSize: typography.fontSize.body1.size,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  boxSizing: 'border-box',
                }}
              >
                <option value="advisory">Advisory</option>
                <option value="watch">Watch</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.md,
                  fontSize: typography.fontSize.label1.size,
                  fontWeight: typography.fontSize.label1.weight,
                  color: colors.primary.black,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.isDrill}
                  onChange={(e) => setFormData({ ...formData, isDrill: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                This is a drill
              </label>
            </div>

            <button
              type="submit"
              style={{
                padding: `${spacing.md} ${spacing.xl}`,
                backgroundColor: colors.primary.teal,
                color: colors.primary.white,
                border: 'none',
                borderRadius: borderRadius.md,
                fontSize: typography.fontSize.label1.size,
                fontWeight: typography.fontSize.label1.weight,
                cursor: 'pointer',
                boxShadow: shadows.md,
              }}
            >
              Create Incident
            </button>
          </form>
        </div>
      )}

      {/* Incidents List */}
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

        {incidents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {incidents.map((incident) => (
              <div
                key={incident.id}
                style={{
                  padding: spacing.lg,
                  backgroundColor: colors.primary.white,
                  border: `2px solid ${getSeverityColor(incident.severity)}`,
                  borderRadius: borderRadius.md,
                  boxShadow: shadows.md,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3
                      style={{
                        fontSize: typography.fontSize.h4.size,
                        fontWeight: typography.fontSize.h4.weight,
                        color: colors.primary.black,
                        margin: 0,
                        marginBottom: spacing.sm,
                        textTransform: 'capitalize',
                      }}
                    >
                      {incident.type}
                    </h3>
                    <p
                      style={{
                        fontSize: typography.fontSize.body2.size,
                        color: colors.neutral[600],
                        margin: 0,
                      }}
                    >
                      Started: {new Date(incident.startTime).toLocaleString()}
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
                        textTransform: 'capitalize',
                      }}
                    >
                      {incident.severity}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
            <p style={{ fontSize: typography.fontSize.body1.size, margin: 0 }}>
              No active incidents
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentManagement;

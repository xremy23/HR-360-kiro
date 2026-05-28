/**
 * Alert Management Page
 * Broadcast and manage alerts
 */

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { setLoading, setError, setItems, addAlert, updateAlert, deleteAlert } from '../store/slices/alertSlice';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';
import websocketService from '../services/websocketService';
import apiService, { ApiError } from '../services/apiService';

interface AlertFormData {
  title: string;
  message: string;
  severity: 'advisory' | 'watch' | 'emergency';
  isDrill: boolean;
  teamIds: string[];
}

const AlertManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: alerts, loading, error } = useSelector((state: RootState) => state.alert);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<AlertFormData>({
    title: '',
    message: '',
    severity: 'watch',
    isDrill: false,
    teamIds: [],
  });

  // Fetch alerts on mount
  useEffect(() => {
    const fetchAlerts = async () => {
      dispatch(setLoading(true));
      try {
        const response = await apiService.getAlerts({ pageSize: 100 });
        if (response.success && response.data) {
          dispatch(setItems(response.data));
        } else {
          dispatch(setError('Failed to load alerts'));
        }
      } catch (err) {
        const apiError = err as ApiError;
        dispatch(setError(apiError.message || 'Failed to load alerts'));
      }
    };

    fetchAlerts();
  }, [dispatch]);

  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.message) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      dispatch(setLoading(true));
      
      const response = await apiService.broadcastAlert({
        message: formData.message,
        severity: formData.severity === 'advisory' ? 'low' : formData.severity === 'watch' ? 'medium' : 'critical',
        teamIds: formData.teamIds.length > 0 ? formData.teamIds : undefined,
      });

      if (response.success && response.data) {
        dispatch(addAlert(response.data));
        
        // Send via WebSocket
        websocketService.send({
          type: 'alert',
          action: 'created',
          data: response.data,
          timestamp: new Date().toISOString(),
        });

        setFormData({
          title: '',
          message: '',
          severity: 'watch',
          isDrill: false,
          teamIds: [],
        });
        setShowForm(false);
        alert('Alert broadcast successfully!');
      } else {
        dispatch(setError('Failed to broadcast alert'));
      }
    } catch (err) {
      const apiError = err as ApiError;
      dispatch(setError(apiError.message || 'Failed to broadcast alert'));
      alert(apiError.message || 'Failed to broadcast alert');
    } finally {
      dispatch(setLoading(false));
    }
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
            Alert Management
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
          {showForm ? 'Cancel' : 'Broadcast Alert'}
        </button>
      </div>

      {/* Broadcast Form */}
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
            Broadcast New Alert
          </h2>

          <form onSubmit={handleBroadcastAlert}>
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
                Alert Title
              </label>
              <input
                type="text"
                placeholder="e.g., Evacuation Order"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                Message
              </label>
              <textarea
                placeholder="Enter alert message..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                style={{
                  width: '100%',
                  padding: spacing.md,
                  fontSize: typography.fontSize.body1.size,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  boxSizing: 'border-box',
                  minHeight: '100px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
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
              Broadcast Alert
            </button>
          </form>
        </div>
      )}

      {/* Alerts List */}
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

        {loading ? (
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
        ) : error ? (
          <div
            style={{
              padding: spacing.xl,
              backgroundColor: colors.error,
              borderRadius: borderRadius.md,
              textAlign: 'center',
              color: colors.primary.white,
            }}
          >
            {error}
          </div>
        ) : alerts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {alerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  padding: spacing.lg,
                  backgroundColor: colors.primary.white,
                  borderLeft: `4px solid ${getSeverityColor(alert.severity)}`,
                  border: `1px solid ${colors.neutral[200]}`,
                  borderRadius: borderRadius.md,
                  boxShadow: shadows.md,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: spacing.md }}>
                  <div>
                    <h3
                      style={{
                        fontSize: typography.fontSize.h4.size,
                        fontWeight: typography.fontSize.h4.weight,
                        color: colors.primary.black,
                        margin: 0,
                        marginBottom: spacing.sm,
                      }}
                    >
                      {alert.title}
                    </h3>
                    <p
                      style={{
                        fontSize: typography.fontSize.body2.size,
                        color: colors.neutral[600],
                        margin: 0,
                        marginBottom: spacing.sm,
                        lineHeight: '1.5',
                      }}
                    >
                      {alert.description}
                    </p>
                  </div>
                  {alert.type === 'drill' && (
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p
                    style={{
                      fontSize: typography.fontSize.caption.size,
                      color: colors.neutral[500],
                      margin: 0,
                    }}
                  >
                    {new Date(alert.createdAt).toLocaleString()}
                  </p>
                  <span
                    style={{
                      padding: `${spacing.xs} ${spacing.sm}`,
                      backgroundColor: getSeverityColor(alert.severity),
                      color: colors.primary.white,
                      borderRadius: borderRadius.sm,
                      fontSize: typography.fontSize.label2.size,
                      fontWeight: typography.fontSize.label2.weight,
                      textTransform: 'capitalize',
                    }}
                  >
                    {alert.severity}
                  </span>
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
              No alerts broadcast yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertManagement;

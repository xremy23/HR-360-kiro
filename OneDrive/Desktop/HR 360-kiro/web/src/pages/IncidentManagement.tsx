/**
 * Incident Management Page
 * Manage emergency incidents and responses
 */

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { setLoading, setError, setItems, addIncident, updateIncident, deleteIncident } from '../store/slices/incidentSlice';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';
import websocketService from '../services/websocketService';
import apiService, { ApiError } from '../services/apiService';
import useDarkMode from '../hooks/useDarkMode';

interface IncidentFormData {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved';
  location?: string;
  affectedTeams: string[];
  isDrill: boolean;
}

interface IncidentStats {
  total: number;
  active: number;
  resolved: number;
  critical: number;
}

const IncidentManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: incidents, loading, error } = useSelector((state: RootState) => state.incident);
  const isDarkMode = useDarkMode();
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stats, setStats] = useState<IncidentStats>({
    total: 0,
    active: 0,
    resolved: 0,
    critical: 0,
  });
  const [formData, setFormData] = useState<IncidentFormData>({
    title: '',
    description: '',
    severity: 'high',
    status: 'active',
    location: '',
    affectedTeams: [],
    isDrill: false,
  });

  // Color mappings for light/dark mode
  const uiColors = {
    bg: isDarkMode ? '#18181B' : colors.primary.white,
    bgSecondary: isDarkMode ? '#27272A' : colors.neutral[50],
    text: isDarkMode ? '#FAFAFA' : colors.primary.black,
    textSecondary: isDarkMode ? '#A1A1AA' : colors.neutral[600],
    textTertiary: isDarkMode ? '#71717A' : colors.neutral[500],
    border: isDarkMode ? '#3F3F46' : colors.neutral[300],
    borderLight: isDarkMode ? '#27272A' : colors.neutral[200],
  };

  // Fetch incidents on mount
  useEffect(() => {
    const fetchIncidents = async () => {
      dispatch(setLoading(true));
      try {
        const response = await apiService.getIncidents({ pageSize: 100 });
        if (response.success && response.data) {
          dispatch(setItems(response.data));
          calculateStats(response.data);
        } else {
          dispatch(setError('Failed to load incidents'));
        }
      } catch (err) {
        const apiError = err as ApiError;
        dispatch(setError(apiError.message || 'Failed to load incidents'));
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchIncidents();
  }, [dispatch]);

  // Subscribe to real-time incident updates
  useEffect(() => {
    const unsubscribeCreated = websocketService.on('incident:created', (data) => {
      dispatch(addIncident(data));
      calculateStats([...incidents, data]);
    });

    const unsubscribeUpdated = websocketService.on('incident:updated', (data) => {
      dispatch(updateIncident(data));
      const updated = incidents.map(i => i.id === data.id ? data : i);
      calculateStats(updated);
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
    };
  }, [incidents, dispatch]);

  const calculateStats = (incidentList: any[]) => {
    setStats({
      total: incidentList.length,
      active: incidentList.filter(i => i.status === 'active').length,
      resolved: incidentList.filter(i => i.status === 'resolved').length,
      critical: incidentList.filter(i => i.severity === 'critical').length,
    });
  };

  const handleCreateOrUpdateIncident = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      dispatch(setLoading(true));
      
      let response;
      if (editingId) {
        response = await apiService.updateIncident(editingId, formData);
        if (response.success && response.data) {
          dispatch(updateIncident(response.data));
          websocketService.send({
            type: 'incident',
            action: 'updated',
            data: response.data,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        response = await apiService.createIncident(formData);
        if (response.success && response.data) {
          dispatch(addIncident(response.data));
          websocketService.send({
            type: 'incident',
            action: 'created',
            data: response.data,
            timestamp: new Date().toISOString(),
          });
        }
      }

      if (response.success) {
        setFormData({
          title: '',
          description: '',
          severity: 'high',
          status: 'active',
          location: '',
          affectedTeams: [],
          isDrill: false,
        });
        setEditingId(null);
        setShowForm(false);
        alert(editingId ? 'Incident updated successfully!' : 'Incident created successfully!');
      } else {
        dispatch(setError('Failed to save incident'));
      }
    } catch (err) {
      const apiError = err as ApiError;
      dispatch(setError(apiError.message || 'Failed to save incident'));
      alert(apiError.message || 'Failed to save incident');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDeleteIncident = async (id: string) => {
    if (confirm('Are you sure you want to delete this incident?')) {
      try {
        dispatch(setLoading(true));
        const response = await apiService.deleteIncident(id);
        if (response.success) {
          dispatch(deleteIncident(id));
          const updated = incidents.filter(i => i.id !== id);
          calculateStats(updated);
        }
      } catch (err) {
        const apiError = err as ApiError;
        dispatch(setError(apiError.message || 'Failed to delete incident'));
      } finally {
        dispatch(setLoading(false));
      }
    }
  };

  const handleEditIncident = (incident: any) => {
    setFormData({
      title: incident.title || '',
      description: incident.description || '',
      severity: incident.severity || 'high',
      status: incident.status || 'active',
      location: incident.location || '',
      affectedTeams: incident.affectedTeams || [],
      isDrill: incident.isDrill || false,
    });
    setEditingId(incident.id);
    setShowForm(true);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return colors.error;
      case 'high':
        return colors.warning;
      case 'medium':
        return colors.info;
      case 'low':
        return colors.success;
      default:
        return colors.neutral[400];
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.error;
      case 'resolved':
        return colors.success;
      default:
        return colors.neutral[400];
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: uiColors.bg,
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
              color: uiColors.text,
              margin: 0,
            }}
          >
            Incident Management
          </h1>
        </div>
        <button
          onClick={() => {
            setFormData({
              title: '',
              description: '',
              severity: 'high',
              status: 'active',
              location: '',
              affectedTeams: [],
              isDrill: false,
            });
            setEditingId(null);
            setShowForm(!showForm);
          }}
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
        >
          {showForm ? 'Cancel' : 'Create Incident'}
        </button>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: spacing.lg,
          marginBottom: spacing.xxl,
        }}
      >
        <StatCard label="Total" value={stats.total} color={colors.neutral[400]} isDarkMode={isDarkMode} />
        <StatCard label="Active" value={stats.active} color={colors.error} isDarkMode={isDarkMode} />
        <StatCard label="Resolved" value={stats.resolved} color={colors.success} isDarkMode={isDarkMode} />
        <StatCard label="Critical" value={stats.critical} color={colors.warning} isDarkMode={isDarkMode} />
      </div>

      {/* Form */}
      {showForm && (
        <div
          style={{
            padding: spacing.xl,
            backgroundColor: uiColors.bgSecondary,
            border: `2px solid ${colors.primary.teal}`,
            borderRadius: borderRadius.md,
            marginBottom: spacing.xl,
          }}
        >
          <h2
            style={{
              fontSize: typography.fontSize.h3.size,
              fontWeight: typography.fontSize.h3.weight,
              color: uiColors.text,
              marginTop: 0,
              marginBottom: spacing.lg,
            }}
          >
            {editingId ? 'Edit Incident' : 'Create New Incident'}
          </h2>

          <form onSubmit={handleCreateOrUpdateIncident}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg, marginBottom: spacing.lg }}>
              <div>
                <label style={getLabelStyle(isDarkMode)}>Title</label>
                <input
                  type="text"
                  placeholder="Incident title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={getInputStyle(isDarkMode)}
                />
              </div>
              <div>
                <label style={getLabelStyle(isDarkMode)}>Location</label>
                <input
                  type="text"
                  placeholder="Location..."
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  style={getInputStyle(isDarkMode)}
                />
              </div>
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label style={getLabelStyle(isDarkMode)}>Description</label>
              <textarea
                placeholder="Describe the incident..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{
                  ...getInputStyle(isDarkMode),
                  minHeight: '100px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                } as React.CSSProperties}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg, marginBottom: spacing.lg }}>
              <div>
                <label style={getLabelStyle(isDarkMode)}>Severity</label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                  style={getInputStyle(isDarkMode)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label style={getLabelStyle(isDarkMode)}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  style={getInputStyle(isDarkMode)}
                >
                  <option value="active">Active</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label style={getLabelCheckboxStyle(isDarkMode)}>
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
              {editingId ? 'Update Incident' : 'Create Incident'}
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
            color: uiColors.text,
            marginBottom: spacing.lg,
          }}
        >
          All Incidents
        </h2>

        {loading ? (
          <div style={{ ...emptyStateStyle(isDarkMode), backgroundColor: uiColors.bgSecondary }}>Loading incidents...</div>
        ) : error ? (
          <div style={{ ...emptyStateStyle(isDarkMode), backgroundColor: colors.error, color: colors.primary.white }}>
            {error}
          </div>
        ) : incidents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {incidents.map((incident) => (
              <div
                key={incident.id}
                style={{
                  padding: spacing.lg,
                  backgroundColor: uiColors.bg,
                  border: `2px solid ${getStatusColor(incident.status)}`,
                  borderRadius: borderRadius.md,
                  boxShadow: shadows.md,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: spacing.md }}>
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontSize: typography.fontSize.h4.size,
                        fontWeight: typography.fontSize.h4.weight,
                        color: uiColors.text,
                        margin: 0,
                        marginBottom: spacing.sm,
                      }}
                    >
                      {incident.title}
                    </h3>
                    <p
                      style={{
                        fontSize: typography.fontSize.body2.size,
                        color: uiColors.textSecondary,
                        margin: 0,
                        marginBottom: spacing.sm,
                        lineHeight: '1.5',
                      }}
                    >
                      {incident.description}
                    </p>
                    {incident.location && (
                      <p
                        style={{
                          fontSize: typography.fontSize.body3.size,
                          color: uiColors.textTertiary,
                          margin: 0,
                        }}
                      >
                        📍 {incident.location}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: spacing.md, marginLeft: spacing.lg }}>
                    <span
                      style={{
                        padding: `${spacing.xs} ${spacing.sm}`,
                        backgroundColor: getSeverityColor(incident.severity),
                        color: colors.primary.white,
                        borderRadius: borderRadius.sm,
                        fontSize: typography.fontSize.label2.size,
                        fontWeight: typography.fontSize.label2.weight,
                        textTransform: 'capitalize',
                      }}
                    >
                      {incident.severity}
                    </span>
                    <span
                      style={{
                        padding: `${spacing.xs} ${spacing.sm}`,
                        backgroundColor: getStatusColor(incident.status),
                        color: colors.primary.white,
                        borderRadius: borderRadius.sm,
                        fontSize: typography.fontSize.label2.size,
                        fontWeight: typography.fontSize.label2.weight,
                        textTransform: 'uppercase',
                      }}
                    >
                      {incident.status}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.md, borderTop: `1px solid ${uiColors.borderLight}` }}>
                  <p
                    style={{
                      fontSize: typography.fontSize.caption.size,
                      color: uiColors.textTertiary,
                      margin: 0,
                    }}
                  >
                    {new Date(incident.createdAt).toLocaleString()}
                  </p>
                  <div style={{ display: 'flex', gap: spacing.md }}>
                    <button
                      onClick={() => handleEditIncident(incident)}
                      style={{
                        padding: `${spacing.xs} ${spacing.sm}`,
                        backgroundColor: colors.primary.teal,
                        color: colors.primary.white,
                        border: 'none',
                        borderRadius: borderRadius.sm,
                        fontSize: typography.fontSize.label2.size,
                        cursor: 'pointer',
                        transition: 'all 200ms',
                      }}
                      onMouseOver={(e) => {
                        (e.target as HTMLButtonElement).style.opacity = '0.8';
                      }}
                      onMouseOut={(e) => {
                        (e.target as HTMLButtonElement).style.opacity = '1';
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteIncident(incident.id)}
                      style={{
                        padding: `${spacing.xs} ${spacing.sm}`,
                        backgroundColor: colors.error,
                        color: colors.primary.white,
                        border: 'none',
                        borderRadius: borderRadius.sm,
                        fontSize: typography.fontSize.label2.size,
                        cursor: 'pointer',
                        transition: 'all 200ms',
                      }}
                      onMouseOver={(e) => {
                        (e.target as HTMLButtonElement).style.opacity = '0.8';
                      }}
                      onMouseOut={(e) => {
                        (e.target as HTMLButtonElement).style.opacity = '1';
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={emptyStateStyle(isDarkMode)}>No incidents yet</div>
        )}
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  isDarkMode: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color, isDarkMode }) => {
  const bgColor = isDarkMode ? '#27272A' : colors.primary.white;
  const textColor = isDarkMode ? '#A1A1AA' : colors.neutral[600];
  
  return (
  <div
    style={{
      padding: spacing.lg,
      backgroundColor: bgColor,
      border: `2px solid ${color}`,
      borderRadius: borderRadius.md,
      boxShadow: shadows.sm,
      textAlign: 'center',
    }}
  >
    <p
      style={{
        fontSize: typography.fontSize.body2.size,
        color: textColor,
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
        color,
        margin: 0,
      }}
    >
      {value}
    </p>
  </div>
  );
};

// Reusable styles - updated to accept isDarkMode
const getLabelStyle = (isDarkMode: boolean): React.CSSProperties => ({
  display: 'block',
  fontSize: typography.fontSize.label1.size,
  fontWeight: typography.fontSize.label1.weight,
  color: isDarkMode ? '#FAFAFA' : colors.primary.black,
  marginBottom: spacing.sm,
});

const getLabelCheckboxStyle = (isDarkMode: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.md,
  fontSize: typography.fontSize.label1.size,
  fontWeight: typography.fontSize.label1.weight,
  color: isDarkMode ? '#FAFAFA' : colors.primary.black,
  cursor: 'pointer',
});

const getInputStyle = (isDarkMode: boolean): React.CSSProperties => ({
  width: '100%',
  padding: spacing.md,
  fontSize: typography.fontSize.body1.size,
  border: `1px solid ${isDarkMode ? '#3F3F46' : colors.neutral[300]}`,
  borderRadius: borderRadius.md,
  boxSizing: 'border-box',
  backgroundColor: isDarkMode ? '#27272A' : colors.primary.white,
  color: isDarkMode ? '#FAFAFA' : colors.primary.black,
});

const emptyStateStyle = (isDarkMode: boolean): React.CSSProperties => ({
  padding: spacing.xl,
  backgroundColor: isDarkMode ? '#27272A' : colors.neutral[50],
  borderRadius: borderRadius.md,
  textAlign: 'center',
  color: isDarkMode ? '#A1A1AA' : colors.neutral[500],
});

export default IncidentManagement;

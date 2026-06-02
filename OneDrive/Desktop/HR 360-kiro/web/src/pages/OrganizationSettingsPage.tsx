/**
 * Organization Settings Page
 * Manage organization details, teams, and settings
 */

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';
import apiService, { ApiError } from '../services/apiService';

interface OrganizationData {
  id?: string;
  name: string;
  emailDomain?: string;
  logo?: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  headId?: string;
  memberCount?: number;
  isActive?: boolean;
}

interface OrganizationStats {
  totalUsers: number;
  totalTeams: number;
  activeAlerts: number;
  activeIncidents: number;
}

const OrganizationSettingsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const [orgData, setOrgData] = useState<OrganizationData>({
    name: '',
    emailDomain: '',
    logo: '',
    description: '',
    address: '',
    phone: '',
    website: '',
  });

  const [teams, setTeams] = useState<Team[]>([]);
  const [stats, setStats] = useState<OrganizationStats>({
    totalUsers: 0,
    totalTeams: 0,
    activeAlerts: 0,
    activeIncidents: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'teams'>('overview');
  const [editMode, setEditMode] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamFormData, setTeamFormData] = useState({ name: '', description: '' });

  // Fetch organization data on mount
  useEffect(() => {
    fetchOrganizationData();
  }, []);

  const fetchOrganizationData = async () => {
    setLoading(true);
    try {
      const [orgResponse, teamsResponse] = await Promise.all([
        apiService.getOrganization(),
        apiService.getOrganizationTeams(),
      ]);

      if (orgResponse.success && orgResponse.data) {
        setOrgData(orgResponse.data);
      }

      if (teamsResponse.success && teamsResponse.data) {
        setTeams(teamsResponse.data);
      }

      // Calculate stats
      const usersResponse = await apiService.getOrganizationUsers({ pageSize: 1 });
      const alertsResponse = await apiService.getAlerts({ pageSize: 1 });
      const incidentsResponse = await apiService.getIncidents({ pageSize: 1 });

      setStats({
        totalUsers: usersResponse.success ? usersResponse.pagination?.total || 0 : 0,
        totalTeams: teamsResponse.success ? teamsResponse.data?.length || 0 : 0,
        activeAlerts: alertsResponse.success ? alertsResponse.data?.filter((a: any) => a.isActive).length || 0 : 0,
        activeIncidents:
          incidentsResponse.success ? incidentsResponse.data?.filter((i: any) => i.status === 'active').length || 0 : 0,
      });

      setError(null);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrganization = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgData.name) {
      setError('Organization name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.updateOrganization({
        name: orgData.name,
        logo: orgData.logo,
      });

      if (response.success) {
        setSuccess('Organization updated successfully!');
        setEditMode(false);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to update organization');
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to update organization');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamFormData.name) {
      setError('Team name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.createOrganizationTeam(teamFormData);

      if (response.success && response.data) {
        setTeams([...teams, response.data]);
        setTeamFormData({ name: '', description: '' });
        setShowTeamForm(false);
        setSuccess('Team created successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to create team');
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    setLoading(true);
    try {
      const response = await apiService.deleteOrganizationTeam(teamId);

      if (response.success) {
        setTeams(teams.filter((t) => t.id !== teamId));
        setSuccess('Team deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to delete team');
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to delete team');
    } finally {
      setLoading(false);
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
      <div style={{ marginBottom: spacing.xxl }}>
        <h1
          style={{
            fontSize: typography.fontSize.display2.size,
            fontWeight: typography.fontSize.display2.weight,
            color: colors.primary.black,
            margin: 0,
            marginBottom: spacing.sm,
          }}
        >
          Organization Settings
        </h1>
        <p
          style={{
            fontSize: typography.fontSize.body2.size,
            color: colors.neutral[600],
            margin: 0,
          }}
        >
          Manage organization details, teams, and settings
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div
          style={{
            padding: spacing.lg,
            backgroundColor: colors.error,
            color: colors.primary.white,
            borderRadius: borderRadius.md,
            marginBottom: spacing.lg,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: colors.primary.white,
              cursor: 'pointer',
              fontSize: typography.fontSize.h3.size,
              padding: 0,
            }}
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div
          style={{
            padding: spacing.lg,
            backgroundColor: colors.success,
            color: colors.primary.white,
            borderRadius: borderRadius.md,
            marginBottom: spacing.lg,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {success}
          <button
            onClick={() => setSuccess(null)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: colors.primary.white,
              cursor: 'pointer',
              fontSize: typography.fontSize.h3.size,
              padding: 0,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: spacing.lg,
          borderBottom: `2px solid ${colors.neutral[200]}`,
          marginBottom: spacing.xl,
          overflowX: 'auto',
        }}
      >
        {(['overview', 'settings', 'teams'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: `${spacing.md} ${spacing.lg}`,
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? `2px solid ${colors.primary.teal}` : '2px solid transparent',
              color: activeTab === tab ? colors.primary.teal : colors.neutral[600],
              cursor: 'pointer',
              fontSize: typography.fontSize.body1.size,
              fontWeight: activeTab === tab ? '600' : '400',
              transition: 'all 200ms',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          {/* Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: spacing.lg,
              marginBottom: spacing.xxl,
            }}
          >
            <StatCard label="Total Users" value={stats.totalUsers} color={colors.primary.teal} />
            <StatCard label="Teams" value={stats.totalTeams} color={colors.secondary.mediumTeal} />
            <StatCard label="Active Alerts" value={stats.activeAlerts} color={colors.warning} />
            <StatCard label="Active Incidents" value={stats.activeIncidents} color={colors.error} />
          </div>

          {/* Organization Info */}
          <div
            style={{
              backgroundColor: colors.neutral[50],
              border: `2px solid ${colors.primary.teal}`,
              borderRadius: borderRadius.md,
              padding: spacing.xl,
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
              Organization Information
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: spacing.lg,
                marginBottom: spacing.lg,
              }}
            >
              <div>
                <p style={labelStyle}>Organization Name</p>
                <p style={valueStyle}>{orgData.name}</p>
              </div>
              <div>
                <p style={labelStyle}>Email Domain</p>
                <p style={valueStyle}>{orgData.emailDomain || 'Not set'}</p>
              </div>
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <p style={labelStyle}>Description</p>
              <p style={valueStyle}>{orgData.description || 'Not set'}</p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: spacing.lg,
              }}
            >
              <div>
                <p style={labelStyle}>Address</p>
                <p style={valueStyle}>{orgData.address || 'Not set'}</p>
              </div>
              <div>
                <p style={labelStyle}>Phone</p>
                <p style={valueStyle}>{orgData.phone || 'Not set'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div>
          <div
            style={{
              backgroundColor: colors.neutral[50],
              border: `2px solid ${colors.primary.teal}`,
              borderRadius: borderRadius.md,
              padding: spacing.xl,
            }}
          >
            {editMode ? (
              <form onSubmit={handleSaveOrganization}>
                <h2
                  style={{
                    fontSize: typography.fontSize.h3.size,
                    fontWeight: typography.fontSize.h3.weight,
                    color: colors.primary.black,
                    marginTop: 0,
                    marginBottom: spacing.lg,
                  }}
                >
                  Edit Organization Settings
                </h2>

                <div style={{ marginBottom: spacing.lg }}>
                  <label style={inputLabelStyle}>Organization Name *</label>
                  <input
                    type="text"
                    value={orgData.name}
                    onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: spacing.lg }}>
                  <label style={inputLabelStyle}>Email Domain</label>
                  <input
                    type="text"
                    placeholder="example.com"
                    value={orgData.emailDomain}
                    onChange={(e) => setOrgData({ ...orgData, emailDomain: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: spacing.lg }}>
                  <label style={inputLabelStyle}>Description</label>
                  <textarea
                    placeholder="Organization description..."
                    value={orgData.description}
                    onChange={(e) => setOrgData({ ...orgData, description: e.target.value })}
                    style={{
                      ...inputStyle,
                      minHeight: '100px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    } as React.CSSProperties}
                  />
                </div>

                <div style={{ marginBottom: spacing.lg }}>
                  <label style={inputLabelStyle}>Address</label>
                  <input
                    type="text"
                    placeholder="123 Main St, City, State 12345"
                    value={orgData.address}
                    onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: spacing.lg }}>
                  <label style={inputLabelStyle}>Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={orgData.phone}
                    onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: 'flex', gap: spacing.lg }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: `${spacing.md} ${spacing.xl}`,
                      backgroundColor: colors.primary.teal,
                      color: colors.primary.white,
                      border: 'none',
                      borderRadius: borderRadius.md,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: typography.fontSize.label1.size,
                      fontWeight: typography.fontSize.label1.weight,
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      fetchOrganizationData();
                    }}
                    style={{
                      padding: `${spacing.md} ${spacing.xl}`,
                      backgroundColor: colors.neutral[300],
                      color: colors.primary.black,
                      border: 'none',
                      borderRadius: borderRadius.md,
                      cursor: 'pointer',
                      fontSize: typography.fontSize.label1.size,
                      fontWeight: typography.fontSize.label1.weight,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
                  <h2
                    style={{
                      fontSize: typography.fontSize.h3.size,
                      fontWeight: typography.fontSize.h3.weight,
                      color: colors.primary.black,
                      margin: 0,
                    }}
                  >
                    Organization Settings
                  </h2>
                  <button
                    onClick={() => setEditMode(true)}
                    style={{
                      padding: `${spacing.md} ${spacing.lg}`,
                      backgroundColor: colors.primary.teal,
                      color: colors.primary.white,
                      border: 'none',
                      borderRadius: borderRadius.md,
                      cursor: 'pointer',
                      fontSize: typography.fontSize.label1.size,
                      fontWeight: typography.fontSize.label1.weight,
                    }}
                  >
                    Edit
                  </button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: spacing.lg,
                    marginBottom: spacing.lg,
                  }}
                >
                  <div>
                    <p style={labelStyle}>Organization Name</p>
                    <p style={valueStyle}>{orgData.name}</p>
                  </div>
                  <div>
                    <p style={labelStyle}>Email Domain</p>
                    <p style={valueStyle}>{orgData.emailDomain || 'Not set'}</p>
                  </div>
                </div>

                <div style={{ marginBottom: spacing.lg }}>
                  <p style={labelStyle}>Description</p>
                  <p style={valueStyle}>{orgData.description || 'Not set'}</p>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: spacing.lg,
                  }}
                >
                  <div>
                    <p style={labelStyle}>Address</p>
                    <p style={valueStyle}>{orgData.address || 'Not set'}</p>
                  </div>
                  <div>
                    <p style={labelStyle}>Phone</p>
                    <p style={valueStyle}>{orgData.phone || 'Not set'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'teams' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.lg,
            }}
          >
            <h2
              style={{
                fontSize: typography.fontSize.h3.size,
                fontWeight: typography.fontSize.h3.weight,
                color: colors.primary.black,
                margin: 0,
              }}
            >
              Teams ({teams.length})
            </h2>
            <button
              onClick={() => setShowTeamForm(!showTeamForm)}
              style={{
                padding: `${spacing.md} ${spacing.lg}`,
                backgroundColor: colors.primary.teal,
                color: colors.primary.white,
                border: 'none',
                borderRadius: borderRadius.md,
                cursor: 'pointer',
                fontSize: typography.fontSize.label1.size,
                fontWeight: typography.fontSize.label1.weight,
              }}
            >
              {showTeamForm ? 'Cancel' : 'Create Team'}
            </button>
          </div>

          {showTeamForm && (
            <div
              style={{
                backgroundColor: colors.neutral[50],
                border: `2px solid ${colors.primary.teal}`,
                borderRadius: borderRadius.md,
                padding: spacing.lg,
                marginBottom: spacing.lg,
              }}
            >
              <form onSubmit={handleCreateTeam}>
                <div style={{ marginBottom: spacing.lg }}>
                  <label style={inputLabelStyle}>Team Name *</label>
                  <input
                    type="text"
                    placeholder="Team name..."
                    value={teamFormData.name}
                    onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: spacing.lg }}>
                  <label style={inputLabelStyle}>Description</label>
                  <textarea
                    placeholder="Team description..."
                    value={teamFormData.description}
                    onChange={(e) => setTeamFormData({ ...teamFormData, description: e.target.value })}
                    style={{
                      ...inputStyle,
                      minHeight: '80px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    } as React.CSSProperties}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: `${spacing.md} ${spacing.lg}`,
                    backgroundColor: colors.primary.teal,
                    color: colors.primary.white,
                    border: 'none',
                    borderRadius: borderRadius.md,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: typography.fontSize.label1.size,
                    fontWeight: typography.fontSize.label1.weight,
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? 'Creating...' : 'Create Team'}
                </button>
              </form>
            </div>
          )}

          {teams.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: spacing.lg,
              }}
            >
              {teams.map((team) => (
                <div
                  key={team.id}
                  style={{
                    backgroundColor: colors.primary.white,
                    border: `2px solid ${colors.secondary.mediumTeal}`,
                    borderRadius: borderRadius.md,
                    padding: spacing.lg,
                    boxShadow: shadows.sm,
                  }}
                >
                  <h3
                    style={{
                      fontSize: typography.fontSize.h4.size,
                      fontWeight: typography.fontSize.h4.weight,
                      color: colors.primary.black,
                      margin: 0,
                      marginBottom: spacing.sm,
                    }}
                  >
                    {team.name}
                  </h3>
                  {team.description && (
                    <p
                      style={{
                        fontSize: typography.fontSize.body2.size,
                        color: colors.neutral[600],
                        margin: 0,
                        marginBottom: spacing.md,
                      }}
                    >
                      {team.description}
                    </p>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      gap: spacing.md,
                      marginTop: spacing.lg,
                      paddingTop: spacing.md,
                      borderTop: `1px solid ${colors.neutral[200]}`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: typography.fontSize.caption.size,
                        color: colors.neutral[500],
                      }}
                    >
                      Members: {team.memberCount || 0}
                    </span>
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      style={{
                        marginLeft: 'auto',
                        padding: `${spacing.xs} ${spacing.sm}`,
                        backgroundColor: colors.error,
                        color: colors.primary.white,
                        border: 'none',
                        borderRadius: borderRadius.sm,
                        cursor: 'pointer',
                        fontSize: typography.fontSize.label2.size,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={emptyStateStyle}>No teams yet. Create one to get started!</div>
          )}
        </div>
      )}
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number;
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
      textAlign: 'center',
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
        color,
        margin: 0,
      }}
    >
      {value}
    </p>
  </div>
);

// Reusable styles
const labelStyle: React.CSSProperties = {
  fontSize: typography.fontSize.label1.size,
  fontWeight: typography.fontSize.label1.weight,
  color: colors.neutral[600],
  margin: 0,
  marginBottom: spacing.sm,
};

const valueStyle: React.CSSProperties = {
  fontSize: typography.fontSize.body1.size,
  color: colors.primary.black,
  margin: 0,
  fontWeight: '500',
};

const inputLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: typography.fontSize.label1.size,
  fontWeight: typography.fontSize.label1.weight,
  color: colors.primary.black,
  marginBottom: spacing.sm,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: spacing.md,
  fontSize: typography.fontSize.body1.size,
  border: `1px solid ${colors.neutral[300]}`,
  borderRadius: borderRadius.md,
  boxSizing: 'border-box',
};

const emptyStateStyle: React.CSSProperties = {
  padding: spacing.xl,
  backgroundColor: colors.neutral[50],
  borderRadius: borderRadius.md,
  textAlign: 'center',
  color: colors.neutral[500],
};

export default OrganizationSettingsPage;

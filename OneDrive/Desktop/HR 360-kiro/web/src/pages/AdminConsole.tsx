/**
 * Admin Console - Main admin dashboard with sub-pages
 * Manages KB, users, organization, alerts, and incidents
 */

import React, { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import {
  setLoading as setKBLoading,
  setError as setKBError,
  setItems as setKBItems,
  addItem as addKBItem,
  deleteItem as deleteKBItem,
} from '../store/slices/kbSlice';
import {
  setLoading as setUserLoading,
  setError as setUserError,
  setItems as setUserItems,
  deleteItem as deleteUserItem,
} from '../store/slices/userSlice';
import {
  setLoading as setAlertLoading,
  setError as setAlertError,
  setItems as setAlertItems,
} from '../store/slices/alertSlice';
import {
  setLoading as setIncidentLoading,
  setError as setIncidentError,
  setItems as setIncidentItems,
} from '../store/slices/incidentSlice';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';
import apiService, { ApiError } from '../services/apiService';

const AdminConsole: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { items: kbGuides } = useSelector((state: RootState) => state.kb);
  const { items: users } = useSelector((state: RootState) => state.user);
  const { items: alerts } = useSelector((state: RootState) => state.alert);
  const { items: incidents } = useSelector((state: RootState) => state.incident);

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch KB guides
        dispatch(setKBLoading(true));
        const kbResponse = await apiService.getGuides({ pageSize: 100 });
        if (kbResponse.success && kbResponse.data) {
          dispatch(setKBItems(kbResponse.data));
        } else {
          dispatch(setKBError('Failed to load KB guides'));
        }

        // Fetch users
        dispatch(setUserLoading(true));
        const usersResponse = await apiService.getUsers({ pageSize: 100 });
        if (usersResponse.success && usersResponse.data) {
          dispatch(setUserItems(usersResponse.data));
        } else {
          dispatch(setUserError('Failed to load users'));
        }

        // Fetch alerts
        dispatch(setAlertLoading(true));
        const alertsResponse = await apiService.getAlerts({ pageSize: 100 });
        if (alertsResponse.success && alertsResponse.data) {
          dispatch(setAlertItems(alertsResponse.data));
        } else {
          dispatch(setAlertError('Failed to load alerts'));
        }

        // Fetch incidents
        dispatch(setIncidentLoading(true));
        const incidentsResponse = await apiService.getIncidents({ pageSize: 100 });
        if (incidentsResponse.success && incidentsResponse.data) {
          dispatch(setIncidentItems(incidentsResponse.data));
        } else {
          dispatch(setIncidentError('Failed to load incidents'));
        }
      } catch (err) {
        const apiError = err as ApiError;
        dispatch(setKBError(apiError.message || 'Failed to load KB guides'));
        dispatch(setUserError(apiError.message || 'Failed to load users'));
        dispatch(setAlertError(apiError.message || 'Failed to load alerts'));
        dispatch(setIncidentError(apiError.message || 'Failed to load incidents'));
      }
    };

    fetchData();
  }, [dispatch]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.primary.white,
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: colors.primary.white,
          borderBottom: `1px solid ${colors.neutral[200]}`,
          padding: spacing.xl,
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          <h1
            style={{
              fontSize: typography.fontSize.display2.size,
              fontWeight: typography.fontSize.display2.weight,
              color: colors.primary.black,
              margin: 0,
              marginBottom: spacing.sm,
            }}
          >
            Admin Console
          </h1>
          <p
            style={{
              fontSize: typography.fontSize.body2.size,
              color: colors.neutral[600],
              margin: 0,
            }}
          >
            Welcome, {user?.name || 'Admin'}
          </p>
        </div>
      </header>

      {/* Navigation */}
      <nav
        style={{
          backgroundColor: colors.primary.white,
          borderBottom: `1px solid ${colors.neutral[200]}`,
          overflowX: 'auto',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            gap: spacing.lg,
            padding: `0 ${spacing.xl}`,
          }}
        >
          <NavLink to="/admin" label="Dashboard" />
          <NavLink to="/admin/kb" label="KB Management" />
          <NavLink to="/admin/org" label="Organization" />
          <NavLink to="/admin/users" label="Users" />
          <NavLink to="/admin/alerts" label="Alerts" />
          <NavLink to="/admin/incidents" label="Incidents" />
        </div>
      </nav>

      {/* Main Content */}
      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: spacing.xl,
        }}
      >
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/kb" element={<KBManagement />} />
          <Route path="/org" element={<OrgManagement />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/alerts" element={<AlertManagementPage />} />
          <Route path="/incidents" element={<IncidentManagementPage />} />
        </Routes>
      </main>
    </div>
  );
};

interface NavLinkProps {
  to: string;
  label: string;
}

const NavLink: React.FC<NavLinkProps> = ({ to, label }) => (
  <Link
    to={to}
    style={{
      padding: `${spacing.lg} 0`,
      color: window.location.pathname === to ? colors.primary.teal : colors.neutral[600],
      textDecoration: 'none',
      borderBottom: window.location.pathname === to ? `2px solid ${colors.primary.teal}` : '2px solid transparent',
      fontSize: typography.fontSize.body1.size,
      fontWeight: '600',
      whiteSpace: 'nowrap',
      transition: 'all 200ms ease-in-out',
    }}
    onMouseOver={(e) => {
      if (window.location.pathname !== to) {
        (e.target as HTMLAnchorElement).style.color = colors.primary.teal;
      }
    }}
    onMouseOut={(e) => {
      if (window.location.pathname !== to) {
        (e.target as HTMLAnchorElement).style.color = colors.neutral[600];
      }
    }}
  >
    {label}
  </Link>
);

const AdminDashboard: React.FC = () => {
  const { items: alerts } = useSelector((state: RootState) => state.alert);
  const { items: kbGuides } = useSelector((state: RootState) => state.kb);
  const { items: incidents } = useSelector((state: RootState) => state.incident);
  const { items: users } = useSelector((state: RootState) => state.user);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: spacing.lg,
      }}
    >
      <StatCard
        label="Total Users"
        value={users?.length || 0}
        color={colors.primary.teal}
      />
      <StatCard
        label="Active Alerts"
        value={alerts?.filter((a: any) => a.isActive).length || 0}
        color={colors.warning}
      />
      <StatCard
        label="KB Guides"
        value={kbGuides?.length || 0}
        color={colors.success}
      />
      <StatCard
        label="Active Incidents"
        value={incidents?.filter((i: any) => i.status === 'active').length || 0}
        color={colors.error}
      />
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
      backgroundColor: colors.primary.white,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      boxShadow: shadows.sm,
      border: `2px solid ${color}`,
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

const KBManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: guides, loading, error } = useSelector((state: RootState) => state.kb);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', category: '' });

  const handleCreateGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      alert('Please fill in all fields');
      return;
    }

    try {
      dispatch(setKBLoading(true));
      const response = await apiService.createGuide({
        title: formData.title,
        description: formData.description,
        category: formData.category || 'General',
      });

      if (response.success && response.data) {
        dispatch(addKBItem(response.data));
        setFormData({ title: '', description: '', category: '' });
        setShowForm(false);
        alert('Guide created successfully!');
      } else {
        dispatch(setKBError('Failed to create guide'));
      }
    } catch (err) {
      const apiError = err as ApiError;
      dispatch(setKBError(apiError.message || 'Failed to create guide'));
    } finally {
      dispatch(setKBLoading(false));
    }
  };

  return (
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
            fontSize: typography.fontSize.h2.size,
            fontWeight: typography.fontSize.h2.weight,
            color: colors.primary.black,
            margin: 0,
          }}
        >
          Knowledge Base Management
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: `${spacing.md} ${spacing.lg}`,
            backgroundColor: colors.primary.teal,
            color: colors.primary.white,
            border: 'none',
            borderRadius: borderRadius.md,
            cursor: 'pointer',
            fontSize: typography.fontSize.label1.size,
            fontWeight: '600',
          }}
        >
          {showForm ? 'Cancel' : 'Create Guide'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreateGuide}
          style={{
            backgroundColor: colors.neutral[50],
            padding: spacing.lg,
            borderRadius: borderRadius.md,
            marginBottom: spacing.lg,
            border: `1px solid ${colors.neutral[200]}`,
          }}
        >
          <div style={{ marginBottom: spacing.md }}>
            <label style={{ display: 'block', marginBottom: spacing.sm, fontWeight: '600' }}>
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{
                width: '100%',
                padding: spacing.md,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: spacing.md }}>
            <label style={{ display: 'block', marginBottom: spacing.sm, fontWeight: '600' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: '100%',
                padding: spacing.md,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                boxSizing: 'border-box',
                minHeight: '100px',
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: `${spacing.md} ${spacing.lg}`,
              backgroundColor: colors.primary.teal,
              color: colors.primary.white,
              border: 'none',
              borderRadius: borderRadius.md,
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Create Guide
          </button>
        </form>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: spacing.xl }}>Loading...</div>
      ) : error ? (
        <div
          style={{
            backgroundColor: colors.error,
            color: colors.primary.white,
            padding: spacing.lg,
            borderRadius: borderRadius.md,
          }}
        >
          {error}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: spacing.lg,
          }}
        >
          {guides.map((guide: any) => (
            <div
              key={guide.id}
              style={{
                backgroundColor: colors.primary.white,
                padding: spacing.lg,
                borderRadius: borderRadius.md,
                border: `1px solid ${colors.neutral[200]}`,
                boxShadow: shadows.sm,
              }}
            >
              <h3
                style={{
                  fontSize: typography.fontSize.h4.size,
                  fontWeight: '600',
                  color: colors.primary.black,
                  margin: 0,
                  marginBottom: spacing.sm,
                }}
              >
                {guide.title}
              </h3>
              <p
                style={{
                  fontSize: typography.fontSize.body2.size,
                  color: colors.neutral[600],
                  margin: 0,
                  marginBottom: spacing.md,
                }}
              >
                {guide.description}
              </p>
              <span
                style={{
                  display: 'inline-block',
                  backgroundColor: colors.primary.teal,
                  color: colors.primary.white,
                  padding: `${spacing.xs} ${spacing.sm}`,
                  borderRadius: borderRadius.sm,
                  fontSize: typography.fontSize.caption.size,
                }}
              >
                {guide.category}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const OrgManagement: React.FC = () => {
  const [orgData, setOrgData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOrg = async () => {
      setLoading(true);
      try {
        const response = await apiService.getOrganization();
        if (response.success && response.data) {
          setOrgData(response.data);
        }
      } catch (err) {
        console.error('Failed to load organization:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrg();
  }, []);

  return (
    <div>
      <h2
        style={{
          fontSize: typography.fontSize.h2.size,
          fontWeight: typography.fontSize.h2.weight,
          color: colors.primary.black,
          marginBottom: spacing.lg,
        }}
      >
        Organization Management
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: spacing.xl }}>Loading...</div>
      ) : orgData ? (
        <div
          style={{
            backgroundColor: colors.primary.white,
            padding: spacing.lg,
            borderRadius: borderRadius.md,
            border: `1px solid ${colors.neutral[200]}`,
          }}
        >
          <div style={{ marginBottom: spacing.lg }}>
            <p style={{ fontSize: typography.fontSize.label1.size, fontWeight: '600', margin: 0 }}>
              Organization Name
            </p>
            <p style={{ fontSize: typography.fontSize.body1.size, color: colors.neutral[600], margin: 0 }}>
              {orgData.name}
            </p>
          </div>
          <div style={{ marginBottom: spacing.lg }}>
            <p style={{ fontSize: typography.fontSize.label1.size, fontWeight: '600', margin: 0 }}>
              Domain
            </p>
            <p style={{ fontSize: typography.fontSize.body1.size, color: colors.neutral[600], margin: 0 }}>
              {orgData.domain}
            </p>
          </div>
          <div>
            <p style={{ fontSize: typography.fontSize.label1.size, fontWeight: '600', margin: 0 }}>
              Created
            </p>
            <p style={{ fontSize: typography.fontSize.body1.size, color: colors.neutral[600], margin: 0 }}>
              {new Date(orgData.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: colors.neutral[50],
            padding: spacing.xl,
            borderRadius: borderRadius.md,
            textAlign: 'center',
          }}
        >
          No organization data available
        </div>
      )}
    </div>
  );
};

const UserManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: users, loading, error } = useSelector((state: RootState) => state.user);

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      dispatch(setUserLoading(true));
      const response = await apiService.deleteUser(userId);
      if (response.success) {
        dispatch(deleteUserItem(userId));
        alert('User deleted successfully!');
      } else {
        dispatch(setUserError('Failed to delete user'));
      }
    } catch (err) {
      const apiError = err as ApiError;
      dispatch(setUserError(apiError.message || 'Failed to delete user'));
    } finally {
      dispatch(setUserLoading(false));
    }
  };

  return (
    <div>
      <h2
        style={{
          fontSize: typography.fontSize.h2.size,
          fontWeight: typography.fontSize.h2.weight,
          color: colors.primary.black,
          marginBottom: spacing.lg,
        }}
      >
        User Management
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: spacing.xl }}>Loading...</div>
      ) : error ? (
        <div
          style={{
            backgroundColor: colors.error,
            color: colors.primary.white,
            padding: spacing.lg,
            borderRadius: borderRadius.md,
          }}
        >
          {error}
        </div>
      ) : (
        <div
          style={{
            overflowX: 'auto',
            backgroundColor: colors.primary.white,
            borderRadius: borderRadius.md,
            border: `1px solid ${colors.neutral[200]}`,
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr style={{ borderBottom: `2px solid ${colors.neutral[200]}` }}>
                <th
                  style={{
                    padding: spacing.lg,
                    textAlign: 'left',
                    fontWeight: '600',
                    color: colors.primary.black,
                  }}
                >
                  Name
                </th>
                <th
                  style={{
                    padding: spacing.lg,
                    textAlign: 'left',
                    fontWeight: '600',
                    color: colors.primary.black,
                  }}
                >
                  Email
                </th>
                <th
                  style={{
                    padding: spacing.lg,
                    textAlign: 'left',
                    fontWeight: '600',
                    color: colors.primary.black,
                  }}
                >
                  Role
                </th>
                <th
                  style={{
                    padding: spacing.lg,
                    textAlign: 'left',
                    fontWeight: '600',
                    color: colors.primary.black,
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user.id} style={{ borderBottom: `1px solid ${colors.neutral[200]}` }}>
                  <td style={{ padding: spacing.lg }}>
                    {user.firstName} {user.lastName}
                  </td>
                  <td style={{ padding: spacing.lg }}>{user.email}</td>
                  <td style={{ padding: spacing.lg }}>
                    <span
                      style={{
                        display: 'inline-block',
                        backgroundColor: colors.primary.teal,
                        color: colors.primary.white,
                        padding: `${spacing.xs} ${spacing.sm}`,
                        borderRadius: borderRadius.sm,
                        fontSize: typography.fontSize.caption.size,
                        textTransform: 'capitalize',
                      }}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: spacing.lg }}>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      style={{
                        padding: `${spacing.xs} ${spacing.sm}`,
                        backgroundColor: colors.error,
                        color: colors.primary.white,
                        border: 'none',
                        borderRadius: borderRadius.sm,
                        cursor: 'pointer',
                        fontSize: typography.fontSize.caption.size,
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const AlertManagementPage: React.FC = () => {
  const { items: alerts, loading, error } = useSelector((state: RootState) => state.alert);

  return (
    <div>
      <h2
        style={{
          fontSize: typography.fontSize.h2.size,
          fontWeight: typography.fontSize.h2.weight,
          color: colors.primary.black,
          marginBottom: spacing.lg,
        }}
      >
        Alert Management
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: spacing.xl }}>Loading...</div>
      ) : error ? (
        <div
          style={{
            backgroundColor: colors.error,
            color: colors.primary.white,
            padding: spacing.lg,
            borderRadius: borderRadius.md,
          }}
        >
          {error}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.md,
          }}
        >
          {alerts.map((alert: any) => (
            <div
              key={alert.id}
              style={{
                backgroundColor: colors.primary.white,
                padding: spacing.lg,
                borderRadius: borderRadius.md,
                border: `1px solid ${colors.neutral[200]}`,
                borderLeft: `4px solid ${alert.severity === 'critical' ? colors.error : alert.severity === 'high' ? colors.warning : colors.success}`,
              }}
            >
              <h3
                style={{
                  fontSize: typography.fontSize.h4.size,
                  fontWeight: '600',
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
                }}
              >
                {alert.description}
              </p>
              <p
                style={{
                  fontSize: typography.fontSize.caption.size,
                  color: colors.neutral[500],
                  margin: 0,
                }}
              >
                {new Date(alert.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const IncidentManagementPage: React.FC = () => {
  const { items: incidents, loading, error } = useSelector((state: RootState) => state.incident);

  return (
    <div>
      <h2
        style={{
          fontSize: typography.fontSize.h2.size,
          fontWeight: typography.fontSize.h2.weight,
          color: colors.primary.black,
          marginBottom: spacing.lg,
        }}
      >
        Incident Management
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: spacing.xl }}>Loading...</div>
      ) : error ? (
        <div
          style={{
            backgroundColor: colors.error,
            color: colors.primary.white,
            padding: spacing.lg,
            borderRadius: borderRadius.md,
          }}
        >
          {error}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.md,
          }}
        >
          {incidents.map((incident: any) => (
            <div
              key={incident.id}
              style={{
                backgroundColor: colors.primary.white,
                padding: spacing.lg,
                borderRadius: borderRadius.md,
                border: `2px solid ${incident.severity === 'critical' ? colors.error : incident.severity === 'high' ? colors.warning : colors.success}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: typography.fontSize.h4.size,
                      fontWeight: '600',
                      color: colors.primary.black,
                      margin: 0,
                      marginBottom: spacing.sm,
                    }}
                  >
                    {incident.title}
                  </h3>
                  <p
                    style={{
                      fontSize: typography.fontSize.body2.size,
                      color: colors.neutral[600],
                      margin: 0,
                      marginBottom: spacing.sm,
                    }}
                  >
                    {incident.description}
                  </p>
                  <p
                    style={{
                      fontSize: typography.fontSize.caption.size,
                      color: colors.neutral[500],
                      margin: 0,
                    }}
                  >
                    Started: {new Date(incident.startTime).toLocaleString()}
                  </p>
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    backgroundColor: incident.severity === 'critical' ? colors.error : incident.severity === 'high' ? colors.warning : colors.success,
                    color: colors.primary.white,
                    padding: `${spacing.xs} ${spacing.sm}`,
                    borderRadius: borderRadius.sm,
                    fontSize: typography.fontSize.caption.size,
                    fontWeight: '600',
                    textTransform: 'capitalize',
                  }}
                >
                  {incident.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminConsole;

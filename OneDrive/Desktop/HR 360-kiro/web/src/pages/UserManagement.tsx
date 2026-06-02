/**
 * User Management Page
 * Manage organization users and their roles
 */

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { setLoading, setError, setItems, deleteUser } from '../store/slices/userSlice';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';
import apiService, { ApiError } from '../services/apiService';

interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'hr' | 'employee' | 'guest';
  phone?: string;
}

interface UserStats {
  total: number;
  byRole: { [key: string]: number };
  active: number;
  inactive: number;
}

const UserManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: users, loading, error } = useSelector((state: RootState) => state.user);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    byRole: {},
    active: 0,
    inactive: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'employee',
    phone: '',
  });

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      dispatch(setLoading(true));
      try {
        const response = await apiService.getUsers({ pageSize: 100 });
        if (response.success && response.data) {
          dispatch(setItems(response.data));
          calculateStats(response.data);
        } else {
          dispatch(setError('Failed to load users'));
        }
      } catch (err) {
        const apiError = err as ApiError;
        dispatch(setError(apiError.message || 'Failed to load users'));
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchUsers();
  }, [dispatch]);

  const calculateStats = (userList: any[]) => {
    const roles: { [key: string]: number } = {};
    let active = 0;
    let inactive = 0;

    userList.forEach((user) => {
      const role = user.role || 'employee';
      roles[role] = (roles[role] || 0) + 1;

      if (user.isActive !== false) {
        active++;
      } else {
        inactive++;
      }
    });

    setStats({
      total: userList.length,
      byRole: roles,
      active,
      inactive,
    });
  };

  const handleCreateOrUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.firstName || !formData.lastName) {
      alert('Please fill in all required fields');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      dispatch(setLoading(true));

      let response;
      if (editingId) {
        response = await apiService.updateUser(editingId, formData);
        if (response.success && response.data) {
          // Manually update the user in the list
          const updatedUsers = users.map((u) => (u.id === editingId ? response.data : u));
          dispatch(setItems(updatedUsers));
          calculateStats(updatedUsers);
        }
      } else {
        response = await apiService.createUser(formData);
        if (response.success && response.data) {
          const updatedUsers = [...users, response.data];
          dispatch(setItems(updatedUsers));
          calculateStats(updatedUsers);
        }
      }

      if (response.success) {
        setFormData({
          email: '',
          firstName: '',
          lastName: '',
          role: 'employee',
          phone: '',
        });
        setEditingId(null);
        setShowForm(false);
        alert(editingId ? 'User updated successfully!' : 'User created successfully!');
      } else {
        dispatch(setError('Failed to save user'));
      }
    } catch (err) {
      const apiError = err as ApiError;
      dispatch(setError(apiError.message || 'Failed to save user'));
      alert(apiError.message || 'Failed to save user');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        dispatch(setLoading(true));
        const response = await apiService.deleteUser(id);
        if (response.success) {
          dispatch(deleteUser(id));
          const updated = users.filter((u) => u.id !== id);
          calculateStats(updated);
        }
      } catch (err) {
        const apiError = err as ApiError;
        dispatch(setError(apiError.message || 'Failed to delete user'));
      } finally {
        dispatch(setLoading(false));
      }
    }
  };

  const handleEditUser = (user: any) => {
    setFormData({
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role || 'employee',
      phone: user.phone || '',
    });
    setEditingId(user.id);
    setShowForm(true);
  };

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const email = (user.email || '').toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
    const matchesRole = !selectedRole || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const roles = Object.keys(stats.byRole);

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'admin':
        return colors.error;
      case 'hr':
        return colors.warning;
      case 'employee':
        return colors.success;
      case 'guest':
        return colors.neutral[400];
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
            User Management
          </h1>
        </div>
        <button
          onClick={() => {
            setFormData({
              email: '',
              firstName: '',
              lastName: '',
              role: 'employee',
              phone: '',
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
          {showForm ? 'Cancel' : 'Add User'}
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
        <StatCard label="Total Users" value={stats.total} color={colors.neutral[400]} />
        <StatCard label="Active" value={stats.active} color={colors.success} />
        <StatCard label="Inactive" value={stats.inactive} color={colors.neutral[400]} />
        {roles.map((role) => (
          <StatCard
            key={role}
            label={role.charAt(0).toUpperCase() + role.slice(1)}
            value={stats.byRole[role]}
            color={getRoleColor(role)}
          />
        ))}
      </div>

      {/* Search and Filter */}
      <div
        style={{
          display: 'flex',
          gap: spacing.lg,
          marginBottom: spacing.xl,
          flexWrap: 'wrap',
        }}
      >
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: spacing.md,
            fontSize: typography.fontSize.body1.size,
            border: `1px solid ${colors.neutral[300]}`,
            borderRadius: borderRadius.md,
            boxSizing: 'border-box',
          }}
        />
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          style={{
            padding: spacing.md,
            fontSize: typography.fontSize.body1.size,
            border: `1px solid ${colors.neutral[300]}`,
            borderRadius: borderRadius.md,
            backgroundColor: colors.primary.white,
            cursor: 'pointer',
            minWidth: '150px',
          }}
        >
          <option value="">All Roles</option>
          {roles.map((role) => (
            <option key={role} value={role}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Form */}
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
            {editingId ? 'Edit User' : 'Add New User'}
          </h2>

          <form onSubmit={handleCreateOrUpdateUser}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg, marginBottom: spacing.lg }}>
              <div>
                <label style={labelStyle}>First Name *</label>
                <input
                  type="text"
                  placeholder="First name..."
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Last Name *</label>
                <input
                  type="text"
                  placeholder="Last name..."
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label style={labelStyle}>Email *</label>
              <input
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg, marginBottom: spacing.lg }}>
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  style={inputStyle}
                >
                  <option value="guest">Guest</option>
                  <option value="employee">Employee</option>
                  <option value="hr">HR</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
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
              {editingId ? 'Update User' : 'Create User'}
            </button>
          </form>
        </div>
      )}

      {/* Users List */}
      <div>
        <h2
          style={{
            fontSize: typography.fontSize.h2.size,
            fontWeight: typography.fontSize.h2.weight,
            color: colors.primary.black,
            marginBottom: spacing.lg,
          }}
        >
          Users ({filteredUsers.length})
        </h2>

        {loading ? (
          <div style={emptyStateStyle}>Loading users...</div>
        ) : error ? (
          <div style={{ ...emptyStateStyle, backgroundColor: colors.error, color: colors.primary.white }}>
            {error}
          </div>
        ) : filteredUsers.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: colors.primary.white,
                boxShadow: shadows.md,
                borderRadius: borderRadius.md,
                overflow: 'hidden',
              }}
            >
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.neutral[200]}`, backgroundColor: colors.neutral[50] }}>
                  <th
                    style={{
                      padding: spacing.lg,
                      textAlign: 'left',
                      fontWeight: typography.fontSize.label1.weight,
                      color: colors.primary.black,
                      fontSize: typography.fontSize.label1.size,
                    }}
                  >
                    Name
                  </th>
                  <th
                    style={{
                      padding: spacing.lg,
                      textAlign: 'left',
                      fontWeight: typography.fontSize.label1.weight,
                      color: colors.primary.black,
                      fontSize: typography.fontSize.label1.size,
                    }}
                  >
                    Email
                  </th>
                  <th
                    style={{
                      padding: spacing.lg,
                      textAlign: 'left',
                      fontWeight: typography.fontSize.label1.weight,
                      color: colors.primary.black,
                      fontSize: typography.fontSize.label1.size,
                    }}
                  >
                    Role
                  </th>
                  <th
                    style={{
                      padding: spacing.lg,
                      textAlign: 'left',
                      fontWeight: typography.fontSize.label1.weight,
                      color: colors.primary.black,
                      fontSize: typography.fontSize.label1.size,
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: spacing.lg,
                      textAlign: 'left',
                      fontWeight: typography.fontSize.label1.weight,
                      color: colors.primary.black,
                      fontSize: typography.fontSize.label1.size,
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user: any, index: number) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: `1px solid ${colors.neutral[200]}`,
                      backgroundColor: index % 2 === 0 ? colors.primary.white : colors.neutral[50],
                    }}
                  >
                    <td style={{ padding: spacing.lg, fontSize: typography.fontSize.body1.size }}>
                      {user.firstName} {user.lastName}
                    </td>
                    <td style={{ padding: spacing.lg, fontSize: typography.fontSize.body1.size }}>
                      {user.email}
                    </td>
                    <td style={{ padding: spacing.lg }}>
                      <span
                        style={{
                          display: 'inline-block',
                          backgroundColor: getRoleColor(user.role),
                          color: colors.primary.white,
                          padding: `${spacing.xs} ${spacing.sm}`,
                          borderRadius: borderRadius.sm,
                          fontSize: typography.fontSize.label2.size,
                          fontWeight: typography.fontSize.label2.weight,
                          textTransform: 'capitalize',
                        }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: spacing.lg }}>
                      <span
                        style={{
                          display: 'inline-block',
                          backgroundColor: user.isActive !== false ? colors.success : colors.neutral[300],
                          color: colors.primary.white,
                          padding: `${spacing.xs} ${spacing.sm}`,
                          borderRadius: borderRadius.sm,
                          fontSize: typography.fontSize.label2.size,
                          fontWeight: typography.fontSize.label2.weight,
                        }}
                      >
                        {user.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: spacing.lg }}>
                      <div style={{ display: 'flex', gap: spacing.md }}>
                        <button
                          onClick={() => handleEditUser(user)}
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
                          onClick={() => handleDeleteUser(user.id)}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={emptyStateStyle}>
            {searchQuery || selectedRole ? 'No users match your search' : 'No users yet'}
          </div>
        )}
      </div>
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

export default UserManagement;

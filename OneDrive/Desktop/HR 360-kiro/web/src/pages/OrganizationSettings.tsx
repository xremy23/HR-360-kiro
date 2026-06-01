import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { AppDispatch, RootState } from '../store/store';
import apiService, { ApiError } from '../services/apiService';

const OrganizationSettings: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [organization, setOrganization] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [tab, setTab] = useState<'overview' | 'manage' | 'invite'>('overview');
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);
  
  // Form states
  const [newOrgName, setNewOrgName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('employee');

  // Load organization data
  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    setLoading(true);
    try {
      const orgResponse = await apiService.getOrganization();
      if (orgResponse.success && orgResponse.data) {
        setOrganization(orgResponse.data);
      }

      // Load users if admin
      if (user?.role === 'admin' || user?.role === 'hr') {
        const usersResponse = await apiService.getOrganizationUsers();
        if (usersResponse.success && usersResponse.data) {
          setUsers(usersResponse.data);
        }
      }
    } catch (error: any) {
      const apiError = error as ApiError;
      console.error('Failed to load organization:', apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newOrgName.trim()) {
      toast.error('Organization name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.createOrganization({
        name: newOrgName,
        emailDomain: user?.email.split('@')[1],
      });

      if (response.success) {
        setOrganization(response.data);
        setNewOrgName('');
        setShowCreateOrg(false);
        toast.success('Organization created successfully!');
        
        // Reload org data
        loadOrganization();
      }
    } catch (error: any) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail.trim()) {
      toast.error('Email is required');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.inviteUserToOrganization({
        email: inviteEmail,
        role: inviteRole,
      });

      if (response.success) {
        setInviteEmail('');
        setShowInviteUser(false);
        toast.success(`Invitation sent to ${inviteEmail}`);
      }
    } catch (error: any) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Remove ${userEmail} from organization?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.removeUserFromOrganization(userId);
      if (response.success) {
        setUsers(users.filter(u => u.id !== userId));
        toast.success('User removed from organization');
      }
    } catch (error: any) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Failed to remove user');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'hr';

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <p>Please log in to access organization settings</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {organization ? 'Organization Settings' : 'Create Organization'}
          </h1>
          <p className="text-gray-600 mt-2">
            {organization 
              ? 'Manage your organization and invite team members'
              : 'Set up an organization to start managing your team'}
          </p>
        </div>

        {/* Organization Overview */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Organization Info</h2>
            {!organization && (
              <button
                onClick={() => setShowCreateOrg(!showCreateOrg)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Organization
              </button>
            )}
          </div>

          {organization ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name
                </label>
                <p className="text-lg text-gray-900 font-semibold">{organization.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Domain
                </label>
                <p className="text-gray-600">{organization.emailDomain}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invite Code
                </label>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-mono bg-gray-100 px-3 py-2 rounded">
                    {organization.inviteCode}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(organization.inviteCode);
                      toast.success('Invite code copied!');
                    }}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created
                </label>
                <p className="text-gray-600">
                  {new Date(organization.createdAt).toLocaleDateString()}
                </p>
              </div>

              {isAdmin && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-green-600 font-medium">
                    ✅ You are an Admin of this organization
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏢</div>
              <p className="text-gray-600 mb-6 text-lg">
                You don't have an organization yet. Create one to get started!
              </p>
              {!showCreateOrg && (
                <button
                  onClick={() => setShowCreateOrg(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Create Your First Organization
                </button>
              )}
            </div>
          )}
        </div>

        {/* Create Organization Form */}
        {!organization && showCreateOrg && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Create New Organization
            </h3>
            <form onSubmit={handleCreateOrganization}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g., Acme Corporation"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Creating...' : 'Create Organization'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateOrg(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Management Tabs */}
        {organization && isAdmin && (
          <>
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="flex border-b">
                <button
                  onClick={() => setTab('overview')}
                  className={`flex-1 py-4 px-6 font-medium ${
                    tab === 'overview'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setTab('manage')}
                  className={`flex-1 py-4 px-6 font-medium ${
                    tab === 'manage'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Members ({users.length})
                </button>
                <button
                  onClick={() => setTab('invite')}
                  className={`flex-1 py-4 px-6 font-medium ${
                    tab === 'invite'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Invite
                </button>
              </div>

              <div className="p-6">
                {tab === 'manage' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Organization Members
                    </h3>
                    {users.length > 0 ? (
                      <div className="space-y-3">
                        {users.map((u) => (
                          <div
                            key={u.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {u.firstName} {u.lastName} {u.email === user?.email && '(You)'}
                              </p>
                              <p className="text-sm text-gray-600">{u.email}</p>
                              <div className="flex gap-2 mt-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {u.role}
                                </span>
                              </div>
                            </div>
                            {u.email !== user?.email && (
                              <button
                                onClick={() => handleRemoveUser(u.id, u.email)}
                                disabled={loading}
                                className="px-3 py-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">No members yet</p>
                    )}
                  </div>
                )}

                {tab === 'invite' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Invite Team Members
                    </h3>
                    {!showInviteUser ? (
                      <button
                        onClick={() => setShowInviteUser(true)}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Send Invitation
                      </button>
                    ) : (
                      <form onSubmit={handleInviteUser} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="colleague@example.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Role
                          </label>
                          <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                          >
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                            <option value="hr">HR</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                          >
                            {loading ? 'Sending...' : 'Send Invitation'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowInviteUser(false)}
                            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* User Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <p className="text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Role</label>
              <p className="text-gray-900 capitalize">{user?.role}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <p className="text-green-600 font-medium">✅ Active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationSettings;

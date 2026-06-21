import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AppDispatch, RootState } from '../store/store';
import apiService, { ApiError } from '../services/apiService';
import { setOrganization as setOrganizationRedux } from '../store/slices/authSlice';

const OrganizationSettings: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [organization, setOrganizationState] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [tab, setTab] = useState<'overview' | 'manage' | 'invite'>('overview');
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);
  
  // Form states
  const [newOrgName, setNewOrgName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('employee');

  const loadOrganization = async () => {
    setLoading(true);
    
    // Set a timeout to ensure loading is always set to false
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    try {
      const orgResponse = await apiService.getOrganization();
      if (orgResponse.success && orgResponse.data) {
        setOrganizationState(orgResponse.data);
      } else {
        // No organization found - this is expected for new users
      }

      // Load users if admin
      if (user?.role === 'admin' || user?.role === 'hr') {
        const usersResponse = await apiService.getOrganizationUsers();
        if (usersResponse.success && usersResponse.data) {
          setUsers(usersResponse.data);
        }
      }
    } catch (error: any) {
      // Expected error - user doesn't have an organization yet, or not authenticated
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  // Load organization data
  useEffect(() => {
    loadOrganization();
  }, [user]);

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

      if (response.success && response.data) {
        // Set the organization in local state immediately with full data
        const orgData = {
          id: response.data.id,
          name: response.data.name,
          emailDomain: response.data.emailDomain,
          logoUrl: response.data.logoUrl,
          description: response.data.description,
          isActive: response.data.isActive,
          createdBy: response.data.createdBy,
          createdAt: response.data.createdAt,
          updatedAt: response.data.updatedAt,
          inviteCode: response.data.inviteCode // Store invite code
        };
        
        console.log('✅ Organization created, setting state:', orgData);
        setOrganizationState(orgData);
        setNewOrgName('');
        setShowCreateOrg(false);
        toast.success('Organization created successfully!');
        
        // Update Redux state with new organization
        try {
          console.log('Dispatching setOrganizationRedux with:', {
            organizationId: response.data.id,
            role: 'admin'
          });
          dispatch(setOrganizationRedux({
            organizationId: response.data.id,
            role: 'admin' // User who creates org becomes admin
          }));
          console.log('✅ Redux state updated successfully');
        } catch (reduxError) {
          console.error('❌ Redux dispatch error:', reduxError);
          // Still update localStorage even if Redux fails
        }
        
        // Update user data in localStorage to reflect new orgId
        if (user) {
          const updatedUser = {
            ...user,
            organizationId: response.data.id,
            role: 'admin', // User who creates org becomes admin
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          console.log('✅ User updated in localStorage');
        }
        
        // Reload org data (will refetch from backend)
        loadOrganization();
      } else {
        throw new Error(response.error?.message || 'Failed to create organization');
      }
    } catch (error: any) {
      const apiError = error as ApiError;
      const errorMsg = apiError.message || error?.message || 'Failed to create organization';
      toast.error(errorMsg);
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
      <div className="min-h-screen bg-gray-100 dark:bg-neutral-900 flex items-center justify-center p-4">
        <p>Please log in to access organization settings</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            {organization ? 'Organization Settings' : 'Create Organization'}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            {organization 
              ? 'Manage your organization and invite team members'
              : 'Set up an organization to start managing your team'}
          </p>
        </div>

        {/* Organization Overview */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-stone-100 dark:border-neutral-850 shadow-xs p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Organization Info</h2>
            {!organization && (
              <button
                onClick={() => setShowCreateOrg(!showCreateOrg)}
                className="px-4 py-2 bg-gradient-to-r from-[#038F8D] to-[#024645] hover:from-[#02706e] hover:to-[#01302e] text-white rounded-lg font-semibold transition"
              >
                {showCreateOrg ? 'Cancel' : 'Create Organization'}
              </button>
            )}
          </div>

          {organization ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Organization Name
                </label>
                <p className="text-lg text-neutral-900 dark:text-white font-semibold">
                  {String(organization.name || 'N/A')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Email Domain
                </label>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {String(organization.emailDomain || 'N/A')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Invite Code
                </label>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-mono bg-neutral-100 dark:bg-neutral-800 px-3 py-2 rounded flex-1">
                    {String(organization.inviteCode || 'N/A')}
                  </p>
                  {organization.inviteCode ? (
                    <button
                      onClick={() => {
                        const codeValue = String(organization.inviteCode);
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                          navigator.clipboard.writeText(codeValue)
                            .then(() => {
                              toast.success('Invite code copied to clipboard!');
                            })
                            .catch(() => {
                              // Fallback: manual copy
                              const textarea = document.createElement('textarea');
                              textarea.value = codeValue;
                              document.body.appendChild(textarea);
                              textarea.select();
                              document.execCommand('copy');
                              document.body.removeChild(textarea);
                              toast.success('Invite code copied!');
                            });
                        } else {
                          // Fallback for browsers without clipboard API
                          const textarea = document.createElement('textarea');
                          textarea.value = codeValue;
                          document.body.appendChild(textarea);
                          textarea.select();
                          document.execCommand('copy');
                          document.body.removeChild(textarea);
                          toast.success('Invite code copied!');
                        }
                      }}
                      className="px-4 py-2 bg-[#038F8D] text-white rounded hover:bg-[#027270] active:scale-95 transition-all font-medium text-sm"
                      title="Click to copy invite code"
                    >
                      📋 Copy
                    </button>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Created
                </label>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {organization.createdAt ? new Date(organization.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>

              {isAdmin && (
                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-4">
                    ✅ You are an Admin of this organization
                  </p>
                  <button
                    onClick={() => {
                      // Navigate to IT admin console
                      window.location.href = '/admin-console';
                    }}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-semibold transition"
                  >
                    📊 Go to IT Admin Console
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏢</div>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-lg">
                You don't have an organization yet.
              </p>
              <div className="flex flex-col gap-3">
                {!showCreateOrg && (
                  <>
                    <button
                      onClick={() => setShowCreateOrg(true)}
                      className="px-6 py-3 bg-gradient-to-r from-[#038F8D] to-[#024645] hover:from-[#02706e] hover:to-[#01302e] text-white rounded-lg font-semibold transition"
                    >
                      Create Your First Organization
                    </button>
                    <p className="text-neutral-500 dark:text-neutral-400">or</p>
                    <a
                      href="/join-org"
                      className="px-6 py-3 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg font-semibold transition inline-block"
                    >
                      Join an Existing Organization
                    </a>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Create Organization Form */}
        {!organization && showCreateOrg && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-stone-100 dark:border-neutral-850 shadow-xs p-6 mb-6">
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
              Create New Organization
            </h3>
            
            <form onSubmit={handleCreateOrganization}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Organization Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="org-name-input"
                    value={newOrgName}
                    onChange={(e) => {
                      setNewOrgName(e.target.value);
                    }}
                    placeholder="e.g., Acme Corporation"
                    className={`w-full px-4 py-2 border rounded-lg outline-none transition ${
                      loading
                        ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 cursor-not-allowed'
                        : 'bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#038F8D] focus:border-transparent'
                    }`}
                    disabled={loading}
                    autoFocus={!loading}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#038F8D] to-[#024645] hover:from-[#02706e] hover:to-[#01302e] text-white rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Organization'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateOrg(false)}
                  className="flex-1 px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-700 transition"
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
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-stone-100 dark:border-neutral-850 shadow-xs mb-6">
              <div className="flex border-b border-neutral-200 dark:border-neutral-800">
                <button
                  onClick={() => setTab('overview')}
                  className={`flex-1 py-4 px-6 font-medium transition ${
                    tab === 'overview'
                      ? 'border-b-2 border-[#038F8D] text-[#038F8D] dark:text-[#49D7D1]'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setTab('manage')}
                  className={`flex-1 py-4 px-6 font-medium transition ${
                    tab === 'manage'
                      ? 'border-b-2 border-[#038F8D] text-[#038F8D] dark:text-[#49D7D1]'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  Members ({users.length})
                </button>
                <button
                  onClick={() => setTab('invite')}
                  className={`flex-1 py-4 px-6 font-medium transition ${
                    tab === 'invite'
                      ? 'border-b-2 border-[#038F8D] text-[#038F8D] dark:text-[#49D7D1]'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  Invite
                </button>
              </div>

              <div className="p-6">
                {tab === 'manage' && (
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                      Organization Members
                    </h3>
                    {users.length > 0 ? (
                      <div className="space-y-3">
                        {users.map((u) => (
                          <div
                            key={u.id}
                            className="flex items-center justify-between p-4 bg-stone-50 dark:bg-neutral-800 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-neutral-900 dark:text-white">
                                {u.firstName} {u.lastName} {u.email === user?.email && '(You)'}
                              </p>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">{u.email}</p>
                              <div className="flex gap-2 mt-2">
                                <span className="px-2 py-1 bg-[#038F8D]/20 text-[#038F8D] dark:text-[#49D7D1] text-xs rounded-full font-semibold">
                                  {u.role}
                                </span>
                              </div>
                            </div>
                            {u.email !== user?.email && (
                              <button
                                onClick={() => handleRemoveUser(u.id, u.email)}
                                disabled={loading}
                                className="px-3 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded transition disabled:opacity-50"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-neutral-600 dark:text-neutral-400">No members yet</p>
                    )}
                  </div>
                )}

                {tab === 'invite' && (
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                      Invite Team Members
                    </h3>
                    {!showInviteUser ? (
                      <button
                        onClick={() => setShowInviteUser(true)}
                        className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold transition"
                      >
                        Send Invitation
                      </button>
                    ) : (
                      <form onSubmit={handleInviteUser} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="colleague@example.com"
                            className="w-full px-4 py-2 border border-stone-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#038F8D] transition disabled:opacity-50"
                            style={{ pointerEvents: 'auto' }}
                            disabled={loading}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Role
                          </label>
                          <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                            className="w-full px-4 py-2 border border-stone-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#038F8D] transition disabled:opacity-50"
                            style={{ pointerEvents: 'auto' }}
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
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
                          >
                            {loading ? 'Sending...' : 'Send Invitation'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowInviteUser(false)}
                            className="flex-1 px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-700 transition"
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
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-stone-100 dark:border-neutral-850 shadow-xs p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Your Profile</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</label>
              <p className="text-neutral-900 dark:text-white">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Role</label>
              <p className="text-neutral-900 dark:text-white capitalize">{user?.role}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Status</label>
              <p className="text-green-600 dark:text-green-400 font-medium">✅ Active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationSettings;


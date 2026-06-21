import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { AppDispatch, RootState } from '../store/store';
import apiService, { ApiError } from '../services/apiService';
import { setOrganization } from '../store/slices/authSlice';

const JoinOrganization: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState(searchParams.get('code') || '');
  const [organizationName, setOrganizationName] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  // If user already has an organization, redirect to settings
  useEffect(() => {
    if (user?.orgId) {
      toast.error('You are already part of an organization');
      navigate('/org-settings');
    }
  }, [user?.orgId, navigate]);

  const handleJoinOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    setLoading(true);
    try {
      console.log('Calling joinOrganizationWithCode with code:', inviteCode.toUpperCase());
      const response = await apiService.joinOrganizationWithCode(inviteCode.trim().toUpperCase());

      console.log('Join org response:', response);

      if (response.success && response.data) {
        const org = response.data.organization;
        const updatedUser = response.data.user;

        console.log('Successfully joined organization:', org);

        // Update Redux state with organization
        if (updatedUser) {
          dispatch(setOrganization({
            organizationId: org.id,
            role: updatedUser.role || 'employee'
          }));
          
          // Update user data in localStorage
          localStorage.setItem('user', JSON.stringify(updatedUser));
          console.log('Updated user in localStorage:', updatedUser);
        }

        toast.success(`Successfully joined ${org.name}!`);
        
        // Redirect to organization settings
        setTimeout(() => {
          navigate('/org-settings');
        }, 1000);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Error joining organization:', error);
      const apiError = error as ApiError;
      const errorMsg = apiError.message || error?.message || 'Failed to join organization';
      console.error('Error message:', errorMsg);
      
      if (errorMsg?.includes('Invalid or expired')) {
        toast.error('Invalid or expired invite code');
      } else if (errorMsg?.includes('already part')) {
        toast.error('You are already part of an organization');
        navigate('/org-settings');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-teal to-secondary-medium flex items-center justify-center p-4">
      <div className="bg-primary-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏢</div>
          <h1 className="font-display text-h2 text-primary-black dark:text-white mb-2">
            Join Organization
          </h1>
          <p className="font-sans text-body2 text-neutral-600">
            Enter the invite code to join an organization
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleJoinOrganization} className="space-y-6">
          {/* Invite Code Input */}
          <div>
            <label className="block font-sans text-label1 text-primary-black dark:text-white font-semibold mb-2">
              Invite Code
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="e.g., ABC12345"
              className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg font-mono text-lg text-center tracking-widest focus:border-primary-teal focus:outline-none transition"
              disabled={loading}
              maxLength={8}
            />
            <p className="font-sans text-body3 text-neutral-500 mt-2">
              You can find this code in the organization's invite link or email
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !inviteCode.trim()}
            className="w-full bg-primary-teal hover:bg-secondary-medium text-primary-white font-sans font-semibold py-3 rounded-lg transition disabled:bg-neutral-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Joining...' : 'Join Organization'}
          </button>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="w-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 text-primary-black dark:text-white font-sans font-semibold py-3 rounded-lg transition"
          >
            Cancel
          </button>
        </form>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="font-sans text-body3 text-blue-900">
            <strong>💡 Tip:</strong> If you received an invite link in an email, you can click it directly to join. Otherwise, paste the invite code above.
          </p>
        </div>

        {/* User Info */}
        <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <p className="font-sans text-body3 text-neutral-600 text-center">
            Joining as: <strong>{user?.email}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinOrganization;


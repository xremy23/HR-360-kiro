import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginSuccess, setError, setLoading } from '../store/slices/authSlice';
import { AppDispatch } from '../store/store';
import apiService, { ApiError } from '../services/apiService';
import CorporateSignIn from '../components/CorporateSignIn';
import { getDeviceType } from '../utils/deviceDetection';

// Unregister all service workers on component mount
const unregisterServiceWorkers = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('Service Worker unregistered');
      }
    } catch (error) {
      console.log('Error unregistering service workers:', error);
    }
  }
};

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'responder' | 'employee';
  team?: string;
  phone?: string;
  address?: string;
}

const LoginPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [darkMode, setDarkMode] = useState(false);
  const [isVerifyingLink, setIsVerifyingLink] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  // Mock user list for CorporateSignIn component
  const mockUsers: User[] = [
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@corporate.com',
      role: 'admin',
      team: 'Operations',
    },
    {
      id: '2',
      name: 'Test User',
      email: 'test@corporate.com',
      role: 'employee',
      team: 'Safety',
    },
  ];

  // NOTE: Domain validation moved to server-side only
  // Frontend accepts any email format - backend validates during org joining

  // Unregister service workers on mount
  useEffect(() => {
    unregisterServiceWorkers();
    
    // Detect device type
    const detected = getDeviceType();
    setDeviceType(detected);
  }, []);

  // Check if this is a magic link verification
  useEffect(() => {
    const token = searchParams.get('token');
    const linkEmail = searchParams.get('email');

    if (token && linkEmail) {
      verifyMagicLink(linkEmail, token);
    }
  }, [searchParams]);

  // Redirect to home if already authenticated
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        // User is already authenticated, redirect to home
        navigate('/', { replace: true });
      } catch (error) {
        console.error('Failed to parse saved user:', error);
      }
    }
  }, [navigate]);

  const verifyMagicLink = async (linkEmail: string, token: string) => {
    setIsVerifyingLink(true);
    dispatch(setLoading(true));

    try {
      console.log('Verifying magic link for:', linkEmail);
      const response = await apiService.verifyMagicLink(linkEmail, token);

      if (response.success && response.data) {
        const jwtToken = response.data.token;
        const backendUser = response.data.user;

        console.log('Magic link verified successfully:', backendUser.email);

        // Use user data from verification response (no need for extra profile call)
        const user = {
          id: backendUser.id,
          email: backendUser.email,
          name: `${backendUser.firstName} ${backendUser.lastName}`.trim() || backendUser.email,
          role: backendUser.role || 'employee',
          organizationId: backendUser.orgId,
          avatar: backendUser.avatar,
        };

        // Update Redux store first
        dispatch(loginSuccess({ user, token: jwtToken }));
        
        // Then update localStorage
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(user));

        console.log('Token and user saved to localStorage and Redux store');
        toast.success('Login successful!');

        // Navigate after a small delay to ensure state update completes
        setTimeout(() => {
          console.log('Navigating to home...');
          navigate('/', { replace: true });
        }, 200);
      } else {
        const errorMessage = response.error?.message || 'Magic link verification failed';
        console.error('Magic link verification failed:', errorMessage);
        dispatch(setError(errorMessage));
        toast.error(errorMessage);
        setIsVerifyingLink(false);
        dispatch(setLoading(false));
      }
    } catch (error: any) {
      const apiError = error as ApiError;
      const errorMessage = apiError.message || 'Magic link verification failed';
      console.error('Magic link verification error:', errorMessage, error);
      dispatch(setError(errorMessage));
      toast.error(errorMessage);
      setIsVerifyingLink(false);
      dispatch(setLoading(false));
    }
  };

  const handleSignIn = async (user: User) => {
    // Sign in existing user with magic link
    try {
      const response = await apiService.post('/auth/send-magic-link', { email: user.email });

      if (response.success) {
        toast.success('Magic link sent to your email! Check your inbox to log in.');
      } else {
        throw new Error('Failed to send magic link');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Sign in failed. Please try again.';
      toast.error(errorMessage);
      console.error('Sign in error:', error);
    }
  };

  const handleAddAndSignIn = async (user: User) => {
    // Add new user and send magic link
    try {
      const response = await apiService.post('/auth/send-magic-link', { email: user.email });

      if (response.success) {
        toast.success('Account created! Magic link sent to your email.');
      } else {
        throw new Error('Failed to create account');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create account. Please try again.';
      toast.error(errorMessage);
      console.error('Add and sign in error:', error);
    }
  };

  if (isVerifyingLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-bg-light to-brand-cyan/10 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="font-display text-h1 text-brand-teal-deep mb-4">
            Verifying Magic Link...
          </h1>
          <p className="font-sans text-body2 text-brand-slate-light">
            Please wait while we log you in
          </p>
        </div>
      </div>
    );
  }

  // For desktop devices, show a full-page desktop login layout
  if (deviceType === 'desktop') {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#0f3d3b] via-[#024645] to-[#051f1e] flex items-center justify-center p-8">
        <div className="w-full max-w-5xl">
          <CorporateSignIn
            users={mockUsers}
            onSignIn={handleSignIn}
            onAddAndSignIn={handleAddAndSignIn}
            darkMode={darkMode}
          />
        </div>
      </div>
    );
  }

  // For tablet and mobile devices, use the responsive mobile-optimized layout
  return (
    <div className={darkMode ? 'dark' : ''}>
      <CorporateSignIn
        users={mockUsers}
        onSignIn={handleSignIn}
        onAddAndSignIn={handleAddAndSignIn}
        darkMode={darkMode}
      />
    </div>
  );
};

export default LoginPage;

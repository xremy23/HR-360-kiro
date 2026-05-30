import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginSuccess, setError, setLoading } from '../store/slices/authSlice';
import { AppDispatch } from '../store/store';
import apiService, { ApiError } from '../services/apiService';

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

const LoginPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoadingLocal] = useState(false);
  const [step, setStep] = useState<'email' | 'sent'>('email');
  const [isVerifyingLink, setIsVerifyingLink] = useState(false);

  // Unregister service workers on mount
  useEffect(() => {
    unregisterServiceWorkers();
  }, []);

  // Check if this is a magic link verification
  useEffect(() => {
    const token = searchParams.get('token');
    const linkEmail = searchParams.get('email');

    if (token && linkEmail) {
      verifyMagicLink(linkEmail, token);
    }
  }, [searchParams]);

  const verifyMagicLink = async (linkEmail: string, token: string) => {
    setIsVerifyingLink(true);
    dispatch(setLoading(true));

    try {
      const response = await apiService.verifyMagicLink(linkEmail, token);

      if (response.success && response.data) {
        const jwtToken = response.data.token;
        const backendUser = response.data.user;

        // Use user data from verification response (no need for extra profile call)
        const user = {
          id: backendUser.id,
          email: backendUser.email,
          name: `${backendUser.firstName} ${backendUser.lastName}`.trim() || backendUser.email,
          role: backendUser.role || 'employee',
          organizationId: backendUser.orgId,
          avatar: backendUser.avatar,
        };

        dispatch(loginSuccess({ user, token: jwtToken }));
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(user));

        toast.success('Login successful!');
        
        // Small delay to ensure state is updated before navigation
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 100);
      } else {
        const errorMessage = response.error?.message || 'Magic link verification failed';
        dispatch(setError(errorMessage));
        toast.error(errorMessage);
        setIsVerifyingLink(false);
        dispatch(setLoading(false));
      }
    } catch (error: any) {
      const apiError = error as ApiError;
      const errorMessage = apiError.message || 'Magic link verification failed';
      dispatch(setError(errorMessage));
      toast.error(errorMessage);
      setIsVerifyingLink(false);
      dispatch(setLoading(false));
    }
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingLocal(true);
    dispatch(setLoading(true));

    try {
      const response = await apiService.sendMagicLink(email);
      if (response.success) {
        // If link is returned in response (for testing), show it
        if (response.data?.magicLink) {
          toast.success('Magic link generated! Check console or use link below.', {
            duration: 10000,
            icon: '🔗',
          });
          console.log('Magic Link:', response.data.magicLink);
        } else {
          toast.success('Magic link sent to your email! Check your inbox.', {
            duration: 5000,
            icon: '📧',
          });
        }
        setStep('sent');
      } else {
        const errorMessage = response.error?.message || 'Failed to send magic link';
        dispatch(setError(errorMessage));
        toast.error(errorMessage);
      }
    } catch (error: any) {
      const apiError = error as ApiError;
      const errorMessage = apiError.message || 'Failed to send magic link';
      dispatch(setError(errorMessage));
      toast.error(errorMessage);
    } finally {
      setIsLoadingLocal(false);
      dispatch(setLoading(false));
    }
  };

  if (isVerifyingLink) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-teal to-secondary-dark flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="font-display text-display2 text-primary-white mb-4">
            Verifying Magic Link...
          </h1>
          <p className="font-sans text-body2 text-secondary-light">
            Please wait while we log you in
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-teal to-secondary-dark flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-light opacity-10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-light opacity-10 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-display2 text-primary-white mb-2">
            HR Crisis 360
          </h1>
          <p className="font-sans text-body2 text-secondary-light">
            Emergency Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-primary-white rounded-2xl shadow-xl p-8 mb-6">
          {step === 'email' ? (
            <>
              <h2 className="font-sans text-heading3 text-primary-black mb-2">
                Passwordless Login
              </h2>
              <p className="font-sans text-body2 text-secondary-medium mb-6">
                Enter your email to receive a magic login link
              </p>

              <form onSubmit={handleSendMagicLink} className="space-y-6">
                {/* Email Input */}
                <div>
                  <label className="block font-sans text-label1 text-primary-black mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 border-2 border-secondary-light rounded-lg font-sans text-body2 focus:outline-none focus:border-primary-teal focus:ring-2 focus:ring-primary-teal focus:ring-opacity-20 transition"
                  />
                </div>

                {/* Send Magic Link Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary-teal hover:bg-secondary-medium disabled:bg-secondary-light text-primary-white font-sans font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Sending...' : '🔗 Send Magic Link'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="font-sans text-heading3 text-primary-black mb-2">
                Check Your Email
              </h2>
              <p className="font-sans text-body2 text-secondary-medium mb-6">
                We've sent a magic login link to <strong>{email}</strong>
              </p>

              <div className="bg-secondary-light bg-opacity-10 rounded-lg p-4 mb-6 border border-secondary-light border-opacity-30">
                <p className="font-sans text-body3 text-secondary-medium mb-2">
                  ✅ Magic link sent successfully!
                </p>
                <p className="font-sans text-body3 text-secondary-medium">
                  Click the link in your email to log in. The link expires in 15 minutes.
                </p>
              </div>

              {/* Back Button */}
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setEmail('');
                }}
                className="w-full bg-secondary-light hover:bg-secondary-medium text-primary-black font-sans font-semibold py-3 px-4 rounded-lg transition duration-200"
              >
                Try Another Email
              </button>
            </>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-secondary-light bg-opacity-20 rounded-xl p-4 border border-secondary-light border-opacity-30">
          <p className="font-sans text-label2 text-primary-white font-semibold mb-3">
            🔐 How It Works
          </p>
          <ol className="space-y-2">
            <li className="font-sans text-body3 text-secondary-light">
              1. Enter your email address
            </li>
            <li className="font-sans text-body3 text-secondary-light">
              2. Check your email for the magic link
            </li>
            <li className="font-sans text-body3 text-secondary-light">
              3. Click the link to log in instantly
            </li>
            <li className="font-sans text-body3 text-secondary-light">
              4. No password needed!
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

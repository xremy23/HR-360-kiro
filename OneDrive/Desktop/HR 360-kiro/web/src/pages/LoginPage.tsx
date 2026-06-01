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

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-bg-light to-brand-cyan/10 flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-cyan opacity-5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-teal-medium opacity-5 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="relative w-16 h-16 mx-auto bg-brand-teal-deep rounded-3xl flex items-center justify-center shadow-lg shadow-brand-teal-medium/15 mb-4">
            <div className="absolute inset-0 bg-brand-cyan/10 rounded-3xl animate-pulse blur-md"></div>
            <span className="text-2xl">🚨</span>
          </div>
          <h1 className="font-display text-h2 text-brand-teal-deep mb-2 uppercase">
            Enterprise Safety SSO
          </h1>
          <p className="font-sans text-body3 text-stone-500">
            Activate disaster coordination, survival kit logs, and employee status boards.
          </p>
        </div>

        {/* Domain Notice */}
        <div className="p-3 bg-brand-teal-medium/5 border border-brand-teal-medium/15 rounded-2xl flex items-start gap-2.5 mb-6">
          <span className="text-brand-teal-medium mt-0.5">ℹ️</span>
          <div className="text-body3 text-brand-teal-deep leading-normal">
            <span className="font-bold">SSO Domains Configured:</span> corporate.com, rescue.org, health.gov.
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-[2.5rem] shadow-2xl p-8 mb-6 animate-fade-in">
          {step === 'email' ? (
            <>
              <h2 className="font-display text-h4 text-brand-teal-deep mb-2 uppercase">
                Passwordless Login
              </h2>
              <p className="font-sans text-body3 text-stone-500 dark:text-stone-400 mb-6">
                Enter your email to receive a magic login link
              </p>

              <form onSubmit={handleSendMagicLink} className="space-y-4">
                {/* Email Input */}
                <div>
                  <label className="block font-sans text-label2 font-extrabold uppercase text-stone-500 dark:text-stone-400 tracking-wider mb-2">
                    Corporate Identifier / Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="employee@corporate.com"
                      required
                      className="w-full px-4 py-3 pl-10 border-2 border-stone-200 dark:border-neutral-800 rounded-2xl font-sans text-body3 bg-stone-50 dark:bg-neutral-950 text-neutral-850 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-brand-teal-medium focus:ring-2 focus:ring-brand-teal-medium/20 transition"
                    />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">@</span>
                  </div>
                </div>

                {/* Send Magic Link Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-brand-teal-medium hover:bg-brand-teal-deep disabled:bg-stone-300 text-white font-display font-extrabold text-label1 py-3.5 rounded-2xl shadow transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '⏳ Sending...' : '🔑 Initialize Secure Authorization'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="font-display text-h4 text-brand-teal-deep mb-2 uppercase">
                Check Your Email
              </h2>
              <p className="font-sans text-body3 text-stone-500 dark:text-stone-400 mb-6">
                We've sent a magic login link to <strong>{email}</strong>
              </p>

              <div className="bg-brand-teal-medium/5 rounded-2xl p-4 mb-6 border border-brand-teal-medium/15">
                <p className="font-sans text-body3 text-brand-teal-deep font-semibold mb-2">
                  ✅ Magic link sent successfully!
                </p>
                <p className="font-sans text-body3 text-stone-600 dark:text-stone-400">
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
                className="w-full bg-stone-100 dark:bg-neutral-800 hover:bg-stone-200 dark:hover:bg-neutral-700 text-brand-teal-deep font-sans font-semibold py-3 px-4 rounded-2xl transition duration-200"
              >
                Try Another Email
              </button>
            </>
          )}
        </div>

        {/* Quick Login */}
        <div className="pt-4 border-t border-stone-200 dark:border-neutral-800 space-y-3">
          <span className="text-label2 font-bold text-stone-400 dark:text-neutral-500 uppercase tracking-widest block text-center">
            Demo Profiles (SSO Bypass)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSendMagicLink(new Event('submit') as any)}
              disabled={isLoading}
              className="p-3 border border-stone-150 dark:border-neutral-800 hover:bg-stone-50 dark:hover:bg-neutral-950 rounded-2xl text-left text-label2 transition disabled:opacity-50"
            >
              <span className="font-extrabold block text-neutral-850 dark:text-stone-200">Alice Vance</span>
              <span className="text-body3 text-brand-teal-medium">Safety Admin</span>
            </button>
            <button
              onClick={() => handleSendMagicLink(new Event('submit') as any)}
              disabled={isLoading}
              className="p-3 border border-stone-150 dark:border-neutral-800 hover:bg-stone-50 dark:hover:bg-neutral-950 rounded-2xl text-left text-label2 transition disabled:opacity-50"
            >
              <span className="font-extrabold block text-neutral-850 dark:text-stone-200">Carli Kim</span>
              <span className="text-body3 text-stone-500">Employee</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginSuccess, setError, setLoading } from '../store/slices/authSlice';
import { AppDispatch } from '../store/store';
import apiService, { ApiError } from '../services/apiService';

const LoginPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoadingLocal] = useState(false);
  const [step, setStep] = useState<'email' | 'verify'>('email');

  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingLocal(true);
    dispatch(setLoading(true));

    try {
      const response = await apiService.sendVerification(email);
      if (response.success) {
        toast.success('Verification code sent to your email!');
        setStep('verify');
      } else {
        const errorMessage = response.error?.message || 'Failed to send verification code';
        dispatch(setError(errorMessage));
        toast.error(errorMessage);
      }
    } catch (error: any) {
      const apiError = error as ApiError;
      const errorMessage = apiError.message || 'Failed to send verification code';
      dispatch(setError(errorMessage));
      toast.error(errorMessage);
    } finally {
      setIsLoadingLocal(false);
      dispatch(setLoading(false));
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingLocal(true);
    dispatch(setLoading(true));

    try {
      const response = await apiService.verifyEmail(email, verificationCode);
      
      if (response.success && response.data) {
        const token = response.data.token;
        
        // Fetch user profile
        apiService.setToken(token);
        const profileResponse = await apiService.getUserProfile();
        
        if (profileResponse.success && profileResponse.data) {
          const backendUser = profileResponse.data;
          
          // Map backend user to frontend User interface
          const user = {
            id: backendUser.id,
            email: backendUser.email,
            name: `${backendUser.firstName} ${backendUser.lastName}`.trim() || backendUser.email,
            role: backendUser.role || 'employee',
            organizationId: backendUser.orgId,
            avatar: backendUser.avatar,
          };

          dispatch(loginSuccess({ user, token }));
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          toast.success('Login successful!');
          navigate('/');
        } else {
          throw new Error('Failed to fetch user profile');
        }
      } else {
        const errorMessage = response.error?.message || 'Verification failed';
        dispatch(setError(errorMessage));
        toast.error(errorMessage);
      }
    } catch (error: any) {
      const apiError = error as ApiError;
      const errorMessage = apiError.message || 'Verification failed';
      dispatch(setError(errorMessage));
      toast.error(errorMessage);
    } finally {
      setIsLoadingLocal(false);
      dispatch(setLoading(false));
    }
  };

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
          <form onSubmit={step === 'email' ? handleSendVerification : handleVerifyEmail} className="space-y-6">
            {step === 'email' ? (
              <>
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

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary-teal hover:bg-secondary-medium disabled:bg-secondary-light text-primary-white font-sans font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </>
            ) : (
              <>
                {/* Verification Code Input */}
                <div>
                  <label className="block font-sans text-label1 text-primary-black mb-2">
                    Verification Code
                  </label>
                  <p className="text-body2 text-secondary-medium mb-3">
                    Check your email for the 6-digit code
                  </p>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    required
                    className="w-full px-4 py-3 border-2 border-secondary-light rounded-lg font-sans text-body2 text-center text-2xl tracking-widest focus:outline-none focus:border-primary-teal focus:ring-2 focus:ring-primary-teal focus:ring-opacity-20 transition"
                  />
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary-teal hover:bg-secondary-medium disabled:bg-secondary-light text-primary-white font-sans font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Login'}
                </button>

                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setVerificationCode('');
                  }}
                  className="w-full bg-secondary-light hover:bg-secondary-medium text-primary-black font-sans font-semibold py-3 px-4 rounded-lg transition duration-200"
                >
                  Back
                </button>
              </>
            )}
          </form>
        </div>

        {/* Demo Credentials */}
        <div className="bg-secondary-light bg-opacity-20 rounded-xl p-4 border border-secondary-light border-opacity-30">
          <p className="font-sans text-label2 text-primary-white font-semibold mb-3">
            Demo Credentials
          </p>
          <div className="space-y-2">
            <div>
              <p className="font-sans text-body3 text-secondary-light">Admin:</p>
              <p className="font-sans text-body3 text-primary-white">
                admin@example.com / password123
              </p>
            </div>
            <div>
              <p className="font-sans text-body3 text-secondary-light">Employee:</p>
              <p className="font-sans text-body3 text-primary-white">
                employee@example.com / password123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

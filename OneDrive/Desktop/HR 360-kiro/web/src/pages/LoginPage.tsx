import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { loginSuccess, setError, setLoading } from '../store/slices/authSlice';
import { AppDispatch } from '../store/store';

const LoginPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoadingLocal] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingLocal(true);
    dispatch(setLoading(true));

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.post(
        `${apiUrl}/api/auth/login`,
        { email, password }
      );

      const { user, token } = response.data;

      dispatch(loginSuccess({ user, token }));
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success('Login successful!');
      navigate('/');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
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
          <form onSubmit={handleLogin} className="space-y-6">
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

            {/* Password Input */}
            <div>
              <label className="block font-sans text-label1 text-primary-black mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-white border-t-transparent rounded-full animate-spin"></div>
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
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

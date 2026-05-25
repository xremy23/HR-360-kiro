import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';
import { User } from '@types/index';
import { dbService } from './dbService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

class AuthService {
  private api: AxiosInstance;
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000
    });

    // Add token to requests
    this.api.interceptors.request.use(config => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  async initialize(): Promise<void> {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        this.token = storedToken;
        this.user = JSON.parse(storedUser);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
  }

  async sendVerificationEmail(email: string): Promise<void> {
    try {
      await this.api.post('/auth/send-verification', { email });
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  }

  async verifyEmail(email: string, code: string): Promise<{ token: string; user: User }> {
    try {
      const response = await this.api.post('/auth/verify-email', { email, code });
      const { token, user } = response.data;

      this.token = token;
      this.user = user;

      // Persist to storage
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // Save to local DB
      await dbService.saveUser(user);

      return { token, user };
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }

  async joinOrganization(email: string, inviteCode?: string, emailDomain?: string): Promise<{ orgId: string; orgName: string }> {
    try {
      const response = await this.api.post('/auth/join-org', {
        email,
        inviteCode,
        emailDomain
      });

      return response.data;
    } catch (error) {
      console.error('Error joining organization:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Notify server if online
      if (this.token) {
        try {
          await this.api.post('/auth/logout');
        } catch (error) {
          console.warn('Could not notify server of logout:', error);
        }
      }

      // Clear local data
      this.token = null;
      this.user = null;
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
      await dbService.clearAllData();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async refreshToken(): Promise<string> {
    try {
      const response = await this.api.post('/auth/refresh-token');
      const { token } = response.data;

      this.token = token;
      await AsyncStorage.setItem('auth_token', token);

      return token;
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout
      await this.logout();
      throw error;
    }
  }

  async updateUserProfile(updates: Partial<User>): Promise<User> {
    try {
      const response = await this.api.put('/users/profile', updates);
      const updatedUser = response.data;

      this.user = updatedUser;
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      await dbService.saveUser(updatedUser);

      return updatedUser;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async enableBiometric(type: 'faceId' | 'fingerprint' | 'both'): Promise<void> {
    try {
      await this.api.post('/users/biometric/enable', { type });
      
      if (this.user) {
        this.user.biometricEnabled = true;
        await AsyncStorage.setItem('user', JSON.stringify(this.user));
        await dbService.saveUser(this.user);
      }
    } catch (error) {
      console.error('Error enabling biometric:', error);
      throw error;
    }
  }

  async disableBiometric(): Promise<void> {
    try {
      await this.api.post('/users/biometric/disable');
      
      if (this.user) {
        this.user.biometricEnabled = false;
        await AsyncStorage.setItem('user', JSON.stringify(this.user));
        await dbService.saveUser(this.user);
      }
    } catch (error) {
      console.error('Error disabling biometric:', error);
      throw error;
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  getApi(): AxiosInstance {
    return this.api;
  }
}

export const authService = new AuthService();

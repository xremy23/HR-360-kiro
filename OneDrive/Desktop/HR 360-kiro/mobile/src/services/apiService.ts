/**
 * API Service - Centralized API communication layer
 * Handles all HTTP requests to the backend
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  statusCode: number;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  statusCode: number;
}

// Error types
export class ApiError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public originalError?: AxiosError
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * API Service Class
 */
class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const token = await this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear token and redirect to login
            await this.clearToken();
            throw refreshError;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Get stored token
   */
  private async getToken(): Promise<string | null> {
    if (this.token) {
      return this.token;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        this.token = token;
      }
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  /**
   * Set token
   */
  async setToken(token: string): Promise<void> {
    this.token = token;
    try {
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  /**
   * Clear token
   */
  async clearToken(): Promise<void> {
    this.token = null;
    try {
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  }

  /**
   * Refresh token
   */
  private async refreshToken(): Promise<string> {
    // Prevent multiple refresh requests
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = (async () => {
      try {
        const response = await this.client.post<ApiResponse<{ token: string }>>(
          '/auth/refresh-token'
        );

        if (response.data.success && response.data.data?.token) {
          const newToken = response.data.data.token;
          await this.setToken(newToken);
          return newToken;
        }

        throw new Error('Failed to refresh token');
      } finally {
        this.refreshTokenPromise = null;
      }
    })();

    return this.refreshTokenPromise;
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): ApiError {
    if (error instanceof AxiosError) {
      const status = error.response?.status || 500;
      const data = error.response?.data as ApiResponse;
      const message = data?.error?.message || error.message || 'An error occurred';
      const code = data?.error?.code || 'UNKNOWN_ERROR';

      return new ApiError(code, status, message, error);
    }

    return new ApiError('UNKNOWN_ERROR', 500, error.message || 'An error occurred');
  }

  /**
   * GET request
   */
  async get<T = any>(
    url: string,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<ApiResponse<T>>(url, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * POST request
   */
  async post<T = any>(
    url: string,
    data?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * PUT request
   */
  async put<T = any>(
    url: string,
    data?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<ApiResponse<T>>(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // AUTH ENDPOINTS
  // ============================================================================

  async sendVerification(email: string): Promise<ApiResponse> {
    return this.post('/auth/send-verification', { email });
  }

  async verifyEmail(email: string, code: string): Promise<ApiResponse<{ token: string }>> {
    return this.post('/auth/verify-email', { email, code });
  }

  async joinOrganization(
    email: string,
    code: string,
    firstName: string,
    lastName: string
  ): Promise<ApiResponse<{ token: string }>> {
    return this.post('/auth/join-org', {
      email,
      code,
      firstName,
      lastName,
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.post('/auth/logout');
  }

  // ============================================================================
  // USER ENDPOINTS
  // ============================================================================

  async getUserProfile(): Promise<ApiResponse<any>> {
    return this.get('/users/profile');
  }

  async updateUserProfile(data: Record<string, any>): Promise<ApiResponse<any>> {
    return this.put('/users/profile', data);
  }

  async enableBiometric(): Promise<ApiResponse> {
    return this.post('/users/biometric/enable');
  }

  async disableBiometric(): Promise<ApiResponse> {
    return this.post('/users/biometric/disable');
  }

  // ============================================================================
  // KNOWLEDGE BASE ENDPOINTS
  // ============================================================================

  async getGuides(params?: {
    search?: string;
    category?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.get('/kb/guides', params);
    return response as any;
  }

  async getGuideById(id: string): Promise<ApiResponse<any>> {
    return this.get(`/kb/guides/${id}`);
  }

  async getGuideVersions(id: string): Promise<ApiResponse<any[]>> {
    return this.get(`/kb/guides/${id}/versions`);
  }

  async createGuide(data: Record<string, any>): Promise<ApiResponse<any>> {
    return this.post('/kb/guides', data);
  }

  async updateGuide(id: string, data: Record<string, any>): Promise<ApiResponse<any>> {
    return this.put(`/kb/guides/${id}`, data);
  }

  async deleteGuide(id: string): Promise<ApiResponse> {
    return this.delete(`/kb/guides/${id}`);
  }

  async acknowledgeGuide(id: string): Promise<ApiResponse> {
    return this.post(`/kb/guides/${id}/acknowledge`);
  }

  // ============================================================================
  // CHECK-IN ENDPOINTS
  // ============================================================================

  async submitCheckIn(data: {
    status: 'safe' | 'need_help' | 'sos';
    notes?: string;
    location?: string;
  }): Promise<ApiResponse<any>> {
    return this.post('/check-ins', data);
  }

  async getTeamCheckIns(teamId: string, params?: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.get(`/check-ins/team/${teamId}`, params);
    return response as any;
  }

  async getCheckInHistory(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.get('/check-ins/history', params);
    return response as any;
  }

  async getIncidentCheckIns(incidentId: string): Promise<ApiResponse<any[]>> {
    return this.get(`/check-ins/incident/${incidentId}`);
  }

  // ============================================================================
  // ALERT ENDPOINTS
  // ============================================================================

  async getAlerts(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.get('/alerts', params);
    return response as any;
  }

  async broadcastAlert(data: {
    message: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    teamIds?: string[];
  }): Promise<ApiResponse<any>> {
    return this.post('/alerts/broadcast', data);
  }

  async getAlertNotifications(alertId: string): Promise<ApiResponse<any[]>> {
    return this.get(`/alerts/${alertId}/notifications`);
  }

  async updateAlertNotification(
    alertId: string,
    notificationId: string,
    data: Record<string, any>
  ): Promise<ApiResponse> {
    return this.put(`/alerts/${alertId}/notifications/${notificationId}`, data);
  }

  // ============================================================================
  // CONTACT ENDPOINTS
  // ============================================================================

  async getContacts(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.get('/contacts', params);
    return response as any;
  }

  async createContact(data: {
    name: string;
    phone: string;
    email?: string;
    relationship?: string;
  }): Promise<ApiResponse<any>> {
    return this.post('/contacts', data);
  }

  async updateContact(id: string, data: Record<string, any>): Promise<ApiResponse<any>> {
    return this.put(`/contacts/${id}`, data);
  }

  async deleteContact(id: string): Promise<ApiResponse> {
    return this.delete(`/contacts/${id}`);
  }

  async getNearbyContacts(params?: {
    latitude?: number;
    longitude?: number;
    radius?: number;
  }): Promise<ApiResponse<any[]>> {
    return this.get('/contacts/nearby', params);
  }

  // ============================================================================
  // INCIDENT ENDPOINTS
  // ============================================================================

  async getIncidents(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.get('/incidents', params);
    return response as any;
  }

  async createIncident(data: {
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    location?: string;
  }): Promise<ApiResponse<any>> {
    return this.post('/incidents', data);
  }

  async getIncidentById(id: string): Promise<ApiResponse<any>> {
    return this.get(`/incidents/${id}`);
  }

  async getIncidentSummary(id: string): Promise<ApiResponse<any>> {
    return this.get(`/incidents/${id}/summary`);
  }

  // ============================================================================
  // SOS ENDPOINTS
  // ============================================================================

  async triggerSOS(data?: {
    location?: string;
    notes?: string;
  }): Promise<ApiResponse<any>> {
    return this.post('/sos', data);
  }

  async getSOSEscalations(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.get('/sos/escalations', params);
    return response as any;
  }

  // ============================================================================
  // ORGANIZATION ENDPOINTS
  // ============================================================================

  async getOrganization(): Promise<ApiResponse<any>> {
    return this.get('/org');
  }

  async getOrganizationTeams(): Promise<ApiResponse<any[]>> {
    return this.get('/org/teams');
  }

  async getOrganizationUsers(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.get('/org/users', params);
    return response as any;
  }

  // ============================================================================
  // TO-GO BAG ENDPOINTS
  // ============================================================================

  async getToBagItems(): Promise<ApiResponse<any[]>> {
    return this.get('/tobag');
  }

  async createToBagItem(data: {
    name: string;
    category: string;
    priority: 'high' | 'medium' | 'low';
  }): Promise<ApiResponse<any>> {
    return this.post('/tobag', data);
  }

  async updateToBagItem(id: string, data: Record<string, any>): Promise<ApiResponse<any>> {
    return this.put(`/tobag/${id}`, data);
  }

  async deleteToBagItem(id: string): Promise<ApiResponse> {
    return this.delete(`/tobag/${id}`);
  }
}

// Export singleton instance
export const apiService = new ApiService();

export default apiService;

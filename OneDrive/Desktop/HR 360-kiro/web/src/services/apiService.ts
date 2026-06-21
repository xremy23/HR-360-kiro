/**
 * API Service - Centralized API communication layer
 * Handles all HTTP requests to the backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// API Configuration - Resolved at runtime from config file
let API_BASE_URL = 'http://localhost:3000/api'; // default fallback

// Function to load config asynchronously
async function loadApiConfig(): Promise<string> {
  try {
    // First, check if it was pre-initialized in index.html
    if (window.__API_URL__) {
      console.log('[API Config] Using pre-initialized API URL:', window.__API_URL__);
      API_BASE_URL = window.__API_URL__;
      return window.__API_URL__;
    }

    // Try to load from runtime-injected config.json (with cache-busting)
    const response = await fetch('/config.json?t=' + Date.now(), {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (response.ok) {
      const config = await response.json();
      if (config.apiUrl) {
        console.log('[API Config] Loaded API URL from config.json:', config.apiUrl);
        API_BASE_URL = config.apiUrl;
        window.__API_URL__ = config.apiUrl;
        return config.apiUrl;
      }
    }
  } catch (error) {
    console.warn('[API Config] Failed to load config.json, trying fallbacks:', error);
  }

  // Fallback: check environment variable from build time
  if (import.meta.env.VITE_API_URL) {
    console.log('[API Config] Using VITE_API_URL:', import.meta.env.VITE_API_URL);
    API_BASE_URL = import.meta.env.VITE_API_URL;
    window.__API_URL__ = import.meta.env.VITE_API_URL;
    return import.meta.env.VITE_API_URL;
  }

  // Last resort: try to infer from current location
  if (typeof window !== 'undefined' && window.location) {
    const isCloudRun = window.location.hostname.includes('run.app');
    if (isCloudRun) {
      // Assume backend is on the same Cloud Run project
      const url = 'https://hr-crisis-360-backend-116253736511.asia-southeast1.run.app/api';
      console.log('[API Config] Inferred Cloud Run backend:', url);
      API_BASE_URL = url;
      window.__API_URL__ = url;
      return url;
    }
  }

  console.log('[API Config] Using default fallback:', API_BASE_URL);
  return API_BASE_URL;
}

// Initialize config on import and store the promise
const configLoadPromise = loadApiConfig().catch(err => {
  console.error('[API Config] Initialization error:', err);
  return API_BASE_URL; // Return current value even if error
});

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
  private baseUrlLoaded = false;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Update baseURL after config loads
    loadApiConfig().then(url => {
      this.client.defaults.baseURL = url;
      this.baseUrlLoaded = true;
    }).catch(err => console.error('[API Config] Initialization error:', err));

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          console.log('Sending authorization header with token:', token.substring(0, 20) + '...');
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.warn('No token available for request to', config.url);
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
          // Skip redirect if skipRedirectOn401 flag is set
          if (originalRequest.skipRedirectOn401) {
            return Promise.reject(error);
          }

          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear token and redirect to login
            this.clearToken();
            window.location.href = '/login';
            throw refreshError;
          }
        }

        return Promise.reject(error);
      }
    );

    // Load token from storage on initialization
    this.token = this.getToken();
  }

  /**
   * Get stored token
   */
  private getToken(): string | null {
    if (this.token) {
      return this.token;
    }

    try {
      // Check both 'token' and 'authToken' keys for compatibility
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
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
  setToken(token: string): void {
    console.log('setToken called with token:', token.substring(0, 20) + '...');
    this.token = token;
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('authToken', token); // Store in both keys for compatibility
      console.log('Token stored in localStorage');
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  /**
   * Clear token
   */
  clearToken(): void {
    this.token = null;
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
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
          this.setToken(newToken);
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
    params?: Record<string, any>,
    skipRedirectOn401?: boolean
  ): Promise<ApiResponse<T>> {
    try {
      await this.ensureConfigLoaded(); // Ensure config is loaded before making request
      const config: any = { params };
      if (skipRedirectOn401) {
        config.skipRedirectOn401 = true;
      }
      const response = await this.client.get<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Ensure API config is loaded
   */
  private async ensureConfigLoaded(): Promise<void> {
    if (!this.baseUrlLoaded) {
      await configLoadPromise;
      await new Promise(resolve => setTimeout(resolve, 100)); // Give it a moment to update
    }
  }

  /**
   * POST request
   */
  async post<T = any>(
    url: string,
    data?: Record<string, any>,
    skipRedirectOn401?: boolean
  ): Promise<ApiResponse<T>> {
    try {
      await this.ensureConfigLoaded(); // Ensure config is loaded before making request
      const config: any = {};
      if (skipRedirectOn401) {
        config.skipRedirectOn401 = true;
      }
      const response = await this.client.post<ApiResponse<T>>(url, data, config);
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

  async sendMagicLink(email: string): Promise<ApiResponse> {
    return this.post('/auth/send-magic-link', { email });
  }

  async verifyMagicLink(email: string, token: string): Promise<ApiResponse<{ token: string }>> {
    return this.post('/auth/verify-magic-link', { email, token });
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

  /**
   * GET /api/auth/me
   * Get current authenticated user with full details including organization
   * Used for session restoration on app reload
   */
  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.get('/auth/me');
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

  async getUsers(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.get('/users', params);
    return response as any;
  }

  async getUserById(id: string): Promise<ApiResponse<any>> {
    return this.get(`/users/${id}`);
  }

  async createUser(data: Record<string, any>): Promise<ApiResponse<any>> {
    return this.post('/users', data);
  }

  async updateUser(id: string, data: Record<string, any>): Promise<ApiResponse<any>> {
    return this.put(`/users/${id}`, data);
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    return this.delete(`/users/${id}`);
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

  async getCheckIns(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.get('/check-ins', params);
    return response as any;
  }

  // ============================================================================
  // ALERT ENDPOINTS
  // ============================================================================

  async getAlerts(params?: {
    page?: number;
    pageSize?: number;
  }, skipRedirectOn401?: boolean): Promise<PaginatedResponse<any>> {
    const response = await this.get('/alerts', params, skipRedirectOn401);
    return response as any;
  }

  async getAlertById(id: string): Promise<ApiResponse<any>> {
    return this.get(`/alerts/${id}`);
  }

  async broadcastAlert(data: {
    message: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    teamIds?: string[];
  }): Promise<ApiResponse<any>> {
    return this.post('/alerts/broadcast', data);
  }

  async updateAlert(id: string, data: Record<string, any>): Promise<ApiResponse<any>> {
    return this.put(`/alerts/${id}`, data);
  }

  async deleteAlert(id: string): Promise<ApiResponse> {
    return this.delete(`/alerts/${id}`);
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

  async getContactById(id: string): Promise<ApiResponse<any>> {
    return this.get(`/contacts/${id}`);
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

  async getIncidentById(id: string): Promise<ApiResponse<any>> {
    return this.get(`/incidents/${id}`);
  }

  async createIncident(data: {
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    location?: string;
  }): Promise<ApiResponse<any>> {
    return this.post('/incidents', data);
  }

  async updateIncident(id: string, data: Record<string, any>): Promise<ApiResponse<any>> {
    return this.put(`/incidents/${id}`, data);
  }

  async resolveIncident(id: string, data?: Record<string, any>): Promise<ApiResponse<any>> {
    return this.put(`/incidents/${id}/resolve`, data);
  }

  async getIncidentSummary(id: string): Promise<ApiResponse<any>> {
    return this.get(`/incidents/${id}/summary`);
  }

  async deleteIncident(id: string): Promise<ApiResponse> {
    return this.delete(`/incidents/${id}`);
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

  async acknowledgeSOSEscalation(id: string): Promise<ApiResponse> {
    return this.post(`/sos/escalations/${id}/acknowledge`);
  }

  // ============================================================================
  // ORGANIZATION ENDPOINTS
  // ============================================================================

  async getOrganization(skipRedirect: boolean = true): Promise<ApiResponse<any>> {
    return this.get('/org', undefined, skipRedirect);
  }

  async getOrganizationTeams(): Promise<ApiResponse<any[]>> {
    return this.get('/org/teams');
  }

  async createOrganizationTeam(data: Record<string, any>): Promise<ApiResponse<any>> {
    return this.post('/org/teams', data);
  }

  async updateOrganizationTeam(id: string, data: Record<string, any>): Promise<ApiResponse<any>> {
    return this.put(`/org/teams/${id}`, data);
  }

  async deleteOrganizationTeam(id: string): Promise<ApiResponse> {
    return this.delete(`/org/teams/${id}`);
  }

  async getOrganizationUsers(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.get('/org/users', params);
    return response as any;
  }

  async getOrganizationSettings(): Promise<ApiResponse<any>> {
    return this.get('/org/settings');
  }

  async updateOrganizationSettings(data: Record<string, any>): Promise<ApiResponse<any>> {
    return this.put('/org/settings', data);
  }

  async createOrganization(data: {
    name: string;
    emailDomain?: string;
    logo?: string;
  }): Promise<ApiResponse<any>> {
    return this.post('/org', data, true); // skipRedirectOn401 = true
  }

  async joinOrganizationWithCode(inviteCode: string): Promise<ApiResponse<any>> {
    return this.post('/org/join', { inviteCode });
  }

  async updateOrganization(data: {
    name?: string;
    logo?: string;
  }): Promise<ApiResponse<any>> {
    return this.put('/org', data);
  }

  async inviteUserToOrganization(data: {
    email: string;
    role?: string;
  }): Promise<ApiResponse<any>> {
    return this.post('/org/invite', data);
  }

  async removeUserFromOrganization(userId: string): Promise<ApiResponse<any>> {
    return this.delete(`/org/users/${userId}`);
  }

  async switchOrganization(orgId: string): Promise<ApiResponse<any>> {
    return this.post('/org/switch', { orgId });
  }

  // ============================================================================
  // TO-GO BAG ENDPOINTS
  // ============================================================================

  async getToBagItems(): Promise<ApiResponse<any[]>> {
    return this.get('/tobag');
  }

  async getToBagItemById(id: string): Promise<ApiResponse<any>> {
    return this.get(`/tobag/${id}`);
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

  // ============================================================================
  // MONITORING ENDPOINTS
  // ============================================================================

  async getSystemHealth(): Promise<ApiResponse<any>> {
    return this.get('/monitoring/health');
  }

  async getSystemStats(): Promise<ApiResponse<any>> {
    return this.get('/monitoring/stats');
  }

  // ============================================================================
  // CHATBOT ENDPOINTS
  // ============================================================================

  async saveChatMessage(data: {
    userQuestion: string;
    botResponse?: string;
    context?: Record<string, any>;
    language?: 'en' | 'tl' | 'ceb';
  }): Promise<ApiResponse<any>> {
    return this.post('/chatbot/messages', data);
  }

  async submitChatFeedback(messageId: string, data: {
    isHelpful: boolean;
    feedbackText?: string;
  }): Promise<ApiResponse<any>> {
    return this.post(`/chatbot/messages/${messageId}/feedback`, data);
  }

  async getChatHistory(params?: {
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any>> {
    return this.get('/chatbot/history', params);
  }

  async getChatbotFeedbackQueue(params?: {
    status?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any>> {
    return this.get('/chatbot/admin/feedback-queue', params);
  }

  async getChatbotFeedbackItem(id: string): Promise<ApiResponse<any>> {
    return this.get(`/chatbot/admin/feedback-queue/${id}`);
  }

  async updateChatbotFeedback(id: string, data: {
    status?: string;
    adminAction?: string;
    assignedTo?: string;
  }): Promise<ApiResponse<any>> {
    return this.put(`/chatbot/admin/feedback-queue/${id}`, data);
  }

  async resolveChatbotFeedback(id: string, data: {
    adminAction: string;
    updatedResponseId?: string;
  }): Promise<ApiResponse<any>> {
    return this.post(`/chatbot/admin/feedback-queue/${id}/resolve`, data);
  }

  async createChatbotResponse(data: {
    questionPattern: string;
    response: string;
    category?: string;
    priority?: number;
  }): Promise<ApiResponse<any>> {
    return this.post('/chatbot/admin/responses', data);
  }

  async getChatbotResponses(params?: {
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any>> {
    return this.get('/chatbot/admin/responses', params);
  }

  async getChatbotStats(): Promise<ApiResponse<any>> {
    return this.get('/chatbot/admin/stats');
  }
}

// Export singleton instance
export const apiService = new ApiService();

export default apiService;

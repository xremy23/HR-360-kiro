# HR 360 - NEXT STEPS ACTION PLAN

**Date**: May 27, 2026  
**Current Status**: 95% Complete  
**Remaining Work**: 5% (18-26 hours)  
**Priority**: HIGH

---

## 🎯 IMMEDIATE NEXT STEPS (THIS WEEK)

### STEP 1: Create Mobile WebSocket Service (2-3 hours)

**File**: `mobile/src/services/websocketService.ts`

**What to do**:
1. Create new file with WebSocket class
2. Implement connection management
3. Add event subscription system
4. Implement auto-reconnection
5. Add message queuing
6. Test with backend

**Reference**: `web/src/services/websocketService.ts` (already complete)

**Why**: Mobile needs real-time updates for alerts, check-ins, and SOS notifications

**Checklist**:
- [ ] File created
- [ ] Connection method implemented
- [ ] Event handlers working
- [ ] Auto-reconnection working
- [ ] Message queue working
- [ ] Tests passing
- [ ] Integrated with Redux

---

### STEP 2: Create Web API Service (2-3 hours)

**File**: `web/src/services/apiService.ts`

**What to do**:
1. Create new file with API client class
2. Implement Axios instance
3. Add JWT token management
4. Implement request/response interceptors
5. Add all 50+ endpoint methods
6. Implement error handling
7. Test with backend

**Reference**: `mobile/src/services/apiService.ts` (already complete)

**Why**: Web app needs centralized API client for consistent error handling and token management

**Checklist**:
- [ ] File created
- [ ] Axios client configured
- [ ] Token management working
- [ ] Interceptors working
- [ ] All endpoints implemented
- [ ] Error handling working
- [ ] Tests passing
- [ ] Integrated with Redux

---

## 📋 DETAILED IMPLEMENTATION GUIDE

### Mobile WebSocket Service Implementation

**Location**: `mobile/src/services/websocketService.ts`

**Template**:
```typescript
import { EventEmitter } from 'events';

export interface WebSocketMessage {
  type: 'incident' | 'alert' | 'checkin' | 'sos' | 'notification';
  action: 'created' | 'updated' | 'deleted';
  data: any;
  timestamp: string;
}

class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private messageQueue: WebSocketMessage[] = [];
  private isConnecting = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(url: string = 'ws://localhost:3000') {
    super();
    this.url = url;
  }

  // Connect to WebSocket
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;
      this.token = token;

      try {
        const wsUrl = `${this.url}?token=${token}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushMessageQueue();
          this.emit('connected', { timestamp: new Date().toISOString() });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          this.emit('error', { error: error.toString() });
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.isConnecting = false;
          this.stopHeartbeat();
          this.emit('disconnected', { timestamp: new Date().toISOString() });
          this.attemptReconnect();
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  // Disconnect from WebSocket
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopHeartbeat();
  }

  // Subscribe to events
  on(event: string, handler: (data: any) => void): () => void {
    super.on(event, handler);
    return () => this.off(event, handler);
  }

  // Send message
  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  // Private methods
  private handleMessage(message: WebSocketMessage): void {
    const eventName = `${message.type}:${message.action}`;
    this.emit(eventName, message.data);
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.token) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`Attempting to reconnect in ${delay}ms...`);
      setTimeout(() => {
        this.connect(this.token!).catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, delay);
    }
  }
}

export default new WebSocketService();
```

**Integration with Redux**:
```typescript
// In mobile screens, use like this:
useEffect(() => {
  const unsubscribe = websocketService.on('alert:created', (data) => {
    dispatch(addAlert(data));
  });
  return () => unsubscribe();
}, [dispatch]);
```

---

### Web API Service Implementation

**Location**: `web/src/services/apiService.ts`

**Template**:
```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  statusCode: number;
}

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

class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          this.clearToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse> {
    try {
      const response = await this.client.post('/auth/login', { email, password });
      if (response.data.data?.token) {
        this.setToken(response.data.data.token);
      }
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout(): Promise<ApiResponse> {
    try {
      const response = await this.client.post('/auth/logout');
      this.clearToken();
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // User endpoints
  async getUsers(): Promise<ApiResponse> {
    try {
      const response = await this.client.get('/users');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUser(id: string): Promise<ApiResponse> {
    try {
      const response = await this.client.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Alert endpoints
  async getAlerts(): Promise<ApiResponse> {
    try {
      const response = await this.client.get('/alerts');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createAlert(data: any): Promise<ApiResponse> {
    try {
      const response = await this.client.post('/alerts', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Check-in endpoints
  async getCheckIns(): Promise<ApiResponse> {
    try {
      const response = await this.client.get('/checkins');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createCheckIn(data: any): Promise<ApiResponse> {
    try {
      const response = await this.client.post('/checkins', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ... Add all 50+ endpoints

  // Token management
  private setToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
  }

  private clearToken(): void {
    this.token = null;
    localStorage.removeItem('token');
  }

  // Error handling
  private handleError(error: any): ApiError {
    if (error.response) {
      return new ApiError(
        error.response.data?.error?.code || 'UNKNOWN_ERROR',
        error.response.status,
        error.response.data?.error?.message || 'An error occurred',
        error
      );
    }
    return new ApiError('NETWORK_ERROR', 0, error.message, error);
  }
}

export default new ApiService();
```

---

## 🔄 INTEGRATION WITH REDUX

### Mobile WebSocket Integration

**In Redux slices**:
```typescript
// In alertsSlice.ts
import websocketService from '../services/websocketService';

// In component
useEffect(() => {
  const unsubscribe = websocketService.on('alert:created', (data) => {
    dispatch(addAlert(data));
  });
  return () => unsubscribe();
}, [dispatch]);
```

---

### Web API Integration

**In Redux slices**:
```typescript
// In alertSlice.ts
import apiService from '../services/apiService';

// In component
useEffect(() => {
  dispatch(setLoading(true));
  apiService.getAlerts()
    .then(res => {
      if (res.success) dispatch(setItems(res.data));
      else dispatch(setError('Failed to load alerts'));
    })
    .catch(err => dispatch(setError(err.message)));
}, [dispatch]);
```

---

## ✅ VERIFICATION STEPS

### After Mobile WebSocket Implementation
1. [ ] Mobile app connects to WebSocket
2. [ ] Real-time alerts received
3. [ ] Check-in updates received
4. [ ] SOS notifications received
5. [ ] Auto-reconnection working
6. [ ] Message queue working
7. [ ] Redux integration working

### After Web API Service Implementation
1. [ ] Web app makes successful API calls
2. [ ] Token management working
3. [ ] Error handling working
4. [ ] All endpoints accessible
5. [ ] Redux integration working
6. [ ] No TypeScript errors

---

## 📊 PROGRESS TRACKING

### Week 1 Progress
- [ ] Mobile WebSocket Service (2-3h)
- [ ] Web API Service (2-3h)
- [ ] Testing & Integration (2h)
- **Total**: 6-8 hours

### Week 2 Progress
- [ ] Mobile Offline Sync (3-4h)
- [ ] Additional Web Pages (4-5h)
- [ ] Testing & Integration (2h)
- **Total**: 9-11 hours

### Week 3 Progress
- [ ] Error Boundaries (1-2h)
- [ ] Loading Skeletons (2-3h)
- [ ] Final Testing (2h)
- **Total**: 5-7 hours

---

## 🎯 SUCCESS CRITERIA

### Phase 1 Complete When:
- ✅ Mobile WebSocket connects and receives messages
- ✅ Web API service makes successful calls
- ✅ Redux integration working
- ✅ 0 TypeScript errors
- ✅ All tests passing

### Phase 2 Complete When:
- ✅ Mobile offline sync working
- ✅ All new web pages functional
- ✅ Redux integration working
- ✅ 0 TypeScript errors
- ✅ All tests passing

### Phase 3 Complete When:
- ✅ Error boundaries catching errors
- ✅ Loading skeletons showing
- ✅ Professional UI
- ✅ 0 TypeScript errors
- ✅ All tests passing

---

## 🚀 READY TO START?

**Next Action**: Start with Mobile WebSocket Service

**File to create**: `mobile/src/services/websocketService.ts`

**Time estimate**: 2-3 hours

**Reference**: `web/src/services/websocketService.ts`

**Let's go!** 🎉

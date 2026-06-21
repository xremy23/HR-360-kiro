import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'hr_admin' | 'safety_admin' | 'employee';
  organizationId?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  hasOrganization: boolean;
  accessMode: 'guest' | 'authenticated-no-org' | 'authenticated-with-org' | 'admin';
  loading: boolean;
  error: string | null;
  token: string | null;
  guestDeviceId: string | null;
}

// Initialize from localStorage
const getInitialState = (): AuthState => {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const guestDeviceId = localStorage.getItem('guestDeviceId');
    const isGuest = localStorage.getItem('isGuest') === 'true';
    
    if (token && userStr) {
      const user = JSON.parse(userStr);
      const hasOrg = !!user.organizationId;
      const isAdmin = user.role === 'admin' || user.role === 'hr_admin' || user.role === 'safety_admin';
      const accessMode: 'admin' | 'authenticated-with-org' | 'authenticated-no-org' = 
        isAdmin && hasOrg ? 'admin' : hasOrg ? 'authenticated-with-org' : 'authenticated-no-org';
      
      return {
        user,
        token,
        isAuthenticated: true,
        isGuest: false,
        hasOrganization: hasOrg,
        accessMode,
        guestDeviceId: null,
        loading: false,
        error: null,
      };
    }
    
    if (isGuest && guestDeviceId) {
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isGuest: true,
        hasOrganization: false,
        accessMode: 'guest',
        guestDeviceId,
        loading: false,
        error: null,
      };
    }
  } catch (error) {
    console.error('Failed to restore auth state:', error);
  }
  
  return {
    user: null,
    isAuthenticated: false,
    isGuest: true,
    hasOrganization: false,
    accessMode: 'guest',
    guestDeviceId: generateGuestDeviceId(),
    loading: false,
    error: null,
    token: null,
  };
};

// Generate a unique device ID for guests
function generateGuestDeviceId(): string {
  let deviceId = localStorage.getItem('guestDeviceId');
  if (!deviceId) {
    deviceId = 'guest-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('guestDeviceId', deviceId);
  }
  return deviceId;
}

const initialState: AuthState = getInitialState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isGuest = false;
      state.hasOrganization = !!action.payload.user.organizationId;
      const isAdmin = action.payload.user.role === 'admin' || action.payload.user.role === 'hr_admin' || action.payload.user.role === 'safety_admin';
      state.accessMode = isAdmin && state.hasOrganization ? 'admin' : state.hasOrganization ? 'authenticated-with-org' : 'authenticated-no-org';
      state.loading = false;
      state.error = null;
      
      // Persist to localStorage
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('isGuest', 'false');
    },
    guestLogin: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isGuest = true;
      state.hasOrganization = false;
      state.accessMode = 'guest';
      state.guestDeviceId = state.guestDeviceId || generateGuestDeviceId();
      state.loading = false;
      state.error = null;
      
      // Persist to localStorage
      localStorage.setItem('isGuest', 'true');
      localStorage.setItem('guestDeviceId', state.guestDeviceId);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isGuest = true;
      state.hasOrganization = false;
      state.accessMode = 'guest';
      state.guestDeviceId = generateGuestDeviceId();
      state.error = null;
      
      // Clear authenticated session but keep guest mode
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.setItem('isGuest', 'true');
      localStorage.setItem('guestDeviceId', state.guestDeviceId);
    },
    setOrganization: (state, action: PayloadAction<{ organizationId: string; role: string }>) => {
      if (state.user) {
        state.user.organizationId = action.payload.organizationId;
        state.user.role = action.payload.role as any;
        state.hasOrganization = true;
        const isAdmin = action.payload.role === 'admin' || action.payload.role === 'hr';
        state.accessMode = isAdmin ? 'admin' : 'authenticated-with-org';
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
  },
});

export const { setLoading, setError, loginSuccess, guestLogin, logout, updateUser, setOrganization } = authSlice.actions;
export default authSlice.reducer;

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import kbReducer from './slices/kbSlice';
import checkinReducer from './slices/checkinSlice';
import alertsReducer from './slices/alertsSlice';
import offlineReducer from './slices/offlineSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    kb: kbReducer,
    checkin: checkinReducer,
    alerts: alertsReducer,
    offline: offlineReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

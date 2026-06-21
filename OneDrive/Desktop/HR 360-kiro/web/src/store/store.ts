import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import kbReducer from './slices/kbSlice';
import checkinReducer from './slices/checkinSlice';
import alertReducer from './slices/alertSlice';
import incidentReducer from './slices/incidentSlice';
import userReducer from './slices/userSlice';
import chatbotReducer from './slices/chatbotSlice';
import notificationReducer from './slices/notificationSlice';
import biometricReducer from './slices/biometricSlice';
import locationReducer from './slices/locationSlice';
import communityReportReducer from './slices/communityReportSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    kb: kbReducer,
    checkin: checkinReducer,
    alert: alertReducer,
    incident: incidentReducer,
    user: userReducer,
    chatbot: chatbotReducer,
    notification: notificationReducer,
    biometric: biometricReducer,
    location: locationReducer,
    communityReport: communityReportReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore certain actions or paths that might have non-serializable values
        ignoredActions: ['auth/loginSuccess', 'auth/setOrganization', 'auth/updateUser'],
        ignoredPaths: ['auth.user'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

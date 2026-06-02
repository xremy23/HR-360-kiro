import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import kbReducer from './slices/kbSlice';
import checkinReducer from './slices/checkinSlice';
import alertReducer from './slices/alertSlice';
import incidentReducer from './slices/incidentSlice';
import userReducer from './slices/userSlice';
import chatbotReducer from './slices/chatbotSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    kb: kbReducer,
    checkin: checkinReducer,
    alert: alertReducer,
    incident: incidentReducer,
    user: userReducer,
    chatbot: chatbotReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

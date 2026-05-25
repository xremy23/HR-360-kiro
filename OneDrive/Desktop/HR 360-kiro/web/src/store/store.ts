import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import kbReducer from './slices/kbSlice';
import checkinReducer from './slices/checkinSlice';
import alertReducer from './slices/alertSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    kb: kbReducer,
    checkin: checkinReducer,
    alert: alertReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

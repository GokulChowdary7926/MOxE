import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import accountReducer from './accountSlice';
import settingsReducer from './settingsSlice';
import campaignReducer from './campaignSlice';
import adReducer from './adSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    account: accountReducer,
    settings: settingsReducer,
    campaigns: campaignReducer,
    ads: adReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

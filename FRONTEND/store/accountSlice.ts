import { createSlice } from '@reduxjs/toolkit';
import type { AccountCapabilities } from '../constants/accountTypes';

const hasToken = typeof localStorage !== 'undefined' && !!localStorage.getItem('token');

const accountSlice = createSlice({
  name: 'account',
  initialState: {
    currentAccount: hasToken
      ? { id: 'dev', username: 'dev', displayName: 'Dev User', accountType: 'JOB', subscriptionTier: 'FREE' }
      : null,
    accounts: [] as any[],
    capabilities: null as AccountCapabilities | null,
  },
  reducers: {
    setCurrentAccount: (state, action) => {
      state.currentAccount = action.payload;
      state.capabilities = action.payload?.capabilities ?? state.capabilities;
    },
    setAccounts: (state, action) => {
      state.accounts = action.payload ?? [];
    },
    setCapabilities: (state, action) => {
      state.capabilities = action.payload ?? null;
    },
    switchAccount: (state, action) => {
      const account = action.payload;
      state.currentAccount = account;
      state.capabilities = account?.capabilities ?? null;
    },
  },
});

export const { setCurrentAccount, setAccounts, setCapabilities, switchAccount } = accountSlice.actions;
export default accountSlice.reducer;

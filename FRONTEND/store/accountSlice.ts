import { createSlice } from '@reduxjs/toolkit';
import type { AccountCapabilities } from '../constants/accountTypes';
import { logout, logoutThunk } from './authSlice';

const accountSlice = createSlice({
  name: 'account',
  initialState: {
    /** Hydrated by `fetchMe` after reload; do not use fake ids (breaks Socket/API account lookups). */
    currentAccount: null as Record<string, unknown> | null,
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
  extraReducers: (builder) => {
    builder
      .addCase(logout, (state) => {
        state.currentAccount = null;
        state.accounts = [];
        state.capabilities = null;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.currentAccount = null;
        state.accounts = [];
        state.capabilities = null;
      });
  },
});

export const { setCurrentAccount, setAccounts, setCapabilities, switchAccount } = accountSlice.actions;
export default accountSlice.reducer;

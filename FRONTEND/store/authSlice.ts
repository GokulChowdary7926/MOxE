import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiBase, getToken } from '../services/api';

const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

export type AuthUser = { id: string } | null;

export const login = createAsyncThunk<
  { token: string; user: AuthUser; userId?: string; accountId?: string },
  { loginId: string; password: string },
  { rejectValue: string }
>(
  'auth/login',
  async ({ loginId, password }, { rejectWithValue }) => {
    const base = getApiBase();
    const res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const rawError = data?.error ?? data?.message ?? (Array.isArray(data?.errors) ? data.errors[0] : null);
      const backendMsg = rawError != null ? String(rawError).trim() : '';
      const msg =
        backendMsg ||
        (res.status === 401
          ? 'Invalid username or password.'
          : res.status === 0
            ? 'Cannot reach server. Check your connection and that the backend is running.'
            : res.status === 404 || res.status >= 502
              ? 'Server unavailable. Ensure the backend is running and try again.'
              : res.status === 400
                ? 'Invalid request. Check your username and password.'
                : res.statusText?.trim() || 'Login failed. Check your username and password, or sign up with phone if you don\'t have an account.');
      return rejectWithValue(msg);
    }
    if (!data.token) return rejectWithValue('No token returned');
    if (typeof localStorage !== 'undefined') localStorage.setItem('token', data.token);
    return {
      token: data.token,
      user: data.user ?? { id: data.userId ?? data.accountId ?? 'unknown' },
      userId: data.userId,
      accountId: data.accountId,
    };
  }
);

export const register = createAsyncThunk<
  { token: string; user: AuthUser },
  { email: string; displayName: string; username: string; password: string },
  { rejectValue: string }
>(
  'auth/register',
  async ({ email, displayName, username, password }, { rejectWithValue }) => {
    const base = getApiBase();
    const res = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, displayName, username, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return rejectWithValue(data?.error || 'Sign up failed');
    if (!data.token) return rejectWithValue(data?.error || 'No token returned');
    if (typeof localStorage !== 'undefined') localStorage.setItem('token', data.token);
    return {
      token: data.token,
      user: data.user ?? { id: data.userId ?? data.accountId ?? 'unknown' },
    };
  }
);

export const fetchMe = createAsyncThunk<
  { account: Record<string, unknown>; capabilities: Record<string, unknown> | null },
  void,
  { rejectValue: string; state: { auth: { token: string | null } } }
>(
  'auth/fetchMe',
  async (_, { getState, rejectWithValue }) => {
    const t = getToken() ?? getState().auth.token;
    if (!t) return rejectWithValue('No token');
    const base = getApiBase();
    const res = await fetch(`${base}/accounts/me`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return rejectWithValue(data?.error || 'Failed to load account');
    return { account: data.account ?? {}, capabilities: data.capabilities ?? null };
  }
);

export const logoutThunk = createAsyncThunk('auth/logoutThunk', async () => {
  if (typeof localStorage !== 'undefined') localStorage.removeItem('token');
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: token ? { id: 'dev' } : null,
    token,
    isAuthenticated: !!token,
    loading: false,
    error: null as string | null,
  },
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload?.user ?? state.user;
      state.token = action.payload?.token ?? state.token;
      state.isAuthenticated = !!state.token;
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Login failed';
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Sign up failed';
      })
      .addCase(fetchMe.rejected, (state, action) => {
        if (action.payload === 'No token') return;
        state.error = action.payload ?? null;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { setCredentials, logout, clearError } = authSlice.actions;
export default authSlice.reducer;

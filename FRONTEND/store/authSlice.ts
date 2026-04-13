import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { DEV_API_START_HINT, getApiBase, getToken } from '../services/api';

async function readJsonBody(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    return { error: trimmed.slice(0, 500) };
  }
}

const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
/** After refresh, token exists before `fetchMe`; user is set when login/register or when App dispatches from `/accounts/me`. */

export type AuthUser = { id: string } | null;

export const login = createAsyncThunk<
  { token: string; user: AuthUser; userId?: string; accountId?: string },
  { loginId: string; password: string },
  { rejectValue: string }
>(
  'auth/login',
  async ({ loginId, password }, { rejectWithValue }) => {
    const base = getApiBase();
    let res: Response;
    try {
      res = await fetch(`${base}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password }),
      });
    } catch (err) {
      const isNetwork = err instanceof TypeError && (err.message === 'Failed to fetch' || (err as Error).message?.includes('fetch'));
      return rejectWithValue(isNetwork ? `Cannot reach server. ${DEV_API_START_HINT}` : (err instanceof Error ? err.message : 'Network error. Please try again.'));
    }
    const ct = res.headers.get('content-type') ?? '';
    const data = await readJsonBody(res);
    if (!res.ok) {
      const rawError =
        data?.message ?? data?.error ?? (Array.isArray(data?.errors) ? data.errors[0] : null);
      const backendMsg = rawError != null ? String(rawError).trim() : '';
      const upstreamDown =
        res.status === 502 || res.status === 503 || res.status === 504;
      const probablyNotApi =
        upstreamDown || (Object.keys(data).length === 0 && ct.includes('text/html'));
      const msg =
        backendMsg ||
        (res.status === 401
          ? 'Invalid username or password.'
          : res.status === 429
            ? 'Too many attempts. Please try again later.'
            : probablyNotApi || res.status === 404
              ? `Cannot reach the API. ${DEV_API_START_HINT}`
              : res.status === 500
                ? `Server error (HTTP 500). ${DEV_API_START_HINT} If the API is running, check BACKEND logs and PostgreSQL (try GET ${getApiBase()}/health/ready).`
                : res.status === 400
                  ? 'Invalid request. Check your username and password.'
                  : res.statusText?.trim() || 'Login failed. Check your username and password.');
      return rejectWithValue(msg);
    }
    const token = data.token as string | undefined;
    if (!token) return rejectWithValue('No token returned');
    if (typeof localStorage !== 'undefined') localStorage.setItem('token', token);
    return {
      token,
      user: (data.user as AuthUser) ?? { id: (data.userId ?? data.accountId ?? 'unknown') as string },
      userId: data.userId as string | undefined,
      accountId: data.accountId as string | undefined,
    };
  }
);

export const register = createAsyncThunk<
  { token: string; user: AuthUser; userId?: string; accountId?: string },
  { username: string; displayName: string; password: string; accountType?: string },
  { rejectValue: string }
>(
  'auth/register',
  async ({ username, displayName, password, accountType }, { rejectWithValue }) => {
    const base = getApiBase();
    let res: Response;
    try {
      res = await fetch(`${base}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), displayName: displayName.trim(), password, accountType: accountType || 'PERSONAL' }),
      });
    } catch (err) {
      const isNetwork = err instanceof TypeError && (err.message === 'Failed to fetch' || (err as Error).message?.includes('fetch'));
      return rejectWithValue(isNetwork ? `Cannot reach server. ${DEV_API_START_HINT}` : (err instanceof Error ? err.message : 'Sign up failed'));
    }
    const data = await readJsonBody(res);
    if (!res.ok) {
      const msg =
        (data?.message as string) ||
        (data?.error as string) ||
        (res.status >= 500 ? `Server error. ${DEV_API_START_HINT}` : 'Sign up failed');
      return rejectWithValue(msg);
    }
    const token = data.token as string | undefined;
    if (!token) return rejectWithValue((data?.error as string) || 'No token returned');
    if (typeof localStorage !== 'undefined') localStorage.setItem('token', token);
    return {
      token,
      user: (data.user as AuthUser) ?? { id: (data.userId ?? data.accountId ?? 'unknown') as string },
      userId: data.userId as string | undefined,
      accountId: data.accountId as string | undefined,
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
    let res: Response;
    try {
      res = await fetch(`${base}/accounts/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
    } catch (err) {
      const isNetwork = err instanceof TypeError && (err.message === 'Failed to fetch' || (err as Error).message?.includes('fetch'));
      return rejectWithValue(isNetwork ? `Cannot reach server. ${DEV_API_START_HINT}` : (err instanceof Error ? err.message : 'Request failed'));
    }
    const data = await readJsonBody(res);
    if (!res.ok) {
      const raw =
        (data?.message as string) ||
        (data?.error as string) ||
        (res.status === 401 ? 'Session expired. Please log in again.' : '');
      const fallback = res.status >= 500 ? `Failed to load account (HTTP ${res.status}). ${DEV_API_START_HINT}` : 'Failed to load account';
      return rejectWithValue(raw || fallback);
    }
    return { account: (data.account as Record<string, unknown>) ?? {}, capabilities: (data.capabilities as Record<string, unknown> | null) ?? null };
  }
);

export const logoutThunk = createAsyncThunk('auth/logoutThunk', async () => {
  if (typeof localStorage !== 'undefined') localStorage.removeItem('token');
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null as AuthUser,
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

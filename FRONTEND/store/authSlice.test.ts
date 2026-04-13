import reducer, { clearError, fetchMe, login, logout, register, setCredentials } from './authSlice';

jest.mock('../services/api', () => ({
  getApiBase: () => 'http://localhost:5007/api',
  getToken: jest.fn(() => 'token-x'),
}));

describe('authSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).fetch = jest.fn();
    localStorage.clear();
  });

  it('handles login fulfilled reducer state', () => {
    const state = reducer(
      undefined,
      login.fulfilled({ token: 't1', user: { id: 'u1' } }, 'req1', {
        loginId: 'u',
        password: 'p',
      }),
    );
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('t1');
  });

  it('handles register rejected', () => {
    const state = reducer(undefined, register.rejected(null, 'req1', { username: 'u', displayName: 'd', password: 'p' }, 'Sign up failed'));
    expect(state.error).toBe('Sign up failed');
  });

  it('logout resets auth state', () => {
    const seeded = reducer(undefined, setCredentials({ token: 't2', user: { id: 'u2' } }));
    const state = reducer(seeded, logout());
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('clearError clears existing error', () => {
    const withError = reducer(undefined, login.rejected(null, 'req1', { loginId: 'u', password: 'p' }, 'Bad creds'));
    const cleared = reducer(withError, clearError());
    expect(cleared.error).toBeNull();
  });

  it('fetchMe thunk rejects on 401', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error: 'Unauthorized' }),
    });
    const dispatch = jest.fn();
    const getState = () => ({ auth: { token: 't1' } });
    const action = await fetchMe()(dispatch, getState as any, undefined);
    expect(action.type).toContain('rejected');
  });

  it('login thunk fulfills on valid response', async () => {
    const loginBody = JSON.stringify({ token: 'tok', user: { id: 'u1' }, userId: 'u1', accountId: 'a1' });
    (global as any).fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      text: async () => loginBody,
      json: async () => JSON.parse(loginBody),
    });
    const dispatch = jest.fn();
    const action = await login({ loginId: 'user', password: 'pass' })(dispatch, () => ({}), undefined);
    expect(action.type).toContain('fulfilled');
  });

  it('login thunk rejects on network failure', async () => {
    (global as any).fetch.mockRejectedValue(new TypeError('Failed to fetch'));
    const dispatch = jest.fn();
    const action = await login({ loginId: 'user', password: 'pass' })(dispatch, () => ({}), undefined);
    expect(action.type).toContain('rejected');
  });

  it('register thunk rejects when backend returns error', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Username taken' }),
    });
    const dispatch = jest.fn();
    const action = await register({ username: 'u', displayName: 'd', password: 'p' })(dispatch, () => ({}), undefined);
    expect(action.type).toContain('rejected');
  });
});

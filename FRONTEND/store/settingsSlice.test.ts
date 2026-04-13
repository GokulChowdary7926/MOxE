import reducer, {
  addBlockedUser,
  removeBlockedUser,
  setAppTheme,
  setDailyLimit,
  setPrivateAccount,
  toggleCloseFriend,
} from './settingsSlice';

describe('settingsSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sets private account flag', () => {
    const state = reducer(undefined, setPrivateAccount(true));
    expect(state.privacy.isPrivate).toBe(true);
  });

  it('deduplicates blocked users', () => {
    let state = reducer(undefined, addBlockedUser('u1'));
    state = reducer(state, addBlockedUser('u1'));
    expect(state.blockedUserIds).toEqual(['u1']);
    state = reducer(state, removeBlockedUser('u1'));
    expect(state.blockedUserIds).toEqual([]);
  });

  it('toggles close friend membership', () => {
    let state = reducer(undefined, toggleCloseFriend('u2'));
    expect(state.closeFriendIds).toEqual(['u2']);
    state = reducer(state, toggleCloseFriend('u2'));
    expect(state.closeFriendIds).toEqual([]);
  });

  it('forces dark theme and persists', () => {
    const state = reducer(undefined, setAppTheme('dark'));
    expect(state.appTheme).toBe('dark');
    expect(localStorage.getItem('moxe_app_theme')).toBe('dark');
  });

  it('updates daily limit', () => {
    const state = reducer(undefined, setDailyLimit('30'));
    expect(state.dailyLimit).toBe('30');
  });
});

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/** Notification preference value for radio options. */
export type NotificationValue = 'off' | 'on' | 'from_following' | 'from_everyone';

export type PostsStoriesComments = {
  addedToPost: NotificationValue;
  collaborationInvitations: NotificationValue;
  aiGeneratedPosts: NotificationValue;
  storyComments: NotificationValue;
  addToPostSubmissions: NotificationValue;
  photosOfYou: NotificationValue;
  comments: NotificationValue;
  commentLikesAndPins: NotificationValue;
};

export type FollowingFollowers = {
  followRequests: NotificationValue;
  acceptedFollowRequests: NotificationValue;
  newFollowers: NotificationValue;
};

export type MessagesNotifications = {
  messageRequests: NotificationValue;
  messages: NotificationValue;
  groupRequests: NotificationValue;
};

export type EmailNotifications = {
  productAnnouncements: boolean;
  supportEmails: boolean;
  tipsAndTricks: boolean;
};

export type FromMoxe = {
  productAnnouncements: boolean;
  supportEmails: boolean;
  tips: boolean;
};

export type LiveReels = {
  liveVideos: boolean;
  reelRecommendations: boolean;
  reminders: boolean;
};

export type NotificationsState = {
  postsStoriesComments: PostsStoriesComments;
  followingFollowers: FollowingFollowers;
  messages: MessagesNotifications;
  email: EmailNotifications;
  fromMoxe: FromMoxe;
  liveReels: LiveReels;
};

export type DailyLimitValue = '15' | '30' | '45' | '60' | '120' | 'off';

/** App theme is fixed to dark (MOxE product decision). */
export type AppTheme = 'dark';

const THEME_STORAGE_KEY = 'moxe_app_theme';

function getStoredTheme(): AppTheme {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } catch {
      /* ignore */
    }
  }
  return 'dark';
}

const defaultPostsStoriesComments: PostsStoriesComments = {
  addedToPost: 'on',
  collaborationInvitations: 'on',
  aiGeneratedPosts: 'on',
  storyComments: 'from_everyone',
  addToPostSubmissions: 'on',
  photosOfYou: 'from_everyone',
  comments: 'from_everyone',
  commentLikesAndPins: 'on',
};

const defaultFollowingFollowers: FollowingFollowers = {
  followRequests: 'on',
  acceptedFollowRequests: 'on',
  newFollowers: 'on',
};

const defaultMessages: MessagesNotifications = {
  messageRequests: 'from_everyone',
  messages: 'on',
  groupRequests: 'on',
};

const defaultEmail: EmailNotifications = {
  productAnnouncements: true,
  supportEmails: true,
  tipsAndTricks: false,
};

const defaultFromMoxe: FromMoxe = {
  productAnnouncements: true,
  supportEmails: true,
  tips: true,
};

const defaultLiveReels: LiveReels = {
  liveVideos: true,
  reelRecommendations: true,
  reminders: false,
};

export type SettingsState = {
  privacy: {
    isPrivate: boolean;
  };
  notifications: NotificationsState;
  dailyLimit: DailyLimitValue;
  language: string;
  appTheme: AppTheme;
  blockedUserIds: string[];
  restrictedUserIds: string[];
  mutedUserIds: string[];
  closeFriendIds: string[];
};

const initialState: SettingsState = {
  privacy: { isPrivate: false },
  notifications: {
    postsStoriesComments: defaultPostsStoriesComments,
    followingFollowers: defaultFollowingFollowers,
    messages: defaultMessages,
    email: defaultEmail,
    fromMoxe: defaultFromMoxe,
    liveReels: defaultLiveReels,
  },
  dailyLimit: 'off',
  language: 'en',
  appTheme: getStoredTheme(),
  blockedUserIds: [],
  restrictedUserIds: [],
  mutedUserIds: [],
  closeFriendIds: [],
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setPrivateAccount: (state, action: PayloadAction<boolean>) => {
      state.privacy.isPrivate = action.payload;
    },
    setPostsStoriesComments: (state, action: PayloadAction<Partial<PostsStoriesComments>>) => {
      state.notifications.postsStoriesComments = { ...state.notifications.postsStoriesComments, ...action.payload };
    },
    setFollowingFollowers: (state, action: PayloadAction<Partial<FollowingFollowers>>) => {
      state.notifications.followingFollowers = { ...state.notifications.followingFollowers, ...action.payload };
    },
    setMessagesNotifications: (state, action: PayloadAction<Partial<MessagesNotifications>>) => {
      state.notifications.messages = { ...state.notifications.messages, ...action.payload };
    },
    setEmailNotifications: (state, action: PayloadAction<Partial<EmailNotifications>>) => {
      state.notifications.email = { ...state.notifications.email, ...action.payload };
    },
    setFromMoxe: (state, action: PayloadAction<Partial<FromMoxe>>) => {
      state.notifications.fromMoxe = { ...state.notifications.fromMoxe, ...action.payload };
    },
    setLiveReels: (state, action: PayloadAction<Partial<LiveReels>>) => {
      state.notifications.liveReels = { ...state.notifications.liveReels, ...action.payload };
    },
    setDailyLimit: (state, action: PayloadAction<DailyLimitValue>) => {
      state.dailyLimit = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setAppTheme: (state, _action: PayloadAction<AppTheme>) => {
      state.appTheme = 'dark';
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(THEME_STORAGE_KEY, 'dark');
        } catch {
          /* ignore */
        }
      }
    },
    setBlockedUserIds: (state, action: PayloadAction<string[]>) => {
      state.blockedUserIds = action.payload;
    },
    addBlockedUser: (state, action: PayloadAction<string>) => {
      if (!state.blockedUserIds.includes(action.payload)) {
        state.blockedUserIds.push(action.payload);
      }
    },
    removeBlockedUser: (state, action: PayloadAction<string>) => {
      state.blockedUserIds = state.blockedUserIds.filter((id) => id !== action.payload);
    },
    setRestrictedUserIds: (state, action: PayloadAction<string[]>) => {
      state.restrictedUserIds = action.payload;
    },
    removeRestrictedUser: (state, action: PayloadAction<string>) => {
      state.restrictedUserIds = state.restrictedUserIds.filter((id) => id !== action.payload);
    },
    setMutedUserIds: (state, action: PayloadAction<string[]>) => {
      state.mutedUserIds = action.payload;
    },
    removeMutedUser: (state, action: PayloadAction<string>) => {
      state.mutedUserIds = state.mutedUserIds.filter((id) => id !== action.payload);
    },
    setCloseFriendIds: (state, action: PayloadAction<string[]>) => {
      state.closeFriendIds = action.payload;
    },
    toggleCloseFriend: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const idx = state.closeFriendIds.indexOf(id);
      if (idx >= 0) {
        state.closeFriendIds = state.closeFriendIds.filter((i) => i !== id);
      } else {
        state.closeFriendIds = [...state.closeFriendIds, id];
      }
    },
  },
});

export const {
  setPrivateAccount,
  setPostsStoriesComments,
  setFollowingFollowers,
  setMessagesNotifications,
  setEmailNotifications,
  setFromMoxe,
  setLiveReels,
  setDailyLimit,
  setLanguage,
  setAppTheme,
  setBlockedUserIds,
  addBlockedUser,
  removeBlockedUser,
  setRestrictedUserIds,
  removeRestrictedUser,
  setMutedUserIds,
  removeMutedUser,
  setCloseFriendIds,
  toggleCloseFriend,
} = settingsSlice.actions;

export default settingsSlice.reducer;

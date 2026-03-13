// mobile/src/types/navigation.ts

export type RootStackParamList = {
  // Auth
  Login: undefined;
  Register: undefined;
  PhoneVerification: { phoneNumber: string };
  
  // Main Tabs
  MainTabs: undefined;
  
  // Content
  Post: { postId: string };
  Story: { storyId: string; stories: any[] };
  Reel: { reelId: string };
  Live: { liveId?: string };
  
  // Messages
  Messages: undefined;
  Chat: { userId: string; userName: string };
  
  // Other
  Settings: undefined;
  Map: undefined;
  CreatePost: undefined;
  CreateStory: undefined;
  CreateReel: undefined;
  Profile: { userId?: string; username?: string };
  Notifications: undefined;
  Explore: undefined;
  Search: { query?: string };
};

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Create: undefined;
  Notifications: undefined;
  Profile: undefined;
};
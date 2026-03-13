import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type AuthStackParamList = {
  Login: undefined;
  Onboarding: undefined;
};

export type MainTabsParamList = {
  Feed: undefined;
  Explore: undefined;
  Map: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type FeedStackParamList = {
  Home: undefined;
  StoryViewer: { storyId?: string };
};

export type TransactionDetailParams = {
  transactionId: string;
  label: string;
  amount: number;
  date: string;
  isCredit: boolean;
  type: string;
};

export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
  CreatePost: undefined;
  CreateStory: undefined;
  Settings: undefined;
  AccountSettings: undefined;
  PrivacySettings: undefined;
  SafetySettings: undefined;
  AdvancedSettings: undefined;
  Balance: undefined;
  Withdraw: undefined;
  TransactionDetail: TransactionDetailParams;
  EditProfile: undefined;
  BusinessDashboard: undefined;
  Commerce: undefined;
  SellerOrders: undefined;
  SellerProducts: undefined;
  CreatorStudio: undefined;
  JobHub: undefined;
  ManageHighlights: undefined;
  EmergencyContacts: undefined;
  HangoutMode: undefined;
  SOSButton: undefined;
  StoryCamera: undefined;
  StoryEditor: {
    uri: string;
    type?: 'image' | 'video';
    mode?: 'photo' | 'video' | 'boomerang';
  };
  VoiceCommand: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainTabsScreenProps<T extends keyof MainTabsParamList> =
  BottomTabScreenProps<MainTabsParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
    interface AuthParamList extends AuthStackParamList {}
    interface MainTabsParamList extends MainTabsParamList {}
  }
}

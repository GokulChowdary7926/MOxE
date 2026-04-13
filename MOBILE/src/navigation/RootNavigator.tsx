import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAccount } from '../context/AccountContext';
import { MainTabs } from './MainTabs';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AccountSettingsScreen } from '../screens/settings/AccountSettingsScreen';
import { PrivacySettingsScreen } from '../screens/settings/PrivacySettingsScreen';
import { SafetySettingsScreen } from '../screens/settings/SafetySettingsScreen';
import { AdvancedSettingsScreen } from '../screens/settings/AdvancedSettingsScreen';
import { BalanceScreen } from '../screens/BalanceScreen';
import { WithdrawScreen } from '../screens/balance/WithdrawScreen';
import { TransactionDetailScreen } from '../screens/balance/TransactionDetailScreen';
import { BusinessDashboardScreen } from '../screens/business/BusinessDashboardScreen';
import { CommerceScreen } from '../screens/business/CommerceScreen';
import { SellerOrdersScreen } from '../screens/business/SellerOrdersScreen';
import { SellerProductsScreen } from '../screens/business/SellerProductsScreen';
import { CreatorStudioScreen } from '../screens/creator/CreatorStudioScreen';
import { ManageHighlightsScreen } from '../screens/highlights/ManageHighlightsScreen';
import { EmergencyContactsScreen } from '../screens/safety/EmergencyContactsScreen';
import { HangoutModeScreen } from '../screens/safety/HangoutModeScreen';
import { SOSButtonScreen } from '../screens/safety/SOSButtonScreen';
import { StoryCameraScreen } from '../screens/story/StoryCameraScreen';
import { StoryEditorScreen } from '../screens/story/StoryEditorScreen';
import { VoiceCommandScreen } from '../screens/voice/VoiceCommandScreen';
import type { RootStackParamList, AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();

function AuthStack() {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
    </AuthStackNav.Navigator>
  );
}

export function RootNavigator() {
  const { isLoggedIn } = useAccount();

  return (
    <Stack.Navigator
      key={isLoggedIn ? 'main' : 'auth'}
      screenOptions={{ headerShown: false }}
      initialRouteName={isLoggedIn ? 'Main' : 'Auth'}
    >
      <Stack.Screen name="Auth" component={AuthStack} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
      <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
      <Stack.Screen name="SafetySettings" component={SafetySettingsScreen} />
      <Stack.Screen name="AdvancedSettings" component={AdvancedSettingsScreen} />
      <Stack.Screen name="Balance" component={BalanceScreen} />
      <Stack.Screen name="Withdraw" component={WithdrawScreen} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
      <Stack.Screen name="BusinessDashboard" component={BusinessDashboardScreen} />
      <Stack.Screen name="Commerce" component={CommerceScreen} />
      <Stack.Screen name="SellerOrders" component={SellerOrdersScreen} />
      <Stack.Screen name="SellerProducts" component={SellerProductsScreen} />
      <Stack.Screen name="CreatorStudio" component={CreatorStudioScreen} />
      <Stack.Screen name="ManageHighlights" component={ManageHighlightsScreen} />
      <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
      <Stack.Screen name="HangoutMode" component={HangoutModeScreen} />
      <Stack.Screen name="SOSButton" component={SOSButtonScreen} />
      <Stack.Screen name="StoryCamera" component={StoryCameraScreen} />
      <Stack.Screen name="StoryEditor" component={StoryEditorScreen} />
      <Stack.Screen name="VoiceCommand" component={VoiceCommandScreen} />
    </Stack.Navigator>
  );
}

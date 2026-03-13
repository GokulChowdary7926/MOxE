// mobile/App.tsx

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { store, persistor } from './src/store';
import { initializeSocket } from './src/services/socket';

// Auth Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import PhoneVerificationScreen from './src/screens/auth/PhoneVerificationScreen';

// Main Screens
import HomeScreen from './src/screens/main/HomeScreen';
import ExploreScreen from './src/screens/main/ExploreScreen';
import CreateScreen from './src/screens/main/CreateScreen';
import NotificationsScreen from './src/screens/main/NotificationsScreen';
import ProfileScreen from './src/screens/main/ProfileScreen';

// Other Screens
import PostScreen from './src/screens/post/PostScreen';
import StoryScreen from './src/screens/story/StoryScreen';
import ReelScreen from './src/screens/reel/ReelScreen';
import LiveScreen from './src/screens/live/LiveScreen';
import MessagesScreen from './src/screens/messages/MessagesScreen';
import ChatScreen from './src/screens/messages/ChatScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import MapScreen from './src/screens/map/MapScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Explore') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'Create') {
            iconName = focused ? 'plus-circle' : 'plus-circle-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Create" component={CreateScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const App = () => {
  useEffect(() => {
    // Initialize socket connection when user is authenticated
    const token = store.getState().auth.token;
    if (token) {
      initializeSocket(token);
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SafeAreaProvider>
            <NavigationContainer>
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                {/* Auth Stack */}
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />

                {/* Main Stack */}
                <Stack.Screen name="MainTabs" component={MainTabs} />

                {/* Content Screens */}
                <Stack.Screen name="Post" component={PostScreen} />
                <Stack.Screen name="Story" component={StoryScreen} />
                <Stack.Screen name="Reel" component={ReelScreen} />
                <Stack.Screen name="Live" component={LiveScreen} />

                {/* Messages */}
                <Stack.Screen name="Messages" component={MessagesScreen} />
                <Stack.Screen name="Chat" component={ChatScreen} />

                {/* Other */}
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="Map" component={MapScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;
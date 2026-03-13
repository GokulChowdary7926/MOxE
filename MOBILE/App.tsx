import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/ThemeContext';
import { AccountProvider } from './src/context/AccountContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AccountProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AccountProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

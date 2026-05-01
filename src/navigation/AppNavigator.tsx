// ─── App Navigator ───────────────────────────────────────────────────────────

import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomTabNavigator } from './BottomTabNavigator';
import { AuthNavigator } from './AuthNavigator';
import { NotificationHistoryScreen } from '../screens/notifications/NotificationHistoryScreen';
import { useAuth } from '../components/auth/AuthProvider';
import { useTheme } from '../components/theme/ThemeProvider';

export type RootStackParamList = {
  Tabs: undefined;
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={BottomTabNavigator} />
      <Stack.Screen name="Notifications" component={NotificationHistoryScreen} />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {user ? <AppStack /> : <AuthNavigator />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}


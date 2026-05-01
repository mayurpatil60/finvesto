// ─── Settings Navigator ───────────────────────────────────────────────────────

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ConfigScreen } from '../screens/settings/components/ConfigScreen';

export type SettingsStackParamList = {
  SettingsMain: undefined;
  Config: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
      <Stack.Screen name="Config" component={ConfigScreen} />
    </Stack.Navigator>
  );
}

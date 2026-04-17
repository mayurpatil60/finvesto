// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────

import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AnalysisScreen } from '../screens/analysis/AnalysisScreen';
import { MarketsScreen } from '../screens/markets/MarketsScreen';
import { ToolsScreen } from '../screens/tools/ToolsScreen';
import { SettingsNavigator } from './SettingsNavigator';
import { useTheme } from '../components/theme/ThemeProvider';

export type BottomTabParamList = {
  Analysis: undefined;
  Markets: undefined;
  Tools: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const TAB_ICONS: Record<keyof BottomTabParamList, string> = {
  Analysis: '📊',
  Markets: '📈',
  Tools: '🔧',
  Settings: '⚙️',
};

export function BottomTabNavigator() {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <Tab.Navigator
      initialRouteName="Analysis"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>
            {TAB_ICONS[route.name as keyof BottomTabParamList]}
          </Text>
        ),
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textSecondary,
      })}
    >
      <Tab.Screen name="Analysis" component={AnalysisScreen} />
      <Tab.Screen name="Markets" component={MarketsScreen} />
      <Tab.Screen name="Tools" component={ToolsScreen} />
      <Tab.Screen name="Settings" component={SettingsNavigator} />
    </Tab.Navigator>
  );
}

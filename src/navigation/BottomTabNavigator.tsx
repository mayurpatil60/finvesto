// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/home/HomeScreen';
import { OptionsScreen } from '../screens/options/OptionsScreen';
import { MarketsScreen } from '../screens/markets/MarketsScreen';
import { ToolsScreen } from '../screens/tools/ToolsScreen';
import { SettingsNavigator } from './SettingsNavigator';
import { NotificationHistoryScreen } from '../screens/notifications/NotificationHistoryScreen';
import { useTheme } from '../components/theme/ThemeProvider';

export type BottomTabParamList = {
  Home: undefined;
  Options: undefined;
  Markets: { initialTab?: string } | undefined;
  Tools: undefined;
  Notifications: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

type TabName = keyof BottomTabParamList;
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<TabName, { active: IconName; inactive: IconName }> = {
  Home:          { active: 'home', inactive: 'home-outline' },
  Options:       { active: 'bar-chart', inactive: 'bar-chart-outline' },
  Markets:       { active: 'trending-up', inactive: 'trending-up-outline' },
  Tools:         { active: 'construct', inactive: 'construct-outline' },
  Notifications: { active: 'notifications', inactive: 'notifications-outline' },
  Settings:      { active: 'settings', inactive: 'settings-outline' },
};

export function BottomTabNavigator() {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          borderTopWidth: 1,
          height: 52,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarIcon: ({ focused }) => {
          const icons = TAB_ICONS[route.name as TabName];
          return (
            <Ionicons
              name={focused ? icons.active : icons.inactive}
              size={20}
              color={focused ? c.primary : c.textSecondary}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Options" component={OptionsScreen} />
      <Tab.Screen name="Markets" component={MarketsScreen} />
      <Tab.Screen name="Tools" component={ToolsScreen} />
      <Tab.Screen name="Notifications" component={NotificationHistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsNavigator} />
    </Tab.Navigator>
  );
}

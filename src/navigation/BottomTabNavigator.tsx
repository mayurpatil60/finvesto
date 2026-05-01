// Bottom Tab Navigator

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/home/HomeScreen';
import { OptionsScreen } from '../screens/options/OptionsScreen';
import { MarketsScreen } from '../screens/markets/MarketsScreen';
import { ToolsScreen } from '../screens/tools/ToolsScreen';
import { SettingsNavigator } from './SettingsNavigator';
import { useTheme } from '../components/theme/ThemeProvider';
import { usePermission } from '../hooks/usePermission';
import { CtPermission } from '../types/enums/permission.enum';

export type BottomTabParamList = {
  Home: undefined;
  Options: undefined;
  Markets: { initialTab?: string } | undefined;
  Tools: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

type TabName = keyof BottomTabParamList;
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<TabName, { active: IconName; inactive: IconName }> = {
  Home:     { active: 'home',        inactive: 'home-outline' },
  Options:  { active: 'bar-chart',   inactive: 'bar-chart-outline' },
  Markets:  { active: 'trending-up', inactive: 'trending-up-outline' },
  Tools:    { active: 'construct',   inactive: 'construct-outline' },
  Settings: { active: 'settings',    inactive: 'settings-outline' },
};

export function BottomTabNavigator() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { hasPermission } = usePermission();

  return (
    <Tab.Navigator
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
        tabBarIcon: ({ focused }) => (
          <Ionicons
            name={TAB_ICONS[route.name as TabName][focused ? 'active' : 'inactive']}
            size={20}
            color={focused ? c.primary : c.textSecondary}
          />
        ),
      })}
    >
      {hasPermission(CtPermission.VIEW_HOME) && (
        <Tab.Screen name="Home" component={HomeScreen} />
      )}
      {hasPermission(CtPermission.VIEW_OPTIONS) && (
        <Tab.Screen name="Options" component={OptionsScreen} />
      )}
      {hasPermission(CtPermission.VIEW_MARKETS) && (
        <Tab.Screen name="Markets" component={MarketsScreen} />
      )}
      {hasPermission(CtPermission.VIEW_TOOLS) && (
        <Tab.Screen name="Tools" component={ToolsScreen} />
      )}
      <Tab.Screen name="Settings" component={SettingsNavigator} />
    </Tab.Navigator>
  );
}

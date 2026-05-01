// Bottom Tab Navigator

import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/home/HomeScreen';
import { OptionsScreen } from '../screens/options/OptionsScreen';
import { MarketsScreen } from '../screens/markets/MarketsScreen';
import { ToolsScreen } from '../screens/tools/ToolsScreen';
import { SettingsNavigator } from './SettingsNavigator';
import { NotificationHistoryScreen } from '../screens/notifications/NotificationHistoryScreen';
import { useTheme } from '../components/theme/ThemeProvider';
import { usePermission } from '../hooks/usePermission';
import { CtPermission } from '../types/enums/permission.enum';

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
  Home:          { active: 'home',          inactive: 'home-outline' },
  Options:       { active: 'bar-chart',     inactive: 'bar-chart-outline' },
  Markets:       { active: 'trending-up',   inactive: 'trending-up-outline' },
  Tools:         { active: 'construct',     inactive: 'construct-outline' },
  Notifications: { active: 'notifications', inactive: 'notifications-outline' },
  Settings:      { active: 'settings',      inactive: 'settings-outline' },
};

// Hidden tabs that should never appear in the tab bar
const HIDDEN_TABS = new Set<TabName>(['Notifications']);

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { hasPermission } = usePermission();

  const PERM: Partial<Record<TabName, CtPermission>> = {
    Home:    CtPermission.VIEW_HOME,
    Options: CtPermission.VIEW_OPTIONS,
    Markets: CtPermission.VIEW_MARKETS,
    Tools:   CtPermission.VIEW_TOOLS,
    Notifications: CtPermission.VIEW_NOTIFICATIONS,
  };

  const visibleRoutes = state.routes.filter((route) => {
    const name = route.name as TabName;
    if (HIDDEN_TABS.has(name)) return false;
    const perm = PERM[name];
    return perm ? hasPermission(perm) : true;
  });

  return (
    <View style={[styles.tabBar, { backgroundColor: c.surface, borderTopColor: c.border }]}>
      {visibleRoutes.map((route) => {
        const isFocused = state.index === state.routes.indexOf(route);
        const icons = TAB_ICONS[route.name as TabName];
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (isFocused === false && event.defaultPrevented === false) {
            navigation.navigate(route.name);
          }
        };
        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isFocused ? icons.active : icons.inactive}
              size={22}
              color={isFocused ? c.primary : c.textSecondary}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function BottomTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
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

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    height: 52,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

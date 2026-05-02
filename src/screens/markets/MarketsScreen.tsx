// ─── Markets Screen ───────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { AppHeader } from '../../components/layout/AppHeader';
import { useTheme } from '../../components/theme/ThemeProvider';
import { SPACING } from '../../types/constants';
import { IpoScreen } from './components/IpoScreen';
import { FundamentalsScreen } from './components/FundamentalsScreen';
import { InvestmentsScreen } from './components/InvestmentsScreen';
import { MarketSignalScreen } from './components/MarketSignalScreen';
import { usePermission } from '../../hooks/usePermission';
import { CtPermission } from '../../types/enums/permission.enum';
import type { BottomTabParamList } from '../../navigation/BottomTabNavigator';

type MarketTab = 'Invest' | 'Signal' | 'IPO' | 'Fundamentals';
const ALL_TABS: MarketTab[] = ['Invest', 'Signal', 'IPO', 'Fundamentals'];

export function MarketsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { hasPermission } = usePermission();
  const TABS = ALL_TABS.filter(
    t => t !== 'Fundamentals' || hasPermission(CtPermission.VIEW_FUNDAMENTALS),
  );
  const route = useRoute<RouteProp<BottomTabParamList, 'Markets'>>();
  const [activeTab, setActiveTab] = useState<MarketTab>(
    (route.params?.initialTab as MarketTab) ?? 'Invest',
  );
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab as MarketTab);
    }
  }, [route.params?.initialTab]);

  const swipePanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) < 40) return;
        const idx = TABS.indexOf(activeTabRef.current);
        if (g.dx < 0 && idx < TABS.length - 1) setActiveTab(TABS[idx + 1]);
        if (g.dx > 0 && idx > 0) setActiveTab(TABS[idx - 1]);
      },
    }),
  ).current;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.background }]}>
      <AppHeader title="Markets" />

      {/* Top tabs */}
      <View style={[styles.tabBar, { borderBottomColor: c.border }]}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? c.primary : c.textSecondary }]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active component */}
      <View style={styles.content} {...swipePanResponder.panHandlers}>
        {activeTab === 'Invest' && <InvestmentsScreen />}
        {activeTab === 'Signal' && <MarketSignalScreen />}
        {activeTab === 'IPO' && <IpoScreen />}
        {activeTab === 'Fundamentals' && <FundamentalsScreen />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: { flex: 1 },
});


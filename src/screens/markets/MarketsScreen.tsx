// ─── Markets Screen ───────────────────────────────────────────────────────────

import React, { useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/layout/AppHeader';
import { useTheme } from '../../components/theme/ThemeProvider';
import { SPACING } from '../../types/constants';
import { IpoScreen } from './components/IpoScreen';
import { FundamentalsScreen } from './components/FundamentalsScreen';
import { InvestmentsScreen } from './components/InvestmentsScreen';
import { MarketSignalScreen } from './components/MarketSignalScreen';
import { MarketSentiment } from './components/MarketSentiment';

type MarketTab = 'IPO' | 'Fundamentals' | 'Investments' | 'Signal' | 'Sentiment';
const TABS: MarketTab[] = ['IPO', 'Fundamentals', 'Investments', 'Signal', 'Sentiment'];

export function MarketsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [activeTab, setActiveTab] = useState<MarketTab>('IPO');
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

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
        {activeTab === 'IPO' && <IpoScreen />}
        {activeTab === 'Fundamentals' && <FundamentalsScreen />}
        {activeTab === 'Investments' && <InvestmentsScreen />}
        {activeTab === 'Signal' && <MarketSignalScreen />}
        {activeTab === 'Sentiment' && <MarketSentiment />}
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


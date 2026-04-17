// ─── Markets Screen ───────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/layout/AppHeader';
import { useTheme } from '../../components/theme/ThemeProvider';
import { SPACING } from '../../types/constants';
import { IpoScreen } from './components/IpoScreen';
import { FundamentalsScreen } from './components/FundamentalsScreen';
import { InvestmentsScreen } from './components/InvestmentsScreen';

type MarketTab = 'IPO' | 'Fundamentals' | 'Investments';
const TABS: MarketTab[] = ['IPO', 'Fundamentals', 'Investments'];

export function MarketsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [activeTab, setActiveTab] = useState<MarketTab>('IPO');

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
      <View style={styles.content}>
        {activeTab === 'IPO' && <IpoScreen />}
        {activeTab === 'Fundamentals' && <FundamentalsScreen />}
        {activeTab === 'Investments' && <InvestmentsScreen />}
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


// ─── Options Screen ──────────────────────────────────────────────────────────

import React, { useRef, useState } from 'react';
import { PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/layout/AppHeader';
import { useTheme } from '../../components/theme/ThemeProvider';
import { SPACING } from '../../types/constants';
import { OptionSelection } from './components/OptionSelection';
import { OptionJourney } from './components/OptionJourney';
import { OptionTrack } from './components/OptionTrack';
import { OptionSentiment } from './components/OptionSentiment';
type OptionsTab = 'Track' | 'Journey' | 'Selection' | 'Sentiment';
const TABS: OptionsTab[] = ['Track', 'Journey', 'Selection', 'Sentiment'];

export function OptionsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [activeTab, setActiveTab] = useState<OptionsTab>('Track');
  const activeTabRef = useRef<OptionsTab>(activeTab);
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
      <AppHeader title="Options" />

      {/* Top tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabBar, { borderBottomColor: c.border }]}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? c.primary : c.textSecondary }]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.content} {...swipePanResponder.panHandlers}>
        {activeTab === 'Track' && <OptionTrack />}
        {activeTab === 'Journey' && <OptionJourney />}
        {activeTab === 'Selection' && <OptionSelection />}
        {activeTab === 'Sentiment' && <OptionSentiment />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  tabBar: {
    borderBottomWidth: 1,
    flexGrow: 0,
  },
  tab: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  tabText: { fontSize: 13, fontWeight: '600' },
  content: { flex: 1 },
});

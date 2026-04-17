// ─── Tools Screen ─────────────────────────────────────────────────────────────

import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/layout/AppHeader';
import { useTheme } from '../../components/theme/ThemeProvider';
import { SPACING } from '../../types/constants';
import { PercentageCalculator } from './components/PercentageCalculator';
import { PremiumCalculator } from './components/PremiumCalculator';

export function ToolsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshKey(k => k + 1);
      setRefreshing(false);
    }, 800);
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.background }]}>
      <AppHeader title="Tools" />
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={c.primary}
            colors={[c.primary]}
            progressBackgroundColor={c.card}
          />
        }
      >
        <PercentageCalculator key={`pct-${refreshKey}`} />
        <PremiumCalculator key={`prm-${refreshKey}`} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  body: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
});

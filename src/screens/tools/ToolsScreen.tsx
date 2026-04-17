// ─── Tools Screen ─────────────────────────────────────────────────────────────

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/layout/AppHeader';
import { useTheme } from '../../components/theme/ThemeProvider';
import { SPACING } from '../../types/constants';
import { PercentageCalculator } from './components/PercentageCalculator';
import { PremiumCalculator } from './components/PremiumCalculator';

export function ToolsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.background }]}>
      <AppHeader title="Tools" />
      <ScrollView contentContainerStyle={styles.body}>
        <PercentageCalculator />
        <PremiumCalculator />
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

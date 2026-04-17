// ─── Tools Screen ─────────────────────────────────────────────────────────────

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/layout/AppHeader';
import { useTheme } from '../../components/theme/ThemeProvider';
import { SPACING } from '../../types/constants';

export function ToolsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.background }]}>
      <AppHeader title="Tools" />
      <View style={styles.body}>
        <Text style={[styles.placeholder, { color: c.textSecondary }]}>
          Tools coming soon…
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  placeholder: {
    fontSize: 16,
  },
});

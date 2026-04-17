// ─── Settings Screen ──────────────────────────────────────────────────────────

import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../components/theme/ThemeProvider';
import { AppHeader } from '../../components/layout/AppHeader';
import { APP_NAME, SPACING } from '../../types/constants';

export function SettingsScreen() {
  const { theme, isDark, setDark } = useTheme();
  const c = theme.colors;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.background }]}>
      <AppHeader title="Settings" />

      <ScrollView contentContainerStyle={styles.body}>
        {/* Appearance Section */}
        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>APPEARANCE</Text>

        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          {/* Dark Mode Row */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={[styles.rowTitle, { color: c.text }]}>Dark Mode</Text>
              <Text style={[styles.rowSubtitle, { color: c.textSecondary }]}>
                {isDark ? 'Dark theme active' : 'Light theme active'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={setDark}
              trackColor={{ false: c.border, true: c.switchTrack }}
              thumbColor={c.switchThumb}
            />
          </View>
        </View>

        {/* About Section */}
        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>ABOUT</Text>

        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.row}>
            <Text style={[styles.rowTitle, { color: c.text }]}>App Name</Text>
            <Text style={[styles.rowValue, { color: c.textSecondary }]}>{APP_NAME}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <View style={styles.row}>
            <Text style={[styles.rowTitle, { color: c.text }]}>Version</Text>
            <Text style={[styles.rowValue, { color: c.textSecondary }]}>1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  body: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  rowLeft: {
    flex: 1,
    marginRight: SPACING.md,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  rowValue: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginHorizontal: SPACING.md,
  },
});

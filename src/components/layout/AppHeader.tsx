// ─── App Header ──────────────────────────────────────────────────────────────

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { SPACING, APP_NAME } from '../../types/constants';

interface Props {
  title?: string;
}

export function AppHeader({ title = APP_NAME }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={[styles.header, { backgroundColor: c.headerBackground, borderBottomColor: c.border }]}>
      <Text style={[styles.title, { color: c.headerText }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});


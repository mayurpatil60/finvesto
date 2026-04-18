// ─── CollapsibleCard ─────────────────────────────────────────────────────────
// A panel with a toggle header that shows/hides its children.

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { SPACING } from '../../types/constants';

interface Props {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}

export function CollapsibleCard({ title, children, defaultCollapsed = false }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setCollapsed(v => !v)}
        activeOpacity={0.7}
      >
        <Text style={[styles.title, { color: c.text }]}>{title}</Text>
        <Ionicons
          name={collapsed ? 'chevron-down-outline' : 'chevron-up-outline'}
          size={16}
          color={c.textSecondary}
        />
      </TouchableOpacity>
      {!collapsed && (
        <View style={styles.body}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  title: {
    fontSize: 14,
    fontWeight: '400',
  },
  body: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
});

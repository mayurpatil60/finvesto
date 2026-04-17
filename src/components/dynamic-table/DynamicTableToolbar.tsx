// ─── DynamicTableToolbar ──────────────────────────────────────────────────────
// Search, filter toggle, column picker, refresh, export, result count.

import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { SPACING } from '../../types/constants';

interface Props {
  globalFilter: string;
  onGlobalFilterChange: (v: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  onRefresh?: () => void;
  onColumns: () => void;
  onExport: () => void;
  resultCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  loading: boolean;
}

export function DynamicTableToolbar({
  globalFilter,
  onGlobalFilterChange,
  showFilters,
  onToggleFilters,
  onRefresh,
  onColumns,
  onExport,
  resultCount,
  totalCount,
  hasActiveFilters,
  loading,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={[styles.wrapper, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
      {/* Row 1: Search + action icons */}
      <View style={styles.row}>
        {/* Search input */}
        <View style={[styles.searchBox, { borderColor: c.border, backgroundColor: c.background }]}>
          <Text style={[styles.icon, { color: c.textSecondary }]}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: c.text }]}
            placeholderTextColor={c.textSecondary}
            placeholder="Global search…"
            value={globalFilter}
            onChangeText={onGlobalFilterChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {globalFilter.length > 0 && (
            <TouchableOpacity onPress={() => onGlobalFilterChange('')}>
              <Text style={[styles.clearBtn, { color: c.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {/* Filter row toggle */}
          <ToolbarBtn
            label="≡"
            active={showFilters}
            onPress={onToggleFilters}
            dotColor={hasActiveFilters ? '#f59e0b' : undefined}
          />
          {/* Column picker */}
          <ToolbarBtn label="⊞" onPress={onColumns} />
          {/* Refresh */}
          {onRefresh && (
            loading
              ? <ActivityIndicator size="small" color={c.primary} style={styles.btnPlaceholder} />
              : <ToolbarBtn label="↺" onPress={onRefresh} />
          )}
          {/* Export */}
          <ToolbarBtn label="↑" onPress={onExport} />
        </View>
      </View>

      {/* Row 2: Result count */}
      <Text style={[styles.countText, { color: c.textSecondary }]}>
        {resultCount === totalCount
          ? `${totalCount} rows`
          : `${resultCount} / ${totalCount} rows`}
      </Text>
    </View>
  );
}

function ToolbarBtn({
  label,
  active,
  onPress,
  dotColor,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  dotColor?: string;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: active ? c.primary : c.background, borderColor: c.border }]}
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Text style={[styles.btnLabel, { color: active ? '#fff' : c.text }]}>{label}</Text>
      {dotColor && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    gap: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    height: 36,
  },
  icon: { fontSize: 13, marginRight: 4 },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },
  clearBtn: { paddingHorizontal: 4, fontSize: 12 },
  actions: {
    flexDirection: 'row',
    gap: SPACING.xs,
    alignItems: 'center',
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLabel: { fontSize: 14, fontWeight: '700' },
  dot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  btnPlaceholder: { width: 32, height: 32 },
  countText: { fontSize: 11, marginLeft: 2 },
});

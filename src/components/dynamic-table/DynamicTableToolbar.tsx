// ─── DynamicTableToolbar ──────────────────────────────────────────────────────
// Search, filter toggle, column picker, refresh, export.

import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  hasActiveFilters: boolean;
  loading: boolean;
  viewMode: 'table' | 'card';
  onToggleViewMode: () => void;
  onToggleFullscreen: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function DynamicTableToolbar({
  globalFilter,
  onGlobalFilterChange,
  showFilters,
  onToggleFilters,
  onRefresh,
  onColumns,
  onExport,
  hasActiveFilters,
  loading,
  viewMode,
  onToggleViewMode,
  onToggleFullscreen,
  collapsed,
  onToggleCollapsed,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={[styles.wrapper, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
      <View style={styles.row}>
        {/* Search input */}
        <View style={[styles.searchBox, { borderColor: c.border, backgroundColor: c.background }]}>
          <Ionicons name="search-outline" size={14} color={c.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: c.text }]}
            placeholderTextColor={c.textSecondary}
            placeholder="Search…"
            value={globalFilter}
            onChangeText={onGlobalFilterChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {globalFilter.length > 0 && (
            <TouchableOpacity onPress={() => onGlobalFilterChange('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="close-outline" size={14} color={c.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <IconBtn
            name={showFilters ? 'funnel' : 'funnel-outline'}
            active={showFilters}
            onPress={onToggleFilters}
            badge={hasActiveFilters}
          />
          <IconBtn name="grid-outline" onPress={onColumns} />
          <IconBtn
            name={viewMode === 'table' ? 'list-outline' : 'grid-outline'}
            onPress={onToggleViewMode}
          />
          <IconBtn name="expand-outline" onPress={onToggleFullscreen} />
          {onRefresh && (
            loading
              ? <ActivityIndicator size="small" color={c.primary} style={styles.btnPlaceholder} />
              : <IconBtn name="refresh-outline" onPress={onRefresh} />
          )}
          <IconBtn name="share-outline" onPress={onExport} />
          <IconBtn
            name={collapsed ? 'chevron-down-outline' : 'chevron-up-outline'}
            onPress={onToggleCollapsed}
          />
        </View>
      </View>
    </View>
  );
}

function IconBtn({
  name,
  active,
  onPress,
  badge,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  active?: boolean;
  onPress: () => void;
  badge?: boolean;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: active ? c.primary : c.background, borderColor: c.border }]}
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Ionicons name={name} size={15} color={active ? '#fff' : c.text} />
      {badge && <View style={[styles.dot, { backgroundColor: '#f59e0b' }]} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    height: 32,
  },
  searchIcon: { marginRight: 4 },
  searchInput: { flex: 1, fontSize: 12, paddingVertical: 0 },
  actions: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  btn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  btnPlaceholder: { width: 28, height: 28 },
});

// ─── SearchSortBar ────────────────────────────────────────────────────────────
// Reusable search input + sort pill row for Markets screens.

import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { SPACING } from '../../types/constants';

export interface SortOption<T extends string = string> {
  key: T;
  label: string;
}

interface Props<T extends string = string> {
  searchValue: string;
  onSearchChange: (v: string) => void;
  sortOptions: SortOption<T>[];
  sortKey: T | null;
  sortAsc: boolean;
  onSortChange: (key: T) => void;
  resultCount?: number;
  placeholder?: string;
}

export function SearchSortBar<T extends string>({
  searchValue,
  onSearchChange,
  sortOptions,
  sortKey,
  sortAsc,
  onSortChange,
  resultCount,
  placeholder = 'Search…',
}: Props<T>) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.wrapper}>
      {/* Search row */}
      <View style={[styles.searchRow, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.searchIcon, { color: c.textSecondary }]}>🔍</Text>
        <TextInput
          style={[styles.input, { color: c.text }]}
          placeholderTextColor={c.textSecondary}
          placeholder={placeholder}
          value={searchValue}
          onChangeText={onSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchValue.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Text style={[styles.clearBtn, { color: c.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        )}
        {resultCount !== undefined && (
          <Text style={[styles.count, { color: c.textSecondary }]}>{resultCount}</Text>
        )}
      </View>

      {/* Sort pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortRow} contentContainerStyle={styles.sortContent}>
        {sortOptions.map(opt => {
          const active = sortKey === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.pill,
                {
                  backgroundColor: active ? c.primary : c.surface,
                  borderColor: active ? c.primary : c.border,
                },
              ]}
              onPress={() => onSortChange(opt.key)}
            >
              <Text style={[styles.pillText, { color: active ? '#fff' : c.text }]}>
                {opt.label}{active ? (sortAsc ? ' ↑' : ' ↓') : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: SPACING.md, gap: SPACING.xs },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    height: 38,
  },
  searchIcon: { fontSize: 13, marginRight: SPACING.xs },
  input: { flex: 1, fontSize: 13, paddingVertical: 0 },
  clearBtn: { fontSize: 12, paddingHorizontal: SPACING.xs },
  count: { fontSize: 11, paddingLeft: SPACING.xs },
  sortRow: { marginTop: 4 },
  sortContent: { gap: SPACING.xs },
  pill: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  pillText: { fontSize: 11, fontWeight: '600' },
});

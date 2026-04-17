// ─── DynamicTableHeader ───────────────────────────────────────────────────────
// Column header row (with sort indicators + copy buttons) + filter input row.

import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { SPACING } from '../../types/constants';
import { ColumnFilters, DynamicColumn, SortState } from './types';

const DEFAULT_COL_WIDTH = 120;

interface Props {
  columns: DynamicColumn[];
  sorts: SortState[];
  colFilters: ColumnFilters;
  showFilters: boolean;
  onSort: (field: string) => void;
  onColFilter: (field: string, value: string) => void;
  onCopyColumn: (field: string) => void;
}

export function DynamicTableHeader({
  columns,
  sorts,
  colFilters,
  showFilters,
  onSort,
  onColFilter,
  onCopyColumn,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View>
      {/* Header row */}
      <View style={[styles.headerRow, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        {columns.map(col => {
          const sortState = sorts.find(s => s.field === col.field);
          const isSorted = !!sortState;

          return (
            <TouchableOpacity
              key={col.field}
              style={[styles.headerCell, { width: col.width ?? DEFAULT_COL_WIDTH, borderRightColor: c.border }]}
              onPress={() => col.sortable !== false && onSort(col.field)}
              activeOpacity={col.sortable !== false ? 0.7 : 1}
            >
              <View style={styles.headerContent}>
                <Text
                  style={[styles.headerText, { color: isSorted ? c.primary : c.text }]}
                  numberOfLines={1}
                >
                  {col.header}
                </Text>
                {/* Multi-sort indicator */}
                {isSorted && (
                  <View style={styles.sortBadge}>
                    {sorts.length > 1 && (
                      <Text style={[styles.sortPriority, { color: c.primary }]}>{sortState.priority}</Text>
                    )}
                    <Text style={[styles.sortArrow, { color: c.primary }]}>
                      {sortState.dir === 'asc' ? '↑' : '↓'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Copy button */}
              {col.copyEnabled && (
                <TouchableOpacity
                  style={[styles.copyBtn, { borderColor: c.border }]}
                  onPress={(e) => { e.stopPropagation?.(); onCopyColumn(col.field); }}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <Text style={[styles.copyIcon, { color: c.textSecondary }]}>⎘</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Filter row */}
      {showFilters && (
        <View style={[styles.filterRow, { backgroundColor: c.background, borderBottomColor: c.border }]}>
          {columns.map(col => (
            <View
              key={col.field}
              style={[styles.filterCell, { width: col.width ?? DEFAULT_COL_WIDTH, borderRightColor: c.border }]}
            >
              {col.filterable !== false ? (
                <TextInput
                  style={[styles.filterInput, { color: c.text, borderColor: c.border, backgroundColor: c.surface }]}
                  placeholderTextColor={c.textSecondary}
                  placeholder={col.type === 'number' ? '>,<,= num' : col.header}
                  value={colFilters[col.field] ?? ''}
                  onChangeText={v => onColFilter(col.field, v)}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              ) : (
                <View style={styles.filterInputSpacer} />
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  headerCell: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 3,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  sortBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  sortPriority: {
    fontSize: 9,
    fontWeight: '800',
  },
  sortArrow: {
    fontSize: 11,
    fontWeight: '700',
  },
  copyBtn: {
    marginLeft: 4,
    paddingHorizontal: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 4,
  },
  copyIcon: { fontSize: 11 },
  filterRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  filterCell: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  filterInput: {
    height: 28,
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: SPACING.xs,
    fontSize: 11,
  },
  filterInputSpacer: {
    height: 28,
  },
});

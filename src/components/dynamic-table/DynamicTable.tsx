// ─── DynamicTable ─────────────────────────────────────────────────────────────
// Full-featured data table for React Native with:
//  • Dynamic schema auto-generation from data keys
//  • Column visibility toggle + reordering (via ColumnSheet)
//  • Global search + per-column filters (text / number comparison)
//  • Multi-sort with priority badges
//  • Pagination with configurable page-size
//  • Pull-to-refresh + toolbar Refresh button
//  • Lazy / virtual rendering via FlatList
//  • Copy column values (with optional NSE: prefix) to clipboard
//  • CSV export via Share sheet
//  • Color-coded cells via colorFn
//  • Striped rows, border lines, responsive controls

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../theme/ThemeProvider';
import { SPACING } from '../../types/constants';
import {
  ColumnFilters,
  DynamicColumn,
  DynamicTableProps,
  SortState,
} from './types';
import { DynamicTableToolbar } from './DynamicTableToolbar';
import { DynamicTableHeader } from './DynamicTableHeader';
import { DynamicTablePaginator } from './DynamicTablePaginator';
import { DynamicTableColumnSheet } from './DynamicTableColumnSheet';

// ── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_COL_WIDTH = 120;
const DEFAULT_PAGE_SIZE = 5;
const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20];
const ROW_HEIGHT = 34;

// ── Schema auto-generation ────────────────────────────────────────────────────
/** Field names ending with these suffixes are percentage columns.
 * Also matches a trailing capital P (e.g. day_changeP, underline_day_changeP). */
const PCT_SUFFIX_RE = /(_per|_percentage|%|P)$/;

function generateSchema(data: any[]): DynamicColumn[] {
  if (!data.length) return [];
  return Object.keys(data[0]).map(key => ({
    field: key,
    header: key.replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase()),
    width: DEFAULT_COL_WIDTH,
    type: 'text' as const,
    visible: true,
    sortable: true,
    filterable: true,
    copyEnabled: false,
    isPercentage: PCT_SUFFIX_RE.test(key),
  }));
}

// ── Cell formatting helpers ──────────────────────────────────────────────────
type CellInfo = { display: string; numVal: number; isPercent: boolean };

/**
 * Parse a cell value into structured info for formatting.
 * @param val        Raw cell value
 * @param isPercentCol  Whether the column is marked as a percentage column
 */
function parseCellValue(val: any, isPercentCol = false): CellInfo | null {
  if (val === null || val === undefined || val === '') return null;
  const str = String(val).trim();
  // Explicit % suffix: always treat as percent regardless of column
  const pctMatch = str.match(/^([+-]?\d+(?:\.\d+)?)%$/);
  if (pctMatch) {
    const num = parseFloat(pctMatch[1]);
    const display = (num % 1 !== 0 ? num.toFixed(1) : String(Math.trunc(num))) + '%';
    return { display, numVal: num, isPercent: true };
  }
  // Pure number / float (JS number type or string that is entirely numeric)
  if (typeof val === 'number' || /^[+-]?\d+(?:\.\d+)?$/.test(str)) {
    const num = typeof val === 'number' ? val : parseFloat(str);
    if (!isNaN(num)) {
      const display = num % 1 !== 0 ? num.toFixed(1) : String(Math.trunc(num));
      // If the column is flagged as percentage, treat this numeric value as percent
      return { display, numVal: num, isPercent: isPercentCol };
    }
  }
  return null;
}

// ── Main component ─────────────────────────────────────────────────────────────
export function DynamicTable({
  data,
  schema: schemaProp,
  onRefresh,
  loading = false,
  pageSize: pageSizeProp = DEFAULT_PAGE_SIZE,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  title,
  emptyText = 'No data',
}: DynamicTableProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { width: deviceWidth } = useWindowDimensions();
  // Table area = device width minus left+right margins
  const H_MARGIN = SPACING.md;
  const availableWidth = deviceWidth - H_MARGIN * 2;

  // ── Schema ──────────────────────────────────────────────────────────────────
  const baseSchema = useMemo(
    () => schemaProp ?? generateSchema(data),
    // Re-generate only when schemaProp reference changes or data[0] keys change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schemaProp, data.length > 0 ? Object.keys(data[0]).join(',') : ''],
  );

  // colDefs: user mutations (visibility, order) on top of baseSchema
  const [colDefs, setColDefs] = useState<DynamicColumn[]>([]);
  const prevBaseRef = useRef<DynamicColumn[] | null>(null);
  if (prevBaseRef.current !== baseSchema) {
    prevBaseRef.current = baseSchema;
    setColDefs(
      baseSchema.map(col => ({
        visible: true,
        sortable: true,
        filterable: true,
        width: DEFAULT_COL_WIDTH,
        type: 'text' as const,
        ...col,
      })),
    );
  }

  const visibleCols = useMemo(() => colDefs.filter(col => col.visible !== false), [colDefs]);

  // ── Sorting ──────────────────────────────────────────────────────────────────
  const [sorts, setSorts] = useState<SortState[]>([]);

  function handleSort(field: string) {
    setSorts(prev => {
      const existing = prev.find(s => s.field === field);
      if (!existing) {
        return [...prev, { field, dir: 'asc', priority: prev.length + 1 }];
      } else if (existing.dir === 'asc') {
        return prev.map(s => (s.field === field ? { ...s, dir: 'desc' } : s));
      } else {
        // Remove this sort and re-number priorities
        return prev.filter(s => s.field !== field).map((s, i) => ({ ...s, priority: i + 1 }));
      }
    });
    setPage(0);
  }

  // ── Filters ──────────────────────────────────────────────────────────────────
  const [globalFilter, setGlobalFilter] = useState('');
  const [colFilters, setColFilters] = useState<ColumnFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  function setColFilter(field: string, value: string) {
    setColFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  }

  const hasActiveFilters =
    !!globalFilter.trim() || Object.values(colFilters).some(v => v.trim());

  // ── Pagination ───────────────────────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(pageSizeProp);

  // ── Column sheet ─────────────────────────────────────────────────────────────
  const [showColSheet, setShowColSheet] = useState(false);

  // ── View mode ─────────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [fullscreen, setFullscreen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // ── Refresh ───────────────────────────────────────────────────────────────────
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try { await onRefresh(); } catch { /* swallow */ }
    setRefreshing(false);
  }, [onRefresh]);

  // ── Filtered + sorted rows ────────────────────────────────────────────────────
  const filteredSorted = useMemo(() => {
    let arr = data;

    // Global filter
    if (globalFilter.trim()) {
      const q = globalFilter.toLowerCase();
      arr = arr.filter(row =>
        visibleCols.some(col => String(row[col.field] ?? '').toLowerCase().includes(q)),
      );
    }

    // Per-column filters
    const activeColFilters = Object.entries(colFilters).filter(([, v]) => v.trim());
    if (activeColFilters.length) {
      arr = arr.filter(row =>
        activeColFilters.every(([field, rawVal]) => {
          const col = colDefs.find(c => c.field === field);
          const cellStr = String(row[field] ?? '').toLowerCase();
          const v = rawVal.trim();

          if (col?.type === 'number') {
            const cellNum = parseFloat(cellStr);
            if (isNaN(cellNum)) return false;
            if (v.startsWith('>=')) return cellNum >= parseFloat(v.slice(2));
            if (v.startsWith('<=')) return cellNum <= parseFloat(v.slice(2));
            if (v.startsWith('>'))  return cellNum > parseFloat(v.slice(1));
            if (v.startsWith('<'))  return cellNum < parseFloat(v.slice(1));
            if (v.startsWith('='))  return cellNum === parseFloat(v.slice(1));
          }

          return cellStr.includes(v.toLowerCase());
        }),
      );
    }

    // Multi-sort — use col.type to choose numeric vs string comparison
    if (sorts.length > 0) {
      arr = [...arr].sort((a, b) => {
        for (const s of sorts) {
          const col = colDefs.find(cd => cd.field === s.field);
          const av = a[s.field];
          const bv = b[s.field];
          let cmp = 0;
          if (col?.type === 'number') {
            const an = parseFloat(String(av ?? ''));
            const bn = parseFloat(String(bv ?? ''));
            const aNaN = isNaN(an);
            const bNaN = isNaN(bn);
            if (aNaN && bNaN) cmp = 0;
            else if (aNaN) cmp = 1;   // nulls always sink to bottom
            else if (bNaN) cmp = -1;
            else cmp = an - bn;
          } else {
            const as = String(av ?? '');
            const bs = String(bv ?? '');
            cmp = as.localeCompare(bs, undefined, { numeric: true, sensitivity: 'base' });
          }
          if (cmp !== 0) return s.dir === 'asc' ? cmp : -cmp;
        }
        return 0;
      });
    }

    return arr;
  }, [data, globalFilter, colFilters, sorts, visibleCols, colDefs]);

  const totalRows = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(page, totalPages - 1);

  const pageRows = useMemo(
    () => filteredSorted.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [filteredSorted, safePage, pageSize],
  );

  // ── Copy column ───────────────────────────────────────────────────────────────
  function cleanValue(value: string): string {
    const parts = value.split(' ');
    if (parts.length >= 4) parts.splice(3, 1);
    return parts.join(' ');
  }

  async function copyColumn(field: string) {
    const col = colDefs.find(c => c.field === field);
    const prefix = col?.copyPrefix ?? 'NSE:';
    const vals = filteredSorted
      .map(row => row[field])
      .filter(Boolean)
      .map(v => prefix + cleanValue(String(v).trim()))
      .join(', ');

    try {
      await Clipboard.setStringAsync(vals);
    } catch {
      await Share.share({ message: vals });
    }
  }

  // ── CSV export ────────────────────────────────────────────────────────────────
  async function exportCSV() {
    const headerRow = visibleCols.map(col => `"${col.header}"`).join(',');
    const bodyRows = filteredSorted.map(row =>
      visibleCols
        .map(col => `"${String(row[col.field] ?? '').replace(/"/g, '""')}"`)
        .join(','),
    );
    const csv = [headerRow, ...bodyRows].join('\n');
    await Share.share({ message: csv, title: title ?? 'DynamicTable Export' });
  }

  // ── Total table width ─────────────────────────────────────────────────────────
  // If columns fit within the available width, expand them proportionally so the
  // table fills the screen. Otherwise keep exact widths and allow horizontal scroll.
  const rawTotalWidth = visibleCols.reduce((sum, col) => sum + (col.width ?? DEFAULT_COL_WIDTH), 0);
  const expandedCols = useMemo(() => {
    if (rawTotalWidth >= availableWidth || visibleCols.length === 0) return visibleCols;
    const ratio = availableWidth / rawTotalWidth;
    return visibleCols.map(col => ({ ...col, width: Math.floor((col.width ?? DEFAULT_COL_WIDTH) * ratio) }));
  }, [visibleCols, rawTotalWidth, availableWidth]);
  const totalWidth = expandedCols.reduce((sum, col) => sum + (col.width ?? DEFAULT_COL_WIDTH), 0);

  // ── Render helpers ────────────────────────────────────────────────────────────
  function renderTableContent(isFullscreen = false) {
    if (viewMode === 'card') {
      return (
        <ScrollView style={{ flex: isFullscreen ? 1 : undefined }}>
          {pageRows.map((item, index) => (
            <View key={index} style={[styles.cardItem, { backgroundColor: index % 2 === 0 ? c.surface : c.background, borderColor: c.border }]}>
              {expandedCols.map(col => {
                const val = item[col.field];
                const cell = parseCellValue(val, col.isPercentage);
                const display = cell ? cell.display : (val !== null && val !== undefined ? String(val) : '\u2014');
                let color = col.colorFn ? (col.colorFn(val, item) ?? c.text) : c.text;
                if (!col.colorFn && cell?.isPercent) {
                  color = cell.numVal > 0 ? '#22c55e' : cell.numVal < 0 ? '#ef4444' : c.text;
                }
                const textAlign = cell ? ('right' as const) : ('left' as const);
                return (
                  <View key={col.field} style={styles.cardRow}>
                    <Text style={[styles.cardLabel, { color: c.textSecondary }]}>{col.header}</Text>
                    <View style={[styles.cardValueRow, (cell || col.type === 'number') ? { justifyContent: 'flex-end' } : {}]}>
                      <Text style={[styles.cardValue, { color, textAlign }]}>{display}</Text>
                      {col.copyEnabled && (
                        <TouchableOpacity
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          onPress={async () => {
                            const text = (col.copyPrefix ?? '') + display;
                            try { await Clipboard.setStringAsync(text); }
                            catch { await Share.share({ message: text }); }
                          }}
                        >
                          <Text style={{ color: c.textSecondary, fontSize: 11, paddingLeft: 4 }}>⎘</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
          {loading && <ActivityIndicator color={c.primary} style={{ padding: SPACING.md }} />}
        </ScrollView>
      );
    }

    return (
      <>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          style={styles.hScroll}
          contentContainerStyle={{ minWidth: totalWidth }}
        >
          <View style={{ width: Math.max(totalWidth, 1) }}>
            <DynamicTableHeader
              columns={expandedCols}
              sorts={sorts}
              colFilters={colFilters}
              showFilters={showFilters}
              onSort={handleSort}
              onColFilter={setColFilter}
              onCopyColumn={copyColumn}
            />
            <FlatList
              data={pageRows}
              keyExtractor={(_, i) => String(i)}
              scrollEnabled={false}
              removeClippedSubviews
              maxToRenderPerBatch={20}
              windowSize={5}
              refreshControl={
                onRefresh ? (
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={c.primary}
                  />
                ) : undefined
              }
              ListEmptyComponent={
                !loading ? (
                  <View style={[styles.emptyRow, { width: totalWidth }]}>
                    <Text style={[styles.emptyText, { color: c.textSecondary }]}>{emptyText}</Text>
                  </View>
                ) : null
              }
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.row,
                    {
                      backgroundColor: index % 2 === 0 ? c.surface : c.background,
                      borderBottomColor: c.border,
                    },
                  ]}
                >
                  {expandedCols.map(col => {
                    const val = item[col.field];
                    const cell = parseCellValue(val, col.isPercentage);
                    const display = cell ? cell.display : (val !== null && val !== undefined ? String(val) : '\u2014');
                    let color = col.colorFn ? (col.colorFn(val, item) ?? c.text) : c.text;
                    if (!col.colorFn && cell?.isPercent) {
                      color = cell.numVal > 0 ? '#22c55e' : cell.numVal < 0 ? '#ef4444' : c.text;
                    }
                    const isNumeric = (cell || col.type === 'number');
                    const textAlign = isNumeric ? ('right' as const) : ('left' as const);
                    return (
                      <View key={col.field} style={[styles.cell, { width: col.width ?? DEFAULT_COL_WIDTH }, isNumeric && !col.copyEnabled ? { justifyContent: 'flex-end' } : {}]}>
                        <Text style={[styles.cellText, { color, flex: 1, textAlign }]} numberOfLines={2}>
                          {display}
                        </Text>
                        {col.copyEnabled && (
                          <TouchableOpacity
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            onPress={async () => {
                              const text = (col.copyPrefix ?? '') + display;
                              try { await Clipboard.setStringAsync(text); }
                              catch { await Share.share({ message: text }); }
                            }}
                          >
                            <Text style={{ color: c.textSecondary, fontSize: 11, paddingLeft: 3 }}>⎘</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            />
            {loading && (
              <View style={[styles.loadingRow, { width: totalWidth }]}>
                <ActivityIndicator color={c.primary} />
              </View>
            )}
          </View>
        </ScrollView>
        {loading && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={c.primary} />
          </View>
        )}
      </>
    );
  }
  if (!loading && data.length === 0) {
    return (
      <View style={[styles.emptyState, { backgroundColor: 'transparent' }]}>
        <Text style={[styles.emptyStateText, { color: c.textSecondary }]}>{emptyText}</Text>
      </View>
    );
  }

  return (<>
    <View style={[styles.panel, { backgroundColor: c.surface, borderColor: c.border }]}>
      <DynamicTableToolbar
        globalFilter={globalFilter}
        onGlobalFilterChange={v => { setGlobalFilter(v); setPage(0); }}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(f => !f)}
        onRefresh={onRefresh ? handleRefresh : undefined}
        onColumns={() => setShowColSheet(true)}
        onExport={exportCSV}
        hasActiveFilters={hasActiveFilters}
        loading={loading}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(m => m === 'table' ? 'card' : 'table')}
        onToggleFullscreen={() => setFullscreen(true)}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed(v => !v)}
      />

      {!collapsed && (
        <>
      {renderTableContent()}

      <DynamicTablePaginator
        page={safePage}
        totalPages={totalPages}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        totalRows={totalRows}
        onPageChange={setPage}
        onPageSizeChange={size => { setPageSize(size); setPage(0); }}
      />

      <DynamicTableColumnSheet
        visible={showColSheet}
        columns={colDefs}
        onClose={() => setShowColSheet(false)}
        onChange={setColDefs}
      />
        </>
      )}
    </View>

    {fullscreen && (
      <Modal visible animationType="slide" onRequestClose={() => setFullscreen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
          <View style={[styles.panel, { flex: 1, marginHorizontal: 0, marginBottom: 0, borderRadius: 0, borderWidth: 0 }]}>
            <DynamicTableToolbar
              globalFilter={globalFilter}
              onGlobalFilterChange={v => { setGlobalFilter(v); setPage(0); }}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(f => !f)}
              onRefresh={onRefresh ? handleRefresh : undefined}
              onColumns={() => setShowColSheet(true)}
              onExport={exportCSV}
              hasActiveFilters={hasActiveFilters}
              loading={loading}
              viewMode={viewMode}
              onToggleViewMode={() => setViewMode(m => m === 'table' ? 'card' : 'table')}
              onToggleFullscreen={() => setFullscreen(false)}
              collapsed={false}
              onToggleCollapsed={() => {}}
            />
            {renderTableContent(true)}
            <DynamicTablePaginator
              page={safePage}
              totalPages={totalPages}
              pageSize={pageSize}
              pageSizeOptions={pageSizeOptions}
              totalRows={totalRows}
              onPageChange={setPage}
              onPageSizeChange={size => { setPageSize(size); setPage(0); }}
            />
            <DynamicTableColumnSheet
              visible={showColSheet}
              columns={colDefs}
              onClose={() => setShowColSheet(false)}
              onChange={setColDefs}
            />
          </View>
        </SafeAreaView>
      </Modal>
    )}
  </>);
}

const styles = StyleSheet.create({
  panel: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  hScroll: { marginHorizontal: 0 },
  row: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 7,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(0,0,0,0.08)',
  },
  cellText: { fontSize: 12, lineHeight: 16 },
  emptyRow: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: { fontSize: 13 },
  loadingRow: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  cardItem: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: 10,
    borderWidth: 1,
    padding: SPACING.sm,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  cardLabel: { fontSize: 11, flex: 1 },
  cardValueRow: { flexDirection: 'row', alignItems: 'center', flex: 1.5, justifyContent: 'flex-end' },
  cardValue: { fontSize: 12, textAlign: 'right' },
});

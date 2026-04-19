// ─── Option Analysis Component ────────────────────────────────────────────────
// Port of Angular option-analysis (simplified):
//  • Loads current + prev batch only (2 batches)
//  • pickByIndex: group by ticker+option_type, sort by |strike_price - underline_ltp|, pick at index
//  • addBuyTags: current_price > prev.current_price → tag = 'Buy'
//  • amount = current_price * lot_size
//  • Multi-select tag filters + amount/volume filters
//  • Index visible only after data is loaded

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../components/theme/ThemeProvider';
import { SPACING } from '../../../types/constants';
import { DynamicTable } from '../../../components/dynamic-table/DynamicTable';
import { DynamicColumn } from '../../../components/dynamic-table/types';
import { SelectInput } from '../../../components/common/SelectInput';
import { CollapsibleCard } from '../../../components/common/CollapsibleCard';
import { FilterSheet } from '../../../components/common/FilterSheet';
import { analysisService } from '../services/analysis.service';

// ─── Filter definitions ───────────────────────────────────────────────────────
const FILTER_GROUPS = [
  { label: 'Tag', options: [
    { label: 'Buy', value: 'Buy' },
  ]},
  { label: 'Volume', options: [
    { label: 'Vol in Lakh (1-10k)', value: 'VolInLakh' },
    { label: 'Vol in Lakhs (>10k)', value: 'VolInLakhs' },
  ]},
  { label: 'Amount', options: [
    { label: 'Amt ≤ 1k', value: 'Amt1k' },
    { label: 'Amt ≤ 2k', value: 'Amt2k' },
    { label: 'Amt ≤ 5k', value: 'Amt5k' },
  ]},
];

const INDEX_OPTIONS = [
  { label: '0', value: '0' },
  { label: '1', value: '1' },
];

// ─── Schema (matches Angular mapAnalysisKeys) ─────────────────────────────────
function pctColor(val: any): string | undefined {
  const n = parseFloat(String(val ?? ''));
  if (isNaN(n)) return undefined;
  return n >= 0 ? '#16a34a' : '#dc2626';
}

const SCHEMA: DynamicColumn[] = [
  { field: 'ticker',           header: 'Ticker',   width: 80,  type: 'text',   sortable: true, filterable: true, copyEnabled: true, copyPrefix: 'NSE:' },
  { field: 'underline_ltp',    header: 'LTP',      width: 80,  type: 'number', sortable: true },
  { field: 'change_per_month', header: 'Month %',  width: 80,  type: 'number', sortable: true, colorFn: pctColor },
  { field: 'rsi',              header: 'RSI',      width: 60,  type: 'number', sortable: true },
  { field: 'volume',           header: 'Volume',   width: 80,  type: 'number', sortable: true },
  { field: 'expiry',           header: 'Expiry',   width: 100, type: 'text',   sortable: true },
  { field: 'mappDisplayName',  header: 'Name',     width: 160, type: 'text',   sortable: true, filterable: true, copyEnabled: true, copyPrefix: '' },
  { field: 'current_price',    header: 'Price',    width: 80,  type: 'number', sortable: true },
  { field: 'day_changeP',      header: 'Day %',    width: 70,  type: 'number', sortable: true, colorFn: pctColor },
  { field: 'amount',           header: 'Amount',   width: 80,  type: 'number', sortable: true },
  { field: 'tag',              header: 'Tag',      width: 80,  type: 'text',   sortable: true, filterable: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseBatchDateTime(batchId: string): Date {
  if (!batchId || !batchId.includes('_')) return new Date(0);
  const [datePart, timePartRaw] = batchId.split('_');
  if (!timePartRaw) return new Date(0);
  const timePart = timePartRaw.trim().toUpperCase();
  const match = timePart.match(/^(\d{1,2}):(\d{2})(AM|PM)$/);
  if (!match) return new Date(0);
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (match[3] === 'PM' && hours !== 12) hours += 12;
  if (match[3] === 'AM' && hours === 12) hours = 0;
  return new Date(`${datePart}T${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:00`);
}

function enrichAmount(items: any[]): any[] {
  return items.map(o => ({
    ...o,
    amount: Math.round((parseFloat(o.current_price) || 0) * (o.lot_size || 0)),
  }));
}

/** Group by ticker+option_type, sort by |strike_price - underline_ltp|, pick at index */
function pickByIndex(data: any[], index: number): any[] {
  const grouped = new Map<string, any[]>();
  for (const item of data) {
    const key = `${item.ticker}_${item.option_type}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  }
  const result: any[] = [];
  for (const items of grouped.values()) {
    const ltp = items[0]?.underline_ltp ?? 0;
    const sorted = [...items].sort(
      (a, b) => Math.abs((a.strike_price ?? 0) - ltp) - Math.abs((b.strike_price ?? 0) - ltp),
    );
    if (sorted[index] !== undefined) result.push(sorted[index]);
  }
  return result;
}

/** tag = 'Buy' if current_price > prev batch current_price (matched by mappDisplayName) */
function addBuyTags(current: any[], previous: any[]): any[] {
  if (!previous.length) return current.map(c => ({ ...c, tag: '' }));
  const prevMap = new Map<string, any>();
  for (const o of previous) prevMap.set(o.mappDisplayName, o);
  return current.map(item => {
    const prev = prevMap.get(item.mappDisplayName);
    if (!prev || item.current_price === undefined || prev.current_price === undefined) {
      return { ...item, tag: '' };
    }
    return { ...item, tag: item.current_price > prev.current_price ? 'Buy' : '' };
  });
}

function applyFilters(data: any[], filters: string[]): any[] {
  let result = [...data];
  if (filters.includes('Buy'))        result = result.filter(o => o.tag === 'Buy');
  if (filters.includes('VolInLakh'))  result = result.filter(o => (o.volume ?? 0) > 1 && (o.volume ?? 0) <= 10000);
  if (filters.includes('VolInLakhs')) result = result.filter(o => (o.volume ?? 0) > 10000);
  if (filters.includes('Amt1k'))      result = result.filter(o => (o.amount ?? 0) > 1 && (o.amount ?? 0) <= 1000);
  if (filters.includes('Amt2k'))      result = result.filter(o => (o.amount ?? 0) > 1 && (o.amount ?? 0) <= 2000);
  if (filters.includes('Amt5k'))      result = result.filter(o => (o.amount ?? 0) > 1 && (o.amount ?? 0) <= 5000);
  return result;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function OptionAnalysis() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [batches, setBatches] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState('0');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState<any[]>([]);
  const [previousData, setPreviousData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBatch().finally(() => setRefreshing(false));
  }, [selectedBatch, selectedIndex]);

  useEffect(() => { loadBatches(); }, []);

  async function loadBatches() {
    try {
      const res = await analysisService.getBatchIds();
      const ids: string[] = res.data ?? [];
      setBatches(ids);
      if (ids.length) setSelectedBatch(ids[0]);
    } catch (e: any) {
      Alert.alert('Error loading batches', e.message);
    }
  }

  async function loadBatch() {
    setLoading(true);
    setRawData([]);
    setPreviousData([]);
    try {
      const currentIdx = batches.indexOf(selectedBatch);
      const prevId = currentIdx + 1 < batches.length ? batches[currentIdx + 1] : null;

      const [curRes, prevRes] = await Promise.all([
        analysisService.getBatch(selectedBatch),
        prevId ? analysisService.getBatch(prevId) : Promise.resolve({ data: [] }),
      ]);

      const idx = parseInt(selectedIndex, 10);

      const current  = enrichAmount(pickByIndex(curRes.data ?? [], idx));
      const previous = enrichAmount(pickByIndex(prevRes.data ?? [], idx));

      const tagged = addBuyTags(current, previous);
      setRawData(tagged);
      setPreviousData(previous);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  /** Re-run index selection on already-loaded raw batch data without re-fetching */
  function applyIndex(newIndex: string) {
    setSelectedIndex(newIndex);
    if (!rawData.length && !previousData.length) return;
    // rawData already had pickByIndex applied; need original batch data to re-index
    // Since we don't cache raw batches, just reload
    loadBatch();
  }

  const filtered = useMemo(() => applyFilters(rawData, selectedFilters), [rawData, selectedFilters]);

  const batchOptions = batches.map(b => ({ label: b.replace('_', ' '), value: b }));
  const hasData = rawData.length > 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}>
      {/* ── Form card ─ */}
      <CollapsibleCard title="Option Analysis">
        <Text style={[styles.formNote, { color: c.textSecondary }]}>
          Loads current + previous batch. Index 0 = ATM (nearest to LTP), Index 1 = next strike. Select filters to narrow results.
        </Text>

        {/* Row 1: Batch */}
        <View style={styles.inputsRow}>
          <SelectInput
            label="Batch"
            options={batchOptions}
            value={selectedBatch}
            onChange={(v: string) => { setSelectedBatch(v); setRawData([]); setPreviousData([]); }}
            style={{ flex: 1, minWidth: 0 }}
          />
        </View>

        {/* Row 2: Load button */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: c.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={loadBatch}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.btnText}>Load ({filtered.length})</Text>
            }
          </TouchableOpacity>

          {/* Index — visible only after data loaded */}
          {hasData && (
            <SelectInput
              label=""
              options={INDEX_OPTIONS}
              value={selectedIndex}
              onChange={applyIndex}
              style={{ width: 110 }}
            />
          )}

          {hasData && (
            <TouchableOpacity
              style={[styles.btnIcon, { borderColor: c.border, backgroundColor: c.surface }]}
              onPress={() => { setRawData([]); setPreviousData([]); setSelectedFilters([]); }}
            >
              <Text style={{ color: c.text, fontSize: 15 }}>✕</Text>
            </TouchableOpacity>
          )}
          {hasData && (
            <TouchableOpacity
              style={[styles.btnIcon, { borderColor: selectedFilters.length > 0 ? c.primary : c.border, backgroundColor: selectedFilters.length > 0 ? c.primary + '22' : c.surface }]}
              onPress={() => setShowFilterSheet(true)}
            >
              <Ionicons name="options-outline" size={16} color={selectedFilters.length > 0 ? c.primary : c.text} />
              {selectedFilters.length > 0 && (
                <View style={[styles.filterBadge, { backgroundColor: c.primary }]}>
                  <Text style={styles.filterBadgeText}>{selectedFilters.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        <FilterSheet
          visible={showFilterSheet}
          onClose={() => setShowFilterSheet(false)}
          groups={FILTER_GROUPS}
          selected={selectedFilters}
          onApply={setSelectedFilters}
        />
      </CollapsibleCard>

      {/* ── Table */}
      <DynamicTable
        data={filtered}
        schema={SCHEMA}
        loading={loading}
        onRefresh={loadBatch}
        title="Option Analysis"
        emptyText="Select a batch and press Load."
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: SPACING.md, paddingBottom: SPACING.xl },
  formNote: { fontSize: 12, lineHeight: 18 },
  inputsRow: { flexDirection: 'row', gap: SPACING.sm },
  actionsRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' },
  btn: { borderRadius: 8, paddingHorizontal: SPACING.md, paddingVertical: 6, alignItems: 'center', justifyContent: 'center', minWidth: 60 },
  btnIcon: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  filterBadge: { position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  filterBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});


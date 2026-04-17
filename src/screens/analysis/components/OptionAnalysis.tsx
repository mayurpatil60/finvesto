// ─── Option Analysis Component ────────────────────────────────────────────────
// Full port of Angular option-analysis:
//  • Loads current + prev + prevToPrev batches in parallel
//  • getNearestCallPutOptions with index selector (0 = ATM, 1 = 1 away, etc.)
//  • pickLatestPerTicker deduplication
//  • BuyOp tag: prevToPrev > prev < current (v-shaped)
//  • RSI tags: Rsi40 / Rsi60 crossings
//  • amount = current_price * lot_size
//  • Multi-select tag filters + amount/volume filters
//  • DynamicTable with copy on name + ticker

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../components/theme/ThemeProvider';
import { SPACING } from '../../../types/constants';
import { DynamicTable } from '../../../components/dynamic-table/DynamicTable';
import { DynamicColumn } from '../../../components/dynamic-table/types';
import { SelectInput } from '../../../components/common/SelectInput';
import { analysisService } from '../services/analysis.service';

// ─── Filter definitions ───────────────────────────────────────────────────────
const FILTER_OPTIONS = [
  { label: 'BuyOp',      value: 'BuyOp' },
  { label: 'NearLow',    value: 'NearLow' },
  { label: 'VolInLakh',  value: 'VolInLakh' },
  { label: 'VolInLakhs', value: 'VolInLakhs' },
  { label: 'Amt1k',      value: 'Amt1k' },
  { label: 'Amt2k',      value: 'Amt2k' },
  { label: 'Amt5k',      value: 'Amt5k' },
  { label: 'Rsi40',      value: 'Rsi40' },
  { label: 'Rsi60',      value: 'Rsi60' },
];

const OPTIONS_COUNT = 2; // index choices: 0, 1
const INDEX_OPTIONS = Array.from({ length: OPTIONS_COUNT }, (_, i) => ({
  label: String(i),
  value: String(i),
}));

// ─── Schema ───────────────────────────────────────────────────────────────────
function pctColor(val: any): string | undefined {
  const n = parseFloat(String(val ?? ''));
  if (isNaN(n)) return undefined;
  return n >= 0 ? '#16a34a' : '#dc2626';
}

const SCHEMA: DynamicColumn[] = [
  { field: 'ticker',          header: 'Ticker',   width: 80,  type: 'text',   sortable: true, filterable: true, copyEnabled: true, copyPrefix: 'NSE:' },
  { field: 'mappDisplayName', header: 'Name',     width: 160, type: 'text',   sortable: true, filterable: true, copyEnabled: true, copyPrefix: '' },
  { field: 'current_price',   header: 'Price',    width: 80,  type: 'number', sortable: true },
  { field: 'day_changeP',     header: 'Day %',    width: 70,  type: 'number', sortable: true, colorFn: pctColor },
  { field: 'change_per_month',header: 'Month %',  width: 80,  type: 'number', sortable: true, colorFn: pctColor },
  { field: 'rsi',             header: 'RSI',      width: 60,  type: 'number', sortable: true },
  { field: 'volume',          header: 'Volume',   width: 80,  type: 'number', sortable: true },
  { field: 'amount',          header: 'Amount',   width: 80,  type: 'number', sortable: true },
  { field: 'expiry',          header: 'Expiry',   width: 100, type: 'text',   sortable: true },
  { field: 'tag',             header: 'Tag',      width: 120, type: 'text',   sortable: true, filterable: true },
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

function getNearestCallPutOptions(options: any[], index: number): any[] {
  if (index < 0) return [...options];

  const grouped: Record<string, any[]> = {};
  for (const o of options) {
    if (!grouped[o.ticker]) grouped[o.ticker] = [];
    grouped[o.ticker].push(o);
  }

  const result: any[] = [];
  for (const ticker in grouped) {
    const list = grouped[ticker];
    const latest = list.reduce((a: any, b: any) =>
      parseBatchDateTime(a.batch_id || '') > parseBatchDateTime(b.batch_id || '') ? a : b
    );
    const basePrice = latest.open_month ?? latest.current_price ?? 0;

    const calls = list.filter((o: any) => o.option_type === 'CE');
    const puts  = list.filter((o: any) => o.option_type === 'PE');

    const callStrikes = [...new Set(calls.map((c: any) => c.strike_price))].sort((a: any, b: any) => a - b);
    const putStrikes  = [...new Set(puts.map((p: any) => p.strike_price))].sort((a: any, b: any) => a - b);

    if (!callStrikes.length && !putStrikes.length) continue;

    const callAtm = callStrikes.length ? callStrikes.reduce((bestIdx: number, s: any, i: number) => {
      return Math.abs(s - basePrice) < Math.abs(callStrikes[bestIdx] - basePrice) ? i : bestIdx;
    }, 0) : -1;
    const putAtm = putStrikes.length ? putStrikes.reduce((bestIdx: number, s: any, i: number) => {
      return Math.abs(s - basePrice) < Math.abs(putStrikes[bestIdx] - basePrice) ? i : bestIdx;
    }, 0) : -1;

    const ce = calls.find((c: any) => c.strike_price === callStrikes[callAtm + index]);
    const pe = puts.find((p: any) => p.strike_price === putStrikes[putAtm - index]);

    if (ce) result.push(ce);
    if (pe) result.push(pe);
  }
  return result;
}

function pickLatestPerTicker(data: any[]): any[] {
  const map = new Map<string, any>();
  for (const o of data) {
    const key = `${o.ticker}_${o.option_type}_${o.strike_price}`;
    const existing = map.get(key);
    if (!existing || parseBatchDateTime(o.batch_id || '') > parseBatchDateTime(existing.batch_id || '')) {
      map.set(key, o);
    }
  }
  return Array.from(map.values());
}

function enrichAmount(items: any[]): any[] {
  return items.map(o => ({ ...o, amount: Math.round((parseFloat(o.current_price) || 0) * (o.lot_size || 0)) }));
}

function buildMap(data: any[]): Map<string, any> {
  const m = new Map<string, any>();
  for (const o of data) m.set(`${o.ticker}_${o.option_type}_${o.strike_price}`, o);
  return m;
}

function computeTags(current: any[], previous: any[], prevToPrev: any[]): any[] {
  if (!previous.length || !prevToPrev.length) {
    return current.map(c => ({ ...c, tag: '' }));
  }
  const prevMap = buildMap(previous);
  const ppMap   = buildMap(prevToPrev);

  return current.map(item => {
    const key  = `${item.ticker}_${item.option_type}_${item.strike_price}`;
    const prev = prevMap.get(key);
    const pp   = ppMap.get(key);
    if (!prev || !pp) return { ...item, tag: '' };

    const tags: string[] = [];
    const oc = item.current_price, op = prev.current_price, opp = pp.current_price;
    if (oc !== undefined && op !== undefined && opp !== undefined) {
      if (opp > op && op < oc) tags.push('BuyOp');
    }
    const cr = item.rsi, pr = prev.rsi;
    if (cr !== undefined && pr !== undefined) {
      if (pr <= 40 && cr > 40) tags.push('Rsi40');
      if (pr >= 60 && cr < 60) tags.push('Rsi60');
    }
    return { ...item, tag: tags.join(', ') };
  });
}

function applyFilters(data: any[], filters: string[]): any[] {
  let result = [...data];
  if (filters.includes('BuyOp'))      result = result.filter(o => o.tag?.split(', ').includes('BuyOp'));
  if (filters.includes('NearLow'))    result = result.filter(o => o.tag?.split(', ').includes('NearLow'));
  if (filters.includes('Rsi40'))      result = result.filter(o => o.tag?.split(', ').includes('Rsi40'));
  if (filters.includes('Rsi60'))      result = result.filter(o => o.tag?.split(', ').includes('Rsi60'));
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
  const [selectedIndex, setSelectedIndex] = useState('1');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState<any[]>([]);  // enriched + tagged current batch rows

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
    try {
      const currentIdx = batches.indexOf(selectedBatch);
      const prevId     = currentIdx + 1 < batches.length ? batches[currentIdx + 1] : null;
      const ppId       = currentIdx + 2 < batches.length ? batches[currentIdx + 2] : null;

      const [curRes, prevRes, ppRes] = await Promise.all([
        analysisService.getBatch(selectedBatch),
        prevId ? analysisService.getBatch(prevId) : Promise.resolve({ data: [] }),
        ppId   ? analysisService.getBatch(ppId)   : Promise.resolve({ data: [] }),
      ]);

      const idx = parseInt(selectedIndex, 10);

      let current    = getNearestCallPutOptions(curRes.data ?? [], idx);
      current        = pickLatestPerTicker(current);
      current        = enrichAmount(current);

      let previous   = getNearestCallPutOptions(prevRes.data ?? [], idx);
      previous       = pickLatestPerTicker(previous);
      previous       = enrichAmount(previous);

      let prevToPrev = getNearestCallPutOptions(ppRes.data ?? [], idx);
      prevToPrev     = pickLatestPerTicker(prevToPrev);
      prevToPrev     = enrichAmount(prevToPrev);

      const tagged = computeTags(current, previous, prevToPrev);
      setRawData(tagged);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleFilter(f: string) {
    setSelectedFilters(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    );
  }

  const filtered = useMemo(() => applyFilters(rawData, selectedFilters), [rawData, selectedFilters]);

  const batchOptions = batches.map(b => ({ label: b.replace('_', ' '), value: b }));

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.content}>
      {/* ── Form card ─ */}
      <View style={[styles.formCard, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.formNote, { color: c.textSecondary }]}>
          Loads current + 2 previous batches. Index = strike offset from ATM (0 = ATM, 1 = 1 above/below). Select filters to narrow results.
        </Text>

        {/* Batch + Index row */}
        <View style={styles.controlsRow}>
          <SelectInput
            label="Batch"
            options={batchOptions}
            value={selectedBatch}
            onChange={(v: string) => { setSelectedBatch(v); setRawData([]); }}
          />
          <SelectInput
            label="Index"
            options={INDEX_OPTIONS}
            value={selectedIndex}
            onChange={(v: string) => setSelectedIndex(v)}
          />
          <View style={styles.btnGroup}>
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
            {rawData.length > 0 && (
              <TouchableOpacity
                style={[styles.btnSecondary, { borderColor: c.border, backgroundColor: c.surface }]}
                onPress={() => { setRawData([]); setSelectedFilters([]); }}
              >
                <Text style={[styles.btnText, { color: c.text }]}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tag filter chips */}
        <View style={styles.chipsWrap}>
          {FILTER_OPTIONS.map(f => (
            <TouchableOpacity
              key={f.value}
              style={[styles.chip, { borderColor: c.border, backgroundColor: selectedFilters.includes(f.value) ? c.primary : c.surface }]}
              onPress={() => toggleFilter(f.value)}
            >
              <Text style={{ color: selectedFilters.includes(f.value) ? '#fff' : c.text, fontSize: 12, fontWeight: '500' }}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
  content: { paddingBottom: SPACING.xl },
  formCard: { margin: SPACING.md, marginBottom: SPACING.sm, borderRadius: 12, borderWidth: 1, padding: SPACING.md, gap: SPACING.md },
  formNote: { fontSize: 12, lineHeight: 18 },
  controlsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, alignItems: 'flex-end' },
  btnGroup: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-end', paddingBottom: 1 },
  btn: { borderRadius: 8, paddingHorizontal: SPACING.md, paddingVertical: 9, alignItems: 'center', justifyContent: 'center', minWidth: 60 },
  btnSecondary: { borderRadius: 8, borderWidth: 1, paddingHorizontal: SPACING.md, paddingVertical: 9, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: SPACING.md, paddingVertical: 4 },
});

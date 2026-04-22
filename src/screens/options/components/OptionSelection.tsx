// ─── Option Selection Component ────────────────────────────────────────────────
// Picks ONE Call + ONE Put at the selected strike index from ATM

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../components/theme/ThemeProvider';
import { SPACING } from '../../../types/constants';
import { DynamicTable } from '../../../components/dynamic-table/DynamicTable';
import { DynamicColumn } from '../../../components/dynamic-table/types';
import { CollapsibleCard } from '../../../components/common/CollapsibleCard';
import { SelectInput } from '../../../components/common/SelectInput';
import { optionChainService } from '../services/option-chain.service';

function pctColor(val: any): string | undefined {
  const n = parseFloat(String(val ?? ''));
  if (isNaN(n)) return undefined;
  return n >= 0 ? '#16a34a' : '#dc2626';
}

const SCHEMA: DynamicColumn[] = [
  { field: 'ticker',          header: 'Ticker',    width: 80,  type: 'text',   sortable: true, copyEnabled: true, copyPrefix: 'NSE:' },
  { field: 'underline_ltp',   header: 'Stock LTP', width: 80,  type: 'number', sortable: true },
  { field: 'mappDisplayName', header: 'Name',      width: 160, type: 'text',   sortable: true, filterable: true, copyEnabled: true, copyPrefix: '' },
  { field: 'current_price',   header: 'Price',     width: 80,  type: 'number', sortable: true },
  { field: 'day_changeP',     header: 'Day %',     width: 70,  type: 'number', sortable: true, colorFn: pctColor },
  { field: 'volume',          header: 'Volume',    width: 80,  type: 'number', sortable: true },
  { field: 'amount',          header: 'Amount',    width: 80,  type: 'number', sortable: true },
];

type SelectionMode = 'index' | 'amount';

const LEVELS = Array.from({ length: 30 }, (_, i) => i + 1);
const LEVEL_OPTIONS = LEVELS.map(l => ({ label: String(l), value: l }));

const AMOUNTS = Array.from({ length: 15 }, (_, i) => (i + 1) * 1000);
const AMOUNT_OPTIONS = AMOUNTS.map(a => ({ label: `${a / 1000}k`, value: a }));

export function OptionSelection() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [symbols, setSymbols] = useState('');
  const [expiry, setExpiry] = useState('');
  const [level, setLevel] = useState(1);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('index');
  const [amountTarget, setAmountTarget] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [rawTable, setRawTable] = useState<any[]>([]);
  const [rawBasePrice, setRawBasePrice] = useState(0);

  const onRefresh = useCallback(() => {
    if (!data.length) { setRefreshing(false); return; }
    setRefreshing(true);
    loadOptions().finally(() => setRefreshing(false));
  }, [symbols, expiry, level, selectionMode, amountTarget, data]);

  // Re-filter from cached data when mode/level/amount changes
  useEffect(() => {
    if (!rawTable.length) return;
    if (selectionMode === 'amount') {
      setData(pickByAmount(rawTable, amountTarget, symbols.trim()));
    } else {
      setData(pickByLevel(rawTable, rawBasePrice, level, symbols.trim()));
    }
  }, [selectionMode, level, amountTarget]);

  useEffect(() => {
    optionChainService.getExpiry().then(r => {
      if (r.expiryDate) setExpiry(r.expiryDate);
    }).catch(() => {});
  }, []);

  async function loadOptions() {
    if (!symbols.trim() || !expiry.trim()) {
      Alert.alert('Validation', 'Enter symbols and expiry date.');
      return;
    }
    setLoading(true);
    setData([]);
    try {
      const res = await optionChainService.getOptionChain(symbols.trim(), expiry.trim());
      const table: any[] = res.data?.tableDataV2 ?? res.data?.tableData ?? [];
      const basePrice: number = res.data?.stockLevelData?.currentPrice ?? 0;

      if (!table.length || !basePrice) {
        Alert.alert('No data', 'No option chain data returned.');
        return;
      }

      setRawTable(table);
      setRawBasePrice(basePrice);

      if (selectionMode === 'amount') {
        setData(pickByAmount(table, amountTarget, symbols.trim()));
      } else {
        setData(pickByLevel(table, basePrice, level, symbols.trim()));
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  function pickByAmount(table: any[], target: number, ticker: string): any[] {
    const calls: any[] = [];
    const puts: any[] = [];

    table.forEach(row => {
      if (row?.c && (row.c.current_price ?? 0) > 0) calls.push(row.c);
      if (row?.p && (row.p.current_price ?? 0) > 0) puts.push(row.p);
    });

    const nearest = (arr: any[]) =>
      arr.reduce((best, opt) => {
        const amt = (opt.current_price ?? 0) * (opt.lot_size ?? 1);
        const bestAmt = (best?.current_price ?? 0) * (best?.lot_size ?? 1);
        return Math.abs(amt - target) < Math.abs(bestAmt - target) ? opt : best;
      }, null);

    const results: any[] = [];
    const bestCall = nearest(calls);
    const bestPut = nearest(puts);
    if (bestCall) results.push(normalizeOption(bestCall, ticker));
    if (bestPut) results.push(normalizeOption(bestPut, ticker));
    return results;
  }

  function pickByLevel(table: any[], basePrice: number, lvl: number, ticker: string): any[] {
    // Sort rows by strike ascending
    const sorted = [...table].sort((a, b) => (a.strike ?? 0) - (b.strike ?? 0));

    // Find ATM index
    let atmIndex = 0;
    let minDiff = Infinity;
    sorted.forEach((row, idx) => {
      const diff = Math.abs((row.strike ?? 0) - basePrice);
      if (diff < minDiff) { minDiff = diff; atmIndex = idx; }
    });

    const results: any[] = [];

    // ONE Call at atmIndex + level
    const callRow = sorted[atmIndex + lvl];
    if (callRow?.c && (callRow.c.current_price ?? 0) > 0) {
      results.push(normalizeOption(callRow.c, ticker));
    }

    // ONE Put at atmIndex - level
    const putRow = sorted[atmIndex - lvl];
    if (putRow?.p && (putRow.p.current_price ?? 0) > 0) {
      results.push(normalizeOption(putRow.p, ticker));
    }

    return results;
  }

  function normalizeOption(opt: any, ticker: string): any {
    const name = (opt.mappDisplayName || '')
      .replace(/ PUT /g, ' PE ')
      .replace(/ CALL /g, ' CE ')
      .trim();
    const price = opt.current_price ?? 0;
    const lotSize = opt.lot_size ?? 1;
    return {
      ticker: ticker.toUpperCase(),
      underline_ltp: opt.underline_ltp ?? 0,
      mappDisplayName: name,
      current_price: price,
      day_changeP: opt.day_changeP ?? 0,
      volume: opt.volume ?? 0,
      amount: Math.round(price * lotSize),
    };
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}>
      <CollapsibleCard title="Option Selection">
        <Text style={[styles.formNote, { color: c.textSecondary }]}>
          Enter NSE symbols and expiry, pick a strike index from ATM and press Load. e.g. symbols: NIFTY, BANKNIFTY
        </Text>
        {/* Row 1: Symbols + Expiry */}
        <View style={styles.inputsRow}>
          <View style={styles.labeledItem}>
            <Text style={[styles.itemLabel, { color: c.textSecondary }]}>Symbols</Text>
            <TextInput
              style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.background, flex: 1 }]}
              value={symbols}
              onChangeText={setSymbols}
              placeholder="Symbols (e.g. NIFTY)"
              placeholderTextColor={c.textSecondary}
              autoCapitalize="characters"
            />
          </View>
          <View style={styles.labeledItem}>
            <Text style={[styles.itemLabel, { color: c.textSecondary }]}>Expiry</Text>
            <TextInput
              style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.background, flex: 1 }]}
              value={expiry}
              onChangeText={setExpiry}
              placeholder="Expiry (YYYY-MM-DD)"
              placeholderTextColor={c.textSecondary}
              autoCapitalize="none"
            />
          </View>
        </View>
        {/* Row 2: Load, Mode toggle, Level/Amount selector, Reset */}
        <View style={styles.actionsRow}>
          <View style={styles.labeledItem}>
            <Text style={[styles.itemLabel, { color: c.textSecondary }]}> </Text>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: c.primary, opacity: (loading || !symbols.trim() || !expiry.trim()) ? 0.4 : 1 }]}
              onPress={loadOptions}
              disabled={loading || !symbols.trim() || !expiry.trim()}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.btnText}>Load Options</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Mode select */}
          <SelectInput
            label="Mode"
            options={[{ label: 'Index', value: 'index' }, { label: 'Amount', value: 'amount' }]}
            value={selectionMode}
            onChange={(v) => setSelectionMode(v as SelectionMode)}
          />

          {selectionMode === 'index' ? (
            <SelectInput
              label="Level"
              options={LEVEL_OPTIONS}
              value={level}
              onChange={setLevel}
            />
          ) : (
            <SelectInput
              label="Amount"
              options={AMOUNT_OPTIONS}
              value={amountTarget}
              onChange={setAmountTarget}
            />
          )}

          {data.length > 0 && (
            <TouchableOpacity
              style={[styles.btnIcon, { borderColor: c.border, backgroundColor: c.surface }]}
              onPress={() => { setData([]); setRawTable([]); setRawBasePrice(0); }}
            >
              <Text style={{ color: c.text, fontSize: 15 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </CollapsibleCard>
      <DynamicTable
        data={data}
        schema={SCHEMA}
        loading={loading}
        onRefresh={loadOptions}
        title="Option Selection"
        emptyText="Enter symbols, pick expiry and strike index, then press Load Options."
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: SPACING.md, paddingBottom: SPACING.xl },
  formNote: { fontSize: 12, lineHeight: 18 },
  inputsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, alignItems: 'flex-end' },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: SPACING.md, paddingVertical: 6, fontSize: 13, minWidth: 140 },
  actionsRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-end', justifyContent: 'flex-end' },
  labeledItem: { flexDirection: 'column', gap: 4 },
  itemLabel: { fontSize: 11 },
  btn: { borderRadius: 8, paddingHorizontal: SPACING.md, paddingVertical: 6, alignItems: 'center', justifyContent: 'center', minWidth: 60 },
  btnIcon: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});

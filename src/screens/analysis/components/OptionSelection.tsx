// ─── Option Selection Component ────────────────────────────────────────────────
// Picks ONE Call + ONE Put at the selected strike index from ATM

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { analysisService } from '../services/analysis.service';

function pctColor(val: any): string | undefined {
  const n = parseFloat(String(val ?? ''));
  if (isNaN(n)) return undefined;
  return n >= 0 ? '#16a34a' : '#dc2626';
}

const SCHEMA: DynamicColumn[] = [
  { field: 'ticker',          header: 'Ticker',    width: 80,  type: 'text',   sortable: true, copyEnabled: true, copyPrefix: 'NSE:' },
  { field: 'mappDisplayName', header: 'Name',      width: 160, type: 'text',   sortable: true, filterable: true, copyEnabled: true, copyPrefix: '' },
  { field: 'option_type',     header: 'Type',      width: 60,  type: 'text',   sortable: true },
  { field: 'current_price',   header: 'Price',     width: 80,  type: 'number', sortable: true },
  { field: 'day_changeP',     header: 'Day %',     width: 70,  type: 'number', sortable: true, colorFn: pctColor },
  { field: 'change_per_month',header: 'Month %',   width: 80,  type: 'number', sortable: true, colorFn: pctColor },
  { field: 'underline_ltp',   header: 'Stock LTP', width: 80,  type: 'number', sortable: true },
  { field: 'volume',          header: 'Volume',    width: 80,  type: 'number', sortable: true },
  { field: 'amount',          header: 'Amount',    width: 80,  type: 'number', sortable: true },
];

const LEVELS = Array.from({ length: 30 }, (_, i) => i + 1);

export function OptionSelection() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [symbols, setSymbols] = useState('');
  const [expiry, setExpiry] = useState('');
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    analysisService.getExpiry().then(r => {
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
      const res = await analysisService.getOptionChain(symbols.trim(), expiry.trim());
      const table: any[] = res.data?.tableDataV2 ?? res.data?.tableData ?? [];
      const basePrice: number = res.data?.stockLevelData?.currentPrice ?? 0;

      if (!table.length || !basePrice) {
        Alert.alert('No data', 'No option chain data returned.');
        return;
      }

      setData(pickByLevel(table, basePrice, level, symbols.trim()));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
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
      mappDisplayName: name,
      option_type: opt.option_type ?? '',
      underline_ltp: opt.underline_ltp ?? 0,
      current_price: price,
      day_changeP: opt.day_changeP ?? 0,
      change_per_month: opt.change_per_month ?? 0,
      volume: opt.volume ?? 0,
      amount: Math.round(price * lotSize),
    };
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.formCard, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.formNote, { color: c.textSecondary }]}>
          Enter NSE symbols and expiry, pick a strike index from ATM and press Load. e.g. symbols: NIFTY, BANKNIFTY
        </Text>
        <View style={styles.inputsRow}>
          <TextInput
            style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.background, flex: 1 }]}
            value={symbols}
            onChangeText={setSymbols}
            placeholder="Symbols (e.g. NIFTY)"
            placeholderTextColor={c.textSecondary}
            autoCapitalize="characters"
          />
          <TextInput
            style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.background, flex: 1 }]}
            value={expiry}
            onChangeText={setExpiry}
            placeholder="Expiry (YYYY-MM-DD)"
            placeholderTextColor={c.textSecondary}
            autoCapitalize="none"
          />
        </View>
        {/* Level chips */}
        <View style={styles.chipsWrap}>
          {LEVELS.map(l => (
            <TouchableOpacity
              key={l}
              style={[styles.chip, { borderColor: c.border, backgroundColor: level === l ? c.primary : c.surface }]}
              onPress={() => setLevel(l)}
            >
              <Text style={{ color: level === l ? '#fff' : c.text, fontSize: 12, fontWeight: '500' }}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.btnGroup}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: c.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={loadOptions}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.btnText}>Load Options</Text>
            }
          </TouchableOpacity>
          {data.length > 0 && (
            <TouchableOpacity
              style={[styles.btnSecondary, { borderColor: c.border, backgroundColor: c.surface }]}
              onPress={() => setData([])}
            >
              <Text style={[styles.btnText, { color: c.text }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
  content: { paddingBottom: SPACING.xl },
  formCard: { margin: SPACING.md, marginBottom: SPACING.sm, borderRadius: 12, borderWidth: 1, padding: SPACING.md, gap: SPACING.md },
  formNote: { fontSize: 12, lineHeight: 18 },
  inputsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: SPACING.md, paddingVertical: 9, fontSize: 14, minWidth: 140 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: SPACING.md, paddingVertical: 4 },
  btnGroup: { flexDirection: 'row', gap: SPACING.sm },
  btn: { borderRadius: 8, paddingHorizontal: SPACING.md, paddingVertical: 9, alignItems: 'center', justifyContent: 'center', minWidth: 60 },
  btnSecondary: { borderRadius: 8, borderWidth: 1, paddingHorizontal: SPACING.md, paddingVertical: 9, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

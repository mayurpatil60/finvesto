// ─── Percentage Change Component ────────────────────────────────────────────────
// Search by option name, show current_price change % across batches

import React, { useState } from 'react';
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
  if (val === 'Base') return undefined;
  const n = parseFloat(String(val ?? ''));
  if (isNaN(n)) return undefined;
  return n >= 0 ? '#16a34a' : '#dc2626';
}

function parseBatchDateTime(batchId: string): Date {
  const [datePart, timePartRaw] = batchId.split('_');
  const timePart = timePartRaw.trim().toUpperCase();
  const match = timePart.match(/^(d{1,2}):(d{2})(AM|PM)$/);
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (match[3] === 'PM' && hours !== 12) hours += 12;
  if (match[3] === 'AM' && hours === 12) hours = 0;
  return new Date(`${datePart}T${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:00`);
}

const SCHEMA: DynamicColumn[] = [
  { field: 'bDate',           header: 'Date',     width: 90,  type: 'text',   sortable: true },
  { field: 'bTime',           header: 'Time',     width: 70,  type: 'text',   sortable: true },
  { field: 'ticker',          header: 'Ticker',   width: 80,  type: 'text',   sortable: true, copyEnabled: true, copyPrefix: 'NSE:' },
  { field: 'mappDisplayName', header: 'Name',     width: 160, type: 'text',   sortable: true, filterable: true, copyEnabled: true, copyPrefix: '' },
  { field: 'current_price',   header: 'Price',    width: 80,  type: 'number', sortable: true },
  { field: 'changeP',         header: '% Chg',    width: 80,  type: 'number', sortable: true, colorFn: pctColor },
  { field: 'day_changeP',     header: 'Day %',    width: 70,  type: 'number', sortable: true, colorFn: pctColor },
  { field: 'rsi',             header: 'RSI',      width: 60,  type: 'number', sortable: true },
  { field: 'tag',             header: 'Tag',      width: 100, type: 'text',   sortable: true, filterable: true },
  { field: 'expiry',          header: 'Expiry',   width: 100, type: 'text',   sortable: true },
];

export function PercentageChange() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);

  async function load() {
    setLoading(true);
    setRows([]);
    try {
      const res = await analysisService.getByName(name.trim());
      // Parse date/time and sort ascending (oldest first = base)
      const sorted = (res.data ?? [])
        .map((item: any) => {
          const [bDate, bTime] = (item.batch_id || '').split('_');
          return { ...item, bDate, bTime };
        })
        .sort((a: any, b: any) =>
          parseBatchDateTime(a.batch_id || '').getTime() - parseBatchDateTime(b.batch_id || '').getTime()
        );


      const basePrice = parseFloat(sorted[0].current_price ?? sorted[0].ltp ?? 0) || 0;
      const withChange = sorted.map((item: any, idx: number) => {
        const price = parseFloat(item.current_price ?? item.ltp ?? 0) || 0;
        const changeP = idx === 0
          ? 'Base'
          : basePrice !== 0
            ? ((price - basePrice) / Math.abs(basePrice) * 100).toFixed(2)
            : '—';
        return { ...item, changeP };
      });

      // Show newest first after computing change
      setRows([...withChange].reverse());
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.formCard, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.formNote, { color: c.textSecondary }]}>
          Track price changes over batches. Oldest record is base (0%), all others show % change from it.
        </Text>
        <View style={styles.controlsRow}>
          <TextInput
            style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.background, flex: 1 }]}
            value={name}
            onChangeText={setName}
            placeholder="e.g. RECLTD 315 PE"
            placeholderTextColor={c.textSecondary}
            autoCapitalize="characters"
            returnKeyType="search"
            onSubmitEditing={load}
          />
          <View style={styles.btnGroup}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: c.primary, opacity: loading ? 0.7 : 1 }]}
              onPress={load}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.btnText}>Go</Text>
              }
            </TouchableOpacity>
            {rows.length > 0 && (
              <TouchableOpacity
                style={[styles.btnSecondary, { borderColor: c.border, backgroundColor: c.surface }]}
                onPress={() => setRows([])}
              >
                <Text style={[styles.btnText, { color: c.text }]}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      <DynamicTable
        data={rows}
        schema={SCHEMA}
        loading={loading}
        onRefresh={load}
        title="% Change"
        emptyText="Enter an option name to see % change over time."
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
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: SPACING.md, paddingVertical: 9, fontSize: 14 },
  btnGroup: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-end', paddingBottom: 1 },
  btn: { borderRadius: 8, paddingHorizontal: SPACING.md, paddingVertical: 9, alignItems: 'center', justifyContent: 'center', minWidth: 60 },
  btnSecondary: { borderRadius: 8, borderWidth: 1, paddingHorizontal: SPACING.md, paddingVertical: 9, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

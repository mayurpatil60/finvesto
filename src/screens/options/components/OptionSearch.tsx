// ─── Option Search / History Component ────────────────────────────────────────────────

import React, { useCallback, useState } from 'react';
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
import { analysisService } from '../services/analysis.service';

// Keys shown in table — mirrors Angular mapAnalysisKeys
const SCHEMA: DynamicColumn[] = [
  { field: 'bDate',           header: 'Date',       width: 90,  type: 'text',   sortable: true },
  { field: 'bTime',           header: 'Time',       width: 70,  type: 'text',   sortable: true },
  { field: 'ticker',          header: 'Ticker',     width: 80,  type: 'text',   sortable: true, filterable: true, copyEnabled: true, copyPrefix: 'NSE:' },
  { field: 'date',            header: 'DB Date',    width: 90,  type: 'text',   sortable: true },
  { field: 'time',            header: 'DB Time',    width: 80,  type: 'text',   sortable: true },
  { field: 'change_per_month',header: 'Month %',    width: 80,  type: 'number', sortable: true, colorFn: pctColor },
  { field: 'rsi',             header: 'RSI',        width: 60,  type: 'number', sortable: true },
  { field: 'volume',          header: 'Volume',     width: 80,  type: 'number', sortable: true },
  { field: 'expiry',          header: 'Expiry',     width: 100, type: 'text',   sortable: true },
  { field: 'mappDisplayName', header: 'Name',       width: 160, type: 'text',   sortable: true, filterable: true, copyEnabled: true, copyPrefix: '' },
  { field: 'current_price',   header: 'Price',      width: 80,  type: 'number', sortable: true },
  { field: 'day_changeP',     header: 'Day %',      width: 70,  type: 'number', sortable: true, colorFn: pctColor },
  { field: 'amount',          header: 'Amount',     width: 80,  type: 'number', sortable: true },
  { field: 'tag',             header: 'Tag',        width: 100, type: 'text',   sortable: true, filterable: true },
];

function pctColor(val: any): string | undefined {
  const n = parseFloat(String(val ?? ''));
  if (isNaN(n)) return undefined;
  return n >= 0 ? '#16a34a' : '#dc2626';
}

function parseBatchDateTime(batchId: string): Date {
  const [datePart, timePartRaw] = batchId.split('_');
  const timePart = timePartRaw.trim().toUpperCase();
  const match = timePart.match(/^(\d{1,2}):(\d{2})(AM|PM)$/);
  if (!match) return new Date(0);
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (match[3] === 'PM' && hours !== 12) hours += 12;
  if (match[3] === 'AM' && hours === 12) hours = 0;
  return new Date(`${datePart}T${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:00`);
}

function enrichAmount(item: any): any {
  const amount = Math.round((parseFloat(item.current_price) || 0) * (item.lot_size || 0));
  return { ...item, amount };
}

function addTimeSeriesTags(data: any[]): any[] {
  const tagged = data.map((cur, idx) => {
    const prev = data[idx + 1];
    const pp = data[idx + 2];
    const tags: string[] = [];
    const oc = cur.current_price, op = prev?.current_price, opp = pp?.current_price;
    if (prev && pp && oc !== undefined && op !== undefined && opp !== undefined) {
      if (opp > op && op < oc) tags.push('BuyOp');
    }
    const cr = cur.rsi, pr = prev?.rsi;
    if (prev && cr !== undefined && pr !== undefined) {
      if (pr <= 40 && cr > 40) tags.push('Rsi40');
      if (pr >= 60 && cr < 60) tags.push('Rsi60');
    }
    return { ...cur, tag: tags.join(', ') };
  });
  // Mark lowest BuyOp as NearLow
  const buyOps = tagged.filter(i => i.tag.includes('BuyOp'));
  if (buyOps.length > 1) {
    const lowest = buyOps.reduce((min, c) =>
      (c.current_price ?? Infinity) < (min.current_price ?? Infinity) ? c : min
    );
    return tagged.map(i =>
      i === lowest ? { ...i, tag: i.tag.replace('BuyOp', 'NearLow') } : i
    );
  }
  return tagged;
}

export function OptionSearch() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    if (!data.length) { setRefreshing(false); return; }
    setRefreshing(true);
    search().finally(() => setRefreshing(false));
  }, [name, data]);

  async function search() {
    setLoading(true);
    setData([]);
    try {
      const res = await analysisService.getByName(name.trim());
      let result: any[] = (res.data ?? []).map((item: any) => {
        const [bDate, bTime] = (item.batch_id || '').split('_');
        return enrichAmount({ ...item, bDate, bTime });
      });
      // Sort descending by batch date-time
      result = result.sort((a, b) =>
        parseBatchDateTime(b.batch_id || '').getTime() - parseBatchDateTime(a.batch_id || '').getTime()
      );
      result = addTimeSeriesTags(result);
      setData(result);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}>
      <CollapsibleCard title="Option History">
        <Text style={[styles.formNote, { color: c.textSecondary }]}>
          Search historical records by option name (partial match). e.g. RECLTD 315 PE
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
            value={name}
            onChangeText={setName}
            placeholder="e.g. RECLTD 315 PE"
            placeholderTextColor={c.textSecondary}
            autoCapitalize="characters"
            returnKeyType="search"
            onSubmitEditing={search}
          />
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: c.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={search}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.btnText}>Search</Text>
            }
          </TouchableOpacity>
          {data.length > 0 && (
            <TouchableOpacity
              style={[styles.btnIcon, { borderColor: c.border, backgroundColor: c.surface }]}
              onPress={() => setData([])}
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
        onRefresh={search}
        title="Option History"
        emptyText="Enter an option name and press Search."
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: SPACING.md, paddingBottom: SPACING.xl },
  formNote: { fontSize: 12, lineHeight: 18 },
  inputRow: { flexDirection: 'row' },
  input: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: SPACING.md, paddingVertical: 6, fontSize: 13 },
  actionsRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center', justifyContent: 'flex-end' },
  btn: { borderRadius: 8, paddingHorizontal: SPACING.md, paddingVertical: 6, alignItems: 'center', justifyContent: 'center', minWidth: 60 },
  btnIcon: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});

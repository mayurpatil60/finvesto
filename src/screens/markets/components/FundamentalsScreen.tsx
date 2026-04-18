// ─── Fundamentals Component ───────────────────────────────────────────────────

import React, { useState } from 'react';
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
import { SelectInput, SelectOption } from '../../../components/common/SelectInput';
import { DynamicTable } from '../../../components/dynamic-table/DynamicTable';
import { DynamicColumn } from '../../../components/dynamic-table/types';
import { SPACING } from '../../../types/constants';
import { CollapsibleCard } from '../../../components/common/CollapsibleCard';
import { marketsService } from '../services/markets.service';

type GroupValue = 'all' | 'fno-stocks' | 'only-etfs' | 'sme-stocks' | 'non-sme-stocks';
type QueryValue = string;

const GROUP_OPTIONS: SelectOption<GroupValue>[] = [
  { label: 'All Stocks', value: 'all' },
  { label: 'F&O Stocks', value: 'fno-stocks' },
  { label: 'Only ETFs', value: 'only-etfs' },
  { label: 'SME Stocks', value: 'sme-stocks' },
  { label: 'Non-SME Stocks', value: 'non-sme-stocks' },
];

const QUERY_OPTIONS: SelectOption<QueryValue>[] = [
  { label: 'RSI crossing 60 ↑', value: 'prev_rsi < 60 && rsi > 60' },
  { label: 'RSI crossing 60 ↓', value: 'prev_rsi > 60 && rsi < 60' },
  { label: 'RSI crossing 40 ↑', value: 'prev_rsi < 40 && rsi > 40' },
  { label: 'RSI crossing 30 ↑', value: 'prev_rsi < 30 && rsi > 30' },
  { label: 'RSI below 30', value: 'rsi < 30' },
  { label: 'RSI below 40', value: 'rsi < 40' },
  { label: 'All (Price > 0)', value: 'currentPrice > 0' },
];

// Color-code change% columns
const changeColorFn = (val: any) => {
  const n = parseFloat(String(val ?? ''));
  if (isNaN(n)) return undefined;
  return n >= 0 ? '#16a34a' : '#dc2626';
};

// Known schema — DynamicTable will auto-add any extra columns from the API
const FUND_SCHEMA: DynamicColumn[] = [
  { field: 'get_full_name', header: 'Company',    width: 180, type: 'text',   sortable: true, filterable: true, copyEnabled: true, copyPrefix: 'NSE:' },
  { field: 'NSEcode',        header: 'NSE Code',   width: 100, type: 'text',   sortable: true, filterable: true },
  { field: 'currentPrice',   header: 'Price ₹',    width: 80,  type: 'number', sortable: true },
  { field: 'rsi',            header: 'RSI',         width: 70,  type: 'number', sortable: true },
  { field: 'prev_rsi',       header: 'Prev RSI',    width: 80,  type: 'number', sortable: true },
  { field: 'qtr_changeP',    header: 'Qtr %',       width: 80,  type: 'number', sortable: true, colorFn: changeColorFn },
  { field: 'month_changeP',  header: 'Month %',     width: 80,  type: 'number', sortable: true, colorFn: changeColorFn },
  { field: 'week_changeP',   header: 'Week %',      width: 80,  type: 'number', sortable: true, colorFn: changeColorFn },
];

export function FundamentalsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [group, setGroup] = useState<GroupValue>('all');
  const [query, setQuery] = useState<QueryValue>(QUERY_OPTIONS[0].value);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  async function loadData() {
    setLoading(true);
    setData([]);
    try {
      const params: Record<string, string> = { groupName: group, query };
      if (group === 'fno-stocks') params['groupType'] = 'others';
      const res = await marketsService.getFundamentals(params);
      const flat: any[] = [];
      const pages = Array.isArray(res.data) ? res.data : [res.data];
      for (const page of pages) {
        if (page?.body?.tableHeaders && page?.body?.tableData) {
          const headers = page.body.tableHeaders.map((h: any) => h.unique_name || h.display_name || h);
          for (const row of page.body.tableData) {
            const obj: any = {};
            headers.forEach((key: string, idx: number) => { obj[key] = row[idx]; });
            flat.push(obj);
          }
        }
      }
      setData(flat);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.content}>
      {/* ── Form card ────────────────────────────────────────────────────── */}
      <CollapsibleCard title="Fundamentals">
        <Text style={[styles.formNote, { color: c.textSecondary }]}>
          Trendlyne fundamentals screener. Select stock group and RSI query, then press Load.
        </Text>
        <View style={styles.selectsRow}>
          <SelectInput
            label="Group"
            options={GROUP_OPTIONS}
            value={group}
            onChange={(v) => { setGroup(v); setData([]); }}
          />
          <SelectInput
            label="RSI Query"
            options={QUERY_OPTIONS}
            value={query}
            onChange={(v) => { setQuery(v); setData([]); }}
          />
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: c.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={loadData}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.btnText}>Load</Text>
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

      {/* ── DynamicTable ─────────────────────────────────────────────────── */}
      <DynamicTable
        data={data}
        schema={FUND_SCHEMA}
        loading={loading}
        onRefresh={loadData}

        title="Fundamentals"
        emptyText="Select group and RSI query, then press Load."
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: SPACING.md, paddingBottom: SPACING.xl },
  formNote: { fontSize: 12, lineHeight: 18 },
  selectsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  actionsRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center', justifyContent: 'flex-end' },
  btn: { borderRadius: 8, paddingHorizontal: SPACING.md, paddingVertical: 6, alignItems: 'center', justifyContent: 'center', minWidth: 60 },
  btnIcon: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});

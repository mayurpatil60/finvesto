// ─── IPO Component ────────────────────────────────────────────────────────────

import React, { useCallback, useState } from 'react';
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
import { useTheme } from '../../../components/theme/ThemeProvider';
import { SelectInput, SelectOption } from '../../../components/common/SelectInput';
import { DynamicTable } from '../../../components/dynamic-table/DynamicTable';
import { DynamicColumn } from '../../../components/dynamic-table/types';
import { SPACING } from '../../../types/constants';
import { CollapsibleCard } from '../../../components/common/CollapsibleCard';
import { marketsService } from '../services/markets.service';

// ── Types ──────────────────────────────────────────────────────────────────────
type IpoType = 'Open' | 'Listing Soon' | 'Recently Listed' | 'Listed';

const CURRENT_YEAR = new Date().getFullYear();

const IPO_TYPE_OPTIONS: SelectOption<IpoType>[] = [
  { label: 'Open Now', value: 'Open' },
  { label: 'Listing Soon', value: 'Listing Soon' },
  { label: 'Recently Listed', value: 'Recently Listed' },
  { label: 'Listed (by Year)', value: 'Listed' },
];

const YEAR_OPTIONS: SelectOption<number>[] = Array.from({ length: 6 }, (_, i) => ({
  label: String(CURRENT_YEAR - i),
  value: CURRENT_YEAR - i,
}));

// ── Per-type column schema ─────────────────────────────────────────────────────
const gainColorFn = (val: any) => {
  const n = parseFloat(String(val ?? ''));
  if (isNaN(n)) return undefined;
  return n >= 0 ? '#16a34a' : '#dc2626';
};

const SCHEMA: Record<IpoType, DynamicColumn[]> = {
  'Open': [
    { field: 'company_name',      header: 'Company',    width: 170, type: 'text',   sortable: true, filterable: true },
    { field: 'bid_start_date',    header: 'Open',       width: 100, type: 'text',   sortable: true },
    { field: 'bid_end_date',      header: 'Close',      width: 100, type: 'text',   sortable: true },
    { field: 'price_range_min',   header: 'Min ₹',      width: 80,  type: 'number', sortable: true },
    { field: 'price_range_max',   header: 'Max ₹',      width: 80,  type: 'number', sortable: true },
    { field: 'subscription_text', header: 'Subscribed', width: 110, type: 'text',   sortable: true },
    { field: 'issue_size',        header: 'Size (Cr)',  width: 90,  type: 'number', sortable: true },
  ],
  'Listing Soon': [
    { field: 'company_name',       header: 'Company',    width: 170, type: 'text',   sortable: true, filterable: true },
    { field: 'open_date',          header: 'Open',       width: 100, type: 'text',   sortable: true },
    { field: 'close_date',         header: 'Close',      width: 100, type: 'text',   sortable: true },
    { field: 'listing_date',       header: 'Listing',    width: 100, type: 'text',   sortable: true },
    { field: 'issue_price',        header: 'Price ₹',    width: 80,  type: 'number', sortable: true },
    { field: 'total_subscription', header: 'Subscribed', width: 110, type: 'number', sortable: true },
    { field: 'issue_size',         header: 'Size (Cr)',  width: 90,  type: 'number', sortable: true },
  ],
  'Recently Listed': [
    { field: 'company_name',        header: 'Company',   width: 170, type: 'text',   sortable: true, filterable: true, copyEnabled: true, copyPrefix: 'NSE:' },
    { field: 'listing_date',        header: 'Listed',    width: 100, type: 'text',   sortable: true },
    { field: 'issue_price',         header: 'Issue ₹',   width: 80,  type: 'number', sortable: true },
    { field: 'listing_close_price', header: 'Close ₹',   width: 80,  type: 'number', sortable: true },
    { field: 'listing_gainP',       header: 'Listing %', width: 90,  type: 'number', sortable: true, colorFn: gainColorFn },
    { field: 'current_gainP',       header: 'Curr %',    width: 80,  type: 'number', sortable: true, colorFn: gainColorFn },
    { field: 'total_subscription',  header: 'Sub.',      width: 80,  type: 'number', sortable: true },
  ],
  'Listed': [
    { field: 'company_name',        header: 'Company',   width: 170, type: 'text',   sortable: true, filterable: true, copyEnabled: true, copyPrefix: 'NSE:' },
    { field: 'listing_date',        header: 'Listed',    width: 100, type: 'text',   sortable: true },
    { field: 'issue_price',         header: 'Issue ₹',   width: 80,  type: 'number', sortable: true },
    { field: 'listing_close_price', header: 'Close ₹',   width: 80,  type: 'number', sortable: true },
    { field: 'listing_gainP',       header: 'Listing %', width: 90,  type: 'number', sortable: true, colorFn: gainColorFn },
    { field: 'current_gainP',       header: 'Curr %',    width: 80,  type: 'number', sortable: true, colorFn: gainColorFn },
    { field: 'total_subscription',  header: 'Sub.',      width: 80,  type: 'number', sortable: true },
  ],
};

// ── Component ──────────────────────────────────────────────────────────────────
export function IpoScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [ipoType, setIpoType] = useState<IpoType>('Open');
  const [year, setYear] = useState(CURRENT_YEAR);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    if (!data.length) { setRefreshing(false); return; }
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  }, [ipoType, year, data]);

  async function fetchData(type: IpoType = ipoType, y: number = year) {
    setLoading(true);
    setData([]);
    try {
      if (type === 'Listed') {
        const res = await marketsService.getIpoListed(y);
        setData(Array.isArray(res.data) ? res.data : []);
      } else {
        const res = await marketsService.getIpoUpcoming();
        const body = res.data as any;
        if (type === 'Open') setData(body?.upcoming_open ?? []);
        else if (type === 'Listing Soon') setData(body?.listing_soon ?? []);
        else if (type === 'Recently Listed') setData(body?.recently_listed ?? []);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}>
      {/* ── Form card ────────────────────────────────────────────────────── */}
      <CollapsibleCard title="IPO">
        <Text style={[styles.formNote, { color: c.textSecondary }]}>
          View upcoming or recently listed IPOs. DynamicTable — global &amp; column search, multi-sort, filters, export built-in.
        </Text>

        <View style={styles.selectsRow}>
          <SelectInput
            label="IPO Type"
            options={IPO_TYPE_OPTIONS}
            value={ipoType}
            onChange={v => { setIpoType(v); setData([]); }}
          />

          {ipoType === 'Listed' && (
            <SelectInput
              label="Year"
              options={YEAR_OPTIONS}
              value={year}
              onChange={setYear}
            />
          )}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: c.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={() => fetchData()}
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
        schema={SCHEMA[ipoType]}
        loading={loading}
        onRefresh={() => fetchData()}

        title={`IPO – ${ipoType}`}
        emptyText="Select IPO type and press Load."
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

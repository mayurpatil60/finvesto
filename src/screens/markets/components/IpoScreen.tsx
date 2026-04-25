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
    { field: 'company_name', header: 'Name',      width: 170, type: 'text',   sortable: true, filterable: true, copyEnabled: true, copyPrefix: 'NSE:' },
    { field: 'stock_code',   header: 'Code',      width: 80,  type: 'text',   sortable: true },
    { field: 'open',         header: 'Open',      width: 100, type: 'text',   sortable: true },
    { field: 'close',        header: 'Close',     width: 100, type: 'text',   sortable: true },
    { field: 'sme',          header: 'SME',       width: 90,  type: 'text',   sortable: true },
    { field: 'price',        header: 'Price ₹',   width: 80,  type: 'number', sortable: true },
  ],
  'Listing Soon': [
    { field: 'company_name', header: 'Name',      width: 170, type: 'text',   sortable: true, filterable: true, copyEnabled: true, copyPrefix: 'NSE:' },
    { field: 'stock_code',   header: 'Code',      width: 80,  type: 'text',   sortable: true },
    { field: 'open',         header: 'Open',      width: 100, type: 'text',   sortable: true },
    { field: 'close',        header: 'Close',     width: 100, type: 'text',   sortable: true },
    { field: 'listing',      header: 'Listing',   width: 100, type: 'text',   sortable: true },
    { field: 'sme',          header: 'SME',       width: 90,  type: 'text',   sortable: true },
    { field: 'price',        header: 'Price ₹',   width: 80,  type: 'number', sortable: true },
  ],
  'Recently Listed': [
    { field: 'company_name',  header: 'Name',      width: 170, type: 'text',   sortable: true, filterable: true, copyEnabled: true, copyPrefix: 'NSE:' },
    { field: 'stock_code',    header: 'Code',      width: 80,  type: 'text',   sortable: true },
    { field: 'listed',        header: 'Listed',    width: 100, type: 'text',   sortable: true },
    { field: 'listing_gainP', header: 'Listing %', width: 90,  type: 'number', sortable: true, colorFn: gainColorFn },
    { field: 'current_gainP', header: 'Curr %',    width: 80,  type: 'number', sortable: true, colorFn: gainColorFn },
    { field: 'sme',           header: 'SME',       width: 90,  type: 'text',   sortable: true },
    { field: 'price',         header: 'Price ₹',   width: 80,  type: 'number', sortable: true },
  ],
  'Listed': [
    { field: 'company_name',  header: 'Name',      width: 170, type: 'text',   sortable: true, filterable: true, copyEnabled: true, copyPrefix: 'NSE:' },
    { field: 'stock_code',    header: 'Code',      width: 80,  type: 'text',   sortable: true },
    { field: 'listed',        header: 'Listed',    width: 100, type: 'text',   sortable: true },
    { field: 'listing_gainP', header: 'Listing %', width: 90,  type: 'number', sortable: true, colorFn: gainColorFn },
    { field: 'current_gainP', header: 'Curr %',    width: 80,  type: 'number', sortable: true, colorFn: gainColorFn },
    { field: 'sme',           header: 'SME',       width: 90,  type: 'text',   sortable: true },
    { field: 'price',         header: 'Price ₹',   width: 80,  type: 'number', sortable: true },
  ],
};

// ── Per-type data transforms ───────────────────────────────────────────────────
const MONTHS: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

function formatDate(raw: string | undefined | null): string {
  if (!raw) return '-';
  const clean = raw.replace(',', '').trim();
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  // "23 Apr 2026" or "23 Apr 26"
  const parts = clean.split(' ');
  if (parts.length === 3) {
    let [dd, mon, yr] = parts;
    const mm = MONTHS[mon];
    if (!mm) return clean;
    if (yr.length === 2) yr = '20' + yr;
    return `${yr}-${mm}-${dd.padStart(2, '0')}`;
  }
  return clean;
}

function transformOpen(items: any[]): any[] {
  return items.map(d => ({
    company_name: d.company_name,
    stock_code:   d.NSEcode || d.BSEcode || '-',
    open:         formatDate(d.bid_start_date),
    close:        formatDate(d.bid_end_date),
    sme:          d.is_sme ? 'SME' : 'Mainboard',
    price:        d.price_range_max,
  }));
}

function transformListingSoon(items: any[]): any[] {
  return items.map(d => ({
    company_name: d.company_name,
    stock_code:   d.NSEcode || d.BSEcode || '-',
    open:         formatDate(d.open_date),
    close:        formatDate(d.close_date),
    listing:      formatDate(d.listing_date),
    sme:          d.is_sme ? 'SME' : 'Mainboard',
    price:        d.issue_price,
  }));
}

function transformRecentOrListed(items: any[]): any[] {
  return items.map(d => ({
    company_name:  d.company_name,
    stock_code:    d.stock_code,
    listed:        formatDate(d.listing_date),
    listing_gainP: d.listing_gainP,
    current_gainP: d.current_gainP,
    sme:           d.is_sme ? 'SME' : 'Mainboard',
    price:         d.current_price ?? d.listing_close_price ?? d.issue_price,
  }));
}

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
        setData(transformRecentOrListed(Array.isArray(res.data) ? res.data : []));
      } else {
        const res = await marketsService.getIpoUpcoming();
        const body = res.data as any;
        if (type === 'Open') setData(transformOpen(body?.upcoming_open ?? []));
        else if (type === 'Listing Soon') setData(transformListingSoon(body?.listing_soon ?? []));
        else if (type === 'Recently Listed') setData(transformRecentOrListed(body?.recently_listed ?? []));
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

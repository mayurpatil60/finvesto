// ─── Option Range Component ────────────────────────────────────────────────────
// Shows ATL, ATH and change-from-ATL for each option, loaded per batch

import React, { useEffect, useState } from 'react';
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
import { CollapsibleCard } from '../../../components/common/CollapsibleCard';
import { SelectInput } from '../../../components/common/SelectInput';
import { optionRangeService } from '../services/option-range.service';

function pctColor(val: any): string | undefined {
  const n = parseFloat(String(val ?? ''));
  if (isNaN(n)) return undefined;
  return n >= 0 ? '#16a34a' : '#dc2626';
}

const SCHEMA: DynamicColumn[] = [
  { field: 'ticker',              header: 'Ticker',     width: 80,  type: 'text',   sortable: true, copyEnabled: true, copyPrefix: 'NSE:' },
  { field: 'underline_ltp',       header: 'Stock LTP',  width: 90,  type: 'number', sortable: true },
  { field: 'change_per_month',    header: 'Month %',    width: 80,  type: 'number', sortable: true, colorFn: pctColor },
  { field: 'rsi',                 header: 'RSI',        width: 55,  type: 'number', sortable: true },
  { field: 'mappDisplayName',     header: 'Name',       width: 160, type: 'text',   sortable: true, filterable: true, copyEnabled: true, copyPrefix: '' },
  { field: 'current_price',       header: 'Price',      width: 80,  type: 'number', sortable: true },
  { field: 'day_changeP',         header: 'Day %',      width: 70,  type: 'number', sortable: true, colorFn: pctColor },
  { field: 'volume',              header: 'Volume',     width: 80,  type: 'number', sortable: true },
  { field: 'atl_ath',             header: 'ATL / ATH',  width: 130, type: 'text',   sortable: true },
  { field: 'atl_ath_per',         header: 'ATL→ATH %', width: 90,  type: 'number', sortable: true, colorFn: pctColor },
  { field: 'atl_amount',          header: 'ATL Amt',    width: 90,  type: 'number', sortable: true },
  { field: 'amount',              header: 'Amount',     width: 90,  type: 'number', sortable: true },
];

export function OptionRange() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [batches, setBatches] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    loadBatchIds();
  }, []);

  async function loadBatchIds() {
    try {
      const res = await optionRangeService.getBatchIds();
      const ids: string[] = res.data ?? [];
      setBatches(ids);
      if (ids.length) {
        setSelectedBatch(ids[0]);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load batch ids');
    }
  }

  async function loadBatch(batchId = selectedBatch) {
    if (!batchId) return;
    setLoading(true);
    try {
      const res = await optionRangeService.getBatch(batchId);
      setData((res.data ?? []).map((o: any) => ({
        ticker: o.ticker,
        underline_ltp: o.underline_ltp,
        change_per_month: o.change_per_month,
        rsi: o.rsi,
        mappDisplayName: o.mappDisplayName,
        current_price: o.current_price,
        day_changeP: o.day_changeP,
        volume: o.volume,
        atl_ath: o.all_time_low != null && o.all_time_high != null
          ? `${o.all_time_low} / ${o.all_time_high}`
          : null,
        atl_ath_per: o.all_time_change_per,
        atl_amount: Math.round((o.all_time_low ?? 0) * (o.lot_size ?? 0)),
        amount: Math.round((o.current_price ?? 0) * (o.lot_size ?? 0)),
      })));
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load batch');
    } finally {
      setLoading(false);
    }
  }

  async function fetchFresh() {
    setLoading(true);
    try {
      const res = await optionRangeService.fetchFresh();
      Alert.alert('Done', `Fetched fresh data — batch: ${res.batch_id} (${res.count} records)`);
      loadBatchIds();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to fetch fresh data');
    } finally {
      setLoading(false);
    }
  }

  function confirmDelete() {
    if (!selectedBatch) return;
    Alert.alert(
      'Delete Batch',
      `Delete "${selectedBatch}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await optionRangeService.deleteBatch(selectedBatch);
              Alert.alert('Deleted', `${res.deletedCount} records removed`);
              setSelectedBatch('');
              setData([]);
              loadBatchIds();
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Failed to delete batch');
            }
          },
        },
      ],
    );
  }

  const batchOptions = batches.map((b) => ({ label: b, value: b }));

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.content}>
      <CollapsibleCard title="Option Range">
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>
        All-time low, all-time high and % change from ATL for each option.
      </Text>

      {/* Controls */}
      <View style={styles.row}>
        <View style={styles.selectWrap}>
          <SelectInput
            label="Batch"
            value={selectedBatch}
            options={batchOptions}
            onChange={setSelectedBatch}
            placeholder="Select batch"
          />
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: '#16a34a' }]}
            onPress={fetchFresh}
            disabled={loading}
          >
            <Text style={styles.iconBtnText}>☁</Text>
          </TouchableOpacity>

          <Text
            style={[styles.btn, { backgroundColor: c.primary, color: '#fff', opacity: selectedBatch ? 1 : 0.5 }]}
            onPress={() => loadBatch()}
          >
            Load
          </Text>

          {data.length > 0 && (
            <Text
              style={[styles.btn, { backgroundColor: '#dc2626', color: '#fff' }]}
              onPress={confirmDelete}
            >
              Delete
            </Text>
          )}
        </View>
      </View>

      {loading && <ActivityIndicator style={{ marginTop: SPACING.md }} color={c.primary} />}

      </CollapsibleCard>

      {data.length > 0 && (
        <DynamicTable
          data={data}
          schema={SCHEMA}
          loading={loading}
          onRefresh={() => loadBatch()}
          title="Option Range"
          emptyText="Select a batch and press Load."
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: SPACING.md, paddingBottom: SPACING.xl },
  subtitle: { fontSize: 13, marginBottom: SPACING.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, alignItems: 'flex-end', marginBottom: SPACING.sm },
  selectWrap: { flex: 1, minWidth: 160 },
  btnRow: { flexDirection: 'row', gap: SPACING.sm },
  btn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, fontSize: 13, fontWeight: '600', overflow: 'hidden' },
  iconBtn: { width: 36, height: 36, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  iconBtnText: { fontSize: 18 },
});

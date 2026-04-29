// ─── Market Signal Component ───────────────────────────────────────────────────

import React, { useCallback, useEffect, useRef, useState } from 'react';
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

type SignalTimeframe = 'weekly' | 'monthly' | 'quarterly';

const TIMEFRAME_OPTIONS: SelectOption<SignalTimeframe>[] = [
  { label: 'Weekly',    value: 'weekly' },
  { label: 'Monthly',   value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
];

const SIGNAL_SCHEMA: DynamicColumn[] = [
  { field: 'ticker',       header: 'Ticker',        width: 100, type: 'text',   sortable: true, filterable: true, copyEnabled: true, copyPrefix: 'NSE:' },
  { field: 'date',         header: 'Date',          width: 110, type: 'text',   sortable: true },
  { field: 'lowestPrice',  header: 'Low Price',     width: 100, type: 'number', sortable: true },
  { field: 'currentPrice', header: 'Price',         width: 90,  type: 'number', sortable: true },
  { field: 'diffPercent',  header: 'Diff %',        width: 90,  type: 'number', sortable: true },
];

export function MarketSignalScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const scrollRef = useRef<ScrollView>(null);

  const [timeframe, setTimeframe] = useState<SignalTimeframe | ''>('');
  const [batches, setBatches]         = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [loading, setLoading]         = useState(false);
  const [data, setData]               = useState<any[]>([]);
  const [refreshing, setRefreshing]   = useState(false);

  // Auto-load batch IDs when component mounts
  useEffect(() => {
    loadBatchIds();
  }, []);

  const onRefresh = useCallback(() => {
    if (!data.length) { setRefreshing(false); return; }
    setRefreshing(true);
    loadBatch(selectedBatch, true).finally(() => {
      setRefreshing(false);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  }, [selectedBatch, data]);

  async function loadBatchIds() {
    try {
      const res = await marketsService.getMarketSignalBatchIds();
      const ids: string[] = res.data ?? [];
      setBatches(ids);
      if (ids.length) setSelectedBatch(ids[0]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load batch ids');
    }
  }

  async function loadBatch(batchId = selectedBatch, silent = false) {
    if (!batchId) return;
    if (!silent) setLoading(true);
    try {
      const res = await marketsService.getMarketSignalBatch(batchId);
      const rows = (res.data ?? [])
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((o: any) => ({
          ticker:       o.ticker,
          date:         o.date,
          lowestPrice:  o.lowestPrice,
          currentPrice: o.currentPrice,
          diffPercent:  o.lowestPrice && o.currentPrice
            ? +((((o.currentPrice - o.lowestPrice) / o.lowestPrice) * 100).toFixed(2))
            : null,
        }));
      setData(rows);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load batch');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function fetchFresh() {
    if (!timeframe) return;
    setLoading(true);
    try {
      const res = await marketsService.getMarketSignals(timeframe);
      Alert.alert('Done', `Fetched ${res.count} signals. Batch saved.`);
      loadBatchIds();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to fetch fresh data');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
    >
      <CollapsibleCard title="Market Signal">
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          RSI crossover signals. Fetch fresh data or load a saved batch.
        </Text>

        {/* Timeframe selector */}
        <View style={styles.inputsRow}>
          <SelectInput
            label="Timeframe"
            options={TIMEFRAME_OPTIONS}
            value={timeframe as SignalTimeframe}
            onChange={(v) => setTimeframe(v)}
            style={{ width: 130 }}
          />
        </View>

        {/* Batch selector */}
        <View style={styles.inputsRow}>
          <SelectInput
            label="Batch"
            value={selectedBatch}
            options={batches.map((b) => ({ label: b, value: b }))}
            onChange={setSelectedBatch}
            placeholder="Select batch"
            style={{ flex: 1, minWidth: 0 }}
          />
        </View>

        <View style={styles.actionsRow}>
          {/* Cloud download */}
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: '#16a34a', opacity: !timeframe || loading ? 0.7 : 1 }]}
            onPress={fetchFresh}
            disabled={!timeframe || loading}
          >
            <Text style={styles.iconBtnText}>☁</Text>
          </TouchableOpacity>

          {/* Load */}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: c.primary, opacity: loading || !selectedBatch ? 0.7 : 1 }]}
            onPress={() => loadBatch()}
            disabled={loading || !selectedBatch}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={[styles.btnText, { color: '#fff' }]}>Load</Text>
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

      {data.length > 0 && (
        <DynamicTable
          data={data}
          schema={SIGNAL_SCHEMA}
          loading={loading}
          onRefresh={() => loadBatch(selectedBatch, true)}
          title="Market Signal"
          emptyText="Select a batch and press Load."
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  content:      { paddingTop: SPACING.md, paddingBottom: SPACING.xl },
  subtitle:     { fontSize: 13, marginBottom: SPACING.sm },
  inputsRow:    { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  actionsRow:   { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center', marginBottom: SPACING.sm, justifyContent: 'flex-end' },
  btn:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, overflow: 'hidden', minWidth: 56, alignItems: 'center', justifyContent: 'center' },
  btnText:      { fontSize: 13, fontWeight: '600' },
  btnIcon:      { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconBtn:      { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  iconBtnText:  { fontSize: 16 },
});


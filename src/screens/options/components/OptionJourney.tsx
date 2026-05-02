// ─── Option Journey Component ──────────────────────────────────────────────────
// Merged: Default (ATL/ATH journey) and Monthly (range with monthly change + RSI)

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
import { SPACING } from '../../../types/constants';
import { DynamicTable } from '../../../components/dynamic-table/DynamicTable';
import { DynamicColumn } from '../../../components/dynamic-table/types';
import { CollapsibleCard } from '../../../components/common/CollapsibleCard';
import { SelectInput } from '../../../components/common/SelectInput';
import { optionJourneyService } from '../services/option-journey.service';
import { optionRangeService } from '../services/option-range.service';

const TYPE_OPTIONS = [
  { label: 'Default', value: 'default' },
  { label: 'Monthly', value: 'monthly' },
];

function pctColor(val: any): string | undefined {
  const n = parseFloat(String(val ?? ''));
  if (isNaN(n)) return undefined;
  return n >= 0 ? '#16a34a' : '#dc2626';
}

const SCHEMA_DEFAULT: DynamicColumn[] = [
  { field: 'ticker',           header: 'Ticker',     width: 80,  type: 'text',   sortable: true, copyEnabled: true, copyPrefix: 'NSE:' },
  { field: 'underline_ltp',    header: 'Stock LTP',  width: 90,  type: 'number', sortable: true },
  { field: 'mappDisplayName',  header: 'Name',       width: 160, type: 'text',   sortable: true, filterable: true, copyEnabled: true, copyPrefix: '' },
  { field: 'current_price',    header: 'Price',      width: 80,  type: 'number', sortable: true },
  { field: 'day_changeP',      header: 'Day %',      width: 70,  type: 'number', sortable: true, colorFn: pctColor },
  { field: 'volume',           header: 'Volume',     width: 80,  type: 'number', sortable: true },
  { field: 'atl_ath',          header: 'ATL / ATH',  width: 130, type: 'text',   sortable: true },
  { field: 'atl_ath_per',      header: 'ATL→ATH %',  width: 90,  type: 'number', sortable: true, colorFn: pctColor },
];

const SCHEMA_MONTHLY: DynamicColumn[] = [
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
];

export function OptionJourney() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [journeyType, setJourneyType] = useState<'default' | 'monthly'>('default');
  const [batches, setBatches] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const isMonthly = journeyType === 'monthly';

  const onRefresh = useCallback(() => {
    if (!data.length) { setRefreshing(false); return; }
    setRefreshing(true);
    loadBatch(selectedBatch, true).finally(() => {
      setRefreshing(false);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  }, [selectedBatch, data, journeyType]);

  useEffect(() => {
    loadBatchIds();
  }, [journeyType]);

  function onTypeChange(newType: string) {
    setSelectedBatch('');
    setData([]);
    setBatches([]);
    setJourneyType(newType as 'default' | 'monthly');
  }

  async function loadBatchIds() {
    setLoading(true);
    try {
      const res = isMonthly
        ? await optionRangeService.getBatchIds()
        : await optionJourneyService.getBatchIds();
      const ids: string[] = res.data ?? [];
      setBatches(ids);
      if (ids.length) setSelectedBatch(ids[0]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load batch ids');
    } finally {
      setLoading(false);
    }
  }

  async function loadBatch(batchId = selectedBatch, silent = false) {
    if (!batchId) return;
    if (!silent) setLoading(true);
    try {
      if (isMonthly) {
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
          atl_ath_per: o.all_time_low && o.all_time_high
            ? parseFloat((((o.all_time_high - o.all_time_low) / o.all_time_low) * 100).toFixed(1))
            : null,
        })));
      } else {
        const res = await optionJourneyService.getBatch(batchId);
        setData((res.data ?? []).map((o: any) => ({
          ticker: o.ticker,
          underline_ltp: o.underline_ltp,
          mappDisplayName: o.mappDisplayName,
          current_price: o.current_price,
          day_changeP: o.day_changeP,
          volume: o.volume,
          atl_ath: o.all_time_low != null && o.all_time_high != null
            ? `${o.all_time_low} / ${o.all_time_high}`
            : null,
          atl_ath_per: o.all_time_low && o.all_time_high
            ? parseFloat((((o.all_time_high - o.all_time_low) / o.all_time_low) * 100).toFixed(1))
            : null,
        })));
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load batch');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function fetchFresh() {
    setLoading(true);
    try {
      const res = isMonthly
        ? await optionRangeService.fetchFresh()
        : await optionJourneyService.fetchFresh();
      Alert.alert('Done', `Fetched fresh data — batch: ${res.batch_id} (${res.count} records)`);
      loadBatchIds();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to fetch fresh data');
    } finally {
      setLoading(false);
    }
  }

  const batchOptions = batches.map((b) => ({ label: b, value: b }));
  const schema = isMonthly ? SCHEMA_MONTHLY : SCHEMA_DEFAULT;

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
    >
      <CollapsibleCard title="Option Journey">
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          {isMonthly
            ? 'All-time low, all-time high and % change from ATL — with monthly change and RSI.'
            : 'Options confirmed at ~₹1k — all-time low, all-time high and % travel from ATL.'}
        </Text>

        {/* Type selector */}
        <View style={styles.inputsRow}>
          <SelectInput
            label="Type"
            value={journeyType}
            options={TYPE_OPTIONS}
            onChange={onTypeChange}
            style={{ width: 120 }}
          />
        </View>

        <View style={styles.inputsRow}>
          <SelectInput
            label="Batch"
            value={selectedBatch}
            options={batchOptions}
            onChange={setSelectedBatch}
            placeholder="Select batch"
            style={{ flex: 1, minWidth: 0 }}
          />
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: '#16a34a' }]}
            onPress={fetchFresh}
            disabled={loading}
          >
            <Text style={styles.iconBtnText}>☁</Text>
          </TouchableOpacity>

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
          schema={schema}
          loading={loading}
          onRefresh={() => loadBatch(selectedBatch, true)}
          title="Option Journey"
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
  inputsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  actionsRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center', marginBottom: SPACING.sm, justifyContent: 'flex-end' },
  btn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, overflow: 'hidden', minWidth: 56, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 13, fontWeight: '600' },
  btnIcon: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  iconBtnText: { fontSize: 16 },
});


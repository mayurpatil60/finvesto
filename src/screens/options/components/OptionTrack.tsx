// ─── Option Track Component ───────────────────────────────────────────────────
// Default (₹1k/₹3k lot-amount)

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
import { Ionicons } from '@expo/vector-icons';
import { optionTrackService } from '../services/option-track.service';

const INDEX_OPTIONS = [
  { label: '0 (₹1k)', value: '0' },
  { label: '1 (₹3k)', value: '1' },
];

const TAG_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Buy', value: 'Buy' },
];

/** Index 0 → amount_target 1000, Index 1 → amount_target 3000 */
function pickByIndex(data: any[], index: number): any[] {
  const target = index === 0 ? 1000 : 3000;
  return data.filter((item) => item.amount_target === target);
}

function pctColor(val: any): string | undefined {
  const n = parseFloat(String(val ?? ''));
  if (isNaN(n)) return undefined;
  return n >= 0 ? '#16a34a' : '#dc2626';
}

const SCHEMA_DEFAULT: DynamicColumn[] = [
  { field: 'ticker',         header: 'Ticker',    width: 80,  type: 'text',   sortable: true, copyEnabled: true, copyPrefix: 'NSE:' },
  { field: 'underline_ltp',  header: 'Stock LTP', width: 90,  type: 'number', sortable: true },
  { field: 'mappDisplayName',header: 'Name',      width: 160, type: 'text',   sortable: true, filterable: true, copyEnabled: true, copyPrefix: '' },
  { field: 'current_price',  header: 'Price',     width: 80,  type: 'number', sortable: true },
  { field: 'day_changeP',    header: 'Day %',     width: 70,  type: 'number', sortable: true, colorFn: pctColor },
  { field: 'volume',         header: 'Volume',    width: 80,  type: 'number', sortable: true },
  { field: 'amount',         header: 'Amount',    width: 85,  type: 'number', sortable: true },
  { field: 'tag',            header: 'Tag',       width: 65,  type: 'text',   sortable: true },
];

/** Strip filter-only fields before passing to table */
function toDisplayDataDefault(items: any[]): any[] {
  return items.map(({ amount_target: _at, ...rest }) => rest);
}

export function OptionTrack() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [batches, setBatches] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState('0');
  const [selectedTag, setSelectedTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [rawBatchData, setRawBatchData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const onRefresh = useCallback(() => {
    if (!data.length) { setRefreshing(false); return; }
    setRefreshing(true);
    loadBatch(selectedBatch, true).finally(() => {
      setRefreshing(false);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  }, [selectedBatch, data, rawBatchData]);

  useEffect(() => {
    loadBatchIds();
  }, []);

  function resetState() {
    setSelectedBatch('');
    setData([]);
    setRawBatchData([]);
    setSelectedTag('');
    setBatches([]);
  }

  async function loadBatchIds() {
    setLoading(true);
    try {
      const res = await optionTrackService.getBatchIds();
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
      const res = await optionTrackService.getBatch(batchId);
      const raw = (res.data ?? []).map((o: any) => ({
        ticker: o.ticker,
        underline_ltp: o.underline_ltp,
        mappDisplayName: o.mappDisplayName,
        current_price: o.current_price,
        day_changeP: o.day_changeP,
        volume: o.volume,
        amount: o.amount,
        amount_target: o.amount_target,
        tag: o.tag ?? '',
      }));
      setRawBatchData(raw);
      setData(toDisplayDataDefault(applyTagFilter(pickByIndex(raw, parseInt(selectedIndex, 10)), selectedTag)));
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load batch');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  function applyTagFilter(items: any[], tag: string): any[] {
    if (!tag) return items;
    return items.filter((o) => o.tag === tag);
  }

  function applyIndex(newIndex: string) {
    setSelectedIndex(newIndex);
    if (rawBatchData.length) {
      setData(toDisplayDataDefault(applyTagFilter(pickByIndex(rawBatchData, parseInt(newIndex, 10)), selectedTag)));
    }
  }

  function applyTagSelection(newTag: string) {
    setSelectedTag(newTag);
    if (rawBatchData.length) {
      setData(toDisplayDataDefault(applyTagFilter(pickByIndex(rawBatchData, parseInt(selectedIndex, 10)), newTag)));
    }
  }

  async function fetchFresh() {
    setLoading(true);
    try {
      const res = await optionTrackService.fetchFresh();
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
              const res = await optionTrackService.deleteBatch(selectedBatch);
              Alert.alert('Deleted', `${res.deletedCount} records removed`);
              setSelectedBatch('');
              setData([]);
              setRawBatchData([]);
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
  const schema = SCHEMA_DEFAULT;

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
      }
    >
      <CollapsibleCard title="Option Track">
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          Options nearest to ₹1,000 and ₹3,000 lot-amount — 2 CE + 2 PE per ticker.
        </Text>

        {/* Batch selector */}
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
            style={[
              styles.btn,
              { backgroundColor: c.primary, opacity: loading || !selectedBatch ? 0.7 : 1 },
            ]}
            onPress={() => loadBatch()}
            disabled={loading || !selectedBatch}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={[styles.btnText, { color: '#fff' }]}>Load</Text>
            )}
          </TouchableOpacity>

          {data.length > 0 && (
            <SelectInput
              label=""
              options={INDEX_OPTIONS}
              value={selectedIndex}
              onChange={applyIndex}
              style={{ width: 110 }}
            />
          )}

          {data.length > 0 && (
            <SelectInput
              label=""
              options={TAG_OPTIONS}
              value={selectedTag}
              onChange={applyTagSelection}
              style={{ width: 90 }}
            />
          )}

          {data.length > 0 && (
            <TouchableOpacity
              style={[styles.btnIcon, { borderColor: c.border, backgroundColor: c.surface }]}
              onPress={() => { setData([]); setRawBatchData([]); setSelectedTag(''); }}
            >
              <Text style={{ color: c.text, fontSize: 15 }}>✕</Text>
            </TouchableOpacity>
          )}

          {data.length > 0 && (
            <TouchableOpacity
              style={[styles.btnIcon, { borderColor: '#dc2626', backgroundColor: '#dc262622' }]}
              onPress={confirmDelete}
              disabled={loading}
            >
              <Ionicons name="trash-outline" size={16} color="#dc2626" />
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
  label: { fontSize: 12, marginBottom: 4 },
  inputsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    justifyContent: 'flex-end',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    overflow: 'hidden',
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 13, fontWeight: '600' },
  btnIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


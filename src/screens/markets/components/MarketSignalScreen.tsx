// ─── Market Signal Component ───────────────────────────────────────────────────

import React, { useCallback, useEffect, useState } from 'react';
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
import { SelectInput } from '../../../components/common/SelectInput';
import { DynamicTable } from '../../../components/dynamic-table/DynamicTable';
import { DynamicColumn } from '../../../components/dynamic-table/types';
import { SPACING } from '../../../types/constants';
import { CollapsibleCard } from '../../../components/common/CollapsibleCard';
import { marketsService } from '../services/markets.service';

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

  const [dateOptions, setDateOptions]   = useState<{ label: string; value: string }[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading]         = useState(false);
  const [data, setData]               = useState<any[]>([]);
  const [refreshing, setRefreshing]   = useState(false);

  // Auto-load dates when component mounts
  useEffect(() => {
    loadDates();
  }, []);

  const onRefresh = useCallback(() => {
    if (!data.length) { setRefreshing(false); return; }
    setRefreshing(true);
    loadSignals(selectedDate, true).finally(() => {
      setRefreshing(false);
    });
  }, [selectedDate, data]);

  async function loadDates() {
    try {
      const res = await marketsService.getMarketSignalDates();
      const ids: string[] = res.data ?? [];
      const allOption = { label: 'ALL', value: 'ALL' };
      const options = [allOption, ...ids.map((d) => ({ label: d, value: d }))];
      setDateOptions(options);
      const first = ids.length ? ids[0] : 'ALL';
      setSelectedDate(first);
    } catch (e: any) {
      setDateOptions([{ label: 'ALL', value: 'ALL' }]);
      setSelectedDate('ALL');
      Alert.alert('Error', e.message ?? 'Failed to load dates');
    }
  }

  async function loadSignals(date = selectedDate, silent = false) {
    if (!date) return;
    if (!silent) setLoading(true);
    try {
      const res = await marketsService.getMarketSignalFromDb(date);
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
      Alert.alert('Error', e.message ?? 'Failed to load signals');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
    >
      <CollapsibleCard title="Signal">
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          Look for stocks with an initial RSI breakout above 60.
        </Text>

        {/* Date selector */}
          <View style={styles.inputsRow}>
            <SelectInput
              label="Date"
              value={selectedDate}
              options={dateOptions}
              onChange={setSelectedDate}
              placeholder="Select date"
              style={{ flex: 1, minWidth: 0 }}
            />
          </View>

          <View style={styles.actionsRow}>
            {/* Load */}
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: c.primary, opacity: loading || !selectedDate ? 0.7 : 1 }]}
              onPress={() => loadSignals()}
              disabled={loading || !selectedDate}
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
          onRefresh={() => loadSignals(selectedDate, true)}
          title="Signal"
          emptyText="Select a date and press Load."
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
});


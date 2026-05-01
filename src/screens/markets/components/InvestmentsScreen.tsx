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
import { SelectInput, SelectOption } from '../../../components/common/SelectInput';
import { DynamicTable } from '../../../components/dynamic-table/DynamicTable';
import { DynamicColumn } from '../../../components/dynamic-table/types';
import { SPACING } from '../../../types/constants';
import { CollapsibleCard } from '../../../components/common/CollapsibleCard';
import { marketsService } from '../services/markets.service';

const DEFAULT_SEGMENT = 'cash';
const DEFAULT_TIMEFRAME = 'quarterly';

const INV_SCHEMA: DynamicColumn[] = [
  { field: 'ticker',    header: 'Ticker',    width: 90,  type: 'text',   sortable: true, filterable: true, copyEnabled: true, copyPrefix: 'NSE:' },
  { field: 'date',      header: 'Date',      width: 100, type: 'text',   sortable: true },
  { field: 'script',    header: 'Script',    width: 80,  type: 'text',   sortable: true },
  { field: 'prevPrice', header: 'Prev Price', width: 90, type: 'number', sortable: true },
];

export function InvestmentsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [dateOptions, setDateOptions] = useState<SelectOption<string>[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('ALL');
  const [datesLoading, setDatesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!dateOptions.length) loadDates();
  }, []);

  async function loadDates() {
    setDatesLoading(true);
    try {
      const res = await marketsService.getInvestmentDates(DEFAULT_SEGMENT, DEFAULT_TIMEFRAME);
      const dates: string[] = Array.isArray(res.data) ? res.data : [];
      const opts: SelectOption<string>[] = [
        { label: 'ALL', value: 'ALL' },
        ...dates.map((d) => ({ label: d, value: d })),
      ];
      setDateOptions(opts);
      setSelectedDate(dates.length ? dates[0] : 'ALL');
    } catch {
      setDateOptions([{ label: 'ALL', value: 'ALL' }]);
      setSelectedDate('ALL');
    } finally {
      setDatesLoading(false);
    }
  }

  const onRefresh = useCallback(() => {
    if (!data.length) { setRefreshing(false); return; }
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, [selectedDate, data]);

  async function loadData() {
    setLoading(true);
    setData([]);
    try {
      const res = await marketsService.getInvestmentsFromDb(DEFAULT_SEGMENT, DEFAULT_TIMEFRAME, selectedDate);
      setData(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
    >
      {/* ── Form card ──────────────────────────────────────────────────── */}
      <CollapsibleCard title="Invest">
        <Text style={[styles.formNote, { color: c.textSecondary }]}>
          Invest in stocks by combining Growth and Value investing strategies.
        </Text>
        <View style={styles.selectsRow}>
          {dateOptions.length > 0 && (
            <SelectInput
              label="Date"
              options={dateOptions}
              value={selectedDate}
              onChange={(v) => setSelectedDate(v)}
            />
          )}
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: c.primary, opacity: (loading || datesLoading) ? 0.7 : 1 }]}
            onPress={loadData}
            disabled={loading || datesLoading}
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

      {/* ── DynamicTable ──────────────────────────────────────────────────── */}
      <DynamicTable
        data={data}
        schema={INV_SCHEMA}
        loading={loading}
        onRefresh={loadData}
        title="Invest"
        emptyText="Select a date, then press Load."
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

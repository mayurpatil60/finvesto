// ─── Investments Component ────────────────────────────────────────────────────

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
import { SPACING } from '../../../types/constants';
import { CollapsibleCard } from '../../../components/common/CollapsibleCard';
import { marketsService } from '../services/markets.service';

type InvType = 'default' | 'momentum';
type InvSegment = 'cash' | 'futures' | 'indices' | 'etf';
type InvTimeframe = 'daily' | 'weekly' | 'monthly' | 'quarterly';

const TYPE_OPTIONS: SelectOption<InvType>[] = [
  { label: 'Default', value: 'default' },
  { label: 'Momentum', value: 'momentum' },
];
const SEGMENT_OPTIONS: SelectOption<InvSegment>[] = [
  { label: 'Cash', value: 'cash' },
  { label: 'Futures', value: 'futures' },
  { label: 'Indices', value: 'indices' },
  { label: 'ETF', value: 'etf' },
];
const TIMEFRAME_OPTIONS: SelectOption<InvTimeframe>[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
];

export function InvestmentsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [type, setType] = useState<InvType>('default');
  const [segment, setSegment] = useState<InvSegment>('cash');
  const [timeframe, setTimeframe] = useState<InvTimeframe>('daily');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  async function loadData() {
    setLoading(true);
    setData([]);
    try {
      const res = await marketsService.getInvestments(type, segment, timeframe);
      setData(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.content}>
      {/* ── Form card ──────────────────────────────────────────────────── */}
      <CollapsibleCard title="Investments">
        <Text style={[styles.formNote, { color: c.textSecondary }]}>
          Chartink backtest investments. Select type, segment and timeframe, then press Load.
        </Text>
        <View style={styles.selectsRow}>
          <SelectInput
            label="Type"
            options={TYPE_OPTIONS}
            value={type}
            onChange={(v) => { setType(v); setData([]); }}
          />
          <SelectInput
            label="Segment"
            options={SEGMENT_OPTIONS}
            value={segment}
            onChange={(v) => { setSegment(v); setData([]); }}
          />
          <SelectInput
            label="Timeframe"
            options={TIMEFRAME_OPTIONS}
            value={timeframe}
            onChange={(v) => { setTimeframe(v); setData([]); }}
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

      {/* ── DynamicTable ──────────────────────────────────────────────────── */}
      <DynamicTable
        data={data}
        loading={loading}
        onRefresh={loadData}

        title="Investments"
        emptyText="Select type, segment and timeframe, then press Load."
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

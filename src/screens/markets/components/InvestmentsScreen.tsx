// ─── Investments Component ────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../components/theme/ThemeProvider';
import { SPACING } from '../../../types/constants';
import { marketsService } from '../services/markets.service';

const TYPES = ['default', 'momentum'];
const SEGMENTS = ['cash', 'futures', 'indices', 'etf'];
const TIMEFRAMES = ['daily', 'weekly', 'monthly', 'quarterly'];

export function InvestmentsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [type, setType] = useState(TYPES[0]);
  const [segment, setSegment] = useState(SEGMENTS[0]);
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[0]);
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

  function ChipRow({ items, selected, onSelect }: { items: string[]; selected: string; onSelect: (v: string) => void }) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {items.map(item => (
          <TouchableOpacity
            key={item}
            style={[styles.chip, { borderColor: c.border, backgroundColor: selected === item ? c.primary : c.surface }]}
            onPress={() => onSelect(item)}
          >
            <Text style={{ color: selected === item ? '#fff' : c.text, fontSize: 12, textTransform: 'capitalize' }}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  function renderItem({ item, index }: { item: any; index: number }) {
    const name = item.stock_name || item.ticker || item.name || `#${index + 1}`;
    const keys = Object.keys(item).filter(k => !['stock_name', 'name'].includes(k) && item[k] !== null && item[k] !== undefined);
    return (
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.cardTitle, { color: c.text }]}>{name}</Text>
        {keys.slice(0, 6).map(key => (
          <View key={key} style={styles.row}>
            <Text style={[styles.key, { color: c.textSecondary }]}>{key}</Text>
            <Text style={[styles.val, { color: c.text }]}>{String(item[key])}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Text style={[styles.label, { color: c.textSecondary }]}>TYPE</Text>
      <ChipRow items={TYPES} selected={type} onSelect={setType} />

      <Text style={[styles.label, { color: c.textSecondary }]}>SEGMENT</Text>
      <ChipRow items={SEGMENTS} selected={segment} onSelect={setSegment} />

      <Text style={[styles.label, { color: c.textSecondary }]}>TIMEFRAME</Text>
      <ChipRow items={TIMEFRAMES} selected={timeframe} onSelect={setTimeframe} />

      <TouchableOpacity
        style={[styles.loadBtn, { backgroundColor: c.primary, opacity: loading ? 0.7 : 1 }]}
        onPress={loadData}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loadBtnText}>Load</Text>}
      </TouchableOpacity>

      <FlatList
        data={data}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? <Text style={[styles.empty, { color: c.textSecondary }]}>No data. Select filters and press Load.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginTop: SPACING.md,
    marginLeft: SPACING.md,
  },
  chipRow: { paddingHorizontal: SPACING.md, marginTop: SPACING.xs },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    marginRight: SPACING.sm,
  },
  loadBtn: {
    margin: SPACING.md,
    borderRadius: 10,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  loadBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  list: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl },
  card: {
    borderRadius: 10,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: SPACING.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  key: { fontSize: 12, flex: 1 },
  val: { fontSize: 12, flex: 1, textAlign: 'right' },
  empty: { textAlign: 'center', marginTop: SPACING.xl, fontSize: 14 },
});

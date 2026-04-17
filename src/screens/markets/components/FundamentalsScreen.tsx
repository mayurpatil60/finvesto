// ─── Fundamentals Component ───────────────────────────────────────────────────

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

const GROUPS = [
  { label: 'All', value: 'all' },
  { label: 'F&O', value: 'fno-stocks' },
  { label: 'ETF', value: 'only-etfs' },
  { label: 'SME', value: 'sme-stocks' },
  { label: 'Non-SME', value: 'non-sme-stocks' },
];

const QUERIES = [
  { label: 'RSI > 60', value: 'prev_rsi < 60 && rsi > 60' },
  { label: 'RSI < 60', value: 'prev_rsi > 60 && rsi < 60' },
  { label: 'RSI > 40', value: 'prev_rsi < 40 && rsi > 40' },
  { label: 'RSI > 30', value: 'prev_rsi < 30 && rsi > 30' },
  { label: 'RSI < 30', value: 'rsi < 30' },
  { label: 'RSI < 40', value: 'rsi < 40' },
  { label: 'All', value: 'currentPrice > 0' },
];

export function FundamentalsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [group, setGroup] = useState(GROUPS[0].value);
  const [query, setQuery] = useState(QUERIES[0].value);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  async function loadData() {
    setLoading(true);
    setData([]);
    try {
      const res = await marketsService.getFundamentals({ group, query });
      // flatten pages
      const flat: any[] = [];
      const pages = Array.isArray(res.data) ? res.data : [res.data];
      for (const page of pages) {
        if (page?.body?.tableHeaders && page?.body?.tableData) {
          const headers = page.body.tableHeaders.map((h: any) => h.unique_name || h.display_name || h);
          for (const row of page.body.tableData) {
            const obj: any = {};
            headers.forEach((key: string, idx: number) => { obj[key] = row[idx]; });
            flat.push(obj);
          }
        }
      }
      setData(flat);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  const DISPLAY_KEYS = ['get_full_name', 'NSEcode', 'currentPrice', 'rsi', 'prev_rsi', 'qtr_changeP'];

  function renderItem({ item, index }: { item: any; index: number }) {
    const name = item.get_full_name || item.NSEcode || `#${index + 1}`;
    return (
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.cardTitle, { color: c.text }]}>{name}</Text>
        {DISPLAY_KEYS.filter(k => k !== 'get_full_name' && item[k] !== undefined).map(key => (
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
      {/* Group chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {GROUPS.map(g => (
          <TouchableOpacity
            key={g.value}
            style={[styles.chip, { borderColor: c.border, backgroundColor: group === g.value ? c.primary : c.surface }]}
            onPress={() => setGroup(g.value)}
          >
            <Text style={{ color: group === g.value ? '#fff' : c.text, fontSize: 12 }}>{g.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Query chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {QUERIES.map(q => (
          <TouchableOpacity
            key={q.value}
            style={[styles.chip, { borderColor: c.border, backgroundColor: query === q.value ? c.primary : c.surface }]}
            onPress={() => setQuery(q.value)}
          >
            <Text style={{ color: query === q.value ? '#fff' : c.text, fontSize: 12 }}>{q.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Load button */}
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
          !loading ? <Text style={[styles.empty, { color: c.textSecondary }]}>No data. Press Load.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chipRow: { paddingHorizontal: SPACING.md, marginTop: SPACING.sm },
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

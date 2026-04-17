// ─── Option Analysis Component ────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
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
import { analysisService } from '../services/analysis.service';

const FILTERS = ['BuyOp', 'NearLow', 'Rsi40', 'Rsi60', 'Amt1k', 'Amt2k', 'Amt5k', 'VolInLakh'];
const DISPLAY_KEYS = ['mappDisplayName', 'bDate', 'bTime', 'expiry', 'strikePrice', 'optionType', 'ltp', 'tag'];

export function OptionAnalysis() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [batches, setBatches] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);

  useEffect(() => { loadBatches(); }, []);
  useEffect(() => { applyFilters(); }, [selectedFilters, data]);

  async function loadBatches() {
    try {
      const res = await analysisService.getBatchIds();
      setBatches(res.data ?? []);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  async function loadBatch() {
    if (!selectedBatch) { Alert.alert('Select a batch first'); return; }
    setLoading(true);
    setData([]);
    try {
      const res = await analysisService.getBatch(selectedBatch);
      const enriched = enrichData(res.data ?? []);
      setData(enriched);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  function enrichData(items: any[]): any[] {
    return items.map(item => {
      const [bDate, bTime] = (item.batch_id || '').split('_');
      const tags: string[] = [];
      if (item.tag) tags.push(item.tag);
      return { ...item, bDate, bTime };
    });
  }

  function applyFilters() {
    if (!selectedFilters.length) { setFiltered(data); return; }
    setFiltered(data.filter(item =>
      selectedFilters.some(f => item.tag?.includes(f))
    ));
  }

  function toggleFilter(f: string) {
    setSelectedFilters(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    );
  }

  function renderItem({ item }: { item: any }) {
    return (
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.cardTitle, { color: c.text }]}>
          {item.mappDisplayName || item.stockName || item.name || '—'}
        </Text>
        {DISPLAY_KEYS.filter(k => k !== 'mappDisplayName' && item[k] !== undefined && item[k] !== null).map(key => (
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
      {/* Batch selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {batches.map(b => (
          <TouchableOpacity
            key={b}
            style={[styles.chip, { borderColor: c.border, backgroundColor: selectedBatch === b ? c.primary : c.surface }]}
            onPress={() => setSelectedBatch(b)}
          >
            <Text style={{ color: selectedBatch === b ? '#fff' : c.text, fontSize: 11 }}>{b.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, { borderColor: c.border, backgroundColor: selectedFilters.includes(f) ? c.primary : c.surface }]}
            onPress={() => toggleFilter(f)}
          >
            <Text style={{ color: selectedFilters.includes(f) ? '#fff' : c.text, fontSize: 11 }}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Load button */}
      <TouchableOpacity
        style={[styles.loadBtn, { backgroundColor: c.primary, opacity: loading ? 0.7 : 1 }]}
        onPress={loadBatch}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loadBtnText}>Load  ({filtered.length})</Text>}
      </TouchableOpacity>

      <FlatList
        data={filtered}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? <Text style={[styles.empty, { color: c.textSecondary }]}>Select a batch and press Load.</Text> : null
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

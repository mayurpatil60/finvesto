// ─── IPO Component ────────────────────────────────────────────────────────────

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

type IpoTab = 'Open' | 'Listing Soon' | 'Recently Listed' | 'Listed';
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

export function IpoScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [tab, setTab] = useState<IpoTab>('Open');
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  async function loadData() {
    setLoading(true);
    setData([]);
    try {
      if (tab === 'Listed') {
        const res = await marketsService.getIpoListed(selectedYear);
        setData(Array.isArray(res.data) ? res.data : []);
      } else {
        const res = await marketsService.getIpoUpcoming();
        const body = res.data as any;
        if (tab === 'Open') setData(body?.upcoming_open ?? []);
        else if (tab === 'Listing Soon') setData(body?.listing_soon ?? []);
        else if (tab === 'Recently Listed') setData(body?.recently_listed ?? []);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  function renderItem({ item, index }: { item: any; index: number }) {
    const name = item.company_name || `#${index + 1}`;
    // pick meaningful flat scalar fields, skip objects/arrays
    const entries = Object.entries(item).filter(
      ([, v]) => v !== null && v !== undefined && v !== '' && typeof v !== 'object',
    ) as [string, string | number | boolean][];
    return (
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.cardTitle, { color: c.text }]}>{name}</Text>
        {entries.filter(([k]) => k !== 'company_name').slice(0, 8).map(([key, val]) => (
          <View key={key} style={styles.row}>
            <Text style={[styles.key, { color: c.textSecondary }]}>{key.replace(/_/g, ' ')}</Text>
            <Text style={[styles.val, { color: c.text }]}>{String(val)}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* Tab toggle */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow}>
        {(['Open', 'Listing Soon', 'Recently Listed', 'Listed'] as IpoTab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabChip, { borderColor: c.border, backgroundColor: tab === t ? c.primary : c.surface }]}
            onPress={() => { setTab(t); setData([]); }}
          >
            <Text style={{ color: tab === t ? '#fff' : c.textSecondary, fontSize: 12, fontWeight: '600' }}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Year picker (Listed only) */}
      {tab === 'Listed' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearRow}>
          {YEARS.map(y => (
            <TouchableOpacity
              key={y}
              style={[styles.chip, { borderColor: c.border, backgroundColor: selectedYear === y ? c.primary : c.surface }]}
              onPress={() => setSelectedYear(y)}
            >
              <Text style={{ color: selectedYear === y ? '#fff' : c.text, fontSize: 13 }}>{y}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Load button */}
      <TouchableOpacity
        style={[styles.loadBtn, { backgroundColor: c.primary, opacity: loading ? 0.7 : 1 }]}
        onPress={loadData}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loadBtnText}>Load</Text>}
      </TouchableOpacity>

      {/* Results */}
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
  tabRow: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  tabChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    marginRight: SPACING.sm,
  },
  yearRow: { paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    marginRight: SPACING.sm,
  },
  loadBtn: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
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

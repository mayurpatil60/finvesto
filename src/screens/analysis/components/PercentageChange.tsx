// ─── Percentage Change Component ─────────────────────────────────────────────
// Shows multiple price entries and calculates % change from first entry.

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../components/theme/ThemeProvider';
import { SPACING } from '../../../types/constants';
import { analysisService } from '../services/analysis.service';

export function PercentageChange() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);

  async function load() {
    if (!name.trim()) { Alert.alert('Validation', 'Enter an option name.'); return; }
    setLoading(true);
    setRows([]);
    try {
      const res = await analysisService.getByName(name.trim());
      const sorted = (res.data ?? [])
        .map((item: any) => {
          const [bDate, bTime] = (item.batch_id || '').split('_');
          return { ...item, bDate, bTime };
        })
        .sort((a: any, b: any) => {
          const da = `${a.bDate}_${a.bTime}`;
          const db = `${b.bDate}_${b.bTime}`;
          return da > db ? 1 : da < db ? -1 : 0;
        });

      if (!sorted.length) { setRows([]); return; }

      const basePrice = Number(sorted[0].ltp ?? sorted[0].lastPrice ?? 0);
      const enriched = sorted.map((item: any, idx: number) => {
        const ltp = Number(item.ltp ?? item.lastPrice ?? 0);
        const change = basePrice !== 0 ? (((ltp - basePrice) / Math.abs(basePrice)) * 100).toFixed(2) : '—';
        return { ...item, changeP: change, isFirst: idx === 0 };
      });
      setRows(enriched);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  function renderItem({ item }: { item: any }) {
    const pct = parseFloat(item.changeP);
    const isPositive = pct > 0;
    const color = item.isFirst ? c.text : isPositive ? '#16a34a' : pct < 0 ? '#dc2626' : c.text;
    return (
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: c.text }]}>
              {item.mappDisplayName || item.stockName || item.name || '—'}
            </Text>
            <Text style={[styles.sub, { color: c.textSecondary }]}>{item.bDate} {item.bTime}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.ltp, { color: c.text }]}>₹{item.ltp ?? item.lastPrice ?? '—'}</Text>
            <Text style={[styles.changeP, { color }]}>
              {item.isFirst ? 'Base' : `${isPositive ? '+' : ''}${item.changeP}%`}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surface, flex: 1 }]}
          value={name}
          onChangeText={setName}
          placeholder="Option name (e.g. NIFTY25MAY24000CE)"
          placeholderTextColor={c.textSecondary}
          autoCapitalize="characters"
          returnKeyType="search"
          onSubmitEditing={load}
        />
        <TouchableOpacity
          style={[styles.goBtn, { backgroundColor: c.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={load}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.goBtnText}>Go</Text>}
        </TouchableOpacity>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? <Text style={[styles.empty, { color: c.textSecondary }]}>Enter an option name to see % change over time.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inputRow: {
    flexDirection: 'row',
    margin: SPACING.md,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 14,
  },
  goBtn: {
    borderRadius: 8,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  goBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  list: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl },
  card: {
    borderRadius: 10,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 14, fontWeight: '600' },
  sub: { fontSize: 11, marginTop: 2 },
  ltp: { fontSize: 15, fontWeight: '700' },
  changeP: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  empty: { textAlign: 'center', marginTop: SPACING.xl, fontSize: 14 },
});

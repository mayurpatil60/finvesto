// ─── Option Selection Component ───────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../components/theme/ThemeProvider';
import { SPACING } from '../../../types/constants';
import { analysisService } from '../services/analysis.service';

const LEVELS = [1, 2, 3, 4, 5, 7, 10, 15, 20, 30];
const DISPLAY_KEYS = ['name', 'strikePrice', 'optionType', 'ltp', 'iv', 'oi', 'volume', 'contract_id'];

export function OptionSelection() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [symbols, setSymbols] = useState('');
  const [expiry, setExpiry] = useState('');
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    analysisService.getExpiry().then(r => {
      if (r.expiryDate) setExpiry(r.expiryDate);
    }).catch(() => {});
  }, []);

  async function loadOptions() {
    if (!symbols.trim() || !expiry.trim()) {
      Alert.alert('Validation', 'Enter symbols and expiry date.');
      return;
    }
    setLoading(true);
    setData([]);
    try {
      const res = await analysisService.getOptionChain(symbols.trim(), expiry.trim());
      const table: any[] = res.data?.tableDataV2 ?? res.data?.tableData ?? [];
      const basePrice: number = res.data?.stockLevelData?.currentPrice ?? 0;
      const selected = pickByLevel(table, basePrice, level);
      setData(selected);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  function pickByLevel(table: any[], basePrice: number, lvl: number): any[] {
    const results: any[] = [];
    for (const row of table) {
      const calls: any[] = row.c ?? [];
      const puts: any[] = row.p ?? [];
      for (const opt of [...calls, ...puts]) {
        const sp = Number(opt.strikePrice ?? opt.strike_price ?? 0);
        if (Math.abs(sp - basePrice) / (basePrice || 1) <= (lvl * 0.01)) {
          results.push({ ...opt, optionType: calls.includes(opt) ? 'CE' : 'PE' });
        }
      }
    }
    return results.slice(0, 50);
  }

  function renderItem({ item }: { item: any }) {
    const name = item.name || item.mappDisplayName || item.symbol || '—';
    return (
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.cardTitle, { color: c.text }]}>{name} — {item.optionType}</Text>
        {DISPLAY_KEYS.filter(k => k !== 'name' && k !== 'optionType' && item[k] !== undefined && item[k] !== null).map(key => (
          <View key={key} style={styles.row}>
            <Text style={[styles.key, { color: c.textSecondary }]}>{key.replace(/_/g, ' ')}</Text>
            <Text style={[styles.val, { color: c.text }]}>{String(item[key])}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.fieldArea}>
        <TextInput
          style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surface }]}
          value={symbols}
          onChangeText={setSymbols}
          placeholder="Symbols (e.g. NIFTY, BANKNIFTY)"
          placeholderTextColor={c.textSecondary}
          autoCapitalize="characters"
        />
        <TextInput
          style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surface }]}
          value={expiry}
          onChangeText={setExpiry}
          placeholder="Expiry (e.g. 2025-05-29)"
          placeholderTextColor={c.textSecondary}
          autoCapitalize="none"
        />
      </View>

      {/* Level chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {LEVELS.map(l => (
          <TouchableOpacity
            key={l}
            style={[styles.chip, { borderColor: c.border, backgroundColor: level === l ? c.primary : c.surface }]}
            onPress={() => setLevel(l)}
          >
            <Text style={{ color: level === l ? '#fff' : c.text, fontSize: 12 }}>{l}%</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.loadBtn, { backgroundColor: c.primary, opacity: loading ? 0.7 : 1 }]}
        onPress={loadOptions}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loadBtnText}>Load Options</Text>}
      </TouchableOpacity>

      <FlatList
        data={data}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? <Text style={[styles.empty, { color: c.textSecondary }]}>Enter symbols, expiry and load.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fieldArea: { padding: SPACING.md, gap: SPACING.sm },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 14,
  },
  chipRow: { paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
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

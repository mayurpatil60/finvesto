// ─── Option Search / History Component ───────────────────────────────────────

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

const DISPLAY_KEYS = ['mappDisplayName', 'bDate', 'bTime', 'expiry', 'strikePrice', 'optionType', 'ltp', 'tag'];

export function OptionSearch() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  async function search() {
    if (!name.trim()) { Alert.alert('Validation', 'Enter an option name to search.'); return; }
    setLoading(true);
    setData([]);
    try {
      const res = await analysisService.getByName(name.trim());
      const enriched = (res.data ?? []).map((item: any) => {
        const [bDate, bTime] = (item.batch_id || '').split('_');
        return { ...item, bDate, bTime };
      }).sort((a: any, b: any) => {
        const da = `${a.bDate}_${a.bTime}`;
        const db = `${b.bDate}_${b.bTime}`;
        return da > db ? -1 : da < db ? 1 : 0;
      });
      setData(enriched);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  function renderItem({ item }: { item: any }) {
    return (
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.cardTitle, { color: c.text }]}>
          {item.mappDisplayName || item.stockName || '—'}
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
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surface, flex: 1 }]}
          value={name}
          onChangeText={setName}
          placeholder="Search option name…"
          placeholderTextColor={c.textSecondary}
          autoCapitalize="characters"
          returnKeyType="search"
          onSubmitEditing={search}
        />
        <TouchableOpacity
          style={[styles.searchBtn, { backgroundColor: c.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={search}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.searchBtnText}>Search</Text>}
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? <Text style={[styles.empty, { color: c.textSecondary }]}>No results. Enter a name and search.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SPACING.md,
    gap: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 14,
  },
  searchBtn: {
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
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

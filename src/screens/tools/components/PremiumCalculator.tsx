// ─── Premium Calculator ───────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../components/theme/ThemeProvider';
import { SPACING } from '../../../types/constants';

const PERCENTAGE_OPTIONS = [
  { label: '1%', value: 1 },
  { label: '2%', value: 2 },
  { label: '3%', value: 3 },
  { label: '5%', value: 5 },
  { label: '7%', value: 7 },
  { label: '10%', value: 10 },
  { label: '12%', value: 12 },
  { label: '15%', value: 15 },
  { label: '17%', value: 17 },
  { label: '20%', value: 20 },
];

export function PremiumCalculator() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [price, setPrice] = useState('');
  const [selectedPct, setSelectedPct] = useState<number | null>(null);
  const [callResult, setCallResult] = useState<string | null>(null);
  const [putResult, setPutResult] = useState<string | null>(null);

  const isValid = () =>
    price.trim() !== '' && !isNaN(Number(price)) && selectedPct !== null;

  const calculate = () => {
    const p = Number(price);
    const pct = selectedPct! / 100;
    setCallResult((p * (1 + pct)).toFixed(2));
    setPutResult((p * (1 - pct)).toFixed(2));
  };

  const reset = () => {
    setPrice('');
    setSelectedPct(null);
    setCallResult(null);
    setPutResult(null);
  };

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      {/* Header */}
      <Text style={[styles.title, { color: c.text }]}>Premium Calculator</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>
        Enter a price and select a percentage to calculate expected call and put premium values.
      </Text>

      {/* Price input */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: c.textSecondary }]}>Price</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.surfaceVariant, borderColor: c.border, color: c.text }]}
          placeholder="Enter price"
          placeholderTextColor={c.textSecondary}
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />
      </View>

      {/* Percentage selector */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: c.textSecondary }]}>Percentage</Text>
        <View style={styles.pctRow}>
          {PERCENTAGE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.pctChip,
                { borderColor: c.border, backgroundColor: c.surfaceVariant },
                selectedPct === opt.value && { backgroundColor: c.primary, borderColor: c.primary },
              ]}
              onPress={() => setSelectedPct(opt.value)}
            >
              <Text
                style={[
                  styles.pctChipText,
                  { color: c.textSecondary },
                  selectedPct === opt.value && { color: '#FFFFFF' },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary, { backgroundColor: c.primary }, !isValid() && styles.btnDisabled]}
          onPress={calculate}
          disabled={!isValid()}
        >
          <Text style={styles.btnText}>Submit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary, { borderColor: c.border }]}
          onPress={reset}
        >
          <Text style={[styles.btnText, { color: c.text }]}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Result */}
      {callResult !== null && putResult !== null && (
        <View style={[styles.resultRow, { borderTopColor: c.border }]}>
          <View style={styles.resultItem}>
            <Text style={[styles.resultLabel, { color: c.textSecondary }]}>Call</Text>
            <Text style={[styles.resultValue, { color: c.secondary }]}>{callResult}</Text>
          </View>
          <View style={[styles.resultDivider, { backgroundColor: c.border }]} />
          <View style={styles.resultItem}>
            <Text style={[styles.resultLabel, { color: c.textSecondary }]}>Put</Text>
            <Text style={[styles.resultValue, { color: c.error }]}>{putResult}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    fontSize: 14,
  },
  pctRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  pctChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  pctChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  btn: {
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  btnPrimary: {
    minWidth: 80,
    alignItems: 'center',
  },
  btnSecondary: {
    borderWidth: 1,
    minWidth: 40,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  resultRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
  },
  resultItem: {
    flex: 1,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  resultDivider: {
    width: 1,
    marginHorizontal: SPACING.sm,
  },
});

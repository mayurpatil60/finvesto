// ─── Percentage Calculator ────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../components/theme/ThemeProvider';
import { CollapsibleCard } from '../../../components/common/CollapsibleCard';
import { SPACING } from '../../../types/constants';

export function PercentageCalculator() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const isValid = () =>
    value1.trim() !== '' &&
    value2.trim() !== '' &&
    !isNaN(Number(value1)) &&
    !isNaN(Number(value2)) &&
    Number(value1) !== 0;

  const calculate = () => {
    const v1 = Number(value1);
    const v2 = Number(value2);
    const pct = (((v2 - v1) / Math.abs(v1)) * 100).toFixed(2);
    setResult(pct);
  };

  const reset = () => {
    setValue1('');
    setValue2('');
    setResult(null);
  };

  return (
    <CollapsibleCard title="Percentage Calculator">
      {/* Subtitle */}
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>
        Enter two values to calculate the percentage change between them.
      </Text>

      {/* Inputs */}
      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Value 1</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.surfaceVariant, borderColor: c.border, color: c.text }]}
            placeholder="Enter value"
            placeholderTextColor={c.textSecondary}
            keyboardType="numeric"
            value={value1}
            onChangeText={setValue1}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Value 2</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.surfaceVariant, borderColor: c.border, color: c.text }]}
            placeholder="Enter value"
            placeholderTextColor={c.textSecondary}
            keyboardType="numeric"
            value={value2}
            onChangeText={setValue2}
          />
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

        {(result !== null || value1 !== '' || value2 !== '') && (
          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary, { borderColor: c.border }]}
            onPress={reset}
          >
            <Text style={[styles.btnText, { color: c.text }]}>✕</Text>
          </TouchableOpacity>
        )}

        {result !== null && (
          <Text style={[styles.result, { color: c.primary }]}>{result}%</Text>
        )}
      </View>
    </CollapsibleCard>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 12,
    marginBottom: SPACING.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  inputGroup: {
    flex: 1,
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
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 13,
    fontWeight: '500',
  },
  result: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: SPACING.sm,
  },
});

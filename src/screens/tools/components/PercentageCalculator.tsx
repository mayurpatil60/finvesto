// ─── Percentage Calculators ───────────────────────────────────────────────────
// Three sentence-style calculators in collapsible cards

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

// ── Shared inline input ──────────────────────────────────────────────────────
function InlineInput({ value, onChange, placeholder, colors }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  colors: any;
}) {
  return (
    <TextInput
      style={[styles.inlineInput, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, color: colors.text }]}
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      keyboardType="numeric"
      value={value}
      onChangeText={onChange}
    />
  );
}

// ── Calculator 1: % Change ────────────────────────────────────────────────────
export function PercentChangeCalculator() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [result, setResult] = useState<number | null>(null);

  const isValid = () => from.trim() !== '' && to.trim() !== '' && !isNaN(Number(from)) && Number(from) !== 0;

  const calculate = () => {
    const pct = ((Number(to) - Number(from)) / Math.abs(Number(from))) * 100;
    setResult(Math.round(pct * 100) / 100);
  };

  const reset = () => { setFrom(''); setTo(''); setResult(null); };

  const resultColor = result === null ? c.text : result >= 0 ? '#16a34a' : '#dc2626';
  const resultLabel = result === null ? null : `${result >= 0 ? '+' : ''}${result}%`;

  return (
    <CollapsibleCard title="% Change">
      <View style={styles.sentenceRow}>
        <Text style={[styles.word, { color: c.text }]}>What is the % change from</Text>
        <InlineInput value={from} onChange={setFrom} placeholder="100" colors={c} />
        <Text style={[styles.word, { color: c.text }]}>to</Text>
        <InlineInput value={to} onChange={setTo} placeholder="150" colors={c} />
        <Text style={[styles.word, { color: c.text }]}>?</Text>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: c.primary, opacity: isValid() ? 1 : 0.5 }]} onPress={calculate} disabled={!isValid()}>
          <Text style={styles.btnText}>Calculate</Text>
        </TouchableOpacity>
        {(from || to || result !== null) && (
          <TouchableOpacity style={[styles.btnIcon, { borderColor: c.border, backgroundColor: c.surface }]} onPress={reset}>
            <Text style={{ color: c.text, fontSize: 15 }}>✕</Text>
          </TouchableOpacity>
        )}
        {resultLabel && <Text style={[styles.result, { color: resultColor }]}>{resultLabel}</Text>}
      </View>
    </CollapsibleCard>
  );
}

// ── Calculator 2: % of a Number ───────────────────────────────────────────────
export function PercentOfNumberCalculator() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [pct, setPct] = useState('');
  const [num, setNum] = useState('');
  const [result, setResult] = useState<number | null>(null);

  const isValid = () => pct.trim() !== '' && num.trim() !== '' && !isNaN(Number(pct)) && !isNaN(Number(num));

  const calculate = () => {
    setResult(Math.round((Number(pct) / 100) * Number(num) * 100) / 100);
  };

  const reset = () => { setPct(''); setNum(''); setResult(null); };

  return (
    <CollapsibleCard title="% of a Number">
      <View style={styles.sentenceRow}>
        <Text style={[styles.word, { color: c.text }]}>What is</Text>
        <InlineInput value={pct} onChange={setPct} placeholder="25" colors={c} />
        <Text style={[styles.word, { color: c.text }]}>% of</Text>
        <InlineInput value={num} onChange={setNum} placeholder="200" colors={c} />
        <Text style={[styles.word, { color: c.text }]}>?</Text>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: c.primary, opacity: isValid() ? 1 : 0.5 }]} onPress={calculate} disabled={!isValid()}>
          <Text style={styles.btnText}>Calculate</Text>
        </TouchableOpacity>
        {(pct || num || result !== null) && (
          <TouchableOpacity style={[styles.btnIcon, { borderColor: c.border, backgroundColor: c.surface }]} onPress={reset}>
            <Text style={{ color: c.text, fontSize: 15 }}>✕</Text>
          </TouchableOpacity>
        )}
        {result !== null && <Text style={[styles.result, { color: c.primary }]}>{result}</Text>}
      </View>
    </CollapsibleCard>
  );
}

// ── Calculator 3: Value as % of Total ────────────────────────────────────────
export function ValueAsPercentCalculator() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [val, setVal] = useState('');
  const [total, setTotal] = useState('');
  const [result, setResult] = useState<number | null>(null);

  const isValid = () => val.trim() !== '' && total.trim() !== '' && !isNaN(Number(val)) && !isNaN(Number(total)) && Number(total) !== 0;

  const calculate = () => {
    setResult(Math.round((Number(val) / Number(total)) * 100 * 100) / 100);
  };

  const reset = () => { setVal(''); setTotal(''); setResult(null); };

  return (
    <CollapsibleCard title="Value as % of Total">
      <View style={styles.sentenceRow}>
        <InlineInput value={val} onChange={setVal} placeholder="50" colors={c} />
        <Text style={[styles.word, { color: c.text }]}>is what % of</Text>
        <InlineInput value={total} onChange={setTotal} placeholder="200" colors={c} />
        <Text style={[styles.word, { color: c.text }]}>?</Text>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: c.primary, opacity: isValid() ? 1 : 0.5 }]} onPress={calculate} disabled={!isValid()}>
          <Text style={styles.btnText}>Calculate</Text>
        </TouchableOpacity>
        {(val || total || result !== null) && (
          <TouchableOpacity style={[styles.btnIcon, { borderColor: c.border, backgroundColor: c.surface }]} onPress={reset}>
            <Text style={{ color: c.text, fontSize: 15 }}>✕</Text>
          </TouchableOpacity>
        )}
        {result !== null && <Text style={[styles.result, { color: c.primary }]}>{result}%</Text>}
      </View>
    </CollapsibleCard>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  sentenceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.xs ?? 6,
    marginBottom: SPACING.sm,
  },
  word: {
    fontSize: 14,
  },
  inlineInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    width: 72,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    justifyContent: 'flex-end',
  },
  btn: {
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  btnIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  result: {
    fontSize: 18,
    fontWeight: '700',
  },
});


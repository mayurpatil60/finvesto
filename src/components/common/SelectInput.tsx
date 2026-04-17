// ─── SelectInput ──────────────────────────────────────────────────────────────
// A labeled dropdown-style selector using a bottom modal sheet.

import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { SPACING } from '../../types/constants';

export interface SelectOption<T = string> {
  label: string;
  value: T;
}

interface Props<T> {
  label: string;
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
}

export function SelectInput<T extends string | number>({ label, options, value, onChange, placeholder }: Props<T>) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [open, setOpen] = useState(false);

  const selected = options.find(o => o.value === value);

  return (
    <>
      <View style={styles.wrapper}>
        <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text>
        <TouchableOpacity
          style={[styles.trigger, { backgroundColor: c.surface, borderColor: c.border }]}
          onPress={() => setOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.triggerText, { color: selected ? c.text : c.textSecondary }]}>
            {selected ? selected.label : (placeholder ?? 'Select…')}
          </Text>
          <Text style={[styles.caret, { color: c.textSecondary }]}>▾</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <View style={[styles.sheet, { backgroundColor: c.surface, borderTopColor: c.border }]}>
          <Text style={[styles.sheetTitle, { color: c.textSecondary }]}>{label}</Text>
          <FlatList
            data={options}
            keyExtractor={item => String(item.value)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.option,
                  { borderBottomColor: c.border },
                  item.value === value && { backgroundColor: c.primary + '18' },
                ]}
                onPress={() => { onChange(item.value); setOpen(false); }}
              >
                <Text style={[styles.optionText, { color: item.value === value ? c.primary : c.text }]}>
                  {item.label}
                </Text>
                {item.value === value && <Text style={{ color: c.primary }}>✓</Text>}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, minWidth: 120 },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 5 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: 9,
    gap: SPACING.sm,
  },
  triggerText: { fontSize: 14, flex: 1 },
  caret: { fontSize: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: 360,
    paddingBottom: SPACING.xl,
  },
  sheetTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: { fontSize: 15 },
});

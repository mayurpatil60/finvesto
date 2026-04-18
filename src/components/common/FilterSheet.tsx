// ─── FilterSheet ─────────────────────────────────────────────────────────────
// Reusable bottom sheet for multi-select tag filters.
// Groups: array of { label, options: [{label,value}] }
// Selected values are keyed per group.

import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { SPACING } from '../../types/constants';

export interface FilterGroup {
  label: string;
  options: { label: string; value: string }[];
}

interface Props {
  visible: boolean;
  onClose: () => void;
  groups: FilterGroup[];
  selected: string[];
  onApply: (selected: string[]) => void;
}

export function FilterSheet({ visible, onClose, groups, selected, onApply }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const [local, setLocal] = useState<string[]>(selected);

  // Sync local state when sheet opens
  React.useEffect(() => {
    if (visible) setLocal(selected);
  }, [visible]);

  function toggle(val: string) {
    setLocal(prev =>
      prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]
    );
  }

  function handleApply() {
    onApply(local);
    onClose();
  }

  function handleReset() {
    setLocal([]);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={[styles.sheet, { backgroundColor: c.surface, borderTopColor: c.border }]}>
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: c.border }]} />

        {/* Title */}
        <View style={[styles.header, { borderBottomColor: c.border }]}>
          <Text style={[styles.title, { color: c.text }]}>Filters</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-outline" size={22} color={c.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Groups */}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {groups.map(group => (
            <View key={group.label} style={styles.group}>
              {group.label ? (
                <Text style={[styles.groupLabel, { color: c.textSecondary }]}>{group.label.toUpperCase()}</Text>
              ) : null}
              <View style={styles.optionsRow}>
                {group.options.map(opt => {
                  const active = local.includes(opt.value);
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.optionChip,
                        { borderColor: active ? c.primary : c.border, backgroundColor: active ? c.primary : c.background },
                      ]}
                      onPress={() => toggle(opt.value)}
                    >
                      <Text style={[styles.optionText, { color: active ? '#fff' : c.text }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: c.border }]}>
          <TouchableOpacity
            style={[styles.footerBtn, styles.footerBtnOutline, { borderColor: c.border }]}
            onPress={handleReset}
          >
            <Text style={[styles.footerBtnText, { color: c.text }]}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.footerBtn, { backgroundColor: c.primary }]}
            onPress={handleApply}
          >
            <Text style={[styles.footerBtnText, { color: '#fff' }]}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    maxHeight: '75%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  title: { fontSize: 15, fontWeight: '600' },
  scroll: { flexGrow: 0 },
  scrollContent: { padding: SPACING.md, gap: SPACING.md },
  group: { gap: SPACING.sm },
  groupLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  optionChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  optionText: { fontSize: 13, fontWeight: '500' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  footerBtn: {
    borderRadius: 8,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  footerBtnOutline: { borderWidth: 1 },
  footerBtnText: { fontSize: 14, fontWeight: '600' },
});

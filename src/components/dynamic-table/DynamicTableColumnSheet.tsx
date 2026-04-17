// ─── DynamicTableColumnSheet ──────────────────────────────────────────────────
// Bottom-sheet modal for column visibility toggle and reordering.

import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { SPACING } from '../../types/constants';
import { DynamicColumn } from './types';

interface Props {
  visible: boolean;
  columns: DynamicColumn[];
  onClose: () => void;
  onChange: (cols: DynamicColumn[]) => void;
}

export function DynamicTableColumnSheet({ visible, columns, onClose, onChange }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? columns.filter(col => col.header.toLowerCase().includes(search.toLowerCase()) || col.field.toLowerCase().includes(search.toLowerCase()))
    : columns;

  function toggleVisible(field: string) {
    onChange(columns.map(col => col.field === field ? { ...col, visible: !(col.visible ?? true) } : col));
  }

  function moveUp(field: string) {
    const idx = columns.findIndex(col => col.field === field);
    if (idx <= 0) return;
    const arr = [...columns];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    onChange(arr);
  }

  function moveDown(field: string) {
    const idx = columns.findIndex(col => col.field === field);
    if (idx < 0 || idx >= columns.length - 1) return;
    const arr = [...columns];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    onChange(arr);
  }

  function showAll() { onChange(columns.map(col => ({ ...col, visible: true }))); }
  function hideAll() { onChange(columns.map(col => ({ ...col, visible: false }))); }

  const visibleCount = columns.filter(c => c.visible !== false).length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: c.surface }]}>
        {/* Handle bar */}
        <View style={[styles.handle, { backgroundColor: c.border }]} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: c.text }]}>
            Columns <Text style={[styles.sheetSubtitle, { color: c.textSecondary }]}>({visibleCount}/{columns.length} visible)</Text>
          </Text>
          <View style={styles.sheetHeaderActions}>
            <TouchableOpacity onPress={showAll} style={styles.headerActionBtn}>
              <Text style={[styles.headerActionText, { color: c.primary }]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={hideAll} style={styles.headerActionBtn}>
              <Text style={[styles.headerActionText, { color: c.textSecondary }]}>None</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.closeBtn, { color: c.text }]}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search within columns */}
        <View style={[styles.colSearch, { borderColor: c.border, backgroundColor: c.background }]}>
          <TextInput
            style={[styles.colSearchInput, { color: c.text }]}
            placeholderTextColor={c.textSecondary}
            placeholder="Find column…"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: c.textSecondary, fontSize: 12 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Column list */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.field}
          style={styles.list}
          renderItem={({ item, index }) => {
            const isVisible = item.visible !== false;
            const realIdx = columns.findIndex(c => c.field === item.field);
            return (
              <View style={[styles.colRow, { borderBottomColor: c.border }]}>
                {/* Visibility toggle */}
                <TouchableOpacity
                  style={[styles.checkbox, {
                    backgroundColor: isVisible ? c.primary : 'transparent',
                    borderColor: isVisible ? c.primary : c.border,
                  }]}
                  onPress={() => toggleVisible(item.field)}
                >
                  {isVisible && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>

                {/* Column info */}
                <View style={styles.colInfo}>
                  <Text style={[styles.colHeader, { color: c.text }]}>{item.header}</Text>
                  <Text style={[styles.colField, { color: c.textSecondary }]}>{item.field}</Text>
                </View>

                {/* Reorder buttons */}
                {!search.trim() && (
                  <View style={styles.reorderBtns}>
                    <TouchableOpacity
                      style={[styles.reorderBtn, { borderColor: c.border, opacity: realIdx === 0 ? 0.3 : 1 }]}
                      onPress={() => moveUp(item.field)}
                      disabled={realIdx === 0}
                    >
                      <Text style={[styles.reorderBtnText, { color: c.text }]}>↑</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.reorderBtn, { borderColor: c.border, opacity: realIdx === columns.length - 1 ? 0.3 : 1 }]}
                      onPress={() => moveDown(item.field)}
                      disabled={realIdx === columns.length - 1}
                    >
                      <Text style={[styles.reorderBtnText, { color: c.text }]}>↓</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
        />

        {/* Done button */}
        <TouchableOpacity
          style={[styles.doneBtn, { backgroundColor: c.primary }]}
          onPress={onClose}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    maxHeight: '75%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: SPACING.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700' },
  sheetSubtitle: { fontSize: 13, fontWeight: '400' },
  sheetHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  headerActionBtn: { paddingHorizontal: SPACING.xs },
  headerActionText: { fontSize: 13, fontWeight: '600' },
  closeBtn: { fontSize: 16, paddingLeft: SPACING.xs },
  colSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    height: 36,
  },
  colSearchInput: { flex: 1, fontSize: 13 },
  list: { flex: 1 },
  colRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '800' },
  colInfo: { flex: 1 },
  colHeader: { fontSize: 13, fontWeight: '600' },
  colField: { fontSize: 11 },
  reorderBtns: { flexDirection: 'row', gap: 4 },
  reorderBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderBtnText: { fontSize: 13, fontWeight: '700' },
  doneBtn: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

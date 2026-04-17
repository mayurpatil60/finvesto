// ─── DynamicTablePaginator ────────────────────────────────────────────────────
// Page navigation + rows-per-page picker.

import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { SPACING } from '../../types/constants';

interface Props {
  page: number;        // 0-indexed current page
  totalPages: number;
  pageSize: number;
  pageSizeOptions: number[];
  totalRows: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function DynamicTablePaginator({
  page,
  totalPages,
  pageSize,
  pageSizeOptions,
  totalRows,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [showSizePicker, setShowSizePicker] = useState(false);

  const from = totalRows === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, totalRows);

  // Page window: show up to 5 page numbers around current
  const windowPages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 0; i < totalPages; i++) windowPages.push(i);
  } else {
    windowPages.push(0);
    if (page > 2) windowPages.push('…');
    for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) {
      windowPages.push(i);
    }
    if (page < totalPages - 3) windowPages.push('…');
    windowPages.push(totalPages - 1);
  }

  return (
    <View style={[styles.wrapper, { backgroundColor: c.surface, borderTopColor: c.border }]}>
      {/* Info + page size */}
      <View style={styles.infoRow}>
        <Text style={[styles.infoText, { color: c.textSecondary }]}>
          {from}–{to} of {totalRows}
        </Text>
        <TouchableOpacity
          style={[styles.sizeBtn, { borderColor: c.border, backgroundColor: c.background }]}
          onPress={() => setShowSizePicker(true)}
        >
          <Text style={[styles.sizeBtnText, { color: c.text }]}>{pageSize} / page ▾</Text>
        </TouchableOpacity>
      </View>

      {/* Page buttons */}
      <View style={styles.pageRow}>
        {/* First + Prev */}
        <PageBtn label="«" onPress={() => onPageChange(0)} disabled={page === 0} />
        <PageBtn label="‹" onPress={() => onPageChange(page - 1)} disabled={page === 0} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.numbersScroll}>
          <View style={styles.numbersRow}>
            {windowPages.map((p, i) =>
              p === '…' ? (
                <Text key={`ellipsis-${i}`} style={[styles.ellipsis, { color: c.textSecondary }]}>…</Text>
              ) : (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.pageNumBtn,
                    {
                      backgroundColor: p === page ? c.primary : c.background,
                      borderColor: p === page ? c.primary : c.border,
                    },
                  ]}
                  onPress={() => onPageChange(p as number)}
                >
                  <Text style={[styles.pageNumText, { color: p === page ? '#fff' : c.text }]}>
                    {(p as number) + 1}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </ScrollView>

        {/* Next + Last */}
        <PageBtn label="›" onPress={() => onPageChange(page + 1)} disabled={page >= totalPages - 1} />
        <PageBtn label="»" onPress={() => onPageChange(totalPages - 1)} disabled={page >= totalPages - 1} />
      </View>

      {/* Page size modal */}
      <Modal
        visible={showSizePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSizePicker(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSizePicker(false)}>
          <View style={[styles.sizeSheet, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.sizeSheetTitle, { color: c.textSecondary }]}>Rows per page</Text>
            {pageSizeOptions.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.sizeOption,
                  { borderBottomColor: c.border, backgroundColor: opt === pageSize ? c.primary + '22' : 'transparent' },
                ]}
                onPress={() => { onPageSizeChange(opt); setShowSizePicker(false); }}
              >
                <Text style={[styles.sizeOptionText, { color: opt === pageSize ? c.primary : c.text, fontWeight: opt === pageSize ? '700' : '400' }]}>
                  {opt} rows
                </Text>
                {opt === pageSize && <Text style={{ color: c.primary }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function PageBtn({ label, onPress, disabled }: { label: string; onPress: () => void; disabled: boolean }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <TouchableOpacity
      style={[styles.navBtn, { borderColor: c.border, opacity: disabled ? 0.3 : 1, backgroundColor: c.background }]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.navBtnText, { color: c.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    gap: SPACING.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoText: { fontSize: 12 },
  sizeBtn: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  sizeBtnText: { fontSize: 12 },
  pageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  numbersScroll: { flex: 1 },
  numbersRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    alignItems: 'center',
  },
  navBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: { fontSize: 14, fontWeight: '700' },
  pageNumBtn: {
    minWidth: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumText: { fontSize: 12, fontWeight: '600' },
  ellipsis: { fontSize: 12, paddingHorizontal: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeSheet: {
    width: 220,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sizeSheetTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  sizeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sizeOptionText: { fontSize: 14 },
});

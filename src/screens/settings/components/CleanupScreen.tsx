// ─── Cleanup Screen ───────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../../components/layout/AppHeader';
import { useTheme } from '../../../components/theme/ThemeProvider';
import { SPACING } from '../../../types/constants';
import { settingsService } from '../services/settings.service';
import { Ionicons } from '@expo/vector-icons';

export function CleanupScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [expiryDate, setExpiryDate] = useState('');
  const [loadingExpiry, setLoadingExpiry] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadDefaultExpiry();
  }, []);

  async function loadDefaultExpiry() {
    setLoadingExpiry(true);
    try {
      const data = await settingsService.getExpiry();
      setExpiryDate(data.expiryDate ?? '');
    } catch {
      // non-critical — user can still type manually
    } finally {
      setLoadingExpiry(false);
    }
  }

  async function deleteRecords() {
    if (!expiryDate.trim()) {
      Alert.alert('Validation', 'Please enter an expiry date.');
      return;
    }
    Alert.alert(
      'Delete Analysis Records',
      `This will permanently delete all analysis records for expiry "${expiryDate.trim()}". This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const result = await settingsService.deleteAnalysisByExpiry(expiryDate.trim());
              Alert.alert('Done', `Deleted ${result.deletedCount} record(s) for expiry "${expiryDate.trim()}".`);
            } catch {
              Alert.alert('Error', 'Failed to delete records. Please try again.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.background }]}>
      <AppHeader title="Cleanup Analysis Data" />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={[styles.note, { color: c.textSecondary }]}>
          Delete all analysis records for a specific expiry date. This action is permanent and cannot be undone.
        </Text>

        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>EXPIRY DATE</Text>

        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          {loadingExpiry ? (
            <View style={styles.centerRow}>
              <ActivityIndicator color={c.primary} />
            </View>
          ) : (
            <View style={styles.fieldRow}>
              <Text style={[styles.label, { color: c.text }]}>Expiry Date</Text>
              <TextInput
                style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
                value={expiryDate}
                onChangeText={setExpiryDate}
                placeholder="e.g. 2025-05-29"
                placeholderTextColor={c.textSecondary}
                autoCapitalize="none"
              />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: c.error ?? '#dc2626', opacity: deleting ? 0.7 : 1 }]}
          onPress={deleteRecords}
          disabled={deleting || loadingExpiry}
        >
          {deleting
            ? <ActivityIndicator color="#fff" />
            : <Ionicons name="trash-outline" size={18} color="#fff" />
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  body: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  note: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    padding: SPACING.md,
  },
  centerRow: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  fieldRow: {
    gap: SPACING.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 15,
  },
  button: {
    marginTop: SPACING.lg,
    borderRadius: 10,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

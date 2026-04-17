// ─── Config Screen ────────────────────────────────────────────────────────────

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

export function ConfigScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    setLoading(true);
    try {
      const data = await settingsService.getExpiry();
      setExpiryDate(data.expiryDate ?? '');
    } catch {
      Alert.alert('Error', 'Failed to load config.');
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    if (!expiryDate.trim()) {
      Alert.alert('Validation', 'Please enter an expiry date.');
      return;
    }
    setSaving(true);
    try {
      await settingsService.saveExpiry(expiryDate.trim());
      Alert.alert('Saved', 'Expiry date saved successfully.');
    } catch {
      Alert.alert('Error', 'Failed to save config.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.background }]}>
      <AppHeader title="Config" />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>EXPIRY DATE</Text>

        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          {loading ? (
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
          style={[styles.button, { backgroundColor: c.primary, opacity: saving ? 0.7 : 1 }]}
          onPress={saveConfig}
          disabled={saving || loading}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Save</Text>
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
    fontSize: 14,
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

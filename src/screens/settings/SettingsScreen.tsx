// ─── Settings Screen ──────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Updates from 'expo-updates';
import { useTheme } from '../../components/theme/ThemeProvider';
import { AppHeader } from '../../components/layout/AppHeader';
import { APP_NAME, SPACING } from '../../types/constants';
import { SettingsStackParamList } from '../../navigation/SettingsNavigator';

export function SettingsScreen() {
  const { theme, isDark, setDark } = useTheme();
  const c = theme.colors;
  const [updating, setUpdating] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();

  async function checkForUpdate() {
    if (__DEV__) {
      Alert.alert('OTA Updates', 'Updates are not available in development mode.');
      return;
    }
    setUpdating(true);
    try {
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        await Updates.fetchUpdateAsync();
        Alert.alert('Update Ready', 'A new update has been downloaded. The app will now restart.', [
          { text: 'OK', onPress: () => Updates.reloadAsync() },
        ]);
      } else {
        Alert.alert('Up to Date', 'You are already on the latest version.');
      }
    } catch {
      Alert.alert('Error', 'Could not check for updates. Please try again.');
    } finally {
      setUpdating(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.background }]}>
      <AppHeader title="Settings" />

      <ScrollView contentContainerStyle={styles.body}>
        {/* Appearance Section */}
        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>APPEARANCE</Text>

        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          {/* Dark Mode Row */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={[styles.rowTitle, { color: c.text }]}>Dark Mode</Text>
              <Text style={[styles.rowSubtitle, { color: c.textSecondary }]}>
                {isDark ? 'Dark theme active' : 'Light theme active'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={setDark}
              trackColor={{ false: c.border, true: c.switchTrack }}
              thumbColor={c.switchThumb}
            />
          </View>
        </View>

        {/* Tools Section */}
        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>TOOLS</Text>

        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Config')}>
            <View style={styles.rowLeft}>
              <Text style={[styles.rowTitle, { color: c.text }]}>Config</Text>
              <Text style={[styles.rowSubtitle, { color: c.textSecondary }]}>Set expiry date and app config</Text>
            </View>
            <Text style={[styles.rowValue, { color: c.textSecondary }]}>›</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Cleanup')}>
            <View style={styles.rowLeft}>
              <Text style={[styles.rowTitle, { color: c.text }]}>Cleanup Analysis Data</Text>
              <Text style={[styles.rowSubtitle, { color: c.textSecondary }]}>Delete analysis records by expiry</Text>
            </View>
            <Text style={[styles.rowValue, { color: c.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Updates Section */}
        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>UPDATES</Text>

        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <TouchableOpacity style={styles.row} onPress={checkForUpdate} disabled={updating}>
            <View style={styles.rowLeft}>
              <Text style={[styles.rowTitle, { color: c.text }]}>Check for Updates</Text>
              <Text style={[styles.rowSubtitle, { color: c.textSecondary }]}>
                Download and apply the latest version
              </Text>
            </View>
            {updating
              ? <ActivityIndicator color={c.primary} />
              : <Text style={[styles.rowValue, { color: c.primary }]}>Update</Text>
            }
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>ABOUT</Text>

        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.row}>
            <Text style={[styles.rowTitle, { color: c.text }]}>App Name</Text>
            <Text style={[styles.rowValue, { color: c.textSecondary }]}>{APP_NAME}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <View style={styles.row}>
            <Text style={[styles.rowTitle, { color: c.text }]}>Version</Text>
            <Text style={[styles.rowValue, { color: c.textSecondary }]}>1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
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
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  rowLeft: {
    flex: 1,
    marginRight: SPACING.md,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  rowValue: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginHorizontal: SPACING.md,
  },
});

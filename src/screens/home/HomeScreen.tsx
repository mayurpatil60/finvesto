// ─── Home / Dashboard Screen ──────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { AppHeader } from '../../components/layout/AppHeader';
import { useTheme } from '../../components/theme/ThemeProvider';
import { SPACING } from '../../types/constants';
import { marketsService } from '../markets/services/markets.service';
import { MarketSentiment } from '../markets/components/MarketSentiment';
import type { BottomTabParamList } from '../../navigation/BottomTabNavigator';

type DashboardNavProp = BottomTabNavigationProp<BottomTabParamList, 'Home'>;

export function HomeScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const navigation = useNavigation<DashboardNavProp>();

  const [latestDate, setLatestDate] = useState<string | null>(null);
  const [latestCount, setLatestCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [monthlyDate, setMonthlyDate] = useState<string | null>(null);
  const [monthlyCount, setMonthlyCount] = useState<number>(0);
  const [monthlyLoading, setMonthlyLoading] = useState(true);

  const [signalDate, setSignalDate] = useState<string | null>(null);
  const [signalCount, setSignalCount] = useState<number>(0);
  const [signalLoading, setSignalLoading] = useState(true);

  const [ipoOpenCount, setIpoOpenCount] = useState<number>(0);
  const [ipoLoading, setIpoLoading] = useState(true);

  useEffect(() => {
    marketsService
      .getInvestmentDates('cash', 'quarterly')
      .then((res) => {
        setLatestDate(res.latestDate ?? null);
        setLatestCount(res.latestCount ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));


    marketsService
      .getMarketSignalDates()
      .then((res) => {
        setSignalDate(res.latestDate ?? null);
        setSignalCount(res.latestCount ?? 0);
      })
      .catch(() => {})
      .finally(() => setSignalLoading(false));

    marketsService
      .getIpoUpcoming()
      .then((res) => {
        setIpoOpenCount((res.data?.upcoming_open ?? []).length);
      })
      .catch(() => {})
      .finally(() => setIpoLoading(false));
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.background }]}>
      <AppHeader title="Dashboard" />
      <ScrollView contentContainerStyle={styles.body}>
        {/* Row 1: Quarter + Monthly invest */}
        <View style={styles.row}>
          {/* Invest in this quarter */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
            onPress={() => navigation.navigate('Markets', { initialTab: 'Investments' })}
          >
            <Text style={[styles.cardLabel, { color: c.textSecondary }]}>
              Invest in this quarter
            </Text>
            {loading ? (
              <ActivityIndicator color={c.primary} style={{ marginVertical: SPACING.sm }} />
            ) : (
              <>
                <Text style={[styles.count, { color: c.primary }]}>{latestCount}</Text>
                <Text style={[styles.date, { color: c.textSecondary }]}>{latestDate ?? '—'}</Text>
              </>
            )}
            <Text style={[styles.link, { color: c.primary }]}>View Investments →</Text>
          </TouchableOpacity>

          {/* Market Signal */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
            onPress={() => navigation.navigate('Markets', { initialTab: 'Signal' })}
          >
            <Text style={[styles.cardLabel, { color: c.textSecondary }]}>
              Invest in this month
            </Text>
            {signalLoading ? (
              <ActivityIndicator color={c.primary} style={{ marginVertical: SPACING.sm }} />
            ) : (
              <>
                <Text style={[styles.count, { color: c.primary }]}>{signalCount}</Text>
                <Text style={[styles.date, { color: c.textSecondary }]}>{signalDate ?? '—'}</Text>
              </>
            )}
            <Text style={[styles.link, { color: c.primary }]}>View Market Signal →</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: IPO */}
        <View style={[styles.row, { marginTop: SPACING.md }]}>
          {/* IPO card */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
            onPress={() => navigation.navigate('Markets', { initialTab: 'IPO' })}
          >
            <Text style={[styles.cardLabel, { color: c.textSecondary }]}>Open IPO</Text>
            {ipoLoading ? (
              <ActivityIndicator color={c.primary} style={{ marginVertical: SPACING.sm }} />
            ) : (
              <Text style={[styles.count, { color: c.primary }]}>{ipoOpenCount}</Text>
            )}
            <Text style={[styles.link, { color: c.primary }]}>View IPO →</Text>
          </TouchableOpacity>
        </View>

        {/* Market Sentiment */}
        <View style={{ marginTop: SPACING.md }}>
          <MarketSentiment />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  body: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.xs,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
  },
  count: {
    fontSize: 48,
    fontWeight: 'bold',
    lineHeight: 56,
  },
  date: {
    fontSize: 14,
  },
  link: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: SPACING.sm,
  },
});


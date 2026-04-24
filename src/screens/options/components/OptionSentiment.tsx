// ─── Option Sentiment Component ───────────────────────────────────────────────
// Displays a bar chart of Buy/Sell sentiment signals per date from Chartink.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useTheme } from '../../../components/theme/ThemeProvider';
import { SPACING } from '../../../types/constants';
import { CollapsibleCard } from '../../../components/common/CollapsibleCard';
import { SelectInput } from '../../../components/common/SelectInput';
import { Ionicons } from '@expo/vector-icons';
import {
  CtSentimentType,
  SENTIMENT_OPTIONS,
} from '../types/option-sentiment.enum';
import { CtSentimentDataPoint } from '../types/option-sentiment.interface';
import { optionSentimentService } from '../services/option-sentiment.service';

/** Convert ISO date "2026-04-24" to short label "Apr 24" */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

/** Interpolate between two hex-like RGB tuples by intensity 0..1 */
function interpolateColor(
  low: [number, number, number],
  high: [number, number, number],
  intensity: number,
): string {
  const r = Math.round(low[0] + (high[0] - low[0]) * intensity);
  const g = Math.round(low[1] + (high[1] - low[1]) * intensity);
  const b = Math.round(low[2] + (high[2] - low[2]) * intensity);
  return `rgb(${r},${g},${b})`;
}

// Buy gradient: light green → dark green
const BUY_LOW: [number, number, number] = [187, 247, 208];
const BUY_HIGH: [number, number, number] = [21, 128, 61];

// Sell gradient: light red → dark red
const SELL_LOW: [number, number, number] = [254, 202, 202];
const SELL_HIGH: [number, number, number] = [185, 28, 28];

function buildBarData(
  points: CtSentimentDataPoint[],
  type: CtSentimentType,
): { value: number; label: string; frontColor: string }[] {
  if (!points.length) return [];
  const maxCount = Math.max(...points.map((p) => p.count), 1);
  const [low, high] = type === CtSentimentType.Buy
    ? [BUY_LOW, BUY_HIGH]
    : [SELL_LOW, SELL_HIGH];

  return points.map((p) => ({
    value: p.count,
    label: formatDate(p.date),
    frontColor: interpolateColor(low, high, p.count / maxCount),
  }));
}

export function OptionSentiment() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [selectedType, setSelectedType] = useState<CtSentimentType>(CtSentimentType.Buy);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [barData, setBarData] = useState<ReturnType<typeof buildBarData>>([]);
  const scrollRef = useRef<ScrollView>(null);

  const selectedTypeRef = useRef(selectedType);
  selectedTypeRef.current = selectedType;

  useEffect(() => {
    loadSentiment();
  }, [selectedType]);

  async function loadSentiment(silent = false) {
    if (!silent) setLoading(true);
    try {
      const res = await optionSentimentService.getSentiment(selectedTypeRef.current);
      const points = res.data?.data ?? [];
      setBarData(buildBarData(points, selectedTypeRef.current));
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load sentiment data');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSentiment(true).finally(() => {
      setRefreshing(false);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  }, [selectedType]);

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: SPACING.md, paddingBottom: SPACING.xl }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <CollapsibleCard title="Option Sentiment">
        {/* Toolbar */}
        <View style={styles.toolbar}>
          <SelectInput
            label="Type"
            options={SENTIMENT_OPTIONS}
            value={selectedType}
            onChange={(v) => setSelectedType(v as CtSentimentType)}
            style={{ flex: 1 }}
          />

          <TouchableOpacity
            style={[styles.refreshBtn, { borderColor: c.border, backgroundColor: c.surface }]}
            onPress={() => loadSentiment()}
            disabled={loading}
          >
            <Ionicons name="refresh-outline" size={18} color={c.primary} />
          </TouchableOpacity>
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={c.primary} size="large" />
          </View>
        )}

        {/* Chart */}
        {!loading && barData.length > 0 && (
          <View style={styles.chartContainer}>
            <BarChart
              data={barData}
              barWidth={28}
              spacing={10}
              roundedTop
              xAxisThickness={1}
              yAxisThickness={0}
              xAxisColor={c.border}
              yAxisTextStyle={{ color: c.textSecondary, fontSize: 10 }}
              xAxisLabelTextStyle={{
                color: c.textSecondary,
                fontSize: 9,
                width: 38,
                textAlign: 'center',
              }}
              noOfSections={5}
              isAnimated
              animationDuration={400}
              showValuesAsTopLabel
              topLabelTextStyle={{ color: c.textSecondary, fontSize: 9 }}
            />
          </View>
        )}

        {/* Empty */}
        {!loading && barData.length === 0 && (
          <View style={styles.center}>
            <Text style={{ color: c.textSecondary }}>No data available</Text>
          </View>
        )}
      </CollapsibleCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  refreshBtn: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartContainer: {
    marginTop: SPACING.sm,
    overflow: 'hidden',
  },
  center: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

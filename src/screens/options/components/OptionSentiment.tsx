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

// ── Constants for bar sizing ──────────────────────────────────────────────────
// When all bars fit: fill the container proportionally.
// When overflow: use a comfortable fixed bar+gap so each date is readable.
const Y_AXIS_WIDTH  = 44;   // fixed y-axis panel width
const CHART_HEIGHT  = 200;  // bar area height (excluding x-axis labels)
const NO_OF_SECTIONS = 5;
const IDEAL_BAR      = 30;  // px per bar when scrolling
const IDEAL_GAP      = 10;  // px gap between bars when scrolling

export function OptionSentiment() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [selectedType, setSelectedType] = useState<CtSentimentType>(CtSentimentType.Buy);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [barData, setBarData] = useState<ReturnType<typeof buildBarData>>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const scrollRef      = useRef<ScrollView>(null);
  const chartScrollRef = useRef<ScrollView>(null);
  const chartScrollX   = useRef(0);
  const selectedTypeRef = useRef(selectedType);
  selectedTypeRef.current = selectedType;

  // ── Sizing math ──────────────────────────────────────────────────────────────
  const count = barData.length || 1;
  // Inner plot width (excluding our fixed y-axis panel)
  const plotWidth = Math.max(0, containerWidth - Y_AXIS_WIDTH);

  // Y-axis labels computed from data
  const maxValue = barData.length ? Math.max(...barData.map((d) => d.value), 1) : 1;
  const roundedMax = Math.ceil(maxValue / NO_OF_SECTIONS) * NO_OF_SECTIONS;
  const yStep = roundedMax / NO_OF_SECTIONS;
  const yLabels = Array.from({ length: NO_OF_SECTIONS + 1 }, (_, i) =>
    String(Math.round(yStep * (NO_OF_SECTIONS - i)))
  );

  // Slot width if all bars fit in the container (65% bar, 35% gap)
  const fitSlot    = plotWidth / count;
  const fitBarW    = Math.floor(fitSlot * 0.65);
  const fitSpacing = Math.floor(fitSlot * 0.35);

  // Would the ideal scrollable size overflow?
  const scrollTotalPlot = (IDEAL_BAR + IDEAL_GAP) * count;
  const needsScroll     = containerWidth > 0 && scrollTotalPlot > plotWidth;

  const barWidth  = needsScroll ? IDEAL_BAR : Math.max(10, fitBarW);
  const spacing   = needsScroll ? IDEAL_GAP : Math.max(4,  fitSpacing);
  // The width we pass to <BarChart> is the inner plot area
  const chartInnerWidth = needsScroll
    ? scrollTotalPlot          // let it be as wide as needed
    : plotWidth;               // exact fit

  // ── Arrow / scroll tracking ───────────────────────────────────────────────
  function handleChartScroll(e: any) {
    const x       = e.nativeEvent.contentOffset.x;
    const totalW  = e.nativeEvent.contentSize.width;
    const visible = e.nativeEvent.layoutMeasurement.width;
    chartScrollX.current = x;
    setCanScrollLeft(x > 4);
    setCanScrollRight(x < totalW - visible - 4);
  }

  function scrollChartBy(dir: 'left' | 'right') {
    const step = containerWidth * 0.6;
    const next = dir === 'right'
      ? chartScrollX.current + step
      : chartScrollX.current - step;
    chartScrollRef.current?.scrollTo({ x: Math.max(0, next), animated: true });
  }

  // ── Auto-scroll to end when new data arrives ──────────────────────────────
  useEffect(() => {
    if (barData.length && needsScroll) {
      // Small delay lets the layout settle before scrolling
      const t = setTimeout(() => {
        chartScrollRef.current?.scrollToEnd({ animated: true });
      }, 450);
      return () => clearTimeout(t);
    }
  }, [barData, needsScroll]);

  // ── After container is measured, check if right arrow needed ─────────────
  useEffect(() => {
    if (containerWidth > 0 && needsScroll) {
      setCanScrollRight(true);
    } else {
      setCanScrollRight(false);
      setCanScrollLeft(false);
    }
  }, [containerWidth, needsScroll]);

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
          <View
            style={styles.chartWrapper}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
          >
            {containerWidth > 0 && (
              <View style={styles.chartRow}>

                {/* ── Fixed Y-axis panel ───────────────────────────── */}
                <View style={[styles.yAxisPanel, { borderRightColor: c.border }]}>
                  {yLabels.map((label, i) => (
                    <Text
                      key={i}
                      style={[styles.yLabel, { color: c.textSecondary }]}
                    >
                      {label}
                    </Text>
                  ))}
                  {/* x-axis label spacer so heights align */}
                  <View style={styles.xLabelSpacer} />
                </View>

                {/* ── Scrollable bars ──────────────────────────────── */}
                <View style={{ flex: 1, position: 'relative' }}>
                  <ScrollView
                    ref={chartScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    scrollEventThrottle={16}
                    onScroll={handleChartScroll}
                    style={{ flex: 1 }}
                  >
                    <BarChart
                      data={barData}
                      width={chartInnerWidth}
                      height={CHART_HEIGHT}
                      barWidth={barWidth}
                      spacing={spacing}
                      roundedTop
                      maxValue={roundedMax}
                      noOfSections={NO_OF_SECTIONS}
                      xAxisThickness={1}
                      yAxisThickness={0}
                      hideYAxisText
                      xAxisColor={c.border}
                      xAxisLabelTextStyle={{
                        color: c.textSecondary,
                        fontSize: 9,
                        width: barWidth + spacing,
                        textAlign: 'center',
                      }}
                      isAnimated
                      animationDuration={400}
                    />
                  </ScrollView>

                  {/* Left scroll arrow */}
                  {canScrollLeft && (
                    <View style={[styles.arrowContainer, styles.arrowLeft]}>
                      <TouchableOpacity
                        style={[styles.arrow, { backgroundColor: c.surface, borderColor: c.border }]}
                        onPress={() => scrollChartBy('left')}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="chevron-back" size={16} color={c.primary} />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Right scroll arrow */}
                  {canScrollRight && (
                    <View style={[styles.arrowContainer, styles.arrowRight]}>
                      <TouchableOpacity
                        style={[styles.arrow, { backgroundColor: c.surface, borderColor: c.border }]}
                        onPress={() => scrollChartBy('right')}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="chevron-forward" size={16} color={c.primary} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

              </View>
            )}
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
  chartWrapper: {
    marginTop: SPACING.sm,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  yAxisPanel: {
    width: Y_AXIS_WIDTH,
    height: CHART_HEIGHT + 30, // +30 for x-label row
    justifyContent: 'space-between',
    borderRightWidth: 1,
    paddingRight: 4,
  },
  yLabel: {
    fontSize: 10,
    textAlign: 'right',
  },
  xLabelSpacer: {
    height: 30,
  },
  arrowContainer: {
    position: 'absolute',
    top: 0,
    bottom: 30, // leave room above x-axis labels
    zIndex: 10,
    justifyContent: 'center',
  },
  arrowLeft: {
    left: 0,
  },
  arrowRight: {
    right: 0,
  },
  arrow: {
    borderWidth: 1,
    borderRadius: 20,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  center: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ─── Market Sentiment Component ───────────────────────────────────────────────
// Displays a bar chart of Monthly Crossed 30 / 40 sentiment signals per date.

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
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
  CtMarketSentimentType,
  MARKET_SENTIMENT_OPTIONS,
} from '../types/market-sentiment.enum';
import { CtMarketSentimentDataPoint } from '../types/market-sentiment.interface';
import { marketSentimentService } from '../services/market-sentiment.service';

/**
 * Span-aware label builder for all bars.
 * - Multi-year  → year only at year transitions ("2026"), empty otherwise
 * - Multi-month → month only at month transitions ("Jan"), empty otherwise
 * - Single month → day number for every bar
 */
function buildLabels(points: { date: string }[]): string[] {
  if (!points.length) return [];
  const parsed = points.map((p) => new Date(p.date));
  const isMultiYear  = parsed[0].getFullYear() !== parsed[parsed.length - 1].getFullYear();
  const isMultiMonth = !isMultiYear &&
    parsed[0].getMonth() !== parsed[parsed.length - 1].getMonth();

  return parsed.map((d, i) => {
    const prev = i > 0 ? parsed[i - 1] : null;
    if (isMultiYear) {
      return (!prev || d.getFullYear() !== prev.getFullYear())
        ? String(d.getFullYear()) : '';
    }
    if (isMultiMonth) {
      return (!prev || d.getMonth() !== prev.getMonth())
        ? d.toLocaleString('en-IN', { month: 'short' }) : '';
    }
    return String(d.getDate());
  });
}

/** Interpolate between two RGB tuples by intensity 0..1 */
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

// Blue gradient: light blue → dark blue
const BLUE_LOW: [number, number, number] = [191, 219, 254];
const BLUE_HIGH: [number, number, number] = [29, 78, 216];

function buildBarData(
  points: CtMarketSentimentDataPoint[],
): { value: number; label: string; frontColor: string; date: string }[] {
  if (!points.length) return [];
  const maxCount = Math.max(...points.map((p) => p.count), 1);

  const labels = buildLabels(points);
  return points.map((p, i) => ({
    value: p.count,
    label: labels[i],
    frontColor: interpolateColor(BLUE_LOW, BLUE_HIGH, p.count / maxCount),
    date: p.date,
  }));
}

const Y_AXIS_WIDTH   = 44;
const CHART_HEIGHT   = 200;
const NO_OF_SECTIONS = 5;
const IDEAL_BAR      = 30;
const IDEAL_GAP      = 10;
const TOOLTIP_SPACE  = 44;  // headroom above tallest bar for tooltip

export function MarketSentiment() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [selectedType, setSelectedType] = useState<CtMarketSentimentType>(
    CtMarketSentimentType.MonthlyCrossed30,
  );
  const [loading, setLoading] = useState(false);
  const [barData, setBarData] = useState<ReturnType<typeof buildBarData>>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const chartScrollRef  = useRef<ScrollView>(null);
  const chartScrollX    = useRef(0);
  const selectedTypeRef = useRef(selectedType);
  selectedTypeRef.current = selectedType;
  const justPressedBarRef = useRef(false);

  const count    = barData.length || 1;
  const plotWidth = Math.max(0, containerWidth - Y_AXIS_WIDTH);

  const maxValue   = barData.length ? Math.max(...barData.map((d) => d.value), 1) : 1;
  const roundedMax = Math.ceil(maxValue / NO_OF_SECTIONS) * NO_OF_SECTIONS;
  const yStep      = roundedMax / NO_OF_SECTIONS;
  const yLabels    = Array.from({ length: NO_OF_SECTIONS + 1 }, (_, i) =>
    String(Math.round(yStep * (NO_OF_SECTIONS - i))),
  );

  const fitSlot    = plotWidth / count;
  const fitBarW    = Math.floor(fitSlot * 0.65);
  const fitSpacing = Math.floor(fitSlot * 0.35);

  const scrollTotalPlot = (IDEAL_BAR + IDEAL_GAP) * count;
  const needsScroll     = containerWidth > 0 && scrollTotalPlot > plotWidth;

  const barWidth        = needsScroll ? IDEAL_BAR : Math.max(10, fitBarW);
  const spacing         = needsScroll ? IDEAL_GAP : Math.max(4, fitSpacing);
  const chartInnerWidth = needsScroll ? scrollTotalPlot : plotWidth;

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

  useEffect(() => {
    if (barData.length && needsScroll) {
      const t = setTimeout(() => {
        chartScrollRef.current?.scrollToEnd({ animated: true });
      }, 450);
      return () => clearTimeout(t);
    }
  }, [barData, needsScroll]);

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

  async function loadSentiment() {
    setLoading(true);
    try {
      const res = await marketSentimentService.getSentiment(selectedTypeRef.current);
      const points = res.data?.data ?? [];
      setBarData(buildBarData(points));
      setSelectedIndex(null);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load market sentiment data');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, paddingTop: SPACING.md, paddingBottom: SPACING.xl }}>
      <CollapsibleCard title="Market Sentiment" subtitle="Best opportunities to Invest when bar is higher than other bars" style={{ marginHorizontal: 0 }}>
        <Pressable onPress={() => {
          if (justPressedBarRef.current) { justPressedBarRef.current = false; return; }
          setSelectedIndex(null);
        }}>
        {/* Toolbar */}
        <View style={styles.toolbar}>
          <SelectInput
            label="Type"
            options={MARKET_SENTIMENT_OPTIONS}
            value={selectedType}
            onChange={(v) => setSelectedType(v as CtMarketSentimentType)}
            style={{ flex: 1 }}
          />
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

                {/* Fixed Y-axis panel */}
                <View style={[styles.yAxisPanel, { borderRightColor: c.border }]}>
                  <View style={{ height: TOOLTIP_SPACE }} />
                  {yLabels.map((label, i) => (
                    <Text key={i} style={[styles.yLabel, { color: c.textSecondary }]}>
                      {label}
                    </Text>
                  ))}
                  <View style={styles.xLabelSpacer} />
                </View>

                {/* Scrollable bars */}
                <View style={{ flex: 1, position: 'relative' }}>
                  {/* Tooltip overlay – sits just above the bar tip */}
                  {selectedIndex !== null && barData[selectedIndex] && (() => {
                    const item = barData[selectedIndex];
                    const slotW = barWidth + spacing;
                    const barCenterInContent = selectedIndex * slotW + barWidth / 2;
                    const barCenterVisible = barCenterInContent - chartScrollX.current;
                    const TOOLTIP_W = 90;
                    const TOOLTIP_H = 42;
                    const GAP = 4;
                    const barPixelH = roundedMax > 0
                      ? (item.value / roundedMax) * CHART_HEIGHT
                      : 0;
                    const tooltipTop = Math.max(
                      0,
                      TOOLTIP_SPACE + CHART_HEIGHT - barPixelH - GAP - TOOLTIP_H,
                    );
                    const left = Math.min(
                      Math.max(0, barCenterVisible - TOOLTIP_W / 2),
                      plotWidth - TOOLTIP_W,
                    );
                    return (
                      <View
                        pointerEvents="none"
                        style={[
                          styles.tooltipOverlay,
                          { top: tooltipTop, left, backgroundColor: c.surface, borderColor: c.border },
                        ]}
                      >
                        <Text style={[styles.tooltipDate, { color: c.textSecondary }]}>{item.date}</Text>
                        <Text style={[styles.tooltipCount, { color: c.text }]}>{item.value} stocks</Text>
                      </View>
                    );
                  })()}

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
                      onPress={(item: any, index: number) => {
                        justPressedBarRef.current = true;
                        setSelectedIndex((prev) => (prev === index ? null : index));
                      }}
                    />
                  </ScrollView>

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

        {/* Empty state */}
        {!loading && barData.length === 0 && (
          <View style={styles.center}>
            <Text style={{ color: c.textSecondary }}>No data available</Text>
          </View>
        )}
        </Pressable>
      </CollapsibleCard>
    </View>
  );
}

const styles = StyleSheet.create({
  tooltipOverlay: {
    position: 'absolute',
    width: 90,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    zIndex: 99,
  },
  tooltipDate: {
    fontSize: 10,
    marginBottom: 1,
  },
  tooltipCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  center: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartWrapper: {
    width: '100%',
    marginTop: SPACING.sm,
  },
  chartRow: {
    flexDirection: 'row',
    overflow: 'visible',
  },
  yAxisPanel: {
    width: Y_AXIS_WIDTH,
    borderRightWidth: 1,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 4,
    height: CHART_HEIGHT + 30 + TOOLTIP_SPACE,
  },
  yLabel: {
    fontSize: 10,
    lineHeight: 14,
  },
  xLabelSpacer: {
    height: 30,
  },
  arrowContainer: {
    position: 'absolute',
    top: 0,
    bottom: 30,
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  arrowLeft: { left: 0 },
  arrowRight: { right: 0 },
  arrow: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 4,
    opacity: 0.85,
  },
});

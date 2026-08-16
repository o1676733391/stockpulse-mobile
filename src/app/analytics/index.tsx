import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { BarChart, DonutChart, LineChart, Sparkline } from '@/components/ui/charts';
import { VectorIcon } from '@/components/ui/icons';
import { SectionHeader } from '@/components/ui/section-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import {
  INITIAL_HEALTH_DATA,
  INITIAL_PURCHASE_DATA,
  INITIAL_VALUATION_DATA,
  INITIAL_VARIANCE_DATA,
  INITIAL_WASTE_DATA,
} from '@/services/analyticsService';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = ['Overview', 'Valuation', 'Variance', 'Waste', 'Purchasing'] as const;
type AnalyticsTab = (typeof TABS)[number];

const VALUATION_RANGES = ['7D', '30D', '3M'] as const;
type ValuationRange = (typeof VALUATION_RANGES)[number];

export default function AnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<AnalyticsTab>('Overview');
  const [valRange, setValRange] = useState<ValuationRange>('7D');

  const health = INITIAL_HEALTH_DATA;
  const valuation = INITIAL_VALUATION_DATA;
  const variance = INITIAL_VARIANCE_DATA;
  const waste = INITIAL_WASTE_DATA;
  const purchase = INITIAL_PURCHASE_DATA;

  const currentValuationTrend =
    valRange === '7D'
      ? valuation.trend7D
      : valRange === '30D'
      ? valuation.trend30D
      : valuation.trend3M;

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      {/* ── TopBar ── */}
      <TopBar
        title="Analytics & Trends"
        large
        showBack
        right={
          <Pressable
            onPress={() => router.push('/analytics/reports' as any)}
            style={({ pressed }) => [styles.reportsHeaderBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="FileText" size={14} color="#ffffff" />
            <Text style={styles.reportsHeaderBtnText}>Reports</Text>
          </Pressable>
        }
      />

      {/* ── Segmented Control Bar ── */}
      <View style={styles.segmentBar}>
        <SegmentedControl
          options={[...TABS]}
          value={activeTab}
          onChange={(val) => setActiveTab(val as AnalyticsTab)}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════════════════════════════════════════════════════════════════
            TAB 1: OVERVIEW & INVENTORY HEALTH
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Overview' && (
          <View style={styles.tabSection}>
            {/* 4-KPI Grid */}
            <View style={styles.kpiGrid}>
              <Card style={styles.kpiCard}>
                <Text style={[styles.kpiNum, { color: Colors.brand.dark }]}>
                  {health.healthScore}%
                </Text>
                <Text style={styles.kpiLabel}>Health Score</Text>
              </Card>

              <Card style={styles.kpiCard}>
                <Text style={styles.kpiNum}>{health.turnoverDays}d</Text>
                <Text style={styles.kpiLabel}>Avg Turnover</Text>
              </Card>

              <Card style={styles.kpiCard}>
                <Text style={[styles.kpiNum, { color: Colors.brand.primary }]}>
                  €{Math.round(valuation.totalValuation).toLocaleString()}
                </Text>
                <Text style={styles.kpiLabel}>Total Value</Text>
              </Card>

              <Card style={styles.kpiCard}>
                <Text style={[styles.kpiNum, { color: Colors.warning.dark }]}>
                  {variance.overallVarianceRate}%
                </Text>
                <Text style={styles.kpiLabel}>Net Variance</Text>
              </Card>
            </View>

            {/* Stock Health Distribution Donut */}
            <Card style={styles.chartCard}>
              <SectionHeader title="Inventory Health Distribution" />
              <View style={styles.donutRow}>
                <DonutChart
                  size={100}
                  strokeWidth={10}
                  centerNumber={`${health.totalItems}`}
                  centerLabel="Items"
                  segments={[
                    { value: health.optimalCount, color: Colors.brand.primary, label: 'Optimal' },
                    { value: health.lowStockCount, color: Colors.warning.main, label: 'Low Stock' },
                    { value: health.overstockCount, color: Colors.info.main, label: 'Overstock' },
                    { value: health.outOfStockCount, color: Colors.critical.main, label: 'Out of Stock' },
                  ]}
                />

                <View style={styles.donutLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.brand.primary }]} />
                    <Text style={styles.legendText}>Optimal: <Text style={styles.bold}>{health.optimalCount}</Text> items</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.warning.main }]} />
                    <Text style={styles.legendText}>Low stock: <Text style={styles.bold}>{health.lowStockCount}</Text> items</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.info.main }]} />
                    <Text style={styles.legendText}>Overstock: <Text style={styles.bold}>{health.overstockCount}</Text> items</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.critical.main }]} />
                    <Text style={styles.legendText}>Out of stock: <Text style={styles.bold}>{health.outOfStockCount}</Text> items</Text>
                  </View>
                </View>
              </View>
            </Card>

            {/* Quick Link to Supplier Scorecards */}
            <Pressable
              onPress={() => router.push('/analytics/suppliers' as any)}
              style={({ pressed }) => [styles.linkBannerCard, pressed && styles.pressed]}
            >
              <View style={styles.linkBannerIcon}>
                <VectorIcon name="Truck" size={20} color={Colors.brand.primary} />
              </View>
              <View style={styles.linkBannerInfo}>
                <Text style={styles.linkBannerTitle}>Supplier Performance Scorecard</Text>
                <Text style={styles.linkBannerSub}>View lead times, on-time rates & spend per vendor</Text>
              </View>
              <VectorIcon name="ChevronRight" size={16} color={Colors.neutral.textTertiary} />
            </Pressable>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 2: STOCK VALUATION & BREAKDOWN
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Valuation' && (
          <View style={styles.tabSection}>
            {/* Total Valuation Banner */}
            <Card style={styles.valuationHeaderCard}>
              <Text style={styles.valHeaderLabel}>Total Inventory Valuation</Text>
              <Text style={styles.valHeaderAmount}>€{valuation.totalValuation.toFixed(2)}</Text>
              <View style={styles.valHeaderBadgeRow}>
                <Badge variant="green">+2.1% vs last week</Badge>
                <Text style={styles.valHeaderSub}>Across 68 catalog items</Text>
              </View>

              {/* Timeframe Chips */}
              <View style={styles.rangeChipsRow}>
                {VALUATION_RANGES.map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => setValRange(r)}
                    style={[
                      styles.rangeChip,
                      valRange === r && styles.rangeChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.rangeChipText,
                        valRange === r && styles.rangeChipTextActive,
                      ]}
                    >
                      {r}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Valuation Line Chart */}
              <View style={styles.lineChartWrap}>
                <LineChart
                  physical={currentValuationTrend.values}
                  theoretical={currentValuationTrend.values.map((v) => v * 1.02)}
                  labels={currentValuationTrend.labels}
                  width={310}
                  height={150}
                />
              </View>
            </Card>

            {/* Category Value Breakdown Bar Chart */}
            <Card style={styles.chartCard}>
              <SectionHeader title="Valuation by Category" />
              <BarChart
                data={valuation.categoryBreakdown.map((c) => ({
                  label: c.category,
                  value: c.value,
                  color: c.color,
                }))}
                width={310}
                height={150}
                formatValue={(v) => `€${Math.round(v / 1000)}k`}
              />

              {/* Category Breakdown Table */}
              <View style={styles.catTable}>
                {valuation.categoryBreakdown.map((c) => (
                  <View key={c.category} style={styles.catTableRow}>
                    <View style={styles.catLeft}>
                      <View style={[styles.legendDot, { backgroundColor: c.color }]} />
                      <Text style={styles.catName}>{c.category}</Text>
                    </View>
                    <Text style={styles.catPct}>{c.percentage}%</Text>
                    <Text style={styles.catValue}>€{c.value.toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 3: VARIANCE & SHRINKAGE TRENDS
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Variance' && (
          <View style={styles.tabSection}>
            {/* Variance Impact Banner */}
            <Card style={styles.varianceSummaryCard}>
              <View style={styles.varTopRow}>
                <View>
                  <Text style={styles.varLabel}>Net Discrepancy Impact</Text>
                  <Text style={styles.varNumRed}>€{variance.netVarianceValue.toFixed(2)}</Text>
                </View>
                <Badge variant="amber">Shrinkage Rate: {variance.overallVarianceRate}%</Badge>
              </View>

              <Text style={styles.varSub}>
                Calculated across last 5 physical count audits vs POS Theoretical BOM deductions.
              </Text>

              {/* Sparkline Trend */}
              <View style={styles.sparklineWrap}>
                <Sparkline
                  data={variance.trend.values.map((v) => Math.abs(v))}
                  color={Colors.critical.main}
                  width={310}
                  height={50}
                />
              </View>
            </Card>

            {/* Top Variance Items List */}
            <Card style={styles.chartCard}>
              <SectionHeader title="Top Discrepancies Requiring Review" />
              <View style={styles.discrepanciesList}>
                {variance.topDiscrepancies.map((item) => (
                  <View key={item.name} style={styles.discrepancyRow}>
                    <View style={styles.discInfo}>
                      <Text style={styles.discName}>{item.name}</Text>
                      <Text style={styles.discSub}>Variance: {item.variancePct}%</Text>
                    </View>
                    <View style={styles.discRight}>
                      <Badge variant={item.isNegative ? 'red' : 'green'}>
                        {item.valueImpact < 0 ? `-€${Math.abs(item.valueImpact).toFixed(2)}` : `+€${item.valueImpact.toFixed(2)}`}
                      </Badge>
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 4: WASTE & LOSS TRENDS
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Waste' && (
          <View style={styles.tabSection}>
            {/* Waste Overview Header */}
            <Card style={styles.wasteHeaderCard}>
              <View style={styles.wasteTopRow}>
                <View>
                  <Text style={styles.wasteLabel}>Monthly Waste Cost</Text>
                  <Text style={styles.wasteNum}>€{waste.monthlyWasteCost.toFixed(2)}</Text>
                </View>
                <Badge variant="green">-{waste.wasteReductionPct}% vs last month</Badge>
              </View>

              {/* Value Saved Callout */}
              <View style={styles.wasteSavedBox}>
                <VectorIcon name="Lightbulb" size={16} color={Colors.brand.dark} />
                <Text style={styles.wasteSavedText}>
                  <Text style={styles.bold}>€{waste.monthlyWasteSaved.toFixed(2)}</Text> recovered through smart waste reduction suggestions.
                </Text>
              </View>
            </Card>

            {/* Waste Breakdown by Cause */}
            <Card style={styles.chartCard}>
              <SectionHeader title="Waste Causes Breakdown" />
              <View style={styles.wasteCausesList}>
                {waste.breakdown.map((b) => (
                  <View key={b.reason} style={styles.wasteCauseItem}>
                    <View style={styles.causeRow}>
                      <Text style={styles.causeName}>{b.reason}</Text>
                      <Text style={styles.causeCost}>€{b.cost.toFixed(2)} ({b.pct}%)</Text>
                    </View>
                    <View style={styles.causeBarTrack}>
                      <View
                        style={[
                          styles.causeBarFill,
                          { width: `${b.pct}%`, backgroundColor: b.color },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </Card>

            {/* Link to Waste Reduction Actions */}
            <Pressable
              onPress={() => router.push('/expiration/waste-reduction' as any)}
              style={({ pressed }) => [styles.linkBannerCard, pressed && styles.pressed]}
            >
              <View style={[styles.linkBannerIcon, { backgroundColor: '#fef3c7' }]}>
                <VectorIcon name="Lightbulb" size={20} color="#b45309" />
              </View>
              <View style={styles.linkBannerInfo}>
                <Text style={styles.linkBannerTitle}>Active Waste Reduction Suggestions</Text>
                <Text style={styles.linkBannerSub}>Promote recipes with expiring stock before BBD</Text>
              </View>
              <VectorIcon name="ChevronRight" size={16} color={Colors.neutral.textTertiary} />
            </Pressable>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 5: PURCHASING & SPEND TRENDS
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Purchasing' && (
          <View style={styles.tabSection}>
            {/* Spend vs Budget Summary */}
            <View style={styles.kpiGrid}>
              <Card style={styles.kpiCard}>
                <Text style={[styles.kpiNum, { color: Colors.brand.dark }]}>
                  €{purchase.ytdSpend.toLocaleString()}
                </Text>
                <Text style={styles.kpiLabel}>YTD Total Spend</Text>
              </Card>

              <Card style={styles.kpiCard}>
                <Text style={styles.kpiNum}>
                  €{purchase.monthlyActual.toLocaleString()}
                </Text>
                <Text style={styles.kpiLabel}>Month Actual</Text>
              </Card>

              <Card style={styles.kpiCard}>
                <Text style={[styles.kpiNum, { color: Colors.neutral.textSecondary }]}>
                  €{purchase.monthlyBudget.toLocaleString()}
                </Text>
                <Text style={styles.kpiLabel}>Month Budget</Text>
              </Card>
            </View>

            {/* Monthly Spend Bar Chart */}
            <Card style={styles.chartCard}>
              <SectionHeader title="Monthly Procurement Spend" />
              <BarChart
                data={purchase.monthlyTrend.labels.map((lbl, idx) => ({
                  label: lbl,
                  value: purchase.monthlyTrend.spend[idx],
                  color: Colors.brand.primary,
                }))}
                width={310}
                height={150}
                formatValue={(v) => `€${Math.round(v)}`}
              />
            </Card>

            {/* Link to PO Reorder */}
            <Pressable
              onPress={() => router.push('/orders/poq' as any)}
              style={({ pressed }) => [styles.linkBannerCard, pressed && styles.pressed]}
            >
              <View style={[styles.linkBannerIcon, { backgroundColor: '#dcfce7' }]}>
                <VectorIcon name="ShoppingCart" size={20} color="#15803d" />
              </View>
              <View style={styles.linkBannerInfo}>
                <Text style={styles.linkBannerTitle}>Reorder from POQ Recommendations</Text>
                <Text style={styles.linkBannerSub}>Auto-calculate orders based on target stock</Text>
              </View>
              <VectorIcon name="ChevronRight" size={16} color={Colors.neutral.textTertiary} />
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  reportsHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    ...Shadows.card,
  },
  reportsHeaderBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  segmentBar: {
    backgroundColor: Colors.neutral.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  tabSection: {
    gap: Spacing.md,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  kpiCard: {
    flex: 1,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  kpiNum: {
    ...Typography.monoValue,
    fontSize: 15,
    color: Colors.neutral.textPrimary,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.neutral.textTertiary,
    marginTop: 2,
    textAlign: 'center',
  },
  chartCard: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.xs,
  },
  donutLegend: {
    flex: 1,
    gap: Spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
  },
  bold: {
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  valuationHeaderCard: {
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  valHeaderLabel: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  valHeaderAmount: {
    ...Typography.monoKpiLarge,
    fontSize: 26,
    color: Colors.neutral.textPrimary,
  },
  valHeaderBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  valHeaderSub: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  rangeChipsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginVertical: Spacing.xs,
  },
  rangeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral.borderLight,
  },
  rangeChipActive: {
    backgroundColor: Colors.neutral.textPrimary,
  },
  rangeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  rangeChipTextActive: {
    color: '#ffffff',
  },
  lineChartWrap: {
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  catTable: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  catTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  catName: {
    fontSize: 12,
    color: Colors.neutral.textPrimary,
  },
  catPct: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    width: 45,
    textAlign: 'right',
  },
  catValue: {
    ...Typography.monoCaption,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
    width: 70,
    textAlign: 'right',
  },
  varianceSummaryCard: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  varTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  varLabel: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  varNumRed: {
    ...Typography.monoKpiLarge,
    fontSize: 24,
    color: Colors.critical.main,
  },
  varSub: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
    lineHeight: 16,
  },
  sparklineWrap: {
    marginTop: Spacing.xs,
    alignItems: 'center',
  },
  discrepanciesList: {
    gap: Spacing.xs,
  },
  discrepancyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  discInfo: {
    gap: 2,
  },
  discName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  discSub: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  discRight: {
    alignItems: 'flex-end',
  },
  wasteHeaderCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  wasteTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  wasteLabel: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  wasteNum: {
    ...Typography.monoKpiLarge,
    fontSize: 24,
    color: Colors.neutral.textPrimary,
  },
  wasteSavedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.brand.subtle,
    borderColor: Colors.brand.light,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
  },
  wasteSavedText: {
    fontSize: 11,
    color: Colors.brand.dark,
    flex: 1,
    lineHeight: 15,
  },
  wasteCausesList: {
    gap: Spacing.sm,
  },
  wasteCauseItem: {
    gap: 4,
  },
  causeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  causeName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  causeCost: {
    ...Typography.monoCaption,
    fontSize: 11,
    color: Colors.neutral.textSecondary,
  },
  causeBarTrack: {
    height: 6,
    backgroundColor: Colors.neutral.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  causeBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  linkBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.neutral.card,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    ...Shadows.card,
  },
  linkBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: Colors.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkBannerInfo: {
    flex: 1,
  },
  linkBannerTitle: {
    ...Typography.cardTitle,
    fontSize: 13,
  },
  linkBannerSub: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    marginTop: 1,
  },
  pressed: {
    opacity: 0.8,
  },
});

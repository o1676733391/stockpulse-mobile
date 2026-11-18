import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { BarChart, DonutChart, LineChart, Sparkline } from '@/components/ui/charts';
import { VectorIcon } from '@/components/ui/icons';
import { SectionHeader } from '@/components/ui/section-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n';
import {
  analyticsService,
  EMPTY_HEALTH_DATA,
  EMPTY_PURCHASE_DATA,
  EMPTY_VALUATION_DATA,
  EMPTY_VARIANCE_DATA,
  EMPTY_WASTE_DATA,
} from '@/services/analyticsService';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = ['Overview', 'Valuation', 'Variance', 'Waste', 'Purchasing'] as const;
type AnalyticsTab = (typeof TABS)[number];

const TAB_CONFIG: { id: AnalyticsTab; labelKey: string }[] = [
  { id: 'Overview', labelKey: 'analytics.tabs.overview' },
  { id: 'Valuation', labelKey: 'analytics.tabs.valuation' },
  { id: 'Variance', labelKey: 'analytics.tabs.variance' },
  { id: 'Waste', labelKey: 'analytics.tabs.waste' },
  { id: 'Purchasing', labelKey: 'analytics.tabs.purchasing' },
];

const VALUATION_RANGES = ['7D', '30D', '3M'] as const;
type ValuationRange = (typeof VALUATION_RANGES)[number];

export default function AnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<AnalyticsTab>('Overview');
  const [valRange, setValRange] = useState<ValuationRange>('7D');
  const [loading, setLoading] = useState(true);

  const [health, setHealth] = useState(EMPTY_HEALTH_DATA);
  const [valuation, setValuation] = useState(EMPTY_VALUATION_DATA);
  const [variance, setVariance] = useState(EMPTY_VARIANCE_DATA);
  const [waste, setWaste] = useState(EMPTY_WASTE_DATA);
  const [purchase, setPurchase] = useState(EMPTY_PURCHASE_DATA);

  useEffect(() => {
    let mounted = true;
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const [hRes, vRes, varRes, wRes, pRes] = await Promise.allSettled([
          analyticsService.getInventoryHealth(),
          analyticsService.getStockValuation(),
          analyticsService.getVarianceAnalytics(),
          analyticsService.getWasteAnalytics(),
          analyticsService.getPurchaseAnalytics(),
        ]);
        if (!mounted) return;
        if (hRes.status === 'fulfilled') setHealth(hRes.value);
        if (vRes.status === 'fulfilled') setValuation(vRes.value);
        if (varRes.status === 'fulfilled') setVariance(varRes.value);
        if (wRes.status === 'fulfilled') setWaste(wRes.value);
        if (pRes.status === 'fulfilled') setPurchase(pRes.value);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchAnalytics();
    return () => {
      mounted = false;
    };
  }, []);

  const currentValuationTrend =
    valRange === '7D'
      ? valuation?.trend7D || { labels: [], values: [] }
      : valRange === '30D'
      ? valuation?.trend30D || { labels: [], values: [] }
      : valuation?.trend3M || { labels: [], values: [] };

  const activeOption = t(TAB_CONFIG.find((c) => c.id === activeTab)?.labelKey || 'analytics.tabs.overview');
  const options = TAB_CONFIG.map((c) => t(c.labelKey));

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      {/* ── TopBar ── */}
      <TopBar
        title={t('analytics.title', { defaultValue: 'Analytics & Trends' })}
        large
        showBack
        right={
          <Pressable
            onPress={() => router.push('/analytics/reports' as any)}
            style={({ pressed }) => [styles.reportsHeaderBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="FileText" size={14} color="#ffffff" />
            <Text style={styles.reportsHeaderBtnText}>{t('analytics.reportsBtn', { defaultValue: 'Reports' })}</Text>
          </Pressable>
        }
      />

      {/* ── Segmented Control Bar ── */}
      <View style={styles.segmentBar}>
        <SegmentedControl
          options={options}
          value={activeOption}
          onChange={(val) => {
            const found = TAB_CONFIG.find((c) => t(c.labelKey) === val);
            if (found) setActiveTab(found.id);
          }}
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
                <Text style={styles.kpiLabel}>{t('analytics.healthScore')}</Text>
              </Card>

              <Card style={styles.kpiCard}>
                <Text style={styles.kpiNum}>{health.turnoverDays}d</Text>
                <Text style={styles.kpiLabel}>{t('analytics.avgTurnover')}</Text>
              </Card>

              <Card style={styles.kpiCard}>
                <Text style={[styles.kpiNum, { color: Colors.brand.primary }]}>
                  €{Math.round(valuation.totalValuation).toLocaleString()}
                </Text>
                <Text style={styles.kpiLabel}>{t('analytics.totalValue')}</Text>
              </Card>

              <Card style={styles.kpiCard}>
                <Text style={[styles.kpiNum, { color: Colors.warning.dark }]}>
                  {variance.overallVarianceRate}%
                </Text>
                <Text style={styles.kpiLabel}>{t('analytics.netVariance')}</Text>
              </Card>
            </View>

            {/* Stock Health Distribution Donut */}
            <Card style={styles.chartCard}>
              <SectionHeader title={t('dashboard.stockHealth')} />
              <View style={styles.donutRow}>
                <DonutChart
                  size={100}
                  strokeWidth={10}
                  centerNumber={`${health.totalItems}`}
                  centerLabel={t('common.items')}
                  segments={[
                    { value: health.optimalCount, color: Colors.brand.primary, label: t('dashboard.kpis.optimal') },
                    { value: health.lowStockCount, color: Colors.warning.main, label: t('dashboard.kpis.low') },
                    { value: health.overstockCount, color: Colors.info.main, label: t('dashboard.kpis.overstock') },
                    { value: health.outOfStockCount, color: Colors.critical.main, label: t('dashboard.kpis.critical') },
                  ]}
                />

                <View style={styles.donutLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.brand.primary }]} />
                    <Text style={styles.legendText}>{t('dashboard.kpis.optimal')}: <Text style={styles.bold}>{health.optimalCount}</Text> {t('common.items')}</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.warning.main }]} />
                    <Text style={styles.legendText}>{t('dashboard.kpis.low')}: <Text style={styles.bold}>{health.lowStockCount}</Text> {t('common.items')}</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.info.main }]} />
                    <Text style={styles.legendText}>{t('dashboard.kpis.overstock')}: <Text style={styles.bold}>{health.overstockCount}</Text> {t('common.items')}</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.critical.main }]} />
                    <Text style={styles.legendText}>{t('dashboard.kpis.critical')}: <Text style={styles.bold}>{health.outOfStockCount}</Text> {t('common.items')}</Text>
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
                <Text style={styles.linkBannerTitle}>{t('analytics.supplierScorecard')}</Text>
                <Text style={styles.linkBannerSub}>{t('analytics.supplierScorecardSub')}</Text>
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
              <Text style={styles.valHeaderLabel}>{t('analytics.totalValuation')}</Text>
              <Text style={styles.valHeaderAmount}>€{valuation.totalValuation.toFixed(2)}</Text>
              <View style={styles.valHeaderBadgeRow}>
                <Badge variant="green">+2.1% vs last week</Badge>
                <Text style={styles.valHeaderSub}>{t('analytics.acrossCatalogItems', { count: 68 })}</Text>
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
                {currentValuationTrend.values && currentValuationTrend.values.length > 0 ? (
                  <LineChart
                    physical={currentValuationTrend.values}
                    theoretical={currentValuationTrend.values.map((v) => v * 1.02)}
                    labels={currentValuationTrend.labels || []}
                    width={310}
                    height={150}
                  />
                ) : (
                  <View style={{ height: 120, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={[styles.catName, { color: Colors.neutral.textMuted }]}>
                      {t('analytics.noTrendData', { defaultValue: 'No trend data yet' })}
                    </Text>
                  </View>
                )}
              </View>
            </Card>

            {/* Category Value Breakdown Bar Chart */}
            <Card style={styles.chartCard}>
              <SectionHeader title="Valuation by Category" />
              {valuation.categoryBreakdown && valuation.categoryBreakdown.length > 0 ? (
                <>
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
                </>
              ) : (
                <View style={{ height: 100, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={[styles.catName, { color: Colors.neutral.textMuted }]}>
                    {t('inventory.emptyStateDesc', { defaultValue: 'No inventory categories recorded yet' })}
                  </Text>
                </View>
              )}
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
                  <Text style={styles.varLabel}>{t('analytics.netDiscrepancyImpact')}</Text>
                  <Text style={styles.varNumRed}>€{variance.netVarianceValue.toFixed(2)}</Text>
                </View>
                <Badge variant="amber">{t('analytics.shrinkageRate')}: {variance.overallVarianceRate}%</Badge>
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
              <SectionHeader title={t('dashboard.varianceTitle')} />
              <View style={styles.discrepanciesList}>
                {variance.topDiscrepancies.map((item) => (
                  <View key={item.name} style={styles.discrepancyRow}>
                    <View style={styles.discInfo}>
                      <Text style={styles.discName}>{item.name}</Text>
                      <Text style={styles.discSub}>{t('stockCount.variance')}: {item.variancePct}%</Text>
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
                  <Text style={styles.wasteLabel}>{t('analytics.monthlyWasteCost')}</Text>
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
              <SectionHeader title={t('analytics.wasteLoss')} />
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
                <Text style={styles.linkBannerTitle}>{t('analytics.wasteReductionSuggestions')}</Text>
                <Text style={styles.linkBannerSub}>{t('analytics.wasteReductionSuggestionsSub')}</Text>
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
                <Text style={styles.kpiLabel}>{t('analytics.ytdTotalSpend')}</Text>
              </Card>

              <Card style={styles.kpiCard}>
                <Text style={styles.kpiNum}>
                  €{purchase.monthlyActual.toLocaleString()}
                </Text>
                <Text style={styles.kpiLabel}>{t('analytics.monthActual')}</Text>
              </Card>

              <Card style={styles.kpiCard}>
                <Text style={[styles.kpiNum, { color: Colors.neutral.textSecondary }]}>
                  €{purchase.monthlyBudget.toLocaleString()}
                </Text>
                <Text style={styles.kpiLabel}>{t('analytics.monthBudget')}</Text>
              </Card>
            </View>

            {/* Monthly Spend Bar Chart */}
            <Card style={styles.chartCard}>
              <SectionHeader title={t('analytics.supplierLeadTimes')} />
              <BarChart
                data={purchase.monthlyTrend.labels.map((lbl: string, idx: number) => ({
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
                <Text style={styles.linkBannerTitle}>{t('analytics.poqReorderTitle')}</Text>
                <Text style={styles.linkBannerSub}>{t('analytics.poqReorderSub')}</Text>
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

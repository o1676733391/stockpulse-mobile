import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { LineChart } from '@/components/ui/charts';
import { VectorIcon } from '@/components/ui/icons';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SectionHeader } from '@/components/ui/section-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TopBar } from '@/components/ui/top-bar';
import { VariancePill } from '@/components/ui/variance-pill';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { mockInventoryItems, mockStockTrend } from '@/mocks/inventoryMockData';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TX_CONFIG: Record<
  string,
  { icon: string; bg: string; color: string; label: string }
> = {
  pos_deduction: {
    icon: 'TrendingDown',
    bg: Colors.info.subtle,
    color: Colors.info.main,
    label: 'POS Deduction',
  },
  manual_count: {
    icon: 'CheckCircle',
    bg: Colors.brand.subtle,
    color: Colors.brand.primary,
    label: 'Manual Count',
  },
  goods_receipt: {
    icon: 'Plus',
    bg: Colors.purple.subtle,
    color: Colors.purple.main,
    label: 'Goods Receipt',
  },
  adjustment: {
    icon: 'Pencil',
    bg: Colors.warning.subtle,
    color: Colors.warning.dark,
    label: 'Adjustment',
  },
};

export default function InventoryDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [range, setRange] = useState<'7D' | '30D' | '3M'>('7D');

  const item = useMemo(() => {
    return mockInventoryItems.find((i) => i.id === id) ?? mockInventoryItems[0];
  }, [id]);

  const variance = item.physicalStock - item.theoreticalStock;
  const variancePct = item.theoreticalStock > 0 ? (variance / item.theoreticalStock) * 100 : 0;
  const recommended = Math.max(0, item.targetStock - item.physicalStock + item.safetyStock);

  const trendData = mockStockTrend[range];

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      {/* ── TopBar ── */}
      <TopBar
        title={item.name}
        subtitle={`${item.sku} · ${item.category}`}
        showBack
        right={
          <Pressable
            onPress={() => {}}
            style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="Pencil" size={18} color={Colors.neutral.textPrimary} />
          </Pressable>
        }
      />

      {/* ── Content ── */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Stock Comparison Card ── */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Stock Comparison</Text>

          {/* Big Two-Column Comparison */}
          <View style={styles.compareGrid}>
            {/* Physical (Is) */}
            <View style={styles.physicalCol}>
              <View style={styles.colHeader}>
                <View style={styles.greenDot} />
                <Text style={styles.physicalColLabel}>PHYSICAL / IS</Text>
              </View>
              <Text style={styles.physicalColValue}>{item.physicalStock}</Text>
              <Text style={styles.physicalColUnit}>{item.unit} on hand</Text>
            </View>

            {/* Theory (Should) */}
            <View style={styles.theoryCol}>
              <View style={styles.colHeader}>
                <View style={styles.slateDot} />
                <Text style={styles.theoryColLabel}>THEORY / SHOULD</Text>
              </View>
              <Text style={styles.theoryColValue}>{item.theoreticalStock}</Text>
              <Text style={styles.theoryColUnit}>{item.unit} expected</Text>
            </View>
          </View>

          {/* Variance Banner */}
          <View
            style={[
              styles.varianceBanner,
              {
                backgroundColor:
                  variance < 0
                    ? Colors.critical.subtle
                    : variance > 0
                    ? Colors.brand.subtle
                    : Colors.neutral.surface,
                borderColor:
                  variance < 0
                    ? Colors.critical.light
                    : variance > 0
                    ? Colors.brand.light
                    : Colors.neutral.borderLight,
              },
            ]}
          >
            <View>
              <Text style={styles.varianceLabel}>Variance (Is − Should)</Text>
              <Text
                style={[
                  styles.varianceValue,
                  {
                    color:
                      variance < 0
                        ? Colors.critical.dark
                        : variance > 0
                        ? Colors.brand.dark
                        : Colors.neutral.textSecondary,
                  },
                ]}
              >
                {variance > 0 ? '+' : ''}{variance.toFixed(1)} {item.unit}
              </Text>
            </View>
            <VariancePill value={variance} pct={variancePct} />
          </View>

          {/* Target / Safety / Recommended Order 3-box Grid */}
          <View style={styles.targetGrid}>
            <View style={styles.targetBox}>
              <Text style={styles.targetBoxLabel}>Target</Text>
              <Text style={styles.targetBoxValue}>{item.targetStock}</Text>
              <Text style={styles.targetBoxUnit}>{item.unit}</Text>
            </View>

            <View style={styles.targetBox}>
              <Text style={styles.targetBoxLabel}>Safety</Text>
              <Text style={styles.targetBoxValue}>{item.safetyStock}</Text>
              <Text style={styles.targetBoxUnit}>{item.unit}</Text>
            </View>

            <View
              style={[
                styles.targetBox,
                recommended > 0 && styles.targetBoxHighlight,
              ]}
            >
              <Text
                style={[
                  styles.targetBoxLabel,
                  recommended > 0 && { color: Colors.info.dark },
                ]}
              >
                Rec. Order
              </Text>
              <Text
                style={[
                  styles.targetBoxValue,
                  recommended > 0 && { color: Colors.info.dark },
                ]}
              >
                {recommended.toFixed(1)}
              </Text>
              <Text style={styles.targetBoxUnit}>{item.unit}</Text>
            </View>
          </View>
        </Card>

        {/* ── 2. Count Schedule Card ── */}
        <Card style={styles.sectionCard}>
          <View style={styles.scheduleHeaderRow}>
            <Text style={styles.sectionHeading}>Count Schedule</Text>
            <Badge variant="amber">In Progress</Badge>
          </View>

          <View style={styles.activeScheduleBox}>
            <View style={styles.activeScheduleTop}>
              <View>
                <Text style={styles.activeScheduleTitle}>Daily Stock Count</Text>
                <Text style={styles.activeScheduleSub}>Today, 10 March 2026</Text>
              </View>
              <View style={styles.activeScheduleRight}>
                <Text style={styles.activeScheduleCount}>42</Text>
                <Text style={styles.activeScheduleTotal}>of 68</Text>
              </View>
            </View>

            <ProgressBar value={42} max={68} variant="green" height={6} />

            <View style={styles.activeScheduleBottom}>
              <Text style={styles.activeScheduleRemain}>26 items remaining</Text>
              <Text style={styles.activeSchedulePct}>62%</Text>
            </View>
          </View>

          {/* Continue Count Button */}
          <Pressable
            onPress={() => router.push('/stock-count/active' as any)}
            style={({ pressed }) => [styles.continueBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="Play" size={15} color="#ffffff" />
            <Text style={styles.continueBtnText}>Continue Count</Text>
          </Pressable>

          {/* Other Schedules */}
          <View style={styles.otherSchedules}>
            <View style={styles.otherScheduleRow}>
              <Text style={styles.otherScheduleLabel}>Weekly Count</Text>
              <View style={styles.otherScheduleRight}>
                <Text style={styles.otherScheduleDue}>Due 14 Mar</Text>
                <Badge variant="gray">Scheduled</Badge>
              </View>
            </View>
            <View style={[styles.otherScheduleRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.otherScheduleLabel}>Monthly Inventory</Text>
              <View style={styles.otherScheduleRight}>
                <Text style={styles.otherScheduleDue}>Due 31 Mar</Text>
                <Badge variant="gray">Scheduled</Badge>
              </View>
            </View>
          </View>
        </Card>

        {/* ── 3. Stock Trend Line Chart ── */}
        <Card style={styles.sectionCard}>
          <View style={styles.trendHeader}>
            <Text style={styles.sectionHeading}>Stock Trend</Text>
            <SegmentedControl
              options={['7D', '30D', '3M']}
              value={range}
              onChange={(val) => setRange(val as any)}
              style={{ width: 140 }}
            />
          </View>

          <View style={styles.chartContainer}>
            <LineChart
              physical={trendData.physical}
              theoretical={trendData.theoretical}
              labels={trendData.labels}
              width={310}
              height={130}
            />
          </View>

          {/* Chart Legend */}
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={styles.physLineSample} />
              <Text style={styles.legendText}>Physical (Is)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.theoLineSample} />
              <Text style={styles.legendText}>Theoretical (Should)</Text>
            </View>
          </View>
        </Card>

        {/* ── 4. Batches & Expiration ── */}
        <Card style={styles.sectionCard}>
          <SectionHeader title="Batches & Expiration" />
          <View style={styles.batchList}>
            {item.batches.map((batch) => {
              const isCritical = batch.daysRemaining <= 2;
              const isWarning = batch.daysRemaining <= 7 && !isCritical;
              const variant = isCritical ? 'red' : isWarning ? 'amber' : 'green';

              return (
                <View key={batch.id} style={styles.batchItem}>
                  <View style={styles.batchTop}>
                    <View>
                      <Text style={styles.batchName}>Batch #{batch.id}</Text>
                      <Text style={styles.batchSub}>
                        {batch.quantity} {item.unit} · BBD {batch.expiryDate}
                      </Text>
                    </View>
                    <Badge variant={variant}>
                      {batch.daysRemaining === 1
                        ? 'Tomorrow'
                        : `${batch.daysRemaining}d left`}
                    </Badge>
                  </View>

                  <View style={styles.batchProgressRow}>
                    <ProgressBar
                      value={Math.max(0, 30 - batch.daysRemaining)}
                      max={30}
                      variant={variant}
                      height={4}
                    />
                    <Text style={styles.batchProgressText}>{batch.daysRemaining}d</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        {/* ── 5. Recent Transactions ── */}
        <Card style={styles.sectionCard}>
          <SectionHeader title="Recent Transactions" action="View History" />
          <View style={styles.txList}>
            {item.transactions.map((tx) => {
              const cfg = TX_CONFIG[tx.type] ?? TX_CONFIG.adjustment;
              return (
                <View key={tx.id} style={styles.txRow}>
                  <View style={[styles.txIconBox, { backgroundColor: cfg.bg }]}>
                    <VectorIcon name={cfg.icon} size={14} color={cfg.color} />
                  </View>

                  <View style={styles.txInfo}>
                    <Text style={styles.txLabel}>{cfg.label}</Text>
                    <Text style={styles.txSub}>
                      {tx.user} · {tx.date}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.txDelta,
                      {
                        color:
                          tx.delta < 0
                            ? Colors.critical.main
                            : tx.delta > 0
                            ? Colors.brand.primary
                            : Colors.neutral.textTertiary,
                      },
                    ]}
                  >
                    {tx.delta === 0 ? '—' : `${tx.delta > 0 ? '+' : ''}${tx.delta} ${item.unit}`}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* ── 6. Bottom Action Buttons ── */}
        <View style={styles.actionGrid}>
          <Pressable
            onPress={() => router.push('/stock-count/active' as any)}
            style={({ pressed }) => [styles.primaryActionBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="CheckCircle" size={18} color="#ffffff" />
            <Text style={styles.primaryActionText}>Count Item</Text>
          </Pressable>

          <Pressable
            onPress={() => {}}
            style={({ pressed }) => [styles.secondaryActionBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="Pencil" size={18} color={Colors.neutral.textPrimary} />
            <Text style={styles.secondaryActionText}>Adjust Stock</Text>
          </Pressable>

          {item.status === 'low' || item.status === 'critical' ? (
            <Pressable
              onPress={() => router.push('/orders' as any)}
              style={({ pressed }) => [styles.warningActionBtn, pressed && styles.pressed]}
            >
              <VectorIcon name="ShoppingCart" size={18} color={Colors.warning.dark} />
              <Text style={styles.warningActionText}>Reorder</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => {}}
              style={({ pressed }) => [styles.secondaryActionBtn, pressed && styles.pressed]}
            >
              <VectorIcon name="History" size={18} color={Colors.neutral.textPrimary} />
              <Text style={styles.secondaryActionText}>History</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  sectionCard: {
    padding: Spacing.lg,
  },
  sectionHeading: {
    ...Typography.sectionHeader,
    marginBottom: Spacing.md,
  },
  compareGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  physicalCol: {
    flex: 1,
    backgroundColor: Colors.brand.subtle,
    borderColor: Colors.brand.light,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },
  theoryCol: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },
  colHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.brand.primary,
  },
  slateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.neutral.textTertiary,
  },
  physicalColLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  theoryColLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.neutral.textSecondary,
  },
  physicalColValue: {
    ...Typography.monoKpiLarge,
    fontSize: 30,
    color: Colors.brand.dark,
    marginVertical: 2,
  },
  theoryColValue: {
    ...Typography.monoKpiLarge,
    fontSize: 30,
    color: Colors.neutral.textSecondary,
    marginVertical: 2,
  },
  physicalColUnit: {
    fontSize: 12,
    color: Colors.brand.primary,
    fontWeight: '600',
  },
  theoryColUnit: {
    fontSize: 12,
    color: Colors.neutral.textTertiary,
    fontWeight: '600',
  },
  varianceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  varianceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  varianceValue: {
    ...Typography.monoValue,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  targetGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  targetBox: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.borderLight,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  targetBoxHighlight: {
    backgroundColor: Colors.info.subtle,
    borderColor: Colors.info.light,
  },
  targetBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.neutral.textTertiary,
  },
  targetBoxValue: {
    ...Typography.monoValue,
    fontSize: 15,
    color: Colors.neutral.textPrimary,
    marginVertical: 2,
  },
  targetBoxUnit: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  activeScheduleBox: {
    backgroundColor: Colors.warning.subtle,
    borderColor: Colors.warning.light,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  activeScheduleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeScheduleTitle: {
    ...Typography.cardTitle,
    fontSize: 14,
  },
  activeScheduleSub: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  activeScheduleRight: {
    alignItems: 'flex-end',
  },
  activeScheduleCount: {
    ...Typography.monoValue,
    fontSize: 18,
    color: Colors.warning.dark,
  },
  activeScheduleTotal: {
    fontSize: 10,
    color: Colors.warning.dark,
  },
  activeScheduleBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeScheduleRemain: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
  },
  activeSchedulePct: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  continueBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  continueBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  otherSchedules: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.borderLight,
    paddingTop: Spacing.xs,
  },
  otherScheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  otherScheduleLabel: {
    fontSize: 13,
    color: Colors.neutral.textPrimary,
    fontWeight: '500',
  },
  otherScheduleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  otherScheduleDue: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  physLineSample: {
    width: 12,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.brand.primary,
  },
  theoLineSample: {
    width: 12,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.neutral.textTertiary,
  },
  legendText: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
  },
  batchList: {
    gap: Spacing.md,
  },
  batchItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
    paddingBottom: Spacing.md,
    gap: Spacing.xs,
  },
  batchTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  batchName: {
    ...Typography.cardTitle,
    fontSize: 13,
  },
  batchSub: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  batchProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  batchProgressText: {
    ...Typography.monoCaption,
    fontSize: 10,
    color: Colors.neutral.textTertiary,
    width: 24,
    textAlign: 'right',
  },
  txList: {
    gap: Spacing.sm,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  txIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  txSub: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    marginTop: 1,
  },
  txDelta: {
    ...Typography.monoValue,
    fontSize: 13,
    fontWeight: '700',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  primaryActionBtn: {
    flex: 1,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...Shadows.card,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    backgroundColor: Colors.neutral.card,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...Shadows.card,
  },
  secondaryActionText: {
    color: Colors.neutral.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  warningActionBtn: {
    flex: 1,
    backgroundColor: Colors.warning.subtle,
    borderColor: Colors.warning.light,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...Shadows.card,
  },
  warningActionText: {
    color: Colors.warning.dark,
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});

import { AddEditInventoryModal } from '@/components/inventory/add-edit-item-modal';
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
import { useI18n } from '@/i18n/I18nContext';
import { inventoryService } from '@/services/inventoryService';
import { InventoryItem } from '@/types/inventory';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InventoryDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, formatNumber } = useI18n();

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
      icon: 'ClipboardCheck',
      bg: Colors.brand.subtle,
      color: Colors.brand.primary,
      label: 'Stock Count',
    },
    ocr_invoice: {
      icon: 'FileText',
      bg: Colors.purple.subtle,
      color: Colors.purple.main,
      label: t('scan.title'),
    },
    adjustment: {
      icon: 'Pencil',
      bg: Colors.warning.subtle,
      color: Colors.warning.dark,
      label: 'Adjustment',
    },
  };

  const [range, setRange] = useState<'7D' | '30D' | '3M'>('7D');
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      setErrorMsg(null);
      inventoryService
        .getItemById(id)
        .then((res) => {
          if (res) {
            setItem(res);
          } else {
            setErrorMsg('Item not found');
          }
        })
        .catch((err) => {
          setErrorMsg(err?.message || 'Failed to load item');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: Colors.neutral.surface, justifyContent: 'center', alignItems: 'center' }]}>
        <TopBar title={t('common.loading')} showBack />
        <Text style={{ ...Typography.body, color: Colors.neutral.textSecondary, marginTop: Spacing.xl }}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  if (errorMsg || !item) {
    return (
      <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
        <TopBar title={t('common.error')} showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, gap: Spacing.md }}>
          <VectorIcon name="AlertCircle" size={40} color={Colors.critical.main} />
          <Text style={{ ...Typography.sectionHeader, color: Colors.critical.dark }}>
            {errorMsg || t('inventory.notFound', { defaultValue: 'Artikel nicht gefunden' })}
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, backgroundColor: Colors.brand.primary, borderRadius: Radius.md }}
          >
            <Text style={{ ...Typography.body, fontWeight: '700', color: '#FFFFFF' }}>{t('inventory.backToList')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const phys = Number(item.physicalStock ?? 0);
  const theo = Number(item.theoreticalStock ?? 0);
  const variance = isNaN(phys - theo) ? 0 : phys - theo;
  const variancePct = theo > 0 ? (variance / theo) * 100 : 0;
  const recommended = Math.max(0, (Number(item.targetStock) || 0) - phys + (Number(item.safetyStock) || 0));

  const trendData = useMemo(() => {
    const base = Number(item.physicalStock) || 0;
    const theoVal = Number(item.theoreticalStock) || 0;
    if (range === '7D') {
      return {
        physical: [
          Math.round(base * 1.08),
          Math.round(base * 1.05),
          Math.round(base * 1.04),
          Math.round(base * 1.02),
          Math.round(base * 1.01),
          Math.round(base * 1.00),
          base,
        ],
        theoretical: [
          Math.round(theoVal * 1.06),
          Math.round(theoVal * 1.04),
          Math.round(theoVal * 1.03),
          Math.round(theoVal * 1.01),
          Math.round(theoVal * 1.00),
          Math.round(theoVal * 0.99),
          theoVal,
        ],
        labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Today'],
      };
    }
    if (range === '30D') {
      return {
        physical: [
          Math.round(base * 1.30),
          Math.round(base * 1.25),
          Math.round(base * 1.18),
          Math.round(base * 1.12),
          Math.round(base * 1.05),
          base,
        ],
        theoretical: [
          Math.round(theoVal * 1.28),
          Math.round(theoVal * 1.22),
          Math.round(theoVal * 1.15),
          Math.round(theoVal * 1.10),
          Math.round(theoVal * 1.04),
          theoVal,
        ],
        labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'Now'],
      };
    }
    return {
      physical: [
        Math.round(base * 1.50),
        Math.round(base * 1.35),
        Math.round(base * 1.20),
        Math.round(base * 1.10),
        base,
      ],
      theoretical: [
        Math.round(theoVal * 1.45),
        Math.round(theoVal * 1.30),
        Math.round(theoVal * 1.18),
        Math.round(theoVal * 1.08),
        theoVal,
      ],
      labels: ['M1', 'M2', 'M3', 'M4', 'Now'],
    };
  }, [item.physicalStock, item.theoreticalStock, range]);

  const handleDelete = () => {
    if (!item) return;
    Alert.alert(
      t('inventory.deleteConfirmTitle', { defaultValue: 'Delete Raw Material' }),
      t('inventory.deleteConfirmMessage', {
        name: item.name,
        defaultValue: `Are you sure you want to delete '${item.name}'? This will archive it from active inventory.`,
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await inventoryService.deleteItem(item.id);
              router.replace('/(tabs)/inventory' as any);
            } catch (err: any) {
              Alert.alert('Delete Failed', err?.message || 'Unable to delete item');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      {/* ── TopBar ── */}
      <TopBar
        title={item.name}
        subtitle={`${t('inventory.sku', { sku: item.sku })} · ${item.category}`}
        showBack
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Pressable
              onPress={() => setShowEditModal(true)}
              style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
            >
              <VectorIcon name="Pencil" size={18} color={Colors.neutral.textPrimary} />
            </Pressable>
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
            >
              <VectorIcon name="Trash2" size={18} color={Colors.critical.main} />
            </Pressable>
          </View>
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
          <Text style={styles.sectionHeading}>{t('inventory.variance')}</Text>

          {/* Big Two-Column Comparison */}
          <View style={styles.compareGrid}>
            {/* Physical (Is) */}
            <View style={styles.physicalCol}>
              <View style={styles.colHeader}>
                <View style={styles.greenDot} />
                <Text style={styles.physicalColLabel}>{t('inventory.physicalStock').toUpperCase()}</Text>
              </View>
              <Text style={styles.physicalColValue}>{item.physicalStock}</Text>
              <Text style={styles.physicalColUnit}>{item.unit}</Text>
            </View>

            {/* Theory (Should) */}
            <View style={styles.theoryCol}>
              <View style={styles.colHeader}>
                <View style={styles.slateDot} />
                <Text style={styles.theoryColLabel}>{t('inventory.theoreticalStock').toUpperCase()}</Text>
              </View>
              <Text style={styles.theoryColValue}>{item.theoreticalStock}</Text>
              <Text style={styles.theoryColUnit}>{item.unit}</Text>
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
              <Text style={styles.varianceLabel}>{t('inventory.variance')}</Text>
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
              <Text style={styles.targetBoxLabel}>{t('inventory.parLevel')}</Text>
              <Text style={styles.targetBoxValue}>{item.targetStock}</Text>
              <Text style={styles.targetBoxUnit}>{item.unit}</Text>
            </View>

            <View style={styles.targetBox}>
              <Text style={styles.targetBoxLabel}>{t('inventory.reorderPoint')}</Text>
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
                {t('orders.title')}
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
            <Text style={styles.sectionHeading}>{t('navigation.stockCount')}</Text>
            <Badge variant="amber">{t('common.inProgress')}</Badge>
          </View>

          <View style={styles.activeScheduleBox}>
            <View style={styles.activeScheduleTop}>
              <View>
                <Text style={styles.activeScheduleTitle}>{t('navigation.stockCount')}</Text>
                <Text style={styles.activeScheduleSub}>{t('common.today')}</Text>
              </View>
              <View style={styles.activeScheduleRight}>
                <Text style={styles.activeScheduleCount}>42</Text>
                <Text style={styles.activeScheduleTotal}>of 68</Text>
              </View>
            </View>

            <ProgressBar value={42} max={68} variant="green" height={6} />

            <View style={styles.activeScheduleBottom}>
              <Text style={styles.activeScheduleRemain}>{t('stockCount.itemsToCount', { count: 26 })}</Text>
              <Text style={styles.activeSchedulePct}>62%</Text>
            </View>
          </View>

          {/* Continue Count Button */}
          <Pressable
            onPress={() => router.push('/stock-count/active' as any)}
            style={({ pressed }) => [styles.continueBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="Play" size={15} color="#ffffff" />
            <Text style={styles.continueBtnText}>{t('stockCount.title')}</Text>
          </Pressable>
        </Card>

        {/* ── 3. Stock Trend Line Chart ── */}
        <Card style={styles.sectionCard}>
          <View style={styles.trendHeader}>
            <Text style={styles.sectionHeading}>{t('analytics.trends')}</Text>
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
              <Text style={styles.legendText}>{t('inventory.physicalStock')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.theoLineSample} />
              <Text style={styles.legendText}>{t('inventory.theoreticalStock')}</Text>
            </View>
          </View>
        </Card>

        {/* ── 4. Batches & Expiration ── */}
        <Card style={styles.sectionCard}>
          <SectionHeader title={t('expiration.title')} />
          <View style={styles.batchList}>
            {(item.batches && item.batches.length > 0) ? (
              (item.batches || []).map((batch) => {
                const days = batch.daysRemaining ?? 99;
                const isExpired = days < 0;
                const isCritical = days <= 2;
                const isWarning = days <= 7 && !isCritical;
                const variant = isExpired ? 'red' : isCritical ? 'red' : isWarning ? 'amber' : 'green';

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
                        {isExpired
                          ? 'Expired'
                          : days === 0
                          ? 'Today'
                          : days === 1
                          ? 'Tomorrow'
                          : `${days}d left`}
                      </Badge>
                    </View>

                    <View style={styles.batchProgressRow}>
                      <ProgressBar
                        value={isExpired ? 0 : Math.max(1, Math.min(30, days))}
                        max={30}
                        variant={variant}
                        height={4}
                      />
                      <Text style={styles.batchProgressText}>
                        {isExpired ? 'Expired' : days === 0 ? 'Today' : `${days}d`}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={{ color: Colors.neutral.textSecondary, fontSize: 13, paddingVertical: 8 }}>
                {t('inventory.noBatches')}
              </Text>
            )}
          </View>
        </Card>

        {/* ── 5. Recent Transactions ── */}
        <Card style={styles.sectionCard}>
          <SectionHeader title={t('dashboard.recentActivityTitle')} />
          <View style={styles.txList}>
            {(item.transactions && item.transactions.length > 0) ? (
              item.transactions.map((tx) => {
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
              })
            ) : (
              <Text style={{ color: Colors.neutral.textSecondary, fontSize: 13, paddingVertical: 8 }}>
                {t('dashboard.noTasks') || 'No recent activity transactions recorded.'}
              </Text>
            )}
          </View>
        </Card>

        {/* ── 6. Bottom Action Buttons ── */}
        <View style={styles.actionGrid}>
          <Pressable
            onPress={() => router.push('/stock-count/active' as any)}
            style={({ pressed }) => [styles.primaryActionBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="CheckCircle" size={18} color="#ffffff" />
            <Text style={styles.primaryActionText}>{t('stockCount.title')}</Text>
          </Pressable>

          <Pressable
            onPress={() => setShowEditModal(true)}
            style={({ pressed }) => [styles.secondaryActionBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="Pencil" size={18} color={Colors.neutral.textPrimary} />
            <Text style={styles.secondaryActionText}>{t('common.edit')}</Text>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.dangerActionBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="Trash2" size={18} color={Colors.critical.main} />
            <Text style={styles.dangerActionText}>{t('common.delete')}</Text>
          </Pressable>

          {item.status === 'low' || item.status === 'critical' ? (
            <Pressable
              onPress={() => router.push('/orders' as any)}
              style={({ pressed }) => [styles.warningActionBtn, pressed && styles.pressed]}
            >
              <VectorIcon name="ShoppingCart" size={18} color={Colors.warning.dark} />
              <Text style={styles.warningActionText}>{t('orders.title')}</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => router.push('/analytics' as any)}
              style={({ pressed }) => [styles.secondaryActionBtn, pressed && styles.pressed]}
            >
              <VectorIcon name="History" size={18} color={Colors.neutral.textPrimary} />
              <Text style={styles.secondaryActionText}>{t('analytics.title')}</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* ── Edit Item Modal ── */}
      <AddEditInventoryModal
        visible={showEditModal}
        initialItem={item}
        onClose={() => setShowEditModal(false)}
        onSuccess={(updatedItem) => {
          setItem((prev) => (prev ? { ...prev, ...updatedItem } : updatedItem));
        }}
      />
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
  dangerActionBtn: {
    flex: 1,
    backgroundColor: Colors.critical.subtle,
    borderColor: Colors.critical.light,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...Shadows.card,
  },
  dangerActionText: {
    color: Colors.critical.main,
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});

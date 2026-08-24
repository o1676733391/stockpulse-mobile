import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DonutChart, Sparkline, StockBar } from '@/components/ui/charts';
import { VectorIcon } from '@/components/ui/icons';
import { KpiCard } from '@/components/ui/kpi-card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SectionHeader } from '@/components/ui/section-header';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import {
  mockActivityItems,
  mockAdminKpis,
  mockDashboardTasks,
  mockExpiryItems,
  mockQuickActions,
  mockSparklineTrend,
  mockStockHealth,
} from '@/mocks/inventoryMockData';
import { analyticsService } from '@/services/analyticsService';
import { expirationService } from '@/services/expirationService';
import { authService } from '@/services/authService';
import { DashboardExpiryItem, DashboardKpi } from '@/types/inventory';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, formatDate, formatCurrency, formatNumber } = useI18n();
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expiryItems, setExpiryItems] = useState<DashboardExpiryItem[]>(mockExpiryItems);
  const [adminKpis, setAdminKpis] = useState<DashboardKpi[]>(mockAdminKpis);
  const [sparklineData, setSparklineData] = useState<number[]>(mockSparklineTrend);

  const loadData = useCallback(async () => {
    try {
      const [valRes, expRes] = await Promise.all([
        analyticsService.getStockValuation(),
        expirationService.getExpiringItems(),
      ]);

      if (valRes?.trend7D?.values) {
        setSparklineData(valRes.trend7D.values);
        setAdminKpis((prev) => [
          {
            ...prev[0],
            value: formatCurrency(valRes.totalValuation),
          },
          prev[1],
          {
            ...prev[2],
            value: `${expRes.length}`,
          },
          prev[3],
        ]);
      }

      if (expRes && expRes.length > 0) {
        setExpiryItems(
          expRes.map((e) => ({
            id: e.id,
            name: e.name,
            qty: `${e.qty} ${e.unit}`,
            exp: t('inventory.daysRemaining', { count: e.days }),
            days: e.days,
            urgency: e.status === 'critical' ? 'critical' : 'warning',
            value: formatCurrency(e.value),
          }))
        );
      }
    } catch {
      // Fallback already logged by service
    }
  }, [formatCurrency, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const criticalExpiry = expiryItems.filter((e) => e.urgency === 'critical');
  const totalValueAtRisk = expiryItems.reduce(
    (sum, item) => sum + parseFloat(item.value.replace(/[^0-9.-]+/g, '') || '0'),
    0
  );

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      {/* ── Top Store Header ── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top > 0 ? insets.top + Spacing.xs : Spacing.md,
          },
        ]}
      >
        <View style={styles.headerRow}>
          {/* Store Switcher */}
          <Pressable
            style={({ pressed }) => [styles.storeSelector, pressed && styles.pressed]}
            hitSlop={4}
          >
            {Platform.OS === 'android' && (
              <View style={styles.storeIcon}>
                <VectorIcon name="Store" size={16} color={Colors.brand.primary} />
              </View>
            )}
            <View>
              <Text style={styles.storeSub}>{t('dashboard.activeStore', { store: '' })}</Text>
              <View style={styles.storeNameRow}>
                <Text style={styles.storeName}>Bella Cucina</Text>
                <VectorIcon name="ChevronDown" size={14} color={Colors.brand.primary} strokeWidth={2.5} />
              </View>
            </View>
          </Pressable>

          {/* Right Header Actions */}
          <View style={styles.headerRight}>
            <View style={styles.dateBadge}>
              <VectorIcon name="Calendar" size={12} color={Colors.neutral.textSecondary} />
              <Text style={styles.dateText}>{formatDate(new Date(), { month: 'short', day: 'numeric' })}</Text>
            </View>

            <Pressable
              onPress={() => router.push('/notifications' as any)}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            >
              <VectorIcon name="Bell" size={20} color={Colors.neutral.textPrimary} strokeWidth={1.8} />
              <View style={styles.notificationDot} />
            </Pressable>

            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AS</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Scrollable Dashboard Content ── */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.brand.primary]}
            tintColor={Colors.brand.primary}
          />
        }
      >
        {/* ── Urgent Expiration Alert ── */}
        {!alertDismissed && criticalExpiry.length > 0 && (
          <View style={styles.alertBanner}>
            <VectorIcon name="AlertTriangle" size={18} color={Colors.critical.main} />
            <View style={styles.alertTextContainer}>
              <Text style={styles.alertTitle}>
                {t('dashboard.tasks.expiringBrd', { count: criticalExpiry.length })}
              </Text>
              <Text style={styles.alertSub}>
                {t('dashboard.tasks.expiringBrdSub')}
              </Text>
            </View>
            <View style={styles.alertActions}>
              <Pressable
                onPress={() => router.push('/expiration' as any)}
                hitSlop={4}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text style={styles.alertLink}>{t('common.details')}</Text>
              </Pressable>
              <Pressable
                onPress={() => setAlertDismissed(true)}
                hitSlop={8}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <VectorIcon name="X" size={16} color={Colors.critical.main} />
              </Pressable>
            </View>
          </View>
        )}

        {/* ── KPI Overview Grid ── */}
        <View style={styles.section}>
          <SectionHeader
            title={t('common.overview')}
            action={t('common.details')}
            onAction={() => router.push('/inventory' as any)}
          />
          <View style={styles.kpiGrid}>
            <View style={styles.kpiRow}>
              <KpiCard
                label={t('dashboard.kpis.totalValuation')}
                value={adminKpis[0]?.value || '€48,920.00'}
                sub={adminKpis[0]?.sub}
                variant={adminKpis[0]?.variant}
                trend={adminKpis[0]?.trend}
                onPress={() => router.push('/inventory' as any)}
              />
              <KpiCard
                label={t('dashboard.kpis.healthyRate')}
                value={adminKpis[1]?.value || '82.4%'}
                sub={adminKpis[1]?.sub}
                variant={adminKpis[1]?.variant}
                trend={adminKpis[1]?.trend}
                onPress={() => router.push('/inventory' as any)}
              />
            </View>
            <View style={styles.kpiRow}>
              <KpiCard
                label={t('dashboard.kpis.expiringSoon')}
                value={adminKpis[2]?.value || '7'}
                sub={adminKpis[2]?.sub}
                variant={adminKpis[2]?.variant}
                trend={adminKpis[2]?.trend}
                onPress={() => router.push('/expiration' as any)}
              />
              <KpiCard
                label={t('dashboard.kpis.openOrders')}
                value={adminKpis[3]?.value || '3'}
                sub={adminKpis[3]?.sub}
                variant={adminKpis[3]?.variant}
                trend={adminKpis[3]?.trend}
                onPress={() => router.push('/orders' as any)}
              />
            </View>
          </View>

          {/* Pending Purchase Orders Card */}
          <Card
            onPress={() => router.push('/orders' as any)}
            style={styles.pendingPoCard}
          >
            <View style={styles.pendingPoLeft}>
              <View style={styles.poIconBox}>
                <VectorIcon name="ShoppingCart" size={18} color={Colors.info.main} />
              </View>
              <View style={styles.pendingPoText}>
                <Text style={styles.poTitle}>{t('orders.title')}</Text>
                <Text style={styles.poSub}>{formatCurrency(485)} {t('common.total')}</Text>
              </View>
            </View>
            <View style={styles.pendingPoRight}>
              <View style={styles.poCountBadge}>
                <Text style={styles.poCountText}>3</Text>
              </View>
              <VectorIcon name="ChevronRight" size={16} color={Colors.neutral.textTertiary} />
            </View>
          </Card>
        </View>

        {/* ── Today's Tasks ── */}
        <View style={styles.section}>
          <SectionHeader title={t('dashboard.urgentTasksTitle')} action={t('common.viewAll')} />
          <View style={styles.taskStack}>
            {mockDashboardTasks.map((task) => (
              <Card
                key={task.id}
                onPress={() => router.push(task.route as any)}
                style={styles.taskCard}
              >
                <View style={styles.taskRow}>
                  <View style={[styles.taskIconBox, { backgroundColor: task.bg }]}>
                    <VectorIcon name={task.iconName} size={18} color={task.color} />
                  </View>

                  <View style={styles.taskInfo}>
                    <View style={styles.taskTitleRow}>
                      <Text style={styles.taskTitle}>{task.label}</Text>
                      {task.badge && (
                        <Badge variant={task.badgeVariant ?? 'gray'}>
                          {task.badge}
                        </Badge>
                      )}
                    </View>

                    {task.done != null && task.total != null ? (
                      <View style={styles.progressContainer}>
                        <View style={styles.progressLabelRow}>
                          <Text style={styles.taskSub}>{task.sub}</Text>
                          <Text style={styles.taskProgressText}>
                            {task.done} / {task.total}
                          </Text>
                        </View>
                        <ProgressBar value={task.done} max={task.total} variant="green" height={5} />
                      </View>
                    ) : (
                      <Text style={styles.taskSub}>{task.sub}</Text>
                    )}
                  </View>

                  <VectorIcon name="ChevronRight" size={16} color={Colors.neutral.textTertiary} />
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.section}>
          <SectionHeader title={t('dashboard.quickActions')} />
          <View style={styles.quickActionGrid}>
            {mockQuickActions.map((action) => (
              <Pressable
                key={action.id}
                onPress={() => router.push(action.route as any)}
                style={({ pressed }) => [styles.quickActionCard, pressed && styles.pressed]}
              >
                <View style={[styles.actionIconBox, { backgroundColor: action.bg }]}>
                  <VectorIcon name={action.iconName} size={20} color={action.iconColor} />
                </View>
                <Text style={styles.actionLabel}>
                  {action.id === 'count'
                    ? t('dashboard.quickActionButtons.count')
                    : action.id === 'scan'
                    ? t('dashboard.quickActionButtons.scan')
                    : action.id === 'order'
                    ? t('dashboard.quickActionButtons.order')
                    : t('dashboard.quickActionButtons.expiry')}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Stock Health ── */}
        <View style={styles.section}>
          <SectionHeader
            title={t('dashboard.stockHealthTitle')}
            action={t('common.viewAll')}
            onAction={() => router.push('/inventory' as any)}
          />
          <Card style={styles.stockHealthCard}>
            <View style={styles.donutRow}>
              <DonutChart
                segments={mockStockHealth.map((s) => ({ value: s.count, color: s.color }))}
                size={86}
                strokeWidth={8}
                centerNumber="100"
                centerLabel={t('navigation.inventory')}
              />

              <View style={styles.healthLegend}>
                {mockStockHealth.map((item) => (
                  <View key={item.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendLabel}>
                      {item.label === 'Optimal'
                        ? t('dashboard.stockHealth.healthy')
                        : item.label === 'Low Stock'
                        ? t('dashboard.stockHealth.low')
                        : item.label === 'Critical'
                        ? t('dashboard.stockHealth.critical')
                        : t('dashboard.stockHealth.overstock')}
                    </Text>
                    <Text style={styles.legendCount}>{item.count}</Text>
                    <Text style={styles.legendPct}>{item.pct}%</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Segmented Stock Bar */}
            <View style={{ marginVertical: Spacing.md }}>
              <StockBar segments={mockStockHealth} height={8} />
            </View>
          </Card>
        </View>

        {/* ── Expiration Alerts ── */}
        <View style={styles.section}>
          <SectionHeader
            title={t('expiration.title')}
            action={t('common.viewAll')}
            onAction={() => router.push('/expiration' as any)}
          />

          <View style={styles.riskSummaryRow}>
            <VectorIcon name="AlertTriangle" size={12} color={Colors.critical.main} />
            <Text style={styles.riskSummaryText}>
              {t('expiration.potentialLoss', { value: formatCurrency(totalValueAtRisk) })}
            </Text>
          </View>

          <View style={styles.expiryStack}>
            {mockExpiryItems.map((item) => (
              <Card
                key={item.id}
                onPress={() => router.push('/expiration' as any)}
                urgencyColor={item.urgency === 'critical' ? Colors.critical.main : Colors.warning.main}
                style={styles.expiryCard}
              >
                <View style={styles.expiryRow}>
                  {/* Days Pill */}
                  <View
                    style={[
                      styles.daysBox,
                      {
                        backgroundColor:
                          item.urgency === 'critical'
                            ? Colors.critical.subtle
                            : Colors.warning.subtle,
                        borderColor:
                          item.urgency === 'critical'
                            ? Colors.critical.light
                            : Colors.warning.light,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.daysNumber,
                        {
                          color:
                            item.urgency === 'critical'
                              ? Colors.critical.main
                              : Colors.warning.dark,
                        },
                      ]}
                    >
                      {item.days}
                    </Text>
                    <Text
                      style={[
                        styles.daysLabel,
                        {
                          color:
                            item.urgency === 'critical'
                              ? Colors.critical.main
                              : Colors.warning.dark,
                        },
                      ]}
                    >
                      {t('common.date')}
                    </Text>
                  </View>

                  <View style={styles.expiryInfo}>
                    <Text style={styles.expiryName}>{item.name}</Text>
                    <Text style={styles.expiryMeta}>{item.qty} · {item.exp}</Text>
                  </View>

                  <View style={styles.expiryRight}>
                    <Badge variant={item.urgency === 'critical' ? 'red' : 'amber'}>
                      {item.urgency === 'critical' ? t('dashboard.stockHealth.critical') : t('dashboard.stockHealth.low')}
                    </Badge>
                    <Text style={styles.expiryValue}>{item.value}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* ── Recent Activity ── */}
        <View style={styles.section}>
          <SectionHeader title={t('dashboard.recentActivityTitle')} />
          <Card noPadding style={styles.activityCard}>
            {mockActivityItems.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.activityRow,
                  index < mockActivityItems.length - 1 && styles.activityBorder,
                ]}
              >
                <View style={styles.activityIconWrapper}>
                  <View style={styles.activityIconCircle}>
                    <VectorIcon name={item.iconName} size={15} color={Colors.neutral.textSecondary} strokeWidth={2} />
                  </View>
                  <View style={[styles.activityDot, { backgroundColor: item.dotColor }]} />
                </View>

                <View style={styles.activityContent}>
                  <Text style={styles.activityLabel}>{item.label}</Text>
                  <Text style={styles.activitySub} numberOfLines={1}>{item.sub}</Text>
                </View>

                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.neutral.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  storeIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeSub: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    fontWeight: '500',
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.borderLight,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.lg,
  },
  dateText: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    fontWeight: '600',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.critical.main,
    borderWidth: 1.5,
    borderColor: Colors.neutral.card,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  section: {
    gap: Spacing.xs,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.critical.subtle,
    borderColor: Colors.critical.light,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.critical.dark,
  },
  alertSub: {
    fontSize: 12,
    color: Colors.critical.main,
    marginTop: 2,
  },
  alertActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  alertLink: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.critical.main,
  },
  kpiGrid: {
    gap: Spacing.sm,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  pendingPoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  pendingPoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  poIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.info.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingPoText: {
    flex: 1,
  },
  poTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  poSub: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    marginTop: 2,
  },
  pendingPoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  poCountBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.info.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poCountText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  taskStack: {
    gap: Spacing.sm,
  },
  taskCard: {
    padding: Spacing.md,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  taskIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskInfo: {
    flex: 1,
    gap: 2,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  taskTitle: {
    ...Typography.cardTitle,
    fontSize: 14,
  },
  taskSub: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
  },
  progressContainer: {
    marginTop: 2,
    gap: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskProgressText: {
    ...Typography.monoCaption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.neutral.textSecondary,
  },
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickActionCard: {
    width: '48.5%',
    backgroundColor: Colors.neutral.card,
    borderRadius: Radius.xl,
    borderColor: Colors.neutral.borderLight,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.card,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    textAlign: 'center',
  },
  stockHealthCard: {
    padding: Spacing.lg,
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  healthLegend: {
    flex: 1,
    gap: Spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    flex: 1,
  },
  legendCount: {
    ...Typography.monoCaption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  legendPct: {
    ...Typography.monoCaption,
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    width: 32,
    textAlign: 'right',
  },
  sparklineSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.borderLight,
    paddingTop: Spacing.md,
  },
  sparklineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  sparklineTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutral.textTertiary,
  },
  sparklineTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  sparklineTrendText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  sparklineContainer: {
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  sparklineDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sparklineDate: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
  },
  riskSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  riskSummaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.critical.main,
  },
  expiryStack: {
    gap: Spacing.sm,
  },
  expiryCard: {
    padding: Spacing.md,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  daysBox: {
    width: 42,
    height: 42,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysNumber: {
    ...Typography.monoValue,
    fontSize: 16,
    lineHeight: 18,
  },
  daysLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  expiryInfo: {
    flex: 1,
  },
  expiryName: {
    ...Typography.cardTitle,
    fontSize: 14,
  },
  expiryMeta: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  expiryRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  expiryValue: {
    ...Typography.monoCaption,
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  activityCard: {
    borderRadius: Radius.xl,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  activityBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  activityIconWrapper: {
    position: 'relative',
  },
  activityIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.neutral.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.neutral.card,
  },
  activityContent: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  activitySub: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    marginTop: 1,
  },
  activityTime: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  pressed: {
    opacity: 0.8,
  },
});

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DonutChart, Sparkline, StockBar } from '@/components/ui/charts';
import { DesktopAccessNotice } from '@/components/ui/desktop-access-notice';
import { VectorIcon } from '@/components/ui/icons';
import { KpiCard } from '@/components/ui/kpi-card';
import { LanguageQuickBar } from '@/components/ui/language-quick-bar';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SectionHeader } from '@/components/ui/section-header';
import { NoStoreState } from '@/components/ui/no-store-state';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { analyticsService } from '@/services/analyticsService';
import { expirationService } from '@/services/expirationService';
import { inventoryService } from '@/services/inventoryService';
import { notificationService, localizeNotification } from '@/services/notificationService';
import { procurementService } from '@/services/procurementService';
import { DashboardExpiryItem, DashboardKpi, StockHealthSegment } from '@/types/inventory';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface QuickActionItem {
  id: string;
  iconName: string;
  label: string;
  route: string;
  bg: string;
  iconColor: string;
}

interface ActivityItem {
  id: string;
  iconName: string;
  label: string;
  sub: string;
  time: string;
  dotColor: string;
}

interface DashboardTask {
  id: string;
  iconName: string;
  color: string;
  bg: string;
  label: string;
  sub: string;
  badge?: string;
  badgeVariant?: 'red' | 'amber' | 'green' | 'blue' | 'gray' | 'purple';
  done?: number;
  total?: number;
  route: string;
}

const DEFAULT_QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'count',
    iconName: 'ClipboardList',
    label: 'Stock Count',
    route: '/stock-count',
    bg: '#ede9fe',
    iconColor: '#6d28d9',
  },
  {
    id: 'scan',
    iconName: 'ScanLine',
    label: 'Scan POS',
    route: '/scan',
    bg: '#dbeafe',
    iconColor: '#1d4ed8',
  },
  {
    id: 'order',
    iconName: 'ShoppingCart',
    label: 'Create PO',
    route: '/orders',
    bg: '#d1fae5',
    iconColor: '#047857',
  },
  {
    id: 'expiry',
    iconName: 'AlertTriangle',
    label: 'BBD Expiry',
    route: '/expiration',
    bg: '#fee2e2',
    iconColor: '#dc2626',
  },
];

const INITIAL_ADMIN_KPIS: DashboardKpi[] = [
  { label: 'Total Valuation', value: '--', sub: 'Active stock', variant: 'green', trend: { dir: 'up', label: '+3.4%' } },
  { label: 'Healthy Rate', value: '--', sub: 'Target range', variant: 'blue', trend: { dir: 'flat', label: '0%' } },
  { label: 'Expiring Soon', value: '--', sub: 'In ≤7 days', variant: 'amber', trend: { dir: 'down', label: 'Critical' } },
  { label: 'Open Orders', value: '--', sub: 'Inbound', variant: 'purple', trend: { dir: 'flat', label: 'Pending' } },
];

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t, language, formatDate, formatCurrency } = useI18n();
  const isDe = language === 'de';

  const quickActions: QuickActionItem[] = useMemo(
    () => [
      {
        id: 'count',
        iconName: 'ClipboardList',
        label: t('dashboard.actions.stockCount'),
        route: '/stock-count',
        bg: '#ede9fe',
        iconColor: '#6d28d9',
      },
      {
        id: 'scan',
        iconName: 'ScanLine',
        label: t('dashboard.actions.scanReceipt'),
        route: '/scan',
        bg: '#dbeafe',
        iconColor: '#1d4ed8',
      },
      {
        id: 'order',
        iconName: 'ShoppingCart',
        label: t('dashboard.actions.createPo'),
        route: '/orders',
        bg: '#d1fae5',
        iconColor: '#047857',
      },
      {
        id: 'expiry',
        iconName: 'AlertTriangle',
        label: t('dashboard.actions.expiryAlerts'),
        route: '/expiration',
        bg: '#fee2e2',
        iconColor: '#dc2626',
      },
    ],
    [t]
  );

  const [alertDismissed, setAlertDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [adminKpis, setAdminKpis] = useState<DashboardKpi[]>(INITIAL_ADMIN_KPIS);
  const [sparklineData, setSparklineData] = useState<number[]>([]);
  const [expiryItems, setExpiryItems] = useState<DashboardExpiryItem[]>([]);
  const [stockHealth, setStockHealth] = useState<StockHealthSegment[]>([
    { label: 'Optimal', count: 0, pct: 0, color: Colors.brand.primary, bg: Colors.brand.subtle },
    { label: 'Low Stock', count: 0, pct: 0, color: Colors.warning.main, bg: Colors.warning.subtle },
    { label: 'Critical', count: 0, pct: 0, color: Colors.critical.main, bg: Colors.critical.subtle },
    { label: 'Overstock', count: 0, pct: 0, color: Colors.info.main, bg: Colors.info.subtle },
  ]);
  const [totalItemsCount, setTotalItemsCount] = useState<number | null>(null);
  const [pendingPoCount, setPendingPoCount] = useState<number | null>(null);
  const [pendingPoTotal, setPendingPoTotal] = useState<number | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);

  const hasNoStore = !user?.storeId || user.storeId === 'unassigned' || user.storeId === '' || user.storeId === 'pending';

  const loadData = useCallback(async () => {
    if (hasNoStore) {
      setLoading(false);
      setExpiryItems([]);
      setAdminKpis(INITIAL_ADMIN_KPIS);
      setTotalItemsCount(0);
      setPendingPoCount(0);
      setPendingPoTotal(0);
      setUnreadNotifCount(0);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const [valRes, expRes, ordersRes, itemsRes, notifsRes] = await Promise.allSettled([
        analyticsService.getStockValuation(),
        expirationService.getExpiringItems(),
        procurementService.getOrders('active'),
        inventoryService.getItems(),
        notificationService.getNotifications(),
      ]);

      const valuationData = valRes.status === 'fulfilled' ? valRes.value : null;
      const expiringData = expRes.status === 'fulfilled' ? expRes.value : [];
      const activeOrdersData = ordersRes.status === 'fulfilled' ? ordersRes.value : [];
      const inventoryItems = itemsRes.status === 'fulfilled' ? itemsRes.value : [];
      const notifications = notifsRes.status === 'fulfilled' ? notifsRes.value : [];

      // 1. Process Total Valuation & Sparkline
      const totalVal = valuationData?.totalValuation ?? (inventoryItems.reduce((acc, it) => acc + (it.physicalStock * it.costPerUnit), 0));
      if (valuationData?.trend7D?.values) {
        setSparklineData(valuationData.trend7D.values);
      }

      // 2. Process Inventory Stock Health
      const totalItems = inventoryItems.length;
      setTotalItemsCount(totalItems);

      const optimalCount = inventoryItems.filter((i) => i.status === 'healthy').length;
      const lowCount = inventoryItems.filter((i) => i.status === 'low').length;
      const criticalCount = inventoryItems.filter((i) => i.status === 'critical').length;
      const overstockCount = inventoryItems.filter((i) => i.status === 'overstock').length;

      const healthyPct = totalItems > 0 ? Math.round((optimalCount / totalItems) * 100) : 100;
      const lowPct = totalItems > 0 ? Math.round((lowCount / totalItems) * 100) : 0;
      const criticalPct = totalItems > 0 ? Math.round((criticalCount / totalItems) * 100) : 0;
      const overstockPct = totalItems > 0 ? Math.round((overstockCount / totalItems) * 100) : 0;

      setStockHealth([
        { label: 'Optimal', count: optimalCount, pct: healthyPct, color: Colors.brand.primary, bg: Colors.brand.subtle },
        { label: 'Low Stock', count: lowCount, pct: lowPct, color: Colors.warning.main, bg: Colors.warning.subtle },
        { label: 'Critical', count: criticalCount, pct: criticalPct, color: Colors.critical.main, bg: Colors.critical.subtle },
        { label: 'Overstock', count: overstockCount, pct: overstockPct, color: Colors.info.main, bg: Colors.info.subtle },
      ]);

      // 3. Process Pending Purchase Orders
      const openOrders = activeOrdersData.length;
      const poTotal = activeOrdersData.reduce((sum, po) => sum + (po.total || 0), 0);
      setPendingPoCount(openOrders);
      setPendingPoTotal(poTotal);

      // 4. Update KPIs
      setAdminKpis([
        {
          label: t('dashboard.kpis.totalValuation'),
          value: formatCurrency(totalVal),
          sub: t('dashboard.kpis.activeStock'),
          variant: 'green',
          trend: { dir: 'up', label: '+3.4%' },
        },
        {
          label: t('dashboard.kpis.healthyRate'),
          value: `${healthyPct}%`,
          sub: t('dashboard.kpis.targetRange'),
          variant: 'blue',
          trend: { dir: healthyPct >= 90 ? 'up' : 'down', label: `${healthyPct}%` },
        },
        {
          label: t('dashboard.kpis.expiringSoon'),
          value: `${expiringData.length}`,
          sub: t('dashboard.kpis.within7Days'),
          variant: 'amber',
          trend: { dir: expiringData.length > 0 ? 'down' : 'flat', label: `${expiringData.length}` },
        },
        {
          label: t('dashboard.kpis.openOrders'),
          value: `${openOrders}`,
          sub: t('dashboard.kpis.inboundOrders'),
          variant: 'purple',
          trend: { dir: 'flat', label: `${openOrders}` },
        },
      ]);

      // 5. Process Expiring Items
      setExpiryItems(
        expiringData.map((e) => ({
          id: e.id,
          name: e.name,
          qty: `${e.qty} ${e.unit}`,
          exp: t('inventory.daysRemaining', { count: e.days }),
          days: e.days,
          urgency: e.status === 'critical' ? 'critical' : 'warning',
          value: formatCurrency(e.value),
        }))
      );

      // 6. Process Dynamic Dashboard Tasks
      const dynamicTasks: DashboardTask[] = [];
      if (expiringData.length > 0) {
        dynamicTasks.push({
          id: 'task-exp',
          iconName: 'AlertTriangle',
          color: Colors.critical.main,
          bg: Colors.critical.subtle,
          label: t('dashboard.tasks.expiringBatchesLabel'),
          sub: t('dashboard.tasks.expiringBatchesSub', { count: expiringData.length }),
          badge: `${expiringData.length} ${t('common.batches')}`,
          badgeVariant: 'red',
          route: '/expiration',
        });
      }

      if (lowCount + criticalCount > 0) {
        dynamicTasks.push({
          id: 'task-low',
          iconName: 'Package',
          color: Colors.warning.main,
          bg: Colors.warning.subtle,
          label: t('dashboard.tasks.lowStockLabel'),
          sub: t('dashboard.tasks.lowStockSub', { count: lowCount + criticalCount }),
          badge: `${lowCount + criticalCount} ${t('common.items')}`,
          badgeVariant: 'amber',
          route: '/inventory/overview',
        });
      }

      if (openOrders > 0) {
        dynamicTasks.push({
          id: 'task-orders',
          iconName: 'Truck',
          color: Colors.brand.primary,
          bg: Colors.brand.subtle,
          label: t('dashboard.tasks.openDeliveriesLabel'),
          sub: t('dashboard.tasks.openDeliveriesSub', { count: openOrders }),
          badge: `${openOrders} ${openOrders === 1 ? t('common.order') : t('common.orders')}`,
          badgeVariant: 'green',
          route: '/orders',
        });
      }

      dynamicTasks.push({
        id: 'task-count',
        iconName: 'ClipboardList',
        color: '#6d28d9',
        bg: '#ede9fe',
        label: t('dashboard.tasks.dailyCountLabel'),
        sub: t('dashboard.tasks.dailyCountSub'),
        badge: t('dashboard.tasks.scheduledBadge'),
        badgeVariant: 'purple',
        route: '/stock-count',
      });

      setTasks(dynamicTasks);

      // 7. Process Recent Activities from Real In-App Notifications
      const unreadCount = notifications.filter((n) => !n.read).length;
      setUnreadNotifCount(unreadCount);

      if (notifications.length > 0) {
        setRecentActivities(
          notifications.slice(0, 5).map((n) => {
            const loc = localizeNotification(n, language);
            return {
              id: n.id,
              iconName: n.type === 'expiring_soon' ? 'AlertTriangle' : n.type === 'variance' ? 'TrendingDown' : n.type === 'goods_receipt_update' ? 'Truck' : n.type === 'ocr_complete' ? 'ScanLine' : 'Info',
              label: loc.title,
              sub: loc.body,
              time: loc.time,
              dotColor: n.urgent ? Colors.critical.main : Colors.brand.primary,
            };
          })
        );
      } else {
        setRecentActivities([]);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [formatCurrency, hasNoStore, language, t]);

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
            onPress={() => router.push('/settings/store' as any)}
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
                <Text style={styles.storeName}>{user?.storeName || 'Store Location'}</Text>
                <VectorIcon name="ChevronDown" size={14} color={Colors.brand.primary} strokeWidth={2.5} />
              </View>
            </View>
          </Pressable>

          {/* Right Header Actions */}
          <View style={styles.headerRight}>
            <LanguageQuickBar compact />

            <View style={styles.dateBadge}>
              <VectorIcon name="Calendar" size={12} color={Colors.neutral.textSecondary} />
              <Text style={styles.dateText}>
                {formatDate(new Date().toISOString(), {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>

            <Pressable
              onPress={() => router.push('/notifications' as any)}
              style={({ pressed }) => [styles.notifBtn, pressed && styles.pressed]}
              hitSlop={6}
            >
              <VectorIcon name="Bell" size={18} color={Colors.neutral.textPrimary} />
              {unreadNotifCount > 0 && <View style={styles.notifBadgeDot} />}
            </Pressable>
          </View>
        </View>
      </View>

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
        <DesktopAccessNotice compact />

        {/* Guard for unassigned store */}
        {hasNoStore && (
          <NoStoreState style={{ marginHorizontal: 0, marginBottom: Spacing.lg }} />
        )}

        {/* Urgent Critical Alerts Banner */}
        {!alertDismissed && !loading && criticalExpiry.length > 0 && (
          <View style={styles.criticalAlertBanner}>
            <Pressable
              onPress={() => router.push('/expiration' as any)}
              style={({ pressed }) => [styles.criticalAlertPressable, pressed && styles.pressed]}
            >
              <View style={styles.criticalAlertIconBox}>
                <VectorIcon name="AlertTriangle" size={18} color="#FFFFFF" strokeWidth={2.4} />
              </View>
              <View style={styles.criticalAlertContent}>
                <Text style={styles.criticalAlertTitle}>
                  {criticalExpiry.length} {criticalExpiry.length === 1 ? 'Batch Expiring Tomorrow' : 'Batches Expiring Soon'}
                </Text>
                <Text style={styles.criticalAlertSub}>
                  {formatCurrency(totalValueAtRisk)} potential loss. Promo discount recommended.
                </Text>
              </View>
            </Pressable>
            <Pressable onPress={() => setAlertDismissed(true)} hitSlop={8} style={styles.dismissBtn}>
              <VectorIcon name="X" size={16} color="rgba(255,255,255,0.7)" />
            </Pressable>
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
                value={loading ? '--' : adminKpis[0]?.value || '--'}
                sub={adminKpis[0]?.sub}
                variant={adminKpis[0]?.variant}
                trend={adminKpis[0]?.trend}
                onPress={() => router.push('/inventory' as any)}
              />
              <KpiCard
                label={t('dashboard.kpis.healthyRate')}
                value={loading ? '--' : adminKpis[1]?.value || '--'}
                sub={adminKpis[1]?.sub}
                variant={adminKpis[1]?.variant}
                trend={adminKpis[1]?.trend}
                onPress={() => router.push('/inventory' as any)}
              />
            </View>
            <View style={styles.kpiRow}>
              <KpiCard
                label={t('dashboard.kpis.expiringSoon')}
                value={loading ? '--' : adminKpis[2]?.value || '--'}
                sub={adminKpis[2]?.sub}
                variant={adminKpis[2]?.variant}
                trend={adminKpis[2]?.trend}
                onPress={() => router.push('/expiration' as any)}
              />
              <KpiCard
                label={t('dashboard.kpis.openOrders')}
                value={loading ? '--' : adminKpis[3]?.value || '--'}
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
                <Text style={styles.poSub}>
                  {loading || pendingPoTotal === null
                    ? '--'
                    : `${formatCurrency(pendingPoTotal)} ${t('common.total')}`}
                </Text>
              </View>
            </View>
            <View style={styles.pendingPoRight}>
              <View style={styles.poCountBadge}>
                <Text style={styles.poCountText}>
                  {loading || pendingPoCount === null ? '--' : `${pendingPoCount}`}
                </Text>
              </View>
              <VectorIcon name="ChevronRight" size={16} color={Colors.neutral.textTertiary} />
            </View>
          </Card>
        </View>

        {/* ── Today's Tasks ── */}
        <View style={styles.section}>
          <SectionHeader
            title={t('dashboard.urgentTasksTitle')}
            action={t('common.viewAll')}
            onAction={() => router.push('/notifications' as any)}
          />
          <View style={styles.taskStack}>
            {tasks.map((task) => (
              <Card
                key={task.id}
                onPress={() => router.push(task.route as any)}
                style={styles.taskCard}
              >
                <View style={styles.taskRow}>
                  <View style={[styles.taskIconBox, { backgroundColor: task.bg }]}>
                    <VectorIcon name={task.iconName as any} size={18} color={task.color} />
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
                    <Text style={styles.taskSub}>{task.sub}</Text>
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
            {quickActions.map((action) => (
              <Pressable
                key={action.id}
                onPress={() => router.push(action.route as any)}
                style={({ pressed }) => [styles.quickActionCard, pressed && styles.pressed]}
              >
                <View style={[styles.actionIconBox, { backgroundColor: action.bg }]}>
                  <VectorIcon name={action.iconName as any} size={20} color={action.iconColor} />
                </View>
                <Text style={styles.actionLabel} numberOfLines={2}>
                  {action.label}
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
                segments={
                  loading || totalItemsCount === 0
                    ? [{ value: 1, color: Colors.neutral.borderLight }]
                    : stockHealth.map((s) => ({ value: s.count, color: s.color }))
                }
                size={86}
                strokeWidth={8}
                centerNumber={loading || totalItemsCount === null ? '--' : `${totalItemsCount}`}
                centerLabel={t('navigation.inventory')}
              />

              <View style={styles.healthLegend}>
                {stockHealth.map((item) => (
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
                    <Text style={styles.legendCount}>
                      {loading ? '--' : item.count}
                    </Text>
                    <Text style={styles.legendPct}>
                      {loading ? '--' : `${item.pct}%`}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Segmented Stock Bar */}
            <View style={{ marginVertical: Spacing.md }}>
              <StockBar
                segments={
                  loading || totalItemsCount === 0
                    ? [{ label: 'Loading', count: 1, pct: 100, color: Colors.neutral.borderLight, bg: Colors.neutral.borderLight }]
                    : stockHealth
                }
                height={8}
              />
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
              {loading
                ? '--'
                : t('expiration.potentialLoss', { value: formatCurrency(totalValueAtRisk) })}
            </Text>
          </View>

          <View style={styles.expiryStack}>
            {expiryItems.length === 0 && !loading && (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyCardText}>{t('dashboard.noExpiringBatches')}</Text>
              </Card>
            )}

            {expiryItems.map((item) => (
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
                    <Text style={styles.expirySub}>
                      {item.qty} · {item.exp}
                    </Text>
                  </View>

                  <View style={styles.expiryValueBox}>
                    <Text style={styles.expiryValue}>{item.value}</Text>
                    <Text style={styles.expiryValueLabel}>{t('common.value')}</Text>
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
            {recentActivities.length === 0 && !loading && (
              <View style={{ padding: Spacing.md, alignItems: 'center' }}>
                <Text style={styles.emptyCardText}>{t('dashboard.noRecentActivities')}</Text>
              </View>
            )}

            {recentActivities.map((item, index) => (
              <Pressable
                key={item.id}
                onPress={() => router.push(`/notifications/${item.id}` as any)}
                style={({ pressed }) => [
                  styles.activityRow,
                  index < recentActivities.length - 1 && styles.activityBorder,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.activityIconWrapper}>
                  <View style={styles.activityIconCircle}>
                    <VectorIcon name={item.iconName as any} size={15} color={Colors.neutral.textSecondary} strokeWidth={2} />
                  </View>
                  <View style={[styles.activityDot, { backgroundColor: item.dotColor }]} />
                </View>

                <View style={styles.activityContent}>
                  <Text style={styles.activityLabel}>{item.label}</Text>
                  <Text style={styles.activitySub} numberOfLines={1}>{item.sub}</Text>
                </View>

                <Text style={styles.activityTime}>{item.time}</Text>
              </Pressable>
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
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Colors.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeSub: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.neutral.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.neutral.borderLight,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.neutral.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral.borderLight,
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.critical.main,
    borderWidth: 1.5,
    borderColor: Colors.neutral.card,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.lg,
  },
  criticalAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#991b1b',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  criticalAlertIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  criticalAlertContent: {
    flex: 1,
  },
  criticalAlertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  criticalAlertSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 1,
  },
  criticalAlertPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dismissBtn: {
    padding: 4,
  },
  section: {
    gap: Spacing.sm,
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
    marginTop: Spacing.xs,
  },
  pendingPoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
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
    gap: 2,
  },
  poTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  poSub: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
  },
  pendingPoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  poCountBadge: {
    backgroundColor: Colors.info.subtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  poCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.info.dark,
  },
  taskStack: {
    gap: Spacing.xs,
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
    width: 36,
    height: 36,
    borderRadius: Radius.md,
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
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  taskSub: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
  },
  quickActionGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: Colors.neutral.card,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.neutral.borderLight,
    ...Shadows.card,
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    textAlign: 'center',
    lineHeight: 12,
    minHeight: 24,
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
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    flex: 1,
    fontSize: 12,
    color: Colors.neutral.textSecondary,
  },
  legendCount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  legendPct: {
    fontSize: 11,
    color: Colors.neutral.textMuted,
    width: 32,
    textAlign: 'right',
  },
  riskSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  riskSummaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.critical.dark,
  },
  expiryStack: {
    gap: Spacing.xs,
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
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysNumber: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 18,
  },
  daysLabel: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  expiryInfo: {
    flex: 1,
  },
  expiryName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  expirySub: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
    marginTop: 1,
  },
  expiryValueBox: {
    alignItems: 'flex-end',
  },
  expiryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  expiryValueLabel: {
    fontSize: 10,
    color: Colors.neutral.textMuted,
  },
  activityCard: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  activityBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  activityIconWrapper: {
    position: 'relative',
  },
  activityIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  activityContent: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  activitySub: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
    marginTop: 1,
  },
  activityTime: {
    fontSize: 11,
    color: Colors.neutral.textMuted,
  },
  emptyCard: {
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.neutral.card,
  },
  emptyCardText: {
    fontSize: 12,
    color: Colors.neutral.textMuted,
  },
  pressed: {
    opacity: 0.8,
  },
});

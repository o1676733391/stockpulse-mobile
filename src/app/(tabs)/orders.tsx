import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { NoStoreState } from '@/components/ui/no-store-state';
import { BadgeVariant, Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { procurementService } from '@/services/procurementService';
import { OrderStatus, PurchaseOrder } from '@/types/procurement';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TIMELINE_STEPS = ['Draft', 'Sent', 'Confirmed', 'Received'];

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, formatCurrency } = useI18n();
  const { user } = useAuth();
  const hasNoStore = !user?.storeId || user.storeId === 'unassigned' || user.storeId === '' || user.storeId === 'pending';

  const STATUS_CONFIG: Record<
    OrderStatus,
    { label: string; variant: BadgeVariant; stepIdx: number }
  > = {
    draft:     { label: t('orders.status.draft') || t('orders.statuses.draft') || 'Draft', variant: 'gray',  stepIdx: 0 },
    submitted: { label: t('orders.statuses.submitted') || 'Submitted',                  variant: 'blue',  stepIdx: 1 },
    approved:  { label: t('orders.statuses.approved') || 'Approved',                   variant: 'blue',  stepIdx: 1 },
    sent:      { label: t('orders.status.sent') || 'Sent',                              variant: 'blue',  stepIdx: 1 },
    confirmed: { label: t('orders.status.confirmed') || 'Confirmed',                    variant: 'amber', stepIdx: 2 },
    received:  { label: t('orders.status.received') || t('orders.statuses.received') || 'Received', variant: 'green', stepIdx: 3 },
    cancelled: { label: t('orders.statuses.cancelled') || 'Cancelled',                  variant: 'red',   stepIdx: 0 },
  };

  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(!hasNoStore);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (hasNoStore) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await procurementService.getOrders(tab);
      setOrders(data);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load purchase orders');
    } finally {
      setLoading(false);
    }
  }, [tab, hasNoStore]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  const activeOrders = useMemo(
    () => (tab === 'active' ? orders : []),
    [orders, tab]
  );
  const historyOrders = useMemo(
    () => (tab === 'history' ? orders : []),
    [orders, tab]
  );

  const displayedOrders = orders;

  const totalActiveValue = useMemo(
    () => orders.reduce((sum, p) => sum + p.total, 0),
    [orders]
  );

  const thirdStatValue = useMemo(() => {
    if (tab === 'active') {
      return orders.filter((p) => p.status === 'sent' || p.status === 'confirmed').length;
    } else {
      return orders.filter((p) => p.status === 'cancelled').length;
    }
  }, [orders, tab]);

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      {/* ── TopBar ── */}
      <TopBar
        title={t('orders.title')}
        large
        right={
          <Pressable
            onPress={() => router.push('/orders/poq' as any)}
            style={({ pressed }) => [styles.newOrderBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="Plus" size={14} color="#ffffff" strokeWidth={2.5} />
            <Text style={styles.newOrderBtnText}>{t('common.add')}</Text>
          </Pressable>
        }
      />

      {/* ── Tabs Navigation ── */}
      <View style={styles.tabsContainer}>
        <Pressable
          onPress={() => setTab('active')}
          style={[styles.tabButton, tab === 'active' && styles.tabButtonActive]}
        >
          <Text
            style={[
              styles.tabButtonText,
              tab === 'active' && styles.tabButtonTextActive,
            ]}
          >
            {t('common.active')}
          </Text>
          {activeOrders.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{activeOrders.length}</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          onPress={() => setTab('history')}
          style={[styles.tabButton, tab === 'history' && styles.tabButtonActive]}
        >
          <Text
            style={[
              styles.tabButtonText,
              tab === 'history' && styles.tabButtonTextActive,
            ]}
          >
            {t('common.history') || 'History'}
          </Text>
        </Pressable>
      </View>

      {/* ── Scrollable Body ── */}
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
        {hasNoStore && (
          <NoStoreState style={{ marginHorizontal: 0, marginBottom: Spacing.lg }} />
        )}

        {/* 3-Stat Metric Grid */}
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricNum}>
              {loading ? '--' : tab === 'active' ? activeOrders.length : historyOrders.length}
            </Text>
            <Text style={styles.metricLabel}>
              {tab === 'active' ? t('orders.activeOrders') : t('orders.pastOrders')}
            </Text>
          </Card>
          <Card style={styles.metricCard}>
            <Text style={[styles.metricNum, { color: Colors.brand.dark }]}>
              {loading ? '--' : formatCurrency(totalActiveValue)}
            </Text>
            <Text style={styles.metricLabel}>
              {tab === 'active' ? t('orders.totalValue') : t('orders.totalSpent')}
            </Text>
          </Card>
          <Card style={styles.metricCard}>
            <Text style={[styles.metricNum, { color: tab === 'active' ? Colors.warning.dark : Colors.critical.main }]}>
              {loading ? '--' : thirdStatValue}
            </Text>
            <Text style={styles.metricLabel}>
              {tab === 'active' ? t('orders.awaiting') : t('orders.cancelled')}
            </Text>
          </Card>
        </View>

        {errorMsg && (
          <View style={styles.errorCard}>
            <VectorIcon name="AlertCircle" size={20} color={Colors.critical.main} />
            <Text style={styles.errorText}>{errorMsg}</Text>
            <Pressable onPress={fetchOrders} style={styles.retryBtn}>
              <Text style={styles.retryText}>{t('common.retry') || 'Retry'}</Text>
            </Pressable>
          </View>
        )}

        {loading && !refreshing && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.brand.primary} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        )}

        {/* Empty State */}
        {!loading && !errorMsg && displayedOrders.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <VectorIcon name="Package" size={24} color={Colors.neutral.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>
              {tab === 'active' ? t('orders.noActiveOrders') : t('orders.noOrderHistory')}
            </Text>
            {tab === 'active' && (
              <Pressable
                onPress={() => router.push('/orders/poq' as any)}
                style={styles.emptyActionBtn}
              >
                <Text style={styles.emptyActionBtnText}>
                  + {t('orders.createFromPoq')}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Purchase Orders List */}
        {displayedOrders.map((po) => {
          const { label, variant, stepIdx } = STATUS_CONFIG[po.status];

          return (
            <Card
              key={po.id}
              onPress={() => router.push(`/orders/${po.id}` as any)}
              style={styles.orderCard}
            >
              {/* Top Row: Supplier & Badge */}
              <View style={styles.orderTopRow}>
                <View style={styles.orderSupplierInfo}>
                  <Text style={styles.supplierNameText}>{po.supplierName}</Text>
                  <Text style={styles.orderMetaText}>
                    {po.id.toUpperCase()} · {po.date}
                  </Text>
                </View>

                <View style={styles.statusBadgeRow}>
                  <Badge variant={variant}>{label}</Badge>
                  <VectorIcon name="ChevronRight" size={14} color={Colors.neutral.textTertiary} />
                </View>
              </View>

              {/* 4-Step Interactive Timeline */}
              <View style={styles.timelineSection}>
                <View style={styles.timelineTrackRow}>
                  {TIMELINE_STEPS.map((step, i) => {
                    const isDone = stepIdx >= i;
                    const isActive = stepIdx === i;

                    return (
                      <React.Fragment key={step}>
                        <View
                          style={[
                            styles.timelineDot,
                            isDone ? styles.timelineDotDone : styles.timelineDotPending,
                          ]}
                        >
                          {isActive && <View style={styles.timelineDotInner} />}
                        </View>
                        {i < 3 && (
                          <View
                            style={[
                              styles.timelineLine,
                              isDone && i < stepIdx
                                ? styles.timelineLineDone
                                : styles.timelineLinePending,
                            ]}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </View>

                <View style={styles.timelineLabelsRow}>
                  {TIMELINE_STEPS.map((step, i) => {
                    const stepKey = step.toLowerCase();
                    const translatedLabel = t(`orders.status.${stepKey}`) || step;
                    return (
                      <Text
                        key={step}
                        style={[
                          styles.timelineStepLabel,
                          stepIdx === i && styles.timelineStepLabelActive,
                        ]}
                      >
                        {translatedLabel}
                      </Text>
                    );
                  })}
                </View>
              </View>

              {/* Bottom Items & Total Row */}
              <View style={styles.orderBottomRow}>
                <Text style={styles.itemCountText}>
                  {po.items.length} {po.items.length === 1 ? t('common.item') : t('common.items')}
                </Text>
                <Text style={styles.orderTotalText}>{formatCurrency(po.total)}</Text>
              </View>
            </Card>
          );
        })}

        {/* POQ Creation CTA Banner */}
        {tab === 'active' && (
          <Pressable
            onPress={() => router.push('/orders/poq' as any)}
            style={({ pressed }) => [styles.createPoqBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="Plus" size={16} color={Colors.brand.primary} strokeWidth={2.5} />
            <Text style={styles.createPoqBtnText}>
              {t('orders.createFromPoq')}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  newOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    ...Shadows.card,
  },
  newOrderBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
    paddingHorizontal: Spacing.lg,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: Colors.brand.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.textTertiary,
  },
  tabButtonTextActive: {
    color: Colors.brand.dark,
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: Colors.brand.subtle,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
  },
  metricNum: {
    ...Typography.monoValue,
    fontSize: 18,
    color: Colors.neutral.textPrimary,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  orderCard: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  orderTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  orderSupplierInfo: {
    flex: 1,
    gap: 2,
  },
  supplierNameText: {
    ...Typography.cardTitle,
    fontSize: 14,
  },
  orderMetaText: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  timelineSection: {
    gap: 6,
    paddingHorizontal: Spacing.xs,
  },
  timelineTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotDone: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  timelineDotPending: {
    backgroundColor: Colors.neutral.card,
    borderColor: Colors.neutral.border,
  },
  timelineDotInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  timelineLine: {
    flex: 1,
    height: 2,
  },
  timelineLineDone: {
    backgroundColor: Colors.brand.primary,
  },
  timelineLinePending: {
    backgroundColor: Colors.neutral.borderLight,
  },
  timelineLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineStepLabel: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
  },
  timelineStepLabelActive: {
    color: Colors.brand.dark,
    fontWeight: '700',
  },
  orderBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.borderLight,
  },
  itemCountText: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
  },
  orderTotalText: {
    ...Typography.monoValue,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  createPoqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.neutral.border,
    borderRadius: Radius.xl,
    backgroundColor: Colors.neutral.card,
    marginTop: Spacing.xs,
  },
  createPoqBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: Spacing.sm,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.neutral.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...Typography.cardTitle,
    fontSize: 15,
  },
  emptyActionBtn: {
    marginTop: Spacing.xs,
  },
  emptyActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  pressed: {
    opacity: 0.8,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.critical.light,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.critical.light,
  },
  errorText: {
    flex: 1,
    ...Typography.body,
    color: Colors.critical.dark,
  },
  retryBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.critical.main,
    borderRadius: Radius.md,
  },
  retryText: {
    ...Typography.caption,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingBox: {
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    ...Typography.bodySecondary,
  },
});

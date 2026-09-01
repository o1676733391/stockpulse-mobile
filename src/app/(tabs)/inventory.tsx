import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ChipRow } from '@/components/ui/chip-row';
import { VectorIcon } from '@/components/ui/icons';
import { StockMetricBox } from '@/components/ui/stock-metric-box';
import { TopBar } from '@/components/ui/top-bar';
import { NoStoreState } from '@/components/ui/no-store-state';
import { BadgeVariant, Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { inventoryService } from '@/services/inventoryService';
import { InventoryItem } from '@/types/inventory';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InventoryListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, formatCurrency, formatNumber } = useI18n();

  const CATEGORIES = [
    t('inventory.categories.all'),
    t('inventory.categories.meat'),
    t('inventory.categories.seafood'),
    t('inventory.categories.produce'),
    t('inventory.categories.dairy'),
    t('inventory.categories.pantry'),
  ];

  const STATUS_FILTERS = [
    t('common.all'),
    t('inventory.statusLabels.low'),
    t('expiration.title'),
    t('inventory.statusLabels.overstock'),
  ];

  const STATUS_BADGE: Record<InventoryItem['status'], { label: string; variant: BadgeVariant }> = {
    healthy:   { label: t('inventory.statusLabels.healthy'),   variant: 'green' },
    low:       { label: t('inventory.statusLabels.low'), variant: 'amber' },
    critical:  { label: t('inventory.statusLabels.critical'),  variant: 'red'   },
    overstock: { label: t('inventory.statusLabels.overstock'), variant: 'blue'  },
  };

  const { user } = useAuth();
  const hasNoStore = !user?.storeId || user.storeId === 'unassigned' || user.storeId === '' || user.storeId === 'pending';

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(!hasNoStore);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTERS[0]);
  const [sort, setSort] = useState<'Name' | 'Physical' | 'Expiry'>('Name');
  const [showSortModal, setShowSortModal] = useState(false);

  const fetchItems = useCallback(async () => {
    if (hasNoStore) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setErrorMsg(null);
      const data = await inventoryService.getItems();
      setItems(data);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load inventory items');
    } finally {
      setLoading(false);
    }
  }, [hasNoStore]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  }, [fetchItems]);

  // Filter & Sort Logic
  const filtered = useMemo(() => {
    return items
      .filter((item) => {
        const matchesQuery =
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.sku.toLowerCase().includes(query.toLowerCase());

        const matchesCategory =
          category === CATEGORIES[0] || item.category.toLowerCase() === category.toLowerCase();

        let matchesStatus = true;
        if (statusFilter === t('inventory.statusLabels.low')) {
          matchesStatus = item.status === 'low' || item.status === 'critical';
        } else if (statusFilter === t('expiration.title')) {
          matchesStatus = (item.batches || []).some((b) => b.daysRemaining <= 7);
        } else if (statusFilter === t('inventory.statusLabels.overstock')) {
          matchesStatus = item.status === 'overstock';
        }

        return matchesQuery && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sort === 'Physical') return b.physicalStock - a.physicalStock;
        if (sort === 'Expiry') {
          const minA = a.batches && a.batches.length > 0 ? Math.min(...a.batches.map((x) => x.daysRemaining)) : 999;
          const minB = b.batches && b.batches.length > 0 ? Math.min(...b.batches.map((x) => x.daysRemaining)) : 999;
          return minA - minB;
        }
        return a.name.localeCompare(b.name);
      });
  }, [items, query, category, statusFilter, sort, CATEGORIES, t]);

  const totalValue = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + item.physicalStock * item.costPerUnit,
      0
    );
  }, [items]);

  const alertCount = useMemo(() => {
    return items.filter(
      (item) => item.status === 'critical' || item.status === 'low'
    ).length;
  }, [items]);

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      {/* ── TopBar ── */}
      <TopBar
        title={t('inventory.title')}
        large
        right={
          <Pressable
            onPress={() => {}}
            style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="Plus" size={22} color={Colors.neutral.textPrimary} strokeWidth={2.2} />
          </Pressable>
        }
      />

      {/* ── Sticky Filter & Search Bar ── */}
      <View style={styles.filterBar}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <VectorIcon name="Search" size={16} color={Colors.neutral.textTertiary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('common.searchPlaceholder')}
              placeholderTextColor={Colors.neutral.textTertiary}
              style={styles.searchInput}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={6}>
                <VectorIcon name="X" size={14} color={Colors.neutral.textTertiary} />
              </Pressable>
            )}
          </View>

          {/* Sort Button */}
          <Pressable
            onPress={() => setShowSortModal(true)}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="ArrowUpDown" size={16} color={Colors.neutral.textPrimary} />
          </Pressable>
        </View>

        {/* Category & Status Chips */}
        <ChipRow options={CATEGORIES} value={category} onChange={setCategory} />
        <ChipRow options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
      </View>

      {/* ── Summary Bar ── */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryText}>
            {loading ? '--' : t('inventory.itemCount', { count: filtered.length })}
          </Text>
          {!loading && alertCount > 0 && (
            <View style={styles.attentionTag}>
              <VectorIcon name="AlertTriangle" size={11} color={Colors.warning.dark} />
              <Text style={styles.attentionText}>{alertCount} {t('inventory.statusLabels.low')}</Text>
            </View>
          )}
        </View>
        <Text style={styles.summaryText}>
          {t('common.value')} <Text style={styles.summaryBold}>{loading ? '--' : formatCurrency(totalValue)}</Text>
        </Text>
      </View>

      {/* ── Item List ── */}
      <ScrollView
        contentContainerStyle={[
          styles.listContent,
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

        {errorMsg && (
          <View style={styles.errorCard}>
            <VectorIcon name="AlertCircle" size={20} color={Colors.critical.main} />
            <Text style={styles.errorText}>{errorMsg}</Text>
            <Pressable onPress={fetchItems} style={styles.retryBtn}>
              <Text style={styles.retryText}>{t('common.retry') || 'Retry'}</Text>
            </Pressable>
          </View>
        )}

        {filtered.map((item) => {
          const variance = item.physicalStock - item.theoreticalStock;
          const variancePct = item.theoreticalStock > 0 ? (variance / item.theoreticalStock) * 100 : 0;
          const needsReview = Math.abs(variancePct) > 5;
          const batches = item.batches || [];
          const nearExpiry = batches.some((b) => (b.daysRemaining ?? 99) <= 7);
          const minDays = nearExpiry && batches.length > 0
            ? Math.min(...batches.map((b) => b.daysRemaining ?? 99))
            : 99;

          const { label, variant } = STATUS_BADGE[item.status] || STATUS_BADGE.healthy;

          const urgencyColor =
            item.status === 'critical'
              ? Colors.critical.main
              : item.status === 'low'
              ? Colors.warning.main
              : nearExpiry
              ? Colors.orange.main
              : undefined;

          return (
            <Card
              key={item.id}
              onPress={() => router.push(`/inventory/${item.id}` as any)}
              urgencyColor={urgencyColor}
              style={styles.itemCard}
            >
              {/* Row 1: Title, Category, Badges */}
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <View style={styles.titleRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {nearExpiry && (
                      <View style={styles.expiryChip}>
                        <VectorIcon name="Clock" size={10} color={Colors.orange.dark} />
                        <Text style={styles.expiryChipText}>{minDays}d</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.itemSku}>
                    {t('inventory.sku', { sku: item.sku })} · {item.category}
                  </Text>
                </View>

                <View style={styles.badgeColumn}>
                  <Badge variant={variant}>{label}</Badge>
                  {needsReview && <Badge variant="orange">{t('stockCount.discrepancyTiers.minor')}</Badge>}
                </View>
              </View>

              {/* Row 2: 3-Column Should vs Is vs Diff */}
              <StockMetricBox
                physicalStock={item.physicalStock}
                theoreticalStock={item.theoreticalStock}
                unit={item.unit}
                style={styles.metricBoxWrapper}
              />
            </Card>
          );
        })}

        {loading && !refreshing && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.brand.primary} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        )}

        {!loading && !errorMsg && filtered.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <VectorIcon name="Package" size={28} color={Colors.neutral.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>{t('inventory.emptyState')}</Text>
            <Text style={styles.emptySub}>{t('inventory.emptyStateDesc')}</Text>
          </View>
        )}
      </ScrollView>

      {/* ── Sort Modal ── */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.sortCard}>
            <Text style={styles.sortModalTitle}>{t('common.filter')}</Text>
            {(['Name', 'Physical', 'Expiry'] as const).map((opt) => {
              const isSelected = opt === sort;
              return (
                <Pressable
                  key={opt}
                  onPress={() => {
                    setSort(opt);
                    setShowSortModal(false);
                  }}
                  style={({ pressed }) => [
                    styles.sortOption,
                    isSelected && styles.sortOptionSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      isSelected && styles.sortOptionTextSelected,
                    ]}
                  >
                    {opt === 'Name'
                      ? t('common.category')
                      : opt === 'Physical'
                      ? t('inventory.physicalStock')
                      : t('expiration.title')}
                  </Text>
                  {isSelected && (
                    <VectorIcon name="Check" size={16} color={Colors.brand.primary} strokeWidth={2.5} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
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
  filterBar: {
    backgroundColor: Colors.neutral.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 40,
    gap: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.neutral.textPrimary,
    padding: 0,
  },
  iconBtn: {
    width: 40,
    height: 40,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.neutral.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  summaryText: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
  },
  summaryBold: {
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  attentionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.warning.subtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  attentionText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.warning.dark,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  itemCard: {
    padding: Spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  itemName: {
    ...Typography.cardTitle,
    fontSize: 15,
  },
  expiryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.orange.subtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  expiryChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.orange.dark,
  },
  itemSku: {
    fontSize: 12,
    color: Colors.neutral.textTertiary,
  },
  badgeColumn: {
    alignItems: 'flex-end',
    gap: 4,
  },
  metricBoxWrapper: {
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: Spacing.sm,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.neutral.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...Typography.cardTitle,
    fontSize: 16,
  },
  emptySub: {
    ...Typography.bodySecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  sortCard: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: Colors.neutral.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: 2,
    ...Shadows.elevated,
  },
  sortModalTitle: {
    ...Typography.sectionHeader,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginBottom: 4,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  sortOptionSelected: {
    backgroundColor: Colors.brand.subtle,
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.textPrimary,
  },
  sortOptionTextSelected: {
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  pressed: {
    opacity: 0.7,
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

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ChipRow } from '@/components/ui/chip-row';
import { VectorIcon } from '@/components/ui/icons';
import { StockMetricBox } from '@/components/ui/stock-metric-box';
import { TopBar } from '@/components/ui/top-bar';
import { BadgeVariant, Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { mockInventoryItems } from '@/mocks/inventoryMockData';
import { InventoryItem } from '@/types/inventory';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATEGORIES = [
  'All',
  'Meat & Poultry',
  'Fish & Seafood',
  'Vegetables',
  'Dairy',
  'Dry Goods',
];

const STATUS_FILTERS = [
  'All',
  'Low Stock',
  'Expiring',
  'Overstock',
  'Variance',
];

const SORT_OPTIONS = ['Name', 'Physical ↓', 'Variance ↓', 'Expiry ↑'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

const STATUS_BADGE: Record<InventoryItem['status'], { label: string; variant: BadgeVariant }> = {
  healthy:   { label: 'Healthy',   variant: 'green' },
  low:       { label: 'Low Stock', variant: 'amber' },
  critical:  { label: 'Critical',  variant: 'red'   },
  overstock: { label: 'Overstock', variant: 'blue'  },
};

export default function InventoryListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sort, setSort] = useState<SortOption>('Name');
  const [showSortModal, setShowSortModal] = useState(false);

  // Filter & Sort Logic
  const filtered = useMemo(() => {
    return mockInventoryItems
      .filter((item) => {
        const matchesQuery =
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.sku.toLowerCase().includes(query.toLowerCase());

        const matchesCategory =
          category === 'All' || item.category === category;

        let matchesStatus = true;
        if (statusFilter === 'Low Stock') {
          matchesStatus = item.status === 'low' || item.status === 'critical';
        } else if (statusFilter === 'Expiring') {
          matchesStatus = item.batches.some((b) => b.daysRemaining <= 7);
        } else if (statusFilter === 'Overstock') {
          matchesStatus = item.status === 'overstock';
        } else if (statusFilter === 'Variance') {
          matchesStatus =
            item.theoreticalStock > 0 &&
            Math.abs((item.physicalStock - item.theoreticalStock) / item.theoreticalStock) > 0.05;
        }

        return matchesQuery && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sort === 'Physical ↓') return b.physicalStock - a.physicalStock;
        if (sort === 'Variance ↓') {
          const varA = Math.abs(a.physicalStock - a.theoreticalStock);
          const varB = Math.abs(b.physicalStock - b.theoreticalStock);
          return varB - varA;
        }
        if (sort === 'Expiry ↑') {
          const minA = Math.min(...a.batches.map((x) => x.daysRemaining));
          const minB = Math.min(...b.batches.map((x) => x.daysRemaining));
          return minA - minB;
        }
        return a.name.localeCompare(b.name);
      });
  }, [query, category, statusFilter, sort]);

  const totalValue = useMemo(() => {
    return mockInventoryItems.reduce(
      (sum, item) => sum + item.physicalStock * item.costPerUnit,
      0
    );
  }, []);

  const alertCount = useMemo(() => {
    return mockInventoryItems.filter(
      (item) => item.status === 'critical' || item.status === 'low'
    ).length;
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      {/* ── TopBar ── */}
      <TopBar
        title="Inventory"
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
              placeholder="Search ingredients, SKU…"
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
            <Text style={styles.summaryBold}>{filtered.length}</Text> items
          </Text>
          {alertCount > 0 && (
            <View style={styles.attentionTag}>
              <VectorIcon name="AlertTriangle" size={11} color={Colors.warning.dark} />
              <Text style={styles.attentionText}>{alertCount} need attention</Text>
            </View>
          )}
        </View>
        <Text style={styles.summaryText}>
          Value <Text style={styles.summaryBold}>€{totalValue.toFixed(0)}</Text>
        </Text>
      </View>

      {/* ── Item List ── */}
      <ScrollView
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((item) => {
          const variance = item.physicalStock - item.theoreticalStock;
          const variancePct = item.theoreticalStock > 0 ? (variance / item.theoreticalStock) * 100 : 0;
          const needsReview = Math.abs(variancePct) > 5;
          const nearExpiry = item.batches.some((b) => b.daysRemaining <= 7);
          const minDays = nearExpiry
            ? Math.min(...item.batches.map((b) => b.daysRemaining))
            : 99;

          const { label, variant } = STATUS_BADGE[item.status];

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
                    {item.sku} · {item.category}
                  </Text>
                </View>

                <View style={styles.badgeColumn}>
                  <Badge variant={variant}>{label}</Badge>
                  {needsReview && <Badge variant="orange">Needs Review</Badge>}
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

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <VectorIcon name="Package" size={28} color={Colors.neutral.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptySub}>Try adjusting your search terms or filters</Text>
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
            <Text style={styles.sortModalTitle}>Sort Items</Text>
            {SORT_OPTIONS.map((opt) => {
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
                    {opt}
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
});

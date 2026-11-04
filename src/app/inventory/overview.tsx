import { AddEditInventoryModal } from '@/components/inventory/add-edit-item-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DesktopAccessNotice } from '@/components/ui/desktop-access-notice';
import { VectorIcon } from '@/components/ui/icons';
import { NoStoreState } from '@/components/ui/no-store-state';
import { StockMetricBox } from '@/components/ui/stock-metric-box';
import { TopBar } from '@/components/ui/top-bar';
import { BadgeVariant, Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { inventoryService } from '@/services/inventoryService';
import { UpperGroup, upperGroupService } from '@/services/upperGroupService';
import { InventoryItem } from '@/types/inventory';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type StatusFilterId = 'all' | 'low' | 'expiry' | 'overstock';

export default function InventoryListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language, formatCurrency } = useI18n();

  const STATUS_BADGE: Record<InventoryItem['status'], { label: string; variant: BadgeVariant }> = {
    healthy:   { label: t('inventory.statusLabels.healthy'),   variant: 'green' },
    low:       { label: t('inventory.statusLabels.low'),       variant: 'amber' },
    critical:  { label: t('inventory.statusLabels.critical'),  variant: 'red'   },
    overstock: { label: t('inventory.statusLabels.overstock'), variant: 'blue'  },
  };

  const { user } = useAuth();
  const hasNoStore = !user?.storeId || user.storeId === 'unassigned' || user.storeId === '' || user.storeId === 'pending';

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [upperGroups, setUpperGroups] = useState<UpperGroup[]>([]);
  const [loading, setLoading] = useState(!hasNoStore);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  // Language-independent filter IDs so switching language never breaks filtering
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [statusFilterId, setStatusFilterId] = useState<StatusFilterId>('all');
  const [sort, setSort] = useState<'Name' | 'Physical' | 'Expiry'>('Name');

  const [showSortModal, setShowSortModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpperGroupModal, setShowUpperGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState<'drinks' | 'food'>('drinks');

  const loadUpperGroups = useCallback(async () => {
    const groups = await upperGroupService.getAllGroups();
    setUpperGroups(groups);
  }, []);

  useEffect(() => {
    loadUpperGroups();
    const unsubscribe = upperGroupService.subscribe(() => {
      loadUpperGroups();
    });
    return unsubscribe;
  }, [loadUpperGroups]);

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
      setErrorMsg(err?.message || t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  }, [hasNoStore, t]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchItems(), loadUpperGroups()]);
    setRefreshing(false);
  }, [fetchItems, loadUpperGroups]);

  const handleCreateUpperGroup = async () => {
    const trimmed = newGroupName.trim();
    if (!trimmed) return;
    const created = await upperGroupService.addCustomGroup(
      trimmed,
      newGroupType,
      newGroupType === 'drinks' ? 'Coffee' : 'Box'
    );
    setNewGroupName('');
    setSelectedGroupId(created.id);
    setShowUpperGroupModal(false);
  };

  const handleDeleteUpperGroup = async (groupId: string) => {
    await upperGroupService.removeCustomGroup(groupId);
    if (selectedGroupId === groupId) {
      setSelectedGroupId('all');
    }
  };

  // Filter & Sort Logic using language-independent IDs and multilingual upperGroupService matching
  const filtered = useMemo(() => {
    return items
      .filter((item) => {
        const localizedCat = upperGroupService.translateCategory(item.category, language);
        const matchesQuery =
          !query.trim() ||
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.sku.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase()) ||
          localizedCat.toLowerCase().includes(query.toLowerCase());

        const matchesCategory =
          selectedGroupId === 'all' ||
          upperGroupService.matchesGroup(item.category, selectedGroupId);

        let matchesStatus = true;
        if (statusFilterId === 'low') {
          matchesStatus = item.status === 'low' || item.status === 'critical';
        } else if (statusFilterId === 'expiry') {
          matchesStatus = (item.batches || []).some((b) => b.daysRemaining <= 7);
        } else if (statusFilterId === 'overstock') {
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
  }, [items, query, selectedGroupId, statusFilterId, sort, language]);

  const totalValue = useMemo(() => {
    return filtered.reduce(
      (sum, item) => sum + item.physicalStock * item.costPerUnit,
      0
    );
  }, [filtered]);

  const alertCount = useMemo(() => {
    return items.filter(
      (item) => item.status === 'critical' || item.status === 'low'
    ).length;
  }, [items]);

  const statusChips: Array<{ id: StatusFilterId; label: string }> = [
    { id: 'all', label: t('common.all') },
    { id: 'low', label: t('inventory.statusLabels.low') },
    { id: 'expiry', label: t('expiration.title') },
    { id: 'overstock', label: t('inventory.statusLabels.overstock') },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      {/* ── TopBar ── */}
      <TopBar
        showBack
        title={t('inventory.title')}
        large
        right={
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setShowUpperGroupModal(true)}
              style={({ pressed }) => [styles.upperGroupHeaderBtn, pressed && styles.pressed]}
            >
              <VectorIcon name="Layers" size={14} color={Colors.brand.dark} />
              <Text style={styles.upperGroupHeaderText}>{t('upperGroups.addButton')}</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowAddModal(true)}
              style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
            >
              <VectorIcon name="Plus" size={22} color={Colors.neutral.textPrimary} strokeWidth={2.2} />
            </Pressable>
          </View>
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

        {/* Upper Groups (Obergruppen) Row: All + Built-in + Custom + "+ Obergruppe" button */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScrollRow}
        >
          <Pressable
            onPress={() => setSelectedGroupId('all')}
            style={[
              styles.groupChip,
              selectedGroupId === 'all' && styles.groupChipActive,
            ]}
          >
            <Text
              style={[
                styles.groupChipText,
                selectedGroupId === 'all' && styles.groupChipTextActive,
              ]}
            >
              {t('inventory.categories.all')}
            </Text>
          </Pressable>

          {upperGroups.map((group) => {
            const active = selectedGroupId === group.id;
            const label = upperGroupService.getGroupLabel(group, language);
            const isDrink = group.type === 'drinks';

            return (
              <Pressable
                key={group.id}
                onPress={() => setSelectedGroupId(group.id)}
                style={[styles.groupChip, active && styles.groupChipActive]}
              >
                <VectorIcon
                  name={isDrink ? 'Coffee' : 'Box'}
                  size={12}
                  color={active ? '#FFFFFF' : Colors.neutral.textSecondary}
                />
                <Text
                  style={[
                    styles.groupChipText,
                    active && styles.groupChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => setShowUpperGroupModal(true)}
            style={styles.addUpperGroupChip}
          >
            <VectorIcon name="Plus" size={13} color={Colors.brand.dark} />
            <Text style={styles.addUpperGroupChipText}>{t('upperGroups.addButton')}</Text>
          </Pressable>
        </ScrollView>

        {/* Status Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScrollRow}
        >
          {statusChips.map((chip) => {
            const active = statusFilterId === chip.id;
            return (
              <Pressable
                key={chip.id}
                onPress={() => setStatusFilterId(chip.id)}
                style={[styles.statusChip, active && styles.statusChipActive]}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    active && styles.statusChipTextActive,
                  ]}
                >
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
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
        <DesktopAccessNotice compact />

        {hasNoStore && (
          <NoStoreState style={{ marginHorizontal: 0, marginBottom: Spacing.lg }} />
        )}

        {errorMsg && (
          <View style={styles.errorCard}>
            <VectorIcon name="AlertCircle" size={20} color={Colors.critical.main} />
            <Text style={styles.errorText}>{errorMsg}</Text>
            <Pressable onPress={fetchItems} style={styles.retryBtn}>
              <Text style={styles.retryText}>{t('common.retry')}</Text>
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
          const localizedCategory = upperGroupService.translateCategory(item.category, language);

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
                    {t('inventory.sku', { sku: item.sku })} · {localizedCategory}
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
            <View style={{ marginTop: Spacing.sm }}>
              <Button
                label={t('itemModal.addTitle')}
                variant="primary"
                size="sm"
                onPress={() => setShowAddModal(true)}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Manage & Create Custom Upper Groups (Obergruppen) Modal ── */}
      <Modal
        visible={showUpperGroupModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUpperGroupModal(false)}
      >
        <View style={styles.upperGroupModalBackdrop}>
          <View style={[styles.upperGroupModalCard, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
            <View style={styles.upperGroupModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.upperGroupModalTitle}>{t('upperGroups.title')}</Text>
                <Text style={styles.upperGroupModalSub}>{t('upperGroups.modalSubtitle')}</Text>
              </View>
              <Pressable
                onPress={() => setShowUpperGroupModal(false)}
                style={styles.closeModalBtn}
              >
                <VectorIcon name="X" size={18} color={Colors.neutral.textSecondary} />
              </Pressable>
            </View>

            {/* Create New Upper Group Form */}
            <View style={styles.createUpperGroupBox}>
              <Text style={styles.createUpperGroupLabel}>{t('upperGroups.typeLabel')}</Text>
              <View style={styles.typeRow}>
                <Pressable
                  onPress={() => setNewGroupType('drinks')}
                  style={[
                    styles.typeBtn,
                    newGroupType === 'drinks' && styles.typeBtnActive,
                  ]}
                >
                  <VectorIcon
                    name="Coffee"
                    size={15}
                    color={newGroupType === 'drinks' ? Colors.brand.dark : Colors.neutral.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      newGroupType === 'drinks' && styles.typeBtnTextActive,
                    ]}
                  >
                    {t('upperGroups.typeDrinks')}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setNewGroupType('food')}
                  style={[
                    styles.typeBtn,
                    newGroupType === 'food' && styles.typeBtnActive,
                  ]}
                >
                  <VectorIcon
                    name="Box"
                    size={15}
                    color={newGroupType === 'food' ? Colors.brand.dark : Colors.neutral.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      newGroupType === 'food' && styles.typeBtnTextActive,
                    ]}
                  >
                    {t('upperGroups.typeFood')}
                  </Text>
                </Pressable>
              </View>

              <Text style={[styles.createUpperGroupLabel, { marginTop: Spacing.xs }]}>
                {t('upperGroups.nameLabel')}
              </Text>
              <View style={styles.newGroupRow}>
                <TextInput
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                  placeholder={t('upperGroups.namePlaceholder')}
                  placeholderTextColor={Colors.neutral.textTertiary}
                  style={styles.newGroupInput}
                />
                <Button
                  label={t('itemModal.createGroupBtn')}
                  variant="primary"
                  size="sm"
                  onPress={handleCreateUpperGroup}
                />
              </View>
            </View>

            {/* Existing Upper Groups List */}
            <Text style={styles.existingGroupsTitle}>{t('upperGroups.existingGroups')}</Text>
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {upperGroups.map((group) => {
                const label = upperGroupService.getGroupLabel(group, language);
                const isDrink = group.type === 'drinks';
                return (
                  <View key={group.id} style={styles.existingGroupRow}>
                    <Pressable
                      onPress={() => {
                        setSelectedGroupId(group.id);
                        setShowUpperGroupModal(false);
                      }}
                      style={styles.existingGroupInfo}
                    >
                      <View
                        style={[
                          styles.existingGroupIcon,
                          isDrink && { backgroundColor: Colors.info.subtle },
                        ]}
                      >
                        <VectorIcon
                          name={isDrink ? 'Coffee' : 'Box'}
                          size={15}
                          color={isDrink ? Colors.info.dark : Colors.brand.dark}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.existingGroupName}>{label}</Text>
                        <Text style={styles.existingGroupMeta}>
                          {isDrink ? t('upperGroups.typeDrinks') : t('upperGroups.typeFood')} ·{' '}
                          {group.isCustom ? t('upperGroups.customBadge') : t('upperGroups.defaultBadge')}
                        </Text>
                      </View>
                    </Pressable>

                    {group.isCustom && (
                      <Pressable
                        onPress={() => handleDeleteUpperGroup(group.id)}
                        hitSlop={8}
                        style={styles.deleteGroupBtn}
                      >
                        <VectorIcon name="Trash2" size={16} color={Colors.critical.main} />
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

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

      {/* ── Add Item Modal ── */}
      <AddEditInventoryModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(newItem) => {
          setItems((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)]);
          fetchItems();
          loadUpperGroups();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  upperGroupHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brand.subtle,
    borderWidth: 1,
    borderColor: Colors.brand.light,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  upperGroupHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand.dark,
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
  chipsScrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 2,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.borderLight,
  },
  groupChipActive: {
    backgroundColor: Colors.neutral.textPrimary,
    borderColor: Colors.neutral.textPrimary,
  },
  groupChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  groupChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  addUpperGroupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.subtle,
    borderWidth: 1,
    borderColor: Colors.brand.light,
  },
  addUpperGroupChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.borderLight,
  },
  statusChipActive: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  statusChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  upperGroupModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  upperGroupModalCard: {
    backgroundColor: Colors.neutral.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.modal,
  },
  upperGroupModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  upperGroupModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  upperGroupModalSub: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  closeModalBtn: {
    padding: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral.borderLight,
  },
  createUpperGroupBox: {
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  createUpperGroupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.neutral.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    backgroundColor: Colors.neutral.card,
  },
  typeBtnActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.subtle,
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  typeBtnTextActive: {
    color: Colors.brand.dark,
    fontWeight: '700',
  },
  newGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  newGroupInput: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.neutral.card,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 13,
    color: Colors.neutral.textPrimary,
  },
  existingGroupsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.neutral.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  existingGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  existingGroupInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  existingGroupIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  existingGroupName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  existingGroupMeta: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  deleteGroupBtn: {
    padding: 6,
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

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import {
  INITIAL_POQ_GROUPS,
  procurementService,
} from '@/services/procurementService';
import { POQSupplierGroup, PurchaseOrderLine } from '@/types/procurement';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function POQScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [poqGroups] = useState<POQSupplierGroup[]>(() =>
    JSON.parse(JSON.stringify(INITIAL_POQ_GROUPS))
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(['i1', 'i3', 'i2', 'i5', 'i8'])
  );

  const [quantities, setQuantities] = useState<Record<string, number>>({
    i1: 15.5,
    i3: 30,
    i2: 6,
    i5: 40,
    i8: 8,
  });

  const [showFormula, setShowFormula] = useState(false);

  const allItems = useMemo(
    () => poqGroups.flatMap((g) => g.items),
    [poqGroups]
  );
  const totalNeedReorder = allItems.length;

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdjustQty = (id: string, delta: number, unit: string) => {
    const step = unit === 'kg' || unit === 'L' ? 0.5 : 1;
    setQuantities((prev) => {
      const current = prev[id] ?? allItems.find((i) => i.id === id)?.recommended ?? 0;
      const nextVal = Math.max(0, parseFloat((current + delta * step).toFixed(1)));
      return { ...prev, [id]: nextVal };
    });
  };

  const totalValue = useMemo(() => {
    return allItems
      .filter((i) => selectedIds.has(i.id))
      .reduce((sum, i) => {
        const qty = quantities[i.id] ?? i.recommended;
        return sum + qty * i.pricePerUnit;
      }, 0);
  }, [allItems, selectedIds, quantities]);

  const supplierCount = useMemo(() => {
    return poqGroups.filter((g) => g.items.some((i) => selectedIds.has(i.id))).length;
  }, [poqGroups, selectedIds]);

  const handleCreateOrders = async () => {
    let firstCreatedPoId = '';

    for (const group of poqGroups) {
      const selectedInGroup = group.items.filter((i) => selectedIds.has(i.id));
      if (selectedInGroup.length === 0) continue;

      const lines: PurchaseOrderLine[] = selectedInGroup.map((item) => ({
        itemId: item.id,
        itemName: item.name,
        quantity: quantities[item.id] ?? item.recommended,
        unit: item.unit,
        pricePerUnit: item.pricePerUnit,
      }));

      const newPo = await procurementService.createDraftOrder(group.supplierId, lines);
      if (!firstCreatedPoId) firstCreatedPoId = newPo.id;
    }

    if (firstCreatedPoId) {
      router.push(`/orders/${firstCreatedPoId}` as any);
    } else {
      router.replace('/(tabs)/orders' as any);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      {/* ── TopBar ── */}
      <TopBar
        title="Reorder Recommendations"
        subtitle={`${selectedIds.size} of ${totalNeedReorder} selected`}
        showBack
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Stat Card ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconBox}>
            <Text style={styles.heroNum}>{totalNeedReorder}</Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroTitle}>Items need reordering</Text>
            <Text style={styles.heroSub}>
              Based on target stock and safety stock levels
            </Text>
          </View>
        </View>

        {/* ── Collapsible Formula Banner ── */}
        <Pressable
          onPress={() => setShowFormula(!showFormula)}
          style={styles.formulaBanner}
        >
          <VectorIcon name="Info" size={16} color={Colors.info.main} />
          <View style={styles.formulaInfo}>
            <Text style={styles.formulaTitle}>How is this calculated?</Text>
            {showFormula ? (
              <View style={styles.formulaContent}>
                <Text style={styles.formulaMath}>
                  Recommended Order = Target Stock − Physical Stock + Safety Stock
                </Text>
                <Text style={styles.formulaExampleHeading}>Example (Chicken Breast):</Text>
                <Text style={styles.formulaExampleText}>
                  35 kg target − 24.5 kg physical + 5 kg safety = <Text style={styles.bold}>15.5 kg</Text>
                </Text>
              </View>
            ) : (
              <Text style={styles.formulaTapText}>Tap to see formula explanation</Text>
            )}
          </View>
        </Pressable>

        {/* ── Supplier-Grouped Item Cards ── */}
        <View style={styles.groupsContainer}>
          {poqGroups.map((group) => {
            const selectedInGroup = group.items.filter((i) => selectedIds.has(i.id)).length;

            return (
              <View key={group.supplierId} style={styles.supplierGroup}>
                <View style={styles.groupHeaderRow}>
                  <Text style={styles.groupSupplierName}>{group.supplierName}</Text>
                  <Badge variant="gray">
                    {selectedInGroup}/{group.items.length} selected
                  </Badge>
                </View>

                <View style={styles.itemsStack}>
                  {group.items.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    const qty = quantities[item.id] ?? item.recommended;
                    const pctFilled = Math.min(100, (item.physical / item.target) * 100);

                    return (
                      <Card
                        key={item.id}
                        style={[
                          styles.itemCard,
                          !isSelected && styles.itemCardDeselected,
                        ]}
                      >
                        <View style={styles.itemTopRow}>
                          {/* Checkbox Toggle */}
                          <Pressable
                            onPress={() => handleToggle(item.id)}
                            style={[
                              styles.checkbox,
                              isSelected && styles.checkboxSelected,
                            ]}
                          >
                            {isSelected && (
                              <VectorIcon name="Check" size={12} color="#ffffff" strokeWidth={3} />
                            )}
                          </Pressable>

                          <View style={styles.itemMainInfo}>
                            <Text style={styles.itemName}>{item.name}</Text>

                            {/* Stock Level Bar */}
                            <View style={styles.stockLevelContainer}>
                              <View style={styles.stockLevelLabels}>
                                <Text style={styles.stockLevelText}>
                                  Physical: <Text style={styles.stockLevelBold}>{item.physical} {item.unit}</Text>
                                </Text>
                                <Text style={styles.stockLevelText}>
                                  Target: <Text style={styles.stockLevelBold}>{item.target} {item.unit}</Text>
                                </Text>
                              </View>
                              <View style={styles.stockLevelTrack}>
                                <View
                                  style={[
                                    styles.stockLevelFill,
                                    { width: `${pctFilled}%` },
                                  ]}
                                />
                              </View>
                            </View>

                            {/* Mini 3-Metric Grid */}
                            <View style={styles.metricsMiniGrid}>
                              <View style={styles.miniMetricBox}>
                                <Text style={styles.miniMetricLabel}>Physical</Text>
                                <Text style={styles.miniMetricVal}>{item.physical} {item.unit}</Text>
                              </View>
                              <View style={styles.miniMetricBox}>
                                <Text style={styles.miniMetricLabel}>Target</Text>
                                <Text style={styles.miniMetricVal}>{item.target} {item.unit}</Text>
                              </View>
                              <View style={styles.miniMetricBox}>
                                <Text style={styles.miniMetricLabel}>Safety</Text>
                                <Text style={styles.miniMetricVal}>{item.safety} {item.unit}</Text>
                              </View>
                            </View>
                          </View>
                        </View>

                        {/* If Selected: Stepper & Estimated Price */}
                        {isSelected && (
                          <View style={styles.stepperContainerRow}>
                            <View>
                              <Text style={styles.recomLabel}>
                                Recommended: <Text style={styles.recomVal}>{item.recommended} {item.unit}</Text>
                              </Text>
                              <Text style={styles.priceEstimateText}>
                                ≈ <Text style={styles.priceEstimateVal}>€{(qty * item.pricePerUnit).toFixed(2)}</Text>
                              </Text>
                            </View>

                            <View style={styles.stepperBox}>
                              <Pressable
                                onPress={() => handleAdjustQty(item.id, -1, item.unit)}
                                style={({ pressed }) => [styles.stepperBtn, pressed && styles.pressed]}
                              >
                                <VectorIcon name="Minus" size={14} color={Colors.neutral.textPrimary} />
                              </Pressable>

                              <Text style={styles.stepperQtyText}>
                                {qty} {item.unit}
                              </Text>

                              <Pressable
                                onPress={() => handleAdjustQty(item.id, 1, item.unit)}
                                style={({ pressed }) => [styles.stepperBtn, pressed && styles.pressed]}
                              >
                                <VectorIcon name="Plus" size={14} color={Colors.neutral.textPrimary} />
                              </Pressable>
                            </View>
                          </View>
                        )}
                      </Card>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ── Fixed Bottom Summary & Order CTA ── */}
      <View
        style={[
          styles.fixedBottom,
          {
            paddingBottom: insets.bottom > 0 ? insets.bottom + Spacing.xs : Spacing.md,
          },
        ]}
      >
        <View style={styles.bottomSummaryRow}>
          <Text style={styles.bottomItemsCount}>
            {selectedIds.size} items · {supplierCount} supplier{supplierCount !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.bottomTotalValue}>≈ €{totalValue.toFixed(2)}</Text>
        </View>

        <Pressable
          onPress={handleCreateOrders}
          disabled={selectedIds.size === 0}
          style={({ pressed }) => [
            styles.createOrderBtn,
            selectedIds.size === 0 && styles.btnDisabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.createOrderBtnText}>
            Create Purchase Order{supplierCount > 1 ? 's' : ''}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.warning.subtle,
    borderColor: Colors.warning.light,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    backgroundColor: Colors.warning.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroNum: {
    ...Typography.monoValue,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.warning.dark,
  },
  heroInfo: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.warning.dark,
  },
  heroSub: {
    fontSize: 11,
    color: Colors.warning.dark,
    marginTop: 2,
  },
  formulaBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.info.subtle,
    borderColor: Colors.info.light,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },
  formulaInfo: {
    flex: 1,
  },
  formulaTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.info.dark,
  },
  formulaTapText: {
    fontSize: 11,
    color: Colors.info.dark,
    marginTop: 2,
  },
  formulaContent: {
    marginTop: Spacing.xs,
    gap: 4,
  },
  formulaMath: {
    fontSize: 11,
    color: Colors.info.dark,
    fontStyle: 'italic',
  },
  formulaExampleHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.info.dark,
    marginTop: 2,
  },
  formulaExampleText: {
    fontSize: 11,
    color: Colors.info.dark,
  },
  bold: {
    fontWeight: '700',
  },
  groupsContainer: {
    gap: Spacing.lg,
  },
  supplierGroup: {
    gap: Spacing.sm,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
  },
  groupSupplierName: {
    ...Typography.cardTitle,
    fontSize: 14,
  },
  itemsStack: {
    gap: Spacing.sm,
  },
  itemCard: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  itemCardDeselected: {
    opacity: 0.55,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.neutral.border,
    backgroundColor: Colors.neutral.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxSelected: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  itemMainInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  itemName: {
    ...Typography.cardTitle,
    fontSize: 14,
  },
  stockLevelContainer: {
    gap: 4,
  },
  stockLevelLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stockLevelText: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  stockLevelBold: {
    ...Typography.monoCaption,
    color: Colors.neutral.textPrimary,
    fontWeight: '600',
  },
  stockLevelTrack: {
    height: 5,
    backgroundColor: Colors.neutral.borderLight,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  stockLevelFill: {
    height: '100%',
    backgroundColor: Colors.warning.main,
    borderRadius: 2.5,
  },
  metricsMiniGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 2,
  },
  miniMetricBox: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.borderLight,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 3,
    alignItems: 'center',
  },
  miniMetricLabel: {
    fontSize: 9,
    color: Colors.neutral.textTertiary,
  },
  miniMetricVal: {
    ...Typography.monoCaption,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  stepperContainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.borderLight,
  },
  recomLabel: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
  },
  recomVal: {
    ...Typography.monoCaption,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  priceEstimateText: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  priceEstimateVal: {
    ...Typography.monoCaption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.neutral.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQtyText: {
    ...Typography.monoValue,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    minWidth: 55,
    textAlign: 'center',
  },
  fixedBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.neutral.card,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.xs,
    ...Shadows.elevated,
  },
  bottomSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomItemsCount: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
  },
  bottomTotalValue: {
    ...Typography.monoValue,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  createOrderBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  createOrderBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    backgroundColor: Colors.neutral.border,
  },
  pressed: {
    opacity: 0.8,
  },
});

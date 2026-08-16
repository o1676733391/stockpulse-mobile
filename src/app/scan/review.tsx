import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ConfidenceBar } from '@/components/ui/confidence-bar';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { mockInventoryItems, mockRecipes } from '@/mocks/inventoryMockData';
import { applyTheoreticalDeductions, calculateBomDeductions } from '@/services/bomService';
import { INITIAL_MOCK_OCR_ITEMS } from '@/services/ocrService';
import { OcrItem } from '@/types/ocr';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OCRReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<OcrItem[]>(() =>
    JSON.parse(JSON.stringify(INITIAL_MOCK_OCR_ITEMS))
  );

  // Modals for editing mapping or adding new items
  const [editingItem, setEditingItem] = useState<OcrItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedNewRecipeId, setSelectedNewRecipeId] = useState(mockRecipes[0].id);
  const [newQty, setNewQty] = useState('1');

  // Quantity updates
  const handleUpdateQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, qty: Math.max(0, it.qty + delta) } : it))
    );
  };

  const handleSetDirectQty = (id: string, val: string) => {
    const num = parseInt(val, 10);
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, qty: isNaN(num) ? 0 : num } : it))
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleConfirmMapping = (recipeId: string) => {
    if (!editingItem) return;
    const targetRecipe = mockRecipes.find((r) => r.id === recipeId);
    if (!targetRecipe) return;

    setItems((prev) =>
      prev.map((it) =>
        it.id === editingItem.id
          ? { ...it, recipeId: targetRecipe.id, item: targetRecipe.name, confidence: 100 }
          : it
      )
    );
    setEditingItem(null);
  };

  const handleAddMissingItem = () => {
    const targetRecipe = mockRecipes.find((r) => r.id === selectedNewRecipeId);
    if (!targetRecipe) return;

    const qty = parseInt(newQty, 10) || 1;
    const newItem: OcrItem = {
      id: `manual-${Date.now()}`,
      artNr: `M-${items.length + 1}`,
      item: targetRecipe.name,
      recipeId: targetRecipe.id,
      qty,
      confidence: 100,
    };

    setItems((prev) => [...prev, newItem]);
    setShowAddModal(false);
    setNewQty('1');
  };

  // Calculations
  const activeItems = useMemo(() => items.filter((i) => i.qty > 0), [items]);
  const lowConfCount = useMemo(() => activeItems.filter((i) => i.confidence < 90).length, [activeItems]);
  const avgConfidence = useMemo(() => {
    if (activeItems.length === 0) return 0;
    return Math.round(activeItems.reduce((sum, i) => sum + i.confidence, 0) / activeItems.length);
  }, [activeItems]);

  const totalPortions = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);

  // Confirm and Deduct
  const handleConfirmDeduct = () => {
    const deductionResult = calculateBomDeductions(items, mockRecipes, mockInventoryItems, {
      reportNumber: '2048',
      date: '10 Mar 2026',
      shift: 'Lunch shift',
    });

    // Apply to mock inventory in-memory (isolated until count)
    applyTheoreticalDeductions(deductionResult.deductions, mockInventoryItems);

    // Navigate to Result screen with query params or state
    router.push({
      pathname: '/scan/result',
      params: {
        totalPortions: String(deductionResult.totalPortions),
        menuItemCount: String(deductionResult.menuItemCount),
      },
    } as any);
  };

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      {/* ── TopBar ── */}
      <TopBar
        title="Review POS Scan"
        subtitle="10 Mar 2026 · Report #2048"
        showBack
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 170 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Summary Stats Header Card ── */}
        <Card style={styles.summaryCard}>
          <View style={styles.statsGrid}>
            <View style={styles.statBoxGreen}>
              <Text style={styles.statValueGreen}>{activeItems.length}</Text>
              <Text style={styles.statLabelGreen}>Detected Items</Text>
            </View>
            <View style={styles.statBoxBlue}>
              <Text style={styles.statValueBlue}>{avgConfidence}%</Text>
              <Text style={styles.statLabelBlue}>Avg Confidence</Text>
            </View>
            <View style={styles.statBoxAmber}>
              <Text style={styles.statValueAmber}>{lowConfCount}</Text>
              <Text style={styles.statLabelAmber}>Review Needed</Text>
            </View>
          </View>

          {/* Receipt Metadata Banner */}
          <View style={styles.receiptMetaRow}>
            <View style={styles.receiptThumb}>
              <View style={[styles.thumbLine, { width: '80%' }]} />
              <View style={[styles.thumbLine, { width: '100%' }]} />
              <View style={[styles.thumbLine, { width: '70%' }]} />
              <View style={[styles.thumbLine, { width: '90%' }]} />
            </View>
            <View style={styles.receiptMetaInfo}>
              <Text style={styles.receiptMetaTitle}>POS Report · 10 Mar 2026</Text>
              <Text style={styles.receiptMetaSub}>
                Bella Cucina Restaurant · Lunch shift
              </Text>
              <Text style={styles.receiptMetaPortions}>
                Report Date: 10 Mar 2026 · {totalPortions} portions total
              </Text>
            </View>
          </View>
        </Card>

        {/* ── Low Confidence Alert Banner ── */}
        {lowConfCount > 0 && (
          <View style={styles.lowConfBanner}>
            <VectorIcon name="AlertTriangle" size={16} color={Colors.warning.dark} />
            <Text style={styles.lowConfBannerText}>
              {lowConfCount} item{lowConfCount > 1 ? 's' : ''} with low confidence — please verify recipe mapping & quantity
            </Text>
          </View>
        )}

        {/* ── Table Column Headers ── */}
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.thText, { width: 36 }]}>#</Text>
          <Text style={[styles.thText, { flex: 1 }]}>Item / Recipe</Text>
          <Text style={[styles.thText, { width: 70, textAlign: 'center' }]}>Qty</Text>
          <Text style={[styles.thText, { width: 66, textAlign: 'right' }]}>Conf.</Text>
          <Text style={[styles.thText, { width: 26 }]} />
        </View>

        {/* ── Extracted Item Rows ── */}
        <View style={styles.itemList}>
          {items.map((item) => {
            const isLowConf = item.confidence < 90;

            return (
              <Card
                key={item.id}
                urgencyColor={isLowConf ? Colors.warning.main : undefined}
                style={styles.itemCard}
              >
                <View style={styles.itemRow}>
                  {/* Article # */}
                  <Text style={styles.artNrText}>{item.artNr}</Text>

                  {/* Name & Recipe Mapping Pill */}
                  <Pressable
                    onPress={() => setEditingItem(item)}
                    style={styles.nameContainer}
                  >
                    <View style={styles.nameRow}>
                      <Text style={styles.itemNameText}>{item.item}</Text>
                      <VectorIcon name="Pencil" size={11} color={Colors.neutral.textTertiary} />
                    </View>
                    {isLowConf && (
                      <View style={styles.reviewTag}>
                        <Text style={styles.reviewTagText}>Review</Text>
                      </View>
                    )}
                  </Pressable>

                  {/* Quantity Stepper Input */}
                  <View style={styles.qtyControlBox}>
                    <Pressable
                      onPress={() => handleUpdateQty(item.id, -1)}
                      style={({ pressed }) => [styles.qtyBtn, pressed && styles.pressed]}
                    >
                      <Text style={styles.qtyBtnText}>−</Text>
                    </Pressable>
                    <TextInput
                      value={String(item.qty)}
                      onChangeText={(val) => handleSetDirectQty(item.id, val)}
                      keyboardType="number-pad"
                      style={styles.qtyInput}
                    />
                    <Pressable
                      onPress={() => handleUpdateQty(item.id, 1)}
                      style={({ pressed }) => [styles.qtyBtn, pressed && styles.pressed]}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </Pressable>
                  </View>

                  {/* Confidence Bar */}
                  <View style={styles.confBox}>
                    <ConfidenceBar value={item.confidence} width={38} />
                  </View>

                  {/* Delete Button */}
                  <Pressable
                    onPress={() => handleRemoveItem(item.id)}
                    style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
                  >
                    <VectorIcon name="X" size={14} color={Colors.neutral.textTertiary} />
                  </Pressable>
                </View>
              </Card>
            );
          })}

          {/* Add Missing Item Button */}
          <Pressable
            onPress={() => setShowAddModal(true)}
            style={({ pressed }) => [styles.addItemBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="Plus" size={16} color={Colors.brand.primary} strokeWidth={2.5} />
            <Text style={styles.addItemBtnText}>Add missing item</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* ── Fixed Bottom Actions & Info ── */}
      <View
        style={[
          styles.fixedBottom,
          {
            paddingBottom: insets.bottom > 0 ? insets.bottom + Spacing.xs : Spacing.md,
          },
        ]}
      >
        <View style={styles.infoNoteBox}>
          <Text style={styles.infoNoteText}>
            <Text style={styles.infoNoteBold}>Note:</Text> This will deduct theoretical inventory using recipe/BOM mappings. Physical stock is not affected.
          </Text>
        </View>

        <Pressable
          onPress={handleConfirmDeduct}
          style={({ pressed }) => [styles.confirmBtn, pressed && styles.pressed]}
        >
          <VectorIcon name="CheckCircle2" size={18} color="#ffffff" />
          <Text style={styles.confirmBtnText}>Confirm & Deduct Stock</Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace('/(tabs)/scan' as any)}
          style={({ pressed }) => [styles.retakeBtn, pressed && styles.pressed]}
        >
          <Text style={styles.retakeBtnText}>Retake Photo</Text>
        </Pressable>
      </View>

      {/* ── Correct Recipe Mapping Modal ── */}
      <Modal
        visible={editingItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingItem(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setEditingItem(null)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Correct Recipe Mapping</Text>
            <Text style={styles.modalSub}>
              Map &quot;{editingItem?.item}&quot; to an active recipe:
            </Text>

            <ScrollView style={{ maxHeight: 240 }}>
              {mockRecipes.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => handleConfirmMapping(r.id)}
                  style={({ pressed }) => [
                    styles.recipeOption,
                    editingItem?.recipeId === r.id && styles.recipeOptionSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <View>
                    <Text style={styles.recipeOptionName}>{r.name}</Text>
                    <Text style={styles.recipeOptionCat}>
                      {r.category} · €{r.costPerServing.toFixed(2)} cost
                    </Text>
                  </View>
                  {editingItem?.recipeId === r.id && (
                    <VectorIcon name="Check" size={16} color={Colors.brand.primary} strokeWidth={2.5} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* ── Add Missing Item Modal ── */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAddModal(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Missing Item</Text>

            <Text style={styles.modalFieldLabel}>Select Recipe</Text>
            <ScrollView style={{ maxHeight: 180, marginBottom: Spacing.md }}>
              {mockRecipes.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => setSelectedNewRecipeId(r.id)}
                  style={[
                    styles.recipeOption,
                    selectedNewRecipeId === r.id && styles.recipeOptionSelected,
                  ]}
                >
                  <Text style={styles.recipeOptionName}>{r.name}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.modalFieldLabel}>Quantity Sold</Text>
            <TextInput
              value={newQty}
              onChangeText={setNewQty}
              keyboardType="number-pad"
              placeholder="e.g. 5"
              style={styles.modalInput}
            />

            <View style={styles.modalBtnRow}>
              <Pressable
                onPress={() => setShowAddModal(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleAddMissingItem}
                style={styles.modalAddBtn}
              >
                <Text style={styles.modalAddBtnText}>Add Item</Text>
              </Pressable>
            </View>
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
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  summaryCard: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statBoxGreen: {
    flex: 1,
    backgroundColor: Colors.brand.subtle,
    borderColor: Colors.brand.light,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  statValueGreen: {
    ...Typography.monoValue,
    fontSize: 18,
    color: Colors.brand.dark,
  },
  statLabelGreen: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.brand.dark,
    marginTop: 2,
  },
  statBoxBlue: {
    flex: 1,
    backgroundColor: Colors.info.subtle,
    borderColor: Colors.info.light,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  statValueBlue: {
    ...Typography.monoValue,
    fontSize: 18,
    color: Colors.info.dark,
  },
  statLabelBlue: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.info.dark,
    marginTop: 2,
  },
  statBoxAmber: {
    flex: 1,
    backgroundColor: Colors.warning.subtle,
    borderColor: Colors.warning.light,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  statValueAmber: {
    ...Typography.monoValue,
    fontSize: 18,
    color: Colors.warning.dark,
  },
  statLabelAmber: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.warning.dark,
    marginTop: 2,
  },
  receiptMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.borderLight,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
  },
  receiptThumb: {
    width: 36,
    height: 46,
    backgroundColor: Colors.neutral.card,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: 4,
    padding: 4,
    justifyContent: 'space-around',
  },
  thumbLine: {
    height: 2,
    backgroundColor: Colors.neutral.border,
    borderRadius: 1,
  },
  receiptMetaInfo: {
    flex: 1,
    gap: 1,
  },
  receiptMetaTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  receiptMetaSub: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
  },
  receiptMetaPortions: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
  },
  lowConfBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warning.subtle,
    borderColor: Colors.warning.light,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  lowConfBannerText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.warning.dark,
    flex: 1,
    lineHeight: 15,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  thText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.neutral.textTertiary,
  },
  itemList: {
    gap: Spacing.xs,
  },
  itemCard: {
    padding: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  artNrText: {
    ...Typography.monoCaption,
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    width: 28,
  },
  nameContainer: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    flexShrink: 1,
  },
  reviewTag: {
    backgroundColor: Colors.warning.subtle,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  reviewTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.warning.dark,
  },
  qtyControlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 24,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral.borderLight,
  },
  qtyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  qtyInput: {
    width: 28,
    height: 28,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    padding: 0,
  },
  confBox: {
    width: 66,
    alignItems: 'flex-end',
  },
  deleteBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addItemBtn: {
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
  addItemBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.primary,
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
  infoNoteBox: {
    backgroundColor: Colors.info.subtle,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.lg,
  },
  infoNoteText: {
    fontSize: 11,
    color: Colors.info.dark,
    lineHeight: 14,
  },
  infoNoteBold: {
    fontWeight: '700',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    ...Shadows.card,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  retakeBtn: {
    paddingVertical: Spacing.xs,
    alignItems: 'center',
  },
  retakeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: Colors.neutral.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadows.elevated,
  },
  modalTitle: {
    ...Typography.cardTitle,
    fontSize: 16,
  },
  modalSub: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    marginBottom: Spacing.xs,
  },
  recipeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  recipeOptionSelected: {
    backgroundColor: Colors.brand.subtle,
  },
  recipeOptionName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  recipeOptionCat: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  modalFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.neutral.textSecondary,
    textTransform: 'uppercase',
  },
  modalInput: {
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    color: Colors.neutral.textPrimary,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.lg,
    backgroundColor: Colors.neutral.borderLight,
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  modalAddBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.lg,
    backgroundColor: Colors.brand.primary,
  },
  modalAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.8,
  },
});

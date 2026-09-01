import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfidenceBar } from '@/components/ui/confidence-bar';
import { VectorIcon } from '@/components/ui/icons';
import { PermissionGate } from '@/components/ui/permission-gate';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { ocrService } from '@/services/ocrService';
import { Recipe, recipeService } from '@/services/recipeService';
import { OcrItem, OcrReport } from '@/types/ocr';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

export default function OCRReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ reportId?: string; reportData?: string }>();
  const { t, formatNumber } = useI18n();

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [report, setReport] = useState<OcrReport | null>(() => {
    if (params.reportData) {
      try {
        return JSON.parse(params.reportData);
      } catch {}
    }
    return null;
  });

  const [items, setItems] = useState<OcrItem[]>(() => report?.items || []);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  // Modals for editing mapping or adding new items
  const [editingItem, setEditingItem] = useState<OcrItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedNewRecipeId, setSelectedNewRecipeId] = useState<string>('');
  const [newQty, setNewQty] = useState('1');

  // Load recipes and document on mount
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [fetchedRecipes, docResult] = await Promise.all([
          recipeService.getRecipes().catch(() => []),
          params.reportId ? ocrService.getDocument(params.reportId).catch(() => null) : Promise.resolve(null),
        ]);

        setRecipes(fetchedRecipes);
        if (fetchedRecipes.length > 0) {
          setSelectedNewRecipeId(fetchedRecipes[0].id);
        }

        if (docResult?.report) {
          setReport(docResult.report);
          setItems(docResult.report.items);
        }
      } catch (err: any) {
        Alert.alert('Load Error', err.message || 'Failed to load document review data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [params.reportId]);

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
    const targetRecipe = recipes.find((r) => r.id === recipeId);
    if (!targetRecipe) return;

    setItems((prev) =>
      prev.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              recipeId: targetRecipe.id,
              item: targetRecipe.name,
              confidence: 100, // Manual correction confirms mapping
            }
          : it
      )
    );

    // Synchronize to backend if document ID is available
    const docId = params.reportId || report?.id;
    if (docId) {
      ocrService
        .updateItem(docId, editingItem.id, {
          item: targetRecipe.name,
          recipeId: targetRecipe.id,
        })
        .catch(() => {});
    }

    setEditingItem(null);
  };

  const handleAddNewItem = () => {
    const targetRecipe = recipes.find((r) => r.id === selectedNewRecipeId);
    if (!targetRecipe) return;

    const qty = parseInt(newQty, 10) || 1;
    const newItem: OcrItem = {
      id: `ocr-manual-${Date.now()}`,
      artNr: targetRecipe.code || `ART-${items.length + 1}`,
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
  const lowConfCount = useMemo(() => activeItems.filter((i) => i.confidence < 90 || !i.recipeId).length, [activeItems]);
  const avgConfidence = useMemo(() => {
    if (activeItems.length === 0) return 0;
    return Math.round(activeItems.reduce((sum, i) => sum + i.confidence, 0) / activeItems.length);
  }, [activeItems]);

  const totalPortions = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);

  // Confirm and Deduct
  const handleConfirmDeduct = async () => {
    const reportId = params.reportId || report?.id;
    if (!reportId) {
      Alert.alert('Error', 'Missing OCR Document ID.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await ocrService.confirmDeductions(reportId, items);

      router.replace({
        pathname: '/scan/result',
        params: {
          totalPortions: String(totalPortions),
          menuItemCount: String(activeItems.length),
          deductionsJson: JSON.stringify(res.deductions || []),
          reportNumber: report?.reportNumber || 'POS-REPORT',
          date: report?.date || new Date().toISOString().slice(0, 10),
        },
      } as any);
    } catch (err: any) {
      Alert.alert('Deduction Error', err.message || 'Failed to process inventory deduction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = () => {
    Alert.alert(
      'Discard POS Extraction?',
      'Are you sure you want to discard this document? Deductions will not be applied.',
      [
        { text: 'Keep Reviewing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            const reportId = params.reportId || report?.id;
            if (reportId) {
              try {
                await ocrService.rejectDocument(reportId, 'Rejected during manual review');
              } catch (err: any) {
                console.warn('Document rejection note error:', err);
              }
            }
            router.replace('/(tabs)/scan' as any);
          },
        },
      ]
    );
  };

  return (
    <PermissionGate anyPermissions={['ocr:review', 'pos:ocr_review']}>
      <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
        {/* ── TopBar ── */}
        <TopBar
          title={t('scan.reviewTitle')}
          subtitle={`${report?.date || 'Today'} · Report #${report?.reportNumber || '0000'}`}
          showBack
        />

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.brand.primary} />
            <Text style={styles.loadingText}>Loading extraction review...</Text>
          </View>
        ) : (
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
                  <Text style={styles.statLabelGreen}>{t('scan.reviewStats.detected')}</Text>
                </View>
                <View style={styles.statBoxBlue}>
                  <Text style={styles.statValueBlue}>{avgConfidence}%</Text>
                  <Text style={styles.statLabelBlue}>{t('scan.reviewStats.confidence')}</Text>
                </View>
                <View style={styles.statBoxAmber}>
                  <Text style={styles.statValueAmber}>{lowConfCount}</Text>
                  <Text style={styles.statLabelAmber}>{t('scan.reviewStats.reviewNeeded')}</Text>
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
                  <Text style={styles.receiptMetaTitle}>
                    {report?.storeName || 'POS Register Report'}
                  </Text>
                  <Text style={styles.receiptMetaSub}>
                    {report?.date || new Date().toISOString().slice(0, 10)} · Report #{report?.reportNumber || 'POS'}
                  </Text>
                  <Text style={styles.receiptMetaPortions}>
                    {totalPortions} total portion units detected
                  </Text>
                </View>
              </View>
            </Card>

            {/* ── Low Confidence Alert Banner ── */}
            {lowConfCount > 0 && (
              <View style={styles.lowConfBanner}>
                <VectorIcon name="AlertTriangle" size={16} color={Colors.warning.dark} />
                <Text style={styles.lowConfBannerText}>
                  {lowConfCount} items have unconfirmed recipe links or low confidence. Tap to link recipe.
                </Text>
              </View>
            )}

            {/* ── Table Column Headers ── */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.thText, { width: 36 }]}>#</Text>
              <Text style={[styles.thText, { flex: 1 }]}>{t('scan.tableHeaders.item')}</Text>
              <Text style={[styles.thText, { width: 70, textAlign: 'center' }]}>{t('scan.tableHeaders.qty')}</Text>
              <Text style={[styles.thText, { width: 66, textAlign: 'right' }]}>{t('scan.tableHeaders.confidence')}</Text>
              <Text style={[styles.thText, { width: 26 }]} />
            </View>

            {/* ── Extracted Item Rows ── */}
            <View style={styles.itemList}>
              {items.map((item, idx) => {
                const isLowConf = item.confidence < 90 || !item.recipeId;

                return (
                  <Card
                    key={item.id || idx}
                    urgencyColor={isLowConf ? Colors.warning.main : undefined}
                    style={styles.itemCard}
                  >
                    <View style={styles.itemRow}>
                      {/* Article # */}
                      <Text style={styles.artNrText}>{item.artNr || idx + 1}</Text>

                      {/* Name & Recipe Mapping Pill */}
                      <Pressable
                        onPress={() => setEditingItem(item)}
                        style={styles.nameContainer}
                      >
                        <View style={styles.nameRow}>
                          <Text style={styles.itemNameText}>{item.item}</Text>
                          <VectorIcon name="Pencil" size={11} color={Colors.neutral.textTertiary} />
                        </View>
                        {item.recipeId ? (
                          <View style={styles.matchedBadge}>
                            <VectorIcon name="Check" size={10} color="#10b981" />
                            <Text style={styles.matchedBadgeText}>Recipe Linked</Text>
                          </View>
                        ) : (
                          <View style={styles.unmatchedBadge}>
                            <VectorIcon name="AlertCircle" size={10} color={Colors.warning.dark} />
                            <Text style={styles.unmatchedBadgeText}>Tap to Link Recipe</Text>
                          </View>
                        )}
                      </Pressable>

                      {/* Qty Stepper */}
                      <View style={styles.qtyContainer}>
                        <Pressable
                          onPress={() => handleUpdateQty(item.id, -1)}
                          style={({ pressed }) => [styles.qtyBtn, pressed && styles.pressed]}
                        >
                          <VectorIcon name="Minus" size={12} color={Colors.neutral.textPrimary} />
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
                          <VectorIcon name="Plus" size={12} color={Colors.neutral.textPrimary} />
                        </Pressable>
                      </View>

                      {/* Confidence Bar */}
                      <View style={styles.confContainer}>
                        <ConfidenceBar value={item.confidence} />
                      </View>

                      {/* Remove item button */}
                      <Pressable
                        onPress={() => handleRemoveItem(item.id)}
                        style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}
                      >
                        <VectorIcon name="Trash2" size={14} color={Colors.critical.main} />
                      </Pressable>
                    </View>
                  </Card>
                );
              })}
            </View>

            {/* ── Add Manual Item CTA ── */}
            <Button
              label={t('scan.addItem')}
              variant="outline"
              size="md"
              fullWidth
              icon={<VectorIcon name="Plus" size={16} color={Colors.brand.primary} />}
              onPress={() => setShowAddModal(true)}
              style={styles.addItemBtn}
            />
          </ScrollView>
        )}

        {/* ── Fixed Bottom Actions ── */}
        <View
          style={[
            styles.fixedBottom,
            {
              paddingBottom: insets.bottom > 0 ? insets.bottom + Spacing.xs : Spacing.md,
            },
          ]}
        >
          <Button
            label={isSubmitting ? 'Deducting Stock...' : t('scan.confirmDeductButton')}
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting || activeItems.length === 0}
            icon={<VectorIcon name="CheckCircle2" size={18} color="#ffffff" />}
            onPress={handleConfirmDeduct}
            style={{ marginBottom: Spacing.sm }}
          />

          <Button
            label={t('scan.rejectButton')}
            variant="outline"
            size="md"
            fullWidth
            disabled={isSubmitting}
            onPress={handleReject}
          />
        </View>

        {/* ── Recipe Mapping Modal ── */}
        <Modal
          visible={!!editingItem}
          transparent
          animationType="fade"
          onRequestClose={() => setEditingItem(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Link to Recipe</Text>
              <Text style={styles.modalSub}>
                Select the recipe to deduct raw BOM ingredients for:
              </Text>
              <Text style={styles.modalItemName}>{editingItem?.item}</Text>

              <ScrollView style={styles.modalRecipeList}>
                {recipes.map((r) => (
                  <Pressable
                    key={r.id}
                    onPress={() => handleConfirmMapping(r.id)}
                    style={({ pressed }) => [
                      styles.recipeChoiceRow,
                      r.id === editingItem?.recipeId && styles.recipeChoiceSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View>
                      <Text style={styles.recipeChoiceName}>{r.name}</Text>
                      <Text style={styles.recipeChoiceCode}>{r.code} · Yield: {r.portionYield}</Text>
                    </View>
                    {r.id === editingItem?.recipeId && (
                      <VectorIcon name="Check" size={16} color={Colors.brand.primary} />
                    )}
                  </Pressable>
                ))}
              </ScrollView>

              <Button
                label="Cancel"
                variant="outline"
                size="md"
                fullWidth
                onPress={() => setEditingItem(null)}
                style={{ marginTop: Spacing.md }}
              />
            </View>
          </View>
        </Modal>

        {/* ── Add New Item Modal ── */}
        <Modal
          visible={showAddModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Add Sold Menu Item</Text>
              <Text style={styles.modalSub}>Select a recipe from inventory:</Text>

              <ScrollView style={styles.modalRecipeList}>
                {recipes.map((r) => (
                  <Pressable
                    key={r.id}
                    onPress={() => setSelectedNewRecipeId(r.id)}
                    style={({ pressed }) => [
                      styles.recipeChoiceRow,
                      r.id === selectedNewRecipeId && styles.recipeChoiceSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View>
                      <Text style={styles.recipeChoiceName}>{r.name}</Text>
                      <Text style={styles.recipeChoiceCode}>{r.code}</Text>
                    </View>
                    {r.id === selectedNewRecipeId && (
                      <VectorIcon name="Check" size={16} color={Colors.brand.primary} />
                    )}
                  </Pressable>
                ))}
              </ScrollView>

              <View style={styles.modalQtyRow}>
                <Text style={styles.modalQtyLabel}>Portions Sold:</Text>
                <TextInput
                  value={newQty}
                  onChangeText={setNewQty}
                  keyboardType="number-pad"
                  style={styles.modalQtyInput}
                />
              </View>

              <Button
                label="Add Item"
                variant="primary"
                size="md"
                fullWidth
                onPress={handleAddNewItem}
                style={{ marginBottom: Spacing.xs, marginTop: Spacing.md }}
              />
              <Button
                label="Cancel"
                variant="outline"
                size="md"
                fullWidth
                onPress={() => setShowAddModal(false)}
              />
            </View>
          </View>
        </Modal>
      </View>
    </PermissionGate>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: Colors.neutral.textSecondary,
  },
  summaryCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statBoxGreen: {
    flex: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  statValueGreen: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
  },
  statLabelGreen: {
    fontSize: 11,
    color: '#059669',
    marginTop: 2,
  },
  statBoxBlue: {
    flex: 1,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  statValueBlue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563eb',
  },
  statLabelBlue: {
    fontSize: 11,
    color: '#2563eb',
    marginTop: 2,
  },
  statBoxAmber: {
    flex: 1,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  statValueAmber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#d97706',
  },
  statLabelAmber: {
    fontSize: 11,
    color: '#d97706',
    marginTop: 2,
  },
  receiptMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
  },
  receiptThumb: {
    width: 38,
    height: 48,
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.sm,
    padding: 6,
    justifyContent: 'space-around',
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  thumbLine: {
    height: 3,
    backgroundColor: Colors.neutral.textTertiary,
    borderRadius: 2,
  },
  receiptMetaInfo: {
    flex: 1,
  },
  receiptMetaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  receiptMetaSub: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
    marginTop: 1,
  },
  receiptMetaPortions: {
    fontSize: 11,
    color: Colors.brand.primary,
    fontWeight: '500',
    marginTop: 2,
  },
  lowConfBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning.main,
  },
  lowConfBannerText: {
    fontSize: 12,
    color: Colors.warning.dark,
    flex: 1,
    lineHeight: 16,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  thText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutral.textTertiary,
    textTransform: 'uppercase',
  },
  itemList: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  itemCard: {
    padding: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artNrText: {
    width: 36,
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  nameContainer: {
    flex: 1,
    paddingRight: Spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemNameText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.neutral.textPrimary,
  },
  matchedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  matchedBadgeText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '500',
  },
  unmatchedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  unmatchedBadgeText: {
    fontSize: 10,
    color: Colors.warning.dark,
    fontWeight: '500',
  },
  qtyContainer: {
    width: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.sm,
    paddingHorizontal: 2,
  },
  qtyBtn: {
    padding: 4,
  },
  qtyInput: {
    width: 24,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    paddingVertical: 2,
  },
  confContainer: {
    width: 66,
    paddingLeft: Spacing.xs,
  },
  removeBtn: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addItemBtn: {
    marginTop: Spacing.xs,
  },
  fixedBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.neutral.surface,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
    ...Shadows.card,
  },
  pressed: {
    opacity: 0.7,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    maxHeight: '80%',
    ...Shadows.modal,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    marginBottom: Spacing.xxs,
  },
  modalSub: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
    marginBottom: Spacing.xs,
  },
  modalItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.brand.primary,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    padding: Spacing.xs,
    borderRadius: Radius.sm,
    marginBottom: Spacing.md,
  },
  modalRecipeList: {
    maxHeight: 220,
  },
  recipeChoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
  },
  recipeChoiceSelected: {
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderRadius: Radius.sm,
  },
  recipeChoiceName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.textPrimary,
  },
  recipeChoiceCode: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    marginTop: 1,
  },
  modalQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
  },
  modalQtyLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.textPrimary,
  },
  modalQtyInput: {
    width: 60,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.sm,
    padding: Spacing.xs,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
});

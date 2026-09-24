import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfidenceBar } from '@/components/ui/confidence-bar';
import { VectorIcon } from '@/components/ui/icons';
import { PermissionGate } from '@/components/ui/permission-gate';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { inventoryService } from '@/services/inventoryService';
import { ocrService } from '@/services/ocrService';
import { Recipe, recipeService } from '@/services/recipeService';
import { InventoryItem } from '@/types/inventory';
import { OcrDuplicateCheckResult, OcrItem, OcrReport } from '@/types/ocr';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  const params = useLocalSearchParams<{
    reportId?: string;
    reportData?: string;
    documentType?: string;
  }>();
  const { t, formatCurrency, formatDate } = useI18n();

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

  const isGoodsReceipt =
    (report?.documentType || params.documentType) === 'goods_receipt';

  const [items, setItems] = useState<OcrItem[]>(() => report?.items || []);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [duplicateCheck, setDuplicateCheck] = useState<OcrDuplicateCheckResult | null>(null);

  // Edit Line Item Modal State
  const [editingItem, setEditingItem] = useState<OcrItem | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemQty, setEditItemQty] = useState('1');
  const [editItemUnitPrice, setEditItemUnitPrice] = useState('');
  const [editItemLinkedId, setEditItemLinkedId] = useState<string>('');

  // Add Line Item Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemUnitPrice, setNewItemUnitPrice] = useState('');
  const [newItemLinkedId, setNewItemLinkedId] = useState<string>('');

  // Load recipes, inventory, document and duplicate status on mount
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const docId = params.reportId || report?.id;

        const [fetchedRecipes, fetchedInv, docResult, dupResult] = await Promise.all([
          recipeService.getRecipes().catch(() => []),
          inventoryService.getItems().catch(() => []),
          docId ? ocrService.getDocument(docId).catch(() => null) : Promise.resolve(null),
          docId ? ocrService.checkDuplicate(docId).catch(() => ({ isDuplicate: false })) : Promise.resolve({ isDuplicate: false }),
        ]);

        setRecipes(fetchedRecipes);
        setInventoryItems(fetchedInv);
        setDuplicateCheck(dupResult);

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
    Alert.alert(
      'Remove Line Item',
      'Are you sure you want to remove this item from the invoice?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const docId = params.reportId || report?.id;
            setItems((prev) => prev.filter((it) => it.id !== id));
            if (docId) {
              try {
                await ocrService.deleteItem(docId, id);
              } catch {
                // Non-blocking sync error
              }
            }
          },
        },
      ]
    );
  };

  const openEditModal = (item: OcrItem) => {
    setEditingItem(item);
    setEditItemName(item.item);
    setEditItemQty(String(item.qty || 1));
    setEditItemUnitPrice(item.unitPrice !== undefined ? String(item.unitPrice) : '');
    setEditItemLinkedId(item.recipeId || '');
  };

  const handleSaveEditItem = async () => {
    if (!editingItem) return;
    const qty = parseFloat(editItemQty) || 1;
    const unitPrice = editItemUnitPrice ? parseFloat(editItemUnitPrice) : undefined;

    const updatedItem: OcrItem = {
      ...editingItem,
      item: editItemName.trim() || editingItem.item,
      qty,
      unitPrice,
      recipeId: editItemLinkedId || undefined,
      confidence: 100, // Manual review confirmed
    };

    setItems((prev) => prev.map((it) => (it.id === editingItem.id ? updatedItem : it)));

    const docId = params.reportId || report?.id;
    if (docId) {
      try {
        await ocrService.updateItem(docId, editingItem.id, updatedItem);
      } catch {
        // Non-blocking
      }
    }

    setEditingItem(null);
  };

  const handleAddNewItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Required Field', 'Please enter an item name.');
      return;
    }

    const qty = parseFloat(newItemQty) || 1;
    const unitPrice = newItemUnitPrice ? parseFloat(newItemUnitPrice) : undefined;
    const docId = params.reportId || report?.id;

    const partialItem: Partial<OcrItem> = {
      item: newItemName.trim(),
      qty,
      unitPrice,
      recipeId: newItemLinkedId || undefined,
      confidence: 100,
      artNr: `ITEM-${items.length + 1}`,
    };

    try {
      if (docId) {
        const created = await ocrService.addItem(docId, partialItem);
        setItems((prev) => [...prev, created]);
      } else {
        const localItem: OcrItem = {
          id: `ocr-manual-${Date.now()}`,
          artNr: partialItem.artNr || `ART-${items.length + 1}`,
          item: partialItem.item || '',
          recipeId: partialItem.recipeId,
          qty: partialItem.qty || 1,
          confidence: 100,
          unitPrice: partialItem.unitPrice,
        };
        setItems((prev) => [...prev, localItem]);
      }
    } catch {
      const fallbackItem: OcrItem = {
        id: `ocr-manual-${Date.now()}`,
        artNr: partialItem.artNr || `ART-${items.length + 1}`,
        item: partialItem.item || '',
        recipeId: partialItem.recipeId,
        qty: partialItem.qty || 1,
        confidence: 100,
        unitPrice: partialItem.unitPrice,
      };
      setItems((prev) => [...prev, fallbackItem]);
    }

    setShowAddModal(false);
    setNewItemName('');
    setNewItemQty('1');
    setNewItemUnitPrice('');
    setNewItemLinkedId('');
  };

  // Calculations
  const activeItems = useMemo(() => items.filter((i) => i.qty > 0), [items]);
  const lowConfCount = useMemo(
    () => activeItems.filter((i) => i.confidence < 90 || (!isGoodsReceipt && !i.recipeId)).length,
    [activeItems, isGoodsReceipt]
  );
  const avgConfidence = useMemo(() => {
    if (activeItems.length === 0) return 0;
    return Math.round(activeItems.reduce((sum, i) => sum + i.confidence, 0) / activeItems.length);
  }, [activeItems]);

  const totalPortions = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);

  // Confirmation Action
  const handleConfirmAction = async () => {
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
          reportNumber: report?.reportNumber || (isGoodsReceipt ? 'GR-REPORT' : 'POS-REPORT'),
          date: report?.date || new Date().toISOString().slice(0, 10),
          documentType: isGoodsReceipt ? 'goods_receipt' : 'order_invoice',
        },
      } as any);
    } catch (err: any) {
      Alert.alert('Confirmation Error', err.message || 'Failed to process inventory update');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reject / Discard Scan Action with Rollback Option
  const handleReject = () => {
    const reportId = params.reportId || report?.id;
    const isDup = duplicateCheck?.isDuplicate || report?.isDuplicate;

    Alert.alert(
      isDup ? 'Duplicate Scan Detected' : 'Discard Scan Extraction?',
      isDup
        ? 'This invoice appears to be a duplicate of an earlier confirmed scan. Would you like to discard it or delete with warehouse reversal?'
        : 'Are you sure you want to discard this document? Inventory will not be updated.',
      [
        { text: 'Keep Reviewing', style: 'cancel' },
        {
          text: isDup ? 'Revert & Delete' : 'Discard',
          style: 'destructive',
          onPress: async () => {
            if (reportId) {
              try {
                if (isDup) {
                  await ocrService.deleteDocument(reportId, true);
                } else {
                  await ocrService.rejectDocument(reportId, 'Rejected during manual review');
                }
              } catch (err: any) {
                console.warn('Document discard error:', err);
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
          subtitle={`${report?.date || 'Today'} · ${isGoodsReceipt ? 'Delivery #' : 'Report #'}${report?.reportNumber || '0000'}`}
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
            {/* ── Duplicate Alert Banner ── */}
            {(duplicateCheck?.isDuplicate || report?.isDuplicate) && (
              <View style={styles.duplicateBanner}>
                <View style={styles.duplicateIconBox}>
                  <VectorIcon name="AlertTriangle" size={20} color="#b45309" />
                </View>
                <View style={styles.duplicateContent}>
                  <View style={styles.duplicateHeaderRow}>
                    <Text style={styles.duplicateTitle}>{t('scan.duplicateWarningTitle')}</Text>
                    <Badge variant="amber">{t('scan.duplicateBadge')}</Badge>
                  </View>
                  <Text style={styles.duplicateText}>
                    {t('scan.duplicateWarningMessage', {
                      number: duplicateCheck?.duplicateOf?.documentNumber || report?.reportNumber || '',
                      date: duplicateCheck?.duplicateOf?.date
                        ? formatDate(duplicateCheck.duplicateOf.date)
                        : 'an earlier session',
                    })}
                  </Text>
                </View>
              </View>
            )}

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

              {/* Document Metadata Banner */}
              <View style={styles.receiptMetaRow}>
                <View style={styles.receiptThumb}>
                  <VectorIcon
                    name={isGoodsReceipt ? 'Truck' : 'FileText'}
                    size={22}
                    color={Colors.brand.primary}
                  />
                </View>
                <View style={styles.receiptMetaInfo}>
                  <View style={styles.typeRow}>
                    <Badge variant={isGoodsReceipt ? 'purple' : 'blue'}>
                      {isGoodsReceipt
                        ? t('scan.invoiceTypes.goodsReceipt')
                        : t('scan.invoiceTypes.orderInvoice')}
                    </Badge>
                  </View>
                  <Text style={styles.receiptMetaTitle}>
                    {report?.storeName || (isGoodsReceipt ? 'Vendor Delivery' : 'POS Register Report')}
                  </Text>
                  <Text style={styles.receiptMetaSub}>
                    {report?.date || new Date().toISOString().slice(0, 10)} · #{report?.reportNumber || 'SCAN'}
                  </Text>
                  <Text style={styles.receiptMetaPortions}>
                    {isGoodsReceipt
                      ? `${totalPortions} inbound units to receive into warehouse`
                      : `${totalPortions} total portion units detected`}
                  </Text>
                </View>
              </View>
            </Card>

            {/* ── Low Confidence Alert Banner ── */}
            {lowConfCount > 0 && (
              <View style={styles.lowConfBanner}>
                <VectorIcon name="AlertCircle" size={16} color={Colors.warning.dark} />
                <Text style={styles.lowConfBannerText}>
                  {lowConfCount} items have unconfirmed recipe links or low confidence. Tap to edit or link.
                </Text>
              </View>
            )}

            {/* ── Table Column Headers ── */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.thText, { width: 32 }]}>#</Text>
              <Text style={[styles.thText, { flex: 1 }]}>{t('scan.tableHeaders.item')}</Text>
              <Text style={[styles.thText, { width: 70, textAlign: 'center' }]}>{t('scan.tableHeaders.qty')}</Text>
              <Text style={[styles.thText, { width: 56, textAlign: 'right' }]}>{t('scan.tableHeaders.confidence')}</Text>
              <Text style={[styles.thText, { width: 52 }]} />
            </View>

            {/* ── Extracted Item Rows ── */}
            <View style={styles.itemList}>
              {items.map((item, idx) => {
                const isLowConf =
                  item.confidence < 90 || (!isGoodsReceipt && !item.recipeId);

                return (
                  <Card
                    key={item.id || idx}
                    urgencyColor={isLowConf ? Colors.warning.main : undefined}
                    style={styles.itemCard}
                  >
                    <View style={styles.itemRow}>
                      {/* Article # */}
                      <Text style={styles.artNrText}>{item.artNr || idx + 1}</Text>

                      {/* Name & Recipe Mapping */}
                      <Pressable
                        onPress={() => openEditModal(item)}
                        style={styles.nameContainer}
                      >
                        <View style={styles.nameRow}>
                          <Text style={styles.itemNameText} numberOfLines={2}>
                            {item.item}
                          </Text>
                          <VectorIcon name="Pencil" size={11} color={Colors.neutral.textTertiary} />
                        </View>
                        {item.unitPrice ? (
                          <Text style={styles.unitPriceText}>
                            {formatCurrency(item.unitPrice)}
                            {item.unit ? ` / ${item.unit}` : ''}
                          </Text>
                        ) : null}
                        {!isGoodsReceipt && (
                          item.recipeId ? (
                            <View style={styles.matchedBadge}>
                              <VectorIcon name="Check" size={10} color="#10b981" />
                              <Text style={styles.matchedBadgeText}>Recipe Linked</Text>
                            </View>
                          ) : (
                            <View style={styles.unmatchedBadge}>
                              <VectorIcon name="AlertCircle" size={10} color={Colors.warning.dark} />
                              <Text style={styles.unmatchedBadgeText}>Tap to Link Recipe</Text>
                            </View>
                          )
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

                      {/* Item Row Actions */}
                      <View style={styles.rowActions}>
                        <Pressable
                          onPress={() => openEditModal(item)}
                          style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
                        >
                          <VectorIcon name="Pencil" size={14} color={Colors.brand.primary} />
                        </Pressable>
                        <Pressable
                          onPress={() => handleRemoveItem(item.id)}
                          style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}
                        >
                          <VectorIcon name="Trash2" size={14} color={Colors.critical.main} />
                        </Pressable>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>

            {/* ── Add Manual Item CTA ── */}
            <Button
              label={t('scan.addItemTitle')}
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
            label={
              isSubmitting
                ? 'Synchronizing Ledger...'
                : isGoodsReceipt
                ? t('scan.confirmAndReceive')
                : t('scan.confirmDeductButton')
            }
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting || activeItems.length === 0}
            icon={<VectorIcon name="CheckCircle2" size={18} color="#ffffff" />}
            onPress={handleConfirmAction}
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

        {/* ── Edit Line Item Modal ── */}
        <Modal
          visible={!!editingItem}
          transparent
          animationType="fade"
          onRequestClose={() => setEditingItem(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{t('scan.editItemTitle')}</Text>

              <Text style={styles.inputLabel}>{t('inventory.itemName')}</Text>
              <TextInput
                value={editItemName}
                onChangeText={setEditItemName}
                style={styles.textInput}
                placeholder="Item name"
              />

              <View style={styles.modalRowInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>{t('stockCount.countedQty')}</Text>
                  <TextInput
                    value={editItemQty}
                    onChangeText={setEditItemQty}
                    keyboardType="numeric"
                    style={styles.textInput}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                  <Text style={styles.inputLabel}>{t('inventory.costPerUnit')}</Text>
                  <TextInput
                    value={editItemUnitPrice}
                    onChangeText={setEditItemUnitPrice}
                    keyboardType="numeric"
                    style={styles.textInput}
                    placeholder="0.00"
                  />
                </View>
              </View>

              {!isGoodsReceipt && (
                <>
                  <Text style={styles.inputLabel}>{t('scan.matchedItem')}</Text>
                  <ScrollView style={styles.modalSelectionList} nestedScrollEnabled>
                    {recipes.map((r) => (
                      <Pressable
                        key={r.id}
                        onPress={() => setEditItemLinkedId(r.id)}
                        style={[
                          styles.selectionRow,
                          editItemLinkedId === r.id && styles.selectionRowActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.selectionName,
                            editItemLinkedId === r.id && styles.selectionNameActive,
                          ]}
                        >
                          {r.name}
                        </Text>
                        {editItemLinkedId === r.id && (
                          <VectorIcon name="Check" size={14} color={Colors.brand.primary} />
                        )}
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              )}

              <View style={styles.modalButtonsRow}>
                <Button
                  label={t('common.save')}
                  variant="primary"
                  size="md"
                  fullWidth
                  onPress={handleSaveEditItem}
                  style={{ marginBottom: Spacing.xs, marginTop: Spacing.md }}
                />
                <Button
                  label={t('common.cancel')}
                  variant="outline"
                  size="md"
                  fullWidth
                  onPress={() => setEditingItem(null)}
                />
              </View>
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
              <Text style={styles.modalTitle}>{t('scan.addItemTitle')}</Text>

              <Text style={styles.inputLabel}>{t('inventory.itemName')}</Text>
              <TextInput
                value={newItemName}
                onChangeText={setNewItemName}
                style={styles.textInput}
                placeholder="e.g. Olive Oil, Margherita Pizza"
              />

              <View style={styles.modalRowInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>{t('stockCount.countedQty')}</Text>
                  <TextInput
                    value={newItemQty}
                    onChangeText={setNewItemQty}
                    keyboardType="numeric"
                    style={styles.textInput}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                  <Text style={styles.inputLabel}>{t('inventory.costPerUnit')}</Text>
                  <TextInput
                    value={newItemUnitPrice}
                    onChangeText={setNewItemUnitPrice}
                    keyboardType="numeric"
                    style={styles.textInput}
                    placeholder="0.00"
                  />
                </View>
              </View>

              {!isGoodsReceipt && (
                <>
                  <Text style={styles.inputLabel}>{t('scan.selectMatchedItem')}</Text>
                  <ScrollView style={styles.modalSelectionList} nestedScrollEnabled>
                    {recipes.map((r) => (
                      <Pressable
                        key={r.id}
                        onPress={() => {
                          setNewItemLinkedId(r.id);
                          if (!newItemName) setNewItemName(r.name);
                        }}
                        style={[
                          styles.selectionRow,
                          newItemLinkedId === r.id && styles.selectionRowActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.selectionName,
                            newItemLinkedId === r.id && styles.selectionNameActive,
                          ]}
                        >
                          {r.name}
                        </Text>
                        {newItemLinkedId === r.id && (
                          <VectorIcon name="Check" size={14} color={Colors.brand.primary} />
                        )}
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              )}

              <View style={styles.modalButtonsRow}>
                <Button
                  label={t('common.add')}
                  variant="primary"
                  size="md"
                  fullWidth
                  onPress={handleAddNewItem}
                  style={{ marginBottom: Spacing.xs, marginTop: Spacing.md }}
                />
                <Button
                  label={t('common.cancel')}
                  variant="outline"
                  size="md"
                  fullWidth
                  onPress={() => setShowAddModal(false)}
                />
              </View>
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
    ...Typography.body,
    color: Colors.neutral.textSecondary,
  },
  duplicateBanner: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    ...Shadows.sm,
  },
  duplicateIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  duplicateContent: {
    flex: 1,
  },
  duplicateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  duplicateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
  },
  duplicateText: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 18,
  },
  summaryCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statBoxGreen: {
    flex: 1,
    backgroundColor: Colors.brand.light,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  statValueGreen: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.brand.dark,
  },
  statLabelGreen: {
    fontSize: 11,
    color: Colors.brand.dark,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  statBoxBlue: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  statValueBlue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e40af',
  },
  statLabelBlue: {
    fontSize: 11,
    color: '#1e40af',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  statBoxAmber: {
    flex: 1,
    backgroundColor: '#fffbeb',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  statValueAmber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#b45309',
  },
  statLabelAmber: {
    fontSize: 11,
    color: '#b45309',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  receiptMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.background,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  receiptThumb: {
    width: 44,
    height: 44,
    backgroundColor: Colors.brand.light,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptMetaInfo: {
    flex: 1,
  },
  typeRow: {
    flexDirection: 'row',
    marginBottom: 2,
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
    fontWeight: '600',
    marginTop: 2,
  },
  lowConfBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  lowConfBannerText: {
    fontSize: 12,
    color: '#92400e',
    flex: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  thText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.neutral.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemList: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  itemCard: {
    padding: Spacing.sm,
    backgroundColor: Colors.neutral.card,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  artNrText: {
    width: 28,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.neutral.textTertiary,
    textAlign: 'center',
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
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  unitPriceText: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    marginTop: 1,
  },
  matchedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  matchedBadgeText: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '600',
  },
  unmatchedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  unmatchedBadgeText: {
    fontSize: 10,
    color: '#b45309',
    fontWeight: '600',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.background,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  qtyBtn: {
    width: 22,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyInput: {
    width: 26,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    padding: 0,
  },
  confContainer: {
    width: 50,
    alignItems: 'flex-end',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 50,
    justifyContent: 'flex-end',
  },
  editBtn: {
    padding: 5,
  },
  removeBtn: {
    padding: 5,
  },
  addItemBtn: {
    marginBottom: Spacing.lg,
  },
  fixedBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.neutral.card,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    ...Shadows.elevated,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.neutral.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadows.elevated,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.neutral.textPrimary,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
    marginBottom: 4,
    marginTop: Spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.neutral.textPrimary,
    backgroundColor: Colors.neutral.background,
    marginBottom: Spacing.sm,
  },
  modalRowInputs: {
    flexDirection: 'row',
  },
  modalSelectionList: {
    maxHeight: 140,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
  },
  selectionRowActive: {
    backgroundColor: Colors.brand.light,
  },
  selectionName: {
    fontSize: 13,
    color: Colors.neutral.textPrimary,
  },
  selectionNameActive: {
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  modalButtonsRow: {
    marginTop: Spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
});

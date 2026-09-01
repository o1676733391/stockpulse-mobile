import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { SectionHeader } from '@/components/ui/section-header';
import { TopBar } from '@/components/ui/top-bar';
import { BadgeVariant, Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import {
  INITIAL_PURCHASE_ORDERS,
  INITIAL_SUPPLIERS,
  procurementService,
} from '@/services/procurementService';
import { OrderStatus, PurchaseOrder } from '@/types/procurement';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
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

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; variant: BadgeVariant; stepIdx: number }
> = {
  draft:     { label: 'Draft',     variant: 'gray',  stepIdx: 0 },
  submitted: { label: 'Submitted', variant: 'blue',  stepIdx: 1 },
  approved:  { label: 'Approved',  variant: 'blue',  stepIdx: 1 },
  sent:      { label: 'Sent',      variant: 'blue',  stepIdx: 1 },
  confirmed: { label: 'Confirmed', variant: 'amber', stepIdx: 2 },
  received:  { label: 'Received',  variant: 'green', stepIdx: 3 },
  cancelled: { label: 'Cancelled', variant: 'red',   stepIdx: 0 },
};

const STATUS_STEPS: OrderStatus[] = ['draft', 'sent', 'confirmed', 'received'];
const TIMELINE_STEPS = ['Draft', 'Sent', 'Confirmed', 'Received'] as const;

export default function PurchaseOrderDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [po, setPo] = useState<PurchaseOrder>(() => {
    return (
      INITIAL_PURCHASE_ORDERS.find((p) => p.id === id) ??
      INITIAL_PURCHASE_ORDERS[0]
    );
  });

  const supplier = useMemo(() => {
    return INITIAL_SUPPLIERS.find((s) => s.id === po.supplierId) ?? INITIAL_SUPPLIERS[0];
  }, [po.supplierId]);

  // Goods Receipt Modal State
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveStep, setReceiveStep] = useState<0 | 1 | 2>(0);
  const [bbdEntries, setBbdEntries] = useState<Record<string, string>>({
    'Chicken Breast': '24 Mar 2026',
    Potatoes: '15 Apr 2026',
    'Cooking Oil': '30 Jul 2026',
    'Whole Milk': '18 Mar 2026',
    'Gouda Cheese': '28 Apr 2026',
    'Fresh Salmon': '16 Mar 2026',
  });
  const [stockUpdated, setStockUpdated] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const { label, variant, stepIdx } = STATUS_CONFIG[po.status];
  const subtotal = po.total / 1.19;
  const vat = po.total - subtotal;

  const advanceStatus = async () => {
    try {
      setIsMutating(true);
      if (po.status === 'draft') {
        const updated = await procurementService.advanceOrderStatus(po.id, 'sent');
        setPo(updated);
      } else if (po.status === 'sent') {
        const updated = await procurementService.advanceOrderStatus(po.id, 'confirmed');
        setPo(updated);
      } else if (po.status === 'confirmed') {
        setReceiveStep(0);
        setShowReceiveModal(true);
      }
    } catch (err: any) {
      Alert.alert('Status Error', err?.message || 'Failed to update order status');
    } finally {
      setIsMutating(false);
    }
  };

  const handleConfirmGoodsReceipt = async () => {
    try {
      setIsMutating(true);
      await procurementService.receiveGoods(po.id, bbdEntries);
      setPo((prev) => ({ ...prev, status: 'received' }));
      setShowReceiveModal(false);
      setStockUpdated(true);
    } catch (err: any) {
      Alert.alert('Intake Error', err?.message || 'Failed to process goods intake');
    } finally {
      setIsMutating(false);
    }
  };

  // Stock Updated Success View
  if (stockUpdated) {
    return (
      <View
        style={[
          styles.successScreen,
          {
            paddingTop: insets.top > 0 ? insets.top + Spacing.xxl : Spacing.xxl,
            paddingBottom: insets.bottom > 0 ? insets.bottom + Spacing.xl : Spacing.xl,
          },
        ]}
      >
        <View style={styles.successIconBox}>
          <VectorIcon name="CheckCircle2" size={40} color={Colors.brand.primary} />
        </View>

        <View style={styles.successTextBox}>
          <Text style={styles.successTitle}>Physical Stock Updated</Text>
          <Text style={styles.successSub}>
            Received quantities from <Text style={styles.bold}>{po.supplierName}</Text> have been added to physical inventory with new BBD batches.
          </Text>
        </View>

        {/* Received Items Summary Box */}
        <View style={styles.receivedSummaryCard}>
          {(po.items || []).map((item, i) => (
            <View key={i} style={styles.receivedItemRow}>
              <View>
                <Text style={styles.receivedItemName}>{item.itemName}</Text>
                {bbdEntries[item.itemName] && (
                  <Text style={styles.receivedItemBbd}>
                    BBD: {bbdEntries[item.itemName]}
                  </Text>
                )}
              </View>
              <Text style={styles.receivedItemDelta}>
                +{item.quantity} {item.unit}
              </Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => router.push('/(tabs)/inventory' as any)}
          style={({ pressed }) => [styles.viewInventoryBtn, pressed && styles.pressed]}
        >
          <Text style={styles.viewInventoryBtnText}>{t('navigation.inventory')}</Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace('/(tabs)/orders' as any)}
          style={({ pressed }) => [styles.backOrdersBtn, pressed && styles.pressed]}
        >
          <Text style={styles.backOrdersBtnText}>{t('orders.title')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      {/* ── TopBar ── */}
      <TopBar
        title={`PO · ${po.supplierName}`}
        subtitle={po.id.toUpperCase()}
        showBack
        right={
          <Pressable
            onPress={() => {}}
            style={({ pressed }) => [styles.iconHeaderBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="Share2" size={18} color={Colors.neutral.textPrimary} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Status & Interactive Timeline Card ── */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeaderRow}>
            <View>
              <Text style={styles.statusLabel}>Status</Text>
              <View style={styles.badgeWrapper}>
                <Badge variant={variant}>{label}</Badge>
              </View>
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.statusLabel}>Order Date</Text>
              <Text style={styles.orderDateText}>{po.date}</Text>
            </View>
          </View>

          {/* Timeline Track */}
          <View style={styles.timelineSection}>
            <View style={styles.timelineTrackRow}>
              {STATUS_STEPS.map((step, i) => {
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
              {TIMELINE_STEPS.map((step, i) => (
                <Text
                  key={step}
                  style={[
                    styles.timelineStepLabel,
                    stepIdx === i && styles.timelineStepLabelActive,
                  ]}
                >
                  {step}
                </Text>
              ))}
            </View>
          </View>
        </Card>

        {/* ── 2. Supplier Info Card ── */}
        <Card style={styles.supplierCard}>
          <Text style={styles.cardHeaderHeading}>Supplier</Text>
          <View style={styles.supplierRow}>
            <View style={styles.supplierAvatar}>
              <Text style={styles.supplierAvatarText}>
                {po.supplierName
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)}
              </Text>
            </View>
            <View style={styles.supplierMeta}>
              <Text style={styles.supplierName}>{po.supplierName}</Text>
              <Text style={styles.supplierContact}>
                {supplier.contact} · {supplier.phone}
              </Text>
            </View>
          </View>
        </Card>

        {/* ── 3. Line Items & Financial Breakdown Card ── */}
        <Card style={styles.itemsCard}>
          <SectionHeader title="Order Items" />
          <View style={styles.linesList}>
            {(po.items || []).map((item, i) => (
              <View key={i} style={styles.lineRow}>
                <View style={styles.lineInfo}>
                  <Text style={styles.lineItemName}>{item.itemName}</Text>
                  <Text style={styles.lineItemCalc}>
                    {item.quantity} {item.unit} × €{item.pricePerUnit.toFixed(2)}/unit
                  </Text>
                </View>
                <Text style={styles.lineItemTotal}>
                  €{(item.quantity * item.pricePerUnit).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          {/* Subtotal, VAT, and Total */}
          <View style={styles.financialsSection}>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Subtotal</Text>
              <Text style={styles.financialValue}>€{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>VAT (19%)</Text>
              <Text style={styles.financialValue}>€{vat.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>€{po.total.toFixed(2)}</Text>
            </View>
          </View>
        </Card>

        {/* ── 4. Export Buttons Grid ── */}
        <View style={styles.exportGrid}>
          <Pressable
            onPress={() => {}}
            style={({ pressed }) => [styles.exportBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="Download" size={16} color={Colors.neutral.textPrimary} />
            <Text style={styles.exportBtnText}>Export PDF</Text>
          </Pressable>

          <Pressable
            onPress={() => {}}
            style={({ pressed }) => [styles.exportBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="Download" size={16} color={Colors.neutral.textPrimary} />
            <Text style={styles.exportBtnText}>Export Excel</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* ── Fixed Bottom Actions Based on Status ── */}
      {po.status !== 'received' && (
        <View
          style={[
            styles.fixedBottom,
            {
              paddingBottom: insets.bottom > 0 ? insets.bottom + Spacing.xs : Spacing.md,
            },
          ]}
        >
          {po.status === 'draft' && (
            <Pressable
              onPress={advanceStatus}
              style={({ pressed }) => [styles.sendBtn, pressed && styles.pressed]}
            >
              <VectorIcon name="Send" size={16} color="#ffffff" />
              <Text style={styles.btnTextWhite}>Send to Supplier</Text>
            </Pressable>
          )}

          {po.status === 'sent' && (
            <Pressable
              onPress={advanceStatus}
              style={({ pressed }) => [styles.confirmStatusBtn, pressed && styles.pressed]}
            >
              <VectorIcon name="CheckCircle2" size={16} color="#ffffff" />
              <Text style={styles.btnTextWhite}>Mark as Confirmed</Text>
            </Pressable>
          )}

          {po.status === 'confirmed' && (
            <Pressable
              onPress={advanceStatus}
              style={({ pressed }) => [styles.receiveBtn, pressed && styles.pressed]}
            >
              <VectorIcon name="Truck" size={16} color="#ffffff" />
              <Text style={styles.btnTextWhite}>Receive Goods</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* ── 3-Step Goods Receipt Modal ── */}
      <Modal
        visible={showReceiveModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReceiveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.goodsReceiptModal}>
            <View style={styles.modalGrabber} />

            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {receiveStep === 0
                  ? 'Confirm Quantities'
                  : receiveStep === 1
                  ? 'Enter BBD Dates'
                  : 'Confirm Receipt'}
              </Text>
              <Pressable
                onPress={() => setShowReceiveModal(false)}
                style={styles.closeBtn}
              >
                <VectorIcon name="X" size={18} color={Colors.neutral.textTertiary} />
              </Pressable>
            </View>

            {/* 3-Step Progress Indicators */}
            <View style={styles.stepIndicatorsRow}>
              {['Quantities', 'BBD Dates', 'Confirm'].map((step, i) => (
                <View
                  key={step}
                  style={[
                    styles.stepBar,
                    receiveStep >= i ? styles.stepBarActive : styles.stepBarPending,
                  ]}
                />
              ))}
            </View>

            {/* Step 0: Confirm Quantities */}
            {receiveStep === 0 && (
              <ScrollView style={styles.modalScroll}>
                {(po.items || []).map((item, i) => (
                  <View key={i} style={styles.modalItemRow}>
                    <View>
                      <Text style={styles.modalItemName}>{item.itemName}</Text>
                      <Text style={styles.modalItemSub}>
                        Ordered: {item.quantity} {item.unit}
                      </Text>
                    </View>
                    <View style={styles.modalItemRight}>
                      <Text style={styles.modalItemQty}>
                        {item.quantity} {item.unit}
                      </Text>
                      <Badge variant="green">Received</Badge>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Step 1: Enter BBD Dates */}
            {receiveStep === 1 && (
              <ScrollView style={styles.modalScroll}>
                {(po.items || []).map((item, i) => (
                  <View key={i} style={styles.bbdInputGroup}>
                    <Text style={styles.bbdInputLabel}>
                      {item.itemName} — Best Before Date
                    </Text>
                    <TextInput
                      value={bbdEntries[item.itemName] ?? ''}
                      onChangeText={(val) =>
                        setBbdEntries((prev) => ({
                          ...prev,
                          [item.itemName]: val,
                        }))
                      }
                      placeholder="e.g. 25 Mar 2026"
                      placeholderTextColor={Colors.neutral.textTertiary}
                      style={styles.bbdTextInput}
                    />
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Step 2: Confirm Receipt */}
            {receiveStep === 2 && (
              <View style={styles.confirmReceiptContainer}>
                <View style={styles.receiptNoticeBox}>
                  <Text style={styles.receiptNoticeText}>
                    <Text style={styles.bold}>Note:</Text> Confirmed quantities will be added to physical inventory and new batches created with the entered BBD dates.
                  </Text>
                </View>

                {(po.items || []).map((item, i) => (
                  <View key={i} style={styles.modalItemRow}>
                    <View>
                      <Text style={styles.modalItemName}>{item.itemName}</Text>
                      {bbdEntries[item.itemName] && (
                        <Text style={styles.modalItemSub}>
                          BBD: {bbdEntries[item.itemName]}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.modalItemQtyGreen}>
                      +{item.quantity} {item.unit}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Modal Bottom Stepper Actions */}
            <View style={styles.modalActionsRow}>
              {receiveStep > 0 && (
                <Pressable
                  onPress={() => setReceiveStep((s) => (s - 1) as any)}
                  style={styles.modalBackBtn}
                >
                  <Text style={styles.modalBackBtnText}>Back</Text>
                </Pressable>
              )}

              <Pressable
                onPress={() => {
                  if (receiveStep < 2) setReceiveStep((s) => (s + 1) as any);
                  else handleConfirmGoodsReceipt();
                }}
                style={styles.modalContinueBtn}
              >
                <Text style={styles.modalContinueBtnText}>
                  {receiveStep === 2 ? 'Confirm Goods Receipt' : 'Continue'}
                </Text>
                {receiveStep < 2 && (
                  <VectorIcon name="ChevronRight" size={16} color="#ffffff" />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  iconHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  statusCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    marginBottom: 4,
  },
  badgeWrapper: {
    alignSelf: 'flex-start',
  },
  dateCol: {
    alignItems: 'flex-end',
  },
  orderDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
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
    width: 16,
    height: 16,
    borderRadius: 8,
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
    width: 5,
    height: 5,
    borderRadius: 2.5,
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
  supplierCard: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardHeaderHeading: {
    ...Typography.sectionHeader,
    fontSize: 10,
  },
  supplierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  supplierAvatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: Colors.neutral.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplierAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textSecondary,
  },
  supplierMeta: {
    flex: 1,
  },
  supplierName: {
    ...Typography.cardTitle,
    fontSize: 14,
  },
  supplierContact: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    marginTop: 2,
  },
  itemsCard: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  linesList: {
    gap: Spacing.xs,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  lineInfo: {
    flex: 1,
  },
  lineItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  lineItemCalc: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    marginTop: 1,
  },
  lineItemTotal: {
    ...Typography.monoValue,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  financialsSection: {
    paddingTop: Spacing.sm,
    gap: 4,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  financialLabel: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  financialValue: {
    ...Typography.monoCaption,
    fontSize: 12,
    color: Colors.neutral.textSecondary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.borderLight,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  totalValue: {
    ...Typography.monoValue,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  exportGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.neutral.card,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    ...Shadows.card,
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
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
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    ...Shadows.card,
  },
  confirmStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.info.main,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    ...Shadows.card,
  },
  receiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    ...Shadows.card,
  },
  btnTextWhite: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  goodsReceiptModal: {
    backgroundColor: Colors.neutral.card,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  modalGrabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.neutral.borderLight,
    alignSelf: 'center',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    ...Typography.cardTitle,
    fontSize: 16,
  },
  closeBtn: {
    padding: 4,
  },
  stepIndicatorsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  stepBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  stepBarActive: {
    backgroundColor: Colors.brand.primary,
  },
  stepBarPending: {
    backgroundColor: Colors.neutral.borderLight,
  },
  modalScroll: {
    maxHeight: 240,
  },
  modalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  modalItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  modalItemSub: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    marginTop: 2,
  },
  modalItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalItemQty: {
    ...Typography.monoValue,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  modalItemQtyGreen: {
    ...Typography.monoValue,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  bbdInputGroup: {
    marginBottom: Spacing.sm,
    gap: 4,
  },
  bbdInputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  bbdTextInput: {
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 13,
    color: Colors.neutral.textPrimary,
  },
  confirmReceiptContainer: {
    gap: Spacing.sm,
  },
  receiptNoticeBox: {
    backgroundColor: Colors.brand.subtle,
    borderColor: Colors.brand.light,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
  },
  receiptNoticeText: {
    fontSize: 11,
    color: Colors.brand.dark,
    lineHeight: 15,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  modalBackBtn: {
    backgroundColor: Colors.neutral.borderLight,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  modalContinueBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
  },
  modalContinueBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  successScreen: {
    flex: 1,
    backgroundColor: Colors.neutral.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  successIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTextBox: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  successTitle: {
    ...Typography.pageTitle,
    fontSize: 22,
  },
  successSub: {
    ...Typography.bodySecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  receivedSummaryCard: {
    width: '100%',
    backgroundColor: Colors.brand.subtle,
    borderColor: Colors.brand.light,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.xs,
    marginVertical: Spacing.xs,
  },
  receivedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  receivedItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  receivedItemBbd: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  receivedItemDelta: {
    ...Typography.monoValue,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  viewInventoryBtn: {
    width: '100%',
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
    ...Shadows.card,
  },
  viewInventoryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  backOrdersBtn: {
    paddingVertical: Spacing.xs,
    alignItems: 'center',
  },
  backOrdersBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  pressed: {
    opacity: 0.8,
  },
});

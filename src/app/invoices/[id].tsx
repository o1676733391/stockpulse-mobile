import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { BadgeVariant, Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { invoiceService } from '@/services/invoiceService';
import { Invoice, InvoiceStatus } from '@/types/invoices';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

export default function InvoiceDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, formatCurrency } = useI18n();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInvoice() {
      if (!id) return;
      try {
        setLoading(true);
        const inv = await invoiceService.getInvoiceById(id);
        setInvoice(inv);
      } catch {
        // safe fallback
      } finally {
        setLoading(false);
      }
    }
    loadInvoice();
  }, [id]);

  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipAmountInput, setSkipAmountInput] = useState('');
  const [skipReasonInput, setSkipReasonInput] = useState('');
  const [submittingSkip, setSubmittingSkip] = useState(false);

  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesInput, setNotesInput] = useState('');
  const [submittingNotes, setSubmittingNotes] = useState(false);

  const handleOpenNotesModal = () => {
    setNotesInput(invoice?.notes || '');
    setShowNotesModal(true);
  };

  const handleSaveNotes = async () => {
    if (!invoice) return;
    try {
      setSubmittingNotes(true);
      const updated = await invoiceService.updateInvoiceNotes(invoice.id, notesInput.trim());
      setInvoice(updated);
      setShowNotesModal(false);
      Alert.alert('Notes Saved', 'Invoice notes updated successfully.');
    } catch {
      Alert.alert('Error', 'Failed to save notes.');
    } finally {
      setSubmittingNotes(false);
    }
  };

  const handleUpdateStatus = async (status: InvoiceStatus) => {
    if (!invoice) return;
    try {
      const updated = await invoiceService.updateInvoiceStatus(invoice.id, status);
      setInvoice(updated);
      Alert.alert('Success', `Invoice status marked as ${status}.`);
    } catch {
      Alert.alert('Error', 'Unable to update invoice status');
    }
  };

  const handleOpenSkipModal = () => {
    if (invoice?.skipDeductionAmount) {
      setSkipAmountInput(invoice.skipDeductionAmount.toString());
      setSkipReasonInput(invoice.skipDeductionReason || '');
    } else {
      setSkipAmountInput('');
      setSkipReasonInput('');
    }
    setShowSkipModal(true);
  };

  const handleApplySkip = async () => {
    const amt = parseFloat(skipAmountInput);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid deduction amount.');
      return;
    }
    if (!skipReasonInput.trim()) {
      Alert.alert('Reason Required', 'Please enter a reason (e.g. damaged goods or short delivery).');
      return;
    }
    try {
      setSubmittingSkip(true);
      const updated = await invoiceService.applySkipDeduction(invoice!.id, amt, skipReasonInput.trim());
      setInvoice(updated);
      setShowSkipModal(false);
      Alert.alert(
        'Debt Deducted',
        `€${amt.toFixed(2)} deducted from supplier debt. Net payable: €${(updated.netPayableAmount ?? updated.totalAmount).toFixed(2)}.`
      );
    } catch {
      Alert.alert('Error', 'Failed to apply skip debt deduction.');
    } finally {
      setSubmittingSkip(false);
    }
  };

  const handleSettlePayment = async () => {
    if (!invoice) return;
    try {
      const updated = await invoiceService.recordPayment(invoice.id);
      setInvoice(updated);
      const net = updated.netPayableAmount ?? updated.totalAmount;
      Alert.alert('Payment Recorded', `Payment of ${formatCurrency(net)} settled successfully.`);
    } catch {
      Alert.alert('Error', 'Unable to record payment.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={Colors.brand.primary} />
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.errorText}>{t('invoices.invoiceNotFound')}</Text>
        <Button label={t('common.goBack')} variant="outline" onPress={() => router.back()} />
      </View>
    );
  }

  const isSupplierDoc = invoice.type === 'supplier_delivery';
  const statusBadgeVariant: BadgeVariant =
    invoice.status === 'verified'
      ? 'green'
      : invoice.status === 'discrepancy'
      ? 'red'
      : invoice.status === 'paid'
      ? 'blue'
      : 'amber';

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar
        title={invoice.invoiceNumber}
        subtitle={invoice.supplierName || invoice.customerReference || t('invoices.invoiceDetails')}
        showBack
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Document Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View
              style={[
                styles.typePill,
                { backgroundColor: isSupplierDoc ? '#dcfce7' : '#ede9fe' },
              ]}
            >
              <VectorIcon
                name={isSupplierDoc ? 'Truck' : 'FileText'}
                size={14}
                color={isSupplierDoc ? '#15803d' : '#6d28d9'}
              />
              <Text
                style={[
                  styles.typePillText,
                  { color: isSupplierDoc ? '#15803d' : '#6d28d9' },
                ]}
              >
                {isSupplierDoc
                  ? t('invoices.deliveryInvoiceSupplier')
                  : t('invoices.orderFormReceipt')}
              </Text>
            </View>

            <Badge variant={statusBadgeVariant}>
              {t(`invoices.statuses.${invoice.status}`, { defaultValue: invoice.status.toUpperCase() })}
            </Badge>
          </View>

          <Text style={styles.sourceTitle}>
            {invoice.supplierName || invoice.customerReference || 'Operations'}
          </Text>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>{t('invoices.invoiceDate')}</Text>
              <Text style={styles.metaValue}>{invoice.date}</Text>
            </View>

            {invoice.dueDate && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>{t('invoices.dueDate')}</Text>
                <Text style={styles.metaValue}>{invoice.dueDate}</Text>
              </View>
            )}

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>{t('invoices.paymentStatus')}</Text>
              <Text
                style={[
                  styles.metaValue,
                  {
                    color:
                      invoice.paymentStatus === 'paid'
                        ? Colors.brand.primary
                        : Colors.warning.dark,
                  },
                ]}
              >
                {invoice.paymentStatus.toUpperCase()}
              </Text>
            </View>

            {invoice.verifiedBy && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>{t('invoices.verifiedBy')}</Text>
                <Text style={styles.metaValue}>{invoice.verifiedBy}</Text>
              </View>
            )}
          </View>

          {/* Connected references */}
          {(invoice.purchaseOrderId || invoice.deliveryNoteId) && (
            <View style={styles.connectionsRow}>
              {invoice.purchaseOrderId && (
                <Pressable
                  onPress={() => router.push(`/orders/${invoice.purchaseOrderId}` as any)}
                  style={styles.connectionBadge}
                >
                  <VectorIcon name="ShoppingCart" size={12} color={Colors.brand.primary} />
                  <Text style={styles.connectionText}>
                    {t('invoices.linkedPo', { po: invoice.purchaseOrderId.toUpperCase() })}
                  </Text>
                </Pressable>
              )}

              {invoice.deliveryNoteId && (
                <Pressable
                  onPress={() => router.push(`/delivery-notes/${invoice.deliveryNoteId}` as any)}
                  style={styles.connectionBadge}
                >
                  <VectorIcon name="ClipboardList" size={12} color="#1d4ed8" />
                  <Text style={[styles.connectionText, { color: '#1d4ed8' }]}>
                    {t('invoices.linkedDeliveryNote')}
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          <Pressable
            onPress={handleOpenNotesModal}
            style={({ pressed }) => [styles.notesBox, pressed && styles.pressed]}
          >
            <VectorIcon name="Info" size={14} color={Colors.neutral.textSecondary} />
            <Text
              style={[
                styles.notesText,
                !invoice.notes && { fontStyle: 'italic', color: Colors.neutral.textTertiary },
              ]}
            >
              {invoice.notes || t('invoices.tapToAddNotes')}
            </Text>
            <VectorIcon name="Edit3" size={13} color={Colors.brand.primary} />
          </Pressable>
        </Card>

        {/* Line Items Table */}
        <Text style={styles.sectionHeading}>{t('invoices.lineItems')} ({invoice.items.length})</Text>

        <Card style={styles.tableCard}>
          {invoice.items.map((it, idx) => (
            <View
              key={it.id}
              style={[
                styles.itemRow,
                idx !== invoice.items.length - 1 && styles.itemRowBorder,
              ]}
            >
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{it.description}</Text>
                {it.sku && <Text style={styles.itemSku}>SKU: {it.sku}</Text>}
                <Text style={styles.itemCalc}>
                  {it.quantity} {it.unit} × {formatCurrency(it.unitPrice)}
                </Text>
              </View>

              <Text style={styles.itemTotal}>
                {formatCurrency(it.totalPrice)}
              </Text>
            </View>
          ))}
        </Card>

        {/* Skip / Damage Control Card for Supplier Delivery Invoices */}
        {isSupplierDoc && (
          <Card style={styles.skipCard}>
            <View style={styles.skipHeaderRow}>
              <View style={styles.skipTitleContainer}>
                <VectorIcon name="Scissors" size={16} color="#d97706" />
                <Text style={styles.skipCardTitle}>{t('invoices.skipControlTitle')}</Text>
              </View>
              {invoice.skipDeductionAmount && invoice.skipDeductionAmount > 0 ? (
                <Badge variant="amber">{t('invoices.deductionApplied')}</Badge>
              ) : null}
            </View>
            <Text style={styles.skipCardDesc}>
              {t('invoices.skipControlDesc')}
            </Text>

            {invoice.skipDeductionAmount && invoice.skipDeductionAmount > 0 ? (
              <View style={styles.appliedSkipBox}>
                <View style={styles.appliedSkipRow}>
                  <Text style={styles.appliedSkipLabel}>{t('invoices.deductedFromDebt')}</Text>
                  <Text style={styles.appliedSkipAmount}>-{formatCurrency(invoice.skipDeductionAmount)}</Text>
                </View>
                {invoice.skipDeductionReason && (
                  <Text style={styles.appliedSkipReason}>{t('invoices.reason')} {invoice.skipDeductionReason}</Text>
                )}
                <Pressable
                  onPress={handleOpenSkipModal}
                  style={({ pressed }) => [styles.skipActionBtn, pressed && styles.pressed]}
                >
                  <VectorIcon name="Edit3" size={14} color="#92400e" />
                  <Text style={styles.skipActionBtnText}>{t('invoices.modifySkipDeduction')}</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={handleOpenSkipModal}
                style={({ pressed }) => [styles.skipActionBtn, pressed && styles.pressed]}
              >
                <VectorIcon name="MinusCircle" size={16} color="#d97706" />
                <Text style={styles.skipActionBtnText}>{t('invoices.addSkipDeduction')}</Text>
              </Pressable>
            )}
          </Card>
        )}

        {/* Financial Breakdown Card */}
        <Card style={styles.financialCard}>
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>{t('invoices.subtotal')}</Text>
            <Text style={styles.finValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>

          <View style={styles.finRow}>
            <Text style={styles.finLabel}>{t('invoices.vatTax')}</Text>
            <Text style={styles.finValue}>{formatCurrency(invoice.taxAmount)}</Text>
          </View>

          <View style={[styles.finRow, styles.subtotalDivider]}>
            <Text style={styles.finLabel}>{t('invoices.grossInvoiced')}</Text>
            <Text style={styles.finValue}>{formatCurrency(invoice.totalAmount)}</Text>
          </View>

          {isSupplierDoc && invoice.skipDeductionAmount && invoice.skipDeductionAmount > 0 ? (
            <View style={styles.finRow}>
              <Text style={[styles.finLabel, { color: Colors.warning.dark }]}>{t('invoices.skipDeduction')}</Text>
              <Text style={[styles.finValue, { color: Colors.warning.dark, fontWeight: '700' }]}>
                -{formatCurrency(invoice.skipDeductionAmount)}
              </Text>
            </View>
          ) : null}

          <View style={[styles.finRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>
              {isSupplierDoc ? t('invoices.netDebtSupplier') : t('invoices.totalAmount')}
            </Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(
                invoice.netPayableAmount !== undefined
                  ? invoice.netPayableAmount
                  : invoice.totalAmount - (invoice.skipDeductionAmount || 0)
              )}
            </Text>
          </View>
        </Card>

        {/* Quick Workflow Action Buttons */}
        <View style={styles.actionsContainer}>
          {invoice.status !== 'verified' && (
            <Button
              label={t('invoices.markVerified')}
              variant="primary"
              size="md"
              icon="Check"
              fullWidth
              onPress={() => handleUpdateStatus('verified')}
              style={{ marginBottom: Spacing.sm }}
            />
          )}

          {invoice.paymentStatus !== 'paid' && (
            <Button
              label={t('invoices.recordPayment', {
                amount: formatCurrency(
                  invoice.netPayableAmount !== undefined
                    ? invoice.netPayableAmount
                    : invoice.totalAmount - (invoice.skipDeductionAmount || 0)
                ),
              })}
              variant="secondary"
              size="md"
              icon="CreditCard"
              fullWidth
              onPress={handleSettlePayment}
              style={{ marginBottom: Spacing.sm }}
            />
          )}

          <Button
            label={t('invoices.backToList')}
            variant="outline"
            size="md"
            fullWidth
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>

      {/* Skip Deduction Modal */}
      <Modal
        visible={showSkipModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSkipModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Skip Control / Deduct Debt</Text>
              <Pressable onPress={() => setShowSkipModal(false)} hitSlop={12}>
                <VectorIcon name="X" size={20} color={Colors.neutral.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Deduct debt from this supplier delivery for rejected, damaged, or missing goods.
            </Text>

            <Text style={styles.inputLabel}>Deduction Amount (€)</Text>
            <TextInput
              style={styles.inputField}
              placeholder="e.g. 24.50"
              placeholderTextColor={Colors.neutral.textTertiary}
              keyboardType="decimal-pad"
              value={skipAmountInput}
              onChangeText={setSkipAmountInput}
            />

            <Text style={styles.inputLabel}>Reason for Deduction</Text>
            <TextInput
              style={[styles.inputField, styles.textAreaField]}
              placeholder="e.g. 1.5kg salmon damaged in transit or shortage"
              placeholderTextColor={Colors.neutral.textTertiary}
              multiline
              numberOfLines={3}
              value={skipReasonInput}
              onChangeText={setSkipReasonInput}
            />

            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="outline"
                onPress={() => setShowSkipModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                label={submittingSkip ? 'Applying...' : 'Apply Deduction'}
                variant="primary"
                onPress={handleApplySkip}
                disabled={submittingSkip}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Invoice Notes Modal */}
      <Modal
        visible={showNotesModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invoice Remarks & Notes</Text>
              <Pressable onPress={() => setShowNotesModal(false)} hitSlop={12}>
                <VectorIcon name="X" size={20} color={Colors.neutral.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Enter or update receiving notes, dock remarks, or driver comments for this invoice.
            </Text>

            <Text style={styles.inputLabel}>Remarks / Notes</Text>
            <TextInput
              style={[styles.inputField, styles.textAreaField]}
              placeholder="e.g. Delivered compliant (<+4°C), checked by receiving lead"
              placeholderTextColor={Colors.neutral.textTertiary}
              multiline
              numberOfLines={4}
              value={notesInput}
              onChangeText={setNotesInput}
            />

            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="outline"
                onPress={() => setShowNotesModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                label={submittingNotes ? 'Saving...' : 'Save Notes'}
                variant="primary"
                onPress={handleSaveNotes}
                disabled={submittingNotes}
                style={{ flex: 1 }}
              />
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    ...Typography.bodyLarge,
    color: Colors.critical.main,
    marginBottom: Spacing.md,
  },
  content: {
    padding: Spacing.md,
  },
  headerCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sourceTitle: {
    ...Typography.titleLarge,
    fontWeight: '800',
    color: Colors.neutral.textPrimary,
    marginBottom: Spacing.md,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  metaItem: {
    minWidth: '45%',
  },
  metaLabel: {
    ...Typography.labelSmall,
    color: Colors.neutral.textTertiary,
    marginBottom: 2,
  },
  metaValue: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  connectionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  connectionText: {
    ...Typography.labelSmall,
    color: Colors.brand.primary,
    fontWeight: '700',
  },
  notesBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#f8fafc',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  notesText: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    flex: 1,
  },
  sectionHeading: {
    ...Typography.titleMedium,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    marginBottom: Spacing.sm,
  },
  tableCard: {
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
  },
  itemInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  itemTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  itemSku: {
    ...Typography.labelSmall,
    color: Colors.neutral.textTertiary,
    marginTop: 1,
  },
  itemCalc: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  itemTotal: {
    ...Typography.titleMedium,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  financialCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  finRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  finLabel: {
    ...Typography.bodyMedium,
    color: Colors.neutral.textSecondary,
  },
  finValue: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  grandTotalLabel: {
    ...Typography.titleMedium,
    fontWeight: '800',
    color: Colors.neutral.textPrimary,
  },
  grandTotalValue: {
    ...Typography.titleLarge,
    fontWeight: '900',
    color: Colors.brand.primary,
  },
  actionsContainer: {
    marginTop: Spacing.sm,
  },
  subtotalDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
    paddingTop: Spacing.xs,
    marginTop: 4,
  },
  skipCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
  },
  skipHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  skipTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skipCardTitle: {
    ...Typography.bodyLarge,
    fontWeight: '800',
    color: '#92400e',
  },
  skipCardDesc: {
    ...Typography.bodySmall,
    color: '#78350f',
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  appliedSkipBox: {
    backgroundColor: '#fef3c7',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  appliedSkipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appliedSkipLabel: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: '#92400e',
  },
  appliedSkipAmount: {
    ...Typography.titleMedium,
    fontWeight: '900',
    color: Colors.critical.main,
  },
  appliedSkipReason: {
    ...Typography.bodySmall,
    color: '#92400e',
    marginTop: 2,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.neutral.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadows.elevated,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  modalTitle: {
    ...Typography.titleLarge,
    fontWeight: '800',
    color: Colors.neutral.textPrimary,
  },
  modalSubtitle: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.labelMedium,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    marginBottom: 4,
  },
  inputField: {
    backgroundColor: Colors.neutral.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    color: Colors.neutral.textPrimary,
    marginBottom: Spacing.md,
  },
  textAreaField: {
    height: 72,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  skipActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
  skipActionBtnText: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: '#92400e',
  },
  pressed: {
    opacity: 0.75,
  },
});

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { VectorIcon } from './icons';
import { Badge } from './badge';
import { useI18n } from '@/i18n';
import {
  DocumentRecognitionResult,
  applyDocumentAutoAssignment,
  AutoAssignmentExecutionResult,
} from '@/services/documentRecognitionService';

interface DocumentRecognitionModalProps {
  visible: boolean;
  recognition: DocumentRecognitionResult | null;
  onClose: () => void;
  onAssigned: (result: AutoAssignmentExecutionResult) => void;
}

const TARGET_OPTIONS = [
  { route: '/inventory/overview', labelKey: 'inventory', labelDe: 'Inventarverwaltung', icon: 'Package' },
  { route: '/invoices', labelKey: 'invoices', labelDe: 'Rechnungen & Wareneingang', icon: 'FileText' },
  { route: '/orders', labelKey: 'orders', labelDe: 'Bestellungen & Lieferscheine', icon: 'Truck' },
  { route: '/scan', labelKey: 'scan', labelDe: 'Kassenbon & Rezepturabbuchung', icon: 'ScanLine' },
  { route: '/expiration', labelKey: 'expiration', labelDe: 'MHD- & Verlustmanagement', icon: 'AlertTriangle' },
];

export function DocumentRecognitionModal({
  visible,
  recognition,
  onClose,
  onAssigned,
}: DocumentRecognitionModalProps) {
  const { language, formatCurrency } = useI18n();
  const isDe = language === 'de';

  const [applying, setApplying] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [showTargetPicker, setShowTargetPicker] = useState(false);

  if (!recognition) return null;

  const activeTarget = selectedTarget || recognition.targetRoute;
  const isPdf = recognition.format === 'pdf';
  const isXlsx = recognition.format === 'xlsx' || recognition.format === 'xls' || recognition.format === 'csv';

  const handleApply = async () => {
    setApplying(true);
    try {
      const result = await applyDocumentAutoAssignment(recognition, activeTarget);
      onAssigned(result);
    } finally {
      setApplying(false);
    }
  };

  const getFormatBadge = () => {
    if (isPdf) {
      return { label: 'PDF', bg: '#fee2e2', color: '#dc2626', icon: 'FileText' as const };
    }
    if (isXlsx) {
      return { label: 'Excel (XLSX)', bg: '#dcfce7', color: '#16a34a', icon: 'Table' as const };
    }
    return { label: 'Dokument', bg: '#e0f2fe', color: '#0284c7', icon: 'File' as const };
  };

  const badgeInfo = getFormatBadge();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.formatIconCircle, { backgroundColor: badgeInfo.bg }]}>
                <VectorIcon name={badgeInfo.icon} size={20} color={badgeInfo.color} strokeWidth={2.4} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {recognition.fileName}
                </Text>
                <Text style={styles.fileMeta}>
                  {badgeInfo.label} · {Math.round((recognition.fileSize || 120000) / 1024)} KB
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
                <VectorIcon name="X" size={20} color={Colors.neutral.textSecondary} />
              </Pressable>
            </View>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Automatic Recognition Banner */}
            <View style={styles.recognitionBanner}>
              <View style={styles.recognitionBannerTop}>
                <View style={styles.recognitionBadge}>
                  <VectorIcon name="CheckCircle2" size={16} color="#059669" strokeWidth={2.5} />
                  <Text style={styles.recognitionBadgeText}>
                    {isDe ? 'Automatisch erkannt' : 'Auto-Recognized'}
                  </Text>
                </View>
                <View style={styles.confidencePill}>
                  <Text style={styles.confidenceText}>
                    {Math.round(recognition.confidence * 100)} % {isDe ? 'Konfidenz' : 'confidence'}
                  </Text>
                </View>
              </View>

              <Text style={styles.categoryTitle}>{recognition.categoryLabel}</Text>
              <Text style={styles.categoryDescription}>{recognition.targetDescription}</Text>
            </View>

            {/* Extracted Details Card */}
            <View style={styles.detailsCard}>
              <Text style={styles.sectionSubtitle}>
                {isDe ? 'Extrahierte Belegdaten' : 'Extracted Document Data'}
              </Text>

              {recognition.partnerName && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{isDe ? 'Partner / Lieferant' : 'Partner / Supplier'}:</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>{recognition.partnerName}</Text>
                </View>
              )}

              {recognition.documentNumber && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{isDe ? 'Belegnummer' : 'Doc Number'}:</Text>
                  <Text style={styles.detailValueHighlight}>{recognition.documentNumber}</Text>
                </View>
              )}

              {recognition.receivingTemp && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{isDe ? 'Waren-Temperatur' : 'Receiving Temp'}:</Text>
                  <Text style={[styles.detailValue, { color: '#0284c7' }]}>{recognition.receivingTemp}</Text>
                </View>
              )}

              {recognition.totalGross !== undefined && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{isDe ? 'Gesamtbetrag (Brutto)' : 'Total Gross'}:</Text>
                  <Text style={styles.detailValueBold}>{formatCurrency(recognition.totalGross)}</Text>
                </View>
              )}

              {recognition.skipDebtDeduction !== undefined && recognition.skipDebtDeduction > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{isDe ? 'Leergut-Abzug (Skip)' : 'Skip Deduction'}:</Text>
                  <Text style={[styles.detailValue, { color: '#059669', fontWeight: '700' }]}>
                    - {formatCurrency(recognition.skipDebtDeduction)}
                  </Text>
                </View>
              )}

              {recognition.detectedUpperGroups && recognition.detectedUpperGroups.length > 0 && (
                <View style={{ marginTop: Spacing.xs }}>
                  <Text style={styles.detailLabel}>{isDe ? 'Erkannte Warengruppen' : 'Detected Groups'}:</Text>
                  <View style={styles.groupChipsRow}>
                    {recognition.detectedUpperGroups.map((grp) => (
                      <View key={grp} style={styles.groupChip}>
                        <Text style={styles.groupChipText}>{grp}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Line Items Preview */}
            <View style={styles.itemsSection}>
              <View style={styles.itemsSectionHeader}>
                <Text style={styles.sectionSubtitle}>
                  {isDe ? `Positionen (${recognition.itemsCount})` : `Items (${recognition.itemsCount})`}
                </Text>
              </View>

              <View style={styles.itemsList}>
                {recognition.previewItems.map((item, idx) => (
                  <View
                    key={item.id}
                    style={[
                      styles.itemRow,
                      idx < recognition.previewItems.length - 1 && styles.itemBorder,
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.itemSub}>
                        {item.sku ? `${item.sku} · ` : ''}{item.category || ''}
                      </Text>
                    </View>
                    <View style={styles.itemQtyCol}>
                      <Text style={styles.itemQty}>
                        {item.quantity} {item.unit}
                      </Text>
                      {item.unitPrice !== undefined && (
                        <Text style={styles.itemPrice}>{formatCurrency(item.unitPrice)} / {item.unit}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Target Destination Selector */}
            <View style={styles.destinationBox}>
              <View style={styles.destinationHeader}>
                <View style={styles.destIconBox}>
                  <VectorIcon name="CornerDownRight" size={16} color={Colors.brand.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.destLabel}>
                    {isDe ? 'Wird automatisch zugewiesen an:' : 'Auto-Assigning to:'}
                  </Text>
                  <Text style={styles.destCurrentName}>
                    {TARGET_OPTIONS.find((t) => t.route === activeTarget)?.labelDe || recognition.targetBadgeLabel}
                  </Text>
                </View>

                <Pressable
                  onPress={() => setShowTargetPicker(!showTargetPicker)}
                  style={styles.changeTargetBtn}
                >
                  <Text style={styles.changeTargetText}>
                    {isDe ? 'Ziel ändern' : 'Change target'}
                  </Text>
                  <VectorIcon
                    name={showTargetPicker ? 'ChevronUp' : 'ChevronDown'}
                    size={14}
                    color={Colors.brand.primary}
                  />
                </Pressable>
              </View>

              {showTargetPicker && (
                <View style={styles.targetPickerList}>
                  {TARGET_OPTIONS.map((opt) => {
                    const isSelected = activeTarget === opt.route;
                    return (
                      <Pressable
                        key={opt.route}
                        onPress={() => {
                          setSelectedTarget(opt.route);
                          setShowTargetPicker(false);
                        }}
                        style={[
                          styles.targetOptionRow,
                          isSelected && styles.targetOptionSelected,
                        ]}
                      >
                        <VectorIcon
                          name={opt.icon as any}
                          size={16}
                          color={isSelected ? Colors.brand.primary : Colors.neutral.textSecondary}
                        />
                        <Text
                          style={[
                            styles.targetOptionText,
                            isSelected && styles.targetOptionTextSelected,
                          ]}
                        >
                          {opt.labelDe}
                        </Text>
                        {isSelected && (
                          <VectorIcon name="Check" size={16} color={Colors.brand.primary} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Pressable
              onPress={handleApply}
              disabled={applying}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.pressed,
                applying && styles.btnDisabled,
              ]}
            >
              {applying ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>
                    {isDe ? 'Automatisch zuweisen & öffnen' : 'Auto-Assign & Open'}
                  </Text>
                  <VectorIcon name="ArrowRight" size={18} color="#FFFFFF" strokeWidth={2.4} />
                </>
              )}
            </Pressable>

            <Pressable onPress={onClose} disabled={applying} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>{isDe ? 'Abbrechen' : 'Cancel'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '90%',
    paddingBottom: Spacing.xl,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  formatIconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  fileMeta: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  recognitionBanner: {
    backgroundColor: '#f0fdf4',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: Spacing.md,
  },
  recognitionBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  recognitionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recognitionBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  confidencePill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#064e3b',
    marginTop: 2,
  },
  categoryDescription: {
    fontSize: 13,
    color: '#166534',
    marginTop: 4,
    lineHeight: 18,
  },
  detailsCard: {
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  detailValueHighlight: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  detailValueBold: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.neutral.textPrimary,
  },
  groupChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  groupChip: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  groupChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  itemsSection: {
    marginBottom: Spacing.md,
  },
  itemsSectionHeader: {
    marginBottom: Spacing.xs,
  },
  itemsList: {
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  itemSub: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
    marginTop: 1,
  },
  itemQtyCol: {
    alignItems: 'flex-end',
  },
  itemQty: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  itemPrice: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
  },
  destinationBox: {
    backgroundColor: '#f8fafc',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: Spacing.lg,
  },
  destinationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  destIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destLabel: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
    fontWeight: '500',
  },
  destCurrentName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.brand.primary,
  },
  changeTargetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  changeTargetText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.brand.primary,
  },
  targetPickerList: {
    marginTop: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    overflow: 'hidden',
  },
  targetOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  targetOptionSelected: {
    backgroundColor: '#f0fdf4',
  },
  targetOptionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.neutral.textPrimary,
  },
  targetOptionTextSelected: {
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  primaryBtn: {
    backgroundColor: Colors.brand.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  pressed: {
    opacity: 0.85,
  },
});

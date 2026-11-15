import { Button } from '@/components/ui/button';
import { VectorIcon } from '@/components/ui/icons';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { OcrDocumentType } from '@/types/ocr';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  pickAndRecognizeDocument,
  DocumentRecognitionResult,
} from '@/services/documentRecognitionService';
import { DocumentRecognitionModal } from '@/components/ui/document-recognition-modal';

export interface DocumentTypePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectType?: (type: OcrDocumentType) => void;
  title?: string;
  subtitle?: string;
}

export function DocumentTypePickerModal({
  visible,
  onClose,
  onSelectType,
  title = 'Select Document Type',
  subtitle = 'Choose whether you are processing a supplier delivery invoice or a sales order form receipt',
}: DocumentTypePickerModalProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [selectedType, setSelectedType] = useState<OcrDocumentType>('goods_receipt');
  const [recognitionResult, setRecognitionResult] = useState<DocumentRecognitionResult | null>(null);

  const handlePickDocument = async () => {
    try {
      const result = await pickAndRecognizeDocument();
      if (result) {
        onClose();
        setRecognitionResult(result);
      }
    } catch (err: any) {
      Alert.alert('Fehler', 'Dokument konnte nicht geöffnet werden');
    }
  };

  const handleStartScan = (mode: 'camera' | 'gallery') => {
    onClose();
    if (onSelectType) {
      onSelectType(selectedType);
    }

    if (mode === 'camera') {
      router.push({
        pathname: '/(tabs)/scan',
        params: { initialType: selectedType },
      } as any);
    } else {
      // Pick directly from gallery
      ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      }).then((result) => {
        if (!result.canceled && result.assets && result.assets.length > 0) {
          router.push({
            pathname: '/scan/processing',
            params: {
              imageUri: result.assets[0].uri,
              documentType: selectedType,
            },
          } as any);
        }
      }).catch(() => {
        Alert.alert('Error', 'Unable to open photo gallery');
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.dragHandle} />
            <View style={styles.titleRow}>
              <Text style={styles.title}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
                <VectorIcon name="X" size={18} color={Colors.neutral.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {/* Document Type Options */}
          <View style={styles.optionsContainer}>
            {/* Option 1: Delivery Invoice from Supplier */}
            <Pressable
              onPress={() => setSelectedType('goods_receipt')}
              style={[
                styles.optionCard,
                selectedType === 'goods_receipt' && styles.optionCardSelected,
              ]}
            >
              <View style={styles.optionHeader}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor:
                        selectedType === 'goods_receipt' ? '#dcfce7' : '#f1f5f9',
                    },
                  ]}
                >
                  <VectorIcon
                    name="Truck"
                    size={22}
                    color={
                      selectedType === 'goods_receipt'
                        ? Colors.brand.primary
                        : '#475569'
                    }
                  />
                </View>
                <View style={styles.optionTextContainer}>
                  <View style={styles.labelBadgeRow}>
                    <Text style={styles.optionLabel}>
                      Delivery invoice from supplier
                    </Text>
                    <View style={styles.impactBadgeGreen}>
                      <Text style={styles.impactBadgeGreenText}>+ Restocks</Text>
                    </View>
                  </View>
                  <Text style={styles.optionSub}>
                    Inbound goods receipt, supplier item prices, pack quantities, and Best-Before Dates (BBD).
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    selectedType === 'goods_receipt' && styles.radioCircleSelected,
                  ]}
                >
                  {selectedType === 'goods_receipt' && <View style={styles.radioDot} />}
                </View>
              </View>
            </Pressable>

            {/* Option 2: Order Form Receipt */}
            <Pressable
              onPress={() => setSelectedType('order_invoice')}
              style={[
                styles.optionCard,
                selectedType === 'order_invoice' && styles.optionCardSelected,
              ]}
            >
              <View style={styles.optionHeader}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor:
                        selectedType === 'order_invoice' ? '#ede9fe' : '#f1f5f9',
                    },
                  ]}
                >
                  <VectorIcon
                    name="FileText"
                    size={22}
                    color={
                      selectedType === 'order_invoice' ? '#6d28d9' : '#475569'
                    }
                  />
                </View>
                <View style={styles.optionTextContainer}>
                  <View style={styles.labelBadgeRow}>
                    <Text style={styles.optionLabel}>Order form receipt</Text>
                    <View style={styles.impactBadgeAmber}>
                      <Text style={styles.impactBadgeAmberText}>− Deducts BOM</Text>
                    </View>
                  </View>
                  <Text style={styles.optionSub}>
                    POS register Z-report or order sales receipt. Explodes recipe BOM to deduct raw materials.
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    selectedType === 'order_invoice' && styles.radioCircleSelected,
                  ]}
                >
                  {selectedType === 'order_invoice' && <View style={styles.radioDot} />}
                </View>
              </View>
            </Pressable>
          </View>

          {/* Option 3: PDF / Excel (XLSX) Auto-Recognition Import */}
          <Pressable
            onPress={handlePickDocument}
            style={({ pressed }) => [
              styles.documentImportBtn,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.documentImportIconCircle}>
              <VectorIcon name="FileSpreadsheet" size={20} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.docImportTitleRow}>
                <Text style={styles.documentImportTitle}>PDF / Excel (XLSX) importieren</Text>
                <View style={styles.autoBadge}>
                  <Text style={styles.autoBadgeText}>Auto-Erkennung</Text>
                </View>
              </View>
              <Text style={styles.documentImportSub}>
                Rechnungen, Lieferscheine oder Artikelkataloge automatisch erkennen & zuweisen
              </Text>
            </View>
            <VectorIcon name="ChevronRight" size={16} color={Colors.neutral.textSecondary} />
          </Pressable>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Button
              label="Galerie"
              variant="outline"
              size="md"
              icon="Image"
              onPress={() => handleStartScan('gallery')}
              style={{ flex: 1, marginRight: Spacing.sm }}
            />
            <Button
              label="Kamera"
              variant="primary"
              size="md"
              icon="Camera"
              onPress={() => handleStartScan('camera')}
              style={{ flex: 1.2 }}
            />
          </View>
        </Pressable>
      </Pressable>

      {/* Auto-Recognition Modal */}
      {recognitionResult && (
        <DocumentRecognitionModal
          visible={Boolean(recognitionResult)}
          recognition={recognitionResult}
          onClose={() => setRecognitionResult(null)}
          onAssigned={(res) => {
            setRecognitionResult(null);
            Alert.alert(
              res.success ? 'Erfolgreich zugewiesen' : 'Hinweis',
              res.message,
              [
                {
                  text: 'Öffnen',
                  onPress: () => router.push(res.targetRoute as any),
                },
              ]
            );
          }}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    ...Shadows.lg,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.neutral.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    ...Typography.titleMedium,
    color: Colors.neutral.textPrimary,
    fontWeight: '700',
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    lineHeight: 18,
  },
  optionsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  optionCard: {
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.neutral.border,
    padding: Spacing.md,
    backgroundColor: '#ffffff',
  },
  optionCardSelected: {
    borderColor: Colors.brand.primary,
    backgroundColor: '#f0fdf4',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionTextContainer: {
    flex: 1,
  },
  labelBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: 3,
  },
  optionLabel: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  impactBadgeGreen: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  impactBadgeGreenText: {
    ...Typography.labelSmall,
    color: '#15803d',
    fontWeight: '700',
    fontSize: 10,
  },
  impactBadgeAmber: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  impactBadgeAmberText: {
    ...Typography.labelSmall,
    color: '#b45309',
    fontWeight: '700',
    fontSize: 10,
  },
  optionSub: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioCircleSelected: {
    borderColor: Colors.brand.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.brand.primary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentImportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  documentImportIconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docImportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  documentImportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#064e3b',
  },
  autoBadge: {
    backgroundColor: '#bbf7d0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  autoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803d',
  },
  documentImportSub: {
    fontSize: 11,
    color: '#166534',
    marginTop: 2,
    lineHeight: 15,
  },
  pressed: {
    opacity: 0.85,
  },
});

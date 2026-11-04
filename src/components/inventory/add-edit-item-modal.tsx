import { Button } from '@/components/ui/button';
import { DesktopAccessNotice } from '@/components/ui/desktop-access-notice';
import { VectorIcon } from '@/components/ui/icons';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { inventoryService } from '@/services/inventoryService';
import { UpperGroup, upperGroupService } from '@/services/upperGroupService';
import { InventoryItem } from '@/types/inventory';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
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

const UNITS = ['kg', 'g', 'L', 'ml', 'pcs', 'bottle', 'can', 'pack'] as const;

interface AddEditInventoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (item: InventoryItem) => void;
  initialItem?: InventoryItem | null;
}

export function AddEditInventoryModal({
  visible,
  onClose,
  onSuccess,
  initialItem,
}: AddEditInventoryModalProps) {
  const insets = useSafeAreaInsets();
  const { t, language } = useI18n();
  const isEdit = !!initialItem;

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState<string>('kg');
  const [targetStock, setTargetStock] = useState('20');
  const [safetyStock, setSafetyStock] = useState('5');
  const [costPerUnit, setCostPerUnit] = useState('2.50');
  const [storageArea, setStorageArea] = useState('');
  const [shelfLifeDays, setShelfLifeDays] = useState('14');
  const [barcode, setBarcode] = useState('');
  const [initialStock, setInitialStock] = useState('10');

  // Upper Groups (Obergruppen) state
  const [upperGroups, setUpperGroups] = useState<UpperGroup[]>([]);
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState<'food' | 'drinks'>('drinks');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    upperGroupService.getAllGroups().then((groups) => {
      if (!mounted) return;
      setUpperGroups(groups);
      if (initialItem?.category) {
        setCategory(initialItem.category);
      } else if (groups.length > 0 && !category) {
        const firstLabel = upperGroupService.getGroupLabel(groups[0], language);
        setCategory(firstLabel);
      }
    });
    const unsubscribe = upperGroupService.subscribe(() => {
      upperGroupService.getAllGroups().then((groups) => {
        if (mounted) setUpperGroups(groups);
      });
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [visible, initialItem, language]);

  useEffect(() => {
    if (initialItem) {
      setSku(initialItem.sku || '');
      setName(initialItem.name || '');
      setCategory(initialItem.category || '');
      setUnit(initialItem.unit || 'kg');
      setTargetStock(String(initialItem.targetStock ?? 20));
      setSafetyStock(String(initialItem.safetyStock ?? 5));
      setCostPerUnit(String(initialItem.costPerUnit ?? 2.5));
      setStorageArea(initialItem.storageArea || '');
      setShelfLifeDays(String(initialItem.shelfLifeDays ?? 14));
      setBarcode(initialItem.barcode || '');
      setInitialStock(String(initialItem.physicalStock ?? 0));
    } else {
      setSku(`ART-${Math.floor(1000 + Math.random() * 9000)}`);
      setName('');
      setUnit('bottle');
      setTargetStock('24');
      setSafetyStock('6');
      setCostPerUnit('1.50');
      setStorageArea('');
      setShelfLifeDays('30');
      setBarcode('');
      setInitialStock('12');
    }
    setShowNewGroupForm(false);
    setNewGroupName('');
    setErrorMessage(null);
  }, [initialItem, visible]);

  const handleCreateCustomUpperGroup = async () => {
    const trimmed = newGroupName.trim();
    if (!trimmed) return;
    const created = await upperGroupService.addCustomGroup(
      trimmed,
      newGroupType,
      newGroupType === 'drinks' ? 'Coffee' : 'Box'
    );
    const label = upperGroupService.getGroupLabel(created, language);
    setCategory(label);
    setNewGroupName('');
    setShowNewGroupForm(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMessage(t('itemModal.validationNameRequired') || t('inventory.fillRequired'));
      return;
    }
    if (!sku.trim()) {
      setErrorMessage(t('inventory.fillRequired'));
      return;
    }

    const targetNum = parseFloat(targetStock) || 0;
    const safetyNum = parseFloat(safetyStock) || 0;
    const costNum = parseFloat(costPerUnit) || 0;
    const shelfNum = parseInt(shelfLifeDays, 10) || 14;
    const selectedCategory =
      category.trim() ||
      (upperGroups[0] ? upperGroupService.getGroupLabel(upperGroups[0], language) : 'General');

    try {
      setSubmitting(true);
      setErrorMessage(null);

      if (isEdit && initialItem) {
        const payload: Partial<InventoryItem> = {
          name: name.trim(),
          category: selectedCategory,
          unit: unit as any,
          targetStock: targetNum,
          safetyStock: safetyNum,
          costPerUnit: costNum,
          storageArea: storageArea.trim() || undefined,
          shelfLifeDays: shelfNum,
          barcode: barcode.trim() || undefined,
        };

        const updated = await inventoryService.updateItem(initialItem.id, payload);
        onSuccess(updated);
        onClose();
      } else {
        const payload: Partial<InventoryItem> = {
          sku: sku.trim().toUpperCase(),
          name: name.trim(),
          category: selectedCategory,
          unit: unit as any,
          targetStock: targetNum,
          safetyStock: safetyNum,
          costPerUnit: costNum,
          storageArea: storageArea.trim() || undefined,
          shelfLifeDays: shelfNum,
          barcode: barcode.trim() || undefined,
          physicalStock: parseFloat(initialStock) || 0,
        };

        const created = await inventoryService.createItem(payload);
        onSuccess(created);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || t('errors.serverError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleCol}>
              <Text style={styles.title}>
                {isEdit ? t('itemModal.editTitle') : t('itemModal.addTitle')}
              </Text>
              <Text style={styles.subtitle}>
                {isEdit ? t('itemModal.editSubtitle') : t('itemModal.addSubtitle')}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <VectorIcon name="X" size={20} color={Colors.neutral.textSecondary} />
            </Pressable>
          </View>

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBox}>
              <VectorIcon name="AlertCircle" size={16} color={Colors.critical.main} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Form Scroll */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Desktop / PC Access Notice */}
            <DesktopAccessNotice compact />

            {/* Upper Group (Obergruppe / Kategorie) Selector */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelWithActionRow}>
                <Text style={styles.label}>{t('itemModal.upperGroupLabel')}</Text>
                <Pressable
                  onPress={() => setShowNewGroupForm((prev) => !prev)}
                  style={styles.addGroupInlineBtn}
                >
                  <VectorIcon
                    name={showNewGroupForm ? 'X' : 'Plus'}
                    size={13}
                    color={Colors.brand.primary}
                  />
                  <Text style={styles.addGroupInlineText}>
                    {t('upperGroups.createNew').replace(/^\+\s*/, '')}
                  </Text>
                </Pressable>
              </View>

              {/* Inline Create Custom Upper Group Form */}
              {showNewGroupForm && (
                <View style={styles.newGroupCard}>
                  <Text style={styles.newGroupCardTitle}>{t('upperGroups.modalTitle')}</Text>
                  <Text style={styles.newGroupCardSub}>{t('upperGroups.modalSubtitle')}</Text>

                  <View style={styles.typeToggleRow}>
                    <Pressable
                      onPress={() => {
                        setNewGroupType('drinks');
                        setUnit('bottle');
                      }}
                      style={[
                        styles.typeToggleChip,
                        newGroupType === 'drinks' && styles.typeToggleChipActive,
                      ]}
                    >
                      <VectorIcon
                        name="Coffee"
                        size={14}
                        color={
                          newGroupType === 'drinks'
                            ? Colors.brand.dark
                            : Colors.neutral.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.typeToggleText,
                          newGroupType === 'drinks' && styles.typeToggleTextActive,
                        ]}
                      >
                        {t('upperGroups.typeDrinks')}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setNewGroupType('food');
                        setUnit('kg');
                      }}
                      style={[
                        styles.typeToggleChip,
                        newGroupType === 'food' && styles.typeToggleChipActive,
                      ]}
                    >
                      <VectorIcon
                        name="Box"
                        size={14}
                        color={
                          newGroupType === 'food'
                            ? Colors.brand.dark
                            : Colors.neutral.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.typeToggleText,
                          newGroupType === 'food' && styles.typeToggleTextActive,
                        ]}
                      >
                        {t('upperGroups.typeFood')}
                      </Text>
                    </Pressable>
                  </View>

                  <View style={styles.newGroupInputRow}>
                    <TextInput
                      value={newGroupName}
                      onChangeText={setNewGroupName}
                      placeholder={t('itemModal.newGroupInputPlaceholder')}
                      placeholderTextColor={Colors.neutral.textTertiary}
                      style={[styles.input, { flex: 1 }]}
                    />
                    <Pressable
                      onPress={handleCreateCustomUpperGroup}
                      style={styles.createGroupConfirmBtn}
                    >
                      <Text style={styles.createGroupConfirmText}>
                        {t('itemModal.createGroupBtn')}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.unitChipsRow}
              >
                {upperGroups.map((group) => {
                  const groupLabel = upperGroupService.getGroupLabel(group, language);
                  const active =
                    category === groupLabel ||
                    upperGroupService.matchesGroup(category, group.id);
                  const isDrinkGroup = group.type === 'drinks';

                  return (
                    <Pressable
                      key={group.id}
                      onPress={() => {
                        setCategory(groupLabel);
                        if (isDrinkGroup && !isEdit && (unit === 'kg' || unit === 'g')) {
                          setUnit('bottle');
                        }
                      }}
                      style={[styles.unitChip, active && styles.unitChipActive]}
                    >
                      <View style={styles.groupChipInner}>
                        <VectorIcon
                          name={isDrinkGroup ? 'Coffee' : 'Box'}
                          size={13}
                          color={active ? Colors.brand.dark : Colors.neutral.textSecondary}
                        />
                        <Text style={[styles.unitChipText, active && styles.unitChipTextActive]}>
                          {groupLabel}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* SKU & Name Row */}
            <View style={styles.formRow}>
              <View style={[styles.formCol, { flex: 1 }]}>
                <Text style={styles.label}>{t('inventory.skuCode')} *</Text>
                <TextInput
                  value={sku}
                  onChangeText={setSku}
                  placeholder="z. B. DRK-001"
                  placeholderTextColor={Colors.neutral.textTertiary}
                  editable={!isEdit}
                  autoCapitalize="characters"
                  style={[styles.input, isEdit && styles.inputDisabled]}
                />
              </View>

              <View style={[styles.formCol, { flex: 2 }]}>
                <Text style={styles.label}>{t('itemModal.nameLabel')}</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t('itemModal.namePlaceholder')}
                  placeholderTextColor={Colors.neutral.textTertiary}
                  style={styles.input}
                />
              </View>
            </View>

            {/* Unit Selector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('inventory.unitSelect')} *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.unitChipsRow}
              >
                {UNITS.map((u) => {
                  const active = unit === u;
                  return (
                    <Pressable
                      key={u}
                      onPress={() => setUnit(u)}
                      style={[styles.unitChip, active && styles.unitChipActive]}
                    >
                      <Text style={[styles.unitChipText, active && styles.unitChipTextActive]}>
                        {u}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Par Level & Safety Stock */}
            <View style={styles.formRow}>
              <View style={[styles.formCol, { flex: 1 }]}>
                <Text style={styles.label}>{t('inventory.targetStock')}</Text>
                <TextInput
                  value={targetStock}
                  onChangeText={setTargetStock}
                  keyboardType="numeric"
                  placeholder="20"
                  placeholderTextColor={Colors.neutral.textTertiary}
                  style={styles.input}
                />
              </View>

              <View style={[styles.formCol, { flex: 1 }]}>
                <Text style={styles.label}>{t('inventory.safetyStock')}</Text>
                <TextInput
                  value={safetyStock}
                  onChangeText={setSafetyStock}
                  keyboardType="numeric"
                  placeholder="5"
                  placeholderTextColor={Colors.neutral.textTertiary}
                  style={styles.input}
                />
              </View>
            </View>

            {/* Cost & Initial Stock */}
            <View style={styles.formRow}>
              <View style={[styles.formCol, { flex: 1 }]}>
                <Text style={styles.label}>{t('inventory.costPerUnit')} (€)</Text>
                <TextInput
                  value={costPerUnit}
                  onChangeText={setCostPerUnit}
                  keyboardType="decimal-pad"
                  placeholder="2.50"
                  placeholderTextColor={Colors.neutral.textTertiary}
                  style={styles.input}
                />
              </View>

              {!isEdit && (
                <View style={[styles.formCol, { flex: 1 }]}>
                  <Text style={styles.label}>{t('inventory.initialStock')}</Text>
                  <TextInput
                    value={initialStock}
                    onChangeText={setInitialStock}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor={Colors.neutral.textTertiary}
                    style={styles.input}
                  />
                </View>
              )}
            </View>

            {/* Storage Area & Shelf Life */}
            <View style={styles.formRow}>
              <View style={[styles.formCol, { flex: 1 }]}>
                <Text style={styles.label}>{t('inventory.storageArea')}</Text>
                <TextInput
                  value={storageArea}
                  onChangeText={setStorageArea}
                  placeholder={t('itemModal.zoneLabel')}
                  placeholderTextColor={Colors.neutral.textTertiary}
                  style={styles.input}
                />
              </View>

              <View style={[styles.formCol, { flex: 1 }]}>
                <Text style={styles.label}>{t('itemModal.bbdSection')}</Text>
                <TextInput
                  value={shelfLifeDays}
                  onChangeText={setShelfLifeDays}
                  keyboardType="numeric"
                  placeholder="14"
                  placeholderTextColor={Colors.neutral.textTertiary}
                  style={styles.input}
                />
              </View>
            </View>

            {/* Barcode */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Barcode / EAN</Text>
              <TextInput
                value={barcode}
                onChangeText={setBarcode}
                placeholder="z. B. 8935001234567"
                placeholderTextColor={Colors.neutral.textTertiary}
                style={styles.input}
              />
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <Button
              label={t('common.cancel')}
              variant="outline"
              size="md"
              disabled={submitting}
              onPress={onClose}
              style={{ flex: 1 }}
            />
            <Button
              label={
                submitting
                  ? t('inventory.savingItem')
                  : isEdit
                  ? t('itemModal.saveChanges')
                  : t('itemModal.createItem')
              }
              variant="primary"
              size="md"
              loading={submitting}
              disabled={submitting}
              onPress={handleSave}
              style={{ flex: 2 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.neutral.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '92%',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    ...Shadows.modal,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  headerTitleCol: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral.borderLight,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.critical.subtle,
    borderColor: Colors.critical.light,
    borderWidth: 1,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  errorText: {
    fontSize: 13,
    color: Colors.critical.dark,
    flex: 1,
  },
  scrollContent: {
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  formCol: {
    gap: Spacing.xxs,
  },
  fieldGroup: {
    gap: Spacing.xs,
  },
  labelWithActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addGroupInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.subtle,
    borderWidth: 1,
    borderColor: Colors.brand.light,
  },
  addGroupInlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  newGroupCard: {
    backgroundColor: Colors.neutral.card,
    borderWidth: 1,
    borderColor: Colors.brand.light,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  newGroupCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  newGroupCardSub: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 2,
  },
  typeToggleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    backgroundColor: Colors.neutral.surface,
  },
  typeToggleChipActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.subtle,
  },
  typeToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  typeToggleTextActive: {
    color: Colors.brand.dark,
    fontWeight: '700',
  },
  newGroupInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  createGroupConfirmBtn: {
    height: 44,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createGroupConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  input: {
    height: 44,
    backgroundColor: Colors.neutral.card,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.neutral.textPrimary,
  },
  inputDisabled: {
    backgroundColor: Colors.neutral.borderLight,
    color: Colors.neutral.textSecondary,
  },
  unitChipsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingVertical: Spacing.xxs,
  },
  unitChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    backgroundColor: Colors.neutral.card,
  },
  unitChipActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.subtle,
  },
  groupChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unitChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  unitChipTextActive: {
    color: Colors.brand.dark,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.borderLight,
  },
});

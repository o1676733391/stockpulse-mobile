import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { SectionHeader } from '@/components/ui/section-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import {
  INITIAL_AVAILABLE_STORES,
  INITIAL_STORE_SETTINGS,
  settingsService,
} from '@/services/settingsService';
import { StoreOption, StoreSettings } from '@/types/settings';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function StoreSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t, metadata } = useI18n();

  const [store, setStore] = useState<StoreSettings>(() =>
    JSON.parse(JSON.stringify(INITIAL_STORE_SETTINGS))
  );
  const [stores] = useState<StoreOption[]>(() =>
    JSON.parse(JSON.stringify(INITIAL_AVAILABLE_STORES))
  );

  const [bbdDays, setBbdDays] = useState(store.bbdAlertDays);
  const [countFreq, setCountFreq] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [units, setUnits] = useState<'Metric' | 'Imperial'>('Metric');
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSwitchStore = async (storeId: string) => {
    const updated = await settingsService.switchStore(storeId);
    setStore(updated);
    setShowStoreModal(false);
  };

  const handleSave = async () => {
    const updated = await settingsService.updateStoreSettings({
      bbdAlertDays: bbdDays,
      countSchedule: countFreq.toLowerCase() as any,
      defaultUnits: units.toLowerCase() as any,
    });
    setStore(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar title={t('settings.items.storeConfig')} showBack />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Active Store Switcher Card ── */}
        <Card style={styles.storeHeroCard}>
          <View style={styles.storeTopRow}>
            <View style={styles.storeIconBox}>
              <VectorIcon name="Store" size={22} color={Colors.brand.primary} />
            </View>

            <View style={styles.storeHeroInfo}>
              <Text style={styles.storeHeroTitle}>{store.name}</Text>
              <Text style={styles.storeHeroAddress}>{store.address}</Text>
            </View>
          </View>

          <Pressable
            onPress={() => setShowStoreModal(true)}
            style={({ pressed }) => [styles.switchStoreBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="ArrowRightLeft" size={14} color={Colors.brand.dark} />
            <Text style={styles.switchStoreBtnText}>Switch Active Location</Text>
          </Pressable>
        </Card>

        {/* ── Localization & Regional Card ── */}
        <Card style={styles.formCard}>
          <SectionHeader title={t('settings.language.title')} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Operating Currency</Text>
            <Text style={styles.fieldVal}>{store.currency} ({store.currencySymbol})</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{t('settings.items.language')}</Text>
            <Text style={styles.fieldVal}>{metadata.flag} {metadata.nativeName}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Time Zone</Text>
            <Text style={styles.fieldVal}>{store.timezone}</Text>
          </View>
        </Card>

        {/* ── Inventory Operational Rules Card ── */}
        <Card style={styles.formCard}>
          <SectionHeader title={t('settings.groups.storeOperations')} />

          {/* Count Audit Schedule */}
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>{t('navigation.stockCount')}</Text>
            <SegmentedControl
              options={['Daily', 'Weekly', 'Monthly']}
              value={countFreq}
              onChange={(val) => setCountFreq(val as any)}
            />
          </View>

          {/* Units System */}
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>{t('common.unit')}</Text>
            <SegmentedControl
              options={['Metric', 'Imperial']}
              value={units}
              onChange={(val) => setUnits(val as any)}
            />
          </View>

          {/* BBD Alert Threshold Stepper */}
          <View style={styles.bbdThresholdBox}>
            <View style={styles.bbdTextCol}>
              <Text style={styles.bbdTitle}>{t('settings.items.bbdRules')}</Text>
              <Text style={styles.bbdSub}>
                {t('inventory.shelfLife', { days: bbdDays })}
              </Text>
            </View>

            <View style={styles.stepperBox}>
              <Pressable
                onPress={() => setBbdDays((d) => Math.max(1, d - 1))}
                style={({ pressed }) => [styles.stepperBtn, pressed && styles.pressed]}
              >
                <VectorIcon name="Minus" size={14} color={Colors.neutral.textPrimary} />
              </Pressable>

              <Text style={styles.stepperText}>{bbdDays}d</Text>

              <Pressable
                onPress={() => setBbdDays((d) => Math.min(30, d + 1))}
                style={({ pressed }) => [styles.stepperBtn, pressed && styles.pressed]}
              >
                <VectorIcon name="Plus" size={14} color={Colors.neutral.textPrimary} />
              </Pressable>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* ── Fixed Bottom Save Bar ── */}
      <View
        style={[
          styles.fixedBottom,
          {
            paddingBottom: insets.bottom > 0 ? insets.bottom + Spacing.xs : Spacing.md,
          },
        ]}
      >
        {savedSuccess && (
          <View style={styles.savedBanner}>
            <VectorIcon name="Check" size={14} color={Colors.brand.dark} />
            <Text style={styles.savedBannerText}>{t('common.changesSaved')}</Text>
          </View>
        )}

        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
        >
          <Text style={styles.saveBtnText}>{t('common.save')}</Text>
        </Pressable>
      </View>

      {/* ── Switch Location Modal ── */}
      <Modal
        visible={showStoreModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStoreModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalGrabber} />

            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Active Location</Text>
              <Pressable
                onPress={() => setShowStoreModal(false)}
                style={styles.closeBtn}
              >
                <VectorIcon name="X" size={18} color={Colors.neutral.textTertiary} />
              </Pressable>
            </View>

            <View style={styles.storesList}>
              {stores.map((s) => {
                const isActive = s.id === store.id;

                return (
                  <Pressable
                    key={s.id}
                    onPress={() => handleSwitchStore(s.id)}
                    style={[
                      styles.storeOptionCard,
                      isActive && styles.storeOptionCardActive,
                    ]}
                  >
                    <View style={styles.storeOptionInfo}>
                      <Text style={styles.storeOptionName}>{s.name}</Text>
                      <Text style={styles.storeOptionAddress}>{s.address}</Text>
                    </View>

                    {isActive ? (
                      <Badge variant="green">{t('common.active')}</Badge>
                    ) : (
                      <VectorIcon name="ChevronRight" size={16} color={Colors.neutral.textTertiary} />
                    )}
                  </Pressable>
                );
              })}
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
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  storeHeroCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  storeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  storeIconBox: {
    width: 46,
    height: 46,
    borderRadius: Radius.xl,
    backgroundColor: Colors.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeHeroInfo: {
    flex: 1,
    gap: 2,
  },
  storeHeroTitle: {
    ...Typography.cardTitle,
    fontSize: 16,
  },
  storeHeroAddress: {
    fontSize: 12,
    color: Colors.neutral.textTertiary,
  },
  switchStoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.brand.subtle,
    borderColor: Colors.brand.light,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
  },
  switchStoreBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  formCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  fieldLabel: {
    fontSize: 12,
    color: Colors.neutral.textTertiary,
  },
  fieldVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  controlGroup: {
    gap: Spacing.xs,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  bbdThresholdBox: {
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  bbdTextCol: {
    gap: 2,
  },
  bbdTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  bbdSub: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    lineHeight: 15,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.xs,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.neutral.card,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    ...Typography.monoValue,
    fontSize: 18,
    minWidth: 50,
    textAlign: 'center',
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
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.brand.subtle,
    borderRadius: Radius.lg,
    paddingVertical: 6,
  },
  savedBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  saveBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.neutral.card,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
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
  storesList: {
    gap: Spacing.sm,
  },
  storeOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.xl,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
  },
  storeOptionCardActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.subtle,
  },
  storeOptionInfo: {
    flex: 1,
    gap: 2,
  },
  storeOptionName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  storeOptionAddress: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  pressed: {
    opacity: 0.8,
  },
});

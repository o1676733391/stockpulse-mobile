import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { SectionHeader } from '@/components/ui/section-header';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { detectDeviceLanguage } from '@/i18n/detector';
import { useI18n } from '@/i18n/I18nContext';
import { SupportedLanguage } from '@/i18n/types';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LanguageScreen() {
  const insets = useSafeAreaInsets();
  const {
    language,
    setLanguage,
    availableLanguages,
    t,
    formatCurrency,
    formatDate,
    formatNumber,
  } = useI18n();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const detectedDeviceLang = detectDeviceLanguage();

  const handleSelectLanguage = (langCode: SupportedLanguage) => {
    setLanguage(langCode);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar title={t('settings.language.title')} showBack />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Active & Device Language Card ── */}
        <Card style={styles.card}>
          <SectionHeader title={t('settings.language.deviceLanguage')} />

          <View style={styles.deviceInfoRow}>
            <View style={styles.deviceIconBox}>
              <VectorIcon name="Smartphone" size={20} color={Colors.brand.primary} />
            </View>
            <View style={styles.deviceInfoText}>
              <Text style={styles.deviceInfoTitle}>
                {t('settings.language.deviceLanguage')}
              </Text>
              <Text style={styles.deviceInfoSub}>
                {availableLanguages.find((l) => l.code === detectedDeviceLang)?.nativeName || 'English'} ({detectedDeviceLang.toUpperCase()})
              </Text>
            </View>
            {detectedDeviceLang === language && (
              <Badge variant="green">{t('common.active')}</Badge>
            )}
          </View>
        </Card>

        {/* ── Supported Languages List Card ── */}
        <Card style={styles.card}>
          <SectionHeader title={t('settings.language.supportedLanguages')} />

          <View style={styles.languagesList}>
            {availableLanguages.map((lang, idx) => {
              const isActive = lang.code === language;
              const isLast = idx === availableLanguages.length - 1;

              return (
                <Pressable
                  key={lang.code}
                  onPress={() => handleSelectLanguage(lang.code)}
                  style={({ pressed }) => [
                    styles.langRow,
                    !isLast && styles.langRowBorder,
                    isActive && styles.langRowActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.langFlag}>{lang.flag}</Text>

                  <View style={styles.langInfo}>
                    <Text style={[styles.langNative, isActive && styles.activeText]}>
                      {lang.nativeName}
                    </Text>
                    <Text style={styles.langEnglish}>{lang.name}</Text>
                  </View>

                  {isActive ? (
                    <View style={styles.checkCircle}>
                      <VectorIcon name="Check" size={14} color="#ffffff" strokeWidth={3} />
                    </View>
                  ) : (
                    <View style={styles.radioEmpty} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* ── Live Localization Preview Card ── */}
        <Card style={styles.card}>
          <SectionHeader title="Live Formatting Preview" />

          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>{t('common.date')}:</Text>
            <Text style={styles.previewVal}>{formatDate(new Date())}</Text>
          </View>

          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>{t('common.price')}:</Text>
            <Text style={styles.previewVal}>{formatCurrency(12450.75, 'EUR')}</Text>
          </View>

          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>{t('common.quantity')}:</Text>
            <Text style={styles.previewVal}>{formatNumber(1500000)} kg</Text>
          </View>

          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>{t('common.status')}:</Text>
            <Text style={styles.previewVal}>{t('dashboard.stockHealth.healthy')}</Text>
          </View>
        </Card>

        {/* ── Success Toast Banner ── */}
        {savedSuccess && (
          <View style={styles.savedBanner}>
            <VectorIcon name="Check" size={16} color={Colors.brand.dark} />
            <Text style={styles.savedBannerText}>{t('settings.language.saved')}</Text>
          </View>
        )}
      </ScrollView>
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
  card: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  deviceInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.neutral.surface,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  deviceIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceInfoText: {
    flex: 1,
    gap: 2,
  },
  deviceInfoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  deviceInfoSub: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  languagesList: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.neutral.card,
  },
  langRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  langRowActive: {
    backgroundColor: Colors.brand.subtle,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  langFlag: {
    fontSize: 24,
  },
  langInfo: {
    flex: 1,
    gap: 2,
  },
  langNative: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  langEnglish: {
    fontSize: 12,
    color: Colors.neutral.textTertiary,
  },
  activeText: {
    color: Colors.brand.dark,
    fontWeight: '700',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.neutral.borderLight,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  previewLabel: {
    fontSize: 12,
    color: Colors.neutral.textTertiary,
  },
  previewVal: {
    ...Typography.monoValue,
    fontSize: 13,
    color: Colors.neutral.textPrimary,
    fontWeight: '600',
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.brand.subtle,
    borderColor: Colors.brand.light,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
  },
  savedBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  pressed: {
    opacity: 0.8,
  },
});

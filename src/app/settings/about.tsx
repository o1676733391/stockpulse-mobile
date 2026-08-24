import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { SectionHeader } from '@/components/ui/section-header';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { INITIAL_ABOUT } from '@/services/settingsService';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const THIRD_PARTY_LICENSES = [
  { name: 'Expo', version: '~57.0.0', license: 'MIT' },
  { name: 'React Native', version: '0.86.2', license: 'MIT' },
  { name: 'Expo Router', version: '~57.0.12', license: 'MIT' },
  { name: 'React Native SVG', version: '15.15.4', license: 'MIT' },
  { name: 'Lucide React Native', version: '1.31.0', license: 'ISC' },
  { name: 'React Native Safe Area Context', version: '5.7.0', license: 'MIT' },
];

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [about] = useState(INITIAL_ABOUT);
  const [showLicenseModal, setShowLicenseModal] = useState(false);

  const handleContactSupport = () => {
    Alert.alert(
      t('settings.about.helpDesk'),
      'support@stockpulse.app · 24/7 Priority Support',
      [{ text: t('common.done') }]
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar title={t('settings.about.title')} showBack />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── App Brand Hero ── */}
        <View style={styles.brandHero}>
          <View style={styles.appLogoCircle}>
            <VectorIcon name="Activity" size={32} color={Colors.brand.primary} strokeWidth={2.5} />
          </View>
          <Text style={styles.appName}>{t('common.appName')}</Text>
          <Text style={styles.appTagline}>{t('common.tagline')}</Text>
          <View style={styles.versionBadgeRow}>
            <Badge variant="green">v{about.version}</Badge>
            <Text style={styles.buildText}>Build {about.buildNumber}</Text>
          </View>
        </View>

        {/* ── Support & Help Desk Card ── */}
        <Card style={styles.infoCard}>
          <SectionHeader title={t('settings.about.helpDesk')} />

          <Pressable
            onPress={handleContactSupport}
            style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#dbeafe' }]}>
              <VectorIcon name="Headphones" size={16} color="#1d4ed8" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>{t('settings.about.contactSupport')}</Text>
              <Text style={styles.actionSub}>{t('settings.about.contactSupportSub')}</Text>
            </View>
            <VectorIcon name="ChevronRight" size={16} color={Colors.neutral.textTertiary} />
          </Pressable>

          <Pressable
            onPress={() => Alert.alert(t('settings.about.userGuide'), 'docs.stockpulse.app')}
            style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#ede9fe' }]}>
              <VectorIcon name="BookOpen" size={16} color="#6d28d9" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>{t('settings.about.userGuide')}</Text>
              <Text style={styles.actionSub}>{t('settings.about.userGuideSub')}</Text>
            </View>
            <VectorIcon name="ChevronRight" size={16} color={Colors.neutral.textTertiary} />
          </Pressable>
        </Card>

        {/* ── Legal & Open Source Compliance Card ── */}
        <Card style={styles.infoCard}>
          <SectionHeader title={t('settings.about.compliance')} />

          <Pressable
            onPress={() => setShowLicenseModal(true)}
            style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#d1fae5' }]}>
              <VectorIcon name="ShieldCheck" size={16} color={Colors.brand.primary} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>{t('settings.about.openSourceRegister')}</Text>
              <Text style={styles.actionSub}>{t('settings.about.openSourceRegisterSub')}</Text>
            </View>
            <VectorIcon name="ChevronRight" size={16} color={Colors.neutral.textTertiary} />
          </Pressable>

          <Pressable
            onPress={() => Alert.alert(t('settings.about.privacyPolicy'), t('settings.about.privacyPolicySub'))}
            style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#f1f5f9' }]}>
              <VectorIcon name="Lock" size={16} color="#475569" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>{t('settings.about.privacyPolicy')}</Text>
              <Text style={styles.actionSub}>{t('settings.about.privacyPolicySub')}</Text>
            </View>
            <VectorIcon name="ChevronRight" size={16} color={Colors.neutral.textTertiary} />
          </Pressable>
        </Card>

        <Text style={styles.copyrightText}>
          {t('settings.about.copyright')}
        </Text>
      </ScrollView>

      {/* ── Third-Party Licenses Modal ── */}
      <Modal
        visible={showLicenseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLicenseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.licenseModalCard}>
            <View style={styles.modalGrabber} />

            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{t('settings.about.openSourceRegister')}</Text>
              <Pressable
                onPress={() => setShowLicenseModal(false)}
                style={styles.closeBtn}
              >
                <VectorIcon name="X" size={18} color={Colors.neutral.textTertiary} />
              </Pressable>
            </View>

            <ScrollView style={styles.licenseScroll}>
              {THIRD_PARTY_LICENSES.map((pkg) => (
                <View key={pkg.name} style={styles.licenseItemRow}>
                  <View>
                    <Text style={styles.licensePkgName}>{pkg.name}</Text>
                    <Text style={styles.licensePkgVersion}>Version: {pkg.version}</Text>
                  </View>
                  <Badge variant="green">{pkg.license}</Badge>
                </View>
              ))}
            </ScrollView>
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
  brandHero: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  appLogoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    ...Shadows.card,
  },
  appName: {
    ...Typography.pageTitle,
    fontSize: 22,
  },
  appTagline: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    textAlign: 'center',
  },
  versionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
  },
  buildText: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  infoCard: {
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionInfo: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    ...Typography.cardTitle,
    fontSize: 13,
  },
  actionSub: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  copyrightText: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    marginTop: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  licenseModalCard: {
    backgroundColor: Colors.neutral.card,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    maxHeight: '80%',
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
  licenseScroll: {
    maxHeight: 320,
  },
  licenseItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  licensePkgName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  licensePkgVersion: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    marginTop: 1,
  },
  pressed: {
    opacity: 0.8,
  },
});

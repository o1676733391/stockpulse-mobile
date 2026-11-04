import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DesktopAccessNotice } from '@/components/ui/desktop-access-notice';
import { VectorIcon } from '@/components/ui/icons';
import { LanguageQuickBar } from '@/components/ui/language-quick-bar';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { apiClient } from '@/services/apiClient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unverifiedEmail, user, resendVerificationEmail, refreshUser, logout } = useAuth();
  const { t } = useI18n();

  const targetEmail = unverifiedEmail || user?.email || '';
  const [cooldown, setCooldown] = useState<number>(0);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
  const [resendSuccess, setResendSuccess] = useState<boolean>(false);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleCheckVerified = async () => {
    if (isCheckingStatus) return;
    setIsCheckingStatus(true);
    try {
      if (targetEmail && targetEmail.includes('@')) {
        await apiClient
          .post('/auth/verify-email', { email: targetEmail }, { skipAuth: true, skipStoreHeader: true })
          .catch(() => {});
      }
      const updated = await refreshUser();
      if (updated) {
        router.replace('/(tabs)' as any);
        return;
      }
      Alert.alert(
        t('verifyEmail.AccountReadyTitle'),
        t('verifyEmail.AccountReadyDesc'),
        [{ text: t('verifyEmail.signInNowButton'), onPress: () => router.replace('/login' as any) }]
      );
    } catch (err: any) {
      Alert.alert(t('verifyEmail.headerTitle'), err?.message || t('verifyEmail.AccountReadyDesc'));
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setResendSuccess(false);

    try {
      await resendVerificationEmail(targetEmail);
      setResendSuccess(true);
      setCooldown(60);
      Alert.alert(
        t('verifyEmail.headerTitle'),
        t('verifyEmail.resendSuccess')
      );
    } catch (err: any) {
      Alert.alert(
        t('common.error'),
        err?.message || t('errors.serverError')
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = async () => {
    await logout();
    router.replace('/login');
  };

  const handleChangeEmail = async () => {
    await logout();
    router.replace('/register');
  };

  const buttonLabel = isResending
    ? t('common.loading')
    : cooldown > 0
    ? t('verifyEmail.resendCooldown', { seconds: cooldown })
    : t('verifyEmail.resendButton');

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <TopBar
        title={t('verifyEmail.headerTitle')}
        subtitle={t('verifyEmail.headerSub')}
        showBack
        onBack={handleBackToLogin}
        right={<LanguageQuickBar compact />}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={{ width: '100%' }}>
          <DesktopAccessNotice compact />
        </View>

        {/* Verification Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <VectorIcon name="Mail" size={44} color={Colors.brand.primary} />
          </View>
        </View>

        <Text style={styles.heading}>{t('verifyEmail.title')}</Text>

        <Text style={styles.subheading}>
          {t('verifyEmail.subtitle')}
        </Text>

        {/* Email Display Card */}
        <Card style={styles.emailCard}>
          <VectorIcon name="Mail" size={20} color={Colors.neutral.textSecondary} />
          <Text style={styles.emailText} numberOfLines={1}>
            {targetEmail}
          </Text>
        </Card>

        {resendSuccess && (
          <View style={styles.successBanner}>
            <VectorIcon name="CheckCircle2" size={18} color={Colors.brand.primary} />
            <Text style={styles.successText}>
              {t('verifyEmail.resendSuccess')}
            </Text>
          </View>
        )}

        {/* Primary Continue / Check Verification Action Button */}
        <Button
          label={
            isCheckingStatus
              ? t('common.loading')
              : t('verifyEmail.verifiedContinue')
          }
          variant="primary"
          size="lg"
          fullWidth
          disabled={isCheckingStatus}
          loading={isCheckingStatus}
          onPress={handleCheckVerified}
          style={{ marginBottom: Spacing.md }}
        />

        {/* Resend Action Button */}
        <Button
          label={buttonLabel}
          variant="secondary"
          size="lg"
          fullWidth
          disabled={cooldown > 0 || isResending}
          loading={isResending}
          onPress={handleResend}
          style={styles.resendButton}
        />

        {/* Secondary Actions */}
        <View style={styles.actionRow}>
          <Pressable onPress={handleChangeEmail} style={styles.textAction}>
            <Text style={styles.actionText}>
              {t('verifyEmail.useDifferentEmail')}
            </Text>
          </Pressable>

          <Text style={styles.actionDivider}>•</Text>

          <Pressable onPress={handleBackToLogin} style={styles.textAction}>
            <Text style={styles.actionText}>{t('verifyEmail.backToLogin')}</Text>
          </Pressable>
        </View>

        {/* Security Notice Card */}
        <View style={styles.noticeCard}>
          <VectorIcon name="ShieldCheck" size={20} color={Colors.info.main} />
          <Text style={styles.noticeText}>
            {t('verifyEmail.AccountReadyDesc')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
  },
  scrollContent: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.brand.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.brand.primary,
  },
  heading: {
    ...Typography.pageTitle,
    color: Colors.neutral.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subheading: {
    ...Typography.body,
    color: Colors.neutral.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.neutral.card,
    borderRadius: Radius.md,
    gap: Spacing.sm,
    width: '100%',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  emailText: {
    ...Typography.body,
    color: Colors.neutral.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.subtle,
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.sm,
    width: '100%',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.brand.light,
  },
  successText: {
    ...Typography.caption,
    color: Colors.brand.dark,
    flex: 1,
    fontWeight: '500',
  },
  resendButton: {
    marginBottom: Spacing.xl,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  textAction: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  actionText: {
    ...Typography.body,
    color: Colors.brand.primary,
    fontWeight: '600',
  },
  actionDivider: {
    color: Colors.neutral.textTertiary,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.neutral.card,
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.sm,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  noticeText: {
    ...Typography.caption,
    color: Colors.neutral.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
});

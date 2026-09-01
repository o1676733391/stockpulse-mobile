import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
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
  const { unverifiedEmail, user, resendVerificationEmail, logout } = useAuth();
  const { t } = useI18n();

  const targetEmail = unverifiedEmail || user?.email || 'your email';
  const [cooldown, setCooldown] = useState<number>(0);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendSuccess, setResendSuccess] = useState<boolean>(false);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setResendSuccess(false);

    try {
      await resendVerificationEmail(targetEmail);
      setResendSuccess(true);
      setCooldown(60); // 60 seconds rate-limit cooldown
      Alert.alert(
        'Verification Email Sent',
        'A fresh verification link has been sent to your email inbox.'
      );
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.message || 'Failed to resend verification email. Please try again later.'
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
    ? 'Sending...'
    : cooldown > 0
    ? `Resend available in ${cooldown}s`
    : 'Resend Verification Email';

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <TopBar
        title="Email Verification"
        showBack
        onBack={handleBackToLogin}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Verification Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <VectorIcon name="Mail" size={44} color={Colors.brand.primary} />
          </View>
        </View>

        <Text style={styles.heading}>Please verify your email</Text>

        <Text style={styles.subheading}>
          We sent a confirmation link to the address below. Open the link to activate your account and access StockPulse.
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
              Verification email sent! Check your inbox & spam folder.
            </Text>
          </View>
        )}

        {/* Resend Action Button */}
        <Button
          label={buttonLabel}
          variant="primary"
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
            <Text style={styles.actionText}>Use a different email</Text>
          </Pressable>

          <Text style={styles.actionDivider}>•</Text>

          <Pressable onPress={handleBackToLogin} style={styles.textAction}>
            <Text style={styles.actionText}>Back to Sign In</Text>
          </Pressable>
        </View>

        {/* Security Notice Card */}
        <View style={styles.noticeCard}>
          <VectorIcon name="ShieldCheck" size={20} color={Colors.info.main} />
          <Text style={styles.noticeText}>
            Mandatory email verification protects store inventory, financial reports, and purchasing operations from unauthorized access.
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
    marginTop: Spacing.xl,
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
    marginBottom: Spacing.xl,
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

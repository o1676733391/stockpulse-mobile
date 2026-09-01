import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { ROLES } from '@/constants/rbac';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { invitationService } from '@/services/invitationService';
import { VerifyInvitationResult } from '@/types/invitation';
import { UserRole } from '@/types/rbac';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function JoinStoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, formatDate } = useI18n();
  const { refreshUser } = useAuth();

  const [invitationCode, setInvitationCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [validatedInvitation, setValidatedInvitation] = useState<VerifyInvitationResult | null>(null);
  const [joinError, setJoinError] = useState<{ message: string; isNetworkError?: boolean } | null>(null);
  const [joinSuccessMessage, setJoinSuccessMessage] = useState<string | null>(null);

  const getNormalizedCode = (input: string) => {
    let clean = input.trim().toUpperCase();
    if (clean.length === 6 && !clean.startsWith('INV-')) {
      clean = `INV-${clean}`;
    }
    return clean;
  };

  const handleValidateCode = async () => {
    setJoinError(null);
    setValidatedInvitation(null);

    const clean = getNormalizedCode(invitationCode);
    if (!clean || clean.length < 5) {
      setJoinError({ message: t('invitationErrors.invalidCode') });
      return;
    }

    try {
      setIsValidating(true);
      const res = await invitationService.validateInvitation(clean);
      setValidatedInvitation(res);
    } catch (err: any) {
      const errMsg = (err.message || '').toLowerCase();

      if (
        errMsg.includes('network') ||
        errMsg.includes('connection') ||
        errMsg.includes('timeout') ||
        errMsg.includes('failed to fetch')
      ) {
        setJoinError({
          message: t('invitationErrors.networkError'),
          isNetworkError: true,
        });
      } else if (errMsg.includes('expired')) {
        setJoinError({
          message: t('invitationErrors.expired'),
        });
      } else if (errMsg.includes('revoked')) {
        setJoinError({
          message: t('invitationErrors.revoked'),
        });
      } else if (
        errMsg.includes('claimed') ||
        errMsg.includes('already accepted') ||
        errMsg.includes('already been accepted')
      ) {
        setJoinError({
          message: t('invitationErrors.alreadyClaimed'),
        });
      } else if (errMsg.includes('too many') || errMsg.includes('429')) {
        setJoinError({
          message: t('invitationErrors.rateLimited'),
        });
      } else {
        setJoinError({
          message: t('invitationErrors.invalidCode'),
        });
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmAccept = async () => {
    if (!validatedInvitation) return;
    setJoinError(null);

    const clean = getNormalizedCode(invitationCode);
    try {
      setIsAccepting(true);
      const res = await invitationService.acceptInvitation(clean);

      setJoinSuccessMessage(
        res.message || t('onboarding.welcomeToStore', { defaultValue: `Welcome to ${res.storeName || 'the store'}!` })
      );

      await refreshUser();

      setTimeout(() => {
        router.replace('/(tabs)' as any);
      }, 1000);
    } catch (err: any) {
      const errMsg = (err.message || '').toLowerCase();

      if (
        errMsg.includes('email mismatch') ||
        errMsg.includes('security violation') ||
        errMsg.includes('issued to') ||
        errMsg.includes('different email')
      ) {
        setJoinError({
          message: t('invitationErrors.emailMismatch'),
        });
      } else if (errMsg.includes('expired')) {
        setJoinError({
          message: t('invitationErrors.expired'),
        });
      } else if (errMsg.includes('revoked')) {
        setJoinError({
          message: t('invitationErrors.revoked'),
        });
      } else if (errMsg.includes('network') || errMsg.includes('connection')) {
        setJoinError({
          message: t('invitationErrors.networkError'),
          isNetworkError: true,
        });
      } else {
        setJoinError({
          message: err.message || t('invitationErrors.generic'),
        });
      }
    } finally {
      setIsAccepting(false);
    }
  };

  const getRoleBadgeVariant = (roleName?: string) => {
    switch (roleName?.toLowerCase()) {
      case 'admin':
      case 'superadmin':
        return 'purple';
      case 'manager':
        return 'blue';
      case 'supervisor':
        return 'amber';
      case 'auditor':
        return 'orange';
      default:
        return 'green';
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: Colors.neutral.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TopBar title={t('onboarding.joinTitle')} showBack />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.formCard}>
          <View style={styles.formHeaderRow}>
            <View style={[styles.miniIconCircle, { backgroundColor: 'rgba(5, 150, 105, 0.1)' }]}>
              <VectorIcon name="KeyRound" size={20} color={Colors.brand.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.formCardTitle}>{t('onboarding.joinTitle')}</Text>
              <Text style={styles.formCardSub}>{t('onboarding.joinDesc')}</Text>
            </View>
          </View>

          {/* Code Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('onboarding.codeLabel')}</Text>
            <View style={styles.inputWrapper}>
              <VectorIcon name="KeyRound" size={18} color={Colors.neutral.textTertiary} />
              <TextInput
                value={invitationCode}
                onChangeText={(val) => {
                  setInvitationCode(val.toUpperCase());
                  setJoinError(null);
                  setValidatedInvitation(null);
                }}
                placeholder={t('onboarding.codePlaceholder')}
                placeholderTextColor={Colors.neutral.textTertiary}
                style={styles.codeInput}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={10}
                accessibilityLabel={t('onboarding.codeLabel')}
              />
              {invitationCode.length > 0 && (
                <Pressable
                  onPress={() => {
                    setInvitationCode('');
                    setValidatedInvitation(null);
                    setJoinError(null);
                  }}
                  hitSlop={8}
                >
                  <VectorIcon name="X" size={16} color={Colors.neutral.textTertiary} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Error Banner */}
          {joinError && (
            <View style={styles.errorBox}>
              <VectorIcon name="AlertCircle" size={18} color={Colors.critical.main} />
              <View style={{ flex: 1 }}>
                <Text style={styles.errorText}>{joinError.message}</Text>
              </View>
              {joinError.isNetworkError && (
                <Pressable onPress={handleValidateCode} style={styles.retryChip}>
                  <Text style={styles.retryChipText}>{t('common.retry')}</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Success Banner */}
          {joinSuccessMessage && (
            <View style={styles.successBox}>
              <VectorIcon name="CheckCircle2" size={18} color={Colors.brand.primary} />
              <Text style={styles.successText}>{joinSuccessMessage}</Text>
            </View>
          )}

          {/* Validated Preview Card */}
          {validatedInvitation && (
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <View style={styles.previewIconBox}>
                  <VectorIcon name="Store" size={20} color={Colors.brand.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewSubTitle}>{t('onboarding.previewTitle')}</Text>
                  <Text style={styles.previewStoreName}>{validatedInvitation.storeName}</Text>
                </View>
              </View>

              <View style={styles.previewDivider} />

              <View style={styles.previewDetailRow}>
                <Text style={styles.previewLabel}>{t('onboarding.roleLabel')}:</Text>
                <Badge variant={getRoleBadgeVariant(validatedInvitation.role)}>
                  {ROLES[validatedInvitation.role as UserRole]?.label || validatedInvitation.role}
                </Badge>
              </View>

              <View style={styles.previewDetailRow}>
                <Text style={styles.previewLabel}>{t('onboarding.emailLabel')}:</Text>
                <Text style={styles.previewValue}>{validatedInvitation.email}</Text>
              </View>

              <View style={styles.previewDetailRow}>
                <Text style={styles.previewLabel}>{t('onboarding.expiresLabel')}:</Text>
                <Text style={styles.previewValue}>
                  {formatDate ? formatDate(validatedInvitation.expiresAt) : validatedInvitation.expiresAt.split('T')[0]}
                </Text>
              </View>

              <View style={styles.previewActionRow}>
                <Button
                  label={isAccepting ? t('onboarding.accepting') : t('onboarding.acceptBtn')}
                  variant="primary"
                  loading={isAccepting}
                  disabled={isAccepting}
                  onPress={handleConfirmAccept}
                  style={{ flex: 1 }}
                  leftIcon={<VectorIcon name="CheckCircle" size={16} color="#FFFFFF" />}
                />
                <Button
                  label={t('onboarding.cancelBtn')}
                  variant="outline"
                  disabled={isAccepting}
                  onPress={() => {
                    setValidatedInvitation(null);
                    setInvitationCode('');
                  }}
                />
              </View>
            </View>
          )}

          {/* Initial Validate Action */}
          {!validatedInvitation && (
            <Button
              label={isValidating ? t('onboarding.validating') : t('onboarding.joinBtn')}
              variant="primary"
              loading={isValidating}
              disabled={isValidating || invitationCode.trim().length < 5}
              onPress={handleValidateCode}
              style={{ marginTop: Spacing.sm }}
              leftIcon={<VectorIcon name="Check" size={16} color="#FFFFFF" />}
            />
          )}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  formCard: {
    padding: Spacing.lg,
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  miniIconCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  formCardSub: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.label,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.md,
    backgroundColor: '#ffffff',
    paddingHorizontal: Spacing.md,
    height: 50,
    gap: Spacing.sm,
  },
  codeInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.neutral.textPrimary,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.critical.subtle,
    borderWidth: 1,
    borderColor: Colors.critical.light,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: 13,
    color: Colors.critical.dark,
    fontWeight: '500',
    lineHeight: 18,
  },
  retryChip: {
    backgroundColor: Colors.critical.main,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  retryChipText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.subtle,
    borderWidth: 1,
    borderColor: Colors.brand.light,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  successText: {
    fontSize: 13,
    color: Colors.brand.dark,
    fontWeight: '600',
  },
  previewCard: {
    backgroundColor: '#f8fafc',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.brand.light,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  previewIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewSubTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.brand.dark,
    textTransform: 'uppercase',
  },
  previewStoreName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  previewDivider: {
    height: 1,
    backgroundColor: Colors.neutral.border,
    marginVertical: Spacing.sm,
  },
  previewDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  previewLabel: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
  },
  previewValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  previewActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});

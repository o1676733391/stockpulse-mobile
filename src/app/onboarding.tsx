import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { LanguageQuickBar } from '@/components/ui/language-quick-bar';
import { TopBar } from '@/components/ui/top-bar';
import { ROLES } from '@/constants/rbac';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { apiClient } from '@/services/apiClient';
import { invitationService } from '@/services/invitationService';
import { VerifyInvitationResult } from '@/types/invitation';
import { UserRole } from '@/types/rbac';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

type OnboardingView = 'SELECTION' | 'JOIN_STORE' | 'CREATE_STORE';

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, formatDate } = useI18n();
  const { user, refreshUser, logout } = useAuth();

  const [currentView, setCurrentView] = useState<OnboardingView>('SELECTION');

  // Join Store State
  const [invitationCode, setInvitationCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [validatedInvitation, setValidatedInvitation] = useState<VerifyInvitationResult | null>(null);
  const [joinError, setJoinError] = useState<{ message: string; isNetworkError?: boolean } | null>(null);
  const [joinSuccessMessage, setJoinSuccessMessage] = useState<string | null>(null);

  // Create Store State
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCode, setNewStoreCode] = useState('');
  const [newStoreCity, setNewStoreCity] = useState('');
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const [createStoreError, setCreateStoreError] = useState<string | null>(null);

  /**
   * Helper: Normalize user input code (strips whitespace, handles raw 6-char or INV- prefix)
   */
  const getNormalizedCode = (input: string) => {
    let clean = input.trim().toUpperCase();
    if (clean.length === 6 && !clean.startsWith('INV-')) {
      clean = `INV-${clean}`;
    }
    return clean;
  };

  /**
   * 1. Validate Invitation Code (Real API)
   */
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
      } else if (errMsg.includes('claimed') || errMsg.includes('already accepted') || errMsg.includes('already been accepted')) {
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

  /**
   * 2. Confirm and Accept Invitation (Real API)
   */
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

      // Refresh auth state to pull latest store assignment & permissions
      await refreshUser();

      // Immediate navigation to main application
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

  /**
   * 3. Create a New Store (Real API)
   */
  const handleCreateStore = async () => {
    if (!newStoreName.trim()) {
      setCreateStoreError(t('common.required'));
      return;
    }
    setCreateStoreError(null);

    try {
      setIsCreatingStore(true);
      await apiClient.post('/stores', {
        name: newStoreName.trim(),
        storeCode: newStoreCode.trim() || `STR-${Math.floor(1000 + Math.random() * 9000)}`,
        city: newStoreCity.trim() || 'Berlin',
        country: 'DE',
        currency: 'EUR',
      });

      await refreshUser();
      Alert.alert(t('onboarding.createStore'), `Store '${newStoreName}' created successfully!`, [
        {
          text: t('common.done'),
          onPress: () => router.replace('/(tabs)' as any),
        },
      ]);
    } catch (err: any) {
      setCreateStoreError(err.message || 'Failed to create store. Please try again.');
    } finally {
      setIsCreatingStore(false);
    }
  };

  /**
   * 4. Skip for now
   */
  const handleSkip = () => {
    router.replace('/(tabs)' as any);
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
      <TopBar
        title={t('onboarding.getStarted')}
        showBack={currentView !== 'SELECTION'}
        onBack={() => {
          setCurrentView('SELECTION');
          setJoinError(null);
          setValidatedInvitation(null);
        }}
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <LanguageQuickBar compact />
            <Pressable
              onPress={async () => {
                await logout();
                router.replace('/login' as any);
              }}
              hitSlop={8}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.critical.main }}>
                {t('settings.items.signOut')}
              </Text>
            </Pressable>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Brand / Welcome Header ── */}
        <View style={styles.headerBox}>
          <View style={styles.logoBadge}>
            <VectorIcon name="Store" size={32} color={Colors.brand.primary} strokeWidth={2.2} />
          </View>
          <Text style={styles.welcomeTitle}>
            {user?.name ? `${t('dashboard.welcome', { name: user.name })}!` : t('onboarding.getStarted')}
          </Text>
          <Text style={styles.welcomeSub}>
            {t('onboarding.getStartedSub')}
          </Text>
        </View>

        {/* ── View 1: Selection Dashboard ── */}
        {currentView === 'SELECTION' && (
          <View style={styles.optionsContainer}>
            {/* Join Store Card */}
            <Pressable
              onPress={() => {
                setCurrentView('JOIN_STORE');
                setJoinError(null);
              }}
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.joinStore')}
              style={({ pressed }) => [
                styles.optionCard,
                styles.optionCardPrimary,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.optionHeader}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(5, 150, 105, 0.12)' }]}>
                  <VectorIcon name="KeyRound" size={24} color={Colors.brand.primary} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>{t('onboarding.joinStore')}</Text>
                  <Text style={styles.optionSub}>
                    {t('onboarding.joinStoreDesc')}
                  </Text>
                </View>
                <VectorIcon name="ChevronRight" size={20} color={Colors.brand.primary} />
              </View>
            </Pressable>

            {/* Create Store Card */}
            <Pressable
              onPress={() => {
                setCurrentView('CREATE_STORE');
                setCreateStoreError(null);
              }}
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.createStore')}
              style={({ pressed }) => [
                styles.optionCard,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.optionHeader}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                  <VectorIcon name="Building" size={24} color={Colors.purple.main} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>{t('onboarding.createStore')}</Text>
                  <Text style={styles.optionSub}>
                    {t('onboarding.createStoreDesc')}
                  </Text>
                </View>
                <VectorIcon name="ChevronRight" size={20} color={Colors.neutral.textTertiary} />
              </View>
            </Pressable>

            {/* Skip for now option */}
            <View style={styles.skipBox}>
              <Text style={styles.skipDesc}>
                {t('onboarding.skipForNowDesc')}
              </Text>
              <Button
                label={t('onboarding.skipForNow')}
                variant="ghost"
                onPress={handleSkip}
                style={styles.skipButton}
              />
            </View>
          </View>
        )}

        {/* ── View 2: Join Store Flow ── */}
        {currentView === 'JOIN_STORE' && (
          <View style={styles.formContainer}>
            <Card style={styles.formCard}>
              <View style={styles.formHeaderRow}>
                <View style={[styles.miniIconCircle, { backgroundColor: 'rgba(5, 150, 105, 0.1)' }]}>
                  <VectorIcon name="KeyRound" size={18} color={Colors.brand.primary} />
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
                      {t(`team.roles.${validatedInvitation.role}`, {
                        defaultValue: ROLES[validatedInvitation.role as UserRole]?.label || validatedInvitation.role,
                      })}
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

              {/* Initial Validate Action if not yet validated */}
              {!validatedInvitation && (
                <Button
                  label={isValidating ? t('onboarding.validating') : t('onboarding.joinBtn')}
                  variant="primary"
                  loading={isValidating}
                  disabled={isValidating || invitationCode.trim().length < 5}
                  onPress={handleValidateCode}
                  style={styles.submitBtn}
                  leftIcon={<VectorIcon name="Check" size={16} color="#FFFFFF" />}
                />
              )}
            </Card>
          </View>
        )}

        {/* ── View 3: Create Store Flow ── */}
        {currentView === 'CREATE_STORE' && (
          <View style={styles.formContainer}>
            <Card style={styles.formCard}>
              <View style={styles.formHeaderRow}>
                <View style={[styles.miniIconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                  <VectorIcon name="Building" size={18} color={Colors.purple.main} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formCardTitle}>{t('onboarding.createTitle')}</Text>
                  <Text style={styles.formCardSub}>{t('onboarding.createSub')}</Text>
                </View>
              </View>

              {/* Store Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('onboarding.storeName')} *</Text>
                <TextInput
                  value={newStoreName}
                  onChangeText={setNewStoreName}
                  placeholder="e.g. Bella Cucina / Hoang Tu Be"
                  placeholderTextColor={Colors.neutral.textTertiary}
                  style={styles.textInput}
                />
              </View>

              {/* City Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('onboarding.storeCity')}</Text>
                <TextInput
                  value={newStoreCity}
                  onChangeText={setNewStoreCity}
                  placeholder="e.g. Berlin"
                  placeholderTextColor={Colors.neutral.textTertiary}
                  style={styles.textInput}
                />
              </View>

              {/* Store Code Input (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('onboarding.storeCode')}</Text>
                <TextInput
                  value={newStoreCode}
                  onChangeText={setNewStoreCode}
                  placeholder="e.g. BER-01"
                  placeholderTextColor={Colors.neutral.textTertiary}
                  style={styles.textInput}
                  autoCapitalize="characters"
                />
              </View>

              {/* Create Store Error */}
              {createStoreError && (
                <View style={styles.errorBox}>
                  <VectorIcon name="AlertCircle" size={18} color={Colors.critical.main} />
                  <Text style={styles.errorText}>{createStoreError}</Text>
                </View>
              )}

              <Button
                label={isCreatingStore ? t('onboarding.creatingStore') : t('onboarding.createBtn')}
                variant="primary"
                loading={isCreatingStore}
                disabled={isCreatingStore || !newStoreName.trim()}
                onPress={handleCreateStore}
                style={styles.submitBtn}
                leftIcon={<VectorIcon name="Plus" size={16} color="#FFFFFF" />}
              />
            </Card>
          </View>
        )}
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
    paddingTop: Spacing.md,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  welcomeTitle: {
    ...Typography.pageTitle,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  welcomeSub: {
    ...Typography.bodySecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  optionCard: {
    backgroundColor: Colors.neutral.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    ...Shadows.card,
  },
  optionCardPrimary: {
    borderColor: Colors.brand.primary,
    backgroundColor: '#ffffff',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    marginBottom: 4,
  },
  optionSub: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
    lineHeight: 18,
  },
  skipBox: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  skipDesc: {
    ...Typography.caption,
    textAlign: 'center',
    color: Colors.neutral.textTertiary,
    marginBottom: Spacing.xs,
  },
  skipButton: {
    minHeight: 40,
  },
  formContainer: {
    width: '100%',
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
  textInput: {
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.md,
    backgroundColor: '#ffffff',
    paddingHorizontal: Spacing.md,
    height: 48,
    fontSize: 15,
    color: Colors.neutral.textPrimary,
  },
  submitBtn: {
    marginTop: Spacing.sm,
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

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DesktopAccessNotice } from '@/components/ui/desktop-access-notice';
import { VectorIcon } from '@/components/ui/icons';
import { LanguageQuickBar } from '@/components/ui/language-quick-bar';
import { TopBar } from '@/components/ui/top-bar';
import { ROLES } from '@/constants/rbac';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { invitationService } from '@/services/invitationService';
import { VerifyInvitationResult } from '@/types/invitation';
import { UserRole } from '@/types/rbac';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

type LoginTab = 'account' | 'invitationCode';

const DEMO_STAFF_USERS = [
  {
    role: 'staff' as UserRole,
    name: 'Elena Fischer',
    email: 'elena.cook@restaurant.de',
    title: 'Kitchen Cook',
    badgeVariant: 'green' as const,
  },
  {
    role: 'supervisor' as UserRole,
    name: 'David Weber',
    email: 'david.lead@restaurant.de',
    title: 'Shift Lead',
    badgeVariant: 'amber' as const,
  },
  {
    role: 'manager' as UserRole,
    name: 'Marco Rossi',
    email: 'marco.manager@restaurant.de',
    title: 'Manager',
    badgeVariant: 'blue' as const,
  },
  {
    role: 'auditor' as UserRole,
    name: 'Dr. Klaus Becker',
    email: 'klaus.auditor@becker-consult.de',
    title: 'Auditor',
    badgeVariant: 'orange' as const,
  },
  {
    role: 'admin' as UserRole,
    name: 'Anna Schmidt',
    email: 'anna.admin@restaurant.de',
    title: 'Store Owner',
    badgeVariant: 'purple' as const,
  },
];

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode: queryMode } = useLocalSearchParams<{ mode?: string }>();
  const { login, register, refreshUser } = useAuth();
  const { t, formatDate } = useI18n();

  const [activeTab, setActiveTab] = useState<LoginTab>(
    queryMode === 'staff' || queryMode === 'code' ? 'invitationCode' : 'account'
  );

  // ── Account Login State ──
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDemoStaff, setShowDemoStaff] = useState(true);

  // ── Staff Invitation Code State ──
  const [invitationCode, setInvitationCode] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [validatedInvitation, setValidatedInvitation] = useState<VerifyInvitationResult | null>(null);
  const [staffName, setStaffName] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [codeError, setCodeError] = useState<{ message: string; isNetworkError?: boolean } | null>(null);
  const [claimSuccessMsg, setClaimSuccessMsg] = useState<string | null>(null);

  /**
   * Helper: Normalize user input code
   */
  const getNormalizedCode = (input: string) => {
    let clean = input.trim().toUpperCase();
    if (clean.length === 6 && !clean.startsWith('INV-')) {
      clean = `INV-${clean}`;
    }
    return clean;
  };

  /**
   * Perform Email / Staff Login
   */
  const performLogin = async (targetEmail: string, targetPassword: string) => {
    if (!targetEmail.trim() || !targetPassword.trim()) {
      setErrorMsg(t('auth.fillAllFields'));
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await login(targetEmail.trim(), targetPassword);

      if (res.emailNeedsVerification) {
        router.push('/verify-email' as any);
        return;
      }

      if (res.user?.storeId && res.user.storeId !== 'unassigned' && res.user.storeId !== 'pending') {
        router.replace('/(tabs)' as any);
      } else {
        router.replace('/onboarding' as any);
      }
    } catch (err: any) {
      if (err.message === 'ACCOUNT_DISABLED') {
        router.push('/account-disabled' as any);
        return;
      }
      setErrorMsg(err.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Standard / Staff Email Login
   */
  const handleLogin = async () => {
    await performLogin(email, password);
  };

  /**
   * Handle Quick Demo Staff Selection (populates credentials and signs in immediately)
   */
  const handleSelectDemoStaff = (demoUser: typeof DEMO_STAFF_USERS[0]) => {
    setEmail(demoUser.email);
    setPassword('StockPulse123!');
    setErrorMsg(null);
    void performLogin(demoUser.email, 'StockPulse123!');
  };

  /**
   * Validate Staff Invitation Code (Real API)
   */
  const handleValidateCode = async () => {
    setCodeError(null);
    setValidatedInvitation(null);

    const clean = getNormalizedCode(invitationCode);
    if (!clean || clean.length < 5) {
      setCodeError({ message: t('invitationErrors.invalidCode') });
      return;
    }

    try {
      setIsValidatingCode(true);
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
        setCodeError({
          message: t('invitationErrors.networkError'),
          isNetworkError: true,
        });
      } else if (errMsg.includes('expired')) {
        setCodeError({ message: t('invitationErrors.expired') });
      } else if (errMsg.includes('revoked')) {
        setCodeError({ message: t('invitationErrors.revoked') });
      } else if (errMsg.includes('claimed') || errMsg.includes('already accepted')) {
        setCodeError({ message: t('invitationErrors.alreadyClaimed') });
      } else if (errMsg.includes('too many') || errMsg.includes('429')) {
        setCodeError({ message: t('invitationErrors.rateLimited') });
      } else {
        setCodeError({ message: t('invitationErrors.invalidCode') });
      }
    } finally {
      setIsValidatingCode(false);
    }
  };

  /**
   * Complete Staff Invitation Claim & Enter Store (Real API)
   */
  const handleClaimStaffInvite = async () => {
    if (!validatedInvitation || isClaiming) return;
    setCodeError(null);

    const clean = getNormalizedCode(invitationCode);

    try {
      setIsClaiming(true);

      // If user provided a staff password, register or sign in their account first
      if (staffPassword.trim().length >= 6) {
        try {
          await register(
            staffName.trim() || validatedInvitation.email.split('@')[0],
            validatedInvitation.email,
            staffPassword.trim(),
            validatedInvitation.storeName,
            undefined,
            validatedInvitation.role
          );
        } catch (regErr: any) {
          // If already registered, attempt login
          try {
            await login(validatedInvitation.email, staffPassword.trim());
          } catch (loginErr) {
            // Proceed to accept invitation directly
          }
        }
      }

      const res = await invitationService.acceptInvitation(clean, {
        name: staffName.trim() || undefined,
      });

      setClaimSuccessMsg(
        res.message || t('onboarding.welcomeToStore', { defaultValue: `Welcome to ${res.storeName || validatedInvitation.storeName}!` })
      );

      await refreshUser();

      setTimeout(() => {
        router.replace('/(tabs)' as any);
      }, 900);
    } catch (err: any) {
      const errMsg = (err.message || '').toLowerCase();
      if (errMsg.includes('email mismatch') || errMsg.includes('different email')) {
        setCodeError({ message: t('invitationErrors.emailMismatch') });
      } else if (errMsg.includes('expired')) {
        setCodeError({ message: t('invitationErrors.expired') });
      } else if (errMsg.includes('network') || errMsg.includes('connection')) {
        setCodeError({ message: t('invitationErrors.networkError'), isNetworkError: true });
      } else {
        setCodeError({ message: err.message || t('invitationErrors.generic') });
      }
    } finally {
      setIsClaiming(false);
    }
  };

  const getRoleVariant = (roleKey?: string) => {
    switch (roleKey?.toLowerCase()) {
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
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TopBar
        title={t('auth.signInButton')}
        subtitle={t('common.tagline')}
        showBack
        onBack={() => router.replace('/' as any)}
        right={<LanguageQuickBar compact />}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <DesktopAccessNotice compact />

        {/* Brand Banner */}
        <View style={styles.brandCard}>
          <View style={styles.brandLogoRow}>
            <View style={styles.brandIconBox}>
              <VectorIcon name="TrendingDown" size={24} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.brandName}>{t('common.appName')}</Text>
              <Text style={styles.brandTag}>{t('common.tagline')}</Text>
            </View>
          </View>
        </View>

        {/* ── Mode Switcher Tabs (Email Sign In vs Staff Code Join) ── */}
        <View style={styles.tabSwitcherContainer}>
          <Pressable
            onPress={() => {
              setActiveTab('account');
              setErrorMsg(null);
            }}
            accessibilityRole="tab"
            accessibilityLabel={t('auth.loginTabs.account')}
            style={[styles.tabButton, activeTab === 'account' && styles.tabButtonActive]}
          >
            <VectorIcon
              name="Mail"
              size={15}
              color={activeTab === 'account' ? Colors.brand.primary : Colors.neutral.textSecondary}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'account' && styles.tabButtonTextActive,
              ]}
            >
              {t('auth.loginTabs.account')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setActiveTab('invitationCode');
              setCodeError(null);
            }}
            accessibilityRole="tab"
            accessibilityLabel={t('auth.loginTabs.invitationCode')}
            style={[styles.tabButton, activeTab === 'invitationCode' && styles.tabButtonActive]}
          >
            <VectorIcon
              name="KeyRound"
              size={15}
              color={activeTab === 'invitationCode' ? Colors.brand.primary : Colors.neutral.textSecondary}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'invitationCode' && styles.tabButtonTextActive,
              ]}
            >
              {t('auth.loginTabs.invitationCode')}
            </Text>
          </Pressable>
        </View>

        {/* ══════════════════════════════════════════════════════════
            MODE 1: EMAIL SIGN IN (Staff & Admin Accounts)
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'account' && (
          <>
            {/* Error Alert */}
            {errorMsg && (
              <View style={styles.errorBanner}>
                <VectorIcon name="AlertTriangle" size={16} color={Colors.critical.main} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Credentials Form */}
            <Card style={styles.formCard}>
              <View style={styles.formHeaderRow}>
                <Text style={styles.formTitle}>{t('auth.signInSubtitle')}</Text>
              </View>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('auth.emailLabel')}</Text>
                <View style={styles.inputWrapper}>
                  <VectorIcon name="Mail" size={18} color={Colors.neutral.textTertiary} />
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={(v) => {
                      setEmail(v);
                      setErrorMsg(null);
                    }}
                    placeholder={t('auth.emailPlaceholder')}
                    placeholderTextColor={Colors.neutral.textTertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel={t('auth.emailLabel')}
                  />
                  {email.length > 0 && (
                    <Pressable onPress={() => setEmail('')} hitSlop={8}>
                      <VectorIcon name="X" size={16} color={Colors.neutral.textTertiary} />
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <View style={styles.passwordLabelRow}>
                  <Text style={styles.inputLabel}>{t('auth.passwordLabel')}</Text>
                  <Pressable onPress={() => router.push('/forgot-password' as any)}>
                    <Text style={styles.forgotPasswordLink}>{t('auth.forgotPassword')}</Text>
                  </Pressable>
                </View>
                <View style={styles.inputWrapper}>
                  <VectorIcon name="Lock" size={18} color={Colors.neutral.textTertiary} />
                  <TextInput
                    style={styles.textInput}
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                      setErrorMsg(null);
                    }}
                    placeholder="••••••••••••"
                    placeholderTextColor={Colors.neutral.textTertiary}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    accessibilityLabel={t('auth.passwordLabel')}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                    <VectorIcon
                      name={showPassword ? 'EyeOff' : 'Eye'}
                      size={18}
                      color={Colors.neutral.textTertiary}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Sign In Button */}
              <Button
                label={loading ? t('auth.signingIn') : t('auth.signInButton')}
                variant="primary"
                size="lg"
                fullWidth
                disabled={loading}
                onPress={handleLogin}
                rightIcon={
                  loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <VectorIcon name="ArrowRight" size={18} color="#FFFFFF" />
                  )
                }
              />
            </Card>

            {/* ── Quick Staff Role Helper Drawer ── */}
            <Card style={styles.quickRoleCard}>
              <Pressable
                onPress={() => setShowDemoStaff(!showDemoStaff)}
                style={styles.quickRoleHeader}
              >
                <View style={styles.quickRoleHeaderLeft}>
                  <VectorIcon name="Users" size={16} color={Colors.brand.primary} />
                  <Text style={styles.quickRoleTitle}>{t('auth.quickRoleSelect')}</Text>
                </View>
                <VectorIcon
                  name={showDemoStaff ? 'ChevronUp' : 'ChevronDown'}
                  size={16}
                  color={Colors.neutral.textSecondary}
                />
              </Pressable>

              {showDemoStaff && (
                <View style={styles.quickRoleList}>
                  <Text style={styles.quickRoleSub}>
                    {t('auth.quickRoleSelectSub')}
                  </Text>

                  <View style={styles.quickRolePillsGrid}>
                    {DEMO_STAFF_USERS.map((demo) => {
                      const isSelected = email.toLowerCase() === demo.email.toLowerCase();

                      return (
                        <Pressable
                          key={demo.role}
                          onPress={() => handleSelectDemoStaff(demo)}
                          style={({ pressed }) => [
                            styles.quickRolePill,
                            isSelected && styles.quickRolePillActive,
                            pressed && styles.pressed,
                          ]}
                        >
                          <View style={styles.quickRolePillRow}>
                            <Badge variant={demo.badgeVariant}>
                              {t(`team.roles.${demo.role}`)}
                            </Badge>
                            <Text style={styles.quickRoleName}>{demo.name}</Text>
                          </View>
                          <Text style={styles.quickRoleEmail}>{demo.email}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </Card>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            MODE 2: STAFF INVITATION CODE JOIN (Fast-track entry)
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'invitationCode' && (
          <Card style={styles.formCard}>
            <View style={styles.staffHeaderRow}>
              <View style={styles.staffIconCircle}>
                <VectorIcon name="KeyRound" size={20} color={Colors.brand.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.formCardHeading}>{t('auth.joinWithCode')}</Text>
                <Text style={styles.formCardSub}>{t('auth.joinWithCodeSub')}</Text>
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
                    setCodeError(null);
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
                      setCodeError(null);
                    }}
                    hitSlop={8}
                  >
                    <VectorIcon name="X" size={16} color={Colors.neutral.textTertiary} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Error Banner */}
            {codeError && (
              <View style={styles.errorBanner}>
                <VectorIcon name="AlertTriangle" size={16} color={Colors.critical.main} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.errorText}>{codeError.message}</Text>
                </View>
                {codeError.isNetworkError && (
                  <Pressable onPress={handleValidateCode} style={styles.retryChip}>
                    <Text style={styles.retryChipText}>{t('common.retry')}</Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Success Banner */}
            {claimSuccessMsg && (
              <View style={styles.successBox}>
                <VectorIcon name="CheckCircle2" size={18} color={Colors.brand.primary} />
                <Text style={styles.successText}>{claimSuccessMsg}</Text>
              </View>
            )}

            {/* Validated Staff Invitation Preview Card */}
            {validatedInvitation && (
              <View style={styles.validatedCard}>
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
                  <Badge variant={getRoleVariant(validatedInvitation.role)}>
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

                {/* Optional Staff Setup Fields */}
                <View style={styles.staffFieldsGroup}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{t('auth.yourName')}</Text>
                    <TextInput
                      value={staffName}
                      onChangeText={setStaffName}
                      placeholder={t('registerWizard.fullNamePlaceholder')}
                      placeholderTextColor={Colors.neutral.textTertiary}
                      style={styles.subTextInput}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{t('auth.setPassword')}</Text>
                    <TextInput
                      value={staffPassword}
                      onChangeText={setStaffPassword}
                      placeholder="••••••••••••"
                      placeholderTextColor={Colors.neutral.textTertiary}
                      secureTextEntry
                      style={styles.subTextInput}
                    />
                  </View>
                </View>

                <View style={styles.previewActionRow}>
                  <Button
                    label={isClaiming ? t('onboarding.accepting') : t('onboarding.acceptBtn')}
                    variant="primary"
                    loading={isClaiming}
                    disabled={isClaiming}
                    onPress={handleClaimStaffInvite}
                    style={{ flex: 1 }}
                    leftIcon={<VectorIcon name="CheckCircle" size={16} color="#FFFFFF" />}
                  />
                  <Button
                    label={t('onboarding.cancelBtn')}
                    variant="outline"
                    disabled={isClaiming}
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
                label={isValidatingCode ? t('onboarding.validating') : t('onboarding.validateBtn')}
                variant="primary"
                loading={isValidatingCode}
                disabled={isValidatingCode || invitationCode.trim().length < 5}
                onPress={handleValidateCode}
                style={{ marginTop: Spacing.sm }}
                leftIcon={<VectorIcon name="Check" size={16} color="#FFFFFF" />}
              />
            )}
          </Card>
        )}

        {/* ── Bottom Prompts ── */}
        <View style={styles.bottomPromptsContainer}>
          {activeTab === 'account' ? (
            <View style={styles.registerPrompt}>
              <Text style={styles.registerText}>{t('auth.staffPrompt')}</Text>
              <Pressable onPress={() => setActiveTab('invitationCode')}>
                <Text style={styles.registerLink}>{t('auth.claimInvite')}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.registerPrompt}>
              <Text style={styles.registerText}>{t('auth.alreadyHaveAccount')}</Text>
              <Pressable onPress={() => setActiveTab('account')}>
                <Text style={styles.registerLink}>{t('auth.signInButton')}</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.registerPrompt}>
            <Text style={styles.registerText}>{t('auth.dontHaveAccount')}</Text>
            <Pressable onPress={() => router.push('/register' as any)}>
              <Text style={styles.registerLink}>{t('auth.registerNow')}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  brandCard: {
    backgroundColor: '#064e3b',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  brandIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandTag: {
    fontSize: 12,
    color: '#a7f3d0',
    marginTop: 2,
  },
  tabSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral.borderLight,
    borderRadius: Radius.lg,
    padding: 3,
    gap: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radius.md,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    ...Shadows.sm,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  tabButtonTextActive: {
    color: Colors.brand.primary,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.critical.light,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.critical.light,
  },
  errorText: {
    ...Typography.body,
    color: Colors.critical.dark,
    flex: 1,
    fontSize: 13,
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
    marginBottom: Spacing.sm,
  },
  successText: {
    fontSize: 13,
    color: Colors.brand.dark,
    fontWeight: '600',
  },
  formCard: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    backgroundColor: Colors.neutral.card,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    gap: Spacing.md,
  },
  formHeaderRow: {
    marginBottom: 2,
  },
  formTitle: {
    ...Typography.body,
    color: Colors.neutral.textSecondary,
    fontSize: 13,
  },
  staffHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  staffIconCircle: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCardHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  formCardSub: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  forgotPasswordLink: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.brand.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    paddingHorizontal: Spacing.md,
    height: 48,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.neutral.textPrimary,
    height: '100%',
  },
  codeInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.neutral.textPrimary,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  subTextInput: {
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.neutral.surface,
    paddingHorizontal: Spacing.md,
    height: 44,
    fontSize: 14,
    color: Colors.neutral.textPrimary,
  },
  quickRoleCard: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Colors.neutral.borderLight,
  },
  quickRoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickRoleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quickRoleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  quickRoleList: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.borderLight,
  },
  quickRoleSub: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    marginBottom: Spacing.sm,
  },
  quickRolePillsGrid: {
    gap: Spacing.xs,
  },
  quickRolePill: {
    backgroundColor: Colors.neutral.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: 2,
  },
  quickRolePillActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.subtle,
  },
  quickRolePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickRoleName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  quickRoleEmail: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
  },
  validatedCard: {
    backgroundColor: '#f8fafc',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.brand.light,
    padding: Spacing.md,
    marginVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  previewIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewSubTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.brand.dark,
    textTransform: 'uppercase',
  },
  previewStoreName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  previewDivider: {
    height: 1,
    backgroundColor: Colors.neutral.border,
    marginVertical: 4,
  },
  previewDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  previewLabel: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
  },
  previewValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  staffFieldsGroup: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
  },
  previewActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  bottomPromptsContainer: {
    gap: 2,
    marginTop: Spacing.xs,
  },
  registerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 4,
  },
  registerText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.neutral.textSecondary,
  },
  registerLink: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  pressed: {
    opacity: 0.8,
  },
});

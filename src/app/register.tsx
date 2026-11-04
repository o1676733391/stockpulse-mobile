import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DesktopAccessNotice } from '@/components/ui/desktop-access-notice';
import { VectorIcon } from '@/components/ui/icons';
import { LanguageQuickBar } from '@/components/ui/language-quick-bar';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { setLanguageFromCodeOrLabel, SupportedLanguage } from '@/i18n';
import { useI18n } from '@/i18n/I18nContext';
import { settingsService } from '@/services/settingsService';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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

type ScheduleId = 'daily' | 'weekly' | 'monthly' | 'quarterly';

interface TeamInvite {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'staff' | 'supervisor' | 'auditor';
}

const COUNTRIES = [
  { code: 'DE', labelDe: 'Deutschland', labelEn: 'Germany' },
  { code: 'AT', labelDe: 'Österreich', labelEn: 'Austria' },
  { code: 'CH', labelDe: 'Schweiz', labelEn: 'Switzerland' },
  { code: 'FR', labelDe: 'Frankreich', labelEn: 'France' },
  { code: 'IT', labelDe: 'Italien', labelEn: 'Italy' },
  { code: 'GB', labelDe: 'Vereinigtes Königreich', labelEn: 'United Kingdom' },
  { code: 'US', labelDe: 'Vereinigte Staaten', labelEn: 'United States' },
];

const CURRENCIES = [
  { code: 'EUR', label: 'EUR (€)' },
  { code: 'USD', label: 'USD ($)' },
  { code: 'GBP', label: 'GBP (£)' },
  { code: 'CHF', label: 'CHF (CHF)' },
];

const LANGUAGES: Array<{ code: SupportedLanguage; label: string }> = [
  { code: 'de', label: 'Deutsch (German)' },
  { code: 'en', label: 'English (Englisch)' },
  { code: 'fr', label: 'Français (French)' },
  { code: 'es', label: 'Español (Spanish)' },
  { code: 'it', label: 'Italiano (Italian)' },
];

const TIMEZONES = [
  { code: 'Europe/Berlin', label: 'Europe/Berlin (UTC+1)' },
  { code: 'Europe/Vienna', label: 'Europe/Vienna (UTC+1)' },
  { code: 'Europe/Zurich', label: 'Europe/Zurich (UTC+1)' },
  { code: 'Europe/Paris', label: 'Europe/Paris (UTC+1)' },
  { code: 'Europe/London', label: 'Europe/London (UTC+0)' },
  { code: 'America/New_York', label: 'America/New York (UTC-5)' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { register, registerRestaurant } = useAuth();
  const [registrationType, setRegistrationType] = React.useState('RESTAURANT');
  const { t, language: appLanguage, setLanguage: setAppLanguage } = useI18n();

  const [step, setStep] = useState(0);

  // Step 0: Restaurant Information
  const [storeName, setStoreName] = useState('');
  const [country, setCountry] = useState(appLanguage === 'de' ? 'Deutschland' : 'Germany');
  const [currency, setCurrency] = useState('EUR');
  const [languageLabel, setLanguageLabel] = useState(
    LANGUAGES.find((l) => l.code === appLanguage)?.label || 'Deutsch (German)'
  );
  const [timezone, setTimezone] = useState('Europe/Berlin');

  // Keep languageLabel & country synced when global appLanguage changes (e.g. via LanguageQuickBar)
  useEffect(() => {
    const found = LANGUAGES.find((l) => l.code === appLanguage);
    if (found) {
      setLanguageLabel(found.label);
    }
    setCountry((prev) => {
      const matched = COUNTRIES.find((c) => c.labelDe === prev || c.labelEn === prev);
      return matched ? (appLanguage === 'de' ? matched.labelDe : matched.labelEn) : prev;
    });
  }, [appLanguage]);

  // Step 1: Inventory Preferences
  const [schedule, setSchedule] = useState<ScheduleId>('daily');

  // Step 2: Administrator Account
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 3: Invite Team
  const [teamMembers, setTeamMembers] = useState<TeamInvite[]>([
    { id: '1', name: 'Marco Bauer', email: 'marco@restaurant.de', role: 'manager' },
    { id: '2', name: 'Lena Fischer', email: 'lena@restaurant.de', role: 'staff' },
  ]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'manager' | 'staff' | 'supervisor' | 'auditor'>('staff');

  // Modal pickers
  const [pickerType, setPickerType] = useState<'country' | 'currency' | 'language' | 'timezone' | null>(null);

  // Flow State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailNeedsVerification, setEmailNeedsVerification] = useState(false);

  const STEPS = useMemo(
    () => [
      t('registerWizard.steps.restaurant'),
      t('registerWizard.steps.inventory'),
      t('registerWizard.steps.admin'),
      t('registerWizard.steps.team'),
      t('registerWizard.steps.done'),
    ],
    [t]
  );

  const SCHEDULE_OPTIONS: { id: ScheduleId; label: string; desc: string; badge?: string }[] = useMemo(
    () => [
      {
        id: 'daily',
        label: t('registerWizard.schedules.daily.label'),
        badge: t('registerWizard.schedules.daily.badge'),
        desc: t('registerWizard.schedules.daily.desc'),
      },
      {
        id: 'weekly',
        label: t('registerWizard.schedules.weekly.label'),
        desc: t('registerWizard.schedules.weekly.desc'),
      },
      {
        id: 'monthly',
        label: t('registerWizard.schedules.monthly.label'),
        desc: t('registerWizard.schedules.monthly.desc'),
      },
      {
        id: 'quarterly',
        label: t('registerWizard.schedules.quarterly.label'),
        desc: t('registerWizard.schedules.quarterly.desc'),
      },
    ],
    [t]
  );

  const isPasswordValid =
    adminPassword.length >= 8 &&
    /[A-Z]/.test(adminPassword) &&
    /[a-z]/.test(adminPassword) &&
    /[0-9]/.test(adminPassword);

  const canContinue =
    registrationType === 'STAFF_INVITATION'
      ? adminName.trim().length >= 2 &&
        adminEmail.trim().includes('@') &&
        isPasswordValid
      : step === 0
      ? storeName.trim().length >= 2
      : step === 1
      ? true
      : step === 2
      ? adminName.trim().length >= 2 &&
        adminEmail.trim().includes('@') &&
        isPasswordValid
      : step === 3
      ? true
      : true;

  const handleSelectLanguage = (code: SupportedLanguage, label: string) => {
    setLanguageLabel(label);
    setAppLanguage(code);
    setLanguageFromCodeOrLabel(code);
    void settingsService.updateStoreSettings({ language: label });
    setPickerType(null);
  };

  const handleAddMember = () => {
    if (!newMemberName.trim() || !newMemberEmail.trim() || !newMemberEmail.includes('@')) {
      return;
    }
    const newMember: TeamInvite = {
      id: Date.now().toString(),
      name: newMemberName.trim(),
      email: newMemberEmail.trim().toLowerCase(),
      role: newMemberRole,
    };
    setTeamMembers((prev) => [...prev, newMember]);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberRole('staff');
    setShowInviteModal(false);
  };

  const handleRemoveMember = (id: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleNext = async () => {
    if (loading) return;
    setErrorMsg(null);

    // Ensure selected language is persisted continuously
    setLanguageFromCodeOrLabel(appLanguage);

    if (registrationType === 'STAFF_INVITATION') {
      try {
        setLoading(true);
        const res = await register(
          adminName.trim(),
          adminEmail.trim().toLowerCase(),
          adminPassword,
          undefined,
          adminPhone.trim() || undefined,
          'staff'
        );

        if (res.emailNeedsVerification) {
          router.push('/verify-email' as any);
        } else {
          router.replace('/onboarding' as any);
        }
      } catch (err: any) {
        setErrorMsg(err.message || t('errors.serverError'));
      } finally {
        setLoading(false);
      }
      return;
    }

    // If moving from Step 3 (Team) to Step 4 (Done), execute backend onboarding & auth registration
    if (step === 3) {
      try {
        setLoading(true);
        const res = await registerRestaurant({
          storeName: storeName.trim(),
          country,
          currency,
          language: appLanguage,
          timezone,
          countSchedule: schedule,
          adminName: adminName.trim(),
          adminEmail: adminEmail.trim().toLowerCase(),
          adminPassword,
          adminPhone: adminPhone.trim() || undefined,
          invitedMembers: teamMembers.map((m) => ({
            name: m.name,
            email: m.email,
            role: m.role,
          })),
        });

        setEmailNeedsVerification(res.emailNeedsVerification);
        setStep(4);
      } catch (err: any) {
        setErrorMsg(err.message || t('errors.serverError'));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === 4) {
      if (emailNeedsVerification) {
        router.push('/verify-email' as any);
      } else {
        router.replace('/(tabs)' as any);
      }
      return;
    }

    setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0 && step < 4) {
      setStep((s) => s - 1);
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Top Header Bar ── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.sm,
            borderBottomColor: Colors.neutral.border,
          },
        ]}
      >
        <View style={styles.headerTopRow}>
          {step < 4 ? (
            <Pressable onPress={handleBack} style={styles.backBtn}>
              <VectorIcon name="ArrowLeft" size={18} color={Colors.brand.primary} />
              <Text style={styles.backText}>
                {step === 0 ? t('common.cancel') : t('common.back')}
              </Text>
            </Pressable>
          ) : (
            <View style={{ width: 60 }} />
          )}

          <Text style={styles.headerTitleText}>{t('common.appName')}</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <LanguageQuickBar compact />
            {step < 4 && (
              <Pressable onPress={() => router.push('/login' as any)}>
                <Text style={styles.skipText}>{t('auth.signInButton')}</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Progress Indicator */}
        {registrationType === 'RESTAURANT' ? (
          <View style={styles.progressContainer}>
            <View style={styles.stepDotsRow}>
              {STEPS.map((stepName, idx) => (
                <React.Fragment key={stepName}>
                  <View
                    style={[
                      styles.stepDot,
                      idx <= step
                        ? { backgroundColor: Colors.brand.primary }
                        : { backgroundColor: Colors.neutral.border },
                    ]}
                  />
                  {idx < STEPS.length - 1 && (
                    <View
                      style={[
                        styles.stepLine,
                        idx < step
                          ? { backgroundColor: Colors.brand.primary }
                          : { backgroundColor: Colors.neutral.border },
                      ]}
                    />
                  )}
                </React.Fragment>
              ))}
            </View>
            <Text style={styles.stepCountText}>
              {t('registerWizard.stepOf', { step: step + 1, total: STEPS.length })}: {STEPS[step]}
            </Text>
          </View>
        ) : (
          <View style={styles.progressContainer}>
            <Text style={styles.stepCountText}>
              {t('registerWizard.staffRegistrationFlow')}
            </Text>
          </View>
        )}
      </View>

      {/* ── Error Banner ── */}
      {errorMsg && (
        <View style={[styles.errorBanner, { backgroundColor: Colors.critical.light }]}>
          <VectorIcon name="AlertCircle" size={18} color={Colors.critical.main} />
          <Text style={[styles.errorText, { color: Colors.critical.main }]}>{errorMsg}</Text>
        </View>
      )}

      {/* ── Step Content ── */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <DesktopAccessNotice compact />

        {/* ── STEP 0: Restaurant Info ── */}
        {step === 0 && (
          <View style={styles.stepBody}>
            {/* Onboarding Path Segmented Tab Selector */}
            <View style={styles.tabContainer}>
              <Pressable
                onPress={() => {
                  setRegistrationType('RESTAURANT');
                  setErrorMsg(null);
                }}
                style={[
                  styles.tabButton,
                  registrationType === 'RESTAURANT' && styles.tabButtonActive,
                ]}
              >
                <VectorIcon
                  name="Building"
                  size={16}
                  color={registrationType === 'RESTAURANT' ? Colors.brand.primary : Colors.neutral.textMuted}
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    registrationType === 'RESTAURANT' && styles.tabButtonTextActive,
                  ]}
                >
                  {t('registerWizard.createNewStore')}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setRegistrationType('STAFF_INVITATION');
                  setErrorMsg(null);
                }}
                style={[
                  styles.tabButton,
                  registrationType === 'STAFF_INVITATION' && styles.tabButtonActive,
                ]}
              >
                <VectorIcon
                  name="KeyRound"
                  size={16}
                  color={registrationType === 'STAFF_INVITATION' ? Colors.brand.primary : Colors.neutral.textMuted}
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    registrationType === 'STAFF_INVITATION' && styles.tabButtonTextActive,
                  ]}
                >
                  {t('registerWizard.joinExistingStore')}
                </Text>
              </Pressable>
            </View>

            {registrationType === 'RESTAURANT' ? (
              <>
                <View style={styles.stepTitleBox}>
                  <Text style={styles.stepMainTitle}>{t('registerWizard.step2Title')}</Text>
                  <Text style={styles.stepSubTitle}>{t('registerWizard.step2Sub')}</Text>
                </View>

                {/* Highlighted Language Selector right at the top so language applies immediately & continuously */}
                <Pressable
                  onPress={() => setPickerType('language')}
                  style={[styles.selectRow, { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.subtle }]}
                >
                  <View style={styles.selectLeft}>
                    <VectorIcon name="Languages" size={18} color={Colors.brand.primary} />
                    <Text style={[styles.selectLabel, { color: Colors.brand.dark }]}>
                      {t('registerWizard.systemLanguage')}
                    </Text>
                  </View>
                  <View style={styles.selectRight}>
                    <Text style={[styles.selectValue, { color: Colors.brand.dark, fontWeight: '700' }]}>
                      {languageLabel.split(' ')[0]}
                    </Text>
                    <VectorIcon name="ChevronRight" size={16} color={Colors.brand.primary} />
                  </View>
                </Pressable>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t('registerWizard.businessName')}</Text>
                  <View style={styles.inputBox}>
                    <VectorIcon name="Store" size={18} color={Colors.neutral.textMuted} />
                    <TextInput
                      value={storeName}
                      onChangeText={setStoreName}
                      placeholder={t('registerWizard.businessNamePlaceholder')}
                      placeholderTextColor={Colors.neutral.textMuted}
                      style={styles.textInput}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <Pressable
                  onPress={() => setPickerType('country')}
                  style={styles.selectRow}
                >
                  <View style={styles.selectLeft}>
                    <VectorIcon name="Globe" size={18} color={Colors.neutral.textMuted} />
                    <Text style={styles.selectLabel}>{t('registerWizard.country')}</Text>
                  </View>
                  <View style={styles.selectRight}>
                    <Text style={styles.selectValue}>{country}</Text>
                    <VectorIcon name="ChevronRight" size={16} color={Colors.neutral.textMuted} />
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setPickerType('currency')}
                  style={styles.selectRow}
                >
                  <View style={styles.selectLeft}>
                    <VectorIcon name="Coins" size={18} color={Colors.neutral.textMuted} />
                    <Text style={styles.selectLabel}>{t('registerWizard.currency')}</Text>
                  </View>
                  <View style={styles.selectRight}>
                    <Text style={styles.selectValue}>{currency}</Text>
                    <VectorIcon name="ChevronRight" size={16} color={Colors.neutral.textMuted} />
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setPickerType('timezone')}
                  style={styles.selectRow}
                >
                  <View style={styles.selectLeft}>
                    <VectorIcon name="Clock" size={18} color={Colors.neutral.textMuted} />
                    <Text style={styles.selectLabel}>{t('registerWizard.timezone')}</Text>
                  </View>
                  <View style={styles.selectRight}>
                    <Text style={styles.selectValue}>{timezone}</Text>
                    <VectorIcon name="ChevronRight" size={16} color={Colors.neutral.textMuted} />
                  </View>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.stepTitleBox}>
                  <Text style={styles.stepMainTitle}>
                    {t('registerWizard.staffRegistrationTitle')}
                  </Text>
                  <Text style={styles.stepSubTitle}>
                    {t('registerWizard.staffRegistrationSub')}
                  </Text>
                </View>

                <Card style={styles.roleCard}>
                  <View style={styles.roleHeaderRow}>
                    <Badge variant="green">{t('team.roles.staff')}</Badge>
                  </View>
                  <Text style={styles.roleDesc}>
                    {t('registerWizard.staffAccountDesc')}
                  </Text>
                </Card>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t('registerWizard.fullName')}</Text>
                  <View style={styles.inputBox}>
                    <VectorIcon name="User" size={18} color={Colors.neutral.textMuted} />
                    <TextInput
                      value={adminName}
                      onChangeText={setAdminName}
                      placeholder={t('registerWizard.fullNamePlaceholder')}
                      placeholderTextColor={Colors.neutral.textMuted}
                      style={styles.textInput}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t('registerWizard.workEmail')}</Text>
                  <View style={styles.inputBox}>
                    <VectorIcon name="Mail" size={18} color={Colors.neutral.textMuted} />
                    <TextInput
                      value={adminEmail}
                      onChangeText={setAdminEmail}
                      placeholder={t('registerWizard.workEmailPlaceholder')}
                      placeholderTextColor={Colors.neutral.textMuted}
                      style={styles.textInput}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t('registerWizard.phone')}</Text>
                  <View style={styles.inputBox}>
                    <VectorIcon name="Phone" size={18} color={Colors.neutral.textMuted} />
                    <TextInput
                      value={adminPhone}
                      onChangeText={setAdminPhone}
                      placeholder={t('registerWizard.phonePlaceholder')}
                      placeholderTextColor={Colors.neutral.textMuted}
                      style={styles.textInput}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    {t('registerWizard.passwordRules')}
                  </Text>
                  <View style={styles.inputBox}>
                    <VectorIcon name="Lock" size={18} color={Colors.neutral.textMuted} />
                    <TextInput
                      value={adminPassword}
                      onChangeText={setAdminPassword}
                      placeholder={t('registerWizard.passwordPlaceholder')}
                      placeholderTextColor={Colors.neutral.textMuted}
                      secureTextEntry={!showPassword}
                      style={styles.textInput}
                      autoCapitalize="none"
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      <VectorIcon
                        name={showPassword ? 'EyeOff' : 'Eye'}
                        size={18}
                        color={Colors.neutral.textMuted}
                      />
                    </Pressable>
                  </View>
                  {adminPassword.length > 0 && !isPasswordValid && (
                    <Text style={styles.passwordHint}>
                      {t('registerWizard.passwordErrorHint')}
                    </Text>
                  )}
                </View>
              </>
            )}
          </View>
        )}

        {/* ── STEP 1: Inventory Preferences ── */}
        {step === 1 && (
          <View style={styles.stepBody}>
            <View style={styles.stepTitleBox}>
              <Text style={styles.stepMainTitle}>
                {t('registerWizard.inventoryPreferencesTitle')}
              </Text>
              <Text style={styles.stepSubTitle}>
                {t('registerWizard.inventoryPreferencesSub')}
              </Text>
            </View>

            <View style={styles.scheduleList}>
              {SCHEDULE_OPTIONS.map((opt) => {
                const isSelected = schedule === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setSchedule(opt.id)}
                    style={[
                      styles.scheduleCard,
                      isSelected && styles.scheduleCardSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInnerDot} />}
                    </View>

                    <View style={styles.scheduleInfo}>
                      <View style={styles.scheduleHeaderRow}>
                        <Text style={styles.scheduleLabel}>{opt.label}</Text>
                        {opt.badge && (
                          <Badge variant="green">{opt.badge}</Badge>
                        )}
                      </View>
                      <Text style={styles.scheduleDesc}>{opt.desc}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* ── STEP 2: Administrator Account ── */}
        {step === 2 && (
          <View style={styles.stepBody}>
            <View style={styles.stepTitleBox}>
              <Text style={styles.stepMainTitle}>
                {t('registerWizard.adminAccountTitle')}
              </Text>
              <Text style={styles.stepSubTitle}>
                {t('registerWizard.adminAccountSub')}
              </Text>
            </View>

            <Card style={styles.roleCard}>
              <View style={styles.roleHeaderRow}>
                <Badge variant="purple">{t('team.roles.admin')}</Badge>
              </View>
              <Text style={styles.roleDesc}>{t('registerWizard.roleOwnerDesc')}</Text>
            </Card>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t('registerWizard.fullName')}</Text>
              <View style={styles.inputBox}>
                <VectorIcon name="User" size={18} color={Colors.neutral.textMuted} />
                <TextInput
                  value={adminName}
                  onChangeText={setAdminName}
                  placeholder={t('registerWizard.fullNamePlaceholder')}
                  placeholderTextColor={Colors.neutral.textMuted}
                  style={styles.textInput}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t('registerWizard.workEmail')}</Text>
              <View style={styles.inputBox}>
                <VectorIcon name="Mail" size={18} color={Colors.neutral.textMuted} />
                <TextInput
                  value={adminEmail}
                  onChangeText={setAdminEmail}
                  placeholder={t('registerWizard.workEmailPlaceholder')}
                  placeholderTextColor={Colors.neutral.textMuted}
                  style={styles.textInput}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t('registerWizard.phone')}</Text>
              <View style={styles.inputBox}>
                <VectorIcon name="Phone" size={18} color={Colors.neutral.textMuted} />
                <TextInput
                  value={adminPhone}
                  onChangeText={setAdminPhone}
                  placeholder={t('registerWizard.phonePlaceholder')}
                  placeholderTextColor={Colors.neutral.textMuted}
                  style={styles.textInput}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {t('registerWizard.passwordRules')}
              </Text>
              <View style={styles.inputBox}>
                <VectorIcon name="Lock" size={18} color={Colors.neutral.textMuted} />
                <TextInput
                  value={adminPassword}
                  onChangeText={setAdminPassword}
                  placeholder={t('registerWizard.passwordPlaceholder')}
                  placeholderTextColor={Colors.neutral.textMuted}
                  secureTextEntry={!showPassword}
                  style={styles.textInput}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <VectorIcon
                    name={showPassword ? 'EyeOff' : 'Eye'}
                    size={18}
                    color={Colors.neutral.textMuted}
                  />
                </Pressable>
              </View>
              {adminPassword.length > 0 && !isPasswordValid && (
                <Text style={styles.passwordHint}>
                  {t('registerWizard.passwordErrorHint')}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* ── STEP 3: Invite Team ── */}
        {step === 3 && (
          <View style={styles.stepBody}>
            <View style={styles.stepTitleBox}>
              <Text style={styles.stepMainTitle}>
                {t('registerWizard.inviteTeamTitle')}
              </Text>
              <Text style={styles.stepSubTitle}>
                {t('registerWizard.inviteTeamSub')}
              </Text>
            </View>

            <View style={styles.teamList}>
              {teamMembers.map((member) => (
                <View key={member.id} style={styles.memberCard}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {member.name
                        .split(' ')
                        .map((p) => p[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </Text>
                  </View>

                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                  </View>

                  <View style={styles.memberActions}>
                    <Badge
                      variant={
                        member.role === 'manager'
                          ? 'blue'
                          : member.role === 'supervisor'
                          ? 'purple'
                          : 'gray'
                      }
                    >
                      {t(`team.roles.${member.role}`)}
                    </Badge>
                    <Pressable
                      onPress={() => handleRemoveMember(member.id)}
                      style={styles.removeMemberBtn}
                    >
                      <VectorIcon name="X" size={14} color={Colors.neutral.textMuted} />
                    </Pressable>
                  </View>
                </View>
              ))}

              <Pressable
                onPress={() => setShowInviteModal(true)}
                style={styles.addMemberBtn}
              >
                <VectorIcon name="UserPlus" size={18} color={Colors.brand.primary} />
                <Text style={styles.addMemberBtnText}>
                  {t('registerWizard.addAnotherMember')}
                </Text>
              </Pressable>
            </View>

            <Card style={styles.inviteNoticeCard}>
              <Text style={styles.inviteNoticeText}>
                {t('registerWizard.inviteNotice')}
              </Text>
            </Card>
          </View>
        )}

        {/* ── STEP 4: Restaurant Ready ── */}
        {step === 4 && (
          <View style={styles.readyContainer}>
            <View style={styles.readyIconBox}>
              <VectorIcon name="CheckCircle" size={48} color={Colors.brand.primary} />
            </View>

            <Text style={styles.readyTitle}>
              {t('registerWizard.restaurantReady', {
                name: storeName || (appLanguage === 'de' ? 'Ihr Betrieb' : 'Your Restaurant'),
              })}
            </Text>
            <Text style={styles.readySub}>
              {t('registerWizard.restaurantReadySub')}
            </Text>

            <View style={styles.checklistCard}>
              <View style={styles.checkItem}>
                <VectorIcon name="Check" size={16} color={Colors.brand.primary} />
                <Text style={styles.checkText}>
                  {t('registerWizard.workspaceSaved', { lang: languageLabel })}
                </Text>
              </View>

              <View style={styles.checkItem}>
                <VectorIcon name="Check" size={16} color={Colors.brand.primary} />
                <Text style={styles.checkText}>
                  {t('registerWizard.scheduleActivated')}
                </Text>
              </View>

              <View style={styles.checkItem}>
                <VectorIcon name="Check" size={16} color={Colors.brand.primary} />
                <Text style={styles.checkText}>
                  {t('registerWizard.adminCreated', { email: adminEmail })}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Fixed Bottom Bar ── */}
      <View
        style={[
          styles.fixedFooter,
          {
            paddingBottom: insets.bottom > 0 ? insets.bottom + Spacing.sm : Spacing.lg,
          },
        ]}
      >
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canContinue || loading}
          onPress={handleNext}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View style={styles.btnInner}>
              <Text style={styles.btnInnerText}>
                {registrationType === 'STAFF_INVITATION'
                  ? t('registerWizard.signUpAndJoin')
                  : step === 4
                  ? t('registerWizard.goToDashboard')
                  : step === 3
                  ? t('registerWizard.completeButton')
                  : t('registerWizard.continueButton')}
              </Text>
              <VectorIcon name="ArrowRight" size={18} color="#fff" />
            </View>
          )}
        </Button>
      </View>

      {/* ── Add Member Modal ── */}
      <Modal visible={showInviteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('registerWizard.inviteModalTitle')}
              </Text>
              <Pressable onPress={() => setShowInviteModal(false)}>
                <VectorIcon name="X" size={20} color={Colors.neutral.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t('registerWizard.fullName')}</Text>
              <View style={styles.inputBox}>
                <TextInput
                  value={newMemberName}
                  onChangeText={setNewMemberName}
                  placeholder="z. B. Maria Rossi"
                  placeholderTextColor={Colors.neutral.textMuted}
                  style={styles.textInput}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t('registerWizard.workEmail')}</Text>
              <View style={styles.inputBox}>
                <TextInput
                  value={newMemberEmail}
                  onChangeText={setNewMemberEmail}
                  placeholder="maria@restaurant.de"
                  placeholderTextColor={Colors.neutral.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.textInput}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t('registerWizard.yourRole')}</Text>
              <View style={styles.roleSelectRow}>
                {(['manager', 'supervisor', 'staff', 'auditor'] as const).map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => setNewMemberRole(r)}
                    style={[
                      styles.roleChoiceBtn,
                      newMemberRole === r && styles.roleChoiceBtnSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleChoiceText,
                        newMemberRole === r && styles.roleChoiceTextSelected,
                      ]}
                    >
                      {t(`team.roles.${r}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Button
              variant="primary"
              size="md"
              fullWidth
              onPress={handleAddMember}
              style={{ marginTop: 16 }}
            >
              {t('registerWizard.addToInvites')}
            </Button>
          </View>
        </View>
      </Modal>

      {/* ── Selection Pickers Modal ── */}
      <Modal visible={pickerType !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {pickerType === 'country'
                  ? t('registerWizard.country')
                  : pickerType === 'currency'
                  ? t('registerWizard.currency')
                  : pickerType === 'language'
                  ? t('registerWizard.systemLanguage')
                  : t('registerWizard.timezone')}
              </Text>
              <Pressable onPress={() => setPickerType(null)}>
                <VectorIcon name="X" size={20} color={Colors.neutral.textPrimary} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {pickerType === 'country' &&
                COUNTRIES.map((c) => {
                  const label = appLanguage === 'de' ? c.labelDe : c.labelEn;
                  return (
                    <Pressable
                      key={c.code}
                      onPress={() => {
                        setCountry(label);
                        setPickerType(null);
                      }}
                      style={styles.pickerOption}
                    >
                      <Text style={styles.pickerOptionText}>{label}</Text>
                      {country === label && (
                        <VectorIcon name="Check" size={16} color={Colors.brand.primary} />
                      )}
                    </Pressable>
                  );
                })}

              {pickerType === 'currency' &&
                CURRENCIES.map((c) => (
                  <Pressable
                    key={c.code}
                    onPress={() => {
                      setCurrency(c.code);
                      setPickerType(null);
                    }}
                    style={styles.pickerOption}
                  >
                    <Text style={styles.pickerOptionText}>{c.label}</Text>
                    {currency === c.code && (
                      <VectorIcon name="Check" size={16} color={Colors.brand.primary} />
                    )}
                  </Pressable>
                ))}

              {pickerType === 'language' &&
                LANGUAGES.map((l) => (
                  <Pressable
                    key={l.code}
                    onPress={() => handleSelectLanguage(l.code, l.label)}
                    style={styles.pickerOption}
                  >
                    <Text style={styles.pickerOptionText}>{l.label}</Text>
                    {appLanguage === l.code && (
                      <VectorIcon name="Check" size={16} color={Colors.brand.primary} />
                    )}
                  </Pressable>
                ))}

              {pickerType === 'timezone' &&
                TIMEZONES.map((tz) => (
                  <Pressable
                    key={tz.code}
                    onPress={() => {
                      setTimezone(tz.code);
                      setPickerType(null);
                    }}
                    style={styles.pickerOption}
                  >
                    <Text style={styles.pickerOptionText}>{tz.label}</Text>
                    {timezone === tz.code && (
                      <VectorIcon name="Check" size={16} color={Colors.brand.primary} />
                    )}
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  tabButtonActive: {
    backgroundColor: '#fff',
    ...Shadows.sm,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textMuted,
    flexShrink: 1,
    textAlign: 'center',
  },
  tabButtonTextActive: {
    color: Colors.neutral.textPrimary,
  },
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.brand.primary,
  },
  headerTitleText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.brand.primary,
  },
  progressContainer: {
    alignItems: 'center',
    gap: 8,
  },
  stepDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepLine: {
    flex: 1,
    height: 2,
  },
  stepCountText: {
    fontSize: 12,
    color: Colors.neutral.textMuted,
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    borderRadius: Radius.md,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  stepBody: {
    gap: Spacing.lg,
  },
  stepTitleBox: {
    gap: 4,
    marginBottom: Spacing.xs,
  },
  stepMainTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  stepSubTitle: {
    fontSize: 14,
    color: Colors.neutral.textSecondary,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.neutral.textPrimary,
  },
  eyeBtn: {
    padding: 4,
  },
  passwordHint: {
    fontSize: 12,
    color: Colors.critical.main,
    marginTop: 4,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  selectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  selectLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
    flexShrink: 1,
  },
  selectRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectValue: {
    fontSize: 14,
    color: Colors.neutral.textSecondary,
  },
  scheduleList: {
    gap: Spacing.md,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: Spacing.lg,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.xl,
  },
  scheduleCardSelected: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.primaryLight,
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
    backgroundColor: Colors.brand.primary,
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  scheduleInfo: {
    flex: 1,
    gap: 4,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  scheduleDesc: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
    lineHeight: 18,
  },
  roleCard: {
    backgroundColor: '#F5F3FF',
    borderColor: '#E9D5FF',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: 8,
  },
  roleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleDesc: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
    lineHeight: 18,
  },
  teamList: {
    gap: Spacing.md,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: Spacing.md,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.lg,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  memberEmail: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeMemberBtn: {
    padding: 4,
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.brand.primary,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    backgroundColor: Colors.brand.primaryLight,
  },
  addMemberBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  inviteNoticeCard: {
    backgroundColor: Colors.neutral.surface,
    padding: Spacing.md,
  },
  inviteNoticeText: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    lineHeight: 18,
  },
  readyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.lg,
  },
  readyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.brand.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    textAlign: 'center',
  },
  readySub: {
    fontSize: 14,
    color: Colors.neutral.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  checklistCard: {
    width: '100%',
    backgroundColor: Colors.brand.primaryLight,
    borderWidth: 1,
    borderColor: Colors.brand.primary,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: 12,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
    flex: 1,
  },
  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnInnerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.xs,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  roleSelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleChoiceBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    backgroundColor: '#fff',
  },
  roleChoiceBtnSelected: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.primaryLight,
  },
  roleChoiceText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.neutral.textSecondary,
  },
  roleChoiceTextSelected: {
    color: Colors.brand.primary,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
  },
  pickerOptionText: {
    fontSize: 15,
    color: Colors.neutral.textPrimary,
    fontWeight: '500',
  },
});

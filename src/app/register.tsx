import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
  { code: 'DE', label: 'Germany' },
  { code: 'AT', label: 'Austria' },
  { code: 'CH', label: 'Switzerland' },
  { code: 'FR', label: 'France' },
  { code: 'IT', label: 'Italy' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'US', label: 'United States' },
];

const CURRENCIES = [
  { code: 'EUR', label: 'EUR (€)' },
  { code: 'USD', label: 'USD ($)' },
  { code: 'GBP', label: 'GBP (£)' },
  { code: 'CHF', label: 'CHF (CHF)' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'German (Deutsch)' },
  { code: 'fr', label: 'French (Français)' },
  { code: 'it', label: 'Italian (Italiano)' },
];

const TIMEZONES = [
  { code: 'Europe/Berlin', label: 'Europe/Berlin (UTC+1)' },
  { code: 'Europe/Vienna', label: 'Europe/Vienna (UTC+1)' },
  { code: 'Europe/Zurich', label: 'Europe/Zurich (UTC+1)' },
  { code: 'Europe/Paris', label: 'Europe/Paris (UTC+1)' },
  { code: 'Europe/London', label: 'Europe/London (UTC+0)' },
  { code: 'America/New_York', label: 'America/New York (UTC-5)' },
];

const SCHEDULE_OPTIONS: { id: ScheduleId; label: string; desc: string; badge?: string }[] = [
  { id: 'daily', label: 'Daily', badge: 'Recommended', desc: 'Best for high-volume kitchens — count every day' },
  { id: 'weekly', label: 'Weekly', desc: 'Count every week — suitable for most restaurants' },
  { id: 'monthly', label: 'Monthly', desc: 'Full monthly inventory — lower frequency operations' },
  { id: 'quarterly', label: 'Quarterly', desc: 'Quarterly audit — for low-turnover inventory' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { register, registerRestaurant } = useAuth();
  const [registrationType, setRegistrationType] = React.useState('RESTAURANT');
  const { t } = useI18n();

  const [step, setStep] = useState(0);

  // Step 0: Restaurant Information
  const [storeName, setStoreName] = useState('');
  const [country, setCountry] = useState('Germany');
  const [currency, setCurrency] = useState('EUR');
  const [language, setLanguage] = useState('English');
  const [timezone, setTimezone] = useState('Europe/Berlin');

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

  const STEPS = ['Restaurant', 'Inventory', 'Admin', 'Team', 'Done'];

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
        setErrorMsg(err.message || 'Failed to register account');
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
          language,
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
        setErrorMsg(err.message || 'Failed to complete restaurant onboarding');
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
              <Text style={styles.backText}>{step === 0 ? 'Cancel' : 'Back'}</Text>
            </Pressable>
          ) : (
            <View style={{ width: 60 }} />
          )}

          <Text style={styles.headerTitleText}>StockPulse</Text>

          {step < 4 ? (
            <Pressable onPress={() => router.push('/login' as any)}>
              <Text style={styles.skipText}>Sign In</Text>
            </Pressable>
          ) : (
            <View style={{ width: 60 }} />
          )}
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
              Step {step + 1} of {STEPS.length}: {STEPS[step]}
            </Text>
          </View>
        ) : (
          <View style={styles.progressContainer}>
            <Text style={styles.stepCountText}>
              Staff Registration Flow
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
                  Create New Store
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
                  Join Existing Store
                </Text>
              </Pressable>
            </View>

            {registrationType === 'RESTAURANT' ? (
              <>
                <View style={styles.stepTitleBox}>
                  <Text style={styles.stepMainTitle}>Restaurant Information</Text>
                  <Text style={styles.stepSubTitle}>Tell us about your kitchen & store to get started</Text>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Store / Restaurant Name *</Text>
                  <View style={styles.inputBox}>
                    <VectorIcon name="Store" size={18} color={Colors.neutral.textMuted} />
                    <TextInput
                      value={storeName}
                      onChangeText={setStoreName}
                      placeholder="e.g. Bella Cucina Restaurant"
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
                    <Text style={styles.selectLabel}>Country</Text>
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
                    <Text style={styles.selectLabel}>Operating Currency</Text>
                  </View>
                  <View style={styles.selectRight}>
                    <Text style={styles.selectValue}>{currency}</Text>
                    <VectorIcon name="ChevronRight" size={16} color={Colors.neutral.textMuted} />
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setPickerType('language')}
                  style={styles.selectRow}
                >
                  <View style={styles.selectLeft}>
                    <VectorIcon name="Languages" size={18} color={Colors.neutral.textMuted} />
                    <Text style={styles.selectLabel}>Language</Text>
                  </View>
                  <View style={styles.selectRight}>
                    <Text style={styles.selectValue}>{language}</Text>
                    <VectorIcon name="ChevronRight" size={16} color={Colors.neutral.textMuted} />
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setPickerType('timezone')}
                  style={styles.selectRow}
                >
                  <View style={styles.selectLeft}>
                    <VectorIcon name="Clock" size={18} color={Colors.neutral.textMuted} />
                    <Text style={styles.selectLabel}>Time Zone</Text>
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
                  <Text style={styles.stepMainTitle}>Staff Registration</Text>
                  <Text style={styles.stepSubTitle}>Create your personal account to join an existing kitchen</Text>
                </View>

                <Card style={styles.roleCard}>
                  <View style={styles.roleHeaderRow}>
                    <Badge variant="green">Store Staff</Badge>
                  </View>
                  <Text style={styles.roleDesc}>
                    Register your work account here. Once registered, you'll be prompted to enter your staff invitation code to join your restaurant.
                  </Text>
                </Card>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Full Name *</Text>
                  <View style={styles.inputBox}>
                    <VectorIcon name="User" size={18} color={Colors.neutral.textMuted} />
                    <TextInput
                      value={adminName}
                      onChangeText={setAdminName}
                      placeholder="e.g. Elena Cook"
                      placeholderTextColor={Colors.neutral.textMuted}
                      style={styles.textInput}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Work Email *</Text>
                  <View style={styles.inputBox}>
                    <VectorIcon name="Mail" size={18} color={Colors.neutral.textMuted} />
                    <TextInput
                      value={adminEmail}
                      onChangeText={setAdminEmail}
                      placeholder="cook@restaurant.com"
                      placeholderTextColor={Colors.neutral.textMuted}
                      style={styles.textInput}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Phone Number (Optional)</Text>
                  <View style={styles.inputBox}>
                    <VectorIcon name="Phone" size={18} color={Colors.neutral.textMuted} />
                    <TextInput
                      value={adminPhone}
                      onChangeText={setAdminPhone}
                      placeholder="+49 30 1234567"
                      placeholderTextColor={Colors.neutral.textMuted}
                      style={styles.textInput}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Password (min 8 chars, A-Z, 0-9) *</Text>
                  <View style={styles.inputBox}>
                    <VectorIcon name="Lock" size={18} color={Colors.neutral.textMuted} />
                    <TextInput
                      value={adminPassword}
                      onChangeText={setAdminPassword}
                      placeholder="Min. 8 characters"
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
                      Password must be at least 8 characters and include uppercase, lowercase, and numbers.
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
              <Text style={styles.stepMainTitle}>Inventory Preferences</Text>
              <Text style={styles.stepSubTitle}>Set your default stock count frequency schedule</Text>
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
              <Text style={styles.stepMainTitle}>Administrator Account</Text>
              <Text style={styles.stepSubTitle}>Create the owner account for this store location</Text>
            </View>

            <Card style={styles.roleCard}>
              <View style={styles.roleHeaderRow}>
                <Badge variant="purple">Store Owner</Badge>
              </View>
              <Text style={styles.roleDesc}>
                The store owner has full administrator access to all features including inventory, costs, recipes, suppliers, audit logs, and team access.
              </Text>
            </Card>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full Name *</Text>
              <View style={styles.inputBox}>
                <VectorIcon name="User" size={18} color={Colors.neutral.textMuted} />
                <TextInput
                  value={adminName}
                  onChangeText={setAdminName}
                  placeholder="e.g. Gordon Ramsay"
                  placeholderTextColor={Colors.neutral.textMuted}
                  style={styles.textInput}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Work Email *</Text>
              <View style={styles.inputBox}>
                <VectorIcon name="Mail" size={18} color={Colors.neutral.textMuted} />
                <TextInput
                  value={adminEmail}
                  onChangeText={setAdminEmail}
                  placeholder="chef@restaurant.com"
                  placeholderTextColor={Colors.neutral.textMuted}
                  style={styles.textInput}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Phone Number (Optional)</Text>
              <View style={styles.inputBox}>
                <VectorIcon name="Phone" size={18} color={Colors.neutral.textMuted} />
                <TextInput
                  value={adminPhone}
                  onChangeText={setAdminPhone}
                  placeholder="+49 30 1234567"
                  placeholderTextColor={Colors.neutral.textMuted}
                  style={styles.textInput}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password (min 8 chars, A-Z, 0-9) *</Text>
              <View style={styles.inputBox}>
                <VectorIcon name="Lock" size={18} color={Colors.neutral.textMuted} />
                <TextInput
                  value={adminPassword}
                  onChangeText={setAdminPassword}
                  placeholder="Min. 8 characters"
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
                  Password must be at least 8 characters and include uppercase, lowercase, and numbers.
                </Text>
              )}
            </View>
          </View>
        )}

        {/* ── STEP 3: Invite Team ── */}
        {step === 3 && (
          <View style={styles.stepBody}>
            <View style={styles.stepTitleBox}>
              <Text style={styles.stepMainTitle}>Invite Your Team</Text>
              <Text style={styles.stepSubTitle}>Add managers, supervisors, and kitchen staff</Text>
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
                      {member.role.toUpperCase()}
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
                <Text style={styles.addMemberBtnText}>Invite another team member</Text>
              </Pressable>
            </View>

            <Card style={styles.inviteNoticeCard}>
              <Text style={styles.inviteNoticeText}>
                Team members will receive an activation email. You can also assign permissions and add more members anytime in <Text style={{ fontWeight: '700' }}>Settings → Team & Roles</Text>.
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

            <Text style={styles.readyTitle}>{storeName || 'Your Restaurant'} is ready!</Text>
            <Text style={styles.readySub}>
              Your restaurant workspace has been configured in PostgreSQL. You can start logging stock counts or scanning supplier invoices immediately.
            </Text>

            <View style={styles.checklistCard}>
              <View style={styles.checkItem}>
                <VectorIcon name="Check" size={16} color={Colors.brand.primary} />
                <Text style={styles.checkText}>Restaurant workspace & location configured</Text>
              </View>

              <View style={styles.checkItem}>
                <VectorIcon name="Check" size={16} color={Colors.brand.primary} />
                <Text style={styles.checkText}>
                  {schedule.charAt(0).toUpperCase() + schedule.slice(1)} stock count schedule activated
                </Text>
              </View>

              <View style={styles.checkItem}>
                <VectorIcon name="Check" size={16} color={Colors.brand.primary} />
                <Text style={styles.checkText}>Administrator account created ({adminEmail})</Text>
              </View>

              <View style={styles.checkItem}>
                <VectorIcon name="Check" size={16} color={Colors.brand.primary} />
                <Text style={styles.checkText}>
                  {teamMembers.length} team member invitations recorded
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
                {registrationType === 'STAFF_INVITATION' ? 'Sign Up & Join Store' : step === 4 ? 'Go to Dashboard' : step === 3 ? 'Complete & Create Restaurant' : 'Continue'}
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
              <Text style={styles.modalTitle}>Invite Team Member</Text>
              <Pressable onPress={() => setShowInviteModal(false)}>
                <VectorIcon name="X" size={20} color={Colors.neutral.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Member Full Name</Text>
              <View style={styles.inputBox}>
                <TextInput
                  value={newMemberName}
                  onChangeText={setNewMemberName}
                  placeholder="e.g. Maria Rossi"
                  placeholderTextColor={Colors.neutral.textMuted}
                  style={styles.textInput}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Work Email</Text>
              <View style={styles.inputBox}>
                <TextInput
                  value={newMemberEmail}
                  onChangeText={setNewMemberEmail}
                  placeholder="maria@restaurant.com"
                  placeholderTextColor={Colors.neutral.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.textInput}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Role</Text>
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
                      {r.toUpperCase()}
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
              Add to Invites
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
                Select{' '}
                {pickerType === 'country'
                  ? 'Country'
                  : pickerType === 'currency'
                  ? 'Currency'
                  : pickerType === 'language'
                  ? 'Language'
                  : 'Time Zone'}
              </Text>
              <Pressable onPress={() => setPickerType(null)}>
                <VectorIcon name="X" size={20} color={Colors.neutral.textPrimary} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {pickerType === 'country' &&
                COUNTRIES.map((c) => (
                  <Pressable
                    key={c.code}
                    onPress={() => {
                      setCountry(c.label);
                      setPickerType(null);
                    }}
                    style={styles.pickerOption}
                  >
                    <Text style={styles.pickerOptionText}>{c.label}</Text>
                    {country === c.label && (
                      <VectorIcon name="Check" size={16} color={Colors.brand.primary} />
                    )}
                  </Pressable>
                ))}

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
                    onPress={() => {
                      setLanguage(l.label);
                      setPickerType(null);
                    }}
                    style={styles.pickerOption}
                  >
                    <Text style={styles.pickerOptionText}>{l.label}</Text>
                    {language === l.label && (
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
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textMuted,
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
  },
  selectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
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

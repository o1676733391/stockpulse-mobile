import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { SectionHeader } from '@/components/ui/section-header';
import { TopBar } from '@/components/ui/top-bar';
import { ROLES } from '@/constants/rbac';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { settingsService } from '@/services/settingsService';
import { supabase } from '@/services/supabaseClient';
import { UserProfile } from '@/types/settings';
import { UserRole } from '@/types/rbac';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [biometrics, setBiometrics] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsService.getUserProfile();
      setProfile(data);
      setName(data.name);
      setEmail(data.email);
      setPhone(data.phone || '');
      setBiometrics(data.biometricsEnabled !== false);
    } catch (err: any) {
      setError(err?.message || 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('errors.invalidInput'), t('auth.fillAllFields'));
      return;
    }
    try {
      setSaving(true);
      const updated = await settingsService.updateUserProfile({
        name,
        phone,
        biometricsEnabled: biometrics,
      });
      setProfile(updated);
      await refreshUser();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Unable to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPass || !confirmPass) {
      Alert.alert(t('errors.invalidInput'), t('auth.fillAllFields'));
      return;
    }
    if (newPass.length < 8) {
      Alert.alert(t('errors.invalidInput'), t('auth.passwordMinLength'));
      return;
    }
    if (newPass !== confirmPass) {
      Alert.alert(t('errors.invalidInput'), 'Passwords do not match');
      return;
    }

    try {
      setChangingPass(true);
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPass,
      });

      if (updateError) {
        Alert.alert('Password Update Failed', updateError.message);
        return;
      }

      setShowPasswordModal(false);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      Alert.alert(t('common.done'), t('common.changesSaved'));
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to change password');
    } finally {
      setChangingPass(false);
    }
  };

  const biometricLabel =
    Platform.OS === 'ios'
      ? t('settings.profile.biometrics')
      : t('settings.profile.fingerprint');

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: Colors.neutral.surface, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.brand.primary} />
        <Text style={[{ marginTop: 12 }, Typography.body]}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
        <TopBar title={t('settings.profile.title')} showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <VectorIcon name="AlertCircle" size={48} color={Colors.critical.main} />
          <Text style={[Typography.cardTitle, { fontSize: 18, marginTop: 16 }]}>
            Failed to Load Profile
          </Text>
          <Text style={[Typography.bodySecondary, { textAlign: 'center', marginTop: 8 }]}>
            {error || 'Unable to connect to profile service'}
          </Text>
          <Pressable
            onPress={fetchProfile}
            style={{
              marginTop: 20,
              backgroundColor: Colors.brand.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: Radius.md,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar title={t('settings.profile.title')} showBack />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar Hero ── */}
        <View style={styles.avatarHero}>
          <View style={styles.avatarLargeCircle}>
            <Text style={styles.avatarLargeText}>{profile.avatarText}</Text>
          </View>
          <View style={styles.avatarHeroInfo}>
            <Text style={styles.heroName}>{name}</Text>
            <View style={styles.heroBadgeRow}>
              <Badge variant="purple">{t('auth.adminRole')}</Badge>
              <Text style={styles.heroStoreText}>{profile.storeName}</Text>
            </View>
          </View>
        </View>

        {/* ── Personal Info Card ── */}
        <Card style={styles.formCard}>
          <SectionHeader title={t('settings.profile.title')} />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('settings.profile.fullName')}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.textInput}
              placeholder={t('settings.profile.fullName')}
              placeholderTextColor={Colors.neutral.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('settings.profile.email')}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.textInput}
              placeholder={t('settings.profile.email')}
              placeholderTextColor={Colors.neutral.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('settings.profile.phone')}</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.textInput}
              placeholder="+49 30 1234 5678"
              placeholderTextColor={Colors.neutral.textTertiary}
            />
          </View>
        </Card>

        {/* ── Security & Authentication Card ── */}
        <Card style={styles.formCard}>
          <SectionHeader title={t('settings.groups.accountSecurity')} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>{biometricLabel}</Text>
              <Text style={styles.toggleSub}>
                {t('settings.profile.biometricsSub')}
              </Text>
            </View>
            <Switch
              value={biometrics}
              onValueChange={setBiometrics}
              trackColor={{ false: Colors.neutral.borderLight, true: Colors.brand.primary }}
            />
          </View>

          <Pressable
            onPress={() => setShowPasswordModal(true)}
            style={({ pressed }) => [styles.changePassBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="Lock" size={16} color={Colors.neutral.textPrimary} />
            <Text style={styles.changePassBtnText}>{t('auth.passwordLabel')}</Text>
            <VectorIcon name="ChevronRight" size={14} color={Colors.neutral.textTertiary} />
          </Pressable>
        </Card>

        {/* ── Role & Store Association Card ── */}
        <Card style={styles.formCard}>
          <SectionHeader title={t('team.title')} />
          <View style={styles.infoFieldRow}>
            <Text style={styles.infoFieldLabel}>{t('settings.profile.role')}</Text>
            <Badge
              variant={
                (profile.role as string) === 'admin'
                  ? 'purple'
                  : (profile.role as string) === 'manager'
                  ? 'blue'
                  : (profile.role as string) === 'supervisor'
                  ? 'amber'
                  : (profile.role as string) === 'auditor'
                  ? 'orange'
                  : 'green'
              }
            >
              {t('team.roles.' + profile.role, {
                defaultValue: ROLES[profile.role]?.label || profile.role.toUpperCase(),
              })}
            </Badge>
          </View>
          <View style={styles.infoFieldRow}>
            <Text style={styles.infoFieldLabel}>{t('settings.profile.store')}</Text>
            <Text style={styles.infoFieldValue}>{profile.storeName || user?.storeName || 'Assigned Store'}</Text>
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
          <Text style={styles.saveBtnText}>{t('settings.profile.saveChanges')}</Text>
        </Pressable>
      </View>

      {/* ── Change Password Modal ── */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalGrabber} />

            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{t('auth.passwordLabel')}</Text>
              <Pressable
                onPress={() => setShowPasswordModal(false)}
                style={styles.closeBtn}
              >
                <VectorIcon name="X" size={18} color={Colors.neutral.textTertiary} />
              </Pressable>
            </View>

            <View style={styles.modalInputsCol}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('auth.passwordLabel')}</Text>
                <TextInput
                  secureTextEntry
                  value={currentPass}
                  onChangeText={setCurrentPass}
                  placeholder={t('auth.passwordPlaceholder')}
                  placeholderTextColor={Colors.neutral.textTertiary}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('auth.passwordLabel')}</Text>
                <TextInput
                  secureTextEntry
                  value={newPass}
                  onChangeText={setNewPass}
                  placeholder={t('auth.passwordPlaceholder')}
                  placeholderTextColor={Colors.neutral.textTertiary}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('auth.passwordLabel')}</Text>
                <TextInput
                  secureTextEntry
                  value={confirmPass}
                  onChangeText={setConfirmPass}
                  placeholder={t('auth.passwordPlaceholder')}
                  placeholderTextColor={Colors.neutral.textTertiary}
                  style={styles.textInput}
                />
              </View>
            </View>

            <Pressable
              onPress={handleChangePassword}
              style={({ pressed }) => [styles.submitPasswordBtn, pressed && styles.pressed]}
            >
              <Text style={styles.submitPasswordBtnText}>{t('common.save')}</Text>
            </Pressable>
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
  avatarHero: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  avatarLargeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.brand.subtle,
    borderColor: Colors.brand.light,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  avatarLargeText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  avatarHeroInfo: {
    alignItems: 'center',
    gap: 4,
  },
  heroName: {
    ...Typography.pageTitle,
    fontSize: 18,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  heroStoreText: {
    fontSize: 12,
    color: Colors.neutral.textTertiary,
  },
  formCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  textInput: {
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 13,
    color: Colors.neutral.textPrimary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  toggleTextCol: {
    flex: 1,
    gap: 2,
    paddingRight: Spacing.md,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  toggleSub: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  changePassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  changePassBtnText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  infoFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  infoFieldLabel: {
    fontSize: 12,
    color: Colors.neutral.textTertiary,
  },
  infoFieldValue: {
    fontSize: 13,
    fontWeight: '600',
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
  modalInputsCol: {
    gap: Spacing.sm,
  },
  submitPasswordBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  submitPasswordBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});

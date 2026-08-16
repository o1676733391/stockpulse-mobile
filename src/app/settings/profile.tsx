import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { SectionHeader } from '@/components/ui/section-header';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import {
  INITIAL_USER_PROFILE,
  settingsService,
} from '@/services/settingsService';
import { UserProfile } from '@/types/settings';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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

  const [profile, setProfile] = useState<UserProfile>(() =>
    JSON.parse(JSON.stringify(INITIAL_USER_PROFILE))
  );

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [biometrics, setBiometrics] = useState(profile.biometricsEnabled);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleSave = async () => {
    const updated = await settingsService.updateUserProfile({
      name,
      email,
      phone,
      biometricsEnabled: biometrics,
    });
    setProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleChangePassword = () => {
    if (!currentPass || !newPass || !confirmPass) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }
    if (newPass !== confirmPass) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    setShowPasswordModal(false);
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    Alert.alert('Success', 'Your password has been changed successfully.');
  };

  const biometricLabel = Platform.OS === 'ios' ? 'Face ID / Touch ID Login' : 'Fingerprint / Biometric Login';

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar title="Profile & Account" showBack />

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
              <Badge variant="purple">Store Admin</Badge>
              <Text style={styles.heroStoreText}>{profile.storeName}</Text>
            </View>
          </View>
        </View>

        {/* ── Personal Info Card ── */}
        <Card style={styles.formCard}>
          <SectionHeader title="Personal Information" />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.textInput}
              placeholder="Your full name"
              placeholderTextColor={Colors.neutral.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.textInput}
              placeholder="Email address"
              placeholderTextColor={Colors.neutral.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
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
          <SectionHeader title="Security & Authentication" />

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>{biometricLabel}</Text>
              <Text style={styles.toggleSub}>
                Quick and secure login without entering password
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
            <Text style={styles.changePassBtnText}>Change Account Password</Text>
            <VectorIcon name="ChevronRight" size={14} color={Colors.neutral.textTertiary} />
          </Pressable>
        </Card>

        {/* ── Role & Store Association Card ── */}
        <Card style={styles.formCard}>
          <SectionHeader title="Assigned Store & Role" />
          <View style={styles.infoFieldRow}>
            <Text style={styles.infoFieldLabel}>Role</Text>
            <Badge variant="purple">Store Admin</Badge>
          </View>
          <View style={styles.infoFieldRow}>
            <Text style={styles.infoFieldLabel}>Assigned Store</Text>
            <Text style={styles.infoFieldValue}>{profile.storeName}</Text>
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
            <Text style={styles.savedBannerText}>Profile changes saved</Text>
          </View>
        )}

        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
        >
          <Text style={styles.saveBtnText}>Save Profile Changes</Text>
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
              <Text style={styles.modalTitle}>Change Password</Text>
              <Pressable
                onPress={() => setShowPasswordModal(false)}
                style={styles.closeBtn}
              >
                <VectorIcon name="X" size={18} color={Colors.neutral.textTertiary} />
              </Pressable>
            </View>

            <View style={styles.modalInputsCol}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <TextInput
                  secureTextEntry
                  value={currentPass}
                  onChangeText={setCurrentPass}
                  placeholder="Enter current password"
                  placeholderTextColor={Colors.neutral.textTertiary}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  secureTextEntry
                  value={newPass}
                  onChangeText={setNewPass}
                  placeholder="Enter new password"
                  placeholderTextColor={Colors.neutral.textTertiary}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <TextInput
                  secureTextEntry
                  value={confirmPass}
                  onChangeText={setConfirmPass}
                  placeholder="Confirm new password"
                  placeholderTextColor={Colors.neutral.textTertiary}
                  style={styles.textInput}
                />
              </View>
            </View>

            <Pressable
              onPress={handleChangePassword}
              style={({ pressed }) => [styles.submitPasswordBtn, pressed && styles.pressed]}
            >
              <Text style={styles.submitPasswordBtnText}>Update Password</Text>
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

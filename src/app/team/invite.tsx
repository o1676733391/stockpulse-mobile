import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { SectionHeader } from '@/components/ui/section-header';
import { TopBar } from '@/components/ui/top-bar';
import { ROLES } from '@/constants/rbac';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { invitationService } from '@/services/invitationService';
import { StoreInvitation } from '@/types/invitation';
import { UserRole } from '@/types/rbac';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InviteMemberScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('staff');
  const [expiresInDays, setExpiresInDays] = useState<number>(7);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success Modal State
  const [createdInvitation, setCreatedInvitation] = useState<(StoreInvitation & { rawToken?: string }) | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const availableRoles: UserRole[] = ['manager', 'supervisor', 'staff', 'auditor'];

  const handleSendInvite = async () => {
    if (loading) return;
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    const storeId = user?.storeId || '01915dfa-9012-7000-8000-000000000002';

    try {
      setLoading(true);
      const res = await invitationService.createInvitation(storeId, {
        email: cleanEmail,
        role: selectedRole,
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        expiresInDays,
      });

      setCreatedInvitation(res);
      setShowSuccessModal(true);
    } catch (err: any) {
      const msg = err?.message || 'Failed to generate invitation';
      setErrorMsg(msg);
      Alert.alert('Invitation Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleShareInvitation = async () => {
    if (!createdInvitation) return;
    const code = createdInvitation.invitationCode;
    const store = user?.storeName || 'our restaurant';
    const message = `You've been invited to join ${store} on StockPulse as ${ROLES[createdInvitation.role]?.label || createdInvitation.role}.\n\nInvitation Code: ${code}\nLink: https://app.stockpulse.io/invite?code=${code}`;

    try {
      await Share.share({
        message,
        title: `Join ${store} on StockPulse`,
      });
    } catch (err) {
      // User cancelled share
    }
  };

  const getRoleBadgeVariant = (roleKey: UserRole) => {
    switch (roleKey) {
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
    <View style={[styles.screen, { backgroundColor: Colors.neutral.background }]}>
      <TopBar title={t('team.inviteMember')} showBack />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Form Card ── */}
        <Card style={styles.formCard}>
          <SectionHeader title={t('team.inviteDetails')} />

          {/* Full Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('team.fullNameOptional')}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Maria Rossi"
              placeholderTextColor={Colors.neutral.textTertiary}
              style={styles.textInput}
            />
          </View>

          {/* Work Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('auth.emailLabel')} *</Text>
            <TextInput
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                setErrorMsg(null);
              }}
              placeholder="e.g. maria.rossi@restaurant.de"
              placeholderTextColor={Colors.neutral.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.textInput, errorMsg && styles.textInputError]}
            />
            {errorMsg && <Text style={styles.errorCaption}>{errorMsg}</Text>}
          </View>

          {/* Phone Number Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('auth.phoneLabel')}</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. +49 151 23456789"
              placeholderTextColor={Colors.neutral.textTertiary}
              keyboardType="phone-pad"
              style={styles.textInput}
            />
          </View>

          {/* Role Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('onboarding.roleLabel')} *</Text>
            <Text style={styles.inputHint}>
              {t('team.selectRolePrompt')}
            </Text>

            <View style={styles.rolesGrid}>
              {availableRoles.map((r) => {
                const isSelected = selectedRole === r;
                const roleDef = ROLES[r];

                return (
                  <Pressable
                    key={r}
                    onPress={() => setSelectedRole(r)}
                    style={({ pressed }) => [
                      styles.roleOptionCard,
                      isSelected && styles.roleOptionCardSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.roleOptionHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.roleOptionName, isSelected && styles.roleOptionNameSelected]}>
                          {t(`team.roles.${r}`, { defaultValue: roleDef.label })}
                        </Text>
                        <Text style={styles.roleOptionDesc}>
                          {t(`team.roleDescriptions.${r}`, { defaultValue: roleDef.description })}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && styles.radioCircleSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.radioInnerCircle} />}
                      </View>
                    </View>

                    <View style={styles.roleBadgeRow}>
                      <Badge variant={getRoleBadgeVariant(r)}>
                        {t(`team.roles.${r}`, { defaultValue: r.toUpperCase() })}
                      </Badge>
                      <Text style={styles.rolePermCount}>
                        {t('team.modulePermissionsGranted', { count: roleDef.permissions.length })}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Expiration Validity Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('team.validityDuration')}</Text>
            <View style={styles.validityPillRow}>
              {[3, 7, 14, 30].map((days) => (
                <Pressable
                  key={days}
                  onPress={() => setExpiresInDays(days)}
                  style={[
                    styles.validityPill,
                    expiresInDays === days && styles.validityPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.validityPillText,
                      expiresInDays === days && styles.validityPillTextActive,
                    ]}
                  >
                    {t('team.daysCount', { count: days })}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <Button
            label={loading ? t('team.sendingInvitation') : t('team.sendInvitation')}
            variant="primary"
            onPress={handleSendInvite}
            disabled={loading || !email.trim()}
            loading={loading}
            leftIcon={<VectorIcon name="Send" size={16} color="#ffffff" />}
          />
        </Card>
      </ScrollView>

      {/* ── Success Modal with 6-character Code & Share sheet ── */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowSuccessModal(false);
          router.back();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconBox}>
              <VectorIcon name="CheckCircle2" size={36} color={Colors.brand.primary} />
            </View>

            <Text style={styles.successModalTitle}>{t('team.invitationReady')}</Text>
            <Text style={styles.successModalSub}>
              {t('team.invitationReadySub', { email: createdInvitation?.email })}
            </Text>

            {/* Code Box */}
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>{t('team.invitationCode')}</Text>
              <Text style={styles.codeValue}>{createdInvitation?.invitationCode}</Text>
              <Text style={styles.codeExpiry}>
                {t('team.expiresInDaysToken', { days: expiresInDays })}
              </Text>
            </View>

            <View style={styles.modalActionsCol}>
              <Button
                label={t('team.copyAndShareCode')}
                variant="primary"
                onPress={handleShareInvitation}
                leftIcon={<VectorIcon name="Share2" size={16} color="#ffffff" />}
                style={{ width: '100%' }}
              />

              <Button
                label={t('common.done')}
                variant="secondary"
                onPress={() => {
                  setShowSuccessModal(false);
                  router.back();
                }}
                style={{ width: '100%' }}
              />
            </View>
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  formCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    ...Typography.label,
    marginBottom: Spacing.xs,
  },
  inputHint: {
    ...Typography.caption,
    color: Colors.neutral.textSecondary,
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.md,
    backgroundColor: '#ffffff',
    paddingHorizontal: Spacing.md,
    height: 48,
    fontSize: 14,
    color: Colors.neutral.textPrimary,
  },
  textInputError: {
    borderColor: Colors.critical.main,
  },
  errorCaption: {
    fontSize: 12,
    color: Colors.critical.main,
    marginTop: 4,
    fontWeight: '500',
  },
  rolesGrid: {
    gap: Spacing.sm,
  },
  roleOptionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  roleOptionCardSelected: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.subtle,
  },
  roleOptionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  roleOptionName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  roleOptionNameSelected: {
    color: Colors.brand.primary,
  },
  roleOptionDesc: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: Colors.brand.primary,
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.primary,
  },
  roleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.borderLight,
  },
  rolePermCount: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  validityPillRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  validityPill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.md,
  },
  validityPillActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.subtle,
  },
  validityPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  validityPillTextActive: {
    color: Colors.brand.primary,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.modal,
  },
  successIconBox: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  successModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    marginBottom: 4,
  },
  successModalSub: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  codeContainer: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: Colors.brand.light,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.neutral.textTertiary,
    letterSpacing: 1,
  },
  codeValue: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.brand.primary,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    marginVertical: 4,
    letterSpacing: 2,
  },
  codeExpiry: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
  },
  modalActionsCol: {
    width: '100%',
    gap: Spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
});

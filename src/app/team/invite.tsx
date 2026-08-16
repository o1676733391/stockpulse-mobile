import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { SectionHeader } from '@/components/ui/section-header';
import { TopBar } from '@/components/ui/top-bar';
import { ROLES } from '@/constants/rbac';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { authService } from '@/services/authService';
import { UserRole } from '@/types/rbac';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InviteMemberScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('staff');
  const [loading, setLoading] = useState(false);

  const handleSendInvite = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Required Fields', 'Please provide a member name and email address.');
      return;
    }

    setLoading(true);
    await authService.inviteMember(name.trim(), email.trim(), selectedRole);
    setLoading(false);

    Alert.alert(
      'Invitation Sent',
      `An invitation link has been dispatched to ${email}.`,
      [
        {
          text: 'OK',
          onPress: () => router.replace('/team/index' as any),
        },
      ]
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar title="Invite Team Member" showBack />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Member Details Card ── */}
        <Card style={styles.formCard}>
          <SectionHeader title="Member Information" />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Maria Rossi"
              placeholderTextColor={Colors.neutral.textTertiary}
              style={styles.textInput}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Work Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="e.g. maria.rossi@restaurant.de"
              placeholderTextColor={Colors.neutral.textTertiary}
              style={styles.textInput}
            />
          </View>
        </Card>

        {/* ── Assign Role Card ── */}
        <Card style={styles.formCard}>
          <SectionHeader title="Select Role & Permissions" />

          <View style={styles.rolesCol}>
            {(['manager', 'supervisor', 'staff', 'auditor'] as UserRole[]).map((r) => {
              const def = ROLES[r];
              const isSelected = r === selectedRole;

              return (
                <Pressable
                  key={r}
                  onPress={() => setSelectedRole(r)}
                  style={[
                    styles.roleCard,
                    isSelected && styles.roleCardActive,
                  ]}
                >
                  <View style={styles.roleCardInfo}>
                    <View style={styles.roleCardTitleRow}>
                      <Text style={styles.roleLabel}>{def.label}</Text>
                      <Badge variant={def.badgeVariant}>{r.toUpperCase()}</Badge>
                    </View>
                    <Text style={styles.roleDesc}>{def.description}</Text>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleActive,
                    ]}
                  >
                    {isSelected && <View style={styles.radioInnerDot} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Card>
      </ScrollView>

      {/* ── Fixed Bottom Send Button ── */}
      <View
        style={[
          styles.fixedBottom,
          {
            paddingBottom: insets.bottom > 0 ? insets.bottom + Spacing.xs : Spacing.md,
          },
        ]}
      >
        <Pressable
          onPress={handleSendInvite}
          disabled={loading}
          style={({ pressed }) => [styles.sendBtn, pressed && styles.pressed]}
        >
          <VectorIcon name="Mail" size={16} color="#ffffff" />
          <Text style={styles.sendBtnText}>
            {loading ? 'Sending Invite...' : 'Send Team Invitation'}
          </Text>
        </Pressable>
      </View>
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
  formCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
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
  rolesCol: {
    gap: Spacing.sm,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.xl,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
  },
  roleCardActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.subtle,
  },
  roleCardInfo: {
    flex: 1,
    gap: 2,
    paddingRight: Spacing.sm,
  },
  roleCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  roleDesc: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    lineHeight: 15,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: Colors.brand.primary,
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.brand.primary,
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
    ...Shadows.elevated,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    ...Shadows.card,
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { SectionHeader } from '@/components/ui/section-header';
import { TopBar } from '@/components/ui/top-bar';
import { MODULE_PERMISSIONS_MATRIX, ROLES } from '@/constants/rbac';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { authService } from '@/services/authService';
import { AuthUser, UserRole } from '@/types/rbac';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TeamMemberDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { role: currentUserRole } = useAuth();
  const { t } = useI18n();

  const [member, setMember] = useState<AuthUser | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    if (id) {
      authService.getMemberById(id).then(setMember);
    }
  }, [id]);

  if (!member) {
    return (
      <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
        <TopBar title="Member Details" showBack />
        <View style={styles.centerBox}>
          <Text style={styles.loadingText}>Loading member details...</Text>
        </View>
      </View>
    );
  }

  const roleDef = ROLES[member.role] ?? ROLES.staff;

  const [isMutating, setIsMutating] = useState(false);

  const handleRoleChange = async (newRole: UserRole) => {
    if (isMutating) return;
    try {
      setIsMutating(true);
      const updated = await authService.updateMemberRole(member.id, newRole);
      setMember(updated);
      setShowRoleModal(false);
      Alert.alert('Role Updated', `${member.name}'s role is now ${ROLES[newRole].label}.`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update role');
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteMember = () => {
    if (isMutating) return;
    Alert.alert(
      'Deactivate Member',
      `Are you sure you want to deactivate ${member.name}? They will lose access to the store.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsMutating(true);
              await authService.removeMember(member.id);
              Alert.alert('Member Deactivated', `${member.name} has been deactivated.`);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to deactivate member');
            } finally {
              setIsMutating(false);
            }
          },
        },
      ]
    );
  };

  const allowedModules = MODULE_PERMISSIONS_MATRIX.filter(
    (m) => m[member.role] !== 'none'
  );
  const blockedModules = MODULE_PERMISSIONS_MATRIX.filter(
    (m) => m[member.role] === 'none'
  );

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar
        title={t('team.title')}
        showBack
        right={
          currentUserRole === 'admin' && member.role !== 'admin' ? (
            <Pressable
              onPress={() => setShowRoleModal(true)}
              style={({ pressed }) => [styles.editRoleBtn, pressed && styles.pressed]}
            >
              <Text style={styles.editRoleBtnText}>{t('common.edit')}</Text>
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Member Profile Card ── */}
        <Card style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <View style={[styles.avatarCircle, { backgroundColor: roleDef.bg }]}>
              <Text style={[styles.avatarText, { color: roleDef.color }]}>
                {member.avatarText}
              </Text>
            </View>

            <View style={styles.profileInfoCol}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Badge variant={roleDef.badgeVariant}>{roleDef.label}</Badge>
              <Text style={styles.memberEmail}>{member.email}</Text>
            </View>
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Status</Text>
              <View style={styles.metaValueRow}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        member.status === 'active'
                          ? Colors.brand.primary
                          : Colors.neutral.textTertiary,
                    },
                  ]}
                />
                <Text style={styles.metaValText}>{member.status}</Text>
              </View>
            </View>

            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Last Activity</Text>
              <Text style={styles.metaValText}>{member.lastActive}</Text>
            </View>
          </View>
        </Card>

        {/* ── Assigned Permissions ── */}
        <Card style={styles.permsCard}>
          <SectionHeader title="Active Module Permissions" />
          <View style={styles.permsList}>
            {allowedModules.map((p) => {
              const isViewOnly = p[member.role] === 'view';

              return (
                <View key={p.module} style={styles.permItemRow}>
                  <View
                    style={[
                      styles.permIconCircle,
                      isViewOnly ? styles.permIconView : styles.permIconFull,
                    ]}
                  >
                    {isViewOnly ? (
                      <Text style={styles.viewBadgeText}>V</Text>
                    ) : (
                      <VectorIcon name="Check" size={12} color="#ffffff" strokeWidth={3} />
                    )}
                  </View>
                  <View style={styles.permTextCol}>
                    <Text style={styles.permModuleName}>{p.module}</Text>
                    <Text style={styles.permModuleDesc}>
                      {p.description} {isViewOnly ? '(View only)' : ''}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        {/* ── Blocked / Restricted Modules ── */}
        {blockedModules.length > 0 && (
          <Card style={styles.blockedCard}>
            <SectionHeader title="Restricted / No Access" />
            <View style={styles.permsList}>
              {blockedModules.map((p) => (
                <View key={p.module} style={styles.permItemRow}>
                  <View style={styles.permIconBlocked}>
                    <VectorIcon name="X" size={12} color={Colors.neutral.textTertiary} strokeWidth={2.5} />
                  </View>
                  <View style={styles.permTextCol}>
                    <Text style={styles.permModuleBlockedName}>{p.module}</Text>
                    <Text style={styles.permModuleDesc}>{p.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* ── Deactivate Member Action ── */}
        {currentUserRole === 'admin' && member.role !== 'admin' && (
          <Pressable
            onPress={handleDeleteMember}
            style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="Trash2" size={16} color={Colors.critical.main} />
            <Text style={styles.deleteBtnText}>Deactivate Team Member</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* ── Change Role Modal ── */}
      <Modal
        visible={showRoleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalGrabber} />

            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Change Member Role</Text>
              <Pressable
                onPress={() => setShowRoleModal(false)}
                style={styles.closeBtn}
              >
                <VectorIcon name="X" size={18} color={Colors.neutral.textTertiary} />
              </Pressable>
            </View>

            <View style={styles.rolesStack}>
              {(Object.keys(ROLES) as UserRole[]).map((r) => {
                const def = ROLES[r];
                const isSelected = r === member.role;

                return (
                  <Pressable
                    key={r}
                    onPress={() => handleRoleChange(r)}
                    style={[
                      styles.roleOptionCard,
                      isSelected && styles.roleOptionCardActive,
                    ]}
                  >
                    <View style={styles.roleOptionInfo}>
                      <View style={styles.roleOptionTitleRow}>
                        <Text style={styles.roleOptionLabel}>{def.label}</Text>
                        <Badge variant={def.badgeVariant}>{r.toUpperCase()}</Badge>
                      </View>
                      <Text style={styles.roleOptionDesc}>{def.description}</Text>
                    </View>

                    {isSelected && (
                      <View style={styles.activeCheckCircle}>
                        <VectorIcon name="Check" size={14} color="#ffffff" strokeWidth={3} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
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
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: Colors.neutral.textTertiary,
  },
  editRoleBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  editRoleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  profileCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  profileInfoCol: {
    flex: 1,
    gap: 3,
  },
  memberName: {
    ...Typography.pageTitle,
    fontSize: 18,
  },
  memberEmail: {
    fontSize: 12,
    color: Colors.neutral.textTertiary,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.borderLight,
    paddingTop: Spacing.md,
  },
  metaBox: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
    padding: Spacing.sm,
    borderRadius: Radius.lg,
    gap: 2,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.neutral.textTertiary,
    textTransform: 'uppercase',
  },
  metaValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metaValText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
    textTransform: 'capitalize',
  },
  permsCard: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  blockedCard: {
    padding: Spacing.lg,
    gap: Spacing.sm,
    backgroundColor: Colors.neutral.surface,
  },
  permsList: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  permItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  permIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  permIconFull: {
    backgroundColor: Colors.brand.primary,
  },
  permIconView: {
    backgroundColor: Colors.warning.main,
  },
  permIconBlocked: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.neutral.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  viewBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  permTextCol: {
    flex: 1,
    gap: 1,
  },
  permModuleName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  permModuleBlockedName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textTertiary,
  },
  permModuleDesc: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
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
    gap: Spacing.md,
    maxHeight: '85%',
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
  rolesStack: {
    gap: Spacing.sm,
  },
  roleOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.xl,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
  },
  roleOptionCardActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.subtle,
  },
  roleOptionInfo: {
    flex: 1,
    gap: 2,
  },
  roleOptionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  roleOptionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  roleOptionDesc: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  activeCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    marginTop: Spacing.md,
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.critical.main,
  },
  pressed: {
    opacity: 0.8,
  },
});

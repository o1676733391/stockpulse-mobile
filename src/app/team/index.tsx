import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { MODULE_PERMISSIONS_MATRIX, ROLES } from '@/constants/rbac';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { authService } from '@/services/authService';
import { invitationService } from '@/services/invitationService';
import { StoreInvitation } from '@/types/invitation';
import { AuthUser, UserRole } from '@/types/rbac';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

type TeamTab = 'members' | 'invitations' | 'roles';

export default function TeamScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, hasPermission } = useAuth();
  const { t, formatDate } = useI18n();

  const isManagerOrAdmin = hasPermission('team:manage') || user.role === 'admin' || user.role === 'manager';

  const [activeTab, setActiveTab] = useState<TeamTab>('members');

  // Members State
  const [members, setMembers] = useState<AuthUser[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Invitations State
  const [invitations, setInvitations] = useState<StoreInvitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [invitationsError, setInvitationsError] = useState<string | null>(null);

  // Role Change Modal State
  const [selectedMemberForRole, setSelectedMemberForRole] = useState<AuthUser | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // ── Fetch Real Team Members (Real API) ──
  const fetchMembers = useCallback(async () => {
    try {
      setLoadingMembers(true);
      setMembersError(null);
      const data = await authService.getTeamMembers();
      setMembers(data);
    } catch (err: any) {
      setMembersError(err?.message || t('errors.networkError'));
    } finally {
      setLoadingMembers(false);
    }
  }, [t]);

  // ── Fetch Real Store Invitations (Real API) ──
  const fetchInvitations = useCallback(async () => {
    const storeId = user?.storeId || '01915dfa-9012-7000-8000-000000000002';
    try {
      setLoadingInvitations(true);
      setInvitationsError(null);
      const data = await invitationService.getStoreInvitations(storeId);
      setInvitations(data);
    } catch (err: any) {
      setInvitationsError(err?.message || t('errors.networkError'));
    } finally {
      setLoadingInvitations(false);
    }
  }, [user?.storeId, t]);

  useEffect(() => {
    fetchMembers();
    if (isManagerOrAdmin) {
      fetchInvitations();
    }
  }, [fetchMembers, fetchInvitations, isManagerOrAdmin]);

  // ── Change Role Handler (Real API) ──
  const handleUpdateRole = async (targetRole: UserRole) => {
    if (!selectedMemberForRole || isUpdatingRole) return;

    try {
      setIsUpdatingRole(true);
      const updated = await authService.updateMemberRole(selectedMemberForRole.id, targetRole);
      setMembers((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m))
      );
      setSelectedMemberForRole(null);
      Alert.alert(
        t('team.changeRole'),
        t('team.roleUpdatedSuccess', {
          name: updated.name,
          role: ROLES[targetRole]?.label || targetRole,
        })
      );
    } catch (err: any) {
      Alert.alert(t('errors.serverError'), err?.message || 'Could not update member role.');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // ── Remove Member Handler (Real API) ──
  const handleRemoveMember = (targetUser: AuthUser) => {
    Alert.alert(
      t('team.removeMemberTitle'),
      t('team.removeMemberConfirm', { name: targetUser.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.removeMember(targetUser.id);
              setMembers((prev) => prev.filter((m) => m.id !== targetUser.id));
              Alert.alert(
                t('team.removeFromStore'),
                t('team.memberRemovedSuccess', { name: targetUser.name })
              );
            } catch (err: any) {
              Alert.alert(t('errors.serverError'), err?.message || 'Failed to remove member.');
            }
          },
        },
      ]
    );
  };

  // ── Share / Copy Invitation Code ──
  const handleShareInvitation = async (inv: StoreInvitation) => {
    const store = user?.storeName || 'our store';
    const message = `You've been invited to join ${store} on StockPulse as ${ROLES[inv.role]?.label || inv.role}.\n\nInvitation Code: ${inv.invitationCode}\nLink: https://app.stockpulse.io/invite?code=${inv.invitationCode}`;

    try {
      await Share.share({
        message,
        title: `Join ${store} on StockPulse`,
      });
    } catch (err) {}
  };

  // ── Resend Invitation Handler (Real API) ──
  const handleResendInvitation = async (inv: StoreInvitation) => {
    const storeId = user?.storeId || '01915dfa-9012-7000-8000-000000000002';
    try {
      const res = await invitationService.resendInvitation(storeId, inv.id, 7);
      setInvitations((prev) =>
        prev.map((item) => (item.id === inv.id ? { ...item, ...res } : item))
      );
      Alert.alert(
        t('team.resend'),
        t('team.invitationSentSuccess', { code: res.invitationCode }),
        [
          {
            text: t('team.share'),
            onPress: () => handleShareInvitation(res),
          },
          { text: t('common.done') },
        ]
      );
    } catch (err: any) {
      Alert.alert(t('errors.serverError'), err?.message || 'Failed to resend invitation.');
    }
  };

  // ── Revoke Invitation Handler (Real API) ──
  const handleRevokeInvitation = (inv: StoreInvitation) => {
    const storeId = user?.storeId || '01915dfa-9012-7000-8000-000000000002';
    Alert.alert(
      t('team.revokeConfirmTitle'),
      t('team.revokeConfirmMsg', { email: inv.email }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('team.revoke'),
          style: 'destructive',
          onPress: async () => {
            try {
              await invitationService.revokeInvitation(storeId, inv.id);
              setInvitations((prev) =>
                prev.map((item) =>
                  item.id === inv.id ? { ...item, status: 'REVOKED' } : item
                )
              );
              Alert.alert(t('team.revoke'), `Invitation for ${inv.email} has been revoked.`);
            } catch (err: any) {
              Alert.alert(t('errors.serverError'), err?.message || 'Failed to revoke invitation.');
            }
          },
        },
      ]
    );
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingInvitations = invitations.filter((i) => i.status === 'PENDING');

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
    <View style={[styles.screen, { backgroundColor: Colors.neutral.background }]}>
      <TopBar
        title={t('team.title')}
        showBack
        right={
          isManagerOrAdmin ? (
            <Pressable
              onPress={() => router.push('/team/invite' as any)}
              accessibilityRole="button"
              accessibilityLabel={t('team.inviteMember')}
              style={({ pressed }) => [styles.inviteHeaderBtn, pressed && styles.pressed]}
            >
              <VectorIcon name="Plus" size={15} color="#ffffff" strokeWidth={2.5} />
              <Text style={styles.inviteHeaderBtnText}>{t('team.invite') || 'Invite'}</Text>
            </Pressable>
          ) : undefined
        }
      />

      {/* ── Tab Switcher ── */}
      <View style={styles.tabBar}>
        <View style={styles.tabPillContainer}>
          <Pressable
            onPress={() => setActiveTab('members')}
            style={[styles.tabPill, activeTab === 'members' && styles.tabPillActive]}
          >
            <Text
              style={[
                styles.tabPillText,
                activeTab === 'members' && styles.tabPillTextActive,
              ]}
            >
              {t('team.tabs.members')} ({members.length})
            </Text>
          </Pressable>

          {isManagerOrAdmin && (
            <Pressable
              onPress={() => setActiveTab('invitations')}
              style={[styles.tabPill, activeTab === 'invitations' && styles.tabPillActive]}
            >
              <Text
                style={[
                  styles.tabPillText,
                  activeTab === 'invitations' && styles.tabPillTextActive,
                ]}
              >
                {t('team.tabs.invitations')} ({pendingInvitations.length})
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => setActiveTab('roles')}
            style={[styles.tabPill, activeTab === 'roles' && styles.tabPillActive]}
          >
            <Text
              style={[
                styles.tabPillText,
                activeTab === 'roles' && styles.tabPillTextActive,
              ]}
            >
              {t('team.tabs.roles')}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════════════════════════════════════════════════════
            TAB 1: MEMBERS
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'members' && (
          <View style={styles.tabContent}>
            {/* Search Input */}
            <View style={styles.searchBox}>
              <VectorIcon name="Search" size={18} color={Colors.neutral.textTertiary} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('team.searchPlaceholder') || 'Search by name, role, or email...'}
                placeholderTextColor={Colors.neutral.textTertiary}
                style={styles.searchInput}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <VectorIcon name="X" size={16} color={Colors.neutral.textTertiary} />
                </Pressable>
              )}
            </View>

            {/* Error State with Retry */}
            {membersError && (
              <View style={styles.errorBanner}>
                <VectorIcon name="AlertTriangle" size={20} color={Colors.critical.main} />
                <Text style={styles.errorBannerText}>{membersError}</Text>
                <Pressable onPress={fetchMembers} style={styles.retryBtn}>
                  <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
                </Pressable>
              </View>
            )}

            {/* Loading State */}
            {loadingMembers && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={Colors.brand.primary} />
                <Text style={styles.loadingText}>{t('common.loading')}</Text>
              </View>
            )}

            {/* Empty State */}
            {!loadingMembers && !membersError && filteredMembers.length === 0 && (
              <Card style={styles.emptyCard}>
                <VectorIcon name="Users" size={40} color={Colors.neutral.textTertiary} />
                <Text style={styles.emptyTitle}>{t('team.noMembersFound')}</Text>
                <Text style={styles.emptySub}>{t('team.noPendingDesc')}</Text>
                {isManagerOrAdmin && !searchQuery && (
                  <Button
                    label={t('team.inviteMember')}
                    variant="primary"
                    onPress={() => router.push('/team/invite' as any)}
                    style={{ marginTop: Spacing.md }}
                    leftIcon={<VectorIcon name="Plus" size={16} color="#FFFFFF" />}
                  />
                )}
              </Card>
            )}

            {/* Members List */}
            {!loadingMembers && !membersError && (
              <View style={styles.memberList}>
                {filteredMembers.map((m) => {
                  const roleDef = ROLES[m.role] || ROLES.staff;
                  const isSelf = m.id === user?.id || m.email === user?.email;

                  return (
                    <Card key={m.id} style={styles.memberCard}>
                      <View style={styles.memberRow}>
                        {/* Avatar */}
                        <View style={[styles.avatar, { backgroundColor: roleDef.bg }]}>
                          <Text style={[styles.avatarText, { color: roleDef.color }]}>
                            {m.avatarText || 'US'}
                          </Text>
                        </View>

                        {/* Info */}
                        <View style={styles.memberInfo}>
                          <View style={styles.nameRow}>
                            <Text style={styles.memberName}>{m.name}</Text>
                            {isSelf && <Badge variant="gray">{t('common.you')}</Badge>}
                          </View>
                          <Text style={styles.memberEmail}>{m.email}</Text>
                          {m.phone ? (
                            <Text style={styles.memberPhone}>{m.phone}</Text>
                          ) : null}
                        </View>

                        {/* Role Badge */}
                        <View style={styles.roleCol}>
                          <Badge variant={getRoleVariant(m.role)}>
                            {t(`team.roles.${m.role}`, { defaultValue: roleDef.label })}
                          </Badge>
                        </View>
                      </View>

                      {/* Admin Actions */}
                      {isManagerOrAdmin && !isSelf && (
                        <View style={styles.memberActionsRow}>
                          <Pressable
                            onPress={() => setSelectedMemberForRole(m)}
                            accessibilityRole="button"
                            accessibilityLabel={`${t('team.changeRole')} for ${m.name}`}
                            style={({ pressed }) => [
                              styles.actionPill,
                              pressed && styles.pressed,
                            ]}
                          >
                            <VectorIcon name="Shield" size={13} color={Colors.brand.primary} />
                            <Text style={styles.actionPillTextPrimary}>{t('team.changeRole')}</Text>
                          </Pressable>

                          <Pressable
                            onPress={() => handleRemoveMember(m)}
                            accessibilityRole="button"
                            accessibilityLabel={`${t('team.removeFromStore')} ${m.name}`}
                            style={({ pressed }) => [
                              styles.actionPill,
                              pressed && styles.pressed,
                            ]}
                          >
                            <VectorIcon name="Trash2" size={13} color={Colors.critical.main} />
                            <Text style={styles.actionPillTextDanger}>{t('common.delete')}</Text>
                          </Pressable>
                        </View>
                      )}
                    </Card>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 2: PENDING INVITATIONS
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'invitations' && (
          <View style={styles.tabContent}>
            {/* Header info */}
            <View style={styles.sectionHeaderBox}>
              <Text style={styles.sectionHeading}>{t('team.pendingInvitations')}</Text>
              <Text style={styles.sectionSub}>
                {t('team.noPendingDesc')}
              </Text>
            </View>

            {/* Error Banner with Retry */}
            {invitationsError && (
              <View style={styles.errorBanner}>
                <VectorIcon name="AlertTriangle" size={20} color={Colors.critical.main} />
                <Text style={styles.errorBannerText}>{invitationsError}</Text>
                <Pressable onPress={fetchInvitations} style={styles.retryBtn}>
                  <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
                </Pressable>
              </View>
            )}

            {/* Loading */}
            {loadingInvitations && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={Colors.brand.primary} />
                <Text style={styles.loadingText}>{t('common.loading')}</Text>
              </View>
            )}

            {/* Empty Invitations */}
            {!loadingInvitations && !invitationsError && invitations.length === 0 && (
              <Card style={styles.emptyCard}>
                <VectorIcon name="Mail" size={40} color={Colors.neutral.textTertiary} />
                <Text style={styles.emptyTitle}>{t('team.noPendingInvitations')}</Text>
                <Text style={styles.emptySub}>{t('team.noPendingDesc')}</Text>
                <Button
                  label={t('team.inviteMember')}
                  variant="primary"
                  onPress={() => router.push('/team/invite' as any)}
                  style={{ marginTop: Spacing.md }}
                  leftIcon={<VectorIcon name="Plus" size={16} color="#FFFFFF" />}
                />
              </Card>
            )}

            {/* Invitations List */}
            {!loadingInvitations && !invitationsError && (
              <View style={styles.invitationList}>
                {invitations.map((inv) => {
                  const roleDef = ROLES[inv.role] || ROLES.staff;
                  const isPending = inv.status === 'PENDING';
                  const isRevoked = inv.status === 'REVOKED';
                  const isAccepted = inv.status === 'ACCEPTED';

                  return (
                    <Card key={inv.id} style={styles.invitationCard}>
                      <View style={styles.invitationHeader}>
                        <View style={styles.invitationEmailGroup}>
                          <Text style={styles.invitationEmail}>{inv.email}</Text>
                          <Text style={styles.invitationMeta}>
                            Code: <Text style={styles.invitationCodeText}>{inv.invitationCode}</Text>
                          </Text>
                        </View>

                        <Badge
                          variant={
                            isAccepted
                              ? 'green'
                              : isPending
                              ? 'amber'
                              : isRevoked
                              ? 'red'
                              : 'gray'
                          }
                        >
                          {inv.status}
                        </Badge>
                      </View>

                      <View style={styles.invitationDetailsRow}>
                        <View style={styles.invitationRoleBox}>
                          <Text style={styles.invitationDetailLabel}>{t('onboarding.roleLabel')}:</Text>
                          <Badge variant={getRoleVariant(inv.role)}>
                            {t(`team.roles.${inv.role}`, { defaultValue: roleDef.label })}
                          </Badge>
                        </View>

                        <Text style={styles.invitationExpiryText}>
                          {isPending
                            ? `${t('onboarding.expiresLabel')}: ${formatDate ? formatDate(inv.expiresAt) : inv.expiresAt.split('T')[0]}`
                            : isAccepted
                            ? `Accepted: ${inv.acceptedAt ? (formatDate ? formatDate(inv.acceptedAt) : inv.acceptedAt.split('T')[0]) : 'Yes'}`
                            : isRevoked
                            ? 'Revoked'
                            : 'Expired'}
                        </Text>
                      </View>

                      {/* Action Buttons for Pending Invites */}
                      {isPending && (
                        <View style={styles.invitationActions}>
                          <Pressable
                            onPress={() => handleShareInvitation(inv)}
                            style={({ pressed }) => [
                              styles.invitationActionBtn,
                              styles.invitationActionBtnPrimary,
                              pressed && styles.pressed,
                            ]}
                          >
                            <VectorIcon name="Share2" size={13} color={Colors.brand.primary} />
                            <Text style={styles.invitationActionTextPrimary}>{t('team.share')}</Text>
                          </Pressable>

                          <Pressable
                            onPress={() => handleResendInvitation(inv)}
                            style={({ pressed }) => [
                              styles.invitationActionBtn,
                              pressed && styles.pressed,
                            ]}
                          >
                            <VectorIcon name="RefreshCw" size={13} color={Colors.neutral.textPrimary} />
                            <Text style={styles.invitationActionText}>{t('team.resend')}</Text>
                          </Pressable>

                          <Pressable
                            onPress={() => handleRevokeInvitation(inv)}
                            style={({ pressed }) => [
                              styles.invitationActionBtn,
                              styles.invitationActionBtnDanger,
                              pressed && styles.pressed,
                            ]}
                          >
                            <VectorIcon name="XCircle" size={13} color={Colors.critical.main} />
                            <Text style={styles.invitationActionTextDanger}>{t('team.revoke')}</Text>
                          </Pressable>
                        </View>
                      )}
                    </Card>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 3: ROLE PERMISSIONS MATRIX
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'roles' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeaderBox}>
              <Text style={styles.sectionHeading}>{t('team.permissionsMatrix')}</Text>
              <Text style={styles.sectionSub}>
                {t('team.rolesDesc')}
              </Text>
            </View>

            {/* Role Cards */}
            <View style={styles.roleGuideContainer}>
              {(['admin', 'manager', 'supervisor', 'staff', 'auditor'] as UserRole[]).map(
                (roleKey) => {
                  const roleDef = ROLES[roleKey];
                  return (
                    <Card key={roleKey} style={styles.roleCard}>
                      <View style={styles.roleCardHeader}>
                        <Badge variant={getRoleVariant(roleKey)}>
                          {t(`team.roles.${roleKey}`, { defaultValue: roleDef.label })}
                        </Badge>
                      </View>
                      <Text style={styles.roleCardDesc}>
                        {t(`team.roleDescriptions.${roleKey}`, { defaultValue: roleDef.description })}
                      </Text>
                      <View style={styles.permCountBox}>
                        <VectorIcon name="ShieldCheck" size={14} color={Colors.brand.primary} />
                        <Text style={styles.permCountText}>
                          {t('team.modulePermissionsGranted', { count: roleDef.permissions.length })}
                        </Text>
                      </View>
                    </Card>
                  );
                }
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Change Role Modal ── */}
      <Modal
        visible={!!selectedMemberForRole}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMemberForRole(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedMemberForRole(null)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('team.changeRole')}</Text>
              <Pressable
                onPress={() => setSelectedMemberForRole(null)}
                style={styles.modalCloseBtn}
              >
                <VectorIcon name="X" size={20} color={Colors.neutral.textSecondary} />
              </Pressable>
            </View>

            {selectedMemberForRole && (
              <View style={styles.modalBody}>
                <Text style={styles.modalTargetUser}>
                  Update role for{' '}
                  <Text style={{ fontWeight: '700' }}>
                    {selectedMemberForRole.name}
                  </Text>{' '}
                  ({selectedMemberForRole.email})
                </Text>

                <View style={styles.roleOptionsList}>
                  {(['manager', 'supervisor', 'staff', 'auditor'] as UserRole[]).map(
                    (roleKey) => {
                      const isCurrent = selectedMemberForRole.role === roleKey;
                      const roleDef = ROLES[roleKey];

                      return (
                        <Pressable
                          key={roleKey}
                          onPress={() => handleUpdateRole(roleKey)}
                          disabled={isUpdatingRole}
                          style={({ pressed }) => [
                            styles.roleOptionCard,
                            isCurrent && styles.roleOptionCardActive,
                            pressed && styles.pressed,
                          ]}
                        >
                          <View style={styles.roleOptionRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.roleOptionLabel}>
                                {t(`team.roles.${roleKey}`, { defaultValue: roleDef.label })}
                              </Text>
                              <Text style={styles.roleOptionDesc}>
                                {t(`team.roleDescriptions.${roleKey}`, { defaultValue: roleDef.description })}
                              </Text>
                            </View>
                            {isCurrent && (
                              <VectorIcon
                                name="CheckCircle"
                                size={18}
                                color={Colors.brand.primary}
                              />
                            )}
                          </View>
                        </Pressable>
                      );
                    }
                  )}
                </View>

                {isUpdatingRole && (
                  <View style={styles.updatingRoleBox}>
                    <ActivityIndicator size="small" color={Colors.brand.primary} />
                    <Text style={styles.updatingRoleText}>Updating role...</Text>
                  </View>
                )}

                <Button
                  label={t('common.cancel')}
                  variant="secondary"
                  onPress={() => setSelectedMemberForRole(null)}
                  disabled={isUpdatingRole}
                  style={{ marginTop: Spacing.md, width: '100%' }}
                />
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  inviteHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.md,
    gap: 4,
  },
  inviteHeaderBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  tabPillContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral.borderLight,
    borderRadius: Radius.lg,
    padding: 3,
    gap: 2,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  tabPillActive: {
    backgroundColor: '#ffffff',
    ...Shadows.sm,
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  tabPillTextActive: {
    color: Colors.brand.primary,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  tabContent: {
    gap: Spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.neutral.textPrimary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.critical.subtle,
    borderWidth: 1,
    borderColor: Colors.critical.light,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: Colors.critical.dark,
    fontWeight: '500',
  },
  retryBtn: {
    backgroundColor: Colors.critical.main,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingBox: {
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    ...Typography.caption,
    color: Colors.neutral.textSecondary,
  },
  emptyCard: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    marginTop: Spacing.sm,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  memberList: {
    gap: Spacing.sm,
  },
  memberCard: {
    padding: Spacing.md,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  memberEmail: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  memberPhone: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    marginTop: 1,
  },
  roleCol: {
    alignItems: 'flex-end',
  },
  memberActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.borderLight,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    gap: 4,
  },
  actionPillTextPrimary: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.brand.primary,
  },
  actionPillTextDanger: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.critical.main,
  },
  sectionHeaderBox: {
    marginBottom: Spacing.xs,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  sectionSub: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  invitationList: {
    gap: Spacing.sm,
  },
  invitationCard: {
    padding: Spacing.md,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  invitationEmailGroup: {
    flex: 1,
  },
  invitationEmail: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  invitationMeta: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  invitationCodeText: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  invitationDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  invitationRoleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  invitationDetailLabel: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
  },
  invitationExpiryText: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  invitationActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.borderLight,
  },
  invitationActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    gap: 4,
  },
  invitationActionBtnPrimary: {
    borderColor: Colors.brand.light,
    backgroundColor: Colors.brand.subtle,
  },
  invitationActionBtnDanger: {
    borderColor: Colors.critical.light,
    backgroundColor: Colors.critical.subtle,
  },
  invitationActionTextPrimary: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.brand.primary,
  },
  invitationActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  invitationActionTextDanger: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.critical.main,
  },
  roleGuideContainer: {
    gap: Spacing.sm,
  },
  roleCard: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  roleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleCardDesc: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
    lineHeight: 18,
  },
  permCountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  permCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.brand.dark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadows.modal,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    gap: Spacing.md,
  },
  modalTargetUser: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
  },
  roleOptionsList: {
    gap: Spacing.sm,
  },
  roleOptionCard: {
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    backgroundColor: '#ffffff',
  },
  roleOptionCardActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.subtle,
  },
  roleOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  roleOptionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  roleOptionDesc: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  updatingRoleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  updatingRoleText: {
    fontSize: 13,
    color: Colors.brand.primary,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
});

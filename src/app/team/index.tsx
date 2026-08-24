import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { MODULE_PERMISSIONS_MATRIX, ROLES } from '@/constants/rbac';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import { AuthUser, ModulePermissionRow, UserRole } from '@/types/rbac';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TeamScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { hasPermission } = useAuth();

  const [tab, setTab] = useState<'members' | 'roles'>('members');
  const [members, setMembers] = useState<AuthUser[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    authService.getTeamMembers().then(setMembers);
  }, []);

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = members.filter((m) => m.status === 'active').length;

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar
        title="Team & Roles"
        showBack
        right={
          hasPermission('team:manage') ? (
            <Pressable
              onPress={() => router.push('/team/invite' as any)}
              style={({ pressed }) => [styles.inviteBtn, pressed && styles.pressed]}
            >
              <VectorIcon name="Plus" size={14} color="#ffffff" />
              <Text style={styles.inviteBtnText}>Invite</Text>
            </Pressable>
          ) : undefined
        }
      />

      {/* ── Tab Switcher ── */}
      <View style={styles.tabBar}>
        <View style={styles.tabPillContainer}>
          <Pressable
            onPress={() => setTab('members')}
            style={[styles.tabPill, tab === 'members' && styles.tabPillActive]}
          >
            <Text
              style={[
                styles.tabPillText,
                tab === 'members' && styles.tabPillTextActive,
              ]}
            >
              Members ({members.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setTab('roles')}
            style={[styles.tabPill, tab === 'roles' && styles.tabPillActive]}
          >
            <Text
              style={[
                styles.tabPillText,
                tab === 'roles' && styles.tabPillTextActive,
              ]}
            >
              Role Guide & Matrix
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
        {tab === 'members' ? (
          <>
            {/* ── Stats Grid ── */}
            <View style={styles.statsGrid}>
              <Card style={styles.statCard}>
                <Text style={styles.statValue}>{members.length}</Text>
                <Text style={styles.statLabel}>Total Staff</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={[styles.statValue, { color: Colors.brand.primary }]}>
                  {activeCount}
                </Text>
                <Text style={styles.statLabel}>Active Now</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={[styles.statValue, { color: Colors.warning.main }]}>
                  {members.length - activeCount}
                </Text>
                <Text style={styles.statLabel}>Inactive</Text>
              </Card>
            </View>

            {/* ── Search Bar ── */}
            <View style={styles.searchWrap}>
              <VectorIcon name="Search" size={16} color={Colors.neutral.textTertiary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name, email, or role..."
                placeholderTextColor={Colors.neutral.textTertiary}
                style={styles.searchInput}
              />
            </View>

            {/* ── Members List ── */}
            <View style={styles.membersStack}>
              {filteredMembers.map((m) => {
                const roleDef = ROLES[m.role] ?? ROLES.staff;

                return (
                  <Card
                    key={m.id}
                    onPress={() => router.push(`/team/${m.id}` as any)}
                    style={styles.memberCard}
                  >
                    <View
                      style={[
                        styles.memberAvatar,
                        { backgroundColor: roleDef.bg },
                      ]}
                    >
                      <Text style={[styles.avatarText, { color: roleDef.color }]}>
                        {m.avatarText}
                      </Text>
                    </View>

                    <View style={styles.memberInfo}>
                      <View style={styles.memberNameRow}>
                        <Text style={styles.memberName}>{m.name}</Text>
                        <Badge variant={roleDef.badgeVariant}>{roleDef.label}</Badge>
                      </View>
                      <Text style={styles.memberEmail}>{m.email}</Text>
                    </View>

                    <View style={styles.memberStatusCol}>
                      <View style={styles.statusIndicatorRow}>
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor:
                                m.status === 'active'
                                  ? Colors.brand.primary
                                  : Colors.neutral.textTertiary,
                            },
                          ]}
                        />
                        <Text style={styles.statusText}>{m.status}</Text>
                      </View>
                      <Text style={styles.lastActiveText}>{m.lastActive}</Text>
                    </View>
                  </Card>
                );
              })}
            </View>
          </>
        ) : (
          <>
            {/* ── Role Definitions Guide ── */}
            <Text style={styles.sectionHeader}>ROLE DEFINITIONS</Text>
            <View style={styles.roleDefinitionsStack}>
              {(Object.keys(ROLES) as UserRole[]).map((r) => {
                const def = ROLES[r];

                return (
                  <Card key={r} style={styles.roleDefCard}>
                    <View style={styles.roleDefHeader}>
                      <Badge variant={def.badgeVariant}>{def.label}</Badge>
                      <Text style={styles.permCountText}>
                        {def.permissions.length} permissions
                      </Text>
                    </View>
                    <Text style={styles.roleDefDescription}>{def.description}</Text>
                  </Card>
                );
              })}
            </View>

            {/* ── Interactive Permission Matrix ── */}
            <Text style={[styles.sectionHeader, { marginTop: Spacing.md }]}>
              PERMISSION MATRIX
            </Text>
            <Card style={styles.matrixCard}>
              {/* Matrix Table Header */}
              <View style={styles.matrixTableHeader}>
                <Text style={styles.moduleHeaderCol}>Module / Action</Text>
                <Text style={styles.roleHeaderCol}>Adm</Text>
                <Text style={styles.roleHeaderCol}>Mgr</Text>
                <Text style={styles.roleHeaderCol}>Sup</Text>
                <Text style={styles.roleHeaderCol}>Stf</Text>
                <Text style={styles.roleHeaderCol}>Aud</Text>
              </View>

              {/* Rows */}
              {MODULE_PERMISSIONS_MATRIX.map((row, i) => {
                const isLast = i === MODULE_PERMISSIONS_MATRIX.length - 1;

                return (
                  <View
                    key={row.module}
                    style={[styles.matrixTableRow, !isLast && styles.matrixRowBorder]}
                  >
                    <View style={styles.moduleInfoCol}>
                      <Text style={styles.moduleName}>{row.module}</Text>
                      <Text style={styles.moduleDesc}>{row.description}</Text>
                    </View>

                    <PermCell val={row.admin} />
                    <PermCell val={row.manager} />
                    <PermCell val={row.supervisor} />
                    <PermCell val={row.staff} />
                    <PermCell val={row.auditor} />
                  </View>
                );
              })}
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function PermCell({ val }: { val: 'full' | 'view' | 'none' }) {
  if (val === 'full') {
    return (
      <View style={styles.permCell}>
        <View style={styles.fullCheckCircle}>
          <VectorIcon name="Check" size={10} color="#ffffff" strokeWidth={3} />
        </View>
      </View>
    );
  }
  if (val === 'view') {
    return (
      <View style={styles.permCell}>
        <Text style={styles.viewOnlyBadge}>V</Text>
      </View>
    );
  }
  return (
    <View style={styles.permCell}>
      <VectorIcon name="X" size={12} color={Colors.neutral.border} strokeWidth={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
  },
  inviteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  tabBar: {
    backgroundColor: Colors.neutral.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  tabPillContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.lg,
    padding: 3,
    gap: 4,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: Colors.neutral.card,
    ...Shadows.card,
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textTertiary,
  },
  tabPillTextActive: {
    color: Colors.neutral.textPrimary,
    fontWeight: '700',
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  statValue: {
    ...Typography.monoValue,
    fontSize: 20,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.neutral.card,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.neutral.textPrimary,
    paddingVertical: 4,
  },
  membersStack: {
    gap: Spacing.sm,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  memberEmail: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  memberStatusCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
    textTransform: 'capitalize',
  },
  lastActiveText: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.neutral.textTertiary,
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.xs,
  },
  roleDefinitionsStack: {
    gap: Spacing.sm,
  },
  roleDefCard: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  roleDefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permCountText: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  roleDefDescription: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    lineHeight: 16,
  },
  matrixCard: {
    padding: 0,
    overflow: 'hidden',
  },
  matrixTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  moduleHeaderCol: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.neutral.textSecondary,
  },
  roleHeaderCol: {
    width: 32,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: Colors.neutral.textSecondary,
  },
  matrixTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  matrixRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  moduleInfoCol: {
    flex: 1,
    gap: 1,
    paddingRight: Spacing.xs,
  },
  moduleName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  moduleDesc: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
  },
  permCell: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullCheckCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewOnlyBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.warning.dark,
    backgroundColor: Colors.warning.subtle,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  pressed: {
    opacity: 0.8,
  },
});

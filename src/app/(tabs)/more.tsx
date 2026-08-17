import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { ROLES } from '@/constants/rbac';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { Permission, UserRole } from '@/types/rbac';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MenuItem {
  icon: string;
  label: string;
  sub: string;
  route: string;
  iconBg: string;
  iconColor: string;
  badge?: string;
  permission?: Permission;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function MoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, role, switchRole, logout, hasPermission } = useAuth();

  const [showRoleModal, setShowRoleModal] = useState(false);

  const rawSections: MenuSection[] = useMemo(
    () => [
      {
        title: 'Team & Administration',
        items: [
          {
            icon: 'Users',
            label: 'Team & Roles',
            sub: 'Members, roles & permission matrix',
            route: '/team/index',
            iconBg: '#ede9fe',
            iconColor: '#6d28d9',
            permission: 'team:view',
          },
        ],
      },
      {
        title: 'Analytics & Intelligence',
        items: [
          {
            icon: 'BarChart2',
            label: 'Analytics & Trends',
            sub: 'Valuation, variance, waste & spend',
            route: '/analytics',
            iconBg: '#d1fae5',
            iconColor: Colors.brand.primary,
            permission: 'analytics:view',
          },
          {
            icon: 'FileText',
            label: 'Reports & Export',
            sub: 'Generate PDF, Excel & CSV',
            route: '/analytics/reports',
            iconBg: '#dbeafe',
            iconColor: '#1d4ed8',
            permission: 'analytics:export_reports',
          },
          {
            icon: 'Lightbulb',
            label: 'Waste Reduction',
            sub: 'Smart recipe suggestions',
            route: '/expiration/waste-reduction',
            iconBg: '#fef3c7',
            iconColor: '#b45309',
            permission: 'bbd:action_waste',
          },
        ],
      },
      {
        title: 'Operations',
        items: [
          {
            icon: 'Truck',
            label: 'Suppliers & Scorecards',
            sub: '3 active suppliers · Performance',
            route: '/analytics/suppliers',
            iconBg: '#ede9fe',
            iconColor: '#6d28d9',
            permission: 'procurement:view_poq',
          },
          {
            icon: 'Clock',
            label: 'Expiration Alerts',
            sub: '2 batches expiring this week',
            route: '/expiration',
            iconBg: '#fee2e2',
            iconColor: '#dc2626',
            badge: '2',
            permission: 'bbd:view',
          },
          {
            icon: 'ClipboardList',
            label: 'Stock Audits & Counts',
            sub: 'Daily, weekly & monthly audits',
            route: '/stock-count/index',
            iconBg: '#f1f5f9',
            iconColor: '#475569',
            permission: 'inventory:count',
          },
          {
            icon: 'ShoppingCart',
            label: 'Purchase Orders & POQ',
            sub: 'Active drafts & history',
            route: '/orders/poq',
            iconBg: '#dcfce7',
            iconColor: '#15803d',
            permission: 'procurement:view_poq',
          },
        ],
      },
      {
        title: 'Notifications & Alerts',
        items: [
          {
            icon: 'Bell',
            label: 'Notifications',
            sub: '4 unread alerts',
            route: '/notifications',
            iconBg: '#dbeafe',
            iconColor: '#1d4ed8',
            badge: '4',
          },
        ],
      },
      {
        title: 'Preferences & System',
        items: [
          {
            icon: 'Settings',
            label: 'Store & App Settings',
            sub: 'Store, currency, BBD & system',
            route: '/settings',
            iconBg: '#f1f5f9',
            iconColor: '#475569',
            permission: 'settings:view',
          },
          {
            icon: 'User',
            label: 'Account & Security',
            sub: 'Profile, password & biometrics',
            route: '/settings/profile',
            iconBg: '#d1fae5',
            iconColor: Colors.brand.primary,
          },
        ],
      },
    ],
    []
  );

  // Filter sections by permissions
  const filteredSections = useMemo(() => {
    return rawSections
      .map((sec) => ({
        ...sec,
        items: sec.items.filter((item) =>
          item.permission ? hasPermission(item.permission) : true
        ),
      }))
      .filter((sec) => sec.items.length > 0);
  }, [rawSections, hasPermission]);

  const activeRoleDef = ROLES[role] ?? ROLES.admin;

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar title="More" large />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Hero Card ── */}
        <Pressable
          onPress={() => router.push('/settings/profile' as any)}
          style={({ pressed }) => [styles.profileCard, pressed && styles.pressed]}
        >
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{user.avatarText}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name}</Text>
            <View style={styles.roleRow}>
              <Badge variant={activeRoleDef.badgeVariant}>{activeRoleDef.label}</Badge>
              <Text style={styles.profileEmail}>{user.email}</Text>
            </View>
            <Text style={styles.profileStore}>{user.storeName}</Text>
          </View>
          <VectorIcon name="ChevronRight" size={20} color="rgba(255, 255, 255, 0.7)" />
        </Pressable>

        {/* ── Demo RBAC Role Switcher Banner ── */}
        <Pressable
          onPress={() => setShowRoleModal(true)}
          style={styles.roleSwitcherBanner}
        >
          <View style={styles.roleSwitcherIconBox}>
            <VectorIcon name="Shield" size={16} color={Colors.brand.primary} />
          </View>
          <View style={styles.roleSwitcherInfo}>
            <Text style={styles.roleSwitcherTitle}>Active Role: {activeRoleDef.label}</Text>
            <Text style={styles.roleSwitcherSub}>Tap to switch role & test RBAC permissions live</Text>
          </View>
          <VectorIcon name="ArrowRightLeft" size={14} color={Colors.brand.dark} />
        </Pressable>

        {/* ── Menu Sections ── */}
        {filteredSections.map((sec) => (
          <View key={sec.title} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            <Card style={styles.menuCard}>
              {sec.items.map((item, idx) => {
                const isLast = idx === sec.items.length - 1;
                return (
                  <Pressable
                    key={item.label}
                    onPress={() => router.push(item.route as any)}
                    style={({ pressed }) => [
                      styles.menuItemRow,
                      !isLast && styles.menuItemBorder,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={[styles.menuIconBox, { backgroundColor: item.iconBg }]}>
                      <VectorIcon name={item.icon} size={18} color={item.iconColor} />
                    </View>

                    <View style={styles.menuItemTextCol}>
                      <Text style={styles.menuItemLabel}>{item.label}</Text>
                      <Text style={styles.menuItemSub}>{item.sub}</Text>
                    </View>

                    <View style={styles.menuItemRight}>
                      {item.badge && <Badge variant="red">{item.badge}</Badge>}
                      <VectorIcon name="ChevronRight" size={16} color={Colors.neutral.textTertiary} />
                    </View>
                  </Pressable>
                );
              })}
            </Card>
          </View>
        ))}

        {/* ── Sign Out Action Card ── */}
        <Pressable
          onPress={async () => {
            await logout();
            router.replace('/login' as any);
          }}
          style={({ pressed }) => [styles.signOutBtn, pressed && styles.pressed]}
        >
          <VectorIcon name="LogOut" size={18} color={Colors.critical.main} />
          <Text style={styles.signOutBtnText}>Sign Out from {user.storeName}</Text>
        </Pressable>

        {/* ── Version & Copyright ── */}
        <Text style={styles.versionText}>
          StockPulse v2.4.1 · {user.storeName}
        </Text>
      </ScrollView>

      {/* ── Role Switcher Modal ── */}
      <Modal
        visible={showRoleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.roleModalCard}>
            <View style={styles.modalGrabber} />

            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Demo User Role</Text>
              <Pressable
                onPress={() => setShowRoleModal(false)}
                style={styles.closeBtn}
              >
                <VectorIcon name="X" size={18} color={Colors.neutral.textTertiary} />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Instantly simulate different kitchen & management access levels.
            </Text>

            <View style={styles.rolesStack}>
              {(Object.keys(ROLES) as UserRole[]).map((r) => {
                const def = ROLES[r];
                const isActive = r === role;

                return (
                  <Pressable
                    key={r}
                    onPress={async () => {
                      await switchRole(r);
                      setShowRoleModal(false);
                    }}
                    style={[
                      styles.roleOptionCard,
                      isActive && styles.roleOptionCardActive,
                    ]}
                  >
                    <View style={styles.roleOptionInfo}>
                      <View style={styles.roleOptionTitleRow}>
                        <Text style={styles.roleOptionLabel}>{def.label}</Text>
                        <Badge variant={def.badgeVariant}>{r.toUpperCase()}</Badge>
                      </View>
                      <Text style={styles.roleOptionDesc}>{def.description}</Text>
                    </View>

                    {isActive && (
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
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  profileCard: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.card,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: Radius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginVertical: 2,
  },
  profileEmail: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  profileStore: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  roleSwitcherBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.brand.subtle,
    borderColor: Colors.brand.light,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },
  roleSwitcherIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleSwitcherInfo: {
    flex: 1,
    gap: 1,
  },
  roleSwitcherTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  roleSwitcherSub: {
    fontSize: 11,
    color: Colors.brand.dark,
    opacity: 0.8,
  },
  sectionContainer: {
    gap: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.sectionHeader,
    fontSize: 11,
    paddingHorizontal: Spacing.xs,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTextCol: {
    flex: 1,
    gap: 2,
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  menuItemSub: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    marginTop: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  roleModalCard: {
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
  modalSubtitle: {
    fontSize: 12,
    color: Colors.neutral.textTertiary,
    marginTop: -Spacing.xs,
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
    gap: 3,
    paddingRight: Spacing.sm,
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
    lineHeight: 15,
  },
  activeCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.critical.subtle,
    borderWidth: 1,
    borderColor: Colors.critical.light,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  signOutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.critical.dark,
  },
  pressed: {
    opacity: 0.8,
  },
});

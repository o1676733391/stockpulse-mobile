import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { ROLES } from '@/constants/rbac';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { expirationService } from '@/services/expirationService';
import { notificationService } from '@/services/notificationService';
import { Permission, UserRole } from '@/types/rbac';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
  const { user, role, logout, hasPermission } = useAuth();
  const { t } = useI18n();

  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);
  const [expiringCount, setExpiringCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    async function loadBadges() {
      try {
        const [notifCount, expiringItems] = await Promise.all([
          notificationService.getUnreadCount(),
          expirationService.getExpiringItems(),
        ]);
        if (isMounted) {
          setUnreadNotifCount(notifCount);
          setExpiringCount(expiringItems.length);
        }
      } catch {
        // Safe silent fallback
      }
    }
    loadBadges();
    return () => {
      isMounted = false;
    };
  }, []);

  const rawSections: MenuSection[] = useMemo(
    () => [
      {
        title: t('team.title'),
        items: [
          {
            icon: 'Users',
            label: t('team.title'),
            sub: t('team.rolesDesc'),
            route: '/team',
            iconBg: '#ede9fe',
            iconColor: '#6d28d9',
            permission: 'team:view',
          },
        ],
      },
      {
        title: t('analytics.title'),
        items: [
          {
            icon: 'BarChart2',
            label: t('analytics.title'),
            sub: t('analytics.trends'),
            route: '/analytics',
            iconBg: '#d1fae5',
            iconColor: Colors.brand.primary,
            permission: 'analytics:view',
          },
          {
            icon: 'FileText',
            label: t('analytics.reports'),
            sub: t('analytics.exportPdf'),
            route: '/analytics/reports',
            iconBg: '#dbeafe',
            iconColor: '#1d4ed8',
            permission: 'analytics:export_reports',
          },
          {
            icon: 'Lightbulb',
            label: t('expiration.actions.reduceWaste'),
            sub: t('expiration.actions.triageBbd'),
            route: '/expiration/waste-reduction',
            iconBg: '#fef3c7',
            iconColor: '#b45309',
            permission: 'bbd:action_waste',
          },
        ],
      },
      {
        title: t('settings.groups.storeOperations'),
        items: [
          {
            icon: 'History',
            label: t('scan.scanHistory'),
            sub: t('scan.history.subtitle'),
            route: '/scan/history',
            iconBg: '#e0e7ff',
            iconColor: '#4338ca',
            permission: 'ocr:scan',
          },
          {
            icon: 'BookOpen',
            label: t('recipes.title'),
            sub: t('recipes.subtitle'),
            route: '/recipes',
            iconBg: '#fef3c7',
            iconColor: '#b45309',
            permission: 'inventory:view',
          },
          {
            icon: 'Truck',
            label: t('analytics.suppliers'),
            sub: t('analytics.suppliers'),
            route: '/analytics/suppliers',
            iconBg: '#ede9fe',
            iconColor: '#6d28d9',
            permission: 'procurement:view_poq',
          },
          {
            icon: 'Clock',
            label: t('expiration.title'),
            sub: t('expiration.urgentAction'),
            route: '/expiration',
            iconBg: '#fee2e2',
            iconColor: '#dc2626',
            badge: expiringCount > 0 ? String(expiringCount) : undefined,
            permission: 'bbd:view',
          },
          {
            icon: 'ClipboardList',
            label: t('navigation.stockCount'),
            sub: t('stockCount.countSummaryTitle'),
            route: '/stock-count/index',
            iconBg: '#f1f5f9',
            iconColor: '#475569',
            permission: 'inventory:count',
          },
          {
            icon: 'ShoppingCart',
            label: t('orders.title'),
            sub: t('orders.title'),
            route: '/orders/poq',
            iconBg: '#dcfce7',
            iconColor: '#15803d',
            permission: 'procurement:view_poq',
          },
        ],
      },
      {
        title: t('notifications.title'),
        items: [
          {
            icon: 'Bell',
            label: t('notifications.title'),
            sub: t('notifications.types.lowStock'),
            route: '/notifications',
            iconBg: '#dbeafe',
            iconColor: '#1d4ed8',
            badge: unreadNotifCount > 0 ? String(unreadNotifCount) : undefined,
          },
        ],
      },
      {
        title: t('navigation.more'),
        items: [
          {
            icon: 'Settings',
            label: t('settings.title'),
            sub: t('settings.groups.generalSettings'),
            route: '/settings',
            iconBg: '#f1f5f9',
            iconColor: '#475569',
            permission: 'settings:view',
          },
          {
            icon: 'Globe',
            label: t('settings.items.language'),
            sub: t('settings.language.title'),
            route: '/settings/language',
            iconBg: '#d1fae5',
            iconColor: Colors.brand.primary,
          },
          {
            icon: 'User',
            label: t('settings.items.userProfile'),
            sub: t('settings.profile.title'),
            route: '/settings/profile',
            iconBg: '#d1fae5',
            iconColor: Colors.brand.primary,
          },
        ],
      },
    ],
    [t, unreadNotifCount, expiringCount]
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
      <TopBar title={t('navigation.more')} large />

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

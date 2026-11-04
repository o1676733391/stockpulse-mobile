import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { ROLES } from '@/constants/rbac';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { settingsService } from '@/services/settingsService';
import { StoreSettings } from '@/types/settings';
import { UserRole } from '@/types/rbac';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SettingsItem {
  icon: string;
  label: string;
  val?: string;
  route: string;
  iconBg: string;
  iconColor: string;
}

interface SettingsGroup {
  title: string;
  items: SettingsItem[];
}

export default function SettingsHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, role, logout } = useAuth();
  const { t, metadata } = useI18n();

  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  const loadSettingsData = useCallback(async () => {
    try {
      const data = await settingsService.getStoreSettings();
      setStoreSettings(data);
    } catch {
      // Handled gracefully
    }
  }, []);

  useEffect(() => {
    loadSettingsData();
  }, [loadSettingsData]);

  const getRoleVariant = (userRole?: string) => {
    switch (userRole?.toLowerCase()) {
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

  const getRoleLabel = (userRole?: string) => {
    const r = (userRole || 'staff') as UserRole;
    return t(`team.roles.${r}`, { defaultValue: ROLES[r]?.label || r.toUpperCase() });
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';
  const displayStore = storeSettings?.name || user?.storeName || 'StockPulse Kitchen';
  const displayAvatar = user?.avatarText || displayName.slice(0, 2).toUpperCase();

  const groups: SettingsGroup[] = [
    {
      title: t('settings.groups.storeOperations'),
      items: [
        {
          icon: 'Store',
          label: t('settings.items.storeConfig'),
          val: displayStore,
          route: '/settings/store',
          iconBg: '#dbeafe',
          iconColor: '#1d4ed8',
        },
        {
          icon: 'Clock',
          label: t('settings.items.bbdRules'),
          val: storeSettings ? `${storeSettings.bbdAlertDays}d` : '7d',
          route: '/settings/store',
          iconBg: '#fee2e2',
          iconColor: '#dc2626',
        },
      ],
    },
    {
      title: t('settings.groups.notificationsAlerts'),
      items: [
        {
          icon: 'Bell',
          label: t('settings.items.notificationChannels'),
          val: t('common.active'),
          route: '/settings/notifications',
          iconBg: '#fef3c7',
          iconColor: '#b45309',
        },
      ],
    },
    {
      title: t('settings.groups.preferencesDisplay'),
      items: [
        {
          icon: 'Sun',
          label: t('settings.items.appearance'),
          val: t('settings.appearance.system'),
          route: '/settings/appearance',
          iconBg: '#f1f5f9',
          iconColor: '#475569',
        },
        {
          icon: 'Globe',
          label: t('settings.items.language'),
          val: `${metadata.flag} ${metadata.nativeName}`,
          route: '/settings/language',
          iconBg: '#dcfce7',
          iconColor: '#15803d',
        },
      ],
    },
    {
      title: t('settings.groups.accountSecurity'),
      items: [
        {
          icon: 'User',
          label: t('settings.items.profile'),
          val: displayEmail,
          route: '/settings/profile',
          iconBg: '#ede9fe',
          iconColor: '#6d28d9',
        },
      ],
    },
    {
      title: t('settings.groups.supportLegal'),
      items: [
        {
          icon: 'Info',
          label: t('settings.items.about'),
          val: 'v2.4.1',
          route: '/settings/about',
          iconBg: '#f1f5f9',
          iconColor: '#475569',
        },
      ],
    },
  ];

  const handleSignOut = () => {
    Alert.alert(
      t('settings.signOutConfirm.title'),
      t('settings.signOutConfirm.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.items.signOut'),
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch {}
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar title={t('settings.title')} large showBack />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Real User Profile Banner ── */}
        <Pressable
          onPress={() => router.push('/settings/profile' as any)}
          style={({ pressed }) => [styles.profileCard, pressed && styles.pressed]}
        >
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{displayAvatar}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <View style={styles.roleBadgeRow}>
              <Badge variant={getRoleVariant(user?.role || role)}>
                {getRoleLabel(user?.role || role)}
              </Badge>
              <Text style={styles.profileEmail} numberOfLines={1}>{displayEmail}</Text>
            </View>
            <Text style={styles.profileStore} numberOfLines={1}>{displayStore}</Text>
          </View>
          <VectorIcon name="ChevronRight" size={18} color={Colors.neutral.textTertiary} />
        </Pressable>

        {/* ── Settings Groups ── */}
        {groups.map((grp) => (
          <View key={grp.title} style={styles.groupContainer}>
            <Text style={styles.groupHeader}>{grp.title.toUpperCase()}</Text>

            <Card style={styles.groupCard}>
              {grp.items.map((item, idx) => {
                const isLast = idx === grp.items.length - 1;

                return (
                  <Pressable
                    key={item.label}
                    onPress={() => router.push(item.route as any)}
                    style={({ pressed }) => [
                      styles.itemRow,
                      !isLast && styles.itemRowBorder,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={[styles.itemIconBox, { backgroundColor: item.iconBg }]}>
                      <VectorIcon
                        name={item.icon as any}
                        size={17}
                        color={item.iconColor}
                      />
                    </View>

                    <View style={styles.itemLabelBox}>
                      <Text style={styles.itemLabel}>{item.label}</Text>
                    </View>

                    {item.val && (
                      <Text style={styles.itemVal}>{item.val}</Text>
                    )}

                    <VectorIcon
                      name="ChevronRight"
                      size={15}
                      color={Colors.neutral.textTertiary}
                    />
                  </Pressable>
                );
              })}
            </Card>
          </View>
        ))}

        {/* ── Sign Out Action ── */}
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [styles.signOutBtn, pressed && styles.pressed]}
        >
          <VectorIcon name="LogOut" size={17} color={Colors.critical.main} />
          <Text style={styles.signOutBtnText}>{t('settings.items.signOut')}</Text>
        </Pressable>

        {/* Build / Version Footer */}
        <Text style={styles.versionFooter}>
          {t('common.appName')} v2.4.1 (Build 2026.03.11-rc1) · {displayStore}
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.lg,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.neutral.borderLight,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  roleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  profileEmail: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    flex: 1,
  },
  profileStore: {
    fontSize: 11,
    color: Colors.neutral.textMuted,
    marginTop: 1,
  },
  groupContainer: {
    gap: Spacing.xs,
  },
  groupHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Colors.neutral.textMuted,
    paddingHorizontal: Spacing.xs,
  },
  groupCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    padding: 0,
    borderWidth: 1,
    borderColor: Colors.neutral.borderLight,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  itemIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabelBox: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.textPrimary,
  },
  itemVal: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
    maxWidth: 160,
    textAlign: 'right',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.critical.light,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginTop: Spacing.xs,
  },
  signOutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.critical.main,
  },
  versionFooter: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.neutral.textMuted,
    marginTop: Spacing.xs,
  },
  pressed: {
    opacity: 0.75,
  },
});

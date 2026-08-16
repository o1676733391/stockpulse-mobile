import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import {
  INITIAL_STORE_SETTINGS,
  INITIAL_USER_PROFILE,
} from '@/services/settingsService';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

  const [profile] = useState(INITIAL_USER_PROFILE);
  const [store] = useState(INITIAL_STORE_SETTINGS);

  const groups: SettingsGroup[] = [
    {
      title: 'Store & Operations',
      items: [
        {
          icon: 'Store',
          label: 'Store Configuration',
          val: store.name,
          route: '/settings/store',
          iconBg: '#dbeafe',
          iconColor: '#1d4ed8',
        },
        {
          icon: 'Clock',
          label: 'BBD & Expiration Rules',
          val: `${store.bbdAlertDays} days threshold`,
          route: '/settings/store',
          iconBg: '#fee2e2',
          iconColor: '#dc2626',
        },
      ],
    },
    {
      title: 'Notifications & Alerts',
      items: [
        {
          icon: 'Bell',
          label: 'Notification Channels',
          val: 'Push enabled',
          route: '/settings/notifications',
          iconBg: '#fef3c7',
          iconColor: '#b45309',
        },
      ],
    },
    {
      title: 'Preferences & Display',
      items: [
        {
          icon: 'Sun',
          label: 'Appearance & Theme',
          val: 'System mode',
          route: '/settings/appearance',
          iconBg: '#f1f5f9',
          iconColor: '#475569',
        },
        {
          icon: 'Globe',
          label: 'Language & Currency',
          val: `${store.language} · ${store.currencySymbol}`,
          route: '/settings/store',
          iconBg: '#dcfce7',
          iconColor: '#15803d',
        },
      ],
    },
    {
      title: 'Account & Security',
      items: [
        {
          icon: 'User',
          label: 'Profile & Credentials',
          val: profile.email,
          route: '/settings/profile',
          iconBg: '#ede9fe',
          iconColor: '#6d28d9',
        },
      ],
    },
    {
      title: 'Support & Legal',
      items: [
        {
          icon: 'Info',
          label: 'About & Licenses',
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
      'Sign Out',
      'Are you sure you want to sign out of StockPulse?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => router.replace('/(tabs)' as any),
        },
      ]
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar title="Settings" large showBack />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── User Profile Banner ── */}
        <Pressable
          onPress={() => router.push('/settings/profile' as any)}
          style={({ pressed }) => [styles.profileCard, pressed && styles.pressed]}
        >
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{profile.avatarText}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.name}</Text>
            <View style={styles.roleBadgeRow}>
              <Badge variant="purple">Store Admin</Badge>
              <Text style={styles.profileEmail}>{profile.email}</Text>
            </View>
            <Text style={styles.profileStore}>{profile.storeName}</Text>
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
                      <VectorIcon name={item.icon} size={18} color={item.iconColor} />
                    </View>

                    <Text style={styles.itemLabel}>{item.label}</Text>

                    <View style={styles.itemRight}>
                      {item.val && <Text style={styles.itemValText}>{item.val}</Text>}
                      <VectorIcon name="ChevronRight" size={15} color={Colors.neutral.textTertiary} />
                    </View>
                  </Pressable>
                );
              })}
            </Card>
          </View>
        ))}

        {/* ── Sign Out CTA ── */}
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [styles.signOutBtn, pressed && styles.pressed]}
        >
          <VectorIcon name="LogOut" size={16} color={Colors.critical.main} />
          <Text style={styles.signOutBtnText}>Sign Out</Text>
        </Pressable>
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
    backgroundColor: Colors.neutral.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral.borderLight,
    ...Shadows.card,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
    backgroundColor: Colors.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    ...Typography.cardTitle,
    fontSize: 15,
  },
  roleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  profileEmail: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  profileStore: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
  },
  groupContainer: {
    gap: Spacing.xs,
  },
  groupHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.neutral.textTertiary,
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.xs,
  },
  groupCard: {
    padding: 0,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  itemIconBox: {
    width: 34,
    height: 34,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  itemValText: {
    fontSize: 12,
    color: Colors.neutral.textTertiary,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.neutral.card,
    borderColor: Colors.critical.light,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  signOutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.critical.main,
  },
  pressed: {
    opacity: 0.8,
  },
});

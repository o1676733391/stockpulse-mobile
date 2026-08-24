import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { SectionHeader } from '@/components/ui/section-header';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import {
  INITIAL_NOTIF_PREFERENCES,
  settingsService,
} from '@/services/settingsService';
import { NotificationPreferences } from '@/types/settings';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  const [prefs, setPrefs] = useState<NotificationPreferences>(() =>
    JSON.parse(JSON.stringify(INITIAL_NOTIF_PREFERENCES))
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggleChannel = (key: string, channel: 'push' | 'email') => {
    setPrefs((prev) => ({
      ...prev,
      channels: prev.channels.map((c) =>
        c.key === key ? { ...c, [channel]: !c[channel] } : c
      ),
    }));
  };

  const handleToggleGlobal = (channel: 'push' | 'email', val: boolean) => {
    setPrefs((prev) => ({
      ...prev,
      [channel === 'push' ? 'pushGlobal' : 'emailGlobal']: val,
    }));
  };

  const handleSave = async () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar title={t('settings.items.notificationChannels')} showBack />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Global Master Switches Card ── */}
        <Card style={styles.formCard}>
          <SectionHeader title={t('settings.groups.notificationsAlerts')} />

          <View style={styles.globalToggleRow}>
            <View style={styles.globalTextCol}>
              <Text style={styles.globalTitle}>Push Notifications</Text>
              <Text style={styles.globalSub}>
                {t('notifications.types.lowStock')} & {t('notifications.types.expiringSoon')}
              </Text>
            </View>
            <Switch
              value={prefs.pushGlobal}
              onValueChange={(val) => handleToggleGlobal('push', val)}
              trackColor={{ false: Colors.neutral.borderLight, true: Colors.brand.primary }}
            />
          </View>

          <View style={styles.globalToggleRow}>
            <View style={styles.globalTextCol}>
              <Text style={styles.globalTitle}>Email Alerts & Digests</Text>
              <Text style={styles.globalSub}>
                {t('analytics.title')}
              </Text>
            </View>
            <Switch
              value={prefs.emailGlobal}
              onValueChange={(val) => handleToggleGlobal('email', val)}
              trackColor={{ false: Colors.neutral.borderLight, true: Colors.brand.primary }}
            />
          </View>
        </Card>

        {/* ── Granular Channel Matrix Card ── */}
        <Card style={styles.matrixCard}>
          <SectionHeader title={t('notifications.title')} />

          {/* Matrix Header */}
          <View style={styles.matrixHeaderRow}>
            <Text style={styles.matrixHeaderLabel}>{t('common.status')}</Text>
            <Text style={styles.matrixColHeader}>Push</Text>
            <Text style={styles.matrixColHeader}>Email</Text>
          </View>

          {/* Channel Rows */}
          {prefs.channels.map((c, i) => {
            const isLast = i === prefs.channels.length - 1;

            return (
              <View
                key={c.key}
                style={[styles.matrixRow, !isLast && styles.matrixRowBorder]}
              >
                <View style={styles.matrixTypeCol}>
                  <View style={styles.typeIconCircle}>
                    <VectorIcon
                      name={c.iconName}
                      size={14}
                      color={Colors.brand.primary}
                    />
                  </View>
                  <Text style={styles.typeNameText}>{c.label}</Text>
                </View>

                {/* Push Toggle */}
                <View style={styles.toggleCell}>
                  <Switch
                    value={prefs.pushGlobal && c.push}
                    disabled={!prefs.pushGlobal}
                    onValueChange={() => handleToggleChannel(c.key, 'push')}
                    trackColor={{ false: Colors.neutral.borderLight, true: Colors.brand.primary }}
                  />
                </View>

                {/* Email Toggle */}
                <View style={styles.toggleCell}>
                  <Switch
                    value={prefs.emailGlobal && c.email}
                    disabled={!prefs.emailGlobal}
                    onValueChange={() => handleToggleChannel(c.key, 'email')}
                    trackColor={{ false: Colors.neutral.borderLight, true: Colors.brand.primary }}
                  />
                </View>
              </View>
            );
          })}
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
            <Text style={styles.savedBannerText}>Notification preferences updated</Text>
          </View>
        )}

        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
        >
          <Text style={styles.saveBtnText}>Save Preferences</Text>
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
  globalToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  globalTextCol: {
    flex: 1,
    gap: 2,
    paddingRight: Spacing.md,
  },
  globalTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  globalSub: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  matrixCard: {
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    marginTop: Spacing.xs,
  },
  matrixHeaderLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.neutral.textSecondary,
  },
  matrixColHeader: {
    width: 60,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: Colors.neutral.textSecondary,
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  matrixRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  matrixTypeCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typeIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  toggleCell: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
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
  pressed: {
    opacity: 0.8,
  },
});

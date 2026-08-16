import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { SectionHeader } from '@/components/ui/section-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import {
  INITIAL_APPEARANCE,
  settingsService,
} from '@/services/settingsService';
import { AppThemeMode, AppearancePreferences } from '@/types/settings';
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

export default function AppearanceScreen() {
  const insets = useSafeAreaInsets();

  const [appearance, setAppearance] = useState<AppearancePreferences>(() =>
    JSON.parse(JSON.stringify(INITIAL_APPEARANCE))
  );

  const [theme, setTheme] = useState<'System' | 'Light' | 'Dark'>('System');
  const [compact, setCompact] = useState(appearance.compactMode);
  const [haptics, setHaptics] = useState(appearance.hapticFeedback);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async () => {
    const updated = await settingsService.updateAppearancePreferences({
      themeMode: theme.toLowerCase() as AppThemeMode,
      compactMode: compact,
      hapticFeedback: haptics,
    });
    setAppearance(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar title="Appearance & Display" showBack />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Theme Mode Card ── */}
        <Card style={styles.formCard}>
          <SectionHeader title="Color Theme" />

          <View style={styles.themeControlWrap}>
            <SegmentedControl
              options={['System', 'Light', 'Dark']}
              value={theme}
              onChange={(val) => setTheme(val as any)}
            />
          </View>

          <Text style={styles.themeExplainer}>
            System mode automatically adjusts StockPulse color palettes to match your device OS preferences.
          </Text>
        </Card>

        {/* ── Layout & Accessibility Card ── */}
        <Card style={styles.formCard}>
          <SectionHeader title="Interface & Interactions" />

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>Compact Inventory Rows</Text>
              <Text style={styles.toggleSub}>
                Fit more ingredients per screen by reducing row heights
              </Text>
            </View>
            <Switch
              value={compact}
              onValueChange={setCompact}
              trackColor={{ false: Colors.neutral.borderLight, true: Colors.brand.primary }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>Haptic Feedback</Text>
              <Text style={styles.toggleSub}>
                Vibrate gently on keypad taps, scan detections, and confirmations
              </Text>
            </View>
            <Switch
              value={haptics}
              onValueChange={setHaptics}
              trackColor={{ false: Colors.neutral.borderLight, true: Colors.brand.primary }}
            />
          </View>
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
            <Text style={styles.savedBannerText}>Display preferences saved</Text>
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
  themeControlWrap: {
    marginTop: Spacing.xs,
  },
  themeExplainer: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    lineHeight: 15,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  toggleTextCol: {
    flex: 1,
    gap: 2,
    paddingRight: Spacing.md,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  toggleSub: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
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

import { VectorIcon } from '@/components/ui/icons';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { useRouter } from 'expo-router';
import React, { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface TopBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  right?: ReactNode;
  large?: boolean;
  transparent?: boolean;
}

export function TopBar({
  title,
  subtitle,
  onBack,
  showBack = false,
  right,
  large = false,
  transparent = false,
}: TopBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const isIOS = Platform.OS === 'ios';

  const handleBack = onBack ?? (showBack ? () => router.back() : undefined);

  const containerStyle = [
    styles.container,
    {
      paddingTop: insets.top > 0 ? insets.top : Spacing.sm,
      backgroundColor: transparent ? 'transparent' : Colors.neutral.card,
      borderBottomColor: transparent ? 'transparent' : Colors.neutral.borderLight,
    },
  ];

  if (isIOS) {
    return (
      <View style={containerStyle}>
        <View style={styles.iosBar}>
          <View style={styles.iosLeftSlot}>
            {handleBack && (
              <Pressable
                onPress={handleBack}
                hitSlop={8}
                style={({ pressed }) => [styles.iosBackButton, pressed && styles.pressed]}
              >
                <VectorIcon name="ChevronLeft" size={22} color={Colors.brand.primary} strokeWidth={2.5} />
                <Text style={styles.iosBackText}>{t('common.back')}</Text>
              </Pressable>
            )}
          </View>

          {!large && (
            <View style={styles.iosCenterSlot} pointerEvents="none">
              <Text
                style={styles.iosTitle}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {title}
              </Text>
              {subtitle && (
                <Text style={styles.iosSubtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>
          )}

          <View style={styles.iosRightSlot}>{right}</View>
        </View>

        {large && (
          <View style={styles.iosLargeHeader}>
            <Text style={Typography.display}>{title}</Text>
            {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
          </View>
        )}
      </View>
    );
  }

  // Android / Default (Material Top App Bar)
  return (
    <View style={containerStyle}>
      <View style={[styles.androidBar, large && styles.androidLargeBar]}>
        <View style={styles.androidMainRow}>
          {handleBack && (
            <Pressable
              onPress={handleBack}
              hitSlop={8}
              style={({ pressed }) => [styles.androidIconButton, pressed && styles.pressed]}
            >
              <VectorIcon name="ArrowLeft" size={24} color={Colors.neutral.textPrimary} />
            </Pressable>
          )}

          <View style={styles.androidTitleContainer}>
            <Text
              style={[
                large && !handleBack ? Typography.display : Typography.pageTitle,
                styles.androidTitleText,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={styles.subtitleText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {subtitle}
              </Text>
            )}
          </View>

          {right && <View style={styles.androidRightSlot}>{right}</View>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    zIndex: 10,
  },
  pressed: {
    opacity: 0.6,
  },
  // iOS styles
  iosBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  iosLeftSlot: {
    minWidth: 70,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  iosBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -4,
  },
  iosBackText: {
    fontSize: 17,
    color: Colors.brand.primary,
    fontWeight: '500',
  },
  iosCenterSlot: {
    position: 'absolute',
    left: 80,
    right: 80,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  iosSubtitle: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
    marginTop: 1,
  },
  iosRightSlot: {
    minWidth: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 2,
  },
  iosLargeHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  // Android styles
  androidBar: {
    minHeight: 56,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  androidLargeBar: {
    minHeight: 64,
    paddingBottom: Spacing.sm,
  },
  androidMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  androidIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  androidTitleContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  androidRightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    zIndex: 10,
    flexShrink: 0,
  },
  subtitleText: {
    ...Typography.caption,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  androidTitleText: {
    color: Colors.neutral.textPrimary,
  },
});

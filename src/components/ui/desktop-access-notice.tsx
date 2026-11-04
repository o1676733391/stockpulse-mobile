import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VectorIcon } from '@/components/ui/icons';
import { useI18n } from '@/i18n';
import { Colors, Spacing, Radius } from '@/constants/theme';

interface DesktopAccessNoticeProps {
  compact?: boolean;
}

export function DesktopAccessNotice({ compact = false }: DesktopAccessNoticeProps) {
  const { t } = useI18n();

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactIconBox}>
          <VectorIcon name="Laptop" size={14} color={Colors.brand.primary} />
        </View>
        <Text style={styles.compactText}>{t('desktopNotice.compact')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <VectorIcon name="Laptop" size={16} color={Colors.brand.primary} />
        </View>
        <View style={styles.titleWrap}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{t('desktopNotice.title')}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{t('desktopNotice.badge')}</Text>
            </View>
          </View>
          <Text style={styles.description}>{t('desktopNotice.description')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.brand.subtle,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.brand.light,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Colors.neutral.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.brand.light,
    marginTop: 1,
  },
  titleWrap: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  badge: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.neutral.textSecondary,
    lineHeight: 17,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.brand.subtle,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.brand.light,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    marginBottom: Spacing.sm,
  },
  compactIconBox: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    backgroundColor: Colors.neutral.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.brand.dark,
    lineHeight: 15,
  },
});

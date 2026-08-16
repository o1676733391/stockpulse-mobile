import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { BadgeVariant, Colors, Radius, Spacing, Typography } from '@/constants/theme';
import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const KPI_COLOR: Record<string, string> = {
  green:  Colors.brand.primary,
  amber:  Colors.warning.dark,
  red:    Colors.critical.main,
  blue:   Colors.info.main,
  gray:   Colors.neutral.textPrimary,
  purple: Colors.purple.main,
  orange: Colors.orange.main,
};

const KPI_BG: Record<string, string> = {
  green:  Colors.brand.subtle,
  amber:  Colors.warning.subtle,
  red:    Colors.critical.subtle,
  blue:   Colors.info.subtle,
  gray:   Colors.neutral.surface,
  purple: Colors.purple.subtle,
  orange: Colors.orange.subtle,
};

export interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  variant?: BadgeVariant;
  iconName?: string;
  trend?: {
    dir: 'up' | 'down' | 'flat';
    label: string;
  };
  onPress?: () => void;
}

export function TrendIndicator({ dir, label }: { dir: 'up' | 'down' | 'flat'; label: string }) {
  const isUp = dir === 'up';
  const isDown = dir === 'down';

  const iconName = isUp ? 'TrendingUp' : isDown ? 'TrendingDown' : 'Minus';
  const color = isUp ? Colors.brand.primary : isDown ? Colors.critical.main : Colors.neutral.textSecondary;
  const bg = isUp ? Colors.brand.subtle : isDown ? Colors.critical.subtle : Colors.neutral.borderLight;

  return (
    <View style={[styles.trendBadge, { backgroundColor: bg }]}>
      <VectorIcon name={iconName} size={11} color={color} strokeWidth={2.5} />
      <Text style={[styles.trendText, { color }]}>{label}</Text>
    </View>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  variant = 'gray',
  iconName,
  trend,
  onPress,
}: KpiCardProps) {
  const accentColor = KPI_COLOR[variant] ?? Colors.neutral.textPrimary;
  const iconBg = KPI_BG[variant] ?? Colors.neutral.surface;

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {iconName && (
          <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
            <VectorIcon name={iconName} size={15} color={accentColor} />
          </View>
        )}
      </View>

      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>

      <View style={styles.footer}>
        {sub && (
          <Text style={styles.sub} numberOfLines={1}>
            {sub}
          </Text>
        )}
        {trend && <TrendIndicator dir={trend.dir} label={trend.label} />}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    flex: 1,
    minHeight: 104,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
    flex: 1,
  },
  iconContainer: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    ...Typography.monoKpiLarge,
    fontSize: 24,
    lineHeight: 28,
    marginVertical: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  sub: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    flex: 1,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

import { VariancePill } from '@/components/ui/variance-pill';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

export interface StockMetricBoxProps {
  physicalStock: number;
  theoreticalStock: number;
  unit: string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function StockMetricBox({
  physicalStock,
  theoreticalStock,
  unit,
  compact = false,
  style,
}: StockMetricBoxProps) {
  const variance = physicalStock - theoreticalStock;
  const variancePct = theoreticalStock > 0 ? (variance / theoreticalStock) * 100 : 0;
  const absVariancePct = Math.abs(variancePct);

  const isMajor = absVariancePct > 10;
  const isMinor = absVariancePct > 5;
  const isMatch = variance === 0;

  const diffBg = isMajor
    ? Colors.critical.subtle
    : isMinor
    ? Colors.warning.subtle
    : Colors.neutral.surface;

  const diffBorder = isMajor
    ? Colors.critical.light
    : isMinor
    ? Colors.warning.light
    : Colors.neutral.borderLight;

  const diffText = isMajor
    ? Colors.critical.main
    : isMinor
    ? Colors.warning.dark
    : isMatch
    ? Colors.neutral.textTertiary
    : Colors.brand.primary;

  return (
    <View style={[styles.container, style]}>
      {/* ── 1. Physical (Is) ── */}
      <View style={styles.physicalBox}>
        <View style={styles.boxHeader}>
          <View style={styles.greenDot} />
          <Text style={styles.physicalLabel}>IS</Text>
        </View>
        <Text style={[styles.value, styles.physicalValue]}>{physicalStock}</Text>
        <Text style={styles.unitText}>{unit}</Text>
      </View>

      {/* ── 2. Theoretical (Should) ── */}
      <View style={styles.theoreticalBox}>
        <View style={styles.boxHeader}>
          <View style={styles.slateDot} />
          <Text style={styles.theoreticalLabel}>SHOULD</Text>
        </View>
        <Text style={[styles.value, styles.theoreticalValue]}>{theoreticalStock}</Text>
        <Text style={styles.unitText}>{unit}</Text>
      </View>

      {/* ── 3. Variance (Diff) ── */}
      <View style={[styles.diffBox, { backgroundColor: diffBg, borderColor: diffBorder }]}>
        <View style={styles.boxHeader}>
          <Text style={styles.diffLabel}>DIFF</Text>
        </View>
        <Text style={[styles.value, { color: diffText }]}>
          {isMatch ? '—' : `${variance > 0 ? '+' : ''}${variance.toFixed(1)}`}
        </Text>
        <View style={styles.pillWrapper}>
          <VariancePill value={variance} pct={variancePct} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  physicalBox: {
    flex: 1,
    backgroundColor: Colors.brand.subtle,
    borderColor: Colors.brand.light,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    justifyContent: 'space-between',
  },
  theoreticalBox: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    justifyContent: 'space-between',
  },
  diffBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    justifyContent: 'space-between',
  },
  boxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.brand.primary,
  },
  slateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.neutral.textTertiary,
  },
  physicalLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.brand.dark,
    letterSpacing: 0.5,
  },
  theoreticalLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.neutral.textSecondary,
    letterSpacing: 0.5,
  },
  diffLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.neutral.textSecondary,
    letterSpacing: 0.5,
  },
  value: {
    ...Typography.monoValue,
    fontSize: 17,
    lineHeight: 20,
  },
  physicalValue: {
    color: Colors.brand.dark,
  },
  theoreticalValue: {
    color: Colors.neutral.textSecondary,
  },
  unitText: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
    fontWeight: '500',
    marginTop: 2,
  },
  pillWrapper: {
    marginTop: 2,
  },
});

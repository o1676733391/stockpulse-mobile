import { Colors, Radius, Typography } from '@/constants/theme';
import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

export interface VariancePillProps {
  value: number;
  pct: number;
  style?: StyleProp<ViewStyle>;
}

export function VariancePill({ value, pct, style }: VariancePillProps) {
  const isNegative = value < 0;
  const isPositive = value > 0;
  const isZero = value === 0;

  const bg = isNegative
    ? Colors.critical.subtle
    : isPositive
    ? Colors.brand.subtle
    : Colors.neutral.borderLight;

  const text = isNegative
    ? Colors.critical.dark
    : isPositive
    ? Colors.brand.dark
    : Colors.neutral.textSecondary;

  const arrow = isNegative ? '▼' : isPositive ? '▲' : '';

  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: text }]}>
        {arrow ? `${arrow} ` : ''}
        {Math.abs(pct).toFixed(1)}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.monoCaption,
    fontSize: 10,
    fontWeight: '700',
  },
});

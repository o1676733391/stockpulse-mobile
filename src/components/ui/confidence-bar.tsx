import { Colors, Radius, Typography } from '@/constants/theme';
import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

export interface ConfidenceBarProps {
  value: number;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function ConfidenceBar({
  value,
  width = 46,
  height = 5,
  style,
}: ConfidenceBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  const color =
    clamped >= 90
      ? Colors.brand.primary
      : clamped >= 75
      ? Colors.warning.dark
      : Colors.critical.main;

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.track,
          { width, height, borderRadius: height / 2 },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${clamped}%`,
              backgroundColor: color,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
      <Text style={[styles.label, { color }]}>{Math.round(clamped)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  track: {
    backgroundColor: Colors.neutral.borderLight,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  label: {
    ...Typography.monoCaption,
    fontSize: 10,
    fontWeight: '700',
    minWidth: 26,
    textAlign: 'right',
  },
});

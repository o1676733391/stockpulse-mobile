import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export interface ProgressBarProps {
  value: number;
  max: number;
  variant?: 'green' | 'amber' | 'red' | 'blue';
  height?: number;
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  max,
  variant = 'green',
  height = 6,
  showLabel = false,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0));

  const fillColor = {
    green: Colors.brand.primary,
    amber: Colors.warning.main,
    red: Colors.critical.main,
    blue: Colors.info.main,
  }[variant];

  return (
    <View style={styles.container}>
      <View style={[styles.track, { height, borderRadius: height / 2 }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: fillColor,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={styles.label}>{Math.round(percentage)}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  track: {
    flex: 1,
    backgroundColor: Colors.neutral.borderLight,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  label: {
    ...Typography.monoCaption,
    fontSize: 11,
    color: Colors.neutral.textSecondary,
    width: 32,
    textAlign: 'right',
  },
});

import { BadgeStyles, BadgeVariant, Radius, Spacing, Typography } from '@/constants/theme';
import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Badge({ children, variant = 'gray', style, textStyle }: BadgeProps) {
  const current = BadgeStyles[variant] ?? BadgeStyles.gray;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: current.bg, borderColor: current.border },
        style,
      ]}
    >
      <Text style={[styles.text, { color: current.text }, textStyle]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...Typography.micro,
    lineHeight: 13,
  },
});

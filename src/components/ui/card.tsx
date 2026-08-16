import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import React, { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

export interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  urgencyColor?: string;
  noPadding?: boolean;
  dark?: boolean;
}

export function Card({
  children,
  style,
  onPress,
  urgencyColor,
  noPadding = false,
  dark = false,
}: CardProps) {
  const cardStyle = [
    styles.card,
    dark ? styles.darkCard : styles.lightCard,
    !noPadding && styles.padding,
    style,
  ];

  if (urgencyColor) {
    const content = (
      <View style={[cardStyle, styles.stripeContainer]}>
        <View style={[styles.stripe, { backgroundColor: urgencyColor }]} />
        <View style={[styles.stripeContent, !noPadding && styles.padding]}>
          {children}
        </View>
      </View>
    );

    if (onPress) {
      return (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          {content}
        </Pressable>
      );
    }
    return content;
  }

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.card,
  },
  lightCard: {
    backgroundColor: Colors.neutral.card,
    borderColor: Colors.neutral.borderLight,
    borderWidth: 1,
  },
  darkCard: {
    backgroundColor: Colors.neutral.darkCard,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
  },
  padding: {
    padding: Spacing.lg,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  stripeContainer: {
    flexDirection: 'row',
    padding: 0,
  },
  stripe: {
    width: 4,
    alignSelf: 'stretch',
  },
  stripeContent: {
    flex: 1,
  },
});

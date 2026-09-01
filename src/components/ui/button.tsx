import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'critical' | 'ghost' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label?: string;
  title?: string;
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  icon?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Button({
  label,
  title,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  icon,
  onPress,
  style,
  textStyle,
}: ButtonProps) {
  const isInteractive = !disabled && !loading;
  const displayLabel = label || title || (typeof children === 'string' ? children : '');
  const prefixIcon = leftIcon || icon;

  return (
    <Pressable
      onPress={isInteractive ? onPress : undefined}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        pressed && isInteractive && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? Colors.brand.primary : '#FFFFFF'}
        />
      ) : (
        <View style={styles.contentRow}>
          {prefixIcon && <View style={styles.leftIcon}>{prefixIcon}</View>}
          {displayLabel ? (
            <Text
              style={[
                styles.textBase,
                styles[`text_${variant}`],
                styles[`textSize_${size}`],
                disabled && styles.textDisabled,
                textStyle,
              ]}
            >
              {displayLabel}
            </Text>
          ) : (
            children
          )}
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  fullWidth: {
    width: '100%',
  },
  leftIcon: {
    marginRight: Spacing.xs,
  },
  rightIcon: {
    marginLeft: Spacing.xs,
  },
  // Sizes
  size_sm: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    minHeight: 36,
  },
  size_md: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    minHeight: 44,
  },
  size_lg: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    minHeight: 52,
  },
  // Variants
  primary: {
    backgroundColor: Colors.brand.primary,
    ...Shadows.sm,
  },
  secondary: {
    backgroundColor: Colors.brand.subtle,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
  },
  critical: {
    backgroundColor: Colors.critical.main,
    ...Shadows.sm,
  },
  success: {
    backgroundColor: Colors.brand.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  // States
  disabled: {
    opacity: 0.5,
    backgroundColor: Colors.neutral.border,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  // Text Styles
  textBase: {
    fontWeight: '700',
    textAlign: 'center',
  },
  textSize_sm: {
    fontSize: 13,
  },
  textSize_md: {
    fontSize: 14,
  },
  textSize_lg: {
    fontSize: 15,
  },
  text_primary: {
    color: '#FFFFFF',
  },
  text_secondary: {
    color: Colors.brand.dark,
  },
  text_outline: {
    color: Colors.neutral.textPrimary,
  },
  text_critical: {
    color: '#FFFFFF',
  },
  text_success: {
    color: '#FFFFFF',
  },
  text_ghost: {
    color: Colors.brand.primary,
  },
  textDisabled: {
    color: Colors.neutral.textTertiary,
  },
});

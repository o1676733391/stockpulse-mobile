import { Colors, Radius, Spacing } from '@/constants/theme';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';

export interface ChipRowProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function ChipRow({ options, value, onChange, style }: ChipRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, style]}
    >
      {options.map((opt) => {
        const isSelected = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={({ pressed }) => [
              styles.chip,
              isSelected ? styles.chipSelected : styles.chipUnselected,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
              ]}
            >
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: Colors.neutral.textPrimary,
    borderColor: Colors.neutral.textPrimary,
  },
  chipUnselected: {
    backgroundColor: Colors.neutral.borderLight,
    borderColor: Colors.neutral.borderLight,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  chipTextUnselected: {
    color: Colors.neutral.textSecondary,
  },
  pressed: {
    opacity: 0.8,
  },
});

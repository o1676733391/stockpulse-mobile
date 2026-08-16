import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

export interface SegmentedControlProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps) {
  return (
    <View style={[styles.container, style]}>
      {options.map((opt) => {
        const isSelected = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={({ pressed }) => [
              styles.segment,
              isSelected && styles.segmentSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.text,
                isSelected ? styles.textSelected : styles.textUnselected,
              ]}
            >
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral.borderLight,
    borderRadius: Radius.lg,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  segmentSelected: {
    backgroundColor: Colors.neutral.card,
    ...Shadows.card,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  textSelected: {
    color: Colors.neutral.textPrimary,
  },
  textUnselected: {
    color: Colors.neutral.textSecondary,
  },
  pressed: {
    opacity: 0.7,
  },
});

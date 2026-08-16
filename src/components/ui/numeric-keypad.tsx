import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

export interface NumericKeypadProps {
  onPressDigit: (digit: string) => void;
  onPressDot: () => void;
  onPressBack: () => void;
  style?: StyleProp<ViewStyle>;
}

export function NumericKeypad({
  onPressDigit,
  onPressDot,
  onPressBack,
  style,
}: NumericKeypadProps) {
  const digits = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
  ];

  return (
    <View style={[styles.container, style]}>
      {digits.map((row, rIdx) => (
        <View key={rIdx} style={styles.row}>
          {row.map((d) => (
            <Pressable
              key={d}
              onPress={() => onPressDigit(d)}
              style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
            >
              <Text style={styles.keyText}>{d}</Text>
            </Pressable>
          ))}
        </View>
      ))}

      {/* Bottom Keypad Row: Dot, 0, Backspace */}
      <View style={styles.row}>
        <Pressable
          onPress={onPressDot}
          style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
        >
          <Text style={styles.keyText}>.</Text>
        </Pressable>

        <Pressable
          onPress={() => onPressDigit('0')}
          style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
        >
          <Text style={styles.keyText}>0</Text>
        </Pressable>

        <Pressable
          onPress={onPressBack}
          style={({ pressed }) => [
            styles.key,
            styles.backKey,
            pressed && styles.keyPressed,
          ]}
        >
          <Text style={styles.backKeyText}>⌫</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  key: {
    flex: 1,
    height: 52,
    backgroundColor: Colors.neutral.card,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: {
    backgroundColor: Colors.neutral.borderLight,
    transform: [{ scale: 0.96 }],
  },
  keyText: {
    ...Typography.monoValue,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  backKey: {
    backgroundColor: Colors.neutral.surface,
  },
  backKeyText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
});

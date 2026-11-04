import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useI18n, SupportedLanguage } from '@/i18n';
import { Colors, Radius } from '@/constants/theme';

const QUICK_LANGUAGES: Array<{ code: SupportedLanguage; label: string }> = [
  { code: 'de', label: 'DE' },
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'es', label: 'ES' },
  { code: 'it', label: 'IT' },
];

interface LanguageQuickBarProps {
  dark?: boolean;
  compact?: boolean;
}

export function LanguageQuickBar({ dark = false, compact = false }: LanguageQuickBarProps) {
  const { language, setLanguage } = useI18n();

  const items = compact ? QUICK_LANGUAGES.slice(0, 2) : QUICK_LANGUAGES;

  return (
    <View style={[styles.container, dark && styles.containerDark]}>
      {items.map((item) => {
        const active = language === item.code;
        return (
          <Pressable
            key={item.code}
            onPress={() => setLanguage(item.code)}
            hitSlop={6}
            style={[
              styles.pill,
              active && (dark ? styles.pillActiveDark : styles.pillActive),
            ]}
          >
            <Text
              style={[
                styles.pillText,
                dark && styles.pillTextDark,
                active && (dark ? styles.pillTextActiveDark : styles.pillTextActive),
              ]}
            >
              {item.label}
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
    alignItems: 'center',
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.full,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    gap: 2,
  },
  containerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  pillActive: {
    backgroundColor: Colors.brand.primary,
  },
  pillActiveDark: {
    backgroundColor: '#FFFFFF',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.neutral.textSecondary,
  },
  pillTextDark: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  pillTextActiveDark: {
    color: '#064e3b',
  },
});


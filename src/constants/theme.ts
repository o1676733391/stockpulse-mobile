import { Platform, StyleSheet } from 'react-native';

export const Colors = {
  brand: {
    primary: '#059669', // Emerald 600
    subtle: '#ecfdf5',  // Emerald 50
    light: '#d1fae5',   // Emerald 100
    dark: '#047857',    // Emerald 700
  },
  warning: {
    main: '#f59e0b',    // Amber 500
    subtle: '#fffbeb',  // Amber 50
    light: '#fef3c7',   // Amber 100
    dark: '#b45309',    // Amber 700
  },
  critical: {
    main: '#ef4444',    // Red 500
    subtle: '#fef2f2',  // Red 50
    light: '#fee2e2',   // Red 100
    dark: '#b91c1c',    // Red 700
  },
  info: {
    main: '#3b82f6',    // Blue 500
    subtle: '#eff6ff',  // Blue 50
    light: '#dbeafe',   // Blue 100
    dark: '#1d4ed8',    // Blue 700
  },
  purple: {
    main: '#8b5cf6',    // Violet 500
    subtle: '#f5f3ff',  // Violet 50
    light: '#ede9fe',   // Violet 100
    dark: '#6d28d9',    // Violet 700
  },
  orange: {
    main: '#f97316',    // Orange 500
    subtle: '#fff7ed',  // Orange 50
    light: '#ffedd5',   // Orange 100
    dark: '#c2410c',    // Orange 700
  },
  neutral: {
    textPrimary: '#0f172a',   // Slate 900
    textSecondary: '#64748b', // Slate 500
    textTertiary: '#94a3b8',  // Slate 400
    border: '#e2e8f0',        // Slate 200
    borderLight: '#f1f5f9',   // Slate 100
    surface: '#f8fafc',       // Slate 50
    card: '#ffffff',          // White
    darkCard: '#1e293b',      // Slate 800
    darkSurface: '#0f172a',   // Slate 900
  },
  // Backward compatibility for basic theme hooks
  light: {
    text: '#0f172a',
    background: '#f8fafc',
    backgroundElement: '#f1f5f9',
    backgroundSelected: '#e2e8f0',
    textSecondary: '#64748b',
  },
  dark: {
    text: '#ffffff',
    background: '#0f172a',
    backgroundElement: '#1e293b',
    backgroundSelected: '#334155',
    textSecondary: '#94a3b8',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'system-ui',
    serif: 'serif',
    rounded: 'system-ui',
    mono: 'monospace',
  },
});

export type BadgeVariant = 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'purple' | 'orange';

export const BadgeStyles: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  green:  { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
  amber:  { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  red:    { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  blue:   { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  gray:   { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' },
  purple: { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' },
  orange: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  // Legacy numeric aliases
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

export const Typography = StyleSheet.create({
  display: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    letterSpacing: -0.5,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    letterSpacing: -0.3,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.neutral.textPrimary,
    lineHeight: 20,
  },
  bodySecondary: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.neutral.textSecondary,
    lineHeight: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.neutral.textSecondary,
  },
  micro: {
    fontSize: 11,
    fontWeight: '600',
  },
  monoKpiLarge: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    letterSpacing: -0.5,
  },
  monoValue: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  monoCaption: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
});

export const Shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 1,
    },
    default: {},
  }),
  card: Platform.select({
    ios: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
    android: {
      elevation: 1,
    },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
    },
    android: {
      elevation: 3,
    },
    default: {},
  }),
  elevated: Platform.select({
    ios: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 14,
    },
    android: {
      elevation: 6,
    },
    default: {},
  }),
};

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 440;

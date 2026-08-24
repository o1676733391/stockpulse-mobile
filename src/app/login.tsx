import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { UserRole } from '@/types/rbac';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { t } = useI18n();

  const DEMO_ACCOUNTS = [
    {
      role: 'admin' as UserRole,
      label: t('auth.adminRole'),
      email: 'anna.admin@restaurant.de',
      desc: t('auth.adminRoleDesc'),
      badgeColor: Colors.brand.primary,
    },
    {
      role: 'manager' as UserRole,
      label: t('auth.managerRole'),
      email: 'marco.manager@restaurant.de',
      desc: t('auth.managerRoleDesc'),
      badgeColor: Colors.info.main,
    },
    {
      role: 'supervisor' as UserRole,
      label: t('auth.supervisorRole'),
      email: 'david.lead@restaurant.de',
      desc: t('auth.supervisorRoleDesc'),
      badgeColor: Colors.purple.main,
    },
    {
      role: 'staff' as UserRole,
      label: t('auth.staffRole'),
      email: 'elena.cook@restaurant.de',
      desc: t('auth.staffRoleDesc'),
      badgeColor: Colors.warning.main,
    },
    {
      role: 'auditor' as UserRole,
      label: t('auth.auditorRole'),
      email: 'klaus.auditor@becker-consult.de',
      desc: t('auth.auditorRoleDesc'),
      badgeColor: '#64748b',
    },
  ];

  const [email, setEmail] = useState('anna.admin@restaurant.de');
  const [password, setPassword] = useState('StockPulse123!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg(t('auth.fillAllFields'));
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      await login(email.trim(), password);
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      setErrorMsg(err.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (demo: (typeof DEMO_ACCOUNTS)[0]) => {
    setEmail(demo.email);
    setPassword('StockPulse123!');
    setErrorMsg(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TopBar
        title={t('auth.signInButton')}
        subtitle={t('common.tagline')}
        showBack
        onBack={() => router.replace('/' as any)}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Banner */}
        <View style={styles.brandCard}>
          <View style={styles.brandLogoRow}>
            <View style={styles.brandIconBox}>
              <VectorIcon name="TrendingDown" size={24} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <View>
              <Text style={styles.brandName}>{t('common.appName')}</Text>
              <Text style={styles.brandTag}>{t('common.tagline')}</Text>
            </View>
          </View>
        </View>

        {/* Error Alert */}
        {errorMsg && (
          <View style={styles.errorBanner}>
            <VectorIcon name="AlertTriangle" size={16} color={Colors.critical.main} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Credentials Form */}
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>{t('auth.signInSubtitle')}</Text>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('auth.emailLabel')}</Text>
            <View style={styles.inputWrapper}>
              <VectorIcon name="Mail" size={18} color={Colors.neutral.textTertiary} />
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  setErrorMsg(null);
                }}
                placeholder={t('auth.emailPlaceholder')}
                placeholderTextColor={Colors.neutral.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {email.length > 0 && (
                <Pressable onPress={() => setEmail('')}>
                  <VectorIcon name="X" size={16} color={Colors.neutral.textTertiary} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('auth.passwordLabel')}</Text>
            <View style={styles.inputWrapper}>
              <VectorIcon name="Lock" size={18} color={Colors.neutral.textTertiary} />
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setErrorMsg(null);
                }}
                placeholder="••••••••••••"
                placeholderTextColor={Colors.neutral.textTertiary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <VectorIcon
                  name={showPassword ? 'EyeOff' : 'Eye'}
                  size={18}
                  color={Colors.neutral.textTertiary}
                />
              </Pressable>
            </View>
          </View>

          {/* Sign In Button */}
          <Button
            label={loading ? t('auth.signingIn') : t('auth.signInButton')}
            variant="primary"
            size="lg"
            fullWidth
            disabled={loading}
            onPress={handleLogin}
            rightIcon={
              loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <VectorIcon name="ArrowRight" size={18} color="#FFFFFF" />
              )
            }
          />
        </Card>

        {/* Quick Demo Role Selector */}
        <View style={styles.demoSection}>
          <Text style={styles.sectionHeader}>{t('auth.demoAccountsTitle')}</Text>

          <View style={styles.demoList}>
            {DEMO_ACCOUNTS.map((demo) => {
              const isSelected = email === demo.email;
              return (
                <Pressable
                  key={demo.role}
                  onPress={() => handleSelectDemo(demo)}
                  style={({ pressed }) => [
                    styles.demoItem,
                    isSelected && styles.demoItemSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.demoHeaderRow}>
                    <View style={[styles.roleBadge, { backgroundColor: demo.badgeColor }]}>
                      <Text style={styles.roleBadgeText}>{demo.label}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.selectedCheck}>
                        <VectorIcon name="Check" size={14} color={Colors.brand.primary} strokeWidth={3} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.demoEmail}>{demo.email}</Text>
                  <Text style={styles.demoDesc}>{demo.desc}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Create Store Link */}
        <View style={styles.registerPrompt}>
          <Text style={styles.registerText}>{t('auth.dontHaveAccount')}</Text>
          <Pressable onPress={() => router.push('/register' as any)}>
            <Text style={styles.registerLink}>{t('auth.registerNow')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  brandCard: {
    backgroundColor: '#064e3b',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  brandIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandTag: {
    fontSize: 12,
    color: '#a7f3d0',
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.critical.subtle,
    borderWidth: 1,
    borderColor: Colors.critical.light,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.critical.dark,
    flex: 1,
  },
  formCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
    backgroundColor: Colors.neutral.card,
    borderRadius: Radius.xl,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    marginBottom: Spacing.xs,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.neutral.textPrimary,
    height: '100%',
  },
  demoSection: {
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSub: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    marginBottom: Spacing.xs,
  },
  demoList: {
    gap: Spacing.sm,
  },
  demoItem: {
    backgroundColor: Colors.neutral.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    gap: 3,
  },
  demoItemSelected: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.subtle,
  },
  demoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  selectedCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.brand.primary,
  },
  demoEmail: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
    marginTop: 2,
  },
  demoDesc: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
  },
  registerPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  registerText: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  pressed: {
    opacity: 0.8,
  },
});

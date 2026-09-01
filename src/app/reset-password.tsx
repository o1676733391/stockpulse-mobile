import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { updatePassword, logout } = useAuth();
  const { t } = useI18n();

  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const isPasswordValid =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password);

  const handleReset = async () => {
    if (!isPasswordValid) {
      Alert.alert(
        'Invalid Password',
        'Password must be at least 8 characters long and contain uppercase, lowercase, and numbers.'
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords Mismatch', 'Passwords do not match. Please verify both fields.');
      return;
    }

    setIsLoading(true);
    try {
      await updatePassword(password);
      setIsSuccess(true);
      await logout();
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.message || 'Failed to update password. Your reset link may have expired.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <TopBar
        title="Create New Password"
        showBack
        onBack={() => router.replace('/login')}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {isSuccess ? (
            <View style={styles.successContainer}>
              <View style={styles.iconCircle}>
                <VectorIcon name="CheckCircle2" size={44} color={Colors.brand.primary} />
              </View>

              <Text style={styles.heading}>Password Updated!</Text>

              <Text style={styles.subheading}>
                Your password has been reset successfully. You can now sign in with your new credentials.
              </Text>

              <Button
                label="Sign In Now"
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => router.replace('/login')}
              />
            </View>
          ) : (
            <View style={styles.formContainer}>
              <View style={styles.iconCircle}>
                <VectorIcon name="Lock" size={40} color={Colors.brand.primary} />
              </View>

              <Text style={styles.heading}>Set New Password</Text>

              <Text style={styles.subheading}>
                Please choose a strong password to secure your restaurant and inventory access.
              </Text>

              {/* New Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.inputContainer}>
                  <VectorIcon name="Lock" size={20} color={Colors.neutral.textTertiary} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••••••"
                    placeholderTextColor={Colors.neutral.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <VectorIcon
                      name={showPassword ? 'EyeOff' : 'Eye'}
                      size={20}
                      color={Colors.neutral.textTertiary}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <View style={styles.inputContainer}>
                  <VectorIcon name="Lock" size={20} color={Colors.neutral.textTertiary} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••••••"
                    placeholderTextColor={Colors.neutral.textTertiary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Password Requirements Checklist */}
              <Card style={styles.checklistCard}>
                <View style={styles.checkItem}>
                  <VectorIcon
                    name={password.length >= 8 ? 'Check' : 'Circle'}
                    size={16}
                    color={password.length >= 8 ? Colors.brand.primary : Colors.neutral.textTertiary}
                  />
                  <Text style={styles.checkText}>At least 8 characters</Text>
                </View>
                <View style={styles.checkItem}>
                  <VectorIcon
                    name={/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'Check' : 'Circle'}
                    size={16}
                    color={
                      /[A-Z]/.test(password) && /[a-z]/.test(password)
                        ? Colors.brand.primary
                        : Colors.neutral.textTertiary
                    }
                  />
                  <Text style={styles.checkText}>Uppercase and lowercase letters</Text>
                </View>
                <View style={styles.checkItem}>
                  <VectorIcon
                    name={/[0-9]/.test(password) ? 'Check' : 'Circle'}
                    size={16}
                    color={/[0-9]/.test(password) ? Colors.brand.primary : Colors.neutral.textTertiary}
                  />
                  <Text style={styles.checkText}>Contains at least one number</Text>
                </View>
              </Card>

              <Button
                label="Update Password"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isLoading || !isPasswordValid || password !== confirmPassword}
                loading={isLoading}
                onPress={handleReset}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
  },
  scrollContent: {
    padding: Spacing.xl,
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  successContainer: {
    width: '100%',
    alignItems: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.brand.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.brand.primary,
  },
  heading: {
    ...Typography.pageTitle,
    color: Colors.neutral.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subheading: {
    ...Typography.body,
    color: Colors.neutral.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  inputGroup: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.label,
    color: Colors.neutral.textPrimary,
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: Colors.neutral.card,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.neutral.textPrimary,
    height: '100%',
  },
  checklistCard: {
    width: '100%',
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.neutral.card,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    marginBottom: Spacing.xl,
    gap: Spacing.xs,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkText: {
    ...Typography.caption,
    color: Colors.neutral.textSecondary,
  },
});

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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { resetPassword } = useAuth();
  const { t } = useI18n();

  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert(t('common.required'), t('auth.fillAllFields'));
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email.trim());
      setIsSubmitted(true);
    } catch (err: any) {
      // Show generic confirmation to prevent account enumeration
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <TopBar
        title="Reset Password"
        showBack
        onBack={() => router.back()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {isSubmitted ? (
            <View style={styles.submittedContainer}>
              <View style={styles.iconCircle}>
                <VectorIcon name="CheckCircle2" size={44} color={Colors.brand.primary} />
              </View>

              <Text style={styles.heading}>Check your email</Text>

              <Text style={styles.subheading}>
                If an account exists for that email address, we have sent a secure password reset link.
              </Text>

              <Card style={styles.emailCard}>
                <VectorIcon name="Mail" size={20} color={Colors.neutral.textSecondary} />
                <Text style={styles.emailText}>{email}</Text>
              </Card>

              <Button
                label="Back to Sign In"
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => router.replace('/login')}
              />
            </View>
          ) : (
            <View style={styles.formContainer}>
              <View style={styles.iconCircle}>
                <VectorIcon name="KeyRound" size={40} color={Colors.brand.primary} />
              </View>

              <Text style={styles.heading}>Forgot Password?</Text>

              <Text style={styles.subheading}>
                Enter your registered email address and we will send you a link to reset your password.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <VectorIcon name="Mail" size={20} color={Colors.neutral.textTertiary} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="name@restaurant.de"
                    placeholderTextColor={Colors.neutral.textTertiary}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
              </View>

              <Button
                label="Send Reset Link"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isLoading}
                loading={isLoading}
                onPress={handleSubmit}
                style={styles.actionButton}
              />

              <Pressable
                onPress={() => router.back()}
                style={styles.backButton}
                disabled={isLoading}
              >
                <Text style={styles.backText}>Back to Sign In</Text>
              </Pressable>
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
  submittedContainer: {
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
    marginBottom: Spacing.xl,
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
  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.neutral.card,
    borderRadius: Radius.md,
    gap: Spacing.sm,
    width: '100%',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  emailText: {
    ...Typography.body,
    color: Colors.neutral.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  actionButton: {
    marginBottom: Spacing.lg,
  },
  backButton: {
    paddingVertical: Spacing.sm,
  },
  backText: {
    ...Typography.body,
    color: Colors.brand.primary,
    fontWeight: '600',
  },
});

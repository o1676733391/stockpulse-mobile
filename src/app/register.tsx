import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
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

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please fill in all required fields (Name, Email, Password).');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      await register(
        name.trim(),
        email.trim(),
        password,
        storeName.trim() || `${name.trim()}'s Kitchen`,
        phone.trim() || undefined,
        'admin'
      );
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TopBar
        title="Register Store"
        subtitle="Start Your Free Inventory Setup"
        showBack
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Error Banner */}
        {errorMsg && (
          <View style={styles.errorBanner}>
            <VectorIcon name="AlertTriangle" size={16} color={Colors.critical.main} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Store & Owner Details</Text>

          {/* Owner Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Your Full Name *</Text>
            <View style={styles.inputWrapper}>
              <VectorIcon name="User" size={18} color={Colors.neutral.textTertiary} />
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  setErrorMsg(null);
                }}
                placeholder="e.g. Chef Alessandro Romano"
                placeholderTextColor={Colors.neutral.textTertiary}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Restaurant / Store Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Restaurant / Outlet Name</Text>
            <View style={styles.inputWrapper}>
              <VectorIcon name="Store" size={18} color={Colors.neutral.textTertiary} />
              <TextInput
                style={styles.textInput}
                value={storeName}
                onChangeText={setStoreName}
                placeholder="e.g. Trattoria da Romano"
                placeholderTextColor={Colors.neutral.textTertiary}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Business Email *</Text>
            <View style={styles.inputWrapper}>
              <VectorIcon name="Mail" size={18} color={Colors.neutral.textTertiary} />
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  setErrorMsg(null);
                }}
                placeholder="alessandro@trattoria.de"
                placeholderTextColor={Colors.neutral.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <VectorIcon name="Phone" size={18} color={Colors.neutral.textTertiary} />
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="+49 30 1234 5678"
                placeholderTextColor={Colors.neutral.textTertiary}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password *</Text>
            <View style={styles.inputWrapper}>
              <VectorIcon name="Lock" size={18} color={Colors.neutral.textTertiary} />
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setErrorMsg(null);
                }}
                placeholder="Min. 6 characters"
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

          {/* Submit Button */}
          <Button
            label={loading ? 'Creating Store...' : 'Create Account & Setup Store'}
            variant="primary"
            size="lg"
            fullWidth
            disabled={loading}
            onPress={handleRegister}
            rightIcon={
              loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <VectorIcon name="CheckCircle" size={18} color="#FFFFFF" />
              )
            }
          />
        </Card>

        {/* Existing account prompt */}
        <View style={styles.loginPrompt}>
          <Text style={styles.loginText}>Already registered?</Text>
          <Pressable onPress={() => router.push('/login' as any)}>
            <Text style={styles.loginLink}>Sign In Here</Text>
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
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  loginText: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
});

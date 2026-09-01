import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { authService } from '@/services/authService';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { authState } = useAuth();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('Verifying your credentials...');

  useEffect(() => {
    let active = true;

    async function processCallback() {
      try {
        setLoading(true);
        setErrorMsg(null);
        setStatusText('Confirming email and establishing secure session...');

        // 1. Get initial URL if app was launched via deep link
        const initialUrl = await Linking.getInitialURL();
        const currentUrl = typeof window !== 'undefined' ? window.location.href : initialUrl;

        if (!currentUrl) {
          throw new Error('No deep link parameters received. Please try logging in directly.');
        }

        const result = await authService.handleAuthCallback(currentUrl);

        if (!active) return;

        if (result.type === 'recovery') {
          setStatusText('Redirecting to password reset...');
          setTimeout(() => {
            router.replace('/reset-password' as any);
          }, 600);
          return;
        }

        setStatusText('Verification successful! Welcome to StockPulse.');
        setTimeout(() => {
          router.replace('/(tabs)' as any);
        }, 800);
      } catch (err: any) {
        if (!active) return;
        console.error('[AuthCallback] Error processing callback URL:', err);
        setErrorMsg(err.message || 'Unable to confirm authentication session. Link may have expired.');
        setLoading(false);
      }
    }

    processCallback();

    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Card style={styles.card}>
        <View style={styles.iconContainer}>
          {loading ? (
            <View style={styles.spinnerWrapper}>
              <ActivityIndicator size="large" color={Colors.brand.primary} />
            </View>
          ) : errorMsg ? (
            <View style={styles.errorIconBox}>
              <VectorIcon name="AlertTriangle" size={32} color={Colors.critical.main} />
            </View>
          ) : (
            <View style={styles.successIconBox}>
              <VectorIcon name="CheckCircle2" size={32} color={Colors.brand.primary} />
            </View>
          )}
        </View>

        <Text style={styles.title}>
          {loading ? 'Confirming Authentication' : errorMsg ? 'Verification Error' : 'Success!'}
        </Text>

        <Text style={styles.subtitle}>
          {errorMsg ? errorMsg : statusText}
        </Text>

        {errorMsg && (
          <View style={styles.actionsRow}>
            <Button
              label="Go to Sign In"
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => router.replace('/login' as any)}
            />
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: Spacing.xxl,
    borderRadius: Radius.xl,
    backgroundColor: Colors.neutral.card,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconContainer: {
    marginVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerWrapper: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.critical.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.pageTitle,
    textAlign: 'center',
    color: Colors.neutral.textPrimary,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    color: Colors.neutral.textSecondary,
    lineHeight: 22,
  },
  actionsRow: {
    width: '100%',
    marginTop: Spacing.md,
  },
});

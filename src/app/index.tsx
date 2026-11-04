import { Button } from '@/components/ui/button';
import { VectorIcon } from '@/components/ui/icons';
import { LanguageQuickBar } from '@/components/ui/language-quick-bar';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { authState, isAuthenticated, user } = useAuth();
  const { t } = useI18n();

  // Animation values
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 800,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [logoScale, logoOpacity, contentFade, pulseAnim]);

  const handleGetStarted = () => {
    if (authState === 'EMAIL_VERIFICATION_REQUIRED') {
      router.replace('/verify-email' as any);
    } else if (authState === 'ACCOUNT_DISABLED') {
      router.replace('/account-disabled' as any);
    } else if (isAuthenticated) {
      if (user?.storeId && user.storeId !== 'unassigned') {
        router.replace('/(tabs)' as any);
      } else {
        router.replace('/onboarding' as any);
      }
    } else {
      router.push('/login' as any);
    }
  };

  const handleSignIn = () => {
    if (authState === 'EMAIL_VERIFICATION_REQUIRED') {
      router.replace('/verify-email' as any);
    } else if (authState === 'ACCOUNT_DISABLED') {
      router.replace('/account-disabled' as any);
    } else {
      router.push('/login' as any);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#064e3b" />

      {/* Decorative Gradient/Ambient Shapes */}
      <View style={styles.topAura} pointerEvents="none" />
      <View style={styles.bottomAura} pointerEvents="none" />

      {/* Top Language Bar */}
      <View style={styles.topLangRow}>
        <LanguageQuickBar dark />
      </View>

      {/* Main Brand Hero Section */}
      <View style={styles.heroSection}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }, { scale: pulseAnim }],
            },
          ]}
        >
          <View style={styles.logoBadge}>
            <VectorIcon name="TrendingDown" size={38} color="#FFFFFF" strokeWidth={2.8} />
          </View>
        </Animated.View>

        <Animated.View style={[styles.brandTextContainer, { opacity: contentFade }]}>
          <Text style={styles.brandTitle}>{t('common.appName')}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>{t('desktopNotice.badge')}</Text>
            </View>
            <View style={[styles.badgePill, styles.badgePillAccent]}>
              <Text style={[styles.badgeText, styles.badgeTextAccent]}>AI OCR & BOM</Text>
            </View>
          </View>

          <Text style={styles.brandSubtitle}>{t('common.tagline')}</Text>
        </Animated.View>
      </View>

      {/* Feature Highlights Card */}
      <Animated.View style={[styles.highlightsContainer, { opacity: contentFade }]}>
        <View style={styles.featureItem}>
          <View style={[styles.featureIconBox, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
            <VectorIcon name="ScanLine" size={18} color="#34d399" />
          </View>
          <View style={styles.featureTextBox}>
            <Text style={styles.featureTitle}>{t('scan.title')}</Text>
            <Text style={styles.featureDesc}>{t('scan.processingSubtitle')}</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={[styles.featureIconBox, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
            <VectorIcon name="Layers" size={18} color="#fbbf24" />
          </View>
          <View style={styles.featureTextBox}>
            <Text style={styles.featureTitle}>{t('upperGroups.title')}</Text>
            <Text style={styles.featureDesc}>{t('upperGroups.subtitle')}</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={[styles.featureIconBox, { backgroundColor: 'rgba(96, 165, 250, 0.15)' }]}>
            <VectorIcon name="Laptop" size={18} color="#60a5fa" />
          </View>
          <View style={styles.featureTextBox}>
            <Text style={styles.featureTitle}>{t('desktopNotice.title')}</Text>
            <Text style={styles.featureDesc}>{t('desktopNotice.compact')}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Bottom CTA Action Bar */}
      <Animated.View style={[styles.bottomBar, { opacity: contentFade }]}>
        <Button
          label={
            isAuthenticated
              ? `${t('registerWizard.continueButton')} (${user.name.split(' ')[0]})`
              : t('auth.signInButton')
          }
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleGetStarted}
          rightIcon={<VectorIcon name="ChevronRight" size={18} color="#FFFFFF" />}
        />

        {!isAuthenticated && (
          <Pressable
            onPress={() => router.push({ pathname: '/login', params: { mode: 'staff' } } as any)}
            style={({ pressed }) => [styles.staffJoinBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="KeyRound" size={14} color="#a7f3d0" />
            <Text style={styles.staffJoinBtnText}>
              {t('auth.staffPrompt')} {t('auth.claimInvite')}
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={
            isAuthenticated
              ? handleSignIn
              : () => router.push('/register' as any)
          }
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryBtnText}>
            {isAuthenticated
              ? t('auth.signInButton')
              : `${t('auth.dontHaveAccount')} ${t('auth.registerNow')}`}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#064e3b',
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
  },
  topLangRow: {
    alignItems: 'flex-end',
    marginTop: Spacing.xs,
  },
  topAura: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(52, 211, 153, 0.18)',
  },
  bottomAura: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  heroSection: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  logoContainer: {
    marginBottom: Spacing.lg,
  },
  logoBadge: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    ...Shadows.lg,
  },
  brandTextContainer: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    marginBottom: Spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  badgePill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  badgePillAccent: {
    backgroundColor: 'rgba(52, 211, 153, 0.25)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E2E8F0',
    letterSpacing: 0.5,
  },
  badgeTextAccent: {
    color: '#6ee7b7',
  },
  brandSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  highlightsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextBox: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  featureDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 1,
  },
  bottomBar: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    zIndex: 10,
  },
  staffJoinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    borderRadius: Radius.xl,
    paddingVertical: 12,
    gap: 6,
  },
  staffJoinBtnText: {
    color: '#a7f3d0',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    ...Typography.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
});

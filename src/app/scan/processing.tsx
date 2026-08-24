import { VectorIcon } from '@/components/ui/icons';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OCRProcessingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);

  const STEPS = [
    t('scan.processingSteps.uploading'),
    t('scan.processingSteps.reading'),
    t('scan.processingSteps.detecting'),
    t('scan.processingSteps.calculating'),
    t('scan.processingSteps.mapping'),
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= STEPS.length - 1) {
          clearInterval(timer);
          setTimeout(() => {
            router.replace('/scan/review' as any);
          }, 600);
          return prev;
        }
        return prev + 1;
      });
    }, 700);

    return () => clearInterval(timer);
  }, [router, STEPS.length]);

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top > 0 ? insets.top + Spacing.xl : Spacing.xxl,
          paddingBottom: insets.bottom > 0 ? insets.bottom + Spacing.xl : Spacing.xxl,
        },
      ]}
    >
      {/* ── Top Pulsing AI Orb ── */}
      <View style={styles.orbContainer}>
        <View style={styles.outerGlow} />
        <View style={styles.innerOrb}>
          <Text style={styles.orbText}>AI</Text>
        </View>
      </View>

      {/* ── Title & Status Text ── */}
      <View style={styles.titleBox}>
        <Text style={styles.titleText}>{t('scan.processingTitle')}</Text>
        <Text style={styles.subText}>
          {t('scan.processingSubtitle')}
        </Text>
      </View>

      {/* ── 5-Step Animated Checklist ── */}
      <View style={styles.stepsContainer}>
        {STEPS.map((stepName, i) => {
          const isDone = i < currentStep;
          const isActive = i === currentStep;

          return (
            <View key={stepName} style={styles.stepRow}>
              {/* Step Circle Indicator */}
              <View
                style={[
                  styles.stepIndicator,
                  isDone && styles.stepIndicatorDone,
                  isActive && styles.stepIndicatorActive,
                ]}
              >
                {isDone ? (
                  <VectorIcon name="Check" size={14} color="#ffffff" strokeWidth={3} />
                ) : isActive ? (
                  <ActivityIndicator size="small" color={Colors.brand.primary} />
                ) : (
                  <View style={styles.stepDotPending} />
                )}
              </View>

              {/* Step Label */}
              <Text
                style={[
                  styles.stepLabel,
                  isDone && styles.stepLabelDone,
                  isActive && styles.stepLabelActive,
                ]}
              >
                {stepName}
              </Text>

              {/* Trailing Completed Checkmark */}
              {isDone && (
                <View style={styles.stepCheckmarkRight}>
                  <VectorIcon
                    name="CheckCircle2"
                    size={16}
                    color={Colors.brand.primary}
                  />
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.neutral.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
  },
  orbContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
  },
  outerGlow: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
  },
  innerOrb: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.elevated,
  },
  orbText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },
  titleBox: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  titleText: {
    ...Typography.pageTitle,
    fontSize: 22,
    color: Colors.neutral.textPrimary,
    textAlign: 'center',
  },
  subText: {
    ...Typography.bodySecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  stepsContainer: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.card,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.neutral.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicatorDone: {
    backgroundColor: Colors.brand.primary,
  },
  stepIndicatorActive: {
    backgroundColor: Colors.brand.subtle,
    borderColor: Colors.brand.primary,
    borderWidth: 2,
  },
  stepDotPending: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.neutral.textTertiary,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.textTertiary,
    flex: 1,
  },
  stepLabelDone: {
    color: Colors.brand.dark,
    fontWeight: '600',
  },
  stepLabelActive: {
    color: Colors.neutral.textPrimary,
    fontWeight: '700',
  },
  stepCheckmarkRight: {
    marginLeft: 'auto',
  },
});

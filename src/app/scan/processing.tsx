import { Button } from '@/components/ui/button';
import { VectorIcon } from '@/components/ui/icons';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { ocrService } from '@/services/ocrService';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  const params = useLocalSearchParams<{ imageUri?: string }>();
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  const STEPS = [
    t('scan.processingSteps.uploading'),
    t('scan.processingSteps.reading'),
    t('scan.processingSteps.detecting'),
    t('scan.processingSteps.calculating'),
    t('scan.processingSteps.mapping'),
  ];

  const executeOcr = async () => {
    setErrorMsg(null);
    setIsProcessing(true);
    setCurrentStep(0);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 600);

    try {
      const result = await ocrService.processImage(params.imageUri);
      clearInterval(stepInterval);
      setCurrentStep(STEPS.length - 1);
      setIsProcessing(false);

      setTimeout(() => {
        router.replace({
          pathname: '/scan/review',
          params: {
            reportId: result.report.id,
            reportData: JSON.stringify(result.report),
          },
        } as any);
      }, 400);
    } catch (err: any) {
      clearInterval(stepInterval);
      setIsProcessing(false);
      setErrorMsg(err.message || 'OCR extraction failed. Please check image quality and try again.');
    }
  };

  useEffect(() => {
    executeOcr();
  }, [params.imageUri]);

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
        <View style={[styles.outerGlow, errorMsg ? styles.outerGlowError : null]} />
        <View style={[styles.innerOrb, errorMsg ? styles.innerOrbError : null]}>
          {errorMsg ? (
            <VectorIcon name="AlertCircle" size={32} color="#ef4444" />
          ) : (
            <Text style={styles.orbText}>AI</Text>
          )}
        </View>
      </View>

      {/* ── Title & Status Text ── */}
      <View style={styles.titleBox}>
        <Text style={styles.titleText}>
          {errorMsg ? 'Extraction Failed' : t('scan.processingTitle')}
        </Text>
        <Text style={[styles.subText, errorMsg ? styles.subTextError : null]}>
          {errorMsg ? errorMsg : t('scan.processingSubtitle')}
        </Text>
      </View>

      {/* ── 5-Step Animated Checklist or Error Actions ── */}
      {!errorMsg ? (
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
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.errorActionBox}>
          <Button
            label="Try Again"
            variant="primary"
            size="md"
            fullWidth
            onPress={executeOcr}
            style={{ marginBottom: Spacing.sm }}
          />
          <Button
            label="Back to Camera"
            variant="outline"
            size="md"
            fullWidth
            onPress={() => router.replace('/(tabs)/scan' as any)}
          />
        </View>
      )}

      {/* ── Bottom Secure Notice ── */}
      <View style={styles.bottomNotice}>
        <VectorIcon name="Shield" size={14} color="#64748b" />
        <Text style={styles.noticeText}>
          Receipt processing with Vertex AI Gemini 2.5 Flash
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
  },
  orbContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  outerGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
  },
  outerGlowError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  innerOrb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerOrbError: {
    borderColor: '#ef4444',
  },
  orbText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  titleBox: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  subTextError: {
    color: '#fca5a5',
  },
  stepsContainer: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#334155',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xs + 2,
  },
  stepIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  stepIndicatorDone: {
    backgroundColor: '#10b981',
  },
  stepIndicatorActive: {
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
    borderWidth: 1,
    borderColor: Colors.brand.primary,
  },
  stepDotPending: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#64748b',
  },
  stepLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  stepLabelDone: {
    color: '#f8fafc',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: Colors.brand.primary,
    fontWeight: '600',
  },
  errorActionBox: {
    width: '100%',
    paddingHorizontal: Spacing.md,
  },
  bottomNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  noticeText: {
    fontSize: 12,
    color: '#64748b',
  },
});

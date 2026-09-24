import { Button } from '@/components/ui/button';
import { VectorIcon } from '@/components/ui/icons';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { ocrService } from '@/services/ocrService';
import { OcrDocumentType } from '@/types/ocr';
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
  const params = useLocalSearchParams<{ imageUri?: string; documentType?: string }>();
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  const documentType: OcrDocumentType =
    params.documentType === 'goods_receipt' ? 'goods_receipt' : 'order_invoice';

  const STEPS =
    documentType === 'goods_receipt'
      ? [
          t('scan.processingSteps.uploading'),
          t('scan.processingSteps.reading'),
          t('scan.processingSteps.detecting'),
          'Verifying delivery items & purchase costs...',
          'Matching raw materials with warehouse catalog...',
        ]
      : [
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
      const result = await ocrService.processImage(params.imageUri, documentType);
      clearInterval(stepInterval);
      setCurrentStep(STEPS.length - 1);
      setIsProcessing(false);

      setTimeout(() => {
        router.replace({
          pathname: '/scan/review',
          params: {
            reportId: result.report.id,
            reportData: JSON.stringify(result.report),
            documentType,
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
  }, [params.imageUri, params.documentType]);

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
          {errorMsg
            ? errorMsg
            : documentType === 'goods_receipt'
            ? 'Gemini AI Agent is extracting delivery lines, quantities, and vendor details...'
            : t('scan.processingSubtitle')}
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
            label="Cancel"
            variant="ghost"
            size="md"
            fullWidth
            onPress={() => router.replace('/(tabs)/scan' as any)}
          />
        </View>
      )}

      {/* ── Security / Compliance Badge ── */}
      <View style={styles.securityBadge}>
        <VectorIcon name="ShieldCheck" size={14} color="#10b981" />
        <Text style={styles.securityText}>Gemini Document AI · Confidential & Encrypted</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  outerGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  outerGlowError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  innerOrb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#064e3b',
    borderWidth: 2,
    borderColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.elevated,
  },
  innerOrbError: {
    backgroundColor: '#450a0a',
    borderColor: '#dc2626',
  },
  orbText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#34d399',
    letterSpacing: 1,
  },
  titleBox: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  titleText: {
    ...Typography.pageTitle,
    color: '#ffffff',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subText: {
    ...Typography.body,
    color: '#94a3b8',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  subTextError: {
    color: '#f87171',
  },
  stepsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicatorDone: {
    backgroundColor: '#10b981',
  },
  stepIndicatorActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1.5,
    borderColor: '#10b981',
  },
  stepDotPending: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#64748b',
  },
  stepLabel: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
  },
  stepLabelDone: {
    color: '#e2e8f0',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  errorActionBox: {
    width: '100%',
    paddingHorizontal: Spacing.md,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  securityText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
});

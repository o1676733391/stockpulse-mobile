import { VectorIcon } from '@/components/ui/icons';
import { NumericKeypad } from '@/components/ui/numeric-keypad';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { mockStockCountItems } from '@/mocks/inventoryMockData';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ActiveStockCountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';

  const [idx, setIdx] = useState(0);
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [showNote, setShowNote] = useState(false);
  const [notes, setNotes] = useState<Record<number, string>>({});

  const total = mockStockCountItems.length;
  const currentItem = mockStockCountItems[idx];
  const currentValue = counts[idx] ?? '';
  const parsedValue = parseFloat(currentValue);
  const hasValue = !isNaN(parsedValue) && currentValue !== '';

  const variance = hasValue ? parsedValue - currentItem.expected : null;
  const variancePct =
    variance !== null && currentItem.expected > 0
      ? (variance / currentItem.expected) * 100
      : null;

  const isMajor = variance !== null && Math.abs(variancePct!) > 10;
  const isMinor = variance !== null && Math.abs(variancePct!) > 0 && !isMajor;
  const isMatch = variance !== null && variance === 0;

  // Keypad Handlers
  const handlePressDigit = (d: string) => {
    setCounts((prev) => ({
      ...prev,
      [idx]: (prev[idx] ?? '') + d,
    }));
  };

  const handlePressDot = () => {
    setCounts((prev) => {
      const existing = prev[idx] ?? '';
      if (existing.includes('.')) return prev;
      return { ...prev, [idx]: existing + '.' };
    });
  };

  const handlePressBack = () => {
    setCounts((prev) => {
      const existing = prev[idx] ?? '';
      return { ...prev, [idx]: existing.slice(0, -1) };
    });
  };

  // Step navigation
  const handleNext = () => {
    if (idx < total - 1) {
      setIdx((i) => i + 1);
    } else {
      router.push('/stock-count/summary' as any);
    }
  };

  const handlePrev = () => {
    if (idx > 0) setIdx((i) => i - 1);
  };

  const handleSkip = () => {
    if (idx < total - 1) setIdx((i) => i + 1);
  };

  const progressPercentage = Math.round(((idx + 42) / 68) * 100);

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.card }]}>
      {/* ── Top Header Bar ── */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top > 0 ? insets.top + Spacing.xs : Spacing.md },
        ]}
      >
        <View style={styles.headerRow}>
          {/* Exit Button */}
          {isIOS ? (
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.exitBtn, pressed && styles.pressed]}
            >
              <VectorIcon name="ChevronLeft" size={20} color={Colors.brand.primary} strokeWidth={2.5} />
              <Text style={styles.exitText}>Exit</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.iconCircleBtn, pressed && styles.pressed]}
            >
              <VectorIcon name="X" size={20} color={Colors.neutral.textPrimary} />
            </Pressable>
          )}

          {/* Count Title & Index */}
          <View style={styles.headerCenter}>
            <Text style={styles.headerCategory}>Daily Stock Count</Text>
            <Text style={styles.headerProgressText}>
              {idx + 1} of {total}
            </Text>
          </View>

          {/* Note Toggle & Barcode Action */}
          <View style={styles.headerRight}>
            <Pressable
              onPress={() => setShowNote(!showNote)}
              style={({ pressed }) => [
                styles.iconCircleBtn,
                showNote && styles.iconActive,
                pressed && styles.pressed,
              ]}
            >
              <VectorIcon
                name="MessageSquare"
                size={18}
                color={showNote ? Colors.info.main : Colors.neutral.textSecondary}
              />
            </Pressable>

            <Pressable
              onPress={() => {}}
              style={({ pressed }) => [styles.iconCircleBtn, pressed && styles.pressed]}
            >
              <VectorIcon name="Barcode" size={18} color={Colors.neutral.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarWrapper}>
          <ProgressBar value={idx + 42} max={68} variant="green" height={5} />
          <View style={styles.progressMeta}>
            <Text style={styles.progressMetaLeft}>42 completed</Text>
            <Text style={styles.progressMetaRight}>{progressPercentage}%</Text>
          </View>
        </View>
      </View>

      {/* ── Scrollable Body with Item Info & Theory / Is Display ── */}
      <ScrollView
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Item Info Header */}
        <View style={styles.itemInfoBox}>
          <Text style={styles.itemCategorySku}>
            {currentItem.category} · {currentItem.sku}
          </Text>
          <Text style={styles.itemName}>{currentItem.name}</Text>
        </View>

        {/* ── THEORY (Should) Reference Card ── */}
        <View style={styles.theoryCard}>
          <View>
            <View style={styles.theoryHeaderRow}>
              <View style={styles.slateDot} />
              <Text style={styles.theoryLabel}>THEORY / SHOULD BE</Text>
            </View>
            <Text style={styles.theorySub}>System expected quantity</Text>
          </View>
          <View style={styles.theoryValueBox}>
            <Text style={styles.theoryValue}>{currentItem.expected}</Text>
            <Text style={styles.theoryUnit}>{currentItem.unit}</Text>
          </View>
        </View>

        {/* ── PHYSICAL (Is) Input Card ── */}
        <View style={styles.physicalSection}>
          <View style={styles.physicalHeaderRow}>
            <View style={styles.greenDot} />
            <Text style={styles.physicalLabel}>PHYSICAL / IS</Text>
          </View>

          {/* Big Input Number Box */}
          <View
            style={[
              styles.inputDisplayBox,
              hasValue && isMajor && styles.inputBoxMajor,
              hasValue && isMinor && styles.inputBoxMinor,
              hasValue && isMatch && styles.inputBoxMatch,
            ]}
          >
            <Text
              style={[
                styles.inputValueText,
                hasValue && isMajor && { color: Colors.critical.dark },
                hasValue && isMinor && { color: Colors.warning.dark },
                hasValue && isMatch && { color: Colors.brand.dark },
              ]}
            >
              {currentValue || '—'}
            </Text>
            <Text
              style={[
                styles.inputUnitText,
                hasValue && { color: Colors.neutral.textPrimary },
              ]}
            >
              {currentItem.unit}
            </Text>
          </View>

          {/* Live Variance Calculation Banner */}
          {variance !== null && (
            <View
              style={[
                styles.liveVarianceBanner,
                isMajor && styles.varianceMajor,
                isMinor && styles.varianceMinor,
                isMatch && styles.varianceMatch,
              ]}
            >
              <View style={styles.varianceLeft}>
                <VectorIcon
                  name={isMajor ? 'AlertTriangle' : isMatch ? 'CheckCircle2' : 'AlertTriangle'}
                  size={16}
                  color={
                    isMajor
                      ? Colors.critical.main
                      : isMatch
                      ? Colors.brand.primary
                      : Colors.warning.dark
                  }
                />
                <View>
                  <Text style={styles.varianceHeading}>Variance</Text>
                  {isMajor && (
                    <Text style={styles.varianceWarningText}>Major — review required</Text>
                  )}
                </View>
              </View>

              <View style={styles.varianceRight}>
                <Text
                  style={[
                    styles.varianceDeltaText,
                    isMajor && { color: Colors.critical.dark },
                    isMinor && { color: Colors.warning.dark },
                    isMatch && { color: Colors.brand.dark },
                  ]}
                >
                  {variance > 0 ? '+' : ''}{variance.toFixed(1)} {currentItem.unit}
                </Text>
                <Text
                  style={[
                    styles.variancePctText,
                    isMajor && { color: Colors.critical.main },
                    isMinor && { color: Colors.warning.dark },
                    isMatch && { color: Colors.brand.primary },
                  ]}
                >
                  {variancePct! > 0 ? '+' : ''}{variancePct!.toFixed(1)}%
                </Text>
              </View>
            </View>
          )}

          {/* Optional Note Box */}
          {showNote && (
            <View style={styles.noteContainer}>
              <TextInput
                value={notes[idx] ?? ''}
                onChangeText={(text) =>
                  setNotes((prev) => ({ ...prev, [idx]: text }))
                }
                placeholder="Add a note about this count item…"
                placeholderTextColor={Colors.neutral.textTertiary}
                multiline
                numberOfLines={2}
                style={styles.noteInput}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Numeric Keypad ── */}
      <View style={styles.keypadContainer}>
        <NumericKeypad
          onPressDigit={handlePressDigit}
          onPressDot={handlePressDot}
          onPressBack={handlePressBack}
        />
      </View>

      {/* ── Bottom Action Row (Thumb Reachable) ── */}
      <View
        style={[
          styles.bottomActions,
          { paddingBottom: insets.bottom > 0 ? insets.bottom + Spacing.xs : Spacing.lg },
        ]}
      >
        <Pressable
          onPress={handlePrev}
          disabled={idx === 0}
          style={({ pressed }) => [
            styles.secondaryBtn,
            idx === 0 && styles.btnDisabled,
            pressed && styles.pressed,
          ]}
        >
          <VectorIcon name="ChevronLeft" size={16} color={Colors.neutral.textPrimary} />
          <Text style={styles.secondaryBtnText}>Prev</Text>
        </Pressable>

        <Pressable
          onPress={handleSkip}
          disabled={idx === total - 1}
          style={({ pressed }) => [
            styles.skipBtn,
            idx === total - 1 && styles.btnDisabled,
            pressed && styles.pressed,
          ]}
        >
          <VectorIcon name="SkipForward" size={14} color={Colors.neutral.textSecondary} />
          <Text style={styles.skipBtnText}>Skip</Text>
        </Pressable>

        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.primarySaveBtn,
            hasValue ? styles.primaryActiveBtn : styles.primaryInactiveBtn,
            pressed && styles.pressed,
          ]}
        >
          <VectorIcon name="Check" size={18} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.primarySaveText}>
            {idx === total - 1 ? 'Finish Count' : 'Save & Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.neutral.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exitText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.neutral.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActive: {
    backgroundColor: Colors.info.subtle,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerCategory: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    fontWeight: '500',
  },
  headerProgressText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  progressBarWrapper: {
    gap: 4,
  },
  progressMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressMetaLeft: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
  },
  progressMetaRight: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  bodyContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  itemInfoBox: {
    gap: 2,
  },
  itemCategorySku: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    fontWeight: '600',
  },
  itemName: {
    ...Typography.pageTitle,
    fontSize: 20,
  },
  theoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  theoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  slateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.neutral.textTertiary,
  },
  theoryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.neutral.textSecondary,
    letterSpacing: 0.5,
  },
  theorySub: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  theoryValueBox: {
    alignItems: 'flex-end',
  },
  theoryValue: {
    ...Typography.monoKpiLarge,
    fontSize: 24,
    color: Colors.neutral.textSecondary,
    lineHeight: 26,
  },
  theoryUnit: {
    fontSize: 12,
    color: Colors.neutral.textTertiary,
  },
  physicalSection: {
    gap: Spacing.xs,
  },
  physicalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.brand.primary,
  },
  physicalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.brand.dark,
    letterSpacing: 0.5,
  },
  inputDisplayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 2,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  inputBoxMatch: {
    backgroundColor: Colors.brand.subtle,
    borderColor: Colors.brand.primary,
  },
  inputBoxMinor: {
    backgroundColor: Colors.warning.subtle,
    borderColor: Colors.warning.main,
  },
  inputBoxMajor: {
    backgroundColor: Colors.critical.subtle,
    borderColor: Colors.critical.main,
  },
  inputValueText: {
    ...Typography.monoKpiLarge,
    fontSize: 34,
    lineHeight: 38,
    color: Colors.neutral.textTertiary,
  },
  inputUnitText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.neutral.textTertiary,
  },
  liveVarianceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    marginTop: 4,
  },
  varianceMatch: {
    backgroundColor: Colors.brand.subtle,
    borderColor: Colors.brand.light,
  },
  varianceMinor: {
    backgroundColor: Colors.warning.subtle,
    borderColor: Colors.warning.light,
  },
  varianceMajor: {
    backgroundColor: Colors.critical.subtle,
    borderColor: Colors.critical.light,
  },
  varianceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  varianceHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.neutral.textSecondary,
  },
  varianceWarningText: {
    fontSize: 10,
    color: Colors.critical.main,
    fontWeight: '600',
  },
  varianceRight: {
    alignItems: 'flex-end',
  },
  varianceDeltaText: {
    ...Typography.monoValue,
    fontSize: 16,
    lineHeight: 18,
  },
  variancePctText: {
    ...Typography.monoCaption,
    fontSize: 11,
    fontWeight: '700',
  },
  noteContainer: {
    marginTop: Spacing.xs,
  },
  noteInput: {
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    fontSize: 12,
    color: Colors.neutral.textPrimary,
    minHeight: 50,
  },
  keypadContainer: {
    paddingVertical: Spacing.xs,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    backgroundColor: Colors.neutral.card,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.borderLight,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.neutral.borderLight,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textSecondary,
  },
  primarySaveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    ...Shadows.card,
  },
  primaryActiveBtn: {
    backgroundColor: Colors.brand.primary,
  },
  primaryInactiveBtn: {
    backgroundColor: Colors.neutral.border,
  },
  primarySaveText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.8,
  },
});

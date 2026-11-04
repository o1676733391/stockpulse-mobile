import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n';
import {
  expirationService,
  INITIAL_EXPIRY_ITEMS,
  INITIAL_SUGGESTIONS,
} from '@/services/expirationService';
import { ExpiryItem } from '@/types/expiration';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ExpirationItemDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();

  const daysLabel = (days: number) => {
    if (days < 0) return t('expiration.expired', { defaultValue: 'Abgelaufen' });
    if (days === 0) return t('common.today');
    if (days === 1) return t('common.tomorrow', { defaultValue: 'Morgen' });
    return t('expiration.daysLeft', { count: days, defaultValue: `Noch ${days} Tage` });
  };

  const [item, setItem] = useState<ExpiryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [adjustQty, setAdjustQty] = useState(0);
  const [markedUsed, setMarkedUsed] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadItem() {
      try {
        setLoading(true);
        const list = await expirationService.getExpiringItems();
        const found = list.find((i) => i.id === id);
        if (mounted) {
          const finalItem = found || INITIAL_EXPIRY_ITEMS.find((i) => i.id === id) || {
            id: id || 'exp-01',
            name: 'Inventory Batch',
            batch: 'N/A',
            qty: 1,
            unit: 'units',
            days: 0,
            value: 0,
            costPerUnit: 0,
            status: 'critical',
            category: 'General',
            expiryDate: '',
          };
          setItem(finalItem);
          setAdjustQty(finalItem.qty);
        }
      } catch {
        if (mounted) {
          const fallback = INITIAL_EXPIRY_ITEMS.find((i) => i.id === id) || INITIAL_EXPIRY_ITEMS[0];
          setItem(fallback);
          setAdjustQty(fallback.qty);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadItem();
    return () => { mounted = false; };
  }, [id]);

  const suggestion = useMemo(() => {
    if (!item || item.suggestionId === undefined || item.suggestionId < 0) return null;
    return INITIAL_SUGGESTIONS.find((s) => s.id === item.suggestionId) ?? null;
  }, [item]);

  const handleMarkUsed = async () => {
    if (!item) return;
    try {
      setMarking(true);
      await expirationService.markItemUsed(item.id, adjustQty);
    } catch (err) {
      console.warn('Error marking item as used:', err);
    } finally {
      setMarking(false);
      setMarkedUsed(true);
    }
  };

  if (loading || !item) {
    return (
      <View style={[styles.screen, { backgroundColor: Colors.neutral.surface, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.brand.primary} />
      </View>
    );
  }

  const isCritical = item.status === 'critical' || item.days <= 2;
  const daysBarWidth = item.days > 0 ? Math.min(100, (item.days / 7) * 100) : 0;
  const wasteSavedValue = adjustQty * item.costPerUnit;

  // Confirmation Success View
  if (markedUsed) {
    return (
      <View
        style={[
          styles.successScreen,
          {
            paddingTop: insets.top > 0 ? insets.top + Spacing.xxl : Spacing.xxl,
            paddingBottom: insets.bottom > 0 ? insets.bottom + Spacing.xl : Spacing.xl,
          },
        ]}
      >
        <View style={styles.successIconBox}>
          <VectorIcon name="Check" size={36} color={Colors.brand.primary} strokeWidth={3} />
        </View>

        <View style={styles.successTextBox}>
          <Text style={styles.successTitle}>{t('expiration.markedAsUsed', { defaultValue: 'Als verbraucht verbucht' })}</Text>
          <Text style={styles.successSub}>
            {adjustQty.toFixed(1)} {item.unit} of {item.name} has been recorded as used. Theoretical inventory updated.
          </Text>
        </View>

        <Pressable
          onPress={() => router.replace('/expiration' as any)}
          style={({ pressed }) => [styles.successBackBtn, pressed && styles.pressed]}
        >
          <Text style={styles.successBackBtnText}>{t('expiration.backToList')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      {/* ── TopBar ── */}
      <TopBar
        title={item.name}
        subtitle={`${item.category} · Batch #${item.batch}`}
        showBack
        right={
          <Badge variant={isCritical ? 'red' : 'amber'}>
            {daysLabel(item.days)}
          </Badge>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Status Card ── */}
        <View
          style={[
            styles.statusCard,
            isCritical ? styles.statusCardCritical : styles.statusCardWarning,
          ]}
        >
          <View style={styles.statusHeaderRow}>
            <VectorIcon
              name="Clock"
              size={18}
              color={isCritical ? Colors.critical.main : Colors.warning.dark}
            />
            <Text
              style={[
                styles.statusTitle,
                isCritical ? { color: Colors.critical.dark } : { color: Colors.warning.dark },
              ]}
            >
              {item.days < 0
                ? 'Expired'
                : item.days === 0
                ? 'Expires Today'
                : item.days === 1
                ? 'Expires Tomorrow'
                : `Expires in ${item.days} days`}
            </Text>
          </View>

          {/* BBD Timeline Progress */}
          <View style={styles.statusProgressTrack}>
            <View
              style={[
                styles.statusProgressFill,
                {
                  width: `${daysBarWidth}%`,
                  backgroundColor: isCritical ? Colors.critical.main : Colors.warning.main,
                },
              ]}
            />
          </View>

          <Text style={styles.statusBbdText}>
            Best-before date:{' '}
            <Text style={styles.statusBbdBold}>{item.expiryDate}</Text>
          </Text>
        </View>

        {/* ── Quantity & Value at Risk 2-Grid ── */}
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricNum}>{item.qty}</Text>
            <Text style={styles.metricLabel}>{item.unit} in batch</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={[styles.metricNum, { color: Colors.critical.main }]}>
              €{item.value.toFixed(2)}
            </Text>
            <Text style={styles.metricLabel}>Est. value at risk</Text>
          </Card>
        </View>

        {/* ── Smart Suggestion Card (if available) ── */}
        {suggestion && (
          <Card style={styles.suggestionCard}>
            <View style={styles.suggestionHeaderRow}>
              <VectorIcon name="Lightbulb" size={16} color={Colors.brand.primary} />
              <Text style={styles.suggestionHeading}>Smart Suggestion Available</Text>
            </View>

            <Text style={styles.suggestionPromoTitle}>{suggestion.promo}</Text>
            <Text style={styles.suggestionDesc}>{suggestion.description}</Text>

            {/* 3-Box Stats Grid */}
            <View style={styles.suggestionStatsGrid}>
              <View style={styles.suggestionStatBox}>
                <Text style={styles.sStatLabel}>Uses</Text>
                <Text style={styles.sStatValueSlate}>{suggestion.uses}</Text>
              </View>
              <View style={styles.suggestionStatBoxGreen}>
                <Text style={styles.sStatLabelGreen}>Utilization</Text>
                <Text style={styles.sStatValueGreen}>{suggestion.utilization}%</Text>
              </View>
              <View style={styles.suggestionStatBoxGreen}>
                <Text style={styles.sStatLabelGreen}>Est. Saved</Text>
                <Text style={styles.sStatValueGreen}>{suggestion.saved}</Text>
              </View>
            </View>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/expiration/waste-reduction',
                  params: { suggestionId: String(suggestion.id) },
                } as any)
              }
              style={({ pressed }) => [styles.viewSuggestionBtn, pressed && styles.pressed]}
            >
              <Text style={styles.viewSuggestionBtnText}>View Full Suggestion</Text>
            </Pressable>
          </Card>
        )}

        {/* ── Mark as Used — Adjust Quantity Card ── */}
        <Card style={styles.adjustCard}>
          <Text style={styles.adjustHeading}>Mark as Used — Adjust Quantity</Text>

          <View style={styles.stepperContainer}>
            <Pressable
              onPress={() => setAdjustQty((q) => Math.max(0, parseFloat((q - 0.5).toFixed(1))))}
              style={({ pressed }) => [styles.stepperCircleBtn, pressed && styles.pressed]}
            >
              <VectorIcon name="Minus" size={16} color={Colors.neutral.textPrimary} />
            </Pressable>

            <View style={styles.stepperDisplay}>
              <Text style={styles.stepperNum}>{adjustQty.toFixed(1)}</Text>
              <Text style={styles.stepperUnit}>{item.unit}</Text>
            </View>

            <Pressable
              onPress={() => setAdjustQty((q) => Math.min(item.qty, parseFloat((q + 0.5).toFixed(1))))}
              style={({ pressed }) => [styles.stepperCircleBtn, pressed && styles.pressed]}
            >
              <VectorIcon name="Plus" size={16} color={Colors.neutral.textPrimary} />
            </Pressable>
          </View>

          <Text style={styles.wasteSavedText}>
            Est. waste reduction:{' '}
            <Text style={styles.wasteSavedNum}>€{wasteSavedValue.toFixed(2)}</Text>
          </Text>
        </Card>
      </ScrollView>

      {/* ── Fixed Bottom Actions ── */}
      <View
        style={[
          styles.fixedBottom,
          {
            paddingBottom: insets.bottom > 0 ? insets.bottom + Spacing.xs : Spacing.md,
          },
        ]}
      >
        <Pressable
          onPress={handleMarkUsed}
          disabled={marking}
          style={({ pressed }) => [styles.primaryMarkBtn, (pressed || marking) && styles.pressed]}
        >
          {marking ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.primaryMarkBtnText}>
              Mark {adjustQty.toFixed(1)} {item.unit} as Used
            </Text>
          )}
        </Pressable>

        {suggestion && (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/expiration/waste-reduction',
                params: { suggestionId: String(suggestion.id) },
              } as any)
            }
            style={({ pressed }) => [styles.secondarySuggestionBtn, pressed && styles.pressed]}
          >
            <Text style={styles.secondarySuggestionBtnText}>
              View Waste Reduction Suggestion
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  statusCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  statusCardCritical: {
    backgroundColor: Colors.critical.subtle,
    borderColor: Colors.critical.light,
  },
  statusCardWarning: {
    backgroundColor: Colors.warning.subtle,
    borderColor: Colors.warning.light,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusProgressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  statusProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  statusBbdText: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
  },
  statusBbdBold: {
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metricCard: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
  },
  metricNum: {
    ...Typography.monoKpiLarge,
    fontSize: 24,
    color: Colors.neutral.textPrimary,
    lineHeight: 28,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    marginTop: 2,
  },
  suggestionCard: {
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  suggestionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  suggestionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.brand.dark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionPromoTitle: {
    ...Typography.cardTitle,
    fontSize: 15,
  },
  suggestionDesc: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    lineHeight: 16,
    marginVertical: 4,
  },
  suggestionStatsGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginVertical: Spacing.xs,
  },
  suggestionStatBox: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.borderLight,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  suggestionStatBoxGreen: {
    flex: 1,
    backgroundColor: Colors.brand.subtle,
    borderColor: Colors.brand.light,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  sStatLabel: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
  },
  sStatLabelGreen: {
    fontSize: 10,
    color: Colors.brand.dark,
  },
  sStatValueSlate: {
    ...Typography.monoValue,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    marginTop: 2,
  },
  sStatValueGreen: {
    ...Typography.monoValue,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.dark,
    marginTop: 2,
  },
  viewSuggestionBtn: {
    backgroundColor: Colors.brand.subtle,
    borderColor: Colors.brand.light,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  viewSuggestionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  adjustCard: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  adjustHeading: {
    ...Typography.sectionHeader,
    fontSize: 11,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
  },
  stepperCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  stepperNum: {
    ...Typography.monoKpiLarge,
    fontSize: 30,
    color: Colors.neutral.textPrimary,
  },
  stepperUnit: {
    fontSize: 14,
    color: Colors.neutral.textTertiary,
    fontWeight: '600',
  },
  wasteSavedText: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.neutral.textSecondary,
  },
  wasteSavedNum: {
    ...Typography.monoCaption,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  fixedBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.neutral.card,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.xs,
    ...Shadows.elevated,
  },
  primaryMarkBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  primaryMarkBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondarySuggestionBtn: {
    paddingVertical: Spacing.xs,
    alignItems: 'center',
  },
  secondarySuggestionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  successScreen: {
    flex: 1,
    backgroundColor: Colors.neutral.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  successIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTextBox: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  successTitle: {
    ...Typography.pageTitle,
    fontSize: 22,
  },
  successSub: {
    ...Typography.bodySecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  successBackBtn: {
    width: '100%',
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadows.card,
  },
  successBackBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});

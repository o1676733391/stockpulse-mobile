import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { INITIAL_SUGGESTIONS } from '@/services/expirationService';
import { WasteSuggestion } from '@/types/expiration';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function daysLabel(days: number) {
  if (days <= 0) return 'Expired';
  if (days === 1) return 'Tomorrow';
  return `${days}d left`;
}

export default function WasteReductionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { suggestionId } = useLocalSearchParams<{ suggestionId?: string }>();

  const highlightId = suggestionId !== undefined ? parseInt(suggestionId, 10) : undefined;

  const [suggestions, setSuggestions] = useState<WasteSuggestion[]>(() =>
    JSON.parse(JSON.stringify(INITIAL_SUGGESTIONS))
  );
  const [usedIds, setUsedIds] = useState<Set<number>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  const visibleSuggestions = suggestions.filter((s) => !dismissedIds.has(s.id));

  const handleUseSuggestion = (id: number) => {
    setUsedIds((prev) => new Set([...prev, id]));
  };

  const handleDismissSuggestion = (id: number) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar title={t('expiration.wasteReductionTitle')} showBack />

      {/* ── Header Explainer Banner ── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTitleRow}>
          <VectorIcon name="Lightbulb" size={18} color={Colors.brand.primary} />
          <Text style={styles.headerTitleText}>Save inventory before it expires</Text>
        </View>
        <Text style={styles.headerSubText}>
          System-generated suggestions based on current stock and recipe mappings. Actual results may vary.
        </Text>
      </View>

      {/* ── Scrollable Body ── */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {visibleSuggestions.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <VectorIcon name="Check" size={26} color={Colors.brand.primary} />
            </View>
            <Text style={styles.emptyTitle}>All suggestions actioned</Text>
            <Text style={styles.emptySub}>
              You have reviewed and processed all active smart waste reduction recommendations.
            </Text>
          </View>
        ) : (
          visibleSuggestions.map((s) => {
            const isHighlighted = highlightId === s.id;
            const isUsed = usedIds.has(s.id);
            const isCritical = s.days <= 1;
            const urgencyColor = isCritical
              ? Colors.critical.main
              : s.days <= 3
              ? Colors.warning.main
              : Colors.neutral.textTertiary;

            return (
              <Card
                key={s.id}
                urgencyColor={urgencyColor}
                style={[
                  styles.suggestionCard,
                  isHighlighted && styles.highlightedCard,
                  isUsed && styles.usedCard,
                ]}
              >
                {/* Expiring Item Header Bar */}
                <View style={styles.itemHeaderBar}>
                  <VectorIcon
                    name="AlertTriangle"
                    size={14}
                    color={isCritical ? Colors.critical.main : Colors.warning.dark}
                  />
                  <View style={styles.itemHeaderInfo}>
                    <Text
                      style={[
                        styles.itemHeaderText,
                        isCritical ? { color: Colors.critical.dark } : { color: Colors.warning.dark },
                      ]}
                    >
                      {s.item} · {s.qty} {s.unit}
                    </Text>
                    <Text style={styles.itemHeaderSub}>
                      {s.days === 1 ? 'Expires tomorrow' : `Expires in ${s.days} days`}
                    </Text>
                  </View>
                  <Badge variant={isCritical ? 'red' : 'amber'}>
                    {daysLabel(s.days)}
                  </Badge>
                </View>

                {/* Suggested Promotion Details */}
                <View style={styles.promoDetails}>
                  <View style={styles.promoSnippetHeader}>
                    <VectorIcon name="Lightbulb" size={13} color={Colors.brand.primary} />
                    <Text style={styles.promoSnippetTag}>Suggested Promotion</Text>
                  </View>

                  <Text style={styles.promoName}>{s.promo}</Text>
                  <Text style={styles.promoDesc}>{s.description}</Text>

                  {/* 3-Box Stats Grid */}
                  <View style={styles.statsGrid}>
                    <View style={styles.statBoxSlate}>
                      <Text style={styles.statLabelSlate}>Uses</Text>
                      <Text style={styles.statNumSlate}>{s.uses}</Text>
                    </View>
                    <View style={styles.statBoxGreen}>
                      <Text style={styles.statLabelGreen}>Utilization</Text>
                      <Text style={styles.statNumGreen}>{s.utilization}%</Text>
                    </View>
                    <View style={styles.statBoxGreen}>
                      <Text style={styles.statLabelGreen}>Est. Saved</Text>
                      <Text style={styles.statNumGreen}>{s.saved}</Text>
                    </View>
                  </View>

                  {/* Utilization Progress Bar */}
                  <View style={styles.utilizationSection}>
                    <View style={styles.utilizationTrack}>
                      <View
                        style={[
                          styles.utilizationFill,
                          { width: `${s.utilization}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.utilizationText}>
                      {s.utilization}% of stock utilised
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  {isUsed ? (
                    <View style={styles.usedBanner}>
                      <VectorIcon name="Check" size={16} color={Colors.brand.dark} />
                      <Text style={styles.usedBannerText}>Recommendation Used</Text>
                    </View>
                  ) : (
                    <View style={styles.actionRow}>
                      <Pressable
                        onPress={() => router.push('/inventory' as any)}
                        style={({ pressed }) => [styles.viewRecipeBtn, pressed && styles.pressed]}
                      >
                        <Text style={styles.viewRecipeBtnText}>View Recipe</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleUseSuggestion(s.id)}
                        style={({ pressed }) => [styles.useSuggestionBtn, pressed && styles.pressed]}
                      >
                        <Text style={styles.useSuggestionBtnText}>Use Suggestion</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleDismissSuggestion(s.id)}
                        style={({ pressed }) => [styles.dismissBtn, pressed && styles.pressed]}
                      >
                        <VectorIcon name="X" size={16} color={Colors.neutral.textTertiary} />
                      </Pressable>
                    </View>
                  )}
                </View>
              </Card>
            );
          })
        )}

        {/* ── Contextual Recommendation Callout ── */}
        {visibleSuggestions.length > 0 && (
          <View style={styles.calloutCard}>
            <Text style={styles.calloutTitle}>About these recommendations</Text>
            <Text style={styles.calloutBody}>
              Suggestions are calculated from your current expiring stock and active recipe mappings.
              Using a suggestion does not automatically deduct inventory — confirm actual usage through a stock count.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerBanner: {
    backgroundColor: Colors.neutral.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  headerSubText: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
    lineHeight: 16,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: Spacing.sm,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...Typography.cardTitle,
    fontSize: 16,
  },
  emptySub: {
    ...Typography.bodySecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  suggestionCard: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  highlightedCard: {
    borderColor: Colors.brand.primary,
    borderWidth: 1.5,
  },
  usedCard: {
    opacity: 0.65,
  },
  itemHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  itemHeaderInfo: {
    flex: 1,
  },
  itemHeaderText: {
    fontSize: 12,
    fontWeight: '700',
  },
  itemHeaderSub: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
  },
  promoDetails: {
    gap: Spacing.xs,
  },
  promoSnippetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  promoSnippetTag: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.brand.dark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promoName: {
    ...Typography.cardTitle,
    fontSize: 16,
    color: Colors.neutral.textPrimary,
  },
  promoDesc: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginVertical: Spacing.xs,
  },
  statBoxSlate: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.borderLight,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  statBoxGreen: {
    flex: 1,
    backgroundColor: Colors.brand.subtle,
    borderColor: Colors.brand.light,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  statLabelSlate: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
  },
  statLabelGreen: {
    fontSize: 10,
    color: Colors.brand.dark,
  },
  statNumSlate: {
    ...Typography.monoValue,
    fontSize: 12,
    color: Colors.neutral.textPrimary,
    marginTop: 2,
  },
  statNumGreen: {
    ...Typography.monoValue,
    fontSize: 13,
    color: Colors.brand.dark,
    marginTop: 2,
  },
  utilizationSection: {
    gap: 4,
    marginBottom: Spacing.xs,
  },
  utilizationTrack: {
    height: 5,
    backgroundColor: Colors.neutral.borderLight,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  utilizationFill: {
    height: '100%',
    backgroundColor: Colors.brand.primary,
    borderRadius: 2.5,
  },
  utilizationText: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 4,
  },
  viewRecipeBtn: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewRecipeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  useSuggestionBtn: {
    flex: 1.3,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  useSuggestionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  dismissBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.lg,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.borderLight,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.brand.subtle,
    borderColor: Colors.brand.light,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    marginTop: 4,
  },
  usedBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  calloutCard: {
    backgroundColor: Colors.info.subtle,
    borderColor: Colors.info.light,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  calloutTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.info.dark,
  },
  calloutBody: {
    fontSize: 11,
    color: Colors.info.dark,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.8,
  },
});

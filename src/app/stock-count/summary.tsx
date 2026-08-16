import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { mockSummaryItems } from '@/mocks/inventoryMockData';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CountSummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const varianceItems = mockSummaryItems.filter((s) => s.is !== s.should);
  const matching = mockSummaryItems.filter((s) => s.is === s.should).length;
  const minor = varianceItems.filter(
    (s) => Math.abs((s.is - s.should) / s.should) <= 0.1
  ).length;
  const major = varianceItems.filter(
    (s) => Math.abs((s.is - s.should) / s.should) > 0.1
  ).length;

  const totalVarianceEur = mockSummaryItems.reduce((sum, s) => {
    const diff = s.is - s.should;
    return sum + diff * s.cost;
  }, 0);

  const stats = [
    { label: 'Counted', value: 68, color: Colors.neutral.textPrimary, bg: Colors.neutral.surface, border: Colors.neutral.borderLight },
    { label: 'Matching', value: matching, color: Colors.brand.dark, bg: Colors.brand.subtle, border: Colors.brand.light },
    { label: 'Minor Diff', value: minor, color: Colors.warning.dark, bg: Colors.warning.subtle, border: Colors.warning.light },
    { label: 'Major Diff', value: major, color: Colors.critical.dark, bg: Colors.critical.subtle, border: Colors.critical.light },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      {/* ── Top Summary Header Card ── */}
      <View
        style={[
          styles.summaryHeader,
          { paddingTop: insets.top > 0 ? insets.top + Spacing.xs : Spacing.lg },
        ]}
      >
        {/* Completion Icon & Title */}
        <View style={styles.completionRow}>
          <View style={styles.completionIconBox}>
            <VectorIcon name="CheckCircle2" size={26} color={Colors.brand.primary} />
          </View>
          <View>
            <Text style={styles.completionTitle}>Daily Count Complete</Text>
            <Text style={styles.completionSub}>10 March 2026 · 68 items counted</Text>
          </View>
        </View>

        {/* Total Variance Value Banner */}
        <View
          style={[
            styles.totalVarianceBox,
            {
              backgroundColor:
                totalVarianceEur < 0
                  ? Colors.critical.subtle
                  : Colors.brand.subtle,
              borderColor:
                totalVarianceEur < 0
                  ? Colors.critical.light
                  : Colors.brand.light,
            },
          ]}
        >
          <Text style={styles.totalVarianceHeading}>Total Variance Value</Text>
          <Text
            style={[
              styles.totalVarianceValue,
              {
                color:
                  totalVarianceEur < 0
                    ? Colors.critical.dark
                    : Colors.brand.dark,
              },
            ]}
          >
            {totalVarianceEur > 0 ? '+' : ''}€{Math.abs(totalVarianceEur).toFixed(2)}
          </Text>
          <Text
            style={[
              styles.totalVarianceSub,
              {
                color:
                  totalVarianceEur < 0
                    ? Colors.critical.main
                    : Colors.brand.primary,
              },
            ]}
          >
            Across {varianceItems.length} items with variance
          </Text>
        </View>

        {/* 4-Stat Metric Grid */}
        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <View
              key={s.label}
              style={[
                styles.statCard,
                { backgroundColor: s.bg, borderColor: s.border },
              ]}
            >
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel} numberOfLines={1}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Scrollable Body: Needs Investigation List ── */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionHeader}>
          Needs Investigation ({varianceItems.length})
        </Text>

        <View style={styles.itemStack}>
          {varianceItems.map((s) => {
            const variance = s.is - s.should;
            const variancePct = (variance / s.should) * 100;
            const isMajor = Math.abs(variancePct) > 10;
            const varEur = variance * s.cost;

            return (
              <Card
                key={s.id}
                urgencyColor={isMajor ? Colors.critical.main : Colors.warning.main}
                style={styles.varianceItemCard}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.itemName}>{s.name}</Text>
                    <Text style={styles.itemUnit}>Unit: {s.unit}</Text>
                  </View>
                  <View style={styles.cardHeaderRight}>
                    <Badge variant={isMajor ? 'red' : 'amber'}>
                      {isMajor ? 'Major' : 'Minor'}
                    </Badge>
                    <Text
                      style={[
                        styles.varEurText,
                        {
                          color:
                            varEur < 0
                              ? Colors.critical.main
                              : Colors.brand.primary,
                        },
                      ]}
                    >
                      {varEur > 0 ? '+' : ''}€{Math.abs(varEur).toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* 3-Column Should / Is / Diff Grid */}
                <View style={styles.threeColGrid}>
                  {/* Should */}
                  <View style={styles.colBox}>
                    <View style={styles.colHeaderRow}>
                      <View style={styles.slateDot} />
                      <Text style={styles.colLabel}>SHOULD</Text>
                    </View>
                    <Text style={styles.colValue}>{s.should}</Text>
                    <Text style={styles.colUnit}>{s.unit}</Text>
                  </View>

                  {/* Is */}
                  <View style={[styles.colBox, styles.colBoxIs]}>
                    <View style={styles.colHeaderRow}>
                      <View style={styles.greenDot} />
                      <Text style={[styles.colLabel, { color: Colors.brand.dark }]}>IS</Text>
                    </View>
                    <Text style={[styles.colValue, { color: Colors.brand.dark }]}>{s.is}</Text>
                    <Text style={[styles.colUnit, { color: Colors.brand.primary }]}>{s.unit}</Text>
                  </View>

                  {/* Diff */}
                  <View
                    style={[
                      styles.colBox,
                      isMajor ? styles.colBoxMajor : styles.colBoxMinor,
                    ]}
                  >
                    <View style={styles.colHeaderRow}>
                      <VectorIcon
                        name="TrendingDown"
                        size={10}
                        color={isMajor ? Colors.critical.main : Colors.warning.dark}
                      />
                      <Text
                        style={[
                          styles.colLabel,
                          {
                            color:
                              isMajor
                                ? Colors.critical.main
                                : Colors.warning.dark,
                          },
                        ]}
                      >
                        DIFF
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.colValue,
                        {
                          color:
                            isMajor
                              ? Colors.critical.dark
                              : Colors.warning.dark,
                        },
                      ]}
                    >
                      {variance > 0 ? '+' : ''}{variance.toFixed(1)}
                    </Text>
                    <Text
                      style={[
                        styles.diffPctText,
                        {
                          color:
                            isMajor
                              ? Colors.critical.main
                              : Colors.warning.dark,
                        },
                      ]}
                    >
                      {variancePct.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>

        {/* Matching Items Confirmation Banner */}
        <View style={styles.matchingBanner}>
          <VectorIcon name="CheckCircle2" size={18} color={Colors.brand.primary} />
          <Text style={styles.matchingBannerText}>
            {matching} items matched exactly — no action needed
          </Text>
        </View>
      </ScrollView>

      {/* ── Fixed Bottom Actions ── */}
      <View
        style={[
          styles.fixedBottom,
          {
            paddingBottom: insets.bottom > 0 ? insets.bottom + Spacing.xs : Spacing.lg,
          },
        ]}
      >
        <Pressable
          onPress={() => router.push('/inventory' as any)}
          style={({ pressed }) => [styles.primaryReviewBtn, pressed && styles.pressed]}
        >
          <Text style={styles.primaryReviewBtnText}>
            Review Variances in Inventory
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(tabs)' as any)}
          style={({ pressed }) => [styles.secondaryReturnBtn, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryReturnBtnText}>
            Complete & Return to Dashboard
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
  summaryHeader: {
    backgroundColor: Colors.neutral.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  completionIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.xl,
    backgroundColor: Colors.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionTitle: {
    ...Typography.cardTitle,
    fontSize: 17,
  },
  completionSub: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  totalVarianceBox: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  totalVarianceHeading: {
    ...Typography.sectionHeader,
    fontSize: 10,
    marginBottom: 4,
  },
  totalVarianceValue: {
    ...Typography.monoKpiLarge,
    fontSize: 34,
    lineHeight: 38,
  },
  totalVarianceSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    ...Typography.monoValue,
    fontSize: 18,
    lineHeight: 20,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionHeader: {
    ...Typography.sectionHeader,
    paddingHorizontal: Spacing.xs,
  },
  itemStack: {
    gap: Spacing.md,
  },
  varianceItemCard: {
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  itemName: {
    ...Typography.cardTitle,
    fontSize: 14,
  },
  itemUnit: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    marginTop: 2,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  varEurText: {
    ...Typography.monoCaption,
    fontSize: 11,
    fontWeight: '700',
  },
  threeColGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  colBox: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  colBoxIs: {
    backgroundColor: Colors.brand.subtle,
    borderColor: Colors.brand.light,
  },
  colBoxMinor: {
    backgroundColor: Colors.warning.subtle,
    borderColor: Colors.warning.light,
  },
  colBoxMajor: {
    backgroundColor: Colors.critical.subtle,
    borderColor: Colors.critical.light,
  },
  colHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  slateDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.neutral.textTertiary,
  },
  greenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.brand.primary,
  },
  colLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.neutral.textSecondary,
  },
  colValue: {
    ...Typography.monoValue,
    fontSize: 14,
    color: Colors.neutral.textSecondary,
    marginVertical: 1,
  },
  colUnit: {
    fontSize: 9,
    color: Colors.neutral.textTertiary,
  },
  diffPctText: {
    ...Typography.monoCaption,
    fontSize: 9,
    fontWeight: '700',
  },
  matchingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.brand.subtle,
    borderColor: Colors.brand.light,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  matchingBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.brand.dark,
    flex: 1,
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
  primaryReviewBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  primaryReviewBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryReturnBtn: {
    backgroundColor: Colors.neutral.borderLight,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryReturnBtnText: {
    color: Colors.neutral.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});

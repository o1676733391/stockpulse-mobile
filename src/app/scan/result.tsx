import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { SectionHeader } from '@/components/ui/section-header';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OCRResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ totalPortions?: string; menuItemCount?: string }>();

  const portionsSold = params.totalPortions || '49';
  const menuCount = params.menuItemCount || '5';

  const sampleDeductions = [
    { name: 'Chicken Breast', delta: -12.4, unit: 'kg', cost: '€59.52' },
    { name: 'Potatoes',       delta: -8.2,  unit: 'kg', cost: '€7.38'  },
    { name: 'Cooking Oil',    delta: -1.8,  unit: 'L',  cost: '€4.32'  },
    { name: 'Gouda Cheese',   delta: -4.1,  unit: 'kg', cost: '€34.85' },
    { name: 'Ground Beef',    delta: -6.25, unit: 'kg', cost: '€38.75' },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      {/* ── Top Header Summary ── */}
      <View
        style={[
          styles.headerCard,
          {
            paddingTop: insets.top > 0 ? insets.top + Spacing.sm : Spacing.lg,
          },
        ]}
      >
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleBox}>
            <View style={styles.titleWithIcon}>
              <VectorIcon name="CheckCircle2" size={22} color={Colors.brand.primary} />
              <Text style={styles.headerTitle}>POS Report Processed</Text>
            </View>
            <Text style={styles.headerSub}>
              10 Mar 2026 · Report #2048 · Lunch shift
            </Text>
          </View>
          <Badge variant="green">Complete</Badge>
        </View>

        {/* 2-Stat Metric Grid */}
        <View style={styles.statGrid}>
          <View style={styles.statBoxGreen}>
            <Text style={styles.statValueGreen}>{menuCount}</Text>
            <Text style={styles.statLabelGreen}>Menu items detected</Text>
          </View>
          <View style={styles.statBoxBlue}>
            <Text style={styles.statValueBlue}>{portionsSold}</Text>
            <Text style={styles.statLabelBlue}>Total portions sold</Text>
          </View>
        </View>
      </View>

      {/* ── Scrollable Body with Deductions List ── */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="Ingredients Deducted from Theoretical Stock" />

        <View style={styles.deductionList}>
          {sampleDeductions.map((d) => (
            <Card key={d.name} style={styles.deductionCard}>
              <View style={styles.deductionRow}>
                {/* Downward Icon Box */}
                <View style={styles.downIconBox}>
                  <VectorIcon name="TrendingDown" size={16} color={Colors.critical.main} />
                </View>

                {/* Name & Subtitle */}
                <View style={styles.deductionInfo}>
                  <Text style={styles.deductionName}>{d.name}</Text>
                  <Text style={styles.deductionSub}>Recipe BOM deduction</Text>
                </View>

                {/* Delta & Cost */}
                <View style={styles.deductionValues}>
                  <Text style={styles.deductionDelta}>
                    {d.delta} {d.unit}
                  </Text>
                  <Text style={styles.deductionCost}>{d.cost}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Theoretical Inventory Notice Box */}
        <View style={styles.theoreticalNotice}>
          <View style={styles.noticeHeaderRow}>
            <VectorIcon name="CheckCircle2" size={16} color={Colors.brand.dark} />
            <Text style={styles.noticeTitle}>Theoretical inventory updated</Text>
          </View>
          <Text style={styles.noticeText}>
            {sampleDeductions.length} ingredient stocks have been automatically updated based on recipe/BOM mappings. Physical stock is unchanged until your next stock count.
          </Text>
        </View>
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
          onPress={() => router.push('/(tabs)/inventory' as any)}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
        >
          <Text style={styles.primaryBtnText}>View Inventory Impact</Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace('/(tabs)/scan' as any)}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryBtnText}>Scan Another Report</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: Colors.neutral.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTitleBox: {
    gap: 2,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerTitle: {
    ...Typography.pageTitle,
    fontSize: 18,
  },
  headerSub: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
  },
  statGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
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
  statValueGreen: {
    ...Typography.monoValue,
    fontSize: 22,
    color: Colors.brand.dark,
  },
  statLabelGreen: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.brand.dark,
    marginTop: 2,
  },
  statBoxBlue: {
    flex: 1,
    backgroundColor: Colors.info.subtle,
    borderColor: Colors.info.light,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  statValueBlue: {
    ...Typography.monoValue,
    fontSize: 22,
    color: Colors.info.dark,
  },
  statLabelBlue: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.info.dark,
    marginTop: 2,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  deductionList: {
    gap: Spacing.sm,
  },
  deductionCard: {
    padding: Spacing.md,
  },
  deductionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  downIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.critical.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deductionInfo: {
    flex: 1,
    gap: 2,
  },
  deductionName: {
    ...Typography.cardTitle,
    fontSize: 14,
  },
  deductionSub: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  deductionValues: {
    alignItems: 'flex-end',
    gap: 2,
  },
  deductionDelta: {
    ...Typography.monoValue,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.critical.main,
  },
  deductionCost: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  theoreticalNotice: {
    backgroundColor: Colors.brand.subtle,
    borderColor: Colors.brand.light,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  noticeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  noticeText: {
    fontSize: 12,
    color: Colors.brand.dark,
    lineHeight: 17,
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
  primaryBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: Colors.neutral.borderLight,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: Colors.neutral.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { SectionHeader } from '@/components/ui/section-header';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
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
  const params = useLocalSearchParams<{
    totalPortions?: string;
    menuItemCount?: string;
    deductionsJson?: string;
    reportNumber?: string;
    date?: string;
  }>();
  const { t, formatCurrency } = useI18n();

  const portionsSold = params.totalPortions || '0';
  const menuCount = params.menuItemCount || '0';
  const reportNumber = params.reportNumber || 'POS-REPORT';
  const reportDate = params.date || new Date().toISOString().slice(0, 10);

  const deductions = useMemo(() => {
    if (params.deductionsJson) {
      try {
        const parsed = JSON.parse(params.deductionsJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((d: any) => ({
            name: d.itemName || 'Inventory Item',
            delta: d.delta !== undefined ? d.delta : -Number(d.quantityDeducted || 0),
            unit: d.unit || 'unit',
            cost: formatCurrency(Math.abs(Number(d.costEur || d.totalCost || 0))),
          }));
        }
      } catch {}
    }
    return [];
  }, [params.deductionsJson, formatCurrency]);

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
              <Text style={styles.headerTitle}>{t('scan.resultTitle')}</Text>
            </View>
            <Text style={styles.headerSub}>
              {reportDate} · Report #{reportNumber} · Stock Ledger Updated
            </Text>
          </View>
          <Badge variant="green">{t('stockCount.status.completed')}</Badge>
        </View>

        {/* 2-Stat Metric Grid */}
        <View style={styles.statGrid}>
          <View style={styles.statBoxGreen}>
            <Text style={styles.statValueGreen}>{menuCount}</Text>
            <Text style={styles.statLabelGreen}>{t('scan.reviewStats.detected')}</Text>
          </View>
          <View style={styles.statBoxBlue}>
            <Text style={styles.statValueBlue}>{portionsSold}</Text>
            <Text style={styles.statLabelBlue}>{t('scan.totalPortionsSold')}</Text>
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
        <SectionHeader title={t('scan.ingredientsDeductedTitle')} />

        {deductions.length > 0 ? (
          <View style={styles.deductionList}>
            {deductions.map((d, idx) => (
              <Card key={`${d.name}-${idx}`} style={styles.deductionCard}>
                <View style={styles.deductionRow}>
                  {/* Downward Icon Box */}
                  <View style={styles.downIconBox}>
                    <VectorIcon name="TrendingDown" size={16} color={Colors.critical.main} />
                  </View>

                  {/* Name & Subtitle */}
                  <View style={styles.deductionInfo}>
                    <Text style={styles.deductionName}>{d.name}</Text>
                    <Text style={styles.deductionSub}>PostgreSQL Ledger BOM deduction</Text>
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
        ) : (
          <Card style={styles.emptyCard}>
            <VectorIcon name="Check" size={24} color="#10b981" />
            <Text style={styles.emptyTitle}>No Raw BOM Deductions</Text>
            <Text style={styles.emptySub}>
              All items were processed. No recipe ingredient reductions were required.
            </Text>
          </Card>
        )}

        {/* Theoretical Inventory Notice Box */}
        <View style={styles.theoreticalNotice}>
          <View style={styles.noticeHeaderRow}>
            <VectorIcon name="CheckCircle2" size={16} color={Colors.brand.dark} />
            <Text style={styles.noticeTitle}>{t('scan.theoreticalUpdatedTitle')}</Text>
          </View>
          <Text style={styles.noticeText}>
            {t('scan.theoreticalDeductionNotice')}
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
          <Text style={styles.primaryBtnText}>{t('navigation.inventory')}</Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace('/(tabs)/scan' as any)}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryBtnText}>{t('scan.retakeButton')}</Text>
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
    backgroundColor: Colors.neutral.surface,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
    ...Shadows.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerTitleBox: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xxs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
  },
  statGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statBoxGreen: {
    flex: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  statValueGreen: {
    fontSize: 22,
    fontWeight: '700',
    color: '#059669',
  },
  statLabelGreen: {
    fontSize: 11,
    color: '#059669',
    marginTop: 2,
  },
  statBoxBlue: {
    flex: 1,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  statValueBlue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2563eb',
  },
  statLabelBlue: {
    fontSize: 11,
    color: '#2563eb',
    marginTop: 2,
  },
  content: {
    padding: Spacing.md,
  },
  deductionList: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  deductionCard: {
    padding: Spacing.sm,
  },
  deductionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  deductionInfo: {
    flex: 1,
  },
  deductionName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  deductionSub: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    marginTop: 1,
  },
  deductionValues: {
    alignItems: 'flex-end',
  },
  deductionDelta: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.critical.main,
  },
  deductionCost: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
    marginTop: 1,
  },
  emptyCard: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    marginTop: Spacing.xs,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xxs,
  },
  theoreticalNotice: {
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.brand.primary,
  },
  noticeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  noticeText: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    lineHeight: 18,
  },
  fixedBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.neutral.surface,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
    ...Shadows.card,
  },
  primaryBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: Colors.neutral.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.7,
  },
});

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
    documentType?: string;
  }>();
  const { t, formatCurrency } = useI18n();

  const isGoodsReceipt = params.documentType === 'goods_receipt';
  const portionsSold = params.totalPortions || '0';
  const menuCount = params.menuItemCount || '0';
  const reportNumber = params.reportNumber || (isGoodsReceipt ? 'GR-RECEIPT' : 'POS-REPORT');
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
              <Text style={styles.headerTitle}>
                {isGoodsReceipt ? t('scan.goodsReceivedTitle') : t('scan.resultTitle')}
              </Text>
            </View>
            <Text style={styles.headerSub}>
              {reportDate} · #{reportNumber} · Stock Ledger Updated
            </Text>
          </View>
          <Badge variant="green">{t('stockCount.status.completed')}</Badge>
        </View>

        {/* 2-Stat Metric Grid */}
        <View style={styles.statGrid}>
          <View style={styles.statBoxGreen}>
            <Text style={styles.statValueGreen}>{menuCount}</Text>
            <Text style={styles.statLabelGreen}>
              {isGoodsReceipt ? 'Received Items' : t('scan.reviewStats.detected')}
            </Text>
          </View>
          <View style={styles.statBoxBlue}>
            <Text style={styles.statValueBlue}>{portionsSold}</Text>
            <Text style={styles.statLabelBlue}>
              {isGoodsReceipt ? 'Total Inbound Units' : t('scan.totalPortionsSold')}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Scrollable Body with Ledger Impact ── */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader
          title={
            isGoodsReceipt
              ? 'Raw Materials Received into Stock'
              : t('scan.ingredientsDeductedTitle')
          }
        />

        {deductions.length > 0 ? (
          <View style={styles.deductionList}>
            {deductions.map((d, idx) => (
              <Card key={`${d.name}-${idx}`} style={styles.deductionCard}>
                <View style={styles.deductionRow}>
                  {/* Delta Direction Icon Box */}
                  <View
                    style={[
                      styles.deltaIconBox,
                      isGoodsReceipt ? styles.upIconBox : styles.downIconBox,
                    ]}
                  >
                    <VectorIcon
                      name={isGoodsReceipt ? 'TrendingUp' : 'TrendingDown'}
                      size={16}
                      color={isGoodsReceipt ? '#059669' : Colors.critical.main}
                    />
                  </View>

                  {/* Name & Subtitle */}
                  <View style={styles.deductionInfo}>
                    <Text style={styles.deductionName}>{d.name}</Text>
                    <Text style={styles.deductionSub}>
                      {isGoodsReceipt
                        ? 'Warehouse inbound delivery lot receipt'
                        : 'PostgreSQL Ledger BOM deduction'}
                    </Text>
                  </View>

                  {/* Delta & Cost */}
                  <View style={styles.deductionValues}>
                    <Text
                      style={[
                        styles.deductionDelta,
                        isGoodsReceipt && { color: '#059669' },
                      ]}
                    >
                      {isGoodsReceipt ? `+${Math.abs(d.delta)}` : d.delta} {d.unit}
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
            <Text style={styles.emptyTitle}>
              {isGoodsReceipt ? 'Inventory Stock Updated' : 'No Raw BOM Deductions'}
            </Text>
            <Text style={styles.emptySub}>
              {isGoodsReceipt
                ? 'Delivery items have been processed and added to active warehouse inventory.'
                : 'All items were processed. No recipe ingredient reductions were required.'}
            </Text>
          </Card>
        )}

        {/* Theoretical Inventory Notice Box */}
        <View style={styles.theoreticalNotice}>
          <View style={styles.noticeHeaderRow}>
            <VectorIcon name="CheckCircle2" size={16} color={Colors.brand.dark} />
            <Text style={styles.noticeTitle}>
              {isGoodsReceipt ? 'Warehouse Stock Synchronized' : t('scan.theoreticalUpdatedTitle')}
            </Text>
          </View>
          <Text style={styles.noticeText}>
            {isGoodsReceipt
              ? t('scan.goodsReceivedNotice')
              : t('scan.theoreticalDeductionNotice')}
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.neutral.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  statGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statBoxGreen: {
    flex: 1,
    backgroundColor: Colors.brand.light,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  statValueGreen: {
    fontSize: 22,
    fontWeight: '800',
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
    backgroundColor: '#eff6ff',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  statValueBlue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e40af',
  },
  statLabelBlue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e40af',
    marginTop: 2,
  },
  content: {
    padding: Spacing.md,
  },
  deductionList: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  deductionCard: {
    padding: Spacing.sm,
  },
  deductionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deltaIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  downIconBox: {
    backgroundColor: '#fee2e2',
  },
  upIconBox: {
    backgroundColor: '#d1fae5',
  },
  deductionInfo: {
    flex: 1,
  },
  deductionName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  deductionSub: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
    marginTop: 1,
  },
  deductionValues: {
    alignItems: 'flex-end',
  },
  deductionDelta: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.critical.main,
  },
  deductionCost: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
    marginTop: 1,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    marginTop: Spacing.sm,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  theoreticalNotice: {
    backgroundColor: Colors.brand.light,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  noticeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  noticeText: {
    fontSize: 12,
    color: Colors.brand.dark,
    lineHeight: 18,
  },
  fixedBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.neutral.card,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.xs,
    ...Shadows.elevated,
  },
  primaryBtn: {
    backgroundColor: Colors.brand.primary,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: Colors.neutral.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: Colors.neutral.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.75,
  },
});

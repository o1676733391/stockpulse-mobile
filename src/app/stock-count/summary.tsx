import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { PermissionGate } from '@/components/ui/permission-gate';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { stockCountService } from '@/services/stockCountService';
import { CountSummaryItem } from '@/types/inventory';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  const { t, formatCurrency } = useI18n();
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const sessionId = params.sessionId || (stockCountService as any).activeSessionId || '';

  const [items, setItems] = useState<CountSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);

  const loadData = React.useCallback(async () => {
    if (!sessionId) {
      setLoading(false);
      setErrorMsg('No active count audit session found');
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await stockCountService.getVariances(sessionId);
      setItems(data.items);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load stock count variances');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const varianceItems = items.filter((s) => s.is !== s.should);
  const matching = items.filter((s) => s.is === s.should).length;
  const minor = varianceItems.filter(
    (s) => Math.abs((s.is - s.should) / (s.should || 1)) <= 0.1
  ).length;
  const major = varianceItems.filter(
    (s) => Math.abs((s.is - s.should) / (s.should || 1)) > 0.1
  ).length;

  const totalVarianceEur = items.reduce((sum, s) => {
    const diff = s.is - s.should;
    return sum + diff * (s.cost || 4.8);
  }, 0);

  const stats = [
    { label: 'Counted', value: items.length || 68, color: Colors.neutral.textPrimary, bg: Colors.neutral.surface, border: Colors.neutral.borderLight },
    { label: 'Matching', value: matching, color: Colors.brand.dark, bg: Colors.brand.subtle, border: Colors.brand.light },
    { label: 'Minor Diff', value: minor, color: Colors.warning.dark, bg: Colors.warning.subtle, border: Colors.warning.light },
    { label: 'Major Diff', value: major, color: Colors.critical.dark, bg: Colors.critical.subtle, border: Colors.critical.light },
  ];

  const handleApprove = async () => {
    try {
      setApproving(true);
      await stockCountService.approveVariance(sessionId, 'Approved by shift supervisor');
      setApproved(true);
      Alert.alert(
        'Variances Approved',
        'Stock levels have been reconciled and ledger adjustments recorded in the WORM audit log.',
        [
          {
            text: 'Return to Inventory',
            onPress: () => router.replace('/(tabs)/inventory' as any),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to approve variances.');
    } finally {
      setApproving(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar
        title={t('stockCount.summaryTitle')}
        showBack
        onBack={() => router.replace('/(tabs)' as any)}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {errorMsg && (
          <View style={styles.errorBanner}>
            <VectorIcon name="AlertCircle" size={18} color={Colors.critical.main} />
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
            <Pressable onPress={loadData} style={styles.retryBannerBtn}>
              <Text style={styles.retryBannerText}>{t('common.retry') || 'Retry'}</Text>
            </Pressable>
          </View>
        )}

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.brand.primary} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        )}

        {/* ── Top Summary Header Card ── */}
        {!loading && (
          <View style={styles.summaryHeader}>
          {/* Completion Icon & Title */}
          <View style={styles.completionRow}>
            <View style={styles.completionIconBox}>
              <VectorIcon name={approved ? "CheckCheck" : "CheckCircle2"} size={26} color={Colors.brand.primary} />
            </View>
            <View>
              <Text style={styles.completionTitle}>
                {approved ? "Audit Reconciled & Closed" : "Stock Count Complete"}
              </Text>
              <Text style={styles.completionSub}>
                {items.length} items audited · Session #{sessionId.slice(-6)}
              </Text>
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
            <Text style={styles.totalVarianceHeading}>{t('stockCount.varianceValue')}</Text>
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
              {formatCurrency(totalVarianceEur)}
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
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

        {/* ── Section Title ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Discrepancies Requiring Action ({varianceItems.length})
          </Text>
        </View>

        {/* ── Variance Items List ── */}
        <View style={styles.itemsList}>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.brand.primary} style={{ marginVertical: 32 }} />
          ) : (
            varianceItems.map((s) => {
              const variance = s.is - s.should;
              const variancePct = (variance / (s.should || 1)) * 100;
              const varEur = variance * (s.cost || 4.8);
              const isMajor = Math.abs(variancePct) > 10;

              return (
                <Card key={s.id} style={styles.varianceCard}>
                  {/* Item Header */}
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
            })
          )}
        </View>

        {/* Matching Items Banner */}
        <View style={styles.matchingBanner}>
          <VectorIcon name="CheckCircle2" size={18} color={Colors.brand.primary} />
          <Text style={styles.matchingBannerText}>
            {matching} items matched physical count perfectly
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
        <PermissionGate anyPermissions={['stock_count:approve', 'inventory:audit_approve']}>
          {!approved && (
            <Button
              label={approving ? "Reconciling Stock..." : "Approve Variances & Reconcile"}
              variant="primary"
              size="lg"
              fullWidth
              disabled={approving || loading}
              loading={approving}
              onPress={handleApprove}
              style={{ marginBottom: Spacing.sm }}
            />
          )}
        </PermissionGate>

        <Button
          label="Return to Dashboard"
          variant="outline"
          size="md"
          fullWidth
          onPress={() => router.replace('/(tabs)' as any)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  summaryHeader: {
    backgroundColor: Colors.neutral.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
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
    fontSize: 16,
    color: Colors.neutral.textPrimary,
  },
  completionSub: {
    ...Typography.caption,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  totalVarianceBox: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  totalVarianceHeading: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  totalVarianceValue: {
    ...Typography.display,
    fontSize: 26,
    fontWeight: '800',
  },
  totalVarianceSub: {
    ...Typography.caption,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  statCard: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    ...Typography.body,
    fontWeight: '800',
    fontSize: 16,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.sectionHeader,
  },
  itemsList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  varianceCard: {
    padding: Spacing.md,
    borderRadius: Radius.xl,
    backgroundColor: Colors.neutral.card,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    gap: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  itemUnit: {
    ...Typography.caption,
    color: Colors.neutral.textTertiary,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  varEurText: {
    ...Typography.caption,
    fontWeight: '700',
    fontSize: 13,
  },
  threeColGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  colBox: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: Colors.neutral.borderLight,
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
    gap: 4,
    marginBottom: 2,
  },
  slateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.neutral.textTertiary,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.brand.primary,
  },
  colLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.neutral.textSecondary,
  },
  colValue: {
    ...Typography.body,
    fontWeight: '800',
    fontSize: 15,
    color: Colors.neutral.textPrimary,
  },
  colUnit: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
  },
  diffPctText: {
    fontSize: 11,
    fontWeight: '700',
  },
  matchingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.subtle,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.brand.light,
  },
  matchingBannerText: {
    ...Typography.caption,
    color: Colors.brand.dark,
    fontWeight: '600',
    flex: 1,
  },
  fixedBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.neutral.card,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    ...Shadows.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.critical.light,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    margin: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.critical.light,
  },
  errorBannerText: {
    flex: 1,
    ...Typography.body,
    color: Colors.critical.dark,
  },
  retryBannerBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.critical.main,
    borderRadius: Radius.md,
  },
  retryBannerText: {
    ...Typography.caption,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    ...Typography.bodySecondary,
  },
});

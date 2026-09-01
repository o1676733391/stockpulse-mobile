import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { ProgressBar } from '@/components/ui/progress-bar';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { stockCountService } from '@/services/stockCountService';
import { CountSchedule } from '@/types/inventory';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function StockCountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  const [schedules, setSchedules] = useState<CountSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await stockCountService.getSchedules();
      setSchedules(data);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load stock count schedules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const inProgress = schedules.filter((s) => s.status === 'in_progress');
  const scheduled = schedules.filter((s) => s.status === 'scheduled');

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar title={t('stockCount.title')} showBack large />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {errorMsg && (
          <View style={styles.errorBanner}>
            <VectorIcon name="AlertCircle" size={18} color={Colors.critical.main} />
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
            <Pressable onPress={loadSchedules} style={styles.retryBannerBtn}>
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

        {!loading && !errorMsg && schedules.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <VectorIcon name="ClipboardList" size={28} color={Colors.neutral.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No scheduled counts</Text>
            <Text style={styles.emptySub}>All audit sessions have been completed or reconciled</Text>
          </View>
        )}

        {/* ── Active In-Progress Counts ── */}
        {!loading && inProgress.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{t('common.active')}</Text>
            {inProgress.map((s) => (
              <Card key={s.id} style={styles.inProgressCard}>
                <View style={styles.inProgressTop}>
                  <View style={styles.inProgressTitleBox}>
                    <View style={styles.inProgressHeaderRow}>
                      <Text style={styles.inProgressTitle}>{s.label}</Text>
                      <Badge variant="amber">{t('common.inProgress')}</Badge>
                    </View>
                    <View style={styles.inProgressSubRow}>
                      <VectorIcon name="Clock" size={12} color={Colors.neutral.textSecondary} />
                      <Text style={styles.inProgressSub}>{s.sub}</Text>
                    </View>
                  </View>

                  <View style={styles.inProgressCountBox}>
                    <Text style={styles.inProgressCountNum}>{s.progress}</Text>
                    <Text style={styles.inProgressCountTotal}>of {s.total}</Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressWrapper}>
                  <ProgressBar value={s.progress} max={s.total} variant="green" height={8} />
                </View>

                <View style={styles.progressMetaRow}>
                  <Text style={styles.progressMetaText}>
                    {t('stockCount.itemsToCount', { count: s.total - s.progress })}
                  </Text>
                  <Text style={styles.progressMetaPct}>
                    {Math.round((s.progress / s.total) * 100)}% complete
                  </Text>
                </View>

                {/* Continue Count CTA */}
                <Pressable
                  onPress={() => router.push('/stock-count/active' as any)}
                  style={({ pressed }) => [styles.continueBtn, pressed && styles.pressed]}
                >
                  <VectorIcon name="Play" size={16} color="#ffffff" />
                  <Text style={styles.continueBtnText}>{t('stockCount.title')}</Text>
                </Pressable>
              </Card>
            ))}
          </View>
        )}

        {/* ── Scheduled Counts ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('common.filter')}</Text>
          <View style={styles.scheduledStack}>
            {scheduled.map((s) => (
              <Card key={s.id} style={styles.scheduledCard}>
                <View style={styles.scheduledRow}>
                  <View style={styles.scheduledIconBox}>
                    <VectorIcon name="Clock" size={18} color={Colors.neutral.textSecondary} />
                  </View>

                  <View style={styles.scheduledInfo}>
                    <Text style={styles.scheduledTitle}>{s.label}</Text>
                    <Text style={styles.scheduledSub}>
                      {s.sub} · {s.total} {t('inventory.itemCount', { count: s.total })}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => router.push('/stock-count/active' as any)}
                    style={({ pressed }) => [styles.startBtn, pressed && styles.pressed]}
                  >
                    <Text style={styles.startBtnText}>{t('common.add')}</Text>
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* ── Last Completed Audit Card (Dark contrast) ── */}
        <Card dark style={styles.lastCompletedCard}>
          <View style={styles.lastCompletedRow}>
            <View style={styles.lastCompletedIconBox}>
              <VectorIcon name="CheckCircle2" size={20} color={Colors.brand.primary} />
            </View>

            <View style={styles.lastCompletedInfo}>
              <Text style={styles.lastCompletedTitle}>{t('stockCount.countSummaryTitle')}</Text>
              <Text style={styles.lastCompletedSub}>
                Daily Count · 08 Mar 2026 · 68 items
              </Text>
              <Text style={styles.lastCompletedVariance}>Variance −€142.80</Text>
            </View>

            <Pressable
              onPress={() => router.push('/stock-count/summary' as any)}
              style={({ pressed }) => [styles.reportLink, pressed && styles.pressed]}
            >
              <Text style={styles.reportLinkText}>{t('analytics.reports')}</Text>
              <VectorIcon name="ChevronRight" size={14} color={Colors.brand.primary} />
            </Pressable>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    ...Typography.sectionHeader,
    paddingHorizontal: Spacing.xs,
  },
  inProgressCard: {
    padding: Spacing.lg,
  },
  inProgressTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  inProgressTitleBox: {
    flex: 1,
    gap: 4,
  },
  inProgressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  inProgressTitle: {
    ...Typography.cardTitle,
    fontSize: 16,
  },
  inProgressSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inProgressSub: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
  },
  inProgressCountBox: {
    alignItems: 'flex-end',
  },
  inProgressCountNum: {
    ...Typography.monoKpiLarge,
    fontSize: 26,
    color: Colors.warning.dark,
    lineHeight: 28,
  },
  inProgressCountTotal: {
    fontSize: 11,
    color: Colors.warning.dark,
  },
  progressWrapper: {
    marginBottom: 6,
  },
  progressMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  progressMetaText: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
  },
  progressMetaPct: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  continueBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    ...Shadows.card,
  },
  continueBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  scheduledStack: {
    gap: Spacing.sm,
  },
  scheduledCard: {
    padding: Spacing.md,
  },
  scheduledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  scheduledIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.borderLight,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduledInfo: {
    flex: 1,
  },
  scheduledTitle: {
    ...Typography.cardTitle,
    fontSize: 14,
  },
  scheduledSub: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  startBtn: {
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  startBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  lastCompletedCard: {
    padding: Spacing.lg,
  },
  lastCompletedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  lastCompletedIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lastCompletedInfo: {
    flex: 1,
  },
  lastCompletedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  lastCompletedSub: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    marginTop: 2,
  },
  lastCompletedVariance: {
    ...Typography.monoCaption,
    fontSize: 12,
    fontWeight: '700',
    color: '#f87171',
    marginTop: 2,
  },
  reportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reportLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  pressed: {
    opacity: 0.8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.critical.light,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
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
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    ...Typography.bodySecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: Spacing.sm,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.neutral.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...Typography.cardTitle,
    fontSize: 15,
  },
  emptySub: {
    ...Typography.bodySecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});

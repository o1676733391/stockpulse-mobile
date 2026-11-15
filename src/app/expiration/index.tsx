import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { SectionHeader } from '@/components/ui/section-header';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n';
import {
  expirationService,
  INITIAL_EXPIRED_ITEMS,
  INITIAL_EXPIRY_ITEMS,
} from '@/services/expirationService';
import { ExpiredItem, ExpiryItem } from '@/types/expiration';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = ['Critical', 'Soon', 'All'] as const;
type TabType = (typeof TABS)[number];

function formatDateStr(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function ExpirationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, formatCurrency } = useI18n();

  const daysLabel = (days: number) => {
    if (days < 0) return t('expiration.expired', { defaultValue: 'Abgelaufen' });
    if (days === 0) return t('common.today');
    if (days === 1) return t('common.tomorrow', { defaultValue: 'Morgen' });
    return t('expiration.daysLeft', { count: days, defaultValue: `Noch ${days} Tage` });
  };

  const formatExpiryStatus = (days: number) => {
    if (days < 0) {
      return Math.abs(days) === 1
        ? t('inventory.expiredAgo_one', { count: 1 })
        : t('inventory.expiredAgo_other', { count: Math.abs(days) });
    }
    if (days === 0) return t('common.today');
    if (days === 1) return t('common.tomorrow');
    return days === 1
      ? t('inventory.daysRemaining_one', { count: 1 })
      : t('inventory.daysRemaining_other', { count: days });
  };

  const tabLabel = (tabKey: TabType) => {
    switch (tabKey) {
      case 'Critical':
        return t('inventory.statusLabels.critical') || 'Kritisch';
      case 'Soon':
        return t('inventory.statusLabels.expiry') || t('expiration.shortTitle') || 'Läuft bald ab';
      case 'All':
        return t('common.all') || 'Alle';
    }
  };

  const [items, setItems] = useState<ExpiryItem[]>([]);
  const [expiredItems, setExpiredItems] = useState<ExpiredItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>('Critical');
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [expiring, expired] = await Promise.all([
          expirationService.getExpiringItems().catch(() => INITIAL_EXPIRY_ITEMS),
          expirationService.getExpiredItems().catch(() => INITIAL_EXPIRED_ITEMS),
        ]);
        if (isMounted) {
          setItems(expiring);
          setExpiredItems(expired);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Metrics
  const expiredCount = expiredItems.length;
  const next3Days = items.filter((i) => i.days <= 3).length;
  const next7Days = items.filter((i) => i.days <= 7).length;

  const totalValueAtRisk = useMemo(() => {
    return items
      .filter((i) => i.days <= 7)
      .reduce((sum, i) => sum + i.value, 0);
  }, [items]);

  const filtered = useMemo(() => {
    if (tab === 'Critical') return items.filter((i) => i.status === 'critical');
    if (tab === 'Soon') return items.filter((i) => i.status === 'soon');
    return items;
  }, [tab, items]);

  const criticalCount = items.filter((i) => i.status === 'critical').length;

  // Actions
  const handleMarkUsed = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    // Optimistic local state update
    setItems((prev) => prev.filter((i) => i.id !== id));
    setAdjustingId(null);

    try {
      await expirationService.markItemUsed(id, item.qty);
    } catch (err) {
      console.error('Failed to mark item as used in backend:', err);
    }
  };

  const handleConfirmAdjust = async (id: string) => {
    // Optimistic local state update
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.id !== id) return i;
          const newQty = Math.max(0, parseFloat((i.qty - adjustQty).toFixed(1)));
          const newValue = parseFloat((newQty * i.costPerUnit).toFixed(2));
          return { ...i, qty: newQty, value: newValue };
        })
        .filter((i) => i.qty > 0)
    );
    setAdjustingId(null);

    try {
      await expirationService.markItemUsed(id, adjustQty);
    } catch (err) {
      console.error('Failed to adjust item quantity in backend:', err);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar title={t('expiration.title')} large showBack />

      {/* ── Summary & Tabs Header Card ── */}
      <View style={styles.headerSummaryCard}>
        {/* 3-Stat Metric Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricBoxRed}>
            <Text style={styles.metricNumRed}>{loading ? '--' : expiredCount}</Text>
            <Text style={styles.metricLabelRed}>{t('expiration.expired', { defaultValue: 'Abgelaufen' })}</Text>
          </View>
          <View style={styles.metricBoxAmber}>
            <Text style={styles.metricNumAmber}>{loading ? '--' : next3Days}</Text>
            <Text style={styles.metricLabelAmber}>{t('expiration.next3Days', { defaultValue: 'Nächste 3 Tage' })}</Text>
          </View>
          <View style={styles.metricBoxSlate}>
            <Text style={styles.metricNumSlate}>{loading ? '--' : next7Days}</Text>
            <Text style={styles.metricLabelSlate}>{t('expiration.next7Days', { defaultValue: 'Nächste 7 Tage' })}</Text>
          </View>
        </View>

        {/* Total Risk Banner */}
        {totalValueAtRisk > 0 && (
          <View style={styles.riskBanner}>
            <VectorIcon name="AlertTriangle" size={14} color={Colors.critical.main} />
            <Text style={styles.riskBannerText}>
              {t('expiration.totalRiskText', {
                value: formatCurrency(totalValueAtRisk),
                defaultValue: `Gesamter gefährdeter Wert: ${formatCurrency(totalValueAtRisk)} in den nächsten 7 Tagen`,
              })}
            </Text>
          </View>
        )}

        {/* Tabs Row */}
        <View style={styles.tabsRow}>
          {TABS.map((t) => {
            const isSelected = tab === t;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={({ pressed }) => [
                  styles.tabChip,
                  isSelected ? styles.tabChipSelected : styles.tabChipUnselected,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    isSelected ? styles.tabChipTextSelected : styles.tabChipTextUnselected,
                  ]}
                >
                  {tabLabel(t)}
                </Text>
                {t === 'Critical' && criticalCount > 0 && (
                  <View style={styles.criticalCountBadge}>
                    <Text style={styles.criticalCountText}>{criticalCount}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Scrollable Body ── */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <VectorIcon name="Check" size={24} color={Colors.brand.primary} />
            </View>
            <Text style={styles.emptyTitle}>{t('expiration.noItemsInCategory')}</Text>
            <Text style={styles.emptySub}>{t('expiration.noItemsInCategorySub')}</Text>
          </View>
        ) : (
          filtered.map((item) => {
            const isAdjusting = adjustingId === item.id;
            const hasSuggestion = item.suggestionId !== undefined && item.suggestionId >= 0;
            const isCritical = item.status === 'critical';
            const urgencyColor = isCritical ? Colors.critical.main : Colors.warning.main;

            return (
              <Card
                key={item.id}
                urgencyColor={urgencyColor}
                style={styles.itemCard}
              >
                {/* Header Row: Title, Category, Badge */}
                <Pressable
                  onPress={() => router.push(`/expiration/${item.id}` as any)}
                  style={styles.itemHeaderPressable}
                >
                  <View style={styles.itemHeaderInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMeta}>
                      Batch #{item.batch} · {item.qty} {item.unit} · {item.category}
                    </Text>
                  </View>
                  <View style={styles.badgeArrowRow}>
                    <Badge variant={isCritical ? 'red' : 'amber'}>
                      {daysLabel(item.days)}
                    </Badge>
                    <VectorIcon name="ChevronRight" size={14} color={Colors.neutral.textTertiary} />
                  </View>
                </Pressable>

                {/* BBD Timeline Countdown Bar */}
                <View style={styles.bbdSection}>
                  <View style={styles.bbdHeaderRow}>
                    <VectorIcon
                      name="Clock"
                      size={12}
                      color={isCritical ? Colors.critical.main : Colors.warning.dark}
                    />
                    <Text style={styles.bbdDateText}>
                      {formatExpiryStatus(item.days)}
                      {' · '}
                      <Text style={styles.bbdDateBold}>{formatDateStr(item.expiryDate)}</Text>
                    </Text>
                  </View>

                  {item.days > 0 && (
                    <View style={styles.bbdBarTrack}>
                      <View
                        style={[
                          styles.bbdBarFill,
                          {
                            width: `${Math.min(100, (item.days / 7) * 100)}%`,
                            backgroundColor: isCritical ? Colors.critical.light : Colors.warning.light,
                          },
                        ]}
                      />
                    </View>
                  )}
                </View>

                {/* Value at Risk Bar */}
                <View style={styles.valueRow}>
                  <Text style={styles.valueLabel}>
                    {t('expiration.valueAtRisk', { defaultValue: 'Gefährdeter Wert' })}:{' '}
                    <Text style={styles.valueBold}>{formatCurrency(item.value)}</Text>
                  </Text>
                </View>

                {/* Inline Stepper Adjustment Box */}
                {isAdjusting ? (
                  <View style={styles.adjustContainer}>
                    <Text style={styles.adjustTitle}>{t('expiration.adjustQty', { defaultValue: 'Verbrauchte Menge anpassen' })}</Text>
                    <View style={styles.stepperRow}>
                      <Pressable
                        onPress={() => setAdjustQty((q) => Math.max(0, parseFloat((q - 0.5).toFixed(1))))}
                        style={({ pressed }) => [styles.stepperBtn, pressed && styles.pressed]}
                      >
                        <VectorIcon name="Minus" size={14} color={Colors.neutral.textPrimary} />
                      </Pressable>

                      <View style={styles.stepperValueBox}>
                        <Text style={styles.stepperValueNum}>{adjustQty.toFixed(1)}</Text>
                        <Text style={styles.stepperValueUnit}>{item.unit}</Text>
                      </View>

                      <Pressable
                        onPress={() => setAdjustQty((q) => Math.min(item.qty, parseFloat((q + 0.5).toFixed(1))))}
                        style={({ pressed }) => [styles.stepperBtn, pressed && styles.pressed]}
                      >
                        <VectorIcon name="Plus" size={14} color={Colors.neutral.textPrimary} />
                      </Pressable>
                    </View>

                    <View style={styles.adjustActions}>
                      <Pressable
                        onPress={() => setAdjustingId(null)}
                        style={styles.adjustCancelBtn}
                      >
                        <Text style={styles.adjustCancelBtnText}>{t('common.cancel')}</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleConfirmAdjust(item.id)}
                        disabled={adjustQty === 0}
                        style={[
                          styles.adjustConfirmBtn,
                          adjustQty === 0 && styles.btnDisabled,
                        ]}
                      >
                        <Text style={styles.adjustConfirmBtnText}>{t('common.confirm')}</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  /* Action Buttons Row */
                  <View style={styles.actionButtonsRow}>
                    {hasSuggestion && (
                      <Pressable
                        onPress={() =>
                          router.push({
                            pathname: '/expiration/waste-reduction',
                            params: { suggestionId: String(item.suggestionId) },
                          } as any)
                        }
                        style={({ pressed }) => [styles.suggestionBtn, pressed && styles.pressed]}
                      >
                        <VectorIcon name="Lightbulb" size={13} color={Colors.brand.dark} />
                        <Text style={styles.suggestionBtnText}>{t('expiration.suggestion', { defaultValue: 'Vorschlag' })}</Text>
                      </Pressable>
                    )}

                    <Pressable
                      onPress={() => {
                        setAdjustingId(item.id);
                        setAdjustQty(item.qty);
                      }}
                      style={({ pressed }) => [styles.secondaryActionBtn, pressed && styles.pressed]}
                    >
                      <Text style={styles.secondaryActionText}>{t('expiration.adjust', { defaultValue: 'Anpassen' })}</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleMarkUsed(item.id)}
                      style={({ pressed }) => [styles.secondaryActionBtn, pressed && styles.pressed]}
                    >
                      <Text style={styles.secondaryActionText}>{t('expiration.markUsed', { defaultValue: 'Als verbraucht buchen' })}</Text>
                    </Pressable>
                  </View>
                )}
              </Card>
            );
          })
        )}

        {/* ── Expired Items Section (Critical / All tab) ── */}
        {(tab === 'Critical' || tab === 'All') && expiredItems.length > 0 && (
          <View style={styles.expiredSection}>
            <SectionHeader title={t('lossLogs.foodLossSpoilage', { defaultValue: 'Abgelaufene Artikel' })} />
            {expiredItems.map((exp) => (
              <Card key={exp.id} urgencyColor={Colors.neutral.textTertiary} style={styles.expiredCard}>
                <View style={styles.expiredRow}>
                  <View style={styles.expiredIconBox}>
                    <VectorIcon name="PackageX" size={16} color={Colors.neutral.textTertiary} />
                  </View>

                  <View style={styles.expiredInfo}>
                    <Text style={styles.expiredName}>{exp.name}</Text>
                    <Text style={styles.expiredSub}>
                      {t('common.batch')}: #{exp.batch} · {exp.qty} · {t('expiration.expired', { defaultValue: 'Abgelaufen' })}: {formatDateStr(exp.expiryDate)}
                    </Text>
                  </View>

                  <View style={styles.expiredRight}>
                    <Badge variant="gray">Expired</Badge>
                    <Text style={styles.expiredValue}>{exp.value}</Text>
                  </View>
                </View>
              </Card>
            ))}
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
  headerSummaryCard: {
    backgroundColor: Colors.neutral.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metricBoxRed: {
    flex: 1,
    backgroundColor: Colors.critical.subtle,
    borderColor: Colors.critical.light,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  metricNumRed: {
    ...Typography.monoValue,
    fontSize: 18,
    color: Colors.critical.dark,
  },
  metricLabelRed: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.critical.dark,
    marginTop: 2,
  },
  metricBoxAmber: {
    flex: 1,
    backgroundColor: Colors.warning.subtle,
    borderColor: Colors.warning.light,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  metricNumAmber: {
    ...Typography.monoValue,
    fontSize: 18,
    color: Colors.warning.dark,
  },
  metricLabelAmber: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.warning.dark,
    marginTop: 2,
  },
  metricBoxSlate: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  metricNumSlate: {
    ...Typography.monoValue,
    fontSize: 18,
    color: Colors.neutral.textPrimary,
  },
  metricLabelSlate: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  riskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.critical.subtle,
    borderColor: Colors.critical.light,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  riskBannerText: {
    fontSize: 11,
    color: Colors.critical.dark,
  },
  riskBannerBold: {
    ...Typography.monoCaption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.critical.dark,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 2,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  tabChipSelected: {
    backgroundColor: Colors.neutral.textPrimary,
  },
  tabChipUnselected: {
    backgroundColor: Colors.neutral.borderLight,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabChipTextSelected: {
    color: '#ffffff',
  },
  tabChipTextUnselected: {
    color: Colors.neutral.textSecondary,
  },
  criticalCountBadge: {
    backgroundColor: Colors.critical.main,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  criticalCountText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...Typography.cardTitle,
    fontSize: 15,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.neutral.textTertiary,
  },
  itemCard: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  itemHeaderPressable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  itemHeaderInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    ...Typography.cardTitle,
    fontSize: 14,
  },
  itemMeta: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  badgeArrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  bbdSection: {
    gap: 4,
  },
  bbdHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bbdDateText: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
  },
  bbdDateBold: {
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  bbdBarTrack: {
    height: 5,
    backgroundColor: Colors.neutral.borderLight,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  bbdBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  valueRow: {
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.borderLight,
  },
  valueLabel: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
  },
  valueBold: {
    ...Typography.monoCaption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 2,
  },
  suggestionBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.brand.subtle,
    borderColor: Colors.brand.light,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
  },
  suggestionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  secondaryActionBtn: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  adjustContainer: {
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    gap: Spacing.xs,
    marginTop: 4,
  },
  adjustTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.neutral.textSecondary,
    marginBottom: 2,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.neutral.card,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValueBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  stepperValueNum: {
    ...Typography.monoValue,
    fontSize: 18,
    color: Colors.neutral.textPrimary,
  },
  stepperValueUnit: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
  },
  adjustActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 4,
  },
  adjustCancelBtn: {
    flex: 1,
    backgroundColor: Colors.neutral.borderLight,
    borderRadius: Radius.md,
    paddingVertical: 6,
    alignItems: 'center',
  },
  adjustCancelBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  adjustConfirmBtn: {
    flex: 1,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.md,
    paddingVertical: 6,
    alignItems: 'center',
  },
  adjustConfirmBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  expiredSection: {
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  expiredCard: {
    padding: Spacing.sm,
    opacity: 0.8,
  },
  expiredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  expiredIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expiredInfo: {
    flex: 1,
    gap: 2,
  },
  expiredName: {
    ...Typography.cardTitle,
    fontSize: 13,
    color: Colors.neutral.textSecondary,
  },
  expiredSub: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
  },
  expiredRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  expiredValue: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  pressed: {
    opacity: 0.8,
  },
});

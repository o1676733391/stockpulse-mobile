import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { INITIAL_SUPPLIER_PERF } from '@/services/analyticsService';
import { SupplierPerformance } from '@/types/analytics';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SuppliersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  const [suppliers] = useState<SupplierPerformance[]>(() =>
    JSON.parse(JSON.stringify(INITIAL_SUPPLIER_PERF))
  );

  const [selectedSupplier, setSelectedSupplier] = useState<SupplierPerformance | null>(null);

  const totalOpenOrders = useMemo(
    () => suppliers.reduce((sum, s) => sum + s.openOrders, 0),
    [suppliers]
  );

  const totalYtdSpend = useMemo(
    () => suppliers.reduce((sum, s) => sum + s.ytdSpend, 0),
    [suppliers]
  );

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar
        title={t('analytics.suppliers')}
        large
        showBack
        right={
          <Pressable
            onPress={() => router.push('/orders/poq' as any)}
            style={({ pressed }) => [styles.newOrderBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="ShoppingCart" size={14} color="#ffffff" />
            <Text style={styles.newOrderBtnText}>{t('common.add')}</Text>
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Summary 3-Grid ── */}
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricNum}>{suppliers.length}</Text>
            <Text style={styles.metricLabel}>Suppliers</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={[styles.metricNum, { color: Colors.warning.dark }]}>
              {totalOpenOrders}
            </Text>
            <Text style={styles.metricLabel}>Open Orders</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={[styles.metricNum, { color: Colors.brand.dark }]}>
              €{(totalYtdSpend / 1000).toFixed(1)}k
            </Text>
            <Text style={styles.metricLabel}>YTD Spend</Text>
          </Card>
        </View>

        {/* ── Supplier Scorecards ── */}
        <View style={styles.suppliersStack}>
          {suppliers.map((s) => {
            const onTimeColor =
              s.onTimeRate >= 95
                ? Colors.brand.dark
                : s.onTimeRate >= 90
                ? Colors.warning.dark
                : Colors.critical.main;

            return (
              <Card
                key={s.id}
                onPress={() => setSelectedSupplier(s)}
                style={styles.supplierCard}
              >
                <View style={styles.supplierTopRow}>
                  {/* Avatar box */}
                  <View style={styles.supplierAvatarBox}>
                    <Text style={styles.supplierAvatarText}>
                      {s.name
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)}
                    </Text>
                  </View>

                  <View style={styles.supplierInfo}>
                    <Text style={styles.supplierName}>{s.name}</Text>
                    <Text style={styles.supplierContact}>{s.contact}</Text>

                    {/* Performance Metric Tags */}
                    <View style={styles.perfTagsRow}>
                      <View style={styles.perfTag}>
                        <VectorIcon name="Package" size={11} color={Colors.neutral.textTertiary} />
                        <Text style={styles.perfTagText}>{s.ingredientCount} items</Text>
                      </View>

                      <View style={styles.perfTag}>
                        <VectorIcon name="Clock" size={11} color={Colors.neutral.textTertiary} />
                        <Text style={styles.perfTagText}>{s.avgLeadDays}d lead</Text>
                      </View>

                      <View style={styles.perfTag}>
                        <VectorIcon name="TrendingUp" size={11} color={onTimeColor} />
                        <Text style={[styles.perfTagText, { color: onTimeColor, fontWeight: '700' }]}>
                          {s.onTimeRate}% on-time
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.supplierRightCol}>
                    {s.openOrders > 0 && (
                      <Badge variant="blue">{s.openOrders} open</Badge>
                    )}
                    <VectorIcon name="ChevronRight" size={14} color={Colors.neutral.textTertiary} />
                  </View>
                </View>

                {/* Bottom Row: Last Delivery & YTD Spend */}
                <View style={styles.supplierBottomRow}>
                  <Text style={styles.lastDeliveryText}>
                    Last delivery:{' '}
                    <Text style={styles.lastDeliveryBold}>{s.lastDelivery}</Text>
                  </Text>
                  <Text style={styles.ytdSpendText}>
                    €{s.ytdSpend.toLocaleString()} YTD
                  </Text>
                </View>
              </Card>
            );
          })}
        </View>
      </ScrollView>

      {/* ── Supplier Detail Modal ── */}
      <Modal
        visible={selectedSupplier !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSupplier(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.supplierDetailCard}>
            <View style={styles.modalGrabber} />

            {selectedSupplier && (
              <>
                <View style={styles.modalHeaderRow}>
                  <View style={styles.modalSupplierHero}>
                    <View style={styles.modalAvatarBox}>
                      <Text style={styles.modalAvatarText}>
                        {selectedSupplier.name
                          .split(' ')
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.modalSupplierName}>
                        {selectedSupplier.name}
                      </Text>
                      <Text style={styles.modalContact}>
                        {selectedSupplier.contact}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => setSelectedSupplier(null)}
                    style={styles.closeBtn}
                  >
                    <VectorIcon name="X" size={18} color={Colors.neutral.textTertiary} />
                  </Pressable>
                </View>

                {/* 4-Stat Scorecard Grid */}
                <View style={styles.scorecardGrid}>
                  <View style={styles.scorecardBox}>
                    <Text style={[styles.scorecardNum, { color: Colors.brand.dark }]}>
                      €{selectedSupplier.ytdSpend.toLocaleString()}
                    </Text>
                    <Text style={styles.scorecardLabel}>YTD Spend</Text>
                  </View>

                  <View style={styles.scorecardBox}>
                    <Text style={styles.scorecardNum}>
                      {selectedSupplier.totalOrders}
                    </Text>
                    <Text style={styles.scorecardLabel}>Total Orders</Text>
                  </View>

                  <View style={styles.scorecardBox}>
                    <Text style={[styles.scorecardNum, { color: Colors.warning.dark }]}>
                      {selectedSupplier.avgLeadDays}d
                    </Text>
                    <Text style={styles.scorecardLabel}>Avg Lead Time</Text>
                  </View>

                  <View style={styles.scorecardBox}>
                    <Text style={[styles.scorecardNum, { color: Colors.brand.primary }]}>
                      {selectedSupplier.onTimeRate}%
                    </Text>
                    <Text style={styles.scorecardLabel}>On-Time Rate</Text>
                  </View>
                </View>

                {/* Contact Information */}
                <View style={styles.contactSection}>
                  <Text style={styles.contactSectionTitle}>Contact Details</Text>
                  <View style={styles.contactRow}>
                    <VectorIcon name="Phone" size={14} color={Colors.neutral.textSecondary} />
                    <Text style={styles.contactText}>{selectedSupplier.phone}</Text>
                  </View>
                  <View style={styles.contactRow}>
                    <VectorIcon name="Mail" size={14} color={Colors.neutral.textSecondary} />
                    <Text style={styles.contactText}>{selectedSupplier.email}</Text>
                  </View>
                </View>

                {/* Actions */}
                <Pressable
                  onPress={() => {
                    setSelectedSupplier(null);
                    router.push('/orders/poq' as any);
                  }}
                  style={({ pressed }) => [styles.createPoFromSupplierBtn, pressed && styles.pressed]}
                >
                  <VectorIcon name="ShoppingCart" size={16} color="#ffffff" />
                  <Text style={styles.createPoFromSupplierBtnText}>
                    Create Purchase Order
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  newOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    ...Shadows.card,
  },
  newOrderBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
  },
  metricNum: {
    ...Typography.monoValue,
    fontSize: 18,
    color: Colors.neutral.textPrimary,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  suppliersStack: {
    gap: Spacing.md,
  },
  supplierCard: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  supplierTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  supplierAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.xl,
    backgroundColor: Colors.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplierAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  supplierInfo: {
    flex: 1,
    gap: 2,
  },
  supplierName: {
    ...Typography.cardTitle,
    fontSize: 14,
  },
  supplierContact: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  perfTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: 4,
  },
  perfTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  perfTagText: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
  },
  supplierRightCol: {
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  supplierBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.borderLight,
  },
  lastDeliveryText: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  lastDeliveryBold: {
    color: Colors.neutral.textPrimary,
    fontWeight: '600',
  },
  ytdSpendText: {
    ...Typography.monoCaption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  supplierDetailCard: {
    backgroundColor: Colors.neutral.card,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  modalGrabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.neutral.borderLight,
    alignSelf: 'center',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalSupplierHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  modalAvatarBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
    backgroundColor: Colors.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  modalSupplierName: {
    ...Typography.cardTitle,
    fontSize: 16,
  },
  modalContact: {
    fontSize: 12,
    color: Colors.neutral.textTertiary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scorecardGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  scorecardBox: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.borderLight,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  scorecardNum: {
    ...Typography.monoValue,
    fontSize: 14,
    color: Colors.neutral.textPrimary,
  },
  scorecardLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.neutral.textTertiary,
    marginTop: 2,
    textAlign: 'center',
  },
  contactSection: {
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  contactSectionTitle: {
    ...Typography.sectionHeader,
    fontSize: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  contactText: {
    fontSize: 13,
    color: Colors.neutral.textPrimary,
  },
  createPoFromSupplierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    ...Shadows.card,
  },
  createPoFromSupplierBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});

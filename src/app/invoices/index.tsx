import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DocumentTypePickerModal } from '@/components/ui/document-type-picker-modal';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { BadgeVariant, Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { invoiceService } from '@/services/invoiceService';
import { Invoice, InvoiceStatus, InvoiceType } from '@/types/invoices';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InvoicesListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, formatCurrency } = useI18n();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'supplier' | 'order' | 'debt'>('all');
  const [showPickerModal, setShowPickerModal] = useState(false);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getInvoices();
      setInvoices(data);
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchInvoices();
  }, [fetchInvoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (selectedTab === 'supplier' && inv.type !== 'supplier_delivery') return false;
      if (selectedTab === 'order' && inv.type !== 'order_receipt') return false;
      if (selectedTab === 'debt' && (inv.type !== 'supplier_delivery' || inv.paymentStatus === 'paid')) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.supplierName && inv.supplierName.toLowerCase().includes(q)) ||
        (inv.customerReference && inv.customerReference.toLowerCase().includes(q)) ||
        inv.items.some((i) => i.description.toLowerCase().includes(q))
      );
    });
  }, [invoices, selectedTab, search]);

  const metrics = useMemo(() => {
    const totalVal = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const supplierCount = invoices.filter((i) => i.type === 'supplier_delivery').length;
    const orderCount = invoices.filter((i) => i.type === 'order_receipt').length;
    const unpaidDebtVal = invoices
      .filter((i) => i.type === 'supplier_delivery' && i.paymentStatus !== 'paid')
      .reduce(
        (sum, i) =>
          sum + (i.netPayableAmount ?? (i.totalAmount - (i.skipDeductionAmount || 0))),
        0
      );
    const unpaidDebtCount = invoices.filter(
      (i) => i.type === 'supplier_delivery' && i.paymentStatus !== 'paid'
    ).length;

    return { totalVal, supplierCount, orderCount, unpaidDebtVal, unpaidDebtCount };
  }, [invoices]);

  const handleExportCsv = async () => {
    try {
      const headers = [
        'invoice_number',
        'type',
        'partner_or_channel',
        'date',
        'due_date',
        'gross_total_eur',
        'skip_deduction_eur',
        'skip_reason',
        'net_debt_eur',
        'payment_status',
        'verified_by',
      ];
      const rows = invoices.map((inv) => [
        inv.invoiceNumber,
        inv.type,
        inv.supplierName || inv.customerReference || 'N/A',
        inv.date,
        inv.dueDate || 'N/A',
        inv.totalAmount.toFixed(2),
        (inv.skipDeductionAmount || 0).toFixed(2),
        `"${(inv.skipDeductionReason || 'None').replace(/"/g, '""')}"`,
        (inv.netPayableAmount ?? (inv.totalAmount - (inv.skipDeductionAmount || 0))).toFixed(2),
        inv.paymentStatus || 'unpaid',
        inv.verifiedBy || 'Staff',
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      await Share.share({
        message: csvContent,
        title: 'Export StockPulse Invoices & Receipts CSV',
      });
    } catch {
      // share dismissal
    }
  };

  const getStatusBadge = (status: InvoiceStatus): { label: string; variant: BadgeVariant } => {
    switch (status) {
      case 'verified':
        return { label: t('invoices.statuses.verified'), variant: 'green' };
      case 'discrepancy':
        return { label: t('invoices.statuses.discrepancy'), variant: 'red' };
      case 'paid':
        return { label: t('invoices.statuses.paid'), variant: 'blue' };
      case 'pending':
        return { label: t('invoices.statuses.pending'), variant: 'amber' };
      default:
        return { label: status, variant: 'gray' };
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      {/* ── TopBar ── */}
      <TopBar
        title={t('invoices.title', { defaultValue: 'Invoices & Receipts' })}
        subtitle={t('invoices.subtitle', { defaultValue: 'Supplier deliveries & sales receipts' })}
        showBack
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Pressable
              onPress={handleExportCsv}
              style={({ pressed }) => [styles.exportBtn, pressed && styles.pressed]}
              accessibilityLabel="Export CSV"
            >
              <VectorIcon name="Download" size={15} color={Colors.brand.primary} />
            </Pressable>
            <Pressable
              onPress={() => setShowPickerModal(true)}
              style={({ pressed }) => [styles.newBtn, pressed && styles.pressed]}
            >
              <VectorIcon name="Plus" size={14} color="#ffffff" strokeWidth={2.5} />
              <Text style={styles.newBtnText}>{t('invoices.process')}</Text>
            </Pressable>
          </View>
        }
      />

      {/* ── Tabs Navigator ── */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
          <Pressable
            onPress={() => setSelectedTab('all')}
            style={[styles.tabItem, selectedTab === 'all' && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
              {t('invoices.allCount', { count: invoices.length, defaultValue: `All (${invoices.length})` })}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedTab('supplier')}
            style={[styles.tabItem, selectedTab === 'supplier' && styles.tabItemActive]}
          >
            <VectorIcon
              name="Truck"
              size={12}
              color={selectedTab === 'supplier' ? Colors.brand.primary : Colors.neutral.textSecondary}
            />
            <Text style={[styles.tabText, selectedTab === 'supplier' && styles.tabTextActive]}>
              {t('invoices.supplierInvoicesCount', {
                count: metrics.supplierCount,
                defaultValue: `Supplier Deliveries (${metrics.supplierCount})`,
              })}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedTab('order')}
            style={[styles.tabItem, selectedTab === 'order' && styles.tabItemActive]}
          >
            <VectorIcon
              name="FileText"
              size={12}
              color={selectedTab === 'order' ? Colors.brand.primary : Colors.neutral.textSecondary}
            />
            <Text style={[styles.tabText, selectedTab === 'order' && styles.tabTextActive]}>
              {t('invoices.orderReceiptsCount', {
                count: metrics.orderCount,
                defaultValue: `Sales Receipts (${metrics.orderCount})`,
              })}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedTab('debt')}
            style={[styles.tabItem, selectedTab === 'debt' && styles.tabItemActive]}
          >
            <VectorIcon
              name="CreditCard"
              size={12}
              color={selectedTab === 'debt' ? '#d97706' : Colors.neutral.textSecondary}
            />
            <Text style={[styles.tabText, selectedTab === 'debt' && styles.tabTextActive]}>
              {t('invoices.supplierDebtCount', {
                count: metrics.unpaidDebtCount,
                defaultValue: `Supplier Debt (${metrics.unpaidDebtCount})`,
              })}
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.brand.primary]}
            tintColor={Colors.brand.primary}
          />
        }
      >
        {/* KPI Summary Cards */}
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <Text style={[styles.metricNum, { color: Colors.brand.dark }]}>
              {loading ? '--' : formatCurrency(metrics.totalVal)}
            </Text>
            <Text style={styles.metricLabel}>{t('invoices.totalInvoiced')}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricNum}>
              {loading ? '--' : metrics.supplierCount}
            </Text>
            <Text style={styles.metricLabel}>{t('invoices.supplierInvoices')}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text
              style={[
                styles.metricNum,
                { color: metrics.unpaidDebtVal > 0 ? '#d97706' : Colors.brand.primary },
              ]}
            >
              {loading ? '--' : formatCurrency(metrics.unpaidDebtVal)}
            </Text>
            <Text style={styles.metricLabel}>{t('invoices.supplierDebt')}</Text>
          </Card>
        </View>

        {/* Search Input */}
        <View style={styles.searchWrapper}>
          <VectorIcon name="Search" size={16} color={Colors.neutral.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('invoices.searchPlaceholder', {
              defaultValue: 'Search by invoice #, supplier, or items...',
            })}
            placeholderTextColor={Colors.neutral.textTertiary}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <VectorIcon name="X" size={16} color={Colors.neutral.textTertiary} />
            </Pressable>
          )}
        </View>

        {/* Quick Intake Banner */}
        <Pressable
          onPress={() => setShowPickerModal(true)}
          style={styles.intakeBanner}
        >
          <View style={styles.intakeIconBox}>
            <VectorIcon name="Scan" size={20} color={Colors.brand.primary} />
          </View>
          <View style={styles.intakeInfo}>
            <Text style={styles.intakeTitle}>{t('invoices.chooseDocToProcess')}</Text>
            <Text style={styles.intakeSubtitle}>
              {t('invoices.chooseTypePrompt')}
            </Text>
          </View>
          <VectorIcon name="ChevronRight" size={18} color={Colors.neutral.textTertiary} />
        </Pressable>

        {loading && !refreshing && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.brand.primary} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        )}

        {/* Empty State */}
        {!loading && filteredInvoices.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <VectorIcon name="FileText" size={28} color={Colors.neutral.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>
              {t('invoices.emptyState', { defaultValue: 'No Invoices Found' })}
            </Text>
            <Text style={styles.emptySub}>
              {t('invoices.emptyStateDesc', {
                defaultValue: 'Scan or upload a delivery invoice from supplier or order form receipt.',
              })}
            </Text>
            <Pressable
              onPress={() => setShowPickerModal(true)}
              style={styles.emptyActionBtn}
            >
              <Text style={styles.emptyActionBtnText}>+ {t('invoices.chooseDocToProcess')}</Text>
            </Pressable>
          </View>
        )}

        {/* Invoice Cards List */}
        {filteredInvoices.map((inv) => {
          const statusBadge = getStatusBadge(inv.status);
          const isSupplierDoc = inv.type === 'supplier_delivery';

          return (
            <Card
              key={inv.id}
              style={styles.invoiceCard}
              onPress={() => router.push(`/invoices/${inv.id}` as any)}
            >
              {/* Header Row */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View
                    style={[
                      styles.typeBadge,
                      { backgroundColor: isSupplierDoc ? '#dcfce7' : '#ede9fe' },
                    ]}
                  >
                    <VectorIcon
                      name={isSupplierDoc ? 'Truck' : 'FileText'}
                      size={12}
                      color={isSupplierDoc ? '#15803d' : '#6d28d9'}
                    />
                    <Text
                      style={[
                        styles.typeBadgeText,
                        { color: isSupplierDoc ? '#15803d' : '#6d28d9' },
                      ]}
                    >
                      {isSupplierDoc
                        ? t('invoices.deliveryInvoiceSupplier')
                        : t('invoices.orderFormReceipt')}
                    </Text>
                  </View>
                  <Text style={styles.invoiceNum}>{inv.invoiceNumber}</Text>
                </View>

                <Badge variant={statusBadge.variant}>
                  {statusBadge.label}
                </Badge>
              </View>

              {/* Vendor / Description Row */}
              <View style={styles.vendorRow}>
                <Text style={styles.vendorName} numberOfLines={1}>
                  {inv.supplierName || inv.customerReference || 'Store Operations'}
                </Text>
                <Text style={styles.invoiceDate}>{inv.date}</Text>
              </View>

              {/* Items summary */}
              <View style={styles.itemsRow}>
                <Text style={styles.itemsCountText}>
                  {inv.itemCount} {inv.itemCount === 1 ? t('common.item') : t('common.items')} · {inv.items.map((i) => i.description).slice(0, 2).join(', ')}
                  {inv.items.length > 2 ? '...' : ''}
                </Text>
              </View>

              {/* Discrepancy Note banner if present */}
              {inv.status === 'discrepancy' && inv.notes && (
                <View style={styles.discrepancyBanner}>
                  <VectorIcon name="AlertTriangle" size={12} color={Colors.critical.main} />
                  <Text style={styles.discrepancyNote} numberOfLines={2}>
                    {inv.notes}
                  </Text>
                </View>
              )}

              {/* Footer Total */}
              <View style={styles.cardFooter}>
                <View
                  style={[
                    styles.paymentStatusPill,
                    {
                      backgroundColor:
                        inv.paymentStatus === 'paid' ? '#dcfce7' : '#fef3c7',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.paymentStatusText,
                      {
                        color:
                          inv.paymentStatus === 'paid'
                            ? '#15803d'
                            : '#b45309',
                      },
                    ]}
                  >
                    {inv.paymentStatus === 'paid'
                      ? t('invoices.statuses.paid')
                      : t('invoices.statuses.unpaidDebt')}
                  </Text>
                </View>

                <View style={styles.totalBox}>
                  {isSupplierDoc && inv.skipDeductionAmount && inv.skipDeductionAmount > 0 ? (
                    <View style={{ alignItems: 'flex-end', marginRight: Spacing.sm }}>
                      <Text style={{ fontSize: 10, color: Colors.warning.dark, fontWeight: '700' }}>
                        Skip -{formatCurrency(inv.skipDeductionAmount)}
                      </Text>
                      <Text style={styles.totalLabel}>{t('invoices.netDebt')}</Text>
                    </View>
                  ) : (
                    <Text style={styles.totalLabel}>
                      {isSupplierDoc && inv.paymentStatus !== 'paid' ? t('invoices.debt') : t('invoices.total')}
                    </Text>
                  )}
                  <Text style={styles.totalAmount}>
                    {formatCurrency(
                      inv.netPayableAmount !== undefined
                        ? inv.netPayableAmount
                        : inv.totalAmount - (inv.skipDeductionAmount || 0)
                    )}
                  </Text>
                </View>
              </View>
            </Card>
          );
        })}
      </ScrollView>

      {/* Document Type Intake Modal */}
      <DocumentTypePickerModal
        visible={showPickerModal}
        onClose={() => setShowPickerModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  exportBtn: {
    height: 32,
    width: 32,
    borderRadius: Radius.full,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    gap: 4,
  },
  newBtnText: {
    ...Typography.labelMedium,
    color: '#ffffff',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
  tabBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
  },
  tabContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral.background,
  },
  tabItemActive: {
    backgroundColor: '#dcfce7',
  },
  tabText: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.brand.primary,
    fontWeight: '700',
  },
  content: {
    padding: Spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metricCard: {
    flex: 1,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  metricNum: {
    ...Typography.titleLarge,
    fontWeight: '800',
    color: Colors.neutral.textPrimary,
  },
  metricLabel: {
    ...Typography.labelSmall,
    color: Colors.neutral.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    ...Typography.bodyMedium,
    color: Colors.neutral.textPrimary,
    padding: 0,
  },
  intakeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  intakeIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  intakeInfo: {
    flex: 1,
  },
  intakeTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  intakeSubtitle: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    fontSize: 12,
  },
  loadingBox: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    marginTop: Spacing.sm,
  },
  emptyState: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.titleMedium,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    marginBottom: 4,
  },
  emptySub: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: Spacing.lg,
  },
  emptyActionBtn: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  emptyActionBtnText: {
    ...Typography.labelMedium,
    color: '#ffffff',
    fontWeight: '700',
  },
  invoiceCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  invoiceNum: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  vendorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  vendorName: {
    ...Typography.titleMedium,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
    flex: 1,
  },
  invoiceDate: {
    ...Typography.bodySmall,
    color: Colors.neutral.textTertiary,
  },
  itemsRow: {
    marginTop: 6,
  },
  itemsCountText: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    fontSize: 12,
  },
  discrepancyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    padding: Spacing.xs + 2,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
  discrepancyNote: {
    ...Typography.labelSmall,
    color: Colors.critical.dark,
    flex: 1,
    fontSize: 11,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
  },
  paymentStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    backgroundColor: '#f1f5f9',
  },
  paymentStatusText: {
    ...Typography.labelSmall,
    color: Colors.neutral.textSecondary,
    fontWeight: '600',
  },
  totalBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  totalLabel: {
    ...Typography.labelSmall,
    color: Colors.neutral.textTertiary,
  },
  totalAmount: {
    ...Typography.titleMedium,
    fontWeight: '800',
    color: Colors.neutral.textPrimary,
  },
});

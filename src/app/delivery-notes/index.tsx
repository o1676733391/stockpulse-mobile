import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DocumentTypePickerModal } from '@/components/ui/document-type-picker-modal';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { BadgeVariant, Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { deliveryNoteService } from '@/services/deliveryNoteService';
import { DeliveryNote, DeliveryNoteStatus } from '@/types/deliveryNotes';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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

export default function DeliveryNotesListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, formatCurrency } = useI18n();

  const [notes, setNotes] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'received' | 'pending' | 'discrepancy'>('all');
  const [showPickerModal, setShowPickerModal] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await deliveryNoteService.getDeliveryNotes();
      setNotes(data);
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotes();
  }, [fetchNotes]);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      if (selectedTab === 'received' && n.status !== 'received') return false;
      if (selectedTab === 'pending' && n.status !== 'pending_inspection') return false;
      if (selectedTab === 'discrepancy' && (n.status !== 'discrepancy' && n.status !== 'damaged')) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        n.deliveryNoteNumber.toLowerCase().includes(q) ||
        n.supplierName.toLowerCase().includes(q) ||
        (n.invoiceNumber && n.invoiceNumber.toLowerCase().includes(q)) ||
        n.items.some((i) => i.itemName.toLowerCase().includes(q))
      );
    });
  }, [notes, selectedTab, search]);

  const metrics = useMemo(() => {
    const totalDeliveries = notes.length;
    const pendingCount = notes.filter((n) => n.status === 'pending_inspection').length;
    const discrepancyCount = notes.filter((n) => n.status === 'discrepancy' || n.status === 'damaged').length;

    return { totalDeliveries, pendingCount, discrepancyCount };
  }, [notes]);

  const handleExportCsv = async () => {
    try {
      const headers = [
        'delivery_note_number',
        'date',
        'supplier_name',
        'carrier',
        'driver_name',
        'vehicle_plate',
        'status',
        'item_count',
        'receiver_staff',
        'notes',
      ];
      const rows = notes.map((n) => [
        n.deliveryNoteNumber,
        n.deliveryDate,
        `"${(n.supplierName || '').replace(/"/g, '""')}"`,
        `"${(n.carrier || 'N/A').replace(/"/g, '""')}"`,
        `"${(n.driverName || 'N/A').replace(/"/g, '""')}"`,
        n.temperatureCheck || 'N/A',
        n.status,
        n.items.length,
        `"${(n.receivedBy || 'Staff').replace(/"/g, '""')}"`,
        `"${(n.notes || '').replace(/"/g, '""')}"`,
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      await Share.share({
        message: csvContent,
        title: 'Export Goods Delivery Notes CSV',
      });
    } catch {
      // share dismissal
    }
  };

  const getStatusBadge = (status: DeliveryNoteStatus): { label: string; variant: BadgeVariant } => {
    switch (status) {
      case 'received':
        return { label: t('deliveryNotes.statuses.received'), variant: 'green' };
      case 'pending_inspection':
        return { label: t('deliveryNotes.statuses.pendingInspection'), variant: 'amber' };
      case 'discrepancy':
        return { label: t('deliveryNotes.statuses.variance'), variant: 'red' };
      case 'damaged':
        return { label: t('deliveryNotes.statuses.damaged'), variant: 'red' };
      default:
        return { label: status, variant: 'gray' };
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      {/* ── TopBar ── */}
      <TopBar
        title={t('deliveryNotes.title', { defaultValue: 'Delivery Notes' })}
        subtitle={t('deliveryNotes.subtitle', { defaultValue: 'Inbound supplier delivery slips & receiving log' })}
        showBack
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Pressable
              onPress={handleExportCsv}
              style={({ pressed }) => [styles.exportBtn, pressed && styles.pressed]}
              accessibilityLabel="Export CSV"
            >
              <VectorIcon name="Download" size={14} color={Colors.brand.primary} />
            </Pressable>
            <Pressable
              onPress={() => setShowPickerModal(true)}
              style={({ pressed }) => [styles.newBtn, pressed && styles.pressed]}
            >
              <VectorIcon name="Plus" size={14} color="#ffffff" strokeWidth={2.5} />
              <Text style={styles.newBtnText}>{t('deliveryNotes.inbound')}</Text>
            </Pressable>
          </View>
        }
      />

      {/* ── Tabs Navigation ── */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
          <Pressable
            onPress={() => setSelectedTab('all')}
            style={[styles.tabItem, selectedTab === 'all' && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
              {t('deliveryNotes.allNotesCount', { count: notes.length, defaultValue: `All Notes (${notes.length})` })}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedTab('received')}
            style={[styles.tabItem, selectedTab === 'received' && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, selectedTab === 'received' && styles.tabTextActive]}>
              {t('deliveryNotes.receivedCount', {
                count: notes.filter((n) => n.status === 'received').length,
                defaultValue: `Received (${notes.filter((n) => n.status === 'received').length})`,
              })}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedTab('pending')}
            style={[styles.tabItem, selectedTab === 'pending' && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, selectedTab === 'pending' && styles.tabTextActive]}>
              {t('deliveryNotes.pendingCount', {
                count: metrics.pendingCount,
                defaultValue: `Pending Inspection (${metrics.pendingCount})`,
              })}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedTab('discrepancy')}
            style={[styles.tabItem, selectedTab === 'discrepancy' && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, selectedTab === 'discrepancy' && styles.tabTextActive]}>
              {t('deliveryNotes.shortagesCount', {
                count: metrics.discrepancyCount,
                defaultValue: `Shortages (${metrics.discrepancyCount})`,
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
        {/* KPI Metrics */}
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricNum}>{loading ? '--' : metrics.totalDeliveries}</Text>
            <Text style={styles.metricLabel}>{t('deliveryNotes.totalDeliveries')}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text
              style={[
                styles.metricNum,
                { color: metrics.pendingCount > 0 ? Colors.warning.dark : Colors.neutral.textPrimary },
              ]}
            >
              {loading ? '--' : metrics.pendingCount}
            </Text>
            <Text style={styles.metricLabel}>{t('deliveryNotes.awaitingInspection')}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text
              style={[
                styles.metricNum,
                { color: metrics.discrepancyCount > 0 ? Colors.critical.main : Colors.neutral.textPrimary },
              ]}
            >
              {loading ? '--' : metrics.discrepancyCount}
            </Text>
            <Text style={styles.metricLabel}>{t('deliveryNotes.shortages')}</Text>
          </Card>
        </View>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <VectorIcon name="Search" size={16} color={Colors.neutral.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('deliveryNotes.searchPlaceholder', {
              defaultValue: 'Search by delivery note #, supplier, or items...',
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
            <VectorIcon name="Truck" size={20} color={Colors.brand.primary} />
          </View>
          <View style={styles.intakeInfo}>
            <Text style={styles.intakeTitle}>{t('deliveryNotes.scanIntakeTitle')}</Text>
            <Text style={styles.intakeSubtitle}>
              {t('deliveryNotes.scanIntakeSub')}
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
        {!loading && filteredNotes.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <VectorIcon name="Package" size={28} color={Colors.neutral.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>
              {t('deliveryNotes.emptyState', { defaultValue: 'No Delivery Notes Found' })}
            </Text>
            <Text style={styles.emptySub}>
              {t('deliveryNotes.emptyStateDesc', {
                defaultValue: 'Log incoming delivery slips when suppliers drop off goods.',
              })}
            </Text>
            <Pressable
              onPress={() => setShowPickerModal(true)}
              style={styles.emptyActionBtn}
            >
              <Text style={styles.emptyActionBtnText}>+ {t('deliveryNotes.newDeliveryNote')}</Text>
            </Pressable>
          </View>
        )}

        {/* Delivery Notes List */}
        {filteredNotes.map((note) => {
          const statusBadge = getStatusBadge(note.status);
          const hasShortage = note.items.some((i) => i.discrepancyQuantity < 0);

          return (
            <Card
              key={note.id}
              style={styles.noteCard}
              onPress={() => router.push(`/delivery-notes/${note.id}` as any)}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.noteNumber}>{note.deliveryNoteNumber}</Text>
                  <Text style={styles.supplierName}>{note.supplierName}</Text>
                </View>

                <Badge variant={statusBadge.variant}>
                  {statusBadge.label}
                </Badge>
              </View>

              {/* Delivery Meta Row */}
              <View style={styles.metaRow}>
                <View style={styles.metaChip}>
                  <VectorIcon name="Calendar" size={12} color={Colors.neutral.textSecondary} />
                  <Text style={styles.metaChipText}>
                    {note.deliveryDate} · {note.receivedAt}
                  </Text>
                </View>

                {note.temperatureCheck && (
                  <View style={styles.metaChip}>
                    <VectorIcon name="Thermometer" size={12} color={Colors.brand.primary} />
                    <Text style={styles.metaChipText}>{note.temperatureCheck}</Text>
                  </View>
                )}
              </View>

              {/* Items summary */}
              <View style={styles.itemsRow}>
                <Text style={styles.itemsSummary}>
                  {t('deliveryNotes.itemsReceived', {
                    count: note.itemCount,
                    items: `${note.items.map((i) => `${i.receivedQuantity}${i.unit} ${i.itemName}`).slice(0, 2).join(', ')}${note.items.length > 2 ? '...' : ''}`,
                    defaultValue: `${note.itemCount} items received`,
                  })}
                </Text>
              </View>

              {/* Shortage notice if applicable */}
              {hasShortage && (
                <View style={styles.shortageNotice}>
                  <VectorIcon name="AlertCircle" size={12} color={Colors.critical.main} />
                  <Text style={styles.shortageText}>
                    {t('deliveryNotes.shortageNotice')}
                  </Text>
                </View>
              )}

              {/* Footer */}
              <View style={styles.cardFooter}>
                <Text style={styles.receiverText}>
                  {t('deliveryNotes.receivedBy')}: <Text style={styles.bold}>{note.receivedBy}</Text>
                </Text>
                <Text style={styles.valueText}>
                  {t('common.est')} {formatCurrency(note.totalValue)}
                </Text>
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
  noteCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  noteNumber: {
    ...Typography.bodySmall,
    color: Colors.brand.primary,
    fontWeight: '700',
  },
  supplierName: {
    ...Typography.titleMedium,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 4,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  metaChipText: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
    fontWeight: '500',
  },
  itemsRow: {
    marginTop: 8,
  },
  itemsSummary: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    fontSize: 12,
  },
  shortageNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    padding: Spacing.xs + 2,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
  shortageText: {
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
  receiverText: {
    ...Typography.labelSmall,
    color: Colors.neutral.textSecondary,
  },
  bold: {
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  valueText: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
});

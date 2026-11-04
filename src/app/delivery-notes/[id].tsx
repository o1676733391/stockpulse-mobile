import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { BadgeVariant, Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { deliveryNoteService } from '@/services/deliveryNoteService';
import { DeliveryNote, DeliveryNoteStatus } from '@/types/deliveryNotes';
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

export default function DeliveryNoteDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, formatCurrency } = useI18n();

  const [note, setNote] = useState<DeliveryNote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNote() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await deliveryNoteService.getDeliveryNoteById(id);
        setNote(data);
      } catch {
        // safe fallback
      } finally {
        setLoading(false);
      }
    }
    loadNote();
  }, [id]);

  const handleVerifyReceiving = async () => {
    if (!note) return;
    try {
      const updated = await deliveryNoteService.verifyDeliveryNote(note.id);
      setNote(updated);
      Alert.alert('Receiving Confirmed', 'Warehouse stock has been successfully updated with received batch items.');
    } catch {
      Alert.alert('Error', 'Unable to confirm receiving.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={Colors.brand.primary} />
      </View>
    );
  }

  if (!note) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.errorText}>{t('deliveryNotes.deliveryNoteNotFound')}</Text>
        <Button label={t('common.goBack')} variant="outline" onPress={() => router.back()} />
      </View>
    );
  }

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

  const statusBadge = getStatusBadge(note.status);

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar
        title={note.deliveryNoteNumber}
        subtitle={note.supplierName}
        showBack
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.docCode}>{note.deliveryNoteNumber}</Text>
              <Text style={styles.supplierTitle}>{note.supplierName}</Text>
            </View>

            <Badge variant={statusBadge.variant}>
              {statusBadge.label}
            </Badge>
          </View>

          {/* Receiving Meta Info */}
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Delivery Date</Text>
              <Text style={styles.metaValue}>{note.deliveryDate} at {note.receivedAt}</Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Received By</Text>
              <Text style={styles.metaValue}>{note.receivedBy}</Text>
            </View>

            {note.temperatureCheck && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Temperature Probe</Text>
                <Text style={[styles.metaValue, { color: Colors.brand.primary }]}>
                  {note.temperatureCheck}
                </Text>
              </View>
            )}

            {note.storageZone && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Target Storage Zone</Text>
                <Text style={styles.metaValue}>{note.storageZone}</Text>
              </View>
            )}

            {note.carrier && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Carrier / Driver</Text>
                <Text style={styles.metaValue}>
                  {note.carrier} {note.driverName ? `(${note.driverName})` : ''}
                </Text>
              </View>
            )}
          </View>

          {/* Connected Invoice & PO badges */}
          {(note.invoiceNumber || note.purchaseOrderId) && (
            <View style={styles.connectionsRow}>
              {note.invoiceNumber && (
                <View style={styles.connectionBadge}>
                  <VectorIcon name="FileText" size={12} color="#6d28d9" />
                  <Text style={[styles.connectionText, { color: '#6d28d9' }]}>
                    Invoice #{note.invoiceNumber}
                  </Text>
                </View>
              )}

              {note.purchaseOrderId && (
                <Pressable
                  onPress={() => router.push(`/orders/${note.purchaseOrderId}` as any)}
                  style={styles.connectionBadge}
                >
                  <VectorIcon name="ShoppingCart" size={12} color={Colors.brand.primary} />
                  <Text style={styles.connectionText}>
                    Order #{note.purchaseOrderId.toUpperCase()}
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {note.notes && (
            <View style={styles.notesBox}>
              <VectorIcon name="Info" size={14} color={Colors.neutral.textSecondary} />
              <Text style={styles.notesText}>{note.notes}</Text>
            </View>
          )}
        </Card>

        {/* Received Items Inspection List */}
        <Text style={styles.sectionHeading}>
          {t('deliveryNotes.receivedItemsInspection', { count: note.items.length })}
        </Text>

        <Card style={styles.itemsCard}>
          {note.items.map((item, idx) => {
            const hasDiscrepancy = item.discrepancyQuantity !== 0;

            return (
              <View
                key={item.id}
                style={[
                  styles.itemRow,
                  idx !== note.items.length - 1 && styles.itemRowBorder,
                ]}
              >
                <View style={styles.itemHeader}>
                  <View style={styles.itemTitleBox}>
                    <Text style={styles.itemName}>{item.itemName}</Text>
                    <View style={styles.batchRow}>
                      <Text style={styles.batchTag}>{t('common.batch')}: {item.batchNumber}</Text>
                      <Text style={styles.bbdTag}>MHD: {item.bbd}</Text>
                    </View>
                  </View>

                  <View style={styles.qtyBox}>
                    <Text style={styles.qtyReceived}>
                      {item.receivedQuantity} {item.unit}
                    </Text>
                    <Text style={styles.qtyOrdered}>
                      {t('deliveryNotes.ordered')}: {item.orderedQuantity} {item.unit}
                    </Text>
                  </View>
                </View>

                {hasDiscrepancy && (
                  <View style={styles.itemDiscrepancyRow}>
                    <VectorIcon name="AlertTriangle" size={12} color={Colors.critical.main} />
                    <Text style={styles.itemDiscrepancyText}>
                      {t('deliveryNotes.variance')}: {item.discrepancyQuantity > 0 ? `+${item.discrepancyQuantity}` : item.discrepancyQuantity} {item.unit} ({item.condition})
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </Card>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {note.status !== 'received' && (
            <Button
              label={t('deliveryNotes.confirmReceiving')}
              variant="primary"
              size="md"
              icon="Check"
              fullWidth
              onPress={handleVerifyReceiving}
              style={{ marginBottom: Spacing.sm }}
            />
          )}

          <Button
            label={t('deliveryNotes.backToList')}
            variant="outline"
            size="md"
            fullWidth
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    ...Typography.bodyLarge,
    color: Colors.critical.main,
    marginBottom: Spacing.md,
  },
  content: {
    padding: Spacing.md,
  },
  headerCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  docCode: {
    ...Typography.bodySmall,
    color: Colors.brand.primary,
    fontWeight: '700',
  },
  supplierTitle: {
    ...Typography.titleLarge,
    fontWeight: '800',
    color: Colors.neutral.textPrimary,
    marginTop: 2,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginVertical: Spacing.sm,
  },
  metaItem: {
    minWidth: '45%',
  },
  metaLabel: {
    ...Typography.labelSmall,
    color: Colors.neutral.textTertiary,
    marginBottom: 2,
  },
  metaValue: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  connectionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  connectionText: {
    ...Typography.labelSmall,
    color: Colors.brand.primary,
    fontWeight: '700',
  },
  notesBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#f8fafc',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  notesText: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    flex: 1,
  },
  sectionHeading: {
    ...Typography.titleMedium,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    marginBottom: Spacing.sm,
  },
  itemsCard: {
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  itemRow: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitleBox: {
    flex: 1,
    marginRight: Spacing.md,
  },
  itemName: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  batchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 4,
  },
  batchTag: {
    ...Typography.labelSmall,
    color: Colors.neutral.textSecondary,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  bbdTag: {
    ...Typography.labelSmall,
    color: '#047857',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    fontWeight: '600',
  },
  qtyBox: {
    alignItems: 'flex-end',
  },
  qtyReceived: {
    ...Typography.titleMedium,
    fontWeight: '800',
    color: Colors.neutral.textPrimary,
  },
  qtyOrdered: {
    ...Typography.labelSmall,
    color: Colors.neutral.textTertiary,
    marginTop: 2,
  },
  itemDiscrepancyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    marginTop: Spacing.xs,
  },
  itemDiscrepancyText: {
    ...Typography.labelSmall,
    color: Colors.critical.dark,
    fontWeight: '600',
  },
  actionsContainer: {
    marginTop: Spacing.sm,
  },
});

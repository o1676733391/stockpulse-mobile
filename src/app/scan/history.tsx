import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { ocrService } from '@/services/ocrService';
import { OcrHistoryItem } from '@/types/ocr';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FilterTab = 'all' | 'order_invoice' | 'goods_receipt' | 'confirmed' | 'pending' | 'reverted';

export default function ScanHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, formatCurrency, formatDate } = useI18n();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [documents, setDocuments] = useState<OcrHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [revertingId, setRevertingId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await ocrService.getDocuments({ limit: 50 });
      setDocuments(res.data);
    } catch {
      // Graceful fallback
      setDocuments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const handleRevertWarehouse = (doc: OcrHistoryItem) => {
    Alert.alert(
      t('scan.history.revertConfirmTitle'),
      t('scan.history.revertConfirmMessage', { number: doc.documentNumber }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('scan.history.revertWarehouse'),
          style: 'destructive',
          onPress: async () => {
            try {
              setRevertingId(doc.id);
              await ocrService.revertDocument(doc.id, 'User initiated warehouse stock rollback');
              Alert.alert(t('common.success'), t('scan.history.revertSuccess'));
              setDocuments((prev) =>
                prev.map((d) => (d.id === doc.id ? { ...d, status: 'reverted' } : d))
              );
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to revert warehouse stock');
            } finally {
              setRevertingId(null);
            }
          },
        },
      ]
    );
  };

  const handleDeleteScan = (doc: OcrHistoryItem) => {
    const isConfirmed = doc.status === 'confirmed';

    if (isConfirmed) {
      Alert.alert(
        t('scan.history.deleteConfirmTitle'),
        `Invoice #${doc.documentNumber} is currently confirmed and affected warehouse inventory balances. How would you like to handle the warehouse stock?`,
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('scan.history.deleteWithRollback'),
            style: 'destructive',
            onPress: async () => {
              try {
                await ocrService.deleteDocument(doc.id, true);
                setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
                Alert.alert(t('common.success'), t('scan.history.revertSuccess'));
              } catch (err: any) {
                Alert.alert('Error', err.message || 'Failed to delete scan and rollback stock');
              }
            },
          },
          {
            text: t('scan.history.deleteRecordOnly'),
            onPress: async () => {
              try {
                await ocrService.deleteDocument(doc.id, false);
                setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
              } catch (err: any) {
                Alert.alert('Error', err.message || 'Failed to delete scan record');
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        t('scan.history.deleteConfirmTitle'),
        t('scan.history.deleteConfirmMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: async () => {
              try {
                await ocrService.deleteDocument(doc.id, false);
                setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
              } catch (err: any) {
                Alert.alert('Error', err.message || 'Failed to delete scan record');
              }
            },
          },
        ]
      );
    }
  };

  const handleOpenScan = (doc: OcrHistoryItem) => {
    router.push({
      pathname: '/scan/review',
      params: {
        reportId: doc.id,
        documentType: doc.documentType,
      },
    } as any);
  };

  // Filtered document list
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Tab filter
      if (activeTab === 'order_invoice' && doc.documentType !== 'order_invoice') return false;
      if (activeTab === 'goods_receipt' && doc.documentType !== 'goods_receipt') return false;
      if (activeTab === 'confirmed' && doc.status !== 'confirmed') return false;
      if (activeTab === 'pending' && doc.status !== 'pending') return false;
      if (activeTab === 'reverted' && doc.status !== 'reverted') return false;

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNum = doc.documentNumber.toLowerCase().includes(q);
        const matchesVendor = (doc.vendorName || '').toLowerCase().includes(q);
        const matchesId = doc.id.toLowerCase().includes(q);
        if (!matchesNum && !matchesVendor && !matchesId) return false;
      }

      return true;
    });
  }, [documents, activeTab, searchQuery]);

  const renderStatusBadge = (status: string, isDuplicate?: boolean) => {
    if (isDuplicate) {
      return <Badge variant="amber">{t('scan.duplicateBadge')}</Badge>;
    }
    switch (status) {
      case 'confirmed':
        return <Badge variant="green">{t('scan.history.filterConfirmed')}</Badge>;
      case 'reverted':
        return <Badge variant="gray">{t('scan.history.filterReverted')}</Badge>;
      case 'rejected':
        return <Badge variant="red">{t('common.delete')}</Badge>;
      case 'processing':
        return <Badge variant="blue">Processing</Badge>;
      default:
        return <Badge variant="amber">{t('scan.history.filterPending')}</Badge>;
    }
  };

  const renderItem = ({ item }: { item: OcrHistoryItem }) => {
    const isGoodsReceipt = item.documentType === 'goods_receipt';
    const isReverting = revertingId === item.id;
    const canRevert = item.status === 'confirmed';

    return (
      <Card style={styles.historyCard}>
        <View style={styles.cardHeader}>
          <View style={styles.typeIconBox}>
            <VectorIcon
              name={isGoodsReceipt ? 'Truck' : 'FileText'}
              size={18}
              color={Colors.brand.primary}
            />
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.docTitleRow}>
              <Text style={styles.docNumberText} numberOfLines={1}>
                {isGoodsReceipt ? 'GR' : 'INV'} #{item.documentNumber}
              </Text>
              {renderStatusBadge(item.status, item.isDuplicate)}
            </View>

            <Text style={styles.vendorText}>
              {item.vendorName || (isGoodsReceipt ? 'Supplier Delivery' : 'POS Register Closure')}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <VectorIcon name="Calendar" size={13} color={Colors.neutral.textTertiary} />
            <Text style={styles.detailText}>{formatDate(item.date)}</Text>
          </View>

          <View style={styles.detailItem}>
            <VectorIcon name="Package" size={13} color={Colors.neutral.textTertiary} />
            <Text style={styles.detailText}>{item.itemCount} items</Text>
          </View>

          {item.totalAmount !== undefined && item.totalAmount > 0 && (
            <View style={styles.detailItem}>
              <VectorIcon name="Coins" size={13} color={Colors.neutral.textTertiary} />
              <Text style={styles.detailText}>{formatCurrency(item.totalAmount)}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.cardActionsRow}>
          <Pressable
            onPress={() => handleOpenScan(item)}
            style={({ pressed }) => [styles.viewBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="Eye" size={14} color={Colors.brand.primary} />
            <Text style={styles.viewBtnText}>{t('common.details')}</Text>
          </Pressable>

          {canRevert && (
            <Pressable
              onPress={() => handleRevertWarehouse(item)}
              disabled={isReverting}
              style={({ pressed }) => [styles.revertBtn, pressed && styles.pressed]}
            >
              {isReverting ? (
                <ActivityIndicator size="small" color="#b45309" />
              ) : (
                <>
                  <VectorIcon name="RefreshCw" size={13} color="#b45309" />
                  <Text style={styles.revertBtnText}>{t('scan.history.revertWarehouse')}</Text>
                </>
              )}
            </Pressable>
          )}

          <Pressable
            onPress={() => handleDeleteScan(item)}
            style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="Trash2" size={14} color={Colors.critical.main} />
          </Pressable>
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.background }]}>
      <TopBar
        title={t('scan.history.title')}
        subtitle={t('scan.history.subtitle')}
        showBack
      />

      {/* ── Search Bar ── */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <VectorIcon name="Search" size={16} color={Colors.neutral.textTertiary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('scan.history.searchPlaceholder')}
            placeholderTextColor={Colors.neutral.textTertiary}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <VectorIcon name="X" size={16} color={Colors.neutral.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Filter Tabs ── */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsList}>
          <Pressable
            onPress={() => setActiveTab('all')}
            style={[styles.tabChip, activeTab === 'all' && styles.tabChipActive]}
          >
            <Text style={[styles.tabChipText, activeTab === 'all' && styles.tabChipTextActive]}>
              {t('scan.history.filterAll')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('order_invoice')}
            style={[styles.tabChip, activeTab === 'order_invoice' && styles.tabChipActive]}
          >
            <Text style={[styles.tabChipText, activeTab === 'order_invoice' && styles.tabChipTextActive]}>
              {t('scan.history.filterOrders')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('goods_receipt')}
            style={[styles.tabChip, activeTab === 'goods_receipt' && styles.tabChipActive]}
          >
            <Text style={[styles.tabChipText, activeTab === 'goods_receipt' && styles.tabChipTextActive]}>
              {t('scan.history.filterDeliveries')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('confirmed')}
            style={[styles.tabChip, activeTab === 'confirmed' && styles.tabChipActive]}
          >
            <Text style={[styles.tabChipText, activeTab === 'confirmed' && styles.tabChipTextActive]}>
              {t('scan.history.filterConfirmed')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('pending')}
            style={[styles.tabChip, activeTab === 'pending' && styles.tabChipActive]}
          >
            <Text style={[styles.tabChipText, activeTab === 'pending' && styles.tabChipTextActive]}>
              {t('scan.history.filterPending')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('reverted')}
            style={[styles.tabChip, activeTab === 'reverted' && styles.tabChipActive]}
          >
            <Text style={[styles.tabChipText, activeTab === 'reverted' && styles.tabChipTextActive]}>
              {t('scan.history.filterReverted')}
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* ── Document List / States ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.brand.primary} />
          <Text style={styles.loadingText}>Loading scan history...</Text>
        </View>
      ) : filteredDocuments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <VectorIcon name="History" size={32} color={Colors.neutral.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>{t('scan.history.empty')}</Text>
          <Text style={styles.emptyDesc}>{t('scan.history.emptyDesc')}</Text>
          <Button
            label="Scan Document"
            variant="primary"
            size="md"
            icon={<VectorIcon name="Camera" size={16} color="#ffffff" />}
            onPress={() => router.push('/(tabs)/scan' as any)}
            style={{ marginTop: Spacing.lg }}
          />
        </View>
      ) : (
        <FlatList
          data={filteredDocuments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  searchBarContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.neutral.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.background,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.neutral.textPrimary,
    padding: 0,
  },
  tabsContainer: {
    backgroundColor: Colors.neutral.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
    paddingVertical: Spacing.xs,
  },
  tabsList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  tabChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral.background,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  tabChipActive: {
    backgroundColor: Colors.brand.light,
    borderColor: Colors.brand.primary,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  tabChipTextActive: {
    color: Colors.brand.dark,
    fontWeight: '700',
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  historyCard: {
    padding: Spacing.md,
    backgroundColor: Colors.neutral.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  typeIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  docTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  docNumberText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    flex: 1,
    marginRight: Spacing.xs,
  },
  vendorText: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: Colors.brand.light,
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  revertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  revertBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
  },
  deleteBtn: {
    padding: 6,
    borderRadius: Radius.sm,
    backgroundColor: '#fee2e2',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    ...Typography.body,
    color: Colors.neutral.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.neutral.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.7,
  },
});

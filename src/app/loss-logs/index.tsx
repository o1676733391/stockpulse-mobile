import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { BadgeVariant, Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { inventoryService } from '@/services/inventoryService';
import { lossService } from '@/services/lossService';
import { recipeService, Recipe } from '@/services/recipeService';
import { InventoryItem } from '@/types/inventory';
import { CancellationReason, FoodLossLog, KitchenCancellation, LossCategory } from '@/types/loss';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LossLogsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t, formatCurrency } = useI18n();

  const [activeTab, setActiveTab] = useState<'loss' | 'cancellations'>('loss');
  const [lossLogs, setLossLogs] = useState<FoodLossLog[]>([]);
  const [cancellations, setCancellations] = useState<KitchenCancellation[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [showLossModal, setShowLossModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Loss Form State
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [lossQty, setLossQty] = useState('');
  const [lossCategory, setLossCategory] = useState<LossCategory>('cooking_dropped');
  const [lossNotes, setLossNotes] = useState('');
  const [submittingLoss, setSubmittingLoss] = useState(false);

  // Cancel Form State
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [cancelTicket, setCancelTicket] = useState('');
  const [cancelTable, setCancelTable] = useState('');
  const [cancelPortions, setCancelPortions] = useState('1');
  const [cancelReason, setCancelReason] = useState<CancellationReason>('guest_cancelled');
  const [wasPrepped, setWasPrepped] = useState(true);
  const [cancelNotes, setCancelNotes] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [logs, cancs, items, recs] = await Promise.all([
        lossService.getLossLogs(),
        lossService.getKitchenCancellations(),
        inventoryService.getItems(),
        recipeService.getRecipes(),
      ]);
      setLossLogs(logs);
      setCancellations(cancs);
      setInventoryItems(items);
      setRecipes(recs);
      if (items.length > 0 && !selectedItemId) {
        setSelectedItemId(items[0].id);
      }
      if (recs.length > 0 && !selectedRecipeId) {
        setSelectedRecipeId(recs[0].id);
      }
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedItemId, selectedRecipeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const totalLossVal = lossLogs.reduce((sum, l) => sum + l.totalLossCost, 0);
    const totalWastedCancelVal = cancellations.reduce((sum, c) => sum + c.wastedCost, 0);
    const combinedLossVal = totalLossVal + totalWastedCancelVal;
    const preppedCount = cancellations.filter((c) => c.wasPrepped).length;
    const savedCount = cancellations.filter((c) => !c.wasPrepped).length;

    return {
      combinedLossVal,
      lossCount: lossLogs.length,
      cancellationsCount: cancellations.length,
      savedCount,
      preppedCount,
    };
  }, [lossLogs, cancellations]);

  const handleCreateLossLog = async () => {
    const qty = parseFloat(lossQty);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid positive quantity.');
      return;
    }
    const item = inventoryItems.find((i) => i.id === selectedItemId);
    if (!item) {
      Alert.alert('Select Item', 'Please select an inventory item.');
      return;
    }

    try {
      setSubmittingLoss(true);
      const created = await lossService.createLossLog({
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        quantity: qty,
        unit: item.unit,
        unitCost: item.costPerUnit || 1.5,
        category: lossCategory,
        loggedBy: user?.name || 'Chef / Staff',
        notes: lossNotes.trim() || undefined,
      });

      setLossLogs((prev) => [created, ...prev]);
      setShowLossModal(false);
      setLossQty('');
      setLossNotes('');
      Alert.alert('Loss Logged', `${qty} ${item.unit} of ${item.name} deducted from physical stock.`);
    } catch {
      Alert.alert('Error', 'Unable to log loss.');
    } finally {
      setSubmittingLoss(false);
    }
  };

  const handleCreateCancellation = async () => {
    const portions = parseInt(cancelPortions, 10);
    if (isNaN(portions) || portions <= 0) {
      Alert.alert('Invalid Portions', 'Please enter number of portions.');
      return;
    }
    const recipe = recipes.find((r) => r.id === selectedRecipeId);
    if (!recipe) {
      Alert.alert('Select Recipe', 'Please select a dish/recipe.');
      return;
    }

    try {
      setSubmittingCancel(true);
      const created = await lossService.createKitchenCancellation({
        ticketNumber: cancelTicket.trim() || `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
        tableNumber: cancelTable.trim() || undefined,
        recipeId: recipe.id,
        recipeName: recipe.name,
        portions,
        reason: cancelReason,
        wasPrepped,
        unitCost: recipe.costPerPortion || 3.5,
        cancelledBy: user?.name || 'Kitchen Staff',
        notes: cancelNotes.trim() || undefined,
      });

      setCancellations((prev) => [created, ...prev]);
      setShowCancelModal(false);
      setCancelTicket('');
      setCancelTable('');
      setCancelPortions('1');
      setCancelNotes('');
      Alert.alert(
        'Cancellation Recorded',
        wasPrepped
          ? `Dish voided. Logged as kitchen waste loss (€${created.wastedCost.toFixed(2)}).`
          : 'Dish voided before preparation. Ingredients saved!'
      );
    } catch {
      Alert.alert('Error', 'Unable to record cancellation.');
    } finally {
      setSubmittingCancel(false);
    }
  };

  const getLossCategoryBadge = (cat: LossCategory): { label: string; variant: BadgeVariant } => {
    switch (cat) {
      case 'spoilage_expired':
        return { label: 'Expired / Spoilage', variant: 'red' };
      case 'cooking_dropped':
        return { label: 'Dropped / Overdone', variant: 'amber' };
      case 'prep_trimming':
        return { label: 'Prep Trimming Loss', variant: 'blue' };
      case 'temperature_break':
        return { label: 'Temp Spike', variant: 'red' };
      default:
        return { label: cat, variant: 'gray' };
    }
  };

  const getCancellationReasonBadge = (reason: CancellationReason): { label: string; variant: BadgeVariant } => {
    switch (reason) {
      case 'guest_cancelled':
        return { label: 'Guest Cancelled', variant: 'amber' };
      case 'kitchen_delay':
        return { label: 'Kitchen Delay', variant: 'red' };
      case 'wrong_order':
        return { label: 'Wrong Ticket Rung', variant: 'blue' };
      case 'quality_issue':
        return { label: 'Quality / Re-fire', variant: 'red' };
      default:
        return { label: reason, variant: 'gray' };
    }
  };

  const handleExportCsv = async () => {
    try {
      if (activeTab === 'loss') {
        const headers = [
          'waste_log_id',
          'timestamp',
          'item_name',
          'quantity',
          'unit',
          'category',
          'unit_cost_eur',
          'total_loss_eur',
          'notes',
        ];
        const rows = lossLogs.map((l) => [
          l.id,
          l.timestamp,
          `"${(l.itemName || '').replace(/"/g, '""')}"`,
          l.quantity.toFixed(2),
          l.unit,
          l.category,
          l.unitCost.toFixed(2),
          l.totalLossCost.toFixed(2),
          `"${(l.notes || '').replace(/"/g, '""')}"`,
        ]);
        const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        await Share.share({
          message: csvContent,
          title: 'Export Food Loss & Spoilage CSV',
        });
      } else {
        const headers = [
          'cancellation_id',
          'ticket_number',
          'table_or_location',
          'dish_name',
          'portions_cancelled',
          'reason',
          'was_prepped_cooked',
          'wasted_cost_eur',
          'outcome_status',
          'timestamp',
          'notes',
        ];
        const rows = cancellations.map((c) => [
          c.id,
          c.ticketNumber,
          c.tableNumber || 'N/A',
          `"${(c.recipeName || '').replace(/"/g, '""')}"`,
          c.portions,
          c.reason,
          c.wasPrepped ? 'true' : 'false',
          c.wastedCost.toFixed(2),
          c.wasPrepped ? 'Prepped & Discarded' : 'Voided Before Cooking (Saved)',
          c.timestamp,
          `"${(c.notes || '').replace(/"/g, '""')}"`,
        ]);
        const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        await Share.share({
          message: csvContent,
          title: 'Export Kitchen Cancellations & Voids CSV',
        });
      }
    } catch {
      // share dismissal
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar
        title="Loss & Cancellations"
        subtitle="Kitchen spoilage, waste & voided tickets"
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
              onPress={() => (activeTab === 'loss' ? setShowLossModal(true) : setShowCancelModal(true))}
              style={({ pressed }) => [styles.newBtn, pressed && styles.pressed]}
            >
              <VectorIcon name="Plus" size={14} color="#ffffff" strokeWidth={2.5} />
              <Text style={styles.newBtnText}>{activeTab === 'loss' ? 'Log Loss' : 'Void Dish'}</Text>
            </Pressable>
          </View>
        }
      />

      {/* Tabs Navigator */}
      <View style={styles.tabBar}>
        <Pressable
          onPress={() => setActiveTab('loss')}
          style={[styles.tabItem, activeTab === 'loss' && styles.tabItemActive]}
        >
          <VectorIcon
            name="Trash2"
            size={14}
            color={activeTab === 'loss' ? Colors.brand.primary : Colors.neutral.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'loss' && styles.tabTextActive]}>
            Food Loss & Spoilage ({metrics.lossCount})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('cancellations')}
          style={[styles.tabItem, activeTab === 'cancellations' && styles.tabItemActive]}
        >
          <VectorIcon
            name="XCircle"
            size={14}
            color={activeTab === 'cancellations' ? Colors.brand.primary : Colors.neutral.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'cancellations' && styles.tabTextActive]}>
            Kitchen Voids ({metrics.cancellationsCount})
          </Text>
        </Pressable>
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
        <View style={styles.metricsRow}>
          <Card style={styles.metricCard}>
            <Text style={[styles.metricNum, { color: Colors.critical.main }]}>
              {loading ? '--' : formatCurrency(metrics.combinedLossVal)}
            </Text>
            <Text style={styles.metricLabel}>Total Waste Cost</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricNum}>
              {loading ? '--' : metrics.lossCount}
            </Text>
            <Text style={styles.metricLabel}>Loss Logs</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={[styles.metricNum, { color: Colors.brand.primary }]}>
              {loading ? '--' : metrics.savedCount}
            </Text>
            <Text style={styles.metricLabel}>Saved Voids</Text>
          </Card>
        </View>

        {/* Quick Intake Banner */}
        <Pressable
          onPress={() => (activeTab === 'loss' ? setShowLossModal(true) : setShowCancelModal(true))}
          style={styles.intakeBanner}
        >
          <View style={styles.intakeIconBox}>
            <VectorIcon
              name={activeTab === 'loss' ? 'PlusCircle' : 'MinusCircle'}
              size={20}
              color={Colors.brand.primary}
            />
          </View>
          <View style={styles.intakeInfo}>
            <Text style={styles.intakeTitle}>
              {activeTab === 'loss' ? '+ Log Spoilage, Drops or Trimming' : '+ Void / Cancel Kitchen Dish'}
            </Text>
            <Text style={styles.intakeSubtitle}>
              {activeTab === 'loss'
                ? 'Deduct expired or damaged stock with instant loss calculation'
                : 'Track cancelled tickets and control food waste'}
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

        {/* ── TAB 1: Food Loss & Spoilage List ── */}
        {activeTab === 'loss' && (
          <View style={styles.listSection}>
            {lossLogs.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <VectorIcon name="CheckCircle2" size={32} color={Colors.brand.primary} />
                <Text style={styles.emptyTitle}>Zero Food Losses Logged</Text>
                <Text style={styles.emptySub}>Great work! Kitchen stock is running without waste.</Text>
              </View>
            )}

            {lossLogs.map((log) => {
              const catBadge = getLossCategoryBadge(log.category);
              return (
                <Card key={log.id} style={styles.logCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Text style={styles.itemName}>{log.itemName}</Text>
                      <Text style={styles.itemSku}>SKU: {log.sku}</Text>
                    </View>
                    <Badge variant={catBadge.variant}>{catBadge.label}</Badge>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.lossAmount}>
                      {log.quantity} {log.unit} discarded
                    </Text>
                    <Text style={styles.lossCost}>
                      -{formatCurrency(log.totalLossCost)}
                    </Text>
                  </View>

                  {log.notes && <Text style={styles.notesText}>Note: {log.notes}</Text>}

                  <View style={styles.footerRow}>
                    <Text style={styles.footerStaff}>Logged by: {log.loggedBy}</Text>
                    <Text style={styles.footerTime}>{log.timestamp}</Text>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* ── TAB 2: Kitchen Cancellations List ── */}
        {activeTab === 'cancellations' && (
          <View style={styles.listSection}>
            {cancellations.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <VectorIcon name="CheckCircle2" size={32} color={Colors.brand.primary} />
                <Text style={styles.emptyTitle}>No Kitchen Cancellations</Text>
                <Text style={styles.emptySub}>No tickets voided today.</Text>
              </View>
            )}

            {cancellations.map((canc) => {
              const reasonBadge = getCancellationReasonBadge(canc.reason);
              return (
                <Card key={canc.id} style={styles.logCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Text style={styles.itemName}>
                        {canc.portions}× {canc.recipeName}
                      </Text>
                      <Text style={styles.itemSku}>
                        {canc.ticketNumber} {canc.tableNumber ? `· ${canc.tableNumber}` : ''}
                      </Text>
                    </View>
                    <Badge variant={reasonBadge.variant}>{reasonBadge.label}</Badge>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.preppedPill}>
                      <VectorIcon
                        name={canc.wasPrepped ? 'Flame' : 'ShieldCheck'}
                        size={12}
                        color={canc.wasPrepped ? Colors.critical.main : Colors.brand.primary}
                      />
                      <Text
                        style={[
                          styles.preppedPillText,
                          { color: canc.wasPrepped ? Colors.critical.main : Colors.brand.primary },
                        ]}
                      >
                        {canc.wasPrepped ? 'Prepped & Discarded' : 'Voided Before Cooking (Saved)'}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.lossCost,
                        { color: canc.wasPrepped ? Colors.critical.main : Colors.brand.primary },
                      ]}
                    >
                      {canc.wasPrepped ? `-${formatCurrency(canc.wastedCost)}` : '€0.00 (Saved)'}
                    </Text>
                  </View>

                  {canc.notes && <Text style={styles.notesText}>Note: {canc.notes}</Text>}

                  <View style={styles.footerRow}>
                    <Text style={styles.footerStaff}>Staff: {canc.cancelledBy}</Text>
                    <Text style={styles.footerTime}>{canc.timestamp}</Text>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── MODAL 1: Log Food Loss ── */}
      <Modal
        visible={showLossModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLossModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Spoilage / Food Loss</Text>
              <Pressable onPress={() => setShowLossModal(false)} hitSlop={12}>
                <VectorIcon name="X" size={20} color={Colors.neutral.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Select ingredient to discard and deduct from kitchen stock.
            </Text>

            <Text style={styles.inputLabel}>Ingredient</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
              {inventoryItems.slice(0, 8).map((it) => (
                <Pressable
                  key={it.id}
                  onPress={() => setSelectedItemId(it.id)}
                  style={[
                    styles.chip,
                    selectedItemId === it.id && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedItemId === it.id && styles.chipTextActive,
                    ]}
                  >
                    {it.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Quantity Discarded</Text>
            <TextInput
              style={styles.inputField}
              placeholder="e.g. 0.5"
              placeholderTextColor={Colors.neutral.textTertiary}
              keyboardType="decimal-pad"
              value={lossQty}
              onChangeText={setLossQty}
            />

            <Text style={styles.inputLabel}>Loss Reason / Category</Text>
            <View style={styles.reasonRow}>
              {(['cooking_dropped', 'spoilage_expired', 'prep_trimming'] as LossCategory[]).map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setLossCategory(cat)}
                  style={[
                    styles.reasonChip,
                    lossCategory === cat && styles.reasonChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.reasonChipText,
                      lossCategory === cat && styles.reasonChipTextActive,
                    ]}
                  >
                    {cat === 'cooking_dropped'
                      ? 'Dropped/Burn'
                      : cat === 'spoilage_expired'
                      ? 'Expired BBD'
                      : 'Trimming'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.inputLabel}>Kitchen Notes (Optional)</Text>
            <TextInput
              style={[styles.inputField, styles.textAreaField]}
              placeholder="e.g. Dropped during lunch rush"
              placeholderTextColor={Colors.neutral.textTertiary}
              value={lossNotes}
              onChangeText={setLossNotes}
            />

            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="outline"
                onPress={() => setShowLossModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                label={submittingLoss ? 'Saving...' : 'Deduct Stock'}
                variant="primary"
                onPress={handleCreateLossLog}
                disabled={submittingLoss}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 2: Cancel / Void Dish ── */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Void / Cancel Dish</Text>
              <Pressable onPress={() => setShowCancelModal(false)} hitSlop={12}>
                <VectorIcon name="X" size={20} color={Colors.neutral.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Record a voided kitchen order and track ingredient impact.
            </Text>

            <Text style={styles.inputLabel}>Menu Dish</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
              {recipes.slice(0, 6).map((rec) => (
                <Pressable
                  key={rec.id}
                  onPress={() => setSelectedRecipeId(rec.id)}
                  style={[
                    styles.chip,
                    selectedRecipeId === rec.id && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedRecipeId === rec.id && styles.chipTextActive,
                    ]}
                  >
                    {rec.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.formInlineRow}>
              <View style={{ flex: 1, marginRight: Spacing.sm }}>
                <Text style={styles.inputLabel}>Ticket / Table #</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="e.g. Table 12"
                  placeholderTextColor={Colors.neutral.textTertiary}
                  value={cancelTable}
                  onChangeText={setCancelTable}
                />
              </View>

              <View style={{ width: 100 }}>
                <Text style={styles.inputLabel}>Portions</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="1"
                  placeholderTextColor={Colors.neutral.textTertiary}
                  keyboardType="number-pad"
                  value={cancelPortions}
                  onChangeText={setCancelPortions}
                />
              </View>
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Already cooked in kitchen?</Text>
                <Text style={styles.toggleSub}>
                  {wasPrepped
                    ? 'Yes -> Ingredients wasted, loss cost logged.'
                    : 'No -> Voided before firing. Zero food waste!'}
                </Text>
              </View>
              <Switch
                value={wasPrepped}
                onValueChange={setWasPrepped}
                trackColor={{ false: '#cbd5e1', true: Colors.critical.main }}
              />
            </View>

            <Text style={styles.inputLabel}>Cancellation Reason</Text>
            <View style={styles.reasonRow}>
              {(['guest_cancelled', 'wrong_order', 'kitchen_delay'] as CancellationReason[]).map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setCancelReason(r)}
                  style={[
                    styles.reasonChip,
                    cancelReason === r && styles.reasonChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.reasonChipText,
                      cancelReason === r && styles.reasonChipTextActive,
                    ]}
                  >
                    {r === 'guest_cancelled'
                      ? 'Guest Cancel'
                      : r === 'wrong_order'
                      ? 'Wrong Order'
                      : 'Delay'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.inputLabel}>Kitchen Notes (Optional)</Text>
            <TextInput
              style={[styles.inputField, styles.textAreaField]}
              placeholder="e.g. Guest had urgent call and left after plate was fired"
              placeholderTextColor={Colors.neutral.textTertiary}
              value={cancelNotes}
              onChangeText={setCancelNotes}
            />

            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="outline"
                onPress={() => setShowCancelModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                label={submittingCancel ? 'Saving...' : 'Confirm Void'}
                variant="primary"
                onPress={handleCreateCancellation}
                disabled={submittingCancel}
                style={{ flex: 1 }}
              />
            </View>
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
  exportBtn: {
    height: 30,
    width: 30,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    gap: 4,
  },
  newBtnText: {
    ...Typography.labelSmall,
    color: '#ffffff',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
    backgroundColor: Colors.neutral.card,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.brand.primary,
  },
  tabText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  tabTextActive: {
    color: Colors.brand.primary,
    fontWeight: '800',
  },
  content: {
    padding: Spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metricCard: {
    flex: 1,
    padding: Spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.neutral.card,
  },
  metricNum: {
    ...Typography.titleLarge,
    fontWeight: '800',
    color: Colors.neutral.textPrimary,
  },
  metricLabel: {
    ...Typography.labelSmall,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  intakeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.subtle,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  intakeIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  intakeInfo: {
    flex: 1,
  },
  intakeTitle: {
    ...Typography.bodyMedium,
    fontWeight: '800',
    color: Colors.brand.dark,
  },
  intakeSubtitle: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    marginTop: 1,
  },
  loadingBox: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    marginTop: Spacing.sm,
  },
  listSection: {
    gap: Spacing.sm,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral.card,
    borderRadius: Radius.lg,
    gap: Spacing.xs,
  },
  emptyTitle: {
    ...Typography.titleMedium,
    fontWeight: '800',
    color: Colors.neutral.textPrimary,
    marginTop: Spacing.sm,
  },
  emptySub: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    textAlign: 'center',
  },
  logCard: {
    padding: Spacing.md,
    backgroundColor: Colors.neutral.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  itemName: {
    ...Typography.bodyMedium,
    fontWeight: '800',
    color: Colors.neutral.textPrimary,
  },
  itemSku: {
    ...Typography.labelSmall,
    color: Colors.neutral.textTertiary,
    marginTop: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  lossAmount: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    fontWeight: '600',
  },
  lossCost: {
    ...Typography.bodyMedium,
    fontWeight: '800',
    color: Colors.critical.main,
  },
  preppedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  preppedPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  notesText: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
    paddingTop: Spacing.xs,
    marginTop: Spacing.xs,
  },
  footerStaff: {
    ...Typography.labelSmall,
    color: Colors.neutral.textTertiary,
  },
  footerTime: {
    ...Typography.labelSmall,
    color: Colors.neutral.textTertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.neutral.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadows.elevated,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    ...Typography.titleLarge,
    fontWeight: '800',
    color: Colors.neutral.textPrimary,
  },
  modalSubtitle: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.labelMedium,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    marginBottom: 4,
  },
  inputField: {
    backgroundColor: Colors.neutral.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    color: Colors.neutral.textPrimary,
    marginBottom: Spacing.md,
  },
  textAreaField: {
    height: 60,
    textAlignVertical: 'top',
  },
  horizontalChips: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: Colors.brand.primary,
  },
  chipText: {
    ...Typography.labelSmall,
    color: Colors.neutral.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  reasonRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.md,
  },
  reasonChip: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    backgroundColor: Colors.neutral.surface,
  },
  reasonChipActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.subtle,
  },
  reasonChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  reasonChipTextActive: {
    color: Colors.brand.dark,
    fontWeight: '800',
  },
  formInlineRow: {
    flexDirection: 'row',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  toggleTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  toggleSub: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
});

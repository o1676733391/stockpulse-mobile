import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { Recipe, recipeService } from '@/services/recipeService';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RecipeDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, formatCurrency, formatNumber, language } = useI18n();
  const isDe = language === 'de';

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Deduction Modal State
  const [showDeductModal, setShowDeductModal] = useState(false);
  const [portionsToDeduct, setPortionsToDeduct] = useState('1');
  const [deducting, setDeducting] = useState(false);

  const loadRecipe = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await recipeService.getRecipeById(id);
      if (data) {
        setRecipe(data);
      } else {
        setErrorMsg(t('recipes.recipeNotFound'));
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadRecipe();
    }, [loadRecipe])
  );

  const handleDelete = () => {
    if (!recipe) return;
    Alert.alert(
      t('recipes.deleteConfirmTitle', { defaultValue: 'Delete Recipe' }),
      t('recipes.deleteConfirmMessage', {
        name: recipe.name,
        defaultValue: `Are you sure you want to delete '${recipe.name}'?`,
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await recipeService.deleteRecipe(recipe.id);
              router.back();
            } catch (err: any) {
              Alert.alert('Delete Failed', err?.message || 'Unable to delete recipe');
            }
          },
        },
      ]
    );
  };

  const handleExecuteDeduction = async () => {
    if (!recipe) return;
    const qty = parseFloat(portionsToDeduct);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid number of portions to deduct.');
      return;
    }

    try {
      setDeducting(true);
      const result = await recipeService.deductRecipe(
        recipe.id,
        qty,
        'pos_sale',
        `Manual BOM deduction for ${qty} portions`
      );

      setShowDeductModal(false);
      Alert.alert(
        'Deduction Successful',
        t('recipes.deductSuccess', {
          portions: qty,
          defaultValue: `Successfully deducted raw materials for ${qty} portions.`,
        })
      );
      // Reload recipe to reflect updated available stock
      loadRecipe();
    } catch (err: any) {
      Alert.alert('Deduction Error', err?.message || 'Unable to execute BOM deduction');
    } finally {
      setDeducting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
        <TopBar title={t('common.loading')} showBack />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={Colors.brand.primary} />
          <Text style={styles.centerText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  if (errorMsg || !recipe) {
    return (
      <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
        <TopBar title={t('common.error')} showBack />
        <View style={styles.centerContainer}>
          <VectorIcon name="AlertCircle" size={40} color={Colors.critical.main} />
          <Text style={styles.errorText}>{errorMsg || t('recipes.recipeNotFound')}</Text>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar
        title={recipe.name}
        subtitle={`${recipe.category || 'Recipe'} · #${recipe.code || 'BOM'}`}
        showBack
        right={
          <Pressable
            onPress={() => router.push(`/recipes/edit?id=${recipe.id}` as any)}
            style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
            hitSlop={8}
          >
            <VectorIcon name="Pencil" size={18} color={Colors.neutral.textPrimary} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. KPI Summary Cards ── */}
        <View style={styles.kpiRow}>
          <Card style={styles.kpiCard}>
            <Text style={styles.kpiValue}>
              {formatCurrency(recipe.costPerPortion || 0)}
            </Text>
            <Text style={styles.kpiLabel}>{t('recipes.costPerServing')}</Text>
          </Card>

          <Card style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: Colors.neutral.textPrimary }]}>
              {recipe.ingredients.length}
            </Text>
            <Text style={styles.kpiLabel}>
              {recipe.ingredients.length === 1 ? t('recipes.ingredientOne') : t('recipes.ingredientOther')}
            </Text>
          </Card>

          <Card style={styles.kpiCard}>
            <View style={{ marginTop: 2, marginBottom: 4 }}>
              <Badge variant={recipe.isActive ? 'green' : 'gray'}>
                {recipe.isActive ? t('common.active') : t('common.inactive')}
              </Badge>
            </View>
            <Text style={styles.kpiLabel}>{t('common.status')}</Text>
          </Card>
        </View>

        {/* ── 2. Recipe Metadata Info ── */}
        <Card style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{t('recipes.portionYield')}:</Text>
            <Text style={styles.metaValue}>
              {recipe.portionYield || 1} {t('recipes.portions')}
            </Text>
          </View>
          {recipe.posItemName ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t('recipes.posItemName')}:</Text>
              <Text style={styles.metaValue}>{recipe.posItemName}</Text>
            </View>
          ) : null}
        </Card>

        {/* ── 3. Ingredients & Inventory Quantities List (BOM) ── */}
        <Card style={styles.ingredientsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('recipes.ingredientsBom')}</Text>
            <Text style={styles.sectionSub}>
              {t('recipes.howBomWorksDesc')}
            </Text>
          </View>

          {recipe.ingredients.map((ing, index) => {
            const stock = ing.availableStock ?? 0;
            const isOutOfStock = stock <= 0;
            const isLowStock = stock > 0 && stock <= 2;

            return (
              <View
                key={ing.id || index}
                style={[
                  styles.ingredientRow,
                  index === recipe.ingredients.length - 1 && styles.noBorder,
                ]}
              >
                <View style={styles.ingredientIconBox}>
                  <Text style={styles.ingredientIconText}>
                    {(ing.itemName || 'I')[0].toUpperCase()}
                  </Text>
                </View>

                <View style={styles.ingredientDetails}>
                  <Text style={styles.ingredientName}>{ing.itemName}</Text>
                  <View style={styles.ingredientSubRow}>
                    <Text style={styles.ingredientSku}>
                      {t('inventory.sku', { sku: ing.itemSku || 'N/A' })}
                    </Text>
                    {ing.wastePercentage ? (
                      <Text style={styles.wasteText}>
                        · {ing.wastePercentage}% {t('recipes.wastePercentage')}
                      </Text>
                    ) : null}
                  </View>

                  {/* Available Stock Indicator Badge */}
                  <View style={styles.stockBadgeContainer}>
                    {isOutOfStock ? (
                      <View style={styles.outOfStockPill}>
                        <VectorIcon name="AlertCircle" size={12} color={Colors.critical.main} />
                        <Text style={styles.outOfStockText}>
                          {t('recipes.outOfStock', { unit: ing.unit })}
                        </Text>
                      </View>
                    ) : isLowStock ? (
                      <View style={styles.lowStockPill}>
                        <VectorIcon name="AlertTriangle" size={12} color={Colors.warning.dark} />
                        <Text style={styles.lowStockText}>
                          {t('recipes.lowStock', { qty: formatNumber(stock), unit: ing.unit })}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.inStockPill}>
                        <VectorIcon name="CheckCircle" size={12} color={Colors.brand.primary} />
                        <Text style={styles.inStockText}>
                          {t('recipes.inStock', { qty: formatNumber(stock), unit: ing.unit })}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Recipe Quantity & Cost */}
                <View style={styles.ingredientQtyBox}>
                  <Text style={styles.qtyText}>
                    {ing.quantity} {ing.unit}
                  </Text>
                  <Text style={styles.qtySubText}>{t('recipes.perServing')}</Text>
                  {ing.lineCost ? (
                    <Text style={styles.costText}>{formatCurrency(ing.lineCost)}</Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </Card>

        {/* ── 4. How BOM Deductions Work Educational Box ── */}
        <View style={styles.eduBox}>
          <View style={styles.eduHeader}>
            <VectorIcon name="Info" size={16} color="#1d4ed8" />
            <Text style={styles.eduTitle}>{t('recipes.howBomWorksTitle')}</Text>
          </View>
          <Text style={styles.eduBody}>
            {t('recipes.howBomDeductionsExplanation', { name: recipe.name })}
          </Text>
        </View>

        {/* ── 5. Action Buttons ── */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => setShowDeductModal(true)}
            style={({ pressed }) => [styles.primaryActionBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="TrendingDown" size={18} color="#ffffff" />
            <Text style={styles.primaryActionText}>{t('recipes.executeDeduction')}</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push(`/recipes/edit?id=${recipe.id}` as any)}
            style={({ pressed }) => [styles.secondaryActionBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="Pencil" size={18} color={Colors.neutral.textPrimary} />
            <Text style={styles.secondaryActionText}>{t('common.edit')}</Text>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.dangerActionBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="Trash2" size={18} color={Colors.critical.main} />
            <Text style={styles.dangerActionText}>{t('common.delete')}</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* ── BOM Deduction Execution Modal ── */}
      <Modal
        visible={showDeductModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeductModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBox}>
                <VectorIcon name="TrendingDown" size={22} color={Colors.brand.primary} />
              </View>
              <Text style={styles.modalTitle}>{t('recipes.deductModalTitle')}</Text>
              <Text style={styles.modalSubtitle}>{t('recipes.deductModalDesc')}</Text>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>{t('recipes.deductPortions')}</Text>
              <TextInput
                style={styles.portionsInput}
                keyboardType="numeric"
                value={portionsToDeduct}
                onChangeText={setPortionsToDeduct}
                placeholder="1"
              />
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setShowDeductModal(false)}
                style={styles.cancelModalBtn}
                disabled={deducting}
              >
                <Text style={styles.cancelModalText}>{t('common.cancel')}</Text>
              </Pressable>

              <Pressable
                onPress={handleExecuteDeduction}
                style={[styles.confirmModalBtn, deducting && styles.btnDisabled]}
                disabled={deducting}
              >
                {deducting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.confirmModalText}>{t('recipes.executeDeduction')}</Text>
                )}
              </Pressable>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.xl,
  },
  centerText: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
  },
  errorText: {
    ...Typography.sectionHeader,
    color: Colors.critical.dark,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  kpiCard: {
    flex: 1,
    padding: Spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    ...Typography.monoValue,
    fontSize: 16,
    color: Colors.brand.dark,
    fontWeight: '700',
  },
  kpiLabel: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    marginTop: 2,
    textAlign: 'center',
  },
  metaCard: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  ingredientsCard: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sectionHeader: {
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.cardTitle,
    fontSize: 14,
    color: Colors.neutral.textPrimary,
  },
  sectionSub: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    marginTop: 1,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
    gap: Spacing.sm,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  ingredientIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  ingredientIconText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  ingredientDetails: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  ingredientSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  ingredientSku: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
  },
  wasteText: {
    fontSize: 11,
    color: Colors.warning.dark,
  },
  stockBadgeContainer: {
    marginTop: 4,
  },
  inStockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brand.subtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  inStockText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.brand.primary,
  },
  lowStockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warning.subtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  lowStockText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.warning.dark,
  },
  outOfStockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.critical.subtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  outOfStockText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.critical.main,
  },
  ingredientQtyBox: {
    alignItems: 'flex-end',
  },
  qtyText: {
    ...Typography.monoValue,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  qtySubText: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
  },
  costText: {
    fontSize: 11,
    color: Colors.brand.dark,
    fontWeight: '600',
    marginTop: 2,
  },
  eduBox: {
    backgroundColor: '#eff6ff',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: Spacing.md,
    gap: 6,
  },
  eduHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eduTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  eduBody: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 17,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  primaryActionBtn: {
    flex: 1.5,
    flexDirection: 'row',
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadows.card,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.neutral.card,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadows.card,
  },
  secondaryActionText: {
    color: Colors.neutral.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  dangerActionBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.critical.subtle,
    borderColor: Colors.critical.light,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadows.card,
  },
  dangerActionText: {
    color: Colors.critical.main,
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.neutral.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.modal,
  },
  modalHeader: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  modalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    ...Typography.sectionHeader,
    fontSize: 16,
    color: Colors.neutral.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    textAlign: 'center',
  },
  inputSection: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  portionsInput: {
    backgroundColor: Colors.neutral.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  confirmModalBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmModalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.8,
  },
});

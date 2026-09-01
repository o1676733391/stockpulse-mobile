import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { expirationService, INITIAL_SUGGESTIONS } from '@/services/expirationService';
import { Recipe, recipeService } from '@/services/recipeService';
import { WasteSuggestion } from '@/types/expiration';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function daysLabel(days: number) {
  if (days < 0) return 'Expired';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days}d left`;
}

export default function WasteReductionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { suggestionId } = useLocalSearchParams<{ suggestionId?: string }>();

  const highlightId = suggestionId !== undefined ? parseInt(suggestionId, 10) : undefined;

  const [suggestions, setSuggestions] = useState<WasteSuggestion[]>(() =>
    JSON.parse(JSON.stringify(INITIAL_SUGGESTIONS))
  );
  const [usedIds, setUsedIds] = useState<Set<number>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  React.useEffect(() => {
    expirationService
      .getWasteSuggestions()
      .then((res) => {
        if (res && res.length > 0) {
          setSuggestions(res);
        }
      })
      .catch(() => {});
  }, []);

  const visibleSuggestions = suggestions.filter((s) => !dismissedIds.has(s.id));

  const handleUseSuggestion = (id: number) => {
    setUsedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    expirationService.actionSuggestion(id).catch((err) => {
      console.warn('Failed to action suggestion:', err);
    });
  };

  const handleDismissSuggestion = (id: number) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    expirationService.dismissSuggestion(id).catch((err) => {
      console.warn('Failed to dismiss suggestion:', err);
    });
  };

  const handleViewRecipe = async (recipeId: string, item: string, promo: string) => {
    setLoadingRecipe(true);
    setIsModalVisible(true);
    try {
      if (recipeId) {
        const recipe = await recipeService.getRecipeById(recipeId);
        if (recipe) {
          setSelectedRecipe(recipe);
          return;
        }
      }
    } catch (err) {
      console.log('Could not load recipe from server, using local fallback:', err);
    } finally {
      setLoadingRecipe(false);
    }

    // Fallback to our custom detailed mock recipes
    const fallbackRecipes: Record<string, any> = {
      r3: {
        id: 'r3',
        code: 'REC-SLM-ASP',
        name: 'Pan-seared Salmon with Asparagus',
        category: 'Fish & Seafood',
        portionYield: 4,
        posItemName: 'Pan-seared Salmon with Asparagus',
        isActive: true,
        costPerPortion: 17.50,
        ingredients: [
          { id: 'ri1', itemName: 'Fresh Salmon', quantity: 4.0, unit: 'kg', wastePercentage: 5, costPerUnit: 16.20, lineCost: 68.04 },
          { id: 'ri2', itemName: 'Asparagus', quantity: 1.5, unit: 'kg', wastePercentage: 10, costPerUnit: 4.50, lineCost: 7.43 },
          { id: 'ri3', itemName: 'Salt & Pepper Butter', quantity: 0.2, unit: 'kg', wastePercentage: 0, costPerUnit: 8.00, lineCost: 1.60 },
        ],
      },
      r4: {
        id: 'r4',
        code: 'REC-CSR-SLD',
        name: 'Caesar Salad Bowl',
        category: 'Salads',
        portionYield: 6,
        posItemName: 'Caesar Salad Bowl',
        isActive: true,
        costPerPortion: 3.20,
        ingredients: [
          { id: 'ri4', itemName: 'Romaine Lettuce', quantity: 3.0, unit: 'kg', wastePercentage: 12, costPerUnit: 2.20, lineCost: 7.39 },
          { id: 'ri5', itemName: 'Caesar Dressing', quantity: 0.5, unit: 'L', wastePercentage: 2, costPerUnit: 5.00, lineCost: 2.55 },
          { id: 'ri6', itemName: 'Croutons', quantity: 0.3, unit: 'kg', wastePercentage: 5, costPerUnit: 3.50, lineCost: 1.10 },
          { id: 'ri7', itemName: 'Parmesan Cheese', quantity: 0.2, unit: 'kg', wastePercentage: 1, costPerUnit: 12.00, lineCost: 2.42 },
        ],
      },
      r2: {
        id: 'r2',
        code: 'REC-BOL-BTC',
        name: 'Bolognese Sauce Batch',
        category: 'Sauces',
        portionYield: 24,
        posItemName: 'Bolognese Sauce Batch',
        isActive: true,
        costPerPortion: 4.85,
        ingredients: [
          { id: 'ri8', itemName: 'Ground Beef', quantity: 18.0, unit: 'kg', wastePercentage: 2, costPerUnit: 6.20, lineCost: 113.83 },
          { id: 'ri9', itemName: 'Canned Tomatoes', quantity: 10.0, unit: 'kg', wastePercentage: 0, costPerUnit: 1.50, lineCost: 15.00 },
          { id: 'ri10', itemName: 'Onions', quantity: 2.0, unit: 'kg', wastePercentage: 10, costPerUnit: 1.10, lineCost: 2.42 },
          { id: 'ri11', itemName: 'Carrots', quantity: 1.5, unit: 'kg', wastePercentage: 10, costPerUnit: 1.20, lineCost: 1.98 },
          { id: 'ri12', itemName: 'Red Wine', quantity: 1.0, unit: 'L', wastePercentage: 0, costPerUnit: 5.50, lineCost: 5.50 },
        ],
      },
    };

    const fallback = fallbackRecipes[recipeId] || {
      id: recipeId || 'unknown',
      code: 'REC-GENERIC',
      name: promo || 'Custom Recipe',
      category: 'General',
      portionYield: 1,
      posItemName: promo || 'Custom Recipe',
      isActive: true,
      costPerPortion: 0,
      ingredients: [
        { id: 'ri-gen', itemName: item || 'Ingredient', quantity: 1, unit: 'units', wastePercentage: 0, costPerUnit: 0, lineCost: 0 }
      ],
    };

    setSelectedRecipe(fallback as any);
  };

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar title={t('expiration.wasteReductionTitle')} showBack />

      {/* ── Header Explainer Banner ── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTitleRow}>
          <VectorIcon name="Lightbulb" size={18} color={Colors.brand.primary} />
          <Text style={styles.headerTitleText}>Save inventory before it expires</Text>
        </View>
        <Text style={styles.headerSubText}>
          System-generated suggestions based on current stock and recipe mappings. Actual results may vary.
        </Text>
      </View>

      {/* ── Scrollable Body ── */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {visibleSuggestions.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <VectorIcon name="Check" size={26} color={Colors.brand.primary} />
            </View>
            <Text style={styles.emptyTitle}>All suggestions actioned</Text>
            <Text style={styles.emptySub}>
              You have reviewed and processed all active smart waste reduction recommendations.
            </Text>
          </View>
        ) : (
          visibleSuggestions.map((s) => {
            const isHighlighted = highlightId === s.id;
            const isUsed = usedIds.has(s.id);
            const isCritical = s.days <= 1;
            const urgencyColor = isCritical
              ? Colors.critical.main
              : s.days <= 3
              ? Colors.warning.main
              : Colors.neutral.textTertiary;

            return (
              <Card
                key={s.id}
                urgencyColor={urgencyColor}
                style={[
                  styles.suggestionCard,
                  isHighlighted && styles.highlightedCard,
                  isUsed && styles.usedCard,
                ]}
              >
                {/* Expiring Item Header Bar */}
                <View style={styles.itemHeaderBar}>
                  <VectorIcon
                    name="AlertTriangle"
                    size={14}
                    color={isCritical ? Colors.critical.main : Colors.warning.dark}
                  />
                  <View style={styles.itemHeaderInfo}>
                    <Text
                      style={[
                        styles.itemHeaderText,
                        isCritical ? { color: Colors.critical.dark } : { color: Colors.warning.dark },
                      ]}
                    >
                      {s.item} · {s.qty} {s.unit}
                    </Text>
                    <Text style={styles.itemHeaderSub}>
                      {s.days === 1 ? 'Expires tomorrow' : `Expires in ${s.days} days`}
                    </Text>
                  </View>
                  <Badge variant={isCritical ? 'red' : 'amber'}>
                    {daysLabel(s.days)}
                  </Badge>
                </View>

                {/* Suggested Promotion Details */}
                <View style={styles.promoDetails}>
                  <View style={styles.promoSnippetHeader}>
                    <VectorIcon name="Lightbulb" size={13} color={Colors.brand.primary} />
                    <Text style={styles.promoSnippetTag}>Suggested Promotion</Text>
                  </View>

                  <Text style={styles.promoName}>{s.promo}</Text>
                  <Text style={styles.promoDesc}>{s.description}</Text>

                  {/* 3-Box Stats Grid */}
                  <View style={styles.statsGrid}>
                    <View style={styles.statBoxSlate}>
                      <Text style={styles.statLabelSlate}>Uses</Text>
                      <Text style={styles.statNumSlate}>{s.uses}</Text>
                    </View>
                    <View style={styles.statBoxGreen}>
                      <Text style={styles.statLabelGreen}>Utilization</Text>
                      <Text style={styles.statNumGreen}>{s.utilization}%</Text>
                    </View>
                    <View style={styles.statBoxGreen}>
                      <Text style={styles.statLabelGreen}>Est. Saved</Text>
                      <Text style={styles.statNumGreen}>{s.saved}</Text>
                    </View>
                  </View>

                  {/* Utilization Progress Bar */}
                  <View style={styles.utilizationSection}>
                    <View style={styles.utilizationTrack}>
                      <View
                        style={[
                          styles.utilizationFill,
                          { width: `${s.utilization}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.utilizationText}>
                      {s.utilization}% of stock utilised
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  {isUsed ? (
                    <View style={styles.usedBanner}>
                      <VectorIcon name="Check" size={16} color={Colors.brand.dark} />
                      <Text style={styles.usedBannerText}>Recommendation Used</Text>
                    </View>
                  ) : (
                    <View style={styles.actionRow}>
                      <Pressable
                        onPress={() => handleViewRecipe(s.recipeId || '', s.item, s.promo)}
                        style={({ pressed }) => [styles.viewRecipeBtn, pressed && styles.pressed]}
                      >
                        <Text style={styles.viewRecipeBtnText}>View Recipe</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleUseSuggestion(s.id)}
                        style={({ pressed }) => [styles.useSuggestionBtn, pressed && styles.pressed]}
                      >
                        <Text style={styles.useSuggestionBtnText}>Use Suggestion</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleDismissSuggestion(s.id)}
                        style={({ pressed }) => [styles.dismissBtn, pressed && styles.pressed]}
                      >
                        <VectorIcon name="X" size={16} color={Colors.neutral.textTertiary} />
                      </Pressable>
                    </View>
                  )}
                </View>
              </Card>
            );
          })
        )}

        {/* ── Contextual Recommendation Callout ── */}
        {visibleSuggestions.length > 0 && (
          <View style={styles.calloutCard}>
            <Text style={styles.calloutTitle}>About these recommendations</Text>
            <Text style={styles.calloutBody}>
              Suggestions are calculated from your current expiring stock and active recipe mappings.
              Using a suggestion does not automatically deduct inventory — confirm actual usage through a stock count.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Recipe Details Modal ── */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recipe Details</Text>
              <Pressable
                onPress={() => setIsModalVisible(false)}
                style={({ pressed }) => [styles.closeModalBtn, pressed && styles.pressed]}
              >
                <VectorIcon name="X" size={20} color={Colors.neutral.textSecondary} />
              </Pressable>
            </View>

            {loadingRecipe ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={Colors.brand.primary} />
                <Text style={styles.modalLoadingText}>Loading recipe details...</Text>
              </View>
            ) : selectedRecipe ? (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                <Text style={styles.modalRecipeName}>{selectedRecipe.name}</Text>
                <View style={styles.modalMetaRow}>
                  <Badge variant="amber">{selectedRecipe.code}</Badge>
                  <Text style={styles.modalMetaText}>
                    Yield: {selectedRecipe.portionYield} portions
                  </Text>
                </View>

                {selectedRecipe.costPerPortion > 0 && (
                  <View style={styles.costBanner}>
                    <Text style={styles.costBannerLabel}>Est. Cost Per Portion</Text>
                    <Text style={styles.costBannerValue}>
                      €{selectedRecipe.costPerPortion.toFixed(2)}
                    </Text>
                  </View>
                )}

                <Text style={styles.ingredientsTitle}>Required Ingredients</Text>
                <View style={styles.ingredientsList}>
                  {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 ? (
                    selectedRecipe.ingredients.map((ing) => (
                      <View key={ing.id} style={styles.ingredientRow}>
                        <View style={styles.ingredientInfo}>
                          <Text style={styles.ingredientName}>{ing.itemName}</Text>
                          <Text style={styles.ingredientQty}>
                            {ing.quantity} {ing.unit} {ing.wastePercentage > 0 ? `(+${ing.wastePercentage}% waste)` : ''}
                          </Text>
                        </View>
                        <View style={styles.ingredientCost}>
                          <Text style={styles.ingredientCostValue}>
                            €{Number(ing.lineCost || 0).toFixed(2)}
                          </Text>
                          <Text style={styles.ingredientUnitCost}>
                            €{Number(ing.costPerUnit || 0).toFixed(2)}/{ing.unit}
                          </Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noIngredientsText}>No ingredients defined for this recipe.</Text>
                  )}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.modalError}>
                <Text style={styles.modalErrorText}>Recipe details could not be found.</Text>
              </View>
            )}

            <Pressable
              onPress={() => setIsModalVisible(false)}
              style={({ pressed }) => [styles.modalCloseBtn, pressed && styles.pressed]}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </Pressable>
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
  headerBanner: {
    backgroundColor: Colors.neutral.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  headerSubText: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
    lineHeight: 16,
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
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...Typography.cardTitle,
    fontSize: 16,
  },
  emptySub: {
    ...Typography.bodySecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  suggestionCard: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  highlightedCard: {
    borderColor: Colors.brand.primary,
    borderWidth: 1.5,
  },
  usedCard: {
    opacity: 0.65,
  },
  itemHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  itemHeaderInfo: {
    flex: 1,
  },
  itemHeaderText: {
    fontSize: 12,
    fontWeight: '700',
  },
  itemHeaderSub: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
  },
  promoDetails: {
    gap: Spacing.xs,
  },
  promoSnippetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  promoSnippetTag: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.brand.dark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promoName: {
    ...Typography.cardTitle,
    fontSize: 16,
    color: Colors.neutral.textPrimary,
  },
  promoDesc: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginVertical: Spacing.xs,
  },
  statBoxSlate: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.borderLight,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  statBoxGreen: {
    flex: 1,
    backgroundColor: Colors.brand.subtle,
    borderColor: Colors.brand.light,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  statLabelSlate: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
  },
  statLabelGreen: {
    fontSize: 10,
    color: Colors.brand.dark,
  },
  statNumSlate: {
    ...Typography.monoValue,
    fontSize: 12,
    color: Colors.neutral.textPrimary,
    marginTop: 2,
  },
  statNumGreen: {
    ...Typography.monoValue,
    fontSize: 13,
    color: Colors.brand.dark,
    marginTop: 2,
  },
  utilizationSection: {
    gap: 4,
    marginBottom: Spacing.xs,
  },
  utilizationTrack: {
    height: 5,
    backgroundColor: Colors.neutral.borderLight,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  utilizationFill: {
    height: '100%',
    backgroundColor: Colors.brand.primary,
    borderRadius: 2.5,
  },
  utilizationText: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 4,
  },
  viewRecipeBtn: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewRecipeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  useSuggestionBtn: {
    flex: 1.3,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  useSuggestionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  dismissBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.lg,
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.borderLight,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.brand.subtle,
    borderColor: Colors.brand.light,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    marginTop: 4,
  },
  usedBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  calloutCard: {
    backgroundColor: Colors.info.subtle,
    borderColor: Colors.info.light,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  calloutTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.info.dark,
  },
  calloutBody: {
    fontSize: 11,
    color: Colors.info.dark,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    maxHeight: '80%',
    ...Shadows.modal,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
    paddingBottom: Spacing.xs,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  closeModalBtn: {
    padding: 4,
  },
  modalLoading: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  modalLoadingText: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
  },
  modalScroll: {
    marginBottom: Spacing.md,
  },
  modalRecipeName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    marginBottom: Spacing.xs,
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  modalMetaText: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    fontWeight: '500',
  },
  costBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.brand.subtle,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.brand.light,
    marginBottom: Spacing.md,
  },
  costBannerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.brand.dark,
  },
  costBannerValue: {
    ...Typography.monoValue,
    fontSize: 15,
    color: Colors.brand.dark,
  },
  ingredientsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  ingredientsList: {
    gap: Spacing.sm,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  ingredientInfo: {
    flex: 1.5,
  },
  ingredientName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  ingredientQty: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  ingredientCost: {
    flex: 1,
    alignItems: 'flex-end',
  },
  ingredientCostValue: {
    ...Typography.monoValue,
    fontSize: 13,
    color: Colors.neutral.textPrimary,
    textAlign: 'right',
  },
  ingredientUnitCost: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
    textAlign: 'right',
    marginTop: 2,
  },
  noIngredientsText: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    fontStyle: 'italic',
    paddingVertical: Spacing.md,
    textAlign: 'center',
  },
  modalError: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalErrorText: {
    fontSize: 13,
    color: Colors.critical.main,
  },
  modalCloseBtn: {
    backgroundColor: Colors.neutral.surface,
    borderColor: Colors.neutral.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  modalCloseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
});

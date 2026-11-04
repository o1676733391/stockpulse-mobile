import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { Recipe, recipeService } from '@/services/recipeService';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MenuCostCalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, formatCurrency } = useI18n();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [sellingPriceInput, setSellingPriceInput] = useState<string>('16.50');
  const [targetCostPctInput, setTargetCostPctInput] = useState<string>('28');
  const [estimatedMonthlyOrders, setEstimatedMonthlyOrders] = useState<string>('320');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const list = await recipeService.getRecipes();
        setRecipes(list);
        if (list.length > 0) {
          setSelectedRecipeId(list[0].id);
        }
      } catch {
        // safe fallback
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const selectedRecipe = useMemo(
    () => recipes.find((r) => r.id === selectedRecipeId) || recipes[0],
    [recipes, selectedRecipeId]
  );

  const foodCost = useMemo(() => {
    if (!selectedRecipe) return 3.5;
    return selectedRecipe.costPerPortion || 3.5;
  }, [selectedRecipe]);

  const sellingPrice = parseFloat(sellingPriceInput) || 16.5;
  const targetCostPct = parseFloat(targetCostPctInput) || 28;
  const monthlyOrders = parseInt(estimatedMonthlyOrders, 10) || 300;

  // Key Calculations
  const grossMargin = Math.max(0, sellingPrice - foodCost);
  const actualCostPct = sellingPrice > 0 ? (foodCost / sellingPrice) * 100 : 0;
  const recommendedPrice = targetCostPct > 0 ? (foodCost / (targetCostPct / 100)) : foodCost * 3.5;
  const monthlyGrossProfit = grossMargin * monthlyOrders;

  // BCG Menu Engineering Classification
  // High Margin threshold: margin > 10€, High Popularity threshold: orders > 200/month
  const isHighMargin = grossMargin >= 10.0;
  const isHighVolume = monthlyOrders >= 200;

  const menuClassification = useMemo(() => {
    if (isHighMargin && isHighVolume) {
      return {
        type: 'star',
        label: 'Star Dish (High Margin & High Popularity)',
        desc: 'High Margin & High Popularity. Maintain exact quality and prominent menu placement.',
        color: '#15803d',
        bg: '#dcfce7',
      };
    }
    if (!isHighMargin && isHighVolume) {
      return {
        type: 'plowhorse',
        label: 'Plowhorse (High Popularity & Low Margin)',
        desc: 'High Popularity but Low Margin. Consider a slight price increase or reducing ingredient cost.',
        color: '#b45309',
        bg: '#fef3c7',
      };
    }
    if (isHighMargin && !isHighVolume) {
      return {
        type: 'puzzle',
        label: 'Puzzle (High Margin & Low Popularity)',
        desc: 'High Margin but Low Popularity. Feature as daily special or improve server recommendation.',
        color: '#4338ca',
        bg: '#e0e7ff',
      };
    }
    return {
      type: 'dog',
      label: 'Dog / Re-engineer (Low Margin & Low Popularity)',
      desc: 'Low Margin & Low Popularity. Re-evaluate recipe ingredients or replace with higher-margin alternative.',
      color: '#dc2626',
      bg: '#fee2e2',
    };
  }, [isHighMargin, isHighVolume]);

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar
        title="Menu Cost & Margin Matrix"
        subtitle="Menu engineering & profitability analysis"
        showBack
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Recipe Picker Carousel / Chips */}
        <Text style={styles.sectionLabel}>Select Recipe / Dish</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recipePickerRow}
        >
          {recipes.map((r) => {
            const isSelected = selectedRecipe?.id === r.id;
            return (
              <Pressable
                key={r.id}
                onPress={() => {
                  setSelectedRecipeId(r.id);
                  if (r.costPerPortion) {
                    setSellingPriceInput((r.costPerPortion / 0.28).toFixed(2));
                  }
                }}
                style={[
                  styles.recipeChip,
                  isSelected && styles.recipeChipActive,
                ]}
              >
                {isSelected && (
                  <VectorIcon
                    name="Check"
                    size={12}
                    color={Colors.brand.primary}
                    strokeWidth={2.5}
                  />
                )}
                <Text
                  style={[
                    styles.recipeChipText,
                    isSelected && styles.recipeChipTextActive,
                  ]}
                >
                  {r.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading && (
          <ActivityIndicator size="small" color={Colors.brand.primary} style={{ marginVertical: Spacing.md }} />
        )}

        {/* Selected Recipe Banner */}
        {selectedRecipe && (
          <Card style={styles.dishHeaderCard}>
            <View style={styles.dishHeaderTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dishName}>{selectedRecipe.name}</Text>
                <Text style={styles.dishCategory}>{selectedRecipe.category} · Code: {selectedRecipe.code}</Text>
              </View>
              <View style={styles.foodCostPill}>
                <Text style={styles.foodCostPillLabel}>Raw Food Cost</Text>
                <Text style={styles.foodCostPillVal}>{formatCurrency(foodCost)}</Text>
              </View>
            </View>

            <Text style={styles.ingredientsHint}>
              Recipe contains {selectedRecipe.ingredients?.length || 0} ingredients exploded via BOM.
            </Text>
          </Card>
        )}

        {/* Pricing Inputs */}
        <Card style={styles.inputCard}>
          <Text style={styles.cardSectionTitle}>Pricing & Targets</Text>

          <View style={styles.inputRow}>
            <View style={styles.inputCol}>
              <Text style={styles.inputLabel}>Menu Selling Price (€)</Text>
              <TextInput
                style={styles.textInput}
                value={sellingPriceInput}
                onChangeText={setSellingPriceInput}
                keyboardType="numeric"
                placeholder="16.50"
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={styles.inputLabel}>Target Food Cost %</Text>
              <TextInput
                style={styles.textInput}
                value={targetCostPctInput}
                onChangeText={setTargetCostPctInput}
                keyboardType="numeric"
                placeholder="28"
              />
            </View>
          </View>

          <View style={[styles.inputRow, { marginTop: Spacing.sm }]}>
            <View style={styles.inputCol}>
              <Text style={styles.inputLabel}>Est. Monthly Orders (Portions)</Text>
              <TextInput
                style={styles.textInput}
                value={estimatedMonthlyOrders}
                onChangeText={setEstimatedMonthlyOrders}
                keyboardType="numeric"
                placeholder="300"
              />
            </View>
          </View>
        </Card>

        {/* Results Metrics Card */}
        <Card style={styles.resultsCard}>
          <Text style={styles.cardSectionTitle}>Profitability Analysis</Text>

          <View style={styles.resultsGrid}>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Actual Food Cost %</Text>
              <Text
                style={[
                  styles.resultVal,
                  {
                    color:
                      actualCostPct <= targetCostPct
                        ? Colors.brand.primary
                        : Colors.critical.main,
                  },
                ]}
              >
                {actualCostPct.toFixed(1)}%
              </Text>
              <Text style={styles.resultSub}>
                {actualCostPct <= targetCostPct ? 'Within target' : 'Above target budget'}
              </Text>
            </View>

            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Gross Margin / Serving</Text>
              <Text style={[styles.resultVal, { color: Colors.brand.dark }]}>
                {formatCurrency(grossMargin)}
              </Text>
              <Text style={styles.resultSub}>Profit per dish</Text>
            </View>

            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Recommended Price</Text>
              <Text style={styles.resultVal}>{formatCurrency(recommendedPrice)}</Text>
              <Text style={styles.resultSub}>To achieve {targetCostPct}% food cost</Text>
            </View>

            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Est. Monthly Profit</Text>
              <Text style={[styles.resultVal, { color: '#047857' }]}>
                {formatCurrency(monthlyGrossProfit)}
              </Text>
              <Text style={styles.resultSub}>{monthlyOrders} servings/mo</Text>
            </View>
          </View>
        </Card>

        {/* BCG Menu Engineering Classification Card */}
        <Card style={[styles.bcgCard, { backgroundColor: menuClassification.bg, borderColor: menuClassification.color }]}>
          <View style={styles.bcgHeader}>
            <Text style={[styles.bcgTitle, { color: menuClassification.color }]}>
              {menuClassification.label}
            </Text>
          </View>
          <Text style={[styles.bcgDesc, { color: menuClassification.color }]}>
            {menuClassification.desc}
          </Text>
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
    padding: Spacing.md,
  },
  sectionLabel: {
    ...Typography.labelSmall,
    color: Colors.neutral.textSecondary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  recipePickerRow: {
    gap: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  recipeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  recipeChipActive: {
    backgroundColor: '#dcfce7',
    borderColor: Colors.brand.primary,
  },
  recipeChipText: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    fontWeight: '600',
  },
  recipeChipTextActive: {
    color: Colors.brand.primary,
    fontWeight: '700',
  },
  dishHeaderCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  dishHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dishName: {
    ...Typography.titleMedium,
    fontWeight: '800',
    color: Colors.neutral.textPrimary,
  },
  dishCategory: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  foodCostPill: {
    alignItems: 'flex-end',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  foodCostPillLabel: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
  },
  foodCostPillVal: {
    ...Typography.titleMedium,
    fontWeight: '800',
    color: Colors.neutral.textPrimary,
  },
  ingredientsHint: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    fontSize: 12,
    marginTop: Spacing.sm,
  },
  inputCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardSectionTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    marginBottom: Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    ...Typography.labelSmall,
    color: Colors.neutral.textSecondary,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.bodyMedium,
    color: Colors.neutral.textPrimary,
    fontWeight: '700',
  },
  resultsCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  resultItem: {
    width: '47%',
  },
  resultLabel: {
    ...Typography.labelSmall,
    color: Colors.neutral.textTertiary,
    marginBottom: 2,
  },
  resultVal: {
    ...Typography.titleLarge,
    fontWeight: '800',
    color: Colors.neutral.textPrimary,
  },
  resultSub: {
    ...Typography.labelSmall,
    color: Colors.neutral.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  bcgCard: {
    padding: Spacing.md,
    borderWidth: 1.5,
  },
  bcgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bcgTitle: {
    ...Typography.titleMedium,
    fontWeight: '800',
  },
  bcgDesc: {
    ...Typography.bodySmall,
    fontWeight: '500',
    lineHeight: 18,
  },
});

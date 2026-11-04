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

export default function RecipeBatchScalerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, formatCurrency } = useI18n();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [multiplier, setMultiplier] = useState<number>(25);
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

  const scaledIngredients = useMemo(() => {
    if (!selectedRecipe || !selectedRecipe.ingredients) return [];

    return selectedRecipe.ingredients.map((ing) => {
      const baseQty = ing.quantity || 0;
      const scaledQty = parseFloat((baseQty * multiplier).toFixed(2));
      const lineCost = parseFloat(((ing.costPerUnit || 1) * scaledQty).toFixed(2));
      const onHand = ing.availableStock ?? 10;
      const isShort = scaledQty > onHand;

      return {
        ...ing,
        baseQty,
        scaledQty,
        lineCost,
        onHand,
        isShort,
      };
    });
  }, [selectedRecipe, multiplier]);

  const totalBatchCost = useMemo(() => {
    return scaledIngredients.reduce((sum, i) => sum + i.lineCost, 0);
  }, [scaledIngredients]);

  const hasAnyShortage = useMemo(() => {
    return scaledIngredients.some((i) => i.isShort);
  }, [scaledIngredients]);

  const quickMultipliers = [5, 10, 25, 50, 100];

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar
        title="Recipe Batch Scaler"
        subtitle="Kitchen prep yield & portion scaling"
        showBack
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Recipe Picker */}
        <Text style={styles.sectionLabel}>Select Recipe</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recipePickerRow}
        >
          {recipes.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => setSelectedRecipeId(r.id)}
              style={[
                styles.recipeChip,
                selectedRecipe?.id === r.id && styles.recipeChipActive,
              ]}
            >
              <Text
                style={[
                  styles.recipeChipText,
                  selectedRecipe?.id === r.id && styles.recipeChipTextActive,
                ]}
              >
                {r.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {loading && (
          <ActivityIndicator size="small" color={Colors.brand.primary} style={{ marginVertical: Spacing.md }} />
        )}

        {/* Scaler Controller Card */}
        <Card style={styles.controlCard}>
          <Text style={styles.cardSectionTitle}>Prep Batch Scale Target</Text>

          <View style={styles.stepperRow}>
            <Pressable
              onPress={() => setMultiplier((prev) => Math.max(1, prev - 5))}
              style={styles.stepperBtn}
            >
              <VectorIcon name="Minus" size={20} color={Colors.neutral.textPrimary} />
            </Pressable>

            <View style={styles.portionDisplay}>
              <Text style={styles.portionNum}>{multiplier}</Text>
              <Text style={styles.portionLabel}>Portions / Servings</Text>
            </View>

            <Pressable
              onPress={() => setMultiplier((prev) => prev + 5)}
              style={styles.stepperBtn}
            >
              <VectorIcon name="Plus" size={20} color={Colors.neutral.textPrimary} />
            </Pressable>
          </View>

          {/* Quick preset buttons */}
          <View style={styles.presetRow}>
            {quickMultipliers.map((num) => (
              <Pressable
                key={num}
                onPress={() => setMultiplier(num)}
                style={[
                  styles.presetChip,
                  multiplier === num && styles.presetChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    multiplier === num && styles.presetChipTextActive,
                  ]}
                >
                  {num}x
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Batch Summary Stats */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Total Batch Food Cost</Text>
              <Text style={styles.summaryVal}>{formatCurrency(totalBatchCost)}</Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.summaryLabel}>Per Portion</Text>
              <Text style={styles.summaryPortionVal}>
                {formatCurrency(totalBatchCost / (multiplier || 1))}
              </Text>
            </View>
          </View>

          {hasAnyShortage && (
            <View style={styles.shortageNotice}>
              <VectorIcon name="AlertTriangle" size={14} color={Colors.critical.main} />
              <Text style={styles.shortageNoticeText}>
                Some ingredients exceed current on-hand stock. Replenishment needed.
              </Text>
            </View>
          )}
        </Card>

        {/* Scaled Ingredients Table */}
        <Text style={styles.sectionLabel}>
          Scaled Ingredients for {multiplier} Portions ({scaledIngredients.length} items)
        </Text>

        <Card style={styles.tableCard}>
          {scaledIngredients.map((item, idx) => (
            <View
              key={item.itemId || item.id}
              style={[
                styles.itemRow,
                idx !== scaledIngredients.length - 1 && styles.itemRowBorder,
              ]}
            >
              <View style={{ flex: 1, marginRight: Spacing.sm }}>
                <Text style={styles.itemName}>{item.itemName}</Text>
                <Text style={styles.itemCalc}>
                  Base: {item.baseQty} {item.unit} · On-Hand: {item.onHand} {item.unit}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.scaledQty}>
                  {item.scaledQty} {item.unit}
                </Text>
                <Text style={styles.itemCost}>{formatCurrency(item.lineCost)}</Text>

                {item.isShort && (
                  <Text style={styles.shortageTag}>Shortage</Text>
                )}
              </View>
            </View>
          ))}
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
    marginTop: Spacing.xs,
  },
  recipePickerRow: {
    gap: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  recipeChip: {
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
  controlCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardSectionTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
    marginBottom: Spacing.sm,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portionDisplay: {
    alignItems: 'center',
    minWidth: 120,
  },
  portionNum: {
    ...Typography.titleLarge,
    fontSize: 32,
    fontWeight: '900',
    color: Colors.brand.primary,
  },
  portionLabel: {
    ...Typography.labelSmall,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
    paddingTop: Spacing.sm,
  },
  presetChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: '#f8fafc',
  },
  presetChipActive: {
    backgroundColor: '#dcfce7',
  },
  presetChipText: {
    ...Typography.labelSmall,
    fontWeight: '700',
    color: Colors.neutral.textSecondary,
  },
  presetChipTextActive: {
    color: Colors.brand.primary,
  },
  summaryCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    ...Typography.labelSmall,
    color: Colors.neutral.textTertiary,
  },
  summaryVal: {
    ...Typography.titleLarge,
    fontWeight: '900',
    color: Colors.neutral.textPrimary,
    marginTop: 2,
  },
  summaryPortionVal: {
    ...Typography.titleMedium,
    fontWeight: '700',
    color: Colors.brand.primary,
    marginTop: 2,
  },
  shortageNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    padding: Spacing.xs + 2,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  shortageNoticeText: {
    ...Typography.labelSmall,
    color: Colors.critical.dark,
    flex: 1,
    fontSize: 11,
  },
  tableCard: {
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
  },
  itemName: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  itemCalc: {
    ...Typography.labelSmall,
    color: Colors.neutral.textSecondary,
    marginTop: 2,
  },
  scaledQty: {
    ...Typography.bodyMedium,
    fontWeight: '800',
    color: Colors.neutral.textPrimary,
  },
  itemCost: {
    ...Typography.labelSmall,
    color: Colors.neutral.textTertiary,
    marginTop: 1,
  },
  shortageTag: {
    ...Typography.labelSmall,
    fontSize: 10,
    color: Colors.critical.main,
    fontWeight: '700',
    marginTop: 2,
  },
});

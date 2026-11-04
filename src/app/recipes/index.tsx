import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DesktopAccessNotice } from '@/components/ui/desktop-access-notice';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { Recipe, recipeService } from '@/services/recipeService';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RecipesListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, formatCurrency, language } = useI18n();
  const isDe = language === 'de';

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<'all' | 'food' | 'drinks'>('all');

  const loadRecipes = useCallback(async () => {
    try {
      const data = await recipeService.getRecipes();
      setRecipes(data);
    } catch {
      // Safe fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecipes();
    }, [loadRecipes])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRecipes();
  }, [loadRecipes]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const matchesSearch =
        search.trim() === '' ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.category && r.category.toLowerCase().includes(search.toLowerCase())) ||
        (r.code && r.code.toLowerCase().includes(search.toLowerCase())) ||
        (r.posItemName && r.posItemName.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedGroup === 'all') return true;
      if (selectedGroup === 'food') {
        const cat = (r.category || '').toLowerCase();
        return (
          cat.includes('main') ||
          cat.includes('burger') ||
          cat.includes('fish') ||
          cat.includes('salad') ||
          cat.includes('breakfast') ||
          cat.includes('starter') ||
          cat.includes('dessert') ||
          cat.includes('bakery') ||
          cat.includes('food') ||
          cat.includes('speise') ||
          cat.includes('fleisch') ||
          cat.includes('fisch') ||
          cat.includes('küche')
        );
      }
      if (selectedGroup === 'drinks') {
        const cat = (r.category || '').toLowerCase();
        return (
          cat.includes('coffee') ||
          cat.includes('tea') ||
          cat.includes('cocktail') ||
          cat.includes('beer') ||
          cat.includes('wine') ||
          cat.includes('juice') ||
          cat.includes('drink') ||
          cat.includes('beverage') ||
          cat.includes('getränk') ||
          cat.includes('kaffee') ||
          cat.includes('bier') ||
          cat.includes('wein') ||
          cat.includes('spirituos') ||
          cat.includes('bar')
        );
      }
      return true;
    });
  }, [recipes, search, selectedGroup]);

  return (
    <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
      <TopBar
        title={t('recipes.title')}
        subtitle={t('recipes.subtitle')}
        showBack
        right={
          <Pressable
            onPress={() => router.push('/recipes/create' as any)}
            style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
          >
            <VectorIcon name="Plus" size={20} color={Colors.neutral.textPrimary} />
          </Pressable>
        }
      />

      {/* Search & Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <VectorIcon name="Search" size={16} color={Colors.neutral.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('recipes.searchPlaceholder', { defaultValue: 'Search recipes or menu items...' })}
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

        {/* Group Filter Chips (All / Food / Drinks) */}
        <View style={styles.groupChips}>
          <Pressable
            onPress={() => setSelectedGroup('all')}
            style={[
              styles.groupChip,
              selectedGroup === 'all' && styles.groupChipActive,
            ]}
          >
            <Text
              style={[
                styles.groupChipText,
                selectedGroup === 'all' && styles.groupChipTextActive,
              ]}
            >
              {t('recipes.allCategories')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedGroup('food')}
            style={[
              styles.groupChip,
              selectedGroup === 'food' && styles.groupChipActive,
            ]}
          >
            <VectorIcon
              name="Utensils"
              size={13}
              color={selectedGroup === 'food' ? '#ffffff' : Colors.neutral.textSecondary}
            />
            <Text
              style={[
                styles.groupChipText,
                selectedGroup === 'food' && styles.groupChipTextActive,
              ]}
            >
              {t('recipes.food')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedGroup('drinks')}
            style={[
              styles.groupChip,
              selectedGroup === 'drinks' && styles.groupChipActive,
            ]}
          >
            <VectorIcon
              name="BookOpen"
              size={13}
              color={selectedGroup === 'drinks' ? '#ffffff' : Colors.neutral.textSecondary}
            />
            <Text
              style={[
                styles.groupChipText,
                selectedGroup === 'drinks' && styles.groupChipTextActive,
              ]}
            >
              {t('recipes.drinks')}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Manager Desktop / PC Notice */}
        <DesktopAccessNotice compact />

        {/* Info Banner on BOM Deductions */}
        <View style={styles.infoBanner}>
          <VectorIcon name="Info" size={16} color={Colors.brand.primary} />
          <Text style={styles.infoText}>
            {t('recipes.howBomWorksDesc')}
          </Text>
        </View>

        {/* Recipe & Menu Tools Shortcuts */}
        <View style={styles.toolsRow}>
          <Pressable
            onPress={() => router.push('/recipes/cost-calculator' as any)}
            style={({ pressed }) => [styles.toolCard, pressed && styles.pressed]}
          >
            <View style={[styles.toolIconBox, { backgroundColor: '#dcfce7' }]}>
              <VectorIcon name="DollarSign" size={18} color={Colors.brand.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.toolTitle}>{t('recipeTools.costCalculator')}</Text>
              <Text style={styles.toolSub} numberOfLines={1}>{t('recipeTools.costCalculatorDesc')}</Text>
            </View>
            <VectorIcon name="ChevronRight" size={16} color={Colors.neutral.textTertiary} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/recipes/batch-scaler' as any)}
            style={({ pressed }) => [styles.toolCard, pressed && styles.pressed]}
          >
            <View style={[styles.toolIconBox, { backgroundColor: '#dbeafe' }]}>
              <VectorIcon name="Layers" size={18} color="#1d4ed8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.toolTitle}>{t('recipeTools.batchScaler')}</Text>
              <Text style={styles.toolSub} numberOfLines={1}>{t('recipeTools.batchScalerDesc')}</Text>
            </View>
            <VectorIcon name="ChevronRight" size={16} color={Colors.neutral.textTertiary} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color={Colors.brand.primary} />
            <Text style={styles.loaderText}>{t('common.loading')}</Text>
          </View>
        ) : filteredRecipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <VectorIcon name="BookOpen" size={44} color={Colors.neutral.textTertiary} />
            <Text style={styles.emptyTitle}>{t('recipes.emptyState')}</Text>
            <Text style={styles.emptySubtitle}>{t('recipes.emptyStateDesc')}</Text>
            <Pressable
              onPress={() => router.push('/recipes/create' as any)}
              style={styles.emptyButton}
            >
              <VectorIcon name="Plus" size={16} color="#ffffff" />
              <Text style={styles.emptyButtonText}>{t('recipes.newRecipe')}</Text>
            </Pressable>
          </View>
        ) : (
          filteredRecipes.map((recipe) => {
            const hasOutOfStockIngredient = recipe.ingredients.some(
              (i) => i.availableStock !== undefined && i.availableStock <= 0
            );
            const hasLowStockIngredient = recipe.ingredients.some(
              (i) => i.availableStock !== undefined && i.availableStock > 0 && i.availableStock <= 2
            );

            return (
              <Card
                key={recipe.id}
                style={styles.recipeCard}
                onPress={() => router.push(`/recipes/${recipe.id}` as any)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.recipeName}>{recipe.name}</Text>
                    <View style={styles.badgeRow}>
                      {recipe.category ? (
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryText}>{recipe.category}</Text>
                        </View>
                      ) : null}
                      {recipe.code ? (
                        <Text style={styles.codeText}>#{recipe.code}</Text>
                      ) : null}
                    </View>
                  </View>

                  <Badge variant={recipe.isActive ? 'green' : 'gray'}>
                    {recipe.isActive ? t('common.active') : t('common.inactive')}
                  </Badge>
                </View>

                {/* Stock readiness indicator */}
                <View style={styles.stockStatusRow}>
                  {hasOutOfStockIngredient ? (
                    <View style={styles.stockAlertBadge}>
                      <VectorIcon name="AlertCircle" size={12} color={Colors.critical.main} />
                      <Text style={styles.stockAlertText}>
                        {isDe ? 'Zutat nicht vorrätig' : 'Ingredient Out of Stock'}
                      </Text>
                    </View>
                  ) : hasLowStockIngredient ? (
                    <View style={styles.stockWarningBadge}>
                      <VectorIcon name="AlertTriangle" size={12} color={Colors.warning.dark} />
                      <Text style={styles.stockWarningText}>
                        {isDe ? 'Niedriger Zutatenbestand' : 'Low Stock Warning'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.stockReadyBadge}>
                      <VectorIcon name="CheckCircle" size={12} color={Colors.brand.primary} />
                      <Text style={styles.stockReadyText}>
                        {isDe ? 'Zutaten verfügbar' : 'Ingredients Ready'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Card Footer */}
                <View style={styles.cardFooter}>
                  <View style={styles.ingredientCountBox}>
                    <VectorIcon name="Layers" size={14} color={Colors.neutral.textSecondary} />
                    <Text style={styles.ingredientCountText}>
                      {recipe.ingredients.length}{' '}
                      {isDe
                        ? recipe.ingredients.length === 1
                          ? 'Zutat'
                          : 'Zutaten'
                        : recipe.ingredients.length === 1
                        ? 'ingredient'
                        : 'ingredients'}
                    </Text>
                  </View>

                  <View style={styles.cardFooterRight}>
                    <Text style={styles.costValue}>
                      {formatCurrency(recipe.costPerPortion || 0)}
                    </Text>
                    <Text style={styles.costUnit}>{isDe ? '/ Portion' : '/ serving'}</Text>
                    <VectorIcon name="ChevronRight" size={16} color={Colors.neutral.textTertiary} />
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Floating Create Button */}
      <View style={[styles.fabContainer, { bottom: insets.bottom + Spacing.md }]}>
        <Pressable
          onPress={() => router.push('/recipes/create' as any)}
          style={({ pressed }) => [styles.fabButton, pressed && styles.pressed]}
        >
          <VectorIcon name="Plus" size={20} color="#ffffff" />
          <Text style={styles.fabText}>{t('recipes.newRecipe')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.neutral.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
    gap: Spacing.sm,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    gap: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.neutral.textPrimary,
    paddingVertical: 0,
  },
  groupChips: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    gap: 4,
  },
  groupChipActive: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  groupChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  groupChipTextActive: {
    color: '#ffffff',
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.brand.subtle,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.brand.light,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.brand.dark,
    lineHeight: 17,
  },
  loaderContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loaderText: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
  },
  emptyContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  emptyTitle: {
    ...Typography.cardTitle,
    fontSize: 16,
    color: Colors.neutral.textPrimary,
    marginTop: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    gap: 6,
    marginTop: Spacing.sm,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  recipeCard: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  recipeName: {
    ...Typography.cardTitle,
    fontSize: 15,
    color: Colors.neutral.textPrimary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 4,
  },
  categoryBadge: {
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.neutral.borderLight,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  codeText: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  stockStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockReadyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brand.subtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  stockReadyText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.brand.primary,
  },
  stockWarningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warning.subtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  stockWarningText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.warning.dark,
  },
  stockAlertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.critical.subtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  stockAlertText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.critical.main,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.borderLight,
  },
  ingredientCountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ingredientCountText: {
    fontSize: 12,
    color: Colors.neutral.textSecondary,
    fontWeight: '500',
  },
  cardFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  costValue: {
    ...Typography.monoValue,
    fontSize: 13,
    color: Colors.brand.dark,
  },
  costUnit: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    marginRight: 4,
  },
  fabContainer: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    alignItems: 'center',
  },
  fabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
    ...Shadows.card,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
  toolsRow: {
    flexDirection: 'column',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    ...Shadows.sm,
    gap: Spacing.sm,
  },
  toolIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  toolSub: {
    ...Typography.bodySmall,
    color: Colors.neutral.textSecondary,
    fontSize: 11,
  },
});


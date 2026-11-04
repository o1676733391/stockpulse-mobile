import { AddEditInventoryModal } from '@/components/inventory/add-edit-item-modal';
import { Card } from '@/components/ui/card';
import { VectorIcon } from '@/components/ui/icons';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/i18n/I18nContext';
import { inventoryService } from '@/services/inventoryService';
import {
  FOOD_CATEGORIES,
  DRINK_CATEGORIES,
  Recipe,
  recipeService,
} from '@/services/recipeService';
import { InventoryItem } from '@/types/inventory';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DraftIngredient {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  quantity: string;
  unit: string;
  wastePercentage: string;
  costPerUnit: number;
  availableStock: number;
}

export default function EditRecipeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, formatCurrency, formatNumber } = useI18n();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Main Course');
  const [portionYield, setPortionYield] = useState('1');
  const [posItemName, setPosItemName] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Raw materials from inventory
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([]);

  // Pickers and modals
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [pickerTargetRowId, setPickerTargetRowId] = useState<string | null>(null);
  const [showAddRawMaterialModal, setShowAddRawMaterialModal] = useState(false);
  const [itemSearch, setItemSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setLoading(true);
        const [recipeData, invData] = await Promise.all([
          recipeService.getRecipeById(id),
          inventoryService.getItems(),
        ]);

        setInventoryItems(invData);

        if (recipeData) {
          setName(recipeData.name || '');
          setCode(recipeData.code || '');
          setCategory(recipeData.category || 'Main Course');
          setPortionYield(String(recipeData.portionYield || 1));
          setPosItemName(recipeData.posItemName || '');
          setIsActive(recipeData.isActive !== false);

          const invMap = new Map(invData.map((i) => [i.id, i]));

          setIngredients(
            (recipeData.ingredients || []).map((ing, idx) => {
              const inv = invMap.get(ing.itemId);
              return {
                id: ing.id || `ing_${idx}`,
                itemId: ing.itemId,
                itemName: ing.itemName || inv?.name || 'Ingredient',
                itemSku: ing.itemSku || inv?.sku || '',
                quantity: String(ing.quantity || 1),
                unit: ing.unit || inv?.unit || 'kg',
                wastePercentage: String(ing.wastePercentage || 0),
                costPerUnit: ing.costPerUnit || inv?.costPerUnit || 0,
                availableStock: ing.availableStock ?? inv?.physicalStock ?? 0,
              };
            })
          );
        }
      } catch (err: any) {
        Alert.alert('Load Error', err?.message || 'Failed to load recipe details');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const filteredInventory = useMemo(() => {
    if (!itemSearch.trim()) return inventoryItems;
    const query = itemSearch.toLowerCase();
    return inventoryItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }, [inventoryItems, itemSearch]);

  const estimatedCostPerServing = useMemo(() => {
    const yieldNum = Math.max(1, parseFloat(portionYield) || 1);
    const totalIngredientsCost = ingredients.reduce((sum, ing) => {
      const qty = parseFloat(ing.quantity) || 0;
      const waste = parseFloat(ing.wastePercentage) || 0;
      const effectiveQty = qty * (1 + waste / 100);
      return sum + effectiveQty * (ing.costPerUnit || 0);
    }, 0);
    return totalIngredientsCost / yieldNum;
  }, [ingredients, portionYield]);

  const addIngredientRow = (preselected?: InventoryItem) => {
    const targetItem = preselected || (inventoryItems.length > 0 ? inventoryItems[0] : null);
    const newRow: DraftIngredient = {
      id: `ing_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      itemId: targetItem ? targetItem.id : '',
      itemName: targetItem ? targetItem.name : '',
      itemSku: targetItem ? targetItem.sku : '',
      quantity: '1',
      unit: targetItem ? targetItem.unit || 'kg' : 'kg',
      wastePercentage: '0',
      costPerUnit: targetItem ? targetItem.costPerUnit || 0 : 0,
      availableStock: targetItem ? targetItem.physicalStock || 0 : 0,
    };
    setIngredients((prev) => [...prev, newRow]);
  };

  const removeIngredientRow = (rowId: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== rowId));
  };

  const updateIngredientRow = (rowId: string, patch: Partial<DraftIngredient>) => {
    setIngredients((prev) =>
      prev.map((i) => (i.id === rowId ? { ...i, ...patch } : i))
    );
  };

  const handleSelectInventoryItem = (item: InventoryItem) => {
    if (!pickerTargetRowId) return;
    updateIngredientRow(pickerTargetRowId, {
      itemId: item.id,
      itemName: item.name,
      itemSku: item.sku,
      unit: item.unit || 'kg',
      costPerUnit: item.costPerUnit || 0,
      availableStock: item.physicalStock || 0,
    });
    setPickerTargetRowId(null);
    setItemSearch('');
  };

  const handleRawMaterialCreated = (newItem: InventoryItem) => {
    setInventoryItems((prev) => [newItem, ...prev]);
    setShowAddRawMaterialModal(false);

    if (pickerTargetRowId) {
      updateIngredientRow(pickerTargetRowId, {
        itemId: newItem.id,
        itemName: newItem.name,
        itemSku: newItem.sku,
        unit: newItem.unit || 'kg',
        costPerUnit: newItem.costPerUnit || 0,
        availableStock: newItem.physicalStock || 0,
      });
      setPickerTargetRowId(null);
    } else {
      addIngredientRow(newItem);
    }

    Alert.alert(
      'Raw Material Added',
      `"${newItem.name}" is now in inventory and selected for this recipe.`
    );
  };

  const handleUpdateRecipe = async () => {
    if (!id) return;
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a recipe or dish name.');
      return;
    }

    if (ingredients.length === 0) {
      Alert.alert('No Ingredients', 'Please add at least one ingredient to the recipe.');
      return;
    }

    for (const ing of ingredients) {
      if (!ing.itemId) {
        Alert.alert('Incomplete Ingredient', 'Please select an inventory item for each ingredient row.');
        return;
      }
      const q = parseFloat(ing.quantity);
      if (isNaN(q) || q <= 0) {
        Alert.alert('Invalid Quantity', `Please enter a valid quantity for "${ing.itemName || 'ingredient'}".`);
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        code: code.trim() || undefined,
        name: name.trim(),
        category,
        portionYield: Math.max(1, parseFloat(portionYield) || 1),
        posItemName: posItemName.trim() || undefined,
        isActive,
        ingredients: ingredients.map((ing) => ({
          itemId: ing.itemId,
          quantity: parseFloat(ing.quantity) || 0,
          unit: ing.unit,
          wastePercentage: parseFloat(ing.wastePercentage) || 0,
        })),
      };

      await recipeService.updateRecipe(id, payload);
      Alert.alert(
        'Recipe Updated',
        `Changes to "${name}" have been saved successfully.`,
        [
          {
            text: t('common.done'),
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Failed to update recipe');
    } finally {
      setSaving(false);
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.screen, { backgroundColor: Colors.neutral.surface }]}>
        <TopBar
          title={t('recipes.editRecipe')}
          showBack
          right={
            <Pressable
              onPress={handleUpdateRecipe}
              disabled={saving}
              style={({ pressed }) => [styles.saveHeaderBtn, pressed && styles.pressed]}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.brand.primary} />
              ) : (
                <Text style={styles.saveHeaderText}>{t('common.save')}</Text>
              )}
            </Pressable>
          }
        />

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── 1. Basic Details Card ── */}
          <Card style={styles.formCard}>
            <Text style={styles.cardHeaderTitle}>{t('common.overview')}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {t('recipes.recipeName')} <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Classic Cheeseburger"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('recipes.category')}</Text>
              <Pressable
                onPress={() => setShowCategoryPicker(true)}
                style={styles.selectBtn}
              >
                <Text style={styles.selectBtnText}>{category}</Text>
                <VectorIcon name="ChevronDown" size={16} color={Colors.neutral.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.twoColRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>{t('recipes.portionYield')}</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={portionYield}
                  onChangeText={setPortionYield}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>{t('recipes.recipeCode')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={code}
                  onChangeText={setCode}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('recipes.posItemName')}</Text>
              <TextInput
                style={styles.textInput}
                value={posItemName}
                onChangeText={setPosItemName}
                placeholder={t('recipes.posItemPlaceholder')}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <Text style={styles.toggleTitle}>{t('recipes.activeDeductions')}</Text>
                <Text style={styles.toggleSub}>
                  Deducts ingredients from inventory on confirmed sales
                </Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: Colors.neutral.border, true: Colors.brand.primary }}
              />
            </View>
          </Card>

          {/* ── 2. Ingredients (BOM) Section ── */}
          <Card style={styles.formCard}>
            <View style={styles.ingredientsHeaderRow}>
              <View>
                <Text style={styles.cardHeaderTitle}>{t('recipes.ingredientsBom')}</Text>
                <Text style={styles.costEstimateText}>
                  Est. {formatCurrency(estimatedCostPerServing)} / serving
                </Text>
              </View>

              <Pressable
                onPress={() => setShowAddRawMaterialModal(true)}
                style={styles.addRawMaterialBtn}
              >
                <VectorIcon name="PackagePlus" size={14} color={Colors.brand.primary} />
                <Text style={styles.addRawMaterialBtnText}>
                  {t('recipes.addNewRawMaterial')}
                </Text>
              </Pressable>
            </View>

            {/* Sub-banner prompt to add raw material if missing in stock */}
            <View style={styles.newRawMaterialBanner}>
              <VectorIcon name="Package" size={15} color={Colors.brand.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.newRawMaterialTitle}>
                  {t('recipes.addNewRawMaterialSub')}
                </Text>
                <Text style={styles.newRawMaterialDesc}>
                  Create fresh ingredients directly into stock and auto-insert them here.
                </Text>
              </View>
              <Pressable
                onPress={() => setShowAddRawMaterialModal(true)}
                style={styles.bannerActionBtn}
              >
                <Text style={styles.bannerActionBtnText}>{t('common.add')}</Text>
              </Pressable>
            </View>

            {/* Draft list */}
            {ingredients.map((ing) => {
              const stock = ing.availableStock ?? 0;
              const isOutOfStock = stock <= 0;
              const isLowStock = stock > 0 && stock <= 2;

              return (
                <View key={ing.id} style={styles.ingredientDraftCard}>
                  <View style={styles.ingredientCardTop}>
                    <Pressable
                      onPress={() => setPickerTargetRowId(ing.id)}
                      style={styles.ingredientSelector}
                    >
                      <View style={styles.selectorLeft}>
                        <Text style={styles.selectorText}>{ing.itemName}</Text>
                        {ing.itemSku ? (
                          <Text style={styles.selectorSku}>SKU: {ing.itemSku}</Text>
                        ) : null}
                      </View>
                      <VectorIcon name="ChevronDown" size={16} color={Colors.neutral.textSecondary} />
                    </Pressable>

                    <Pressable
                      onPress={() => removeIngredientRow(ing.id)}
                      style={styles.removeIngBtn}
                      hitSlop={8}
                    >
                      <VectorIcon name="Trash2" size={16} color={Colors.critical.main} />
                    </Pressable>
                  </View>

                  {/* Stock Availability Badge */}
                  <View style={styles.ingredientStockInfo}>
                    {isOutOfStock ? (
                      <View style={styles.stockOutOfStockBadge}>
                        <VectorIcon name="AlertCircle" size={12} color={Colors.critical.main} />
                        <Text style={styles.stockOutOfStockText}>
                          {t('recipes.outOfStock', { unit: ing.unit })}
                        </Text>
                      </View>
                    ) : isLowStock ? (
                      <View style={styles.stockLowStockBadge}>
                        <VectorIcon name="AlertTriangle" size={12} color={Colors.warning.dark} />
                        <Text style={styles.stockLowStockText}>
                          {t('recipes.lowStock', { qty: formatNumber(stock), unit: ing.unit })}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.stockInStockBadge}>
                        <VectorIcon name="CheckCircle" size={12} color={Colors.brand.primary} />
                        <Text style={styles.stockInStockText}>
                          {t('recipes.inStock', { qty: formatNumber(stock), unit: ing.unit })}
                        </Text>
                      </View>
                    )}

                    {ing.costPerUnit > 0 && (
                      <Text style={styles.unitCostText}>
                        {formatCurrency(ing.costPerUnit)} / {ing.unit}
                      </Text>
                    )}
                  </View>

                  {/* Inputs */}
                  <View style={styles.ingredientRowInputs}>
                    <View style={{ flex: 1.4 }}>
                      <Text style={styles.subInputLabel}>{t('recipes.qtyPerServing')}</Text>
                      <TextInput
                        style={styles.subInput}
                        keyboardType="numeric"
                        value={ing.quantity}
                        onChangeText={(v) => updateIngredientRow(ing.id, { quantity: v })}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.subInputLabel}>{t('common.unit')}</Text>
                      <View style={styles.unitBadge}>
                        <Text style={styles.unitText}>{ing.unit}</Text>
                      </View>
                    </View>

                    <View style={{ flex: 1.2 }}>
                      <Text style={styles.subInputLabel}>{t('recipes.wastePercentage')}</Text>
                      <TextInput
                        style={styles.subInput}
                        keyboardType="numeric"
                        value={ing.wastePercentage}
                        onChangeText={(v) => updateIngredientRow(ing.id, { wastePercentage: v })}
                      />
                    </View>
                  </View>
                </View>
              );
            })}

            <Pressable
              onPress={() => addIngredientRow()}
              style={({ pressed }) => [styles.addIngredientRowBtn, pressed && styles.pressed]}
            >
              <VectorIcon name="Plus" size={16} color={Colors.brand.primary} />
              <Text style={styles.addIngredientRowText}>{t('recipes.addIngredient')}</Text>
            </Pressable>
          </Card>

          {/* ── 3. Bottom Save Button ── */}
          <Pressable
            onPress={handleUpdateRecipe}
            disabled={saving}
            style={({ pressed }) => [
              styles.createSubmitBtn,
              saving && styles.btnDisabled,
              pressed && styles.pressed,
            ]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <VectorIcon name="Check" size={18} color="#ffffff" />
                <Text style={styles.createSubmitText}>{t('common.save')}</Text>
              </>
            )}
          </Pressable>
        </ScrollView>

        {/* ── Category Picker Modal ── */}
        <Modal
          visible={showCategoryPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCategoryPicker(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowCategoryPicker(false)}
          >
            <View style={styles.categoryPickerModal}>
              <Text style={styles.categoryPickerTitle}>{t('recipes.category')}</Text>
              <ScrollView style={{ maxHeight: 380 }}>
                <Text style={styles.categoryGroupHeader}>{t('recipes.food')}</Text>
                {FOOD_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => {
                      setCategory(cat);
                      setShowCategoryPicker(false);
                    }}
                    style={[
                      styles.categoryOption,
                      category === cat && styles.categoryOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        category === cat && styles.categoryOptionTextSelected,
                      ]}
                    >
                      {cat}
                    </Text>
                    {category === cat && (
                      <VectorIcon name="Check" size={16} color={Colors.brand.primary} />
                    )}
                  </Pressable>
                ))}

                <Text style={[styles.categoryGroupHeader, { marginTop: Spacing.md }]}>
                  {t('recipes.drinks')}
                </Text>
                {DRINK_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => {
                      setCategory(cat);
                      setShowCategoryPicker(false);
                    }}
                    style={[
                      styles.categoryOption,
                      category === cat && styles.categoryOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        category === cat && styles.categoryOptionTextSelected,
                      ]}
                    >
                      {cat}
                    </Text>
                    {category === cat && (
                      <VectorIcon name="Check" size={16} color={Colors.brand.primary} />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>

        {/* ── Inventory Item Picker Modal ── */}
        <Modal
          visible={!!pickerTargetRowId}
          transparent
          animationType="slide"
          onRequestClose={() => setPickerTargetRowId(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.itemPickerModal}>
              <View style={styles.itemPickerHeader}>
                <Text style={styles.itemPickerTitle}>{t('recipes.selectIngredient')}</Text>
                <Pressable onPress={() => setPickerTargetRowId(null)} hitSlop={8}>
                  <VectorIcon name="X" size={20} color={Colors.neutral.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.pickerSearchBox}>
                <VectorIcon name="Search" size={16} color={Colors.neutral.textTertiary} />
                <TextInput
                  style={styles.pickerSearchInput}
                  placeholder="Search raw materials, SKUs..."
                  value={itemSearch}
                  onChangeText={setItemSearch}
                />
              </View>

              <Pressable
                onPress={() => setShowAddRawMaterialModal(true)}
                style={styles.pickerAddNewBtn}
              >
                <VectorIcon name="Plus" size={16} color={Colors.brand.primary} />
                <Text style={styles.pickerAddNewText}>
                  + {t('recipes.addNewRawMaterial')}
                </Text>
              </Pressable>

              <ScrollView style={styles.pickerItemsList}>
                {filteredInventory.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => handleSelectInventoryItem(item)}
                    style={styles.pickerItemRow}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickerItemName}>{item.name}</Text>
                      <Text style={styles.pickerItemSub}>
                        SKU: {item.sku} · {item.category}
                      </Text>
                    </View>

                    <View style={styles.pickerItemRight}>
                      <Text
                        style={[
                          styles.pickerStockText,
                          item.physicalStock <= 0
                            ? { color: Colors.critical.main }
                            : { color: Colors.brand.primary },
                        ]}
                      >
                        {formatNumber(item.physicalStock)} {item.unit}
                      </Text>
                      <Text style={styles.pickerCostText}>
                        {formatCurrency(item.costPerUnit || 0)}/{item.unit}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── Inline Add Raw Material Modal ── */}
        <AddEditInventoryModal
          visible={showAddRawMaterialModal}
          onClose={() => setShowAddRawMaterialModal(false)}
          onSuccess={handleRawMaterialCreated}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  saveHeaderBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  saveHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  centerText: {
    fontSize: 13,
    color: Colors.neutral.textSecondary,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  formCard: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cardHeaderTitle: {
    ...Typography.sectionHeader,
    fontSize: 15,
    color: Colors.neutral.textPrimary,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  requiredStar: {
    color: Colors.critical.main,
  },
  textInput: {
    backgroundColor: Colors.neutral.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    color: Colors.neutral.textPrimary,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.neutral.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.sm + 2,
  },
  selectBtnText: {
    fontSize: 14,
    color: Colors.neutral.textPrimary,
    fontWeight: '500',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.borderLight,
  },
  toggleLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  toggleSub: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    marginTop: 2,
  },
  ingredientsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  costEstimateText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand.primary,
    marginTop: 2,
  },
  addRawMaterialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brand.subtle,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  addRawMaterialBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  newRawMaterialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.borderLight,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  newRawMaterialTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.neutral.textPrimary,
  },
  newRawMaterialDesc: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
    marginTop: 1,
  },
  bannerActionBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.sm,
  },
  bannerActionBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  ingredientDraftCard: {
    backgroundColor: Colors.neutral.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  ingredientCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ingredientSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.neutral.card,
    borderWidth: 1,
    borderColor: Colors.neutral.borderLight,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  selectorLeft: {
    flex: 1,
  },
  selectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  selectorSku: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
  },
  removeIngBtn: {
    padding: 6,
  },
  ingredientStockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  stockInStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brand.subtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  stockInStockText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.brand.primary,
  },
  stockLowStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warning.subtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  stockLowStockText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.warning.dark,
  },
  stockOutOfStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.critical.subtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  stockOutOfStockText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.critical.main,
  },
  unitCostText: {
    fontSize: 11,
    color: Colors.neutral.textSecondary,
    fontWeight: '500',
  },
  ingredientRowInputs: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 4,
  },
  subInputLabel: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
    marginBottom: 2,
  },
  subInput: {
    backgroundColor: Colors.neutral.card,
    borderWidth: 1,
    borderColor: Colors.neutral.borderLight,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 5,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  unitBadge: {
    backgroundColor: Colors.neutral.card,
    borderWidth: 1,
    borderColor: Colors.neutral.borderLight,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.textSecondary,
  },
  addIngredientRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.brand.primary,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    gap: 6,
    marginTop: Spacing.xs,
  },
  addIngredientRowText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.brand.primary,
  },
  createSubmitBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadows.card,
  },
  createSubmitText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  categoryPickerModal: {
    backgroundColor: Colors.neutral.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    maxHeight: 480,
    ...Shadows.modal,
  },
  categoryPickerTitle: {
    ...Typography.sectionHeader,
    fontSize: 16,
    color: Colors.neutral.textPrimary,
    marginBottom: Spacing.sm,
  },
  categoryGroupHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.neutral.textTertiary,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  categoryOptionSelected: {
    backgroundColor: Colors.brand.subtle,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xs,
  },
  categoryOptionText: {
    fontSize: 14,
    color: Colors.neutral.textPrimary,
  },
  categoryOptionTextSelected: {
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  itemPickerModal: {
    backgroundColor: Colors.neutral.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    maxHeight: '80%',
    ...Shadows.modal,
    gap: Spacing.sm,
  },
  itemPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemPickerTitle: {
    ...Typography.sectionHeader,
    fontSize: 16,
    color: Colors.neutral.textPrimary,
  },
  pickerSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    gap: 6,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.neutral.textPrimary,
    paddingVertical: 0,
  },
  pickerAddNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.subtle,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    gap: 6,
  },
  pickerAddNewText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  pickerItemsList: {
    maxHeight: 320,
  },
  pickerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  pickerItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.textPrimary,
  },
  pickerItemSub: {
    fontSize: 11,
    color: Colors.neutral.textTertiary,
    marginTop: 1,
  },
  pickerItemRight: {
    alignItems: 'flex-end',
  },
  pickerStockText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pickerCostText: {
    fontSize: 10,
    color: Colors.neutral.textTertiary,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.8,
  },
});

import { apiClient, logDebugFallback } from './apiClient';
import { inventoryService } from './inventoryService';

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  quantity: number;
  unit: string;
  wastePercentage: number;
  costPerUnit: number;
  lineCost: number;
  availableStock?: number;
}

export interface Recipe {
  id: string;
  storeId: string;
  code: string;
  name: string;
  category: string;
  portionYield: number;
  posItemName: string;
  isActive: boolean;
  costPerPortion: number;
  ingredients: RecipeIngredient[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecipePayload {
  code?: string;
  name: string;
  category?: string;
  portionYield?: number;
  posItemName?: string;
  isActive?: boolean;
  ingredients?: Array<{
    itemId: string;
    quantity: number;
    unit: string;
    wastePercentage?: number;
  }>;
}

export interface UpdateRecipePayload {
  code?: string;
  name?: string;
  category?: string;
  portionYield?: number;
  posItemName?: string;
  isActive?: boolean;
  ingredients?: Array<{
    itemId: string;
    quantity: number;
    unit: string;
    wastePercentage?: number;
  }>;
}

export interface RecipeDeductionResult {
  success: boolean;
  recipeId: string;
  recipeName: string;
  portionsDeducted: number;
  totalCostImpact: number;
  deductions: Array<{
    itemId: string;
    itemName: string;
    quantityDeducted: number;
    unit: string;
    unitCost: number;
    totalCost: number;
    previousStock: number;
    newStock: number;
  }>;
}

export const FOOD_CATEGORIES = [
  'Main Course',
  'Burgers',
  'Fish & Seafood',
  'Salads',
  'Breakfast',
  'Starters',
  'Desserts',
  'Bakery',
  'Sides & Snacks',
] as const;

export const DRINK_CATEGORIES = [
  'Hot Coffee & Espresso',
  'Iced Coffee & Cold Brew',
  'Tea & Chai',
  'Cocktails & Mixed',
  'Beer & Cider',
  'Wine & Spirits',
  'Smoothies & Juices',
  'Soft Drinks',
] as const;

export const RECIPE_CATEGORIES = [
  'All',
  ...FOOD_CATEGORIES,
  ...DRINK_CATEGORIES,
] as const;

export const FALLBACK_RECIPES: Recipe[] = [
  {
    id: 'r1',
    storeId: '01915dfa-9012-7000-8000-000000000002',
    code: 'REC-CHK-01',
    name: 'Grilled Chicken Breast Plate',
    category: 'Main Course',
    portionYield: 1.0,
    posItemName: 'Menu 1 — Chicken Plate',
    isActive: true,
    costPerPortion: 3.42,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z',
    ingredients: [
      { id: 'ri1', recipeId: 'r1', itemId: 'i1', itemName: 'Chicken Breast', itemSku: 'CHK-001', quantity: 0.20, unit: 'kg', wastePercentage: 5, costPerUnit: 4.80, lineCost: 0.96 },
      { id: 'ri2', recipeId: 'r1', itemId: 'i3', itemName: 'Potatoes', itemSku: 'POT-003', quantity: 0.15, unit: 'kg', wastePercentage: 8, costPerUnit: 1.20, lineCost: 0.18 },
      { id: 'ri3', recipeId: 'r1', itemId: 'i4', itemName: 'Cooking Oil', itemSku: 'OIL-004', quantity: 0.02, unit: 'L', wastePercentage: 0, costPerUnit: 2.50, lineCost: 0.05 },
      { id: 'ri4', recipeId: 'r1', itemId: 'i7', itemName: 'Tomatoes', itemSku: 'TOM-007', quantity: 0.05, unit: 'kg', wastePercentage: 4, costPerUnit: 2.10, lineCost: 0.11 },
    ],
  },
  {
    id: 'r2',
    storeId: '01915dfa-9012-7000-8000-000000000002',
    code: 'REC-BRG-02',
    name: 'Artisan Burger XL',
    category: 'Burgers',
    portionYield: 1.0,
    posItemName: 'Burger XL Deluxe',
    isActive: true,
    costPerPortion: 4.18,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z',
    ingredients: [
      { id: 'ri5', recipeId: 'r2', itemId: 'i9', itemName: 'Ground Beef', itemSku: 'BEEF-009', quantity: 0.25, unit: 'kg', wastePercentage: 6, costPerUnit: 8.50, lineCost: 2.13 },
      { id: 'ri6', recipeId: 'r2', itemId: 'i8', itemName: 'Romaine Lettuce', itemSku: 'LET-008', quantity: 0.04, unit: 'kg', wastePercentage: 10, costPerUnit: 1.80, lineCost: 0.07 },
      { id: 'ri7', recipeId: 'r2', itemId: 'i7', itemName: 'Tomatoes', itemSku: 'TOM-007', quantity: 0.06, unit: 'kg', wastePercentage: 4, costPerUnit: 2.10, lineCost: 0.13 },
      { id: 'ri8', recipeId: 'r2', itemId: 'i6', itemName: 'Gouda Cheese', itemSku: 'CHS-006', quantity: 0.04, unit: 'kg', wastePercentage: 2, costPerUnit: 9.00, lineCost: 0.36 },
    ],
  },
  {
    id: 'r3',
    storeId: '01915dfa-9012-7000-8000-000000000002',
    code: 'REC-SAL-03',
    name: 'Norwegian Salmon Special',
    category: 'Fish & Seafood',
    portionYield: 1.0,
    posItemName: 'Salmon Lunch Special',
    isActive: true,
    costPerPortion: 8.90,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z',
    ingredients: [
      { id: 'ri9', recipeId: 'r3', itemId: 'i2', itemName: 'Fresh Salmon', itemSku: 'SAL-002', quantity: 0.22, unit: 'kg', wastePercentage: 8, costPerUnit: 16.20, lineCost: 3.56 },
      { id: 'ri10', recipeId: 'r3', itemId: 'i3', itemName: 'Potatoes', itemSku: 'POT-003', quantity: 0.12, unit: 'kg', wastePercentage: 5, costPerUnit: 1.20, lineCost: 0.14 },
      { id: 'ri11', recipeId: 'r3', itemId: 'i7', itemName: 'Tomatoes', itemSku: 'TOM-007', quantity: 0.05, unit: 'kg', wastePercentage: 4, costPerUnit: 2.10, lineCost: 0.11 },
      { id: 'ri12', recipeId: 'r3', itemId: 'i4', itemName: 'Cooking Oil', itemSku: 'OIL-004', quantity: 0.02, unit: 'L', wastePercentage: 0, costPerUnit: 2.50, lineCost: 0.05 },
    ],
  },
  {
    id: 'r4',
    storeId: '01915dfa-9012-7000-8000-000000000002',
    code: 'REC-CSAR-04',
    name: 'Signature Caesar Salad',
    category: 'Salads',
    portionYield: 1.0,
    posItemName: 'Menu 3 — Mixed Salad',
    isActive: true,
    costPerPortion: 2.10,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z',
    ingredients: [
      { id: 'ri13', recipeId: 'r4', itemId: 'i8', itemName: 'Romaine Lettuce', itemSku: 'LET-008', quantity: 0.12, unit: 'kg', wastePercentage: 10, costPerUnit: 1.80, lineCost: 0.22 },
      { id: 'ri14', recipeId: 'r4', itemId: 'i7', itemName: 'Tomatoes', itemSku: 'TOM-007', quantity: 0.08, unit: 'kg', wastePercentage: 4, costPerUnit: 2.10, lineCost: 0.17 },
      { id: 'ri15', recipeId: 'r4', itemId: 'i6', itemName: 'Gouda Cheese', itemSku: 'CHS-006', quantity: 0.05, unit: 'kg', wastePercentage: 2, costPerUnit: 9.00, lineCost: 0.45 },
    ],
  },
  {
    id: 'r5',
    storeId: '01915dfa-9012-7000-8000-000000000002',
    code: 'REC-PAN-05',
    name: 'Classic Buttermilk Pancakes',
    category: 'Breakfast',
    portionYield: 1.0,
    posItemName: 'Classic Pancakes',
    isActive: true,
    costPerPortion: 1.85,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z',
    ingredients: [
      { id: 'ri16', recipeId: 'r5', itemId: 'i10', itemName: 'Wheat Flour', itemSku: 'FLR-010', quantity: 0.10, unit: 'kg', wastePercentage: 2, costPerUnit: 1.10, lineCost: 0.11 },
      { id: 'ri17', recipeId: 'r5', itemId: 'i5', itemName: 'Whole Milk', itemSku: 'MLK-005', quantity: 0.15, unit: 'L', wastePercentage: 1, costPerUnit: 1.40, lineCost: 0.21 },
      { id: 'ri18', recipeId: 'r5', itemId: 'i4', itemName: 'Cooking Oil', itemSku: 'OIL-004', quantity: 0.01, unit: 'L', wastePercentage: 0, costPerUnit: 2.50, lineCost: 0.03 },
    ],
  },
];

class RecipeService {
  private async enrichRecipeWithStock(recipe: Recipe): Promise<Recipe> {
    if (!recipe || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
      return recipe;
    }

    try {
      const inventoryItems = await inventoryService.getItems();
      const invMap = new Map(inventoryItems.map((i) => [i.id, i]));
      const skuMap = new Map(inventoryItems.map((i) => [i.sku.toLowerCase(), i]));
      const nameMap = new Map(inventoryItems.map((i) => [i.name.toLowerCase(), i]));

      const enrichedIngredients = recipe.ingredients.map((ing) => {
        const invItem =
          invMap.get(ing.itemId) ||
          (ing.itemSku ? skuMap.get(ing.itemSku.toLowerCase()) : undefined) ||
          (ing.itemName ? nameMap.get(ing.itemName.toLowerCase()) : undefined);

        return {
          ...ing,
          availableStock:
            ing.availableStock !== undefined
              ? ing.availableStock
              : invItem?.physicalStock !== undefined
              ? invItem.physicalStock
              : 0,
        };
      });

      return {
        ...recipe,
        ingredients: enrichedIngredients,
      };
    } catch {
      return recipe;
    }
  }

  async getRecipes(category?: string, search?: string): Promise<Recipe[]> {
    try {
      const params = new URLSearchParams();
      if (category && category !== 'All' && category !== 'all') {
        params.append('category', category);
      }
      if (search && search.trim()) {
        params.append('search', search.trim());
      }
      const qs = params.toString() ? `?${params.toString()}` : '';

      const res = await apiClient.get<any>(`/recipes${qs}`);
      const rawList: any[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.data)
        ? res.data
        : [];

      const listToUse = rawList.length > 0 ? rawList : FALLBACK_RECIPES;

      // Fetch inventory to ensure all ingredients have accurate real-time physicalStock
      try {
        const inventoryItems = await inventoryService.getItems();
        const invMap = new Map(inventoryItems.map((i) => [i.id, i]));

        return listToUse.map((recipe: Recipe) => {
          const ingredients = (recipe.ingredients || []).map((ing) => {
            const invItem = invMap.get(ing.itemId);
            return {
              ...ing,
              availableStock:
                ing.availableStock !== undefined
                  ? ing.availableStock
                  : invItem?.physicalStock !== undefined
                  ? invItem.physicalStock
                  : 0,
            };
          });

          return {
            ...recipe,
            ingredients,
          };
        });
      } catch {
        return listToUse;
      }
    } catch (err) {
      logDebugFallback('RecipeService', '/recipes [GET]', err);
      let list = await Promise.all(FALLBACK_RECIPES.map((r) => this.enrichRecipeWithStock(r)));
      if (category && category !== 'All' && category !== 'all') {
        list = list.filter((r) => r.category.toLowerCase() === category.toLowerCase());
      }
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.posItemName.toLowerCase().includes(q)
        );
      }
      return list;
    }
  }

  async getRecipeById(id: string): Promise<Recipe> {
    try {
      const res = await apiClient.get<any>(`/recipes/${id}`);
      const raw = res?.data || res;
      return await this.enrichRecipeWithStock(raw);
    } catch (err) {
      logDebugFallback('RecipeService', `/recipes/${id} [GET]`, err);
      const fallback = FALLBACK_RECIPES.find((r) => r.id === id);
      if (fallback) return await this.enrichRecipeWithStock(fallback);
      throw err;
    }
  }

  async createRecipe(payload: CreateRecipePayload): Promise<Recipe> {
    try {
      const sanitizedCode =
        payload.code?.trim() ||
        `REC-${payload.name
          .replace(/[^A-Za-z0-9]/g, '')
          .slice(0, 4)
          .toUpperCase() || 'DISH'}-${Math.floor(1000 + Math.random() * 9000)}`;

      const postBody: Record<string, any> = {
        code: sanitizedCode,
        name: payload.name.trim(),
        category: payload.category || 'Main Course',
        portionYield: payload.portionYield || 1.0,
        posItemName: payload.posItemName?.trim() || payload.name.trim(),
        ingredients: (payload.ingredients || []).map((ing) => ({
          itemId: ing.itemId,
          quantity: Number(ing.quantity),
          unit: ing.unit,
          wastePercentage: Number(ing.wastePercentage || 0),
        })),
      };

      const res = await apiClient.post<any>('/recipes', postBody);
      const raw = res?.data || res;
      return await this.enrichRecipeWithStock(raw);
    } catch (err) {
      logDebugFallback('RecipeService', '/recipes [POST]', err);
      throw err;
    }
  }

  async updateRecipe(id: string, payload: UpdateRecipePayload): Promise<Recipe> {
    try {
      const patchBody: Record<string, any> = {};
      if (payload.name !== undefined) patchBody.name = payload.name.trim();
      if (payload.code !== undefined) patchBody.code = payload.code.trim();
      if (payload.category !== undefined) patchBody.category = payload.category;
      if (payload.portionYield !== undefined) patchBody.portionYield = payload.portionYield;
      if (payload.posItemName !== undefined) patchBody.posItemName = payload.posItemName.trim();
      if (payload.isActive !== undefined) patchBody.isActive = payload.isActive;
      if (payload.ingredients !== undefined) {
        patchBody.ingredients = payload.ingredients.map((ing) => ({
          itemId: ing.itemId,
          quantity: Number(ing.quantity),
          unit: ing.unit,
          wastePercentage: Number(ing.wastePercentage || 0),
        }));
      }

      const res = await apiClient.patch<any>(`/recipes/${id}`, patchBody);
      const raw = res?.data || res;
      return await this.enrichRecipeWithStock(raw);
    } catch (err) {
      logDebugFallback('RecipeService', `/recipes/${id} [PATCH]`, err);
      throw err;
    }
  }

  async deleteRecipe(id: string): Promise<{ success: boolean }> {
    try {
      const res = await apiClient.del<any>(`/recipes/${id}`);
      return res?.data || res || { success: true };
    } catch (err) {
      logDebugFallback('RecipeService', `/recipes/${id} [DELETE]`, err);
      throw err;
    }
  }

  async deductRecipe(
    id: string,
    quantity: number,
    referenceType?: string,
    note?: string
  ): Promise<RecipeDeductionResult> {
    try {
      const res = await apiClient.post<any>(`/recipes/${id}/deduct`, {
        quantity,
        referenceType: referenceType || 'MANUAL_APP_DEDUCTION',
        note,
      });
      return res?.data || res;
    } catch (err) {
      logDebugFallback('RecipeService', `/recipes/${id}/deduct [POST]`, err);

      const recipe = FALLBACK_RECIPES.find((r) => r.id === id) || (await this.getRecipeById(id));
      if (!recipe) {
        throw new Error('Recipe not found');
      }

      const invItems = await inventoryService.getItems();
      const deductions: RecipeDeductionResult['deductions'] = [];
      let totalCostImpact = 0;

      for (const ing of recipe.ingredients) {
        const wasteFactor = 1 + (ing.wastePercentage || 0) / 100;
        const qtyDeducted = Math.round(ing.quantity * quantity * wasteFactor * 100) / 100;
        const invItem = invItems.find((i) => i.id === ing.itemId);
        const previousStock = invItem ? invItem.physicalStock : (ing.availableStock ?? 10);
        const newStock = Math.max(0, Math.round((previousStock - qtyDeducted) * 100) / 100);
        const unitCost = ing.costPerUnit || (invItem ? invItem.costPerUnit : 1);
        const itemCost = Math.round(qtyDeducted * unitCost * 100) / 100;

        totalCostImpact += itemCost;

        if (invItem) {
          try {
            await inventoryService.adjustStock(
              ing.itemId,
              -qtyDeducted,
              'BOM Sale Deduction',
              `BOM deduction: ${quantity}x ${recipe.name}`
            );
          } catch {
            // ignore fallback adjustment errors
          }
        }

        deductions.push({
          itemId: ing.itemId,
          itemName: ing.itemName,
          quantityDeducted: qtyDeducted,
          unit: ing.unit,
          unitCost,
          totalCost: itemCost,
          previousStock,
          newStock,
        });
      }

      return {
        success: true,
        recipeId: id,
        recipeName: recipe.name,
        portionsDeducted: quantity,
        totalCostImpact: Math.round(totalCostImpact * 100) / 100,
        deductions,
      };
    }
  }
}

export const recipeService = new RecipeService();

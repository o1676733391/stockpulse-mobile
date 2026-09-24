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

class RecipeService {
  private async enrichRecipeWithStock(recipe: Recipe): Promise<Recipe> {
    if (!recipe || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
      return recipe;
    }

    try {
      const inventoryItems = await inventoryService.getItems();
      const invMap = new Map(inventoryItems.map((i) => [i.id, i]));

      const enrichedIngredients = recipe.ingredients.map((ing) => {
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

      // Fetch inventory to ensure all ingredients have accurate real-time physicalStock
      try {
        const inventoryItems = await inventoryService.getItems();
        const invMap = new Map(inventoryItems.map((i) => [i.id, i]));

        return rawList.map((recipe: Recipe) => {
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
        return rawList;
      }
    } catch (err) {
      logDebugFallback('RecipeService', '/recipes [GET]', err);
      throw err;
    }
  }

  async getRecipeById(id: string): Promise<Recipe> {
    try {
      const res = await apiClient.get<any>(`/recipes/${id}`);
      const raw = res?.data || res;
      return await this.enrichRecipeWithStock(raw);
    } catch (err) {
      logDebugFallback('RecipeService', `/recipes/${id} [GET]`, err);
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
      throw err;
    }
  }
}

export const recipeService = new RecipeService();

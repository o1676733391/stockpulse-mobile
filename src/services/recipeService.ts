import { apiClient } from './apiClient';

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
  code: string;
  name: string;
  category?: string;
  portionYield?: number;
  posItemName?: string;
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

class RecipeService {
  async getRecipes(category?: string, search?: string): Promise<Recipe[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await apiClient.get<any>(`/recipes${qs}`);
    return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [];
  }

  async getRecipeById(id: string): Promise<Recipe> {
    const res = await apiClient.get<any>(`/recipes/${id}`);
    return res?.data || res;
  }

  async createRecipe(payload: CreateRecipePayload): Promise<Recipe> {
    const res = await apiClient.post<any>('/recipes', payload);
    return res?.data || res;
  }

  async updateRecipe(id: string, payload: UpdateRecipePayload): Promise<Recipe> {
    const res = await apiClient.patch<any>(`/recipes/${id}`, payload);
    return res?.data || res;
  }

  async deleteRecipe(id: string): Promise<{ success: boolean }> {
    const res = await apiClient.del<any>(`/recipes/${id}`);
    return res?.data || res;
  }

  async deductRecipe(
    id: string,
    quantity: number,
    referenceType?: string,
    note?: string
  ): Promise<RecipeDeductionResult> {
    const res = await apiClient.post<any>(`/recipes/${id}/deduct`, {
      quantity,
      referenceType,
      note,
    });
    return res?.data || res;
  }
}

export const recipeService = new RecipeService();

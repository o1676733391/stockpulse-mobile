export type OcrState = 'idle' | 'capturing' | 'processing' | 'review' | 'success' | 'error';

export interface RecipeIngredient {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  costPerServing: number;
  active: boolean;
  ingredients: RecipeIngredient[];
}

export interface OcrItem {
  id: string;
  artNr: string;
  item: string;
  recipeId?: string;
  qty: number;
  confidence: number;
  unitPrice?: number;
}

export interface OcrReport {
  id: string;
  reportNumber: string;
  date: string;
  shift: string;
  storeName: string;
  items: OcrItem[];
  rawImageUrl?: string;
}

export interface BomIngredientDeduction {
  itemId: string;
  itemName: string;
  delta: number;
  unit: string;
  costEur: number;
  theoreticalBefore: number;
  theoreticalAfter: number;
}

export interface BomDeductionResult {
  reportId: string;
  reportNumber: string;
  date: string;
  shift: string;
  totalPortions: number;
  menuItemCount: number;
  deductions: BomIngredientDeduction[];
  timestamp: string;
}

export type ExpiryStatus = 'critical' | 'soon' | 'expired' | 'ok';

export interface ExpiryItem {
  id: string;
  name: string;
  batch: string;
  qty: number;
  unit: string;
  days: number;
  value: number;
  costPerUnit: number;
  status: ExpiryStatus;
  category: string;
  expiryDate: string;
  suggestionId?: number;
}

export interface WasteSuggestion {
  id: number;
  item: string;
  qty: number;
  unit: string;
  days: number;
  promo: string;
  uses: string;
  usesNum: number;
  utilization: number;
  saved: string;
  recipeId: string;
  description: string;
}

export interface ExpiredItem {
  id: string;
  name: string;
  batch: string;
  qty: string;
  expiryDate: string;
  value: string;
}

export interface ExpirationSummary {
  expiredCount: number;
  next3DaysCount: number;
  next7DaysCount: number;
  totalValueAtRisk: number;
}

export type LossCategory =
  | 'spoilage_expired'
  | 'cooking_dropped'
  | 'prep_trimming'
  | 'temperature_break';

export type CancellationReason =
  | 'guest_cancelled'
  | 'kitchen_delay'
  | 'wrong_order'
  | 'quality_issue';

export interface FoodLossLog {
  id: string;
  timestamp: string;
  itemId: string;
  itemName: string;
  sku: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalLossCost: number;
  category: LossCategory;
  loggedBy: string;
  notes?: string;
}

export interface KitchenCancellation {
  id: string;
  timestamp: string;
  ticketNumber: string;
  tableNumber?: string;
  recipeId: string;
  recipeName: string;
  portions: number;
  reason: CancellationReason;
  wasPrepped: boolean; // True = dish was already cooked/prepped (food loss); False = cancelled before cooking (no food loss)
  wastedCost: number;
  cancelledBy: string;
  notes?: string;
}

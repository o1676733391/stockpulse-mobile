export type EventStatus = 'upcoming' | 'in_prep' | 'completed' | 'cancelled';

export interface EventMenuItem {
  recipeId: string;
  recipeName: string;
  category: string;
  portionCount: number;
  costPerServing: number;
}

export interface EventIngredientRequirement {
  itemId: string;
  itemName: string;
  requiredQty: number;
  currentStock: number;
  unit: string;
  shortageQty: number; // requiredQty - currentStock (if > 0)
  unitCost: number;
  shortageCost: number;
  supplierId?: string;
  supplierName?: string;
}

export interface CateringEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  status: EventStatus;
  guestCount: number;
  location: string;
  contactPerson: string;
  contactPhone?: string;
  notes?: string;
  menuItems: EventMenuItem[];
  totalEstimatedCost: number;
  ingredientRequirements: EventIngredientRequirement[];
  hasShortage: boolean;
  shortageCount: number;
  totalShortageCost: number;
  createdAt: string;
  updatedAt: string;
}

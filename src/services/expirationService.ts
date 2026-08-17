import {
  ExpiredItem,
  ExpiryItem,
  WasteSuggestion,
} from '@/types/expiration';
import { apiClient, logDebugFallback } from './apiClient';

export interface IExpirationService {
  getExpiringItems(): Promise<ExpiryItem[]>;
  getExpiredItems(): Promise<ExpiredItem[]>;
  getWasteSuggestions(): Promise<WasteSuggestion[]>;
  markItemUsed(itemId: string, qtyUsed: number): Promise<void>;
  actionSuggestion(suggestionId: number): Promise<void>;
  dismissSuggestion(suggestionId: number): Promise<void>;
  logWaste(itemId: string, batchId: string | undefined, quantity: number, reason: string): Promise<void>;
}

export const INITIAL_EXPIRY_ITEMS: ExpiryItem[] = [
  {
    id: 'e1',
    name: 'Fresh Salmon',
    batch: 'B1030',
    qty: 4.2,
    unit: 'kg',
    days: 1,
    value: 68.04,
    costPerUnit: 16.20,
    status: 'critical',
    category: 'Fish & Seafood',
    expiryDate: '11 Mar 2026',
    suggestionId: 0,
  },
  {
    id: 'e2',
    name: 'Romaine Lettuce',
    batch: 'B1033',
    qty: 3.1,
    unit: 'kg',
    days: 2,
    value: 6.82,
    costPerUnit: 2.20,
    status: 'critical',
    category: 'Vegetables',
    expiryDate: '12 Mar 2026',
    suggestionId: 1,
  },
  {
    id: 'e3',
    name: 'Whole Milk',
    batch: 'B1032',
    qty: 8,
    unit: 'L',
    days: 3,
    value: 8.80,
    costPerUnit: 1.10,
    status: 'soon',
    category: 'Dairy',
    expiryDate: '13 Mar 2026',
  },
  {
    id: 'e4',
    name: 'Ground Beef',
    batch: 'B1027',
    qty: 18,
    unit: 'kg',
    days: 3,
    value: 111.60,
    costPerUnit: 6.20,
    status: 'soon',
    category: 'Meat & Poultry',
    expiryDate: '13 Mar 2026',
    suggestionId: 2,
  },
  {
    id: 'e5',
    name: 'Chicken Breast',
    batch: 'B1024',
    qty: 10,
    unit: 'kg',
    days: 3,
    value: 48.00,
    costPerUnit: 4.80,
    status: 'soon',
    category: 'Meat & Poultry',
    expiryDate: '13 Mar 2026',
  },
  {
    id: 'e6',
    name: 'Tomatoes',
    batch: 'B1028',
    qty: 12.4,
    unit: 'kg',
    days: 6,
    value: 22.32,
    costPerUnit: 1.80,
    status: 'soon',
    category: 'Vegetables',
    expiryDate: '16 Mar 2026',
  },
];

export const INITIAL_EXPIRED_ITEMS: ExpiredItem[] = [
  { id: 'exp-1', name: 'Tomato Paste', batch: 'B1018', qty: '2.4 kg', expiryDate: '08 Mar 2026', value: '€6.00' },
  { id: 'exp-2', name: 'Cream',        batch: 'B1019', qty: '3 L',    expiryDate: '09 Mar 2026', value: '€7.50' },
];

export const INITIAL_SUGGESTIONS: WasteSuggestion[] = [
  {
    id: 0,
    item: 'Fresh Salmon',
    qty: 4.2,
    unit: 'kg',
    days: 1,
    promo: 'Salmon Lunch Special',
    uses: '3.8 kg',
    usesNum: 3.8,
    utilization: 90,
    saved: '€61.56',
    recipeId: 'r3',
    description: 'Feature salmon as the lunch special. Pairs well with the potato side already in stock.',
  },
  {
    id: 1,
    item: 'Romaine Lettuce',
    qty: 3.1,
    unit: 'kg',
    days: 2,
    promo: 'Caesar Salad Promotion',
    uses: '2.8 kg',
    usesNum: 2.8,
    utilization: 88,
    saved: '€5.72',
    recipeId: 'r4',
    description: 'Run a discounted caesar salad promotion for lunch service.',
  },
  {
    id: 2,
    item: 'Ground Beef',
    qty: 18,
    unit: 'kg',
    days: 3,
    promo: 'Burger Happy Hour',
    uses: '15 kg',
    usesNum: 15,
    utilization: 83,
    saved: '€93.00',
    recipeId: 'r2',
    description: 'Offer a happy-hour burger promotion in the evening shift.',
  },
];

export class RealExpirationService implements IExpirationService {
  private items: ExpiryItem[] = JSON.parse(JSON.stringify(INITIAL_EXPIRY_ITEMS));
  private expired: ExpiredItem[] = JSON.parse(JSON.stringify(INITIAL_EXPIRED_ITEMS));
  private suggestions: WasteSuggestion[] = JSON.parse(JSON.stringify(INITIAL_SUGGESTIONS));
  private actionedSuggestions = new Set<number>();
  private dismissedSuggestions = new Set<number>();

  async getExpiringItems(): Promise<ExpiryItem[]> {
    try {
      return await apiClient.get<ExpiryItem[]>('/expiration/expiring');
    } catch (err) {
      logDebugFallback('ExpirationService', '/expiration/expiring', err);
      return [...this.items];
    }
  }

  async getExpiredItems(): Promise<ExpiredItem[]> {
    try {
      return await apiClient.get<ExpiredItem[]>('/expiration/expired');
    } catch (err) {
      logDebugFallback('ExpirationService', '/expiration/expired', err);
      return [...this.expired];
    }
  }

  async getWasteSuggestions(): Promise<WasteSuggestion[]> {
    try {
      return await apiClient.get<WasteSuggestion[]>('/expiration/suggestions');
    } catch (err) {
      logDebugFallback('ExpirationService', '/expiration/suggestions', err);
      return this.suggestions.filter((s) => !this.dismissedSuggestions.has(s.id));
    }
  }

  async markItemUsed(itemId: string, qtyUsed: number): Promise<void> {
    const item = this.items.find((i) => i.id === itemId);
    if (!item) return;

    if (qtyUsed >= item.qty) {
      this.items = this.items.filter((i) => i.id !== itemId);
    } else {
      item.qty = Math.max(0, parseFloat((item.qty - qtyUsed).toFixed(1)));
      item.value = parseFloat((item.qty * item.costPerUnit).toFixed(2));
    }
  }

  async actionSuggestion(suggestionId: number): Promise<void> {
    this.actionedSuggestions.add(suggestionId);
  }

  async dismissSuggestion(suggestionId: number): Promise<void> {
    this.dismissedSuggestions.add(suggestionId);
  }

  async logWaste(itemId: string, batchId: string | undefined, quantity: number, reason: string): Promise<void> {
    try {
      await apiClient.post('/expiration/waste-log', { itemId, batchId, quantity, reason });
    } catch (err) {
      logDebugFallback('ExpirationService', '/expiration/waste-log', err);
    }
  }
}

export const expirationService: IExpirationService = new RealExpirationService();

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
  {
    id: 'x1',
    name: 'Heavy Cream',
    batch: 'B1019',
    qty: '4.0 L',
    value: '€14.40',
    expiryDate: '09 Mar 2026',
  },
  {
    id: 'x2',
    name: 'Strawberries',
    batch: 'B1020',
    qty: '2.5 kg',
    value: '€12.50',
    expiryDate: '08 Mar 2026',
  },
];

export const INITIAL_SUGGESTIONS: WasteSuggestion[] = [
  {
    id: 0,
    item: 'Fresh Salmon',
    qty: 4.2,
    unit: 'kg',
    days: 1,
    promo: 'Daily Chef Special',
    uses: 'Pan-seared Salmon with Asparagus (4 portions)',
    usesNum: 4,
    utilization: 96,
    saved: '€68.04',
    recipeId: 'r3',
    description: 'Feature as daily chef special before expiration tomorrow',
  },
  {
    id: 1,
    item: 'Romaine Lettuce',
    qty: 3.1,
    unit: 'kg',
    days: 2,
    promo: 'Caesar Salad Prep',
    uses: 'Caesar Salad lunch service prep',
    usesNum: 6,
    utilization: 91,
    saved: '€6.82',
    recipeId: 'r4',
    description: 'Prep for Caesar Salad bowls for lunch service prep',
  },
  {
    id: 2,
    item: 'Ground Beef',
    qty: 18,
    unit: 'kg',
    days: 3,
    promo: 'Bolognese Sauce Batch',
    uses: 'Bolognese sauce batch cooking for freezing',
    usesNum: 24,
    utilization: 94,
    saved: '€111.60',
    recipeId: 'r2',
    description: 'Prep batch Bolognese sauce for freezing & pasta service',
  },
];

export class RealExpirationService implements IExpirationService {
  async getExpiringItems(): Promise<ExpiryItem[]> {
    try {
      const res = await apiClient.get<any>('/inventory/expiring-batches');
      return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [];
    } catch (err) {
      logDebugFallback('ExpirationService', '/inventory/expiring-batches', err);
      throw err;
    }
  }

  async getExpiredItems(): Promise<ExpiredItem[]> {
    try {
      const res = await apiClient.get<any>('/inventory/expired-batches');
      return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [];
    } catch (err) {
      logDebugFallback('ExpirationService', '/inventory/expired-batches', err);
      throw err;
    }
  }

  async getWasteSuggestions(): Promise<WasteSuggestion[]> {
    try {
      const res = await apiClient.get<any>('/analytics/waste-suggestions');
      return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [];
    } catch (err) {
      logDebugFallback('ExpirationService', '/analytics/waste-suggestions', err);
      throw err;
    }
  }

  async markItemUsed(itemId: string, qtyUsed: number): Promise<void> {
    try {
      await apiClient.post(`/inventory/${itemId}/adjustments`, {
        quantityDelta: -qtyUsed,
        reason: 'used',
        notes: 'Priority prep usage from expiration tracker',
      });
    } catch (err) {
      logDebugFallback('ExpirationService', `/inventory/${itemId}/adjustments`, err);
      throw err;
    }
  }

  async actionSuggestion(suggestionId: number): Promise<void> {
    try {
      await apiClient.post(`/analytics/waste-suggestions/${suggestionId}/action`, {});
    } catch (err) {
      logDebugFallback('ExpirationService', `/analytics/waste-suggestions/${suggestionId}/action`, err);
      throw err;
    }
  }

  async dismissSuggestion(suggestionId: number): Promise<void> {
    try {
      await apiClient.post(`/analytics/waste-suggestions/${suggestionId}/dismiss`, {});
    } catch (err) {
      logDebugFallback('ExpirationService', `/analytics/waste-suggestions/${suggestionId}/dismiss`, err);
      throw err;
    }
  }

  async logWaste(
    itemId: string,
    batchId: string | undefined,
    quantity: number,
    reason: string
  ): Promise<void> {
    try {
      await apiClient.post(`/inventory/${itemId}/adjustments`, {
        quantityDelta: -quantity,
        reason: 'waste',
        notes: `Spoilage discard: ${reason}`,
        batchId,
      });
    } catch (err) {
      logDebugFallback('ExpirationService', `/inventory/${itemId}/adjustments [waste]`, err);
      throw err;
    }
  }
}

export const expirationService: IExpirationService = new RealExpirationService();

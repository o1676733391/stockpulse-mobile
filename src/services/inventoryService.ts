import { mockInventoryItems } from '@/mocks/inventoryMockData';
import { InventoryItem } from '@/types/inventory';
import { apiClient, logDebugFallback } from './apiClient';

export interface IInventoryService {
  getItems(category?: string, status?: string, search?: string): Promise<InventoryItem[]>;
  getItemById(id: string): Promise<InventoryItem | null>;
  adjustStock(itemId: string, delta: number, reason?: string, note?: string): Promise<void>;
  getCategories(): Promise<Array<{ id: string; name: string }>>;
}

export class RealInventoryService implements IInventoryService {
  private localItems: InventoryItem[] = JSON.parse(JSON.stringify(mockInventoryItems));

  async getItems(category?: string, status?: string, search?: string): Promise<InventoryItem[]> {
    try {
      const params = new URLSearchParams();
      if (category && category !== 'All') params.append('category', category);
      if (status && status !== 'All' && status !== 'all') params.append('status', status.toLowerCase());
      if (search) params.append('search', search);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const items = await apiClient.get<InventoryItem[]>(`/inventory${qs}`);
      this.localItems = items;
      return items;
    } catch (err) {
      logDebugFallback('InventoryService', '/inventory', err);
      let filtered = [...this.localItems];
      if (category && category !== 'All') {
        filtered = filtered.filter((i) => i.category.toLowerCase() === category.toLowerCase());
      }
      if (status && status !== 'All' && status !== 'all') {
        filtered = filtered.filter((i) => i.status.toLowerCase() === status.toLowerCase());
      }
      if (search) {
        filtered = filtered.filter(
          (i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase())
        );
      }
      return filtered;
    }
  }

  async getItemById(id: string): Promise<InventoryItem | null> {
    try {
      return await apiClient.get<InventoryItem>(`/inventory/${id}`);
    } catch (err) {
      logDebugFallback('InventoryService', `/inventory/${id}`, err);
      return this.localItems.find((i) => i.id === id) || null;
    }
  }

  async adjustStock(itemId: string, delta: number, reason?: string, note?: string): Promise<void> {
    try {
      await apiClient.post('/inventory/adjust', { itemId, delta, reason, note });
    } catch (err) {
      logDebugFallback('InventoryService', '/inventory/adjust', err);
      const item = this.localItems.find((i) => i.id === itemId);
      if (item) {
        item.physicalStock = Math.max(0, parseFloat((item.physicalStock + delta).toFixed(2)));
        item.transactions.unshift({
          id: `tx-${Date.now()}`,
          type: 'adjustment',
          date: 'Just now',
          user: 'Local User',
          delta,
          note: note || reason || 'Manual adjustment',
        });
      }
    }
  }

  async getCategories(): Promise<Array<{ id: string; name: string }>> {
    try {
      return await apiClient.get<Array<{ id: string; name: string }>>('/inventory/meta/categories');
    } catch (err) {
      logDebugFallback('InventoryService', '/inventory/meta/categories', err);
      return [
        { id: '1', name: 'Meat & Poultry' },
        { id: '2', name: 'Fish & Seafood' },
        { id: '3', name: 'Vegetables' },
        { id: '4', name: 'Dairy' },
        { id: '5', name: 'Dry Goods' },
      ];
    }
  }
}

export const inventoryService: IInventoryService = new RealInventoryService();

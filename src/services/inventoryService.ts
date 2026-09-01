import { InventoryItem } from '@/types/inventory';
import { apiClient, logDebugFallback } from './apiClient';

export interface IInventoryService {
  getItems(category?: string, status?: string, search?: string): Promise<InventoryItem[]>;
  getItemById(id: string): Promise<InventoryItem | null>;
  adjustStock(itemId: string, delta: number, reason?: string, note?: string, batchId?: string): Promise<void>;
  createItem(item: Partial<InventoryItem>): Promise<InventoryItem>;
  updateItem(id: string, item: Partial<InventoryItem>): Promise<InventoryItem>;
  archiveItem(id: string): Promise<void>;
  getCategories(): Promise<Array<{ id: string; name: string }>>;
}

export function normalizeInventoryItem(raw: any): InventoryItem {
  if (!raw) return raw;
  const batches = Array.isArray(raw.batches)
    ? raw.batches.map((b: any) => ({
        id: b.id || b.batchNumber || b.batch_number || '',
        quantity: Number(b.quantity || 0),
        expiryDate: b.expiryDate || b.expiry_date || '',
        daysRemaining:
          b.daysRemaining !== undefined
            ? Number(b.daysRemaining)
            : b.expiry_date || b.expiryDate
            ? Math.ceil((new Date(b.expiry_date || b.expiryDate).getTime() - Date.now()) / 86400000)
            : 99,
      }))
    : [];

  const transactions = Array.isArray(raw.recentTransactions || raw.transactions)
    ? (raw.recentTransactions || raw.transactions).map((t: any) => ({
        id: t.id || '',
        type: (t.type || t.transactionType || 'adjustment').toLowerCase(),
        date: t.date || t.createdAt || t.created_at || new Date().toISOString(),
        user: t.user || t.actorName || t.actor_name || 'Staff',
        delta: Number(t.delta || 0),
        note: t.note || t.notes || '',
      }))
    : [];

  return {
    id: raw.id,
    name: raw.name || '',
    sku: raw.sku || '',
    category: raw.category || raw.categoryName || 'General',
    unit: raw.unit || 'pcs',
    physicalStock: Number(raw.physicalStock ?? raw.physical_stock ?? 0),
    theoreticalStock: Number(raw.theoreticalStock ?? raw.theoretical_stock ?? 0),
    targetStock: Number(raw.targetStock ?? raw.target_stock ?? 0),
    safetyStock: Number(raw.safetyStock ?? raw.safety_stock ?? 0),
    costPerUnit: Number(raw.costPerUnit ?? raw.cost_per_unit ?? 0),
    supplierId: raw.supplierId || raw.supplier_id || '',
    status: raw.status || 'healthy',
    batches,
    transactions,
  };
}

export class RealInventoryService implements IInventoryService {
  async getItems(category?: string, status?: string, search?: string): Promise<InventoryItem[]> {
    try {
      const params = new URLSearchParams();
      if (category && category !== 'All') params.append('category', category);
      if (status && status !== 'All' && status !== 'all') params.append('status', status.toLowerCase());
      if (search) params.append('search', search);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await apiClient.get<any>(`/inventory${qs}`);
      
      const rawList: any[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.data)
        ? res.data
        : [];
      return rawList.map(normalizeInventoryItem);
    } catch (err) {
      logDebugFallback('InventoryService', '/inventory', err);
      throw err;
    }
  }

  async getItemById(id: string): Promise<InventoryItem | null> {
    try {
      const res = await apiClient.get<any>(`/inventory/${id}`);
      return res ? normalizeInventoryItem(res) : null;
    } catch (err) {
      logDebugFallback('InventoryService', `/inventory/${id}`, err);
      throw err;
    }
  }

  async adjustStock(
    itemId: string,
    delta: number,
    reason?: string,
    note?: string,
    batchId?: string
  ): Promise<void> {
    try {
      await apiClient.post(`/inventory/${itemId}/adjustments`, {
        quantityDelta: delta,
        reason: reason || 'Manual adjustment',
        notes: note,
        batchId,
      });
    } catch (err) {
      logDebugFallback('InventoryService', `/inventory/${itemId}/adjustments`, err);
      throw err;
    }
  }

  async createItem(item: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      return await apiClient.post<InventoryItem>('/inventory', item);
    } catch (err) {
      logDebugFallback('InventoryService', '/inventory [POST]', err);
      throw err;
    }
  }

  async updateItem(id: string, item: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      return await apiClient.patch<InventoryItem>(`/inventory/${id}`, item);
    } catch (err) {
      logDebugFallback('InventoryService', `/inventory/${id} [PATCH]`, err);
      throw err;
    }
  }

  async archiveItem(id: string): Promise<void> {
    try {
      await apiClient.del(`/inventory/${id}`);
    } catch (err) {
      logDebugFallback('InventoryService', `/inventory/${id} [DELETE]`, err);
      throw err;
    }
  }

  async getCategories(): Promise<Array<{ id: string; name: string }>> {
    try {
      return await apiClient.get<Array<{ id: string; name: string }>>('/inventory/meta/categories');
    } catch (err) {
      logDebugFallback('InventoryService', '/inventory/meta/categories', err);
      throw err;
    }
  }
}

export const inventoryService: IInventoryService = new RealInventoryService();

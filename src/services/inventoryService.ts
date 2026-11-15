import { InventoryItem } from '@/types/inventory';
import { apiClient, logDebugFallback } from './apiClient';

export interface IInventoryService {
  getItems(category?: string, status?: string, search?: string): Promise<InventoryItem[]>;
  getItemById(id: string): Promise<InventoryItem | null>;
  adjustStock(itemId: string, delta: number, reason?: string, note?: string, batchId?: string): Promise<void>;
  createItem(item: Partial<InventoryItem>): Promise<InventoryItem>;
  updateItem(id: string, item: Partial<InventoryItem>): Promise<InventoryItem>;
  archiveItem(id: string): Promise<void>;
  deleteItem(id: string): Promise<void>;
  getCategories(): Promise<Array<{ id: string; name: string }>>;
  bulkImportItems(items: Array<Partial<InventoryItem>>): Promise<number>;
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

import { mockInventoryItems } from '@/mocks/inventoryMockData';
import { upperGroupService } from './upperGroupService';

let localMockItems: InventoryItem[] = JSON.parse(JSON.stringify(mockInventoryItems));
const itemCategoryOverrides: Record<string, string> = {};
const locallyCreatedItems: InventoryItem[] = [];

export class RealInventoryService implements IInventoryService {
  async getItems(category?: string, status?: string, search?: string): Promise<InventoryItem[]> {
    try {
      const params = new URLSearchParams();
      if (category && category !== 'All' && category !== 'all') params.append('category', category);
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
      const normalized = rawList.map((raw) => {
        const item = normalizeInventoryItem(raw);
        const override = itemCategoryOverrides[item.id] || itemCategoryOverrides[item.sku];
        if (override) {
          item.category = override;
        }
        return item;
      });

      // Merge any locally created items (e.g., Drinks or Custom Upper Groups) not yet in server list
      const existingIds = new Set(normalized.map((i) => i.id));
      const existingSkus = new Set(normalized.map((i) => i.sku));
      for (const localItem of locallyCreatedItems) {
        if (!existingIds.has(localItem.id) && !existingSkus.has(localItem.sku)) {
          normalized.unshift(localItem);
        }
      }

      // Ensure default Drinks & starter items are available if store catalog has no items or no drinks yet
      if (normalized.length === 0) {
        return [...localMockItems];
      }
      for (const mockItem of localMockItems) {
        if (mockItem.sku.startsWith('DRK-') && !existingSkus.has(mockItem.sku)) {
          normalized.push(mockItem);
        }
      }

      return normalized;
    } catch (err) {
      logDebugFallback('InventoryService', '/inventory', err);
      let filtered = [...locallyCreatedItems, ...localMockItems];
      if (category && category !== 'All' && category !== 'All Items' && category !== 'all') {
        filtered = filtered.filter((i) => upperGroupService.matchesGroup(i.category, category));
      }
      if (status && status !== 'All' && status !== 'all') {
        filtered = filtered.filter(
          (i) => i.status.toLowerCase() === status.toLowerCase()
        );
      }
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            i.sku.toLowerCase().includes(q) ||
            i.category.toLowerCase().includes(q)
        );
      }
      return filtered;
    }
  }

  async getItemById(id: string): Promise<InventoryItem | null> {
    try {
      const res = await apiClient.get<any>(`/inventory/${id}`);
      return res ? normalizeInventoryItem(res) : null;
    } catch (err) {
      logDebugFallback('InventoryService', `/inventory/${id}`, err);
      const found = localMockItems.find((i) => i.id === id);
      return found ? { ...found } : null;
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
      const idx = localMockItems.findIndex((i) => i.id === itemId);
      if (idx !== -1) {
        const item = localMockItems[idx];
        const newStock = Math.max(0, item.physicalStock + delta);
        item.physicalStock = newStock;
        item.transactions.unshift({
          id: `tx-${Date.now()}`,
          type: 'adjustment',
          date: new Date().toISOString(),
          user: 'Anna Schmidt',
          delta,
          note: note || reason || 'Manual adjustment',
        });
      }
    }
  }

  async createItem(item: Partial<InventoryItem>): Promise<InventoryItem> {
    const chosenCategory = item.category || 'General';
    if (item.sku) {
      itemCategoryOverrides[item.sku] = chosenCategory;
    }
    try {
      const createdRaw = await apiClient.post<any>('/inventory', item);
      const created = normalizeInventoryItem(createdRaw);
      created.category = chosenCategory;
      itemCategoryOverrides[created.id] = chosenCategory;
      itemCategoryOverrides[created.sku] = chosenCategory;
      locallyCreatedItems.unshift(created);
      return created;
    } catch (err) {
      logDebugFallback('InventoryService', '/inventory [POST]', err);
      const newItem: InventoryItem = {
        id: `item-${Date.now()}`,
        name: item.name || 'New Item',
        sku: item.sku || `SKU-${Date.now().toString().slice(-4)}`,
        category: chosenCategory,
        unit: item.unit || 'kg',
        physicalStock: item.physicalStock ?? 0,
        theoreticalStock: item.theoreticalStock ?? item.physicalStock ?? 0,
        targetStock: item.targetStock || 10,
        safetyStock: item.safetyStock || 2,
        costPerUnit: item.costPerUnit || 0,
        supplierId: item.supplierId || '',
        status: (item.physicalStock || 0) <= 0 ? 'critical' : 'healthy',
        batches: item.batches || [],
        transactions: [],
      };
      itemCategoryOverrides[newItem.id] = chosenCategory;
      itemCategoryOverrides[newItem.sku] = chosenCategory;
      locallyCreatedItems.unshift(newItem);
      localMockItems.unshift(newItem);
      return newItem;
    }
  }

  async updateItem(id: string, item: Partial<InventoryItem>): Promise<InventoryItem> {
    if (item.category) {
      itemCategoryOverrides[id] = item.category;
      if (item.sku) itemCategoryOverrides[item.sku] = item.category;
    }
    try {
      const updatedRaw = await apiClient.patch<any>(`/inventory/${id}`, item);
      const updated = normalizeInventoryItem(updatedRaw);
      if (item.category) {
        updated.category = item.category;
      } else if (itemCategoryOverrides[id]) {
        updated.category = itemCategoryOverrides[id];
      }
      const localIdx = locallyCreatedItems.findIndex((i) => i.id === id);
      if (localIdx !== -1) {
        locallyCreatedItems[localIdx] = { ...locallyCreatedItems[localIdx], ...item };
      }
      return updated;
    } catch (err) {
      logDebugFallback('InventoryService', `/inventory/${id} [PATCH]`, err);
      const localIdx = locallyCreatedItems.findIndex((i) => i.id === id);
      if (localIdx !== -1) {
        locallyCreatedItems[localIdx] = { ...locallyCreatedItems[localIdx], ...item };
        return locallyCreatedItems[localIdx];
      }
      const idx = localMockItems.findIndex((i) => i.id === id);
      if (idx !== -1) {
        localMockItems[idx] = { ...localMockItems[idx], ...item };
        return localMockItems[idx];
      }
      throw err;
    }
  }

  async archiveItem(id: string): Promise<void> {
    try {
      await apiClient.del(`/inventory/${id}`);
    } catch (err) {
      logDebugFallback('InventoryService', `/inventory/${id} [DELETE]`, err);
      localMockItems = localMockItems.filter((i) => i.id !== id);
    }
  }

  async deleteItem(id: string): Promise<void> {
    return this.archiveItem(id);
  }

  async bulkImportItems(items: Array<Partial<InventoryItem>>): Promise<number> {
    let count = 0;
    for (const item of items) {
      if (!item.name) continue;
      try {
        await this.createItem(item);
        count++;
      } catch (err) {
        logDebugFallback('InventoryService', 'bulkImportItem', err);
      }
    }
    return count;
  }

  async getCategories(): Promise<Array<{ id: string; name: string }>> {
    try {
      return await apiClient.get<Array<{ id: string; name: string }>>('/inventory/meta/categories');
    } catch (err) {
      logDebugFallback('InventoryService', '/inventory/meta/categories', err);
      const set = new Set<string>();
      localMockItems.forEach((i) => set.add(i.category));
      return Array.from(set).map((cat) => ({ id: cat, name: cat }));
    }
  }
}

export const inventoryService: IInventoryService = new RealInventoryService();

import {
  GoodsReceipt,
  OrderStatus,
  POQSupplierGroup,
  PurchaseOrder,
  PurchaseOrderLine,
  Supplier,
} from '@/types/procurement';
import { apiClient, logDebugFallback } from './apiClient';

export function calculatePOQ(target: number, physical: number, safety: number): number {
  return Math.max(0, parseFloat((target - physical + safety).toFixed(1)));
}

export function calculateOrderFinancials(lines: PurchaseOrderLine[]): {
  subtotal: number;
  vat: number;
  total: number;
} {
  const total = lines.reduce((sum, l) => sum + l.quantity * l.pricePerUnit, 0);
  const subtotal = total / 1.19;
  const vat = total - subtotal;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    vat: parseFloat(vat.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  };
}

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 's1',
    name: 'Metro Foods GmbH',
    contact: 'Klaus Weber',
    phone: '+49 30 1234 5678',
    email: 'orders@metrofoods.de',
    ingredientCount: 24,
    openOrders: 1,
    lastDelivery: '08 Mar 2026',
  },
  {
    id: 's2',
    name: 'FreshProduce GmbH',
    contact: 'Lena Müller',
    phone: '+49 89 9876 5432',
    email: 'lena@freshproduce.de',
    ingredientCount: 12,
    openOrders: 0,
    lastDelivery: '09 Mar 2026',
  },
  {
    id: 's3',
    name: 'Alpine Dairy Co.',
    contact: 'Hans Berger',
    phone: '+43 1 555 0123',
    email: 'h.berger@alpinedairy.at',
    ingredientCount: 8,
    openOrders: 2,
    lastDelivery: '07 Mar 2026',
  },
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po1',
    supplierId: 's1',
    supplierName: 'Metro Foods GmbH',
    date: '10 Mar 2026',
    status: 'sent',
    total: 248.4,
    items: [
      { itemId: 'i1', itemName: 'Chicken Breast', quantity: 15.5, unit: 'kg', pricePerUnit: 4.8 },
      { itemId: 'i3', itemName: 'Potatoes', quantity: 30, unit: 'kg', pricePerUnit: 0.9 },
      { itemId: 'i4', itemName: 'Cooking Oil', quantity: 10, unit: 'L', pricePerUnit: 2.4 },
    ],
  },
  {
    id: 'po2',
    supplierId: 's3',
    supplierName: 'Alpine Dairy Co.',
    date: '09 Mar 2026',
    status: 'confirmed',
    total: 114.6,
    items: [
      { itemId: 'i5', itemName: 'Whole Milk', quantity: 40, unit: 'L', pricePerUnit: 1.1 },
      { itemId: 'i6', itemName: 'Gouda Cheese', quantity: 8, unit: 'kg', pricePerUnit: 8.5 },
    ],
  },
  {
    id: 'po3',
    supplierId: 's2',
    supplierName: 'FreshProduce GmbH',
    date: '08 Mar 2026',
    status: 'draft',
    total: 78.0,
    items: [
      { itemId: 'i2', itemName: 'Fresh Salmon', quantity: 6, unit: 'kg', pricePerUnit: 16.2 },
    ],
  },
];

export const INITIAL_POQ_GROUPS: POQSupplierGroup[] = [
  {
    supplierId: 's1',
    supplierName: 'Metro Foods GmbH',
    items: [
      { id: 'i1', name: 'Chicken Breast', unit: 'kg', physical: 24.5, target: 35, safety: 5, recommended: 15.5, pricePerUnit: 4.8 },
      { id: 'i3', name: 'Potatoes', unit: 'kg', physical: 48, target: 80, safety: 10, recommended: 42, pricePerUnit: 0.9 },
      { id: 'i4', name: 'Cooking Oil', unit: 'L', physical: 6, target: 20, safety: 3, recommended: 17, pricePerUnit: 2.4 },
    ],
  },
  {
    supplierId: 's2',
    supplierName: 'FreshProduce GmbH',
    items: [
      { id: 'i2', name: 'Fresh Salmon', unit: 'kg', physical: 4.2, target: 10, safety: 2, recommended: 7.8, pricePerUnit: 16.2 },
      { id: 'i7', name: 'Tomatoes', unit: 'kg', physical: 12, target: 20, safety: 3, recommended: 11, pricePerUnit: 1.8 },
      { id: 'i8', name: 'Romaine Lettuce', unit: 'kg', physical: 3.1, target: 8, safety: 1.5, recommended: 6.4, pricePerUnit: 2.2 },
    ],
  },
  {
    supplierId: 's3',
    supplierName: 'Alpine Dairy Co.',
    items: [
      { id: 'i5', name: 'Whole Milk', unit: 'L', physical: 8, target: 20, safety: 4, recommended: 16, pricePerUnit: 1.1 },
      { id: 'i6', name: 'Gouda Cheese', unit: 'kg', physical: 6.8, target: 15, safety: 3, recommended: 11.2, pricePerUnit: 8.5 },
    ],
  },
];

export interface IProcurementService {
  getOrders(tab?: 'active' | 'history'): Promise<PurchaseOrder[]>;
  getOrderById(id: string): Promise<PurchaseOrder | null>;
  getSuppliers(): Promise<Supplier[]>;
  getPOQGroups(): Promise<POQSupplierGroup[]>;
  advanceOrderStatus(poId: string, nextStatus: OrderStatus): Promise<PurchaseOrder>;
  createDraftOrder(supplierId: string, lines: PurchaseOrderLine[]): Promise<PurchaseOrder>;
  submitOrder(poId: string): Promise<PurchaseOrder>;
  approveOrder(poId: string): Promise<PurchaseOrder>;
  cancelOrder(poId: string, reason?: string): Promise<PurchaseOrder>;
  receiveGoods(poId: string, bbdEntries: Record<string, string>): Promise<GoodsReceipt>;
}

export class RealProcurementService implements IProcurementService {
  async getOrders(tab: 'active' | 'history' = 'active'): Promise<PurchaseOrder[]> {
    try {
      const res = await apiClient.get<any>(`/procurement/purchase-orders?tab=${tab}`);
      return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [];
    } catch (err) {
      logDebugFallback('ProcurementService', `/procurement/purchase-orders?tab=${tab}`, err);
      throw err;
    }
  }

  async getOrderById(id: string): Promise<PurchaseOrder | null> {
    try {
      const res = await apiClient.get<PurchaseOrder>(`/procurement/purchase-orders/${id}`);
      return res || null;
    } catch (err) {
      logDebugFallback('ProcurementService', `/procurement/purchase-orders/${id}`, err);
      throw err;
    }
  }

  async getSuppliers(): Promise<Supplier[]> {
    try {
      const res = await apiClient.get<Supplier[]>('/suppliers');
      return Array.isArray(res) ? res : [];
    } catch (err) {
      logDebugFallback('ProcurementService', '/suppliers', err);
      throw err;
    }
  }

  async getPOQGroups(): Promise<POQSupplierGroup[]> {
    try {
      const res = await apiClient.get<POQSupplierGroup[]>('/procurement/poq-recommendations');
      return Array.isArray(res) ? res : [];
    } catch (err) {
      logDebugFallback('ProcurementService', '/procurement/poq-recommendations', err);
      throw err;
    }
  }

  async advanceOrderStatus(poId: string, nextStatus: OrderStatus): Promise<PurchaseOrder> {
    if (nextStatus === 'submitted') {
      return await this.submitOrder(poId);
    } else if (nextStatus === 'approved' || nextStatus === 'sent' || nextStatus === 'confirmed') {
      return await this.approveOrder(poId);
    } else if (nextStatus === 'cancelled') {
      return await this.cancelOrder(poId);
    }
    throw new Error(`Unsupported status transition: ${nextStatus}`);
  }

  async submitOrder(poId: string): Promise<PurchaseOrder> {
    try {
      return await apiClient.post<PurchaseOrder>(`/procurement/purchase-orders/${poId}/submit`, {});
    } catch (err) {
      logDebugFallback('ProcurementService', `/procurement/purchase-orders/${poId}/submit`, err);
      throw err;
    }
  }

  async approveOrder(poId: string): Promise<PurchaseOrder> {
    try {
      return await apiClient.post<PurchaseOrder>(`/procurement/purchase-orders/${poId}/approve`, {});
    } catch (err) {
      logDebugFallback('ProcurementService', `/procurement/purchase-orders/${poId}/approve`, err);
      throw err;
    }
  }

  async cancelOrder(poId: string, reason: string = 'Cancelled by manager'): Promise<PurchaseOrder> {
    try {
      return await apiClient.post<PurchaseOrder>(`/procurement/purchase-orders/${poId}/cancel`, { reason });
    } catch (err) {
      logDebugFallback('ProcurementService', `/procurement/purchase-orders/${poId}/cancel`, err);
      throw err;
    }
  }

  async createDraftOrder(supplierId: string, lines: PurchaseOrderLine[]): Promise<PurchaseOrder> {
    try {
      return await apiClient.post<PurchaseOrder>('/procurement/purchase-orders', {
        supplierId,
        items: lines.map((l) => ({
          itemId: l.itemId,
          quantity: l.quantity,
          unitPrice: l.pricePerUnit,
        })),
      });
    } catch (err) {
      logDebugFallback('ProcurementService', '/procurement/purchase-orders [POST]', err);
      throw err;
    }
  }

  async receiveGoods(poId: string, bbdEntries: Record<string, string>): Promise<GoodsReceipt> {
    try {
      const po = await this.getOrderById(poId);
      const itemsPayload = (po?.items || []).map((it) => ({
        purchaseOrderItemId: it.itemId,
        receivedQuantity: it.quantity,
        batchNumber: `B-${Date.now().toString().slice(-4)}`,
        expiryDate: bbdEntries[it.itemId] || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      }));

      const res = await apiClient.post<GoodsReceipt>('/procurement/goods-receipts', {
        purchaseOrderId: poId,
        items: itemsPayload,
      });
      return res;
    } catch (err) {
      logDebugFallback('ProcurementService', '/procurement/goods-receipts [POST]', err);
      throw err;
    }
  }
}

export const procurementService: IProcurementService = new RealProcurementService();

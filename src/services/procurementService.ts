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
    total: 248.40,
    items: [
      { itemId: 'i1', itemName: 'Chicken Breast', quantity: 15.5, unit: 'kg', pricePerUnit: 4.80 },
      { itemId: 'i3', itemName: 'Potatoes',       quantity: 30,   unit: 'kg', pricePerUnit: 0.90 },
      { itemId: 'i4', itemName: 'Cooking Oil',    quantity: 10,   unit: 'L',  pricePerUnit: 2.40 },
    ],
  },
  {
    id: 'po2',
    supplierId: 's3',
    supplierName: 'Alpine Dairy Co.',
    date: '09 Mar 2026',
    status: 'confirmed',
    total: 114.60,
    items: [
      { itemId: 'i5', itemName: 'Whole Milk',   quantity: 40, unit: 'L',  pricePerUnit: 1.10 },
      { itemId: 'i6', itemName: 'Gouda Cheese', quantity: 8,  unit: 'kg', pricePerUnit: 8.50 },
    ],
  },
  {
    id: 'po3',
    supplierId: 's2',
    supplierName: 'FreshProduce GmbH',
    date: '08 Mar 2026',
    status: 'draft',
    total: 78.00,
    items: [
      { itemId: 'i2', itemName: 'Fresh Salmon', quantity: 6, unit: 'kg', pricePerUnit: 16.20 },
    ],
  },
];

export const INITIAL_POQ_GROUPS: POQSupplierGroup[] = [
  {
    supplierId: 's1',
    supplierName: 'Metro Foods GmbH',
    items: [
      { id: 'i1', name: 'Chicken Breast', unit: 'kg', physical: 24.5, target: 35, safety: 5,   recommended: 15.5, pricePerUnit: 4.80 },
      { id: 'i3', name: 'Potatoes',       unit: 'kg', physical: 48,   target: 80, safety: 10,  recommended: 42,   pricePerUnit: 0.90 },
      { id: 'i4', name: 'Cooking Oil',    unit: 'L',  physical: 6,    target: 20, safety: 3,   recommended: 17,   pricePerUnit: 2.40 },
    ],
  },
  {
    supplierId: 's2',
    supplierName: 'FreshProduce GmbH',
    items: [
      { id: 'i2', name: 'Fresh Salmon',    unit: 'kg', physical: 4.2, target: 10, safety: 2,   recommended: 7.8, pricePerUnit: 16.20 },
      { id: 'i7', name: 'Tomatoes',        unit: 'kg', physical: 12,  target: 20, safety: 3,   recommended: 11,  pricePerUnit: 1.80 },
      { id: 'i8', name: 'Romaine Lettuce', unit: 'kg', physical: 3.1, target: 8,  safety: 1.5, recommended: 6.4, pricePerUnit: 2.20 },
    ],
  },
  {
    supplierId: 's3',
    supplierName: 'Alpine Dairy Co.',
    items: [
      { id: 'i5', name: 'Whole Milk',   unit: 'L',  physical: 8,   target: 20, safety: 4, recommended: 16,  pricePerUnit: 1.10 },
      { id: 'i6', name: 'Gouda Cheese', unit: 'kg', physical: 6.8, target: 15, safety: 3, recommended: 11.2, pricePerUnit: 8.50 },
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
  receiveGoods(poId: string, bbdEntries: Record<string, string>): Promise<GoodsReceipt>;
}

export class RealProcurementService implements IProcurementService {
  private orders: PurchaseOrder[] = JSON.parse(JSON.stringify(INITIAL_PURCHASE_ORDERS));
  private suppliers: Supplier[] = JSON.parse(JSON.stringify(INITIAL_SUPPLIERS));
  private poqGroups: POQSupplierGroup[] = JSON.parse(JSON.stringify(INITIAL_POQ_GROUPS));

  async getOrders(tab: 'active' | 'history' = 'active'): Promise<PurchaseOrder[]> {
    try {
      return await apiClient.get<PurchaseOrder[]>(`/procurement/orders?tab=${tab}`);
    } catch (err) {
      logDebugFallback('ProcurementService', `/procurement/orders?tab=${tab}`, err);
      if (tab === 'history') {
        return this.orders.filter((p) => p.status === 'received');
      }
      return this.orders.filter((p) => p.status !== 'received');
    }
  }

  async getOrderById(id: string): Promise<PurchaseOrder | null> {
    try {
      const orders = await this.getOrders('active');
      const found = orders.find((p) => p.id === id);
      if (found) return found;
      const history = await this.getOrders('history');
      return history.find((p) => p.id === id) || null;
    } catch (err) {
      logDebugFallback('ProcurementService', `/procurement/orders/${id}`, err);
      return this.orders.find((p) => p.id === id) || this.orders[0] || null;
    }
  }

  async getSuppliers(): Promise<Supplier[]> {
    try {
      return await apiClient.get<Supplier[]>('/procurement/suppliers');
    } catch (err) {
      logDebugFallback('ProcurementService', '/procurement/suppliers', err);
      return [...this.suppliers];
    }
  }

  async getPOQGroups(): Promise<POQSupplierGroup[]> {
    try {
      return await apiClient.get<POQSupplierGroup[]>('/procurement/poq-recommendations');
    } catch (err) {
      logDebugFallback('ProcurementService', '/procurement/poq-recommendations', err);
      return [...this.poqGroups];
    }
  }

  async advanceOrderStatus(poId: string, nextStatus: OrderStatus): Promise<PurchaseOrder> {
    const po = this.orders.find((p) => p.id === poId);
    if (!po) throw new Error(`PO not found: ${poId}`);
    po.status = nextStatus;
    return { ...po };
  }

  async createDraftOrder(supplierId: string, lines: PurchaseOrderLine[]): Promise<PurchaseOrder> {
    try {
      return await apiClient.post<PurchaseOrder>('/procurement/orders', {
        supplierId,
        items: lines,
      });
    } catch (err) {
      logDebugFallback('ProcurementService', '/procurement/orders', err);
      const supplier = this.suppliers.find((s) => s.id === supplierId);
      const { total } = calculateOrderFinancials(lines);

      const newPO: PurchaseOrder = {
        id: `po-${Date.now()}`,
        supplierId,
        supplierName: supplier?.name || 'Supplier',
        date: 'Today, 10 Mar',
        status: 'draft',
        total,
        items: lines,
      };

      this.orders.unshift(newPO);
      return newPO;
    }
  }

  async receiveGoods(poId: string, bbdEntries: Record<string, string>): Promise<GoodsReceipt> {
    try {
      const res = await apiClient.post<any>('/procurement/goods-receipt', {
        poId,
        bbdEntries,
      });

      const po = this.orders.find((p) => p.id === poId);
      if (po) po.status = 'received';

      return {
        id: res.goodsReceiptId || `gr-${Date.now()}`,
        poId,
        supplierId: po?.supplierId || 's1',
        supplierName: po?.supplierName || 'Supplier',
        invoiceNumber: res.invoiceNumber || `INV-${Date.now().toString().slice(-5)}`,
        date: '10 Mar 2026',
        total: po?.total || 100,
        status: 'received',
        items: (po?.items || []).map((item) => ({
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          pricePerUnit: item.pricePerUnit,
          bbd: bbdEntries[item.itemName] || '30 Mar 2026',
        })),
      };
    } catch (err) {
      logDebugFallback('ProcurementService', '/procurement/goods-receipt', err);
      const po = this.orders.find((p) => p.id === poId);
      if (!po) throw new Error(`PO not found: ${poId}`);
      po.status = 'received';

      return {
        id: `gr-${Date.now()}`,
        poId: po.id,
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        invoiceNumber: `INV-${Date.now().toString().slice(-5)}`,
        date: '10 Mar 2026',
        total: po.total,
        status: 'received',
        items: po.items.map((item) => ({
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          pricePerUnit: item.pricePerUnit,
          bbd: bbdEntries[item.itemName] || '30 Mar 2026',
        })),
      };
    }
  }
}

export const procurementService: IProcurementService = new RealProcurementService();

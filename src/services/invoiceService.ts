import { Invoice, InvoiceStatus, InvoiceType } from '@/types/invoices';
import { apiClient, logDebugFallback } from './apiClient';

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-101',
    invoiceNumber: 'INV-20481',
    type: 'supplier_delivery',
    supplierId: 's1',
    supplierName: 'Metro Foods GmbH',
    date: '08 Mar 2026',
    dueDate: '22 Mar 2026',
    status: 'verified',
    subtotal: 708.0,
    taxAmount: 134.5,
    totalAmount: 842.5,
    currency: 'EUR',
    itemCount: 3,
    paymentStatus: 'paid',
    verifiedBy: 'Marco Bauer',
    purchaseOrderId: 'po1',
    deliveryNoteId: 'dn-101',
    items: [
      {
        id: 'li-1',
        description: 'Fresh Chicken Breast Fillet',
        sku: 'CHK-001',
        quantity: 20,
        unit: 'kg',
        unitPrice: 4.8,
        totalPrice: 96.0,
        matchedItemId: 'i1',
      },
      {
        id: 'li-2',
        description: 'Potatoes Agria (25kg Sacks)',
        sku: 'POT-003',
        quantity: 50,
        unit: 'kg',
        unitPrice: 0.9,
        totalPrice: 45.0,
        matchedItemId: 'i3',
      },
      {
        id: 'li-3',
        description: 'Rapeseed Cooking Oil 10L Canister',
        sku: 'OIL-004',
        quantity: 15,
        unit: 'L',
        unitPrice: 2.4,
        totalPrice: 36.0,
        matchedItemId: 'i4',
      },
    ],
    notes: 'Inbound delivery matched with PO-20481.',
  },
  {
    id: 'inv-102',
    invoiceNumber: 'INV-20479',
    type: 'supplier_delivery',
    supplierId: 's2',
    supplierName: 'FreshProduce GmbH',
    date: '09 Mar 2026',
    dueDate: '23 Mar 2026',
    status: 'verified',
    subtotal: 119.58,
    taxAmount: 22.72,
    totalAmount: 142.3,
    currency: 'EUR',
    itemCount: 2,
    paymentStatus: 'unpaid',
    verifiedBy: 'Marco Bauer',
    purchaseOrderId: 'po3',
    deliveryNoteId: 'dn-102',
    items: [
      {
        id: 'li-4',
        description: 'Fresh Atlantic Salmon Portion',
        sku: 'SAL-002',
        quantity: 6,
        unit: 'kg',
        unitPrice: 16.2,
        totalPrice: 97.2,
        matchedItemId: 'i2',
      },
      {
        id: 'li-5',
        description: 'Vine Tomatoes Grade A',
        sku: 'TOM-007',
        quantity: 15,
        unit: 'kg',
        unitPrice: 1.8,
        totalPrice: 27.0,
        matchedItemId: 'i7',
      },
    ],
    notes: 'Delivered at +2.8°C refrigerated compliant.',
  },
  {
    id: 'inv-103',
    invoiceNumber: 'POS-REC-4091',
    type: 'order_receipt',
    customerReference: 'Dinner Shift Register #2',
    date: '10 Mar 2026',
    status: 'verified',
    subtotal: 1248.0,
    taxAmount: 237.12,
    totalAmount: 1485.12,
    currency: 'EUR',
    itemCount: 4,
    paymentStatus: 'paid',
    verifiedBy: 'Anna Schmidt',
    items: [
      {
        id: 'li-6',
        description: 'Menu 1 — Chicken Plate',
        quantity: 24,
        unit: 'portion',
        unitPrice: 16.5,
        totalPrice: 396.0,
        matchedRecipeId: 'r1',
      },
      {
        id: 'li-7',
        description: 'Burger XL Deluxe',
        quantity: 18,
        unit: 'portion',
        unitPrice: 15.0,
        totalPrice: 270.0,
        matchedRecipeId: 'r2',
      },
      {
        id: 'li-8',
        description: 'Salmon Lunch Special',
        quantity: 12,
        unit: 'portion',
        unitPrice: 22.5,
        totalPrice: 270.0,
        matchedRecipeId: 'r3',
      },
      {
        id: 'li-9',
        description: 'Menu 3 — Mixed Salad',
        quantity: 10,
        unit: 'portion',
        unitPrice: 11.5,
        totalPrice: 115.0,
        matchedRecipeId: 'r4',
      },
    ],
    notes: 'Daily register closure receipt with automatic BOM stock deduction.',
  },
  {
    id: 'inv-104',
    invoiceNumber: 'INV-20490',
    type: 'supplier_delivery',
    supplierId: 's3',
    supplierName: 'Alpine Dairy Co.',
    date: '10 Mar 2026',
    dueDate: '24 Mar 2026',
    status: 'discrepancy',
    subtotal: 105.0,
    taxAmount: 19.95,
    totalAmount: 124.95,
    skipDeductionAmount: 5.50,
    skipDeductionReason: 'Shortage: 5L fresh milk short upon dock receiving check',
    netPayableAmount: 119.45,
    currency: 'EUR',
    itemCount: 2,
    paymentStatus: 'unpaid',
    verifiedBy: 'Anna Schmidt',
    purchaseOrderId: 'po2',
    deliveryNoteId: 'dn-103',
    items: [
      {
        id: 'li-10',
        description: 'Whole Fresh Milk 3.8% Fat',
        sku: 'MLK-005',
        quantity: 35,
        unit: 'L',
        unitPrice: 1.1,
        totalPrice: 38.5,
        matchedItemId: 'i5',
      },
      {
        id: 'li-11',
        description: 'Gouda Cheese Aged Block',
        sku: 'CHS-006',
        quantity: 8,
        unit: 'kg',
        unitPrice: 8.5,
        totalPrice: 68.0,
        matchedItemId: 'i6',
      },
    ],
    notes: 'Discrepancy: PO ordered 40L Milk, supplier delivered 35L (5L shortage). Skip deduction of €5.50 applied directly to supplier debt balance.',
  },
  {
    id: 'inv-105',
    invoiceNumber: 'POS-REC-4098',
    type: 'order_receipt',
    customerReference: 'Lunch Buffet Event Voucher',
    date: '10 Mar 2026',
    status: 'pending',
    subtotal: 420.0,
    taxAmount: 79.8,
    totalAmount: 499.8,
    currency: 'EUR',
    itemCount: 2,
    paymentStatus: 'paid',
    items: [
      {
        id: 'li-12',
        description: 'Menu 1 — Chicken Plate',
        quantity: 20,
        unit: 'portion',
        unitPrice: 16.5,
        totalPrice: 330.0,
        matchedRecipeId: 'r1',
      },
      {
        id: 'li-13',
        description: 'Menu 3 — Mixed Salad',
        quantity: 15,
        unit: 'portion',
        unitPrice: 11.5,
        totalPrice: 172.5,
        matchedRecipeId: 'r4',
      },
    ],
    notes: 'Awaiting end-of-shift supervisor confirmation.',
  },
];

let localInvoices = [...INITIAL_INVOICES];

export interface IInvoiceService {
  getInvoices(filters?: { type?: InvoiceType; status?: InvoiceStatus; search?: string }): Promise<Invoice[]>;
  getInvoiceById(id: string): Promise<Invoice | null>;
  createInvoice(payload: Partial<Invoice>): Promise<Invoice>;
  updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice>;
  applySkipDeduction(id: string, deductionAmount: number, reason: string): Promise<Invoice>;
  recordPayment(id: string): Promise<Invoice>;
  updateInvoiceNotes(id: string, notes: string): Promise<Invoice>;
}

export class RealInvoiceService implements IInvoiceService {
  async getInvoices(filters?: { type?: InvoiceType; status?: InvoiceStatus; search?: string }): Promise<Invoice[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      const qs = params.toString() ? `?${params.toString()}` : '';

      const res = await apiClient.get<any>(`/procurement/invoices${qs}`);
      const list = Array.isArray(res) ? res : res?.items || res?.data;
      if (Array.isArray(list)) return list;
      return apiClient.isFallbackEnabled() ? this.filterLocal(filters) : [];
    } catch (err) {
      logDebugFallback('InvoiceService', '/procurement/invoices [GET]', err);
      return apiClient.isFallbackEnabled() ? this.filterLocal(filters) : [];
    }
  }

  private filterLocal(filters?: { type?: InvoiceType; status?: InvoiceStatus; search?: string }): Invoice[] {
    let result = [...localInvoices];
    if (filters?.type) {
      result = result.filter((i) => i.type === filters.type);
    }
    if (filters?.status) {
      result = result.filter((i) => i.status === filters.status);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(q) ||
          (i.supplierName && i.supplierName.toLowerCase().includes(q)) ||
          (i.customerReference && i.customerReference.toLowerCase().includes(q)) ||
          i.items.some((item) => item.description.toLowerCase().includes(q))
      );
    }
    return result;
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    try {
      const res = await apiClient.get<Invoice>(`/procurement/invoices/${id}`);
      return res || localInvoices.find((i) => i.id === id) || null;
    } catch (err) {
      logDebugFallback('InvoiceService', `/procurement/invoices/${id}`, err);
      return localInvoices.find((i) => i.id === id) || null;
    }
  }

  async createInvoice(payload: Partial<Invoice>): Promise<Invoice> {
    const newInv: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: payload.invoiceNumber || `INV-${Math.floor(10000 + Math.random() * 90000)}`,
      type: payload.type || 'supplier_delivery',
      supplierId: payload.supplierId,
      supplierName: payload.supplierName,
      customerReference: payload.customerReference,
      date: payload.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      dueDate: payload.dueDate,
      status: payload.status || 'pending',
      subtotal: payload.subtotal || 0,
      taxAmount: payload.taxAmount || 0,
      totalAmount: payload.totalAmount || (payload.subtotal || 0) + (payload.taxAmount || 0),
      currency: payload.currency || 'EUR',
      itemCount: payload.items?.length || 0,
      items: payload.items || [],
      notes: payload.notes,
      paymentStatus: payload.paymentStatus || 'unpaid',
      purchaseOrderId: payload.purchaseOrderId,
      deliveryNoteId: payload.deliveryNoteId,
    };

    localInvoices.unshift(newInv);
    try {
      await apiClient.post('/procurement/invoices', newInv);
    } catch {
      // safe fallback to local state
    }
    return newInv;
  }

  async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    const idx = localInvoices.findIndex((i) => i.id === id);
    if (idx !== -1) {
      localInvoices[idx] = { ...localInvoices[idx], status };
      try {
        await apiClient.patch(`/procurement/invoices/${id}`, { status });
      } catch {
        // safe fallback
      }
      return localInvoices[idx];
    }
    throw new Error('Invoice not found');
  }

  async applySkipDeduction(id: string, deductionAmount: number, reason: string): Promise<Invoice> {
    const idx = localInvoices.findIndex((i) => i.id === id);
    if (idx !== -1) {
      const inv = localInvoices[idx];
      const validDeduction = Math.min(inv.totalAmount, Math.max(0, deductionAmount));
      const net = Math.max(0, inv.totalAmount - validDeduction);
      localInvoices[idx] = {
        ...inv,
        skipDeductionAmount: validDeduction,
        skipDeductionReason: reason,
        netPayableAmount: net,
      };
      try {
        await apiClient.patch(`/procurement/invoices/${id}`, {
          skipDeductionAmount: validDeduction,
          skipDeductionReason: reason,
          netPayableAmount: net,
        });
      } catch {
        // safe fallback
      }
      return localInvoices[idx];
    }
    throw new Error('Invoice not found');
  }

  async recordPayment(id: string): Promise<Invoice> {
    const idx = localInvoices.findIndex((i) => i.id === id);
    if (idx !== -1) {
      localInvoices[idx] = {
        ...localInvoices[idx],
        paymentStatus: 'paid',
        status: 'paid',
      };
      try {
        await apiClient.patch(`/procurement/invoices/${id}`, {
          paymentStatus: 'paid',
          status: 'paid',
        });
      } catch {
        // safe fallback
      }
      return localInvoices[idx];
    }
    throw new Error('Invoice not found');
  }

  async updateInvoiceNotes(id: string, notes: string): Promise<Invoice> {
    const idx = localInvoices.findIndex((i) => i.id === id);
    if (idx !== -1) {
      localInvoices[idx] = {
        ...localInvoices[idx],
        notes,
      };
      try {
        await apiClient.patch(`/procurement/invoices/${id}`, {
          notes,
        });
      } catch {
        // safe fallback
      }
      return localInvoices[idx];
    }
    throw new Error('Invoice not found');
  }
}

export const invoiceService: IInvoiceService = new RealInvoiceService();

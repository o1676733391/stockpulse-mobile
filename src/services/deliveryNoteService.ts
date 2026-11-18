import { DeliveryNote, DeliveryNoteStatus } from '@/types/deliveryNotes';
import { apiClient, logDebugFallback } from './apiClient';

export const INITIAL_DELIVERY_NOTES: DeliveryNote[] = [
  {
    id: 'dn-101',
    deliveryNoteNumber: 'DN-88492',
    supplierId: 's1',
    supplierName: 'Metro Foods GmbH',
    purchaseOrderId: 'po1',
    invoiceNumber: 'INV-20481',
    deliveryDate: '08 Mar 2026',
    receivedAt: '08:45 AM',
    receivedBy: 'Marco Bauer',
    status: 'received',
    temperatureCheck: '+3.4°C (Compliant)',
    storageZone: 'Walk-In Chiller A & Dry Storage',
    totalValue: 842.5,
    itemCount: 3,
    driverName: 'Thomas Huber',
    carrier: 'Metro Logistics Fleet',
    notes: 'All boxes sealed, unbroken thermal chain.',
    items: [
      {
        id: 'dni-1',
        itemId: 'i1',
        itemName: 'Chicken Breast Fillet',
        orderedQuantity: 20,
        receivedQuantity: 20,
        unit: 'kg',
        bbd: '18 Mar 2026',
        batchNumber: 'B-1049',
        pricePerUnit: 4.8,
        discrepancyQuantity: 0,
        condition: 'good',
        storageZone: 'Meat Cold Room',
      },
      {
        id: 'dni-2',
        itemId: 'i3',
        itemName: 'Potatoes Agria',
        orderedQuantity: 50,
        receivedQuantity: 50,
        unit: 'kg',
        bbd: '30 Mar 2026',
        batchNumber: 'B-1050',
        pricePerUnit: 0.9,
        discrepancyQuantity: 0,
        condition: 'good',
        storageZone: 'Vegetable Cellar',
      },
      {
        id: 'dni-3',
        itemId: 'i4',
        itemName: 'Cooking Oil',
        orderedQuantity: 15,
        receivedQuantity: 15,
        unit: 'L',
        bbd: '15 Jun 2026',
        batchNumber: 'B-1022',
        pricePerUnit: 2.4,
        discrepancyQuantity: 0,
        condition: 'good',
        storageZone: 'Dry Pantry Bin 4',
      },
    ],
  },
  {
    id: 'dn-102',
    deliveryNoteNumber: 'DN-88504',
    supplierId: 's2',
    supplierName: 'FreshProduce GmbH',
    purchaseOrderId: 'po3',
    invoiceNumber: 'INV-20479',
    deliveryDate: '09 Mar 2026',
    receivedAt: '07:30 AM',
    receivedBy: 'Anna Schmidt',
    status: 'received',
    temperatureCheck: '+1.9°C (Compliant)',
    storageZone: 'Fish Cooling Bin',
    totalValue: 142.3,
    itemCount: 2,
    driverName: 'Klaus Lindner',
    carrier: 'Direct Fresh Van',
    notes: 'Salmon placed on crushed ice immediately.',
    items: [
      {
        id: 'dni-4',
        itemId: 'i2',
        itemName: 'Fresh Atlantic Salmon',
        orderedQuantity: 6,
        receivedQuantity: 6,
        unit: 'kg',
        bbd: '13 Mar 2026',
        batchNumber: 'B-1055',
        pricePerUnit: 16.2,
        discrepancyQuantity: 0,
        condition: 'good',
        storageZone: 'Fish Cooler',
      },
      {
        id: 'dni-5',
        itemId: 'i7',
        itemName: 'Vine Tomatoes',
        orderedQuantity: 15,
        receivedQuantity: 15,
        unit: 'kg',
        bbd: '16 Mar 2026',
        batchNumber: 'B-1056',
        pricePerUnit: 1.8,
        discrepancyQuantity: 0,
        condition: 'good',
        storageZone: 'Prep Station Rack',
      },
    ],
  },
  {
    id: 'dn-103',
    deliveryNoteNumber: 'DN-88519',
    supplierId: 's3',
    supplierName: 'Alpine Dairy Co.',
    purchaseOrderId: 'po2',
    invoiceNumber: 'INV-20490',
    deliveryDate: '10 Mar 2026',
    receivedAt: '09:15 AM',
    receivedBy: 'Marco Bauer',
    status: 'discrepancy',
    temperatureCheck: '+4.1°C (Compliant)',
    storageZone: 'Dairy Walk-In',
    totalValue: 124.95,
    itemCount: 2,
    driverName: 'Stefan Gruber',
    carrier: 'Alpine Refrigerated Express',
    notes: 'Driver short 5L milk due to crate breakage at depot.',
    items: [
      {
        id: 'dni-6',
        itemId: 'i5',
        itemName: 'Whole Fresh Milk 3.8%',
        orderedQuantity: 40,
        receivedQuantity: 35,
        unit: 'L',
        bbd: '17 Mar 2026',
        batchNumber: 'B-1061',
        pricePerUnit: 1.1,
        discrepancyQuantity: -5,
        condition: 'shortage',
        storageZone: 'Dairy Walk-In',
      },
      {
        id: 'dni-7',
        itemId: 'i6',
        itemName: 'Gouda Cheese Block',
        orderedQuantity: 8,
        receivedQuantity: 8,
        unit: 'kg',
        bbd: '25 Apr 2026',
        batchNumber: 'B-1062',
        pricePerUnit: 8.5,
        discrepancyQuantity: 0,
        condition: 'good',
        storageZone: 'Dairy Walk-In',
      },
    ],
  },
  {
    id: 'dn-104',
    deliveryNoteNumber: 'DN-88530',
    supplierId: 's1',
    supplierName: 'Metro Foods GmbH',
    deliveryDate: '10 Mar 2026',
    receivedAt: '11:00 AM',
    receivedBy: 'Tom Wagner',
    status: 'pending_inspection',
    temperatureCheck: 'Pending intake probe',
    storageZone: 'Receiving Dock',
    totalValue: 310.0,
    itemCount: 2,
    driverName: 'Hassan Demir',
    carrier: 'Metro Express',
    notes: 'Arrived at receiving bay, cartons awaiting check-in.',
    items: [
      {
        id: 'dni-8',
        itemName: 'Ground Beef 80/20',
        orderedQuantity: 25,
        receivedQuantity: 25,
        unit: 'kg',
        bbd: '15 Mar 2026',
        batchNumber: 'B-1065',
        pricePerUnit: 6.2,
        discrepancyQuantity: 0,
        condition: 'good',
        storageZone: 'Receiving Bay',
      },
      {
        id: 'dni-9',
        itemName: 'Wheat Flour Type 405 (25kg)',
        orderedQuantity: 100,
        receivedQuantity: 100,
        unit: 'kg',
        bbd: '30 Oct 2026',
        batchNumber: 'B-1066',
        pricePerUnit: 0.65,
        discrepancyQuantity: 0,
        condition: 'good',
        storageZone: 'Dry Bulk Bay',
      },
    ],
  },
];

let localDeliveryNotes = [...INITIAL_DELIVERY_NOTES];

export interface IDeliveryNoteService {
  getDeliveryNotes(filters?: { status?: DeliveryNoteStatus; supplierId?: string; search?: string }): Promise<DeliveryNote[]>;
  getDeliveryNoteById(id: string): Promise<DeliveryNote | null>;
  createDeliveryNote(payload: Partial<DeliveryNote>): Promise<DeliveryNote>;
  verifyDeliveryNote(id: string): Promise<DeliveryNote>;
}

export class RealDeliveryNoteService implements IDeliveryNoteService {
  async getDeliveryNotes(filters?: { status?: DeliveryNoteStatus; supplierId?: string; search?: string }): Promise<DeliveryNote[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.supplierId) params.append('supplierId', filters.supplierId);
      if (filters?.search) params.append('search', filters.search);
      const qs = params.toString() ? `?${params.toString()}` : '';

      const res = await apiClient.get<any>(`/procurement/delivery-notes${qs}`);
      const list = Array.isArray(res) ? res : res?.items || res?.data;
      if (Array.isArray(list)) return list;
      return apiClient.isFallbackEnabled() ? this.filterLocal(filters) : [];
    } catch (err) {
      logDebugFallback('DeliveryNoteService', '/procurement/delivery-notes [GET]', err);
      return apiClient.isFallbackEnabled() ? this.filterLocal(filters) : [];
    }
  }

  private filterLocal(filters?: { status?: DeliveryNoteStatus; supplierId?: string; search?: string }): DeliveryNote[] {
    let result = [...localDeliveryNotes];
    if (filters?.status) {
      result = result.filter((d) => d.status === filters.status);
    }
    if (filters?.supplierId) {
      result = result.filter((d) => d.supplierId === filters.supplierId);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (d) =>
          d.deliveryNoteNumber.toLowerCase().includes(q) ||
          d.supplierName.toLowerCase().includes(q) ||
          (d.invoiceNumber && d.invoiceNumber.toLowerCase().includes(q)) ||
          d.items.some((item) => item.itemName.toLowerCase().includes(q))
      );
    }
    return result;
  }

  async getDeliveryNoteById(id: string): Promise<DeliveryNote | null> {
    try {
      const res = await apiClient.get<DeliveryNote>(`/procurement/delivery-notes/${id}`);
      return res || localDeliveryNotes.find((d) => d.id === id) || null;
    } catch (err) {
      logDebugFallback('DeliveryNoteService', `/procurement/delivery-notes/${id}`, err);
      return localDeliveryNotes.find((d) => d.id === id) || null;
    }
  }

  async createDeliveryNote(payload: Partial<DeliveryNote>): Promise<DeliveryNote> {
    const newNote: DeliveryNote = {
      id: `dn-${Date.now()}`,
      deliveryNoteNumber: payload.deliveryNoteNumber || `DN-${Math.floor(10000 + Math.random() * 90000)}`,
      supplierId: payload.supplierId || 's1',
      supplierName: payload.supplierName || 'Metro Foods GmbH',
      purchaseOrderId: payload.purchaseOrderId,
      invoiceNumber: payload.invoiceNumber,
      deliveryDate: payload.deliveryDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      receivedAt: payload.receivedAt || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      receivedBy: payload.receivedBy || 'Staff Member',
      status: payload.status || 'received',
      temperatureCheck: payload.temperatureCheck || '+3.0°C (Compliant)',
      storageZone: payload.storageZone || 'Receiving Bay',
      totalValue: payload.totalValue || 0,
      itemCount: payload.items?.length || 0,
      items: payload.items || [],
      notes: payload.notes,
      driverName: payload.driverName,
      carrier: payload.carrier,
    };

    localDeliveryNotes.unshift(newNote);
    try {
      await apiClient.post('/procurement/delivery-notes', newNote);
    } catch {
      // safe fallback
    }
    return newNote;
  }

  async verifyDeliveryNote(id: string): Promise<DeliveryNote> {
    const idx = localDeliveryNotes.findIndex((d) => d.id === id);
    if (idx !== -1) {
      localDeliveryNotes[idx] = { ...localDeliveryNotes[idx], status: 'received' };
      try {
        await apiClient.patch(`/procurement/delivery-notes/${id}`, { status: 'received' });
      } catch {
        // safe fallback
      }
      return localDeliveryNotes[idx];
    }
    throw new Error('Delivery note not found');
  }
}

export const deliveryNoteService: IDeliveryNoteService = new RealDeliveryNoteService();

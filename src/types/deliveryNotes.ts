export type DeliveryNoteStatus = 'received' | 'pending_inspection' | 'discrepancy' | 'damaged';

export interface DeliveryNoteLineItem {
  id: string;
  itemId?: string;
  itemName: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unit: string;
  bbd: string; // Best Before Date
  batchNumber: string;
  pricePerUnit: number;
  discrepancyQuantity: number; // e.g. received - ordered (negative if missing)
  condition: 'good' | 'damaged' | 'temperature_fail' | 'shortage';
  storageZone?: string;
}

export interface DeliveryNote {
  id: string;
  deliveryNoteNumber: string;
  supplierId: string;
  supplierName: string;
  purchaseOrderId?: string;
  invoiceNumber?: string;
  deliveryDate: string;
  receivedAt: string;
  receivedBy: string;
  status: DeliveryNoteStatus;
  temperatureCheck?: string; // e.g. "+3.2°C (Compliant)"
  storageZone?: string;
  items: DeliveryNoteLineItem[];
  totalValue: number;
  itemCount: number;
  notes?: string;
  driverName?: string;
  carrier?: string;
}

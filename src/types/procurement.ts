export type OrderStatus = 'draft' | 'sent' | 'confirmed' | 'received';

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  ingredientCount: number;
  openOrders: number;
  lastDelivery: string;
}

export interface PurchaseOrderLine {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  status: OrderStatus;
  total: number;
  items: PurchaseOrderLine[];
}

export interface POQRecommendationItem {
  id: string;
  name: string;
  unit: string;
  physical: number;
  target: number;
  safety: number;
  recommended: number;
  pricePerUnit: number;
}

export interface POQSupplierGroup {
  supplierId: string;
  supplierName: string;
  items: POQRecommendationItem[];
}

export interface GoodsReceiptItem {
  itemId?: string;
  itemName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  bbd: string;
}

export interface GoodsReceipt {
  id: string;
  poId?: string;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  date: string;
  total: number;
  status: 'received';
  items: GoodsReceiptItem[];
}

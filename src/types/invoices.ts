export type InvoiceType = 'supplier_delivery' | 'order_receipt';

export type InvoiceStatus = 'verified' | 'pending' | 'discrepancy' | 'paid' | 'cancelled';

export interface InvoiceLineItem {
  id: string;
  description: string;
  sku?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  matchedItemId?: string;
  matchedRecipeId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: InvoiceType; // 'supplier_delivery' (Delivery invoice from supplier) vs 'order_receipt' (Order form receipt / POS sales)
  supplierId?: string;
  supplierName?: string;
  customerReference?: string;
  date: string;
  dueDate?: string;
  status: InvoiceStatus;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  itemCount: number;
  items: InvoiceLineItem[];
  notes?: string;
  purchaseOrderId?: string;
  deliveryNoteId?: string;
  paymentStatus: 'unpaid' | 'paid' | 'partially_paid';
  skipDeductionAmount?: number; // Deducted debt from rejected/damaged/shorted items
  skipDeductionReason?: string;
  netPayableAmount?: number; // Total amount minus skip deduction amount
  scannedAt?: string;
  verifiedBy?: string;
}

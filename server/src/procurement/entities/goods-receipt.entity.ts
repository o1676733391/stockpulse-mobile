import { BaseEntity } from '../../common/entities/base.entity';

export type GoodsReceiptStatus = 'draft' | 'verified' | 'discrepancy';

export class GoodsReceiptEntity extends BaseEntity {
  storeId!: string;
  purchaseOrderId?: string;
  supplierId!: string;
  receiptNumber!: string;
  invoiceNumber!: string;
  receiptDate!: Date;
  totalAmount!: number;
  status!: GoodsReceiptStatus;
  receivedBy!: string;
  notes?: string;
}

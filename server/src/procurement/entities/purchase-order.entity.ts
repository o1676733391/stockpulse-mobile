import { BaseEntity } from '../../common/entities/base.entity';

export type PurchaseOrderStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'received'
  | 'cancelled'
  | 'partially_received'
  | 'sent'
  | 'confirmed';

export class PurchaseOrderEntity extends BaseEntity {
  storeId!: string;
  supplierId!: string;
  orderNumber!: string;
  orderDate!: Date;
  expectedDeliveryDate?: Date;
  status!: PurchaseOrderStatus;
  subtotal!: number;
  taxAmount!: number;
  totalAmount!: number;
  approvedBy?: string;
  approvedAt?: Date;
  submittedBy?: string;
  submittedAt?: Date;
  cancelledBy?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  notes?: string;
}

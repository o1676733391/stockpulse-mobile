import { UnitOfMeasure } from '../../inventory/entities/inventory-item.entity';

export class PurchaseOrderItemEntity {
  id!: string;
  purchaseOrderId!: string;
  itemId!: string;
  quantityOrdered!: number;
  quantityReceived!: number;
  unit!: UnitOfMeasure;
  unitPrice!: number;
  totalPrice!: number;
  notes?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

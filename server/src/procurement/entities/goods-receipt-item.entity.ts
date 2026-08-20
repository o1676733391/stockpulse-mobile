import { UnitOfMeasure } from '../../inventory/entities/inventory-item.entity';

export class GoodsReceiptItemEntity {
  id!: string;
  goodsReceiptId!: string;
  poItemId?: string;
  itemId!: string;
  quantityReceived!: number;
  unit!: UnitOfMeasure;
  pricePerUnit!: number;
  batchNumber!: string;
  expiryDate!: Date;
  createdBatchId?: string;
  isAccepted!: boolean;
  notes?: string;
  createdAt!: Date;
}

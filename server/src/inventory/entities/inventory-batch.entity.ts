import { BaseEntity } from '../../common/entities/base.entity';

export type BatchStatus = 'active' | 'consumed' | 'wasted' | 'expired';

export class InventoryBatchEntity extends BaseEntity {
  itemId!: string;
  batchNumber!: string;
  quantity!: number;
  initialQuantity!: number;
  costPerUnit!: number;
  expiryDate!: Date;
  receivedDate!: Date;
  supplierId?: string;
  status!: BatchStatus;
}

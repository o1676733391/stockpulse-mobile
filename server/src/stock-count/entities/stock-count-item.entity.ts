import { UnitOfMeasure } from '../../inventory/entities/inventory-item.entity';

export class StockCountItemEntity {
  id!: string;
  stockCountId!: string;
  itemId!: string;
  countedQuantity!: number;
  unit!: UnitOfMeasure;
  notes?: string;
  recordedAt!: Date;
}

import { BaseEntity } from '../../common/entities/base.entity';

export type UnitOfMeasure = 'kg' | 'g' | 'L' | 'ml' | 'pcs' | 'can' | 'bottle' | 'pack';
export type StockStatus = 'healthy' | 'low' | 'critical' | 'overstock';

export class InventoryItemEntity extends BaseEntity {
  storeId!: string;
  categoryId?: string;
  sku!: string;
  name!: string;
  unit!: UnitOfMeasure;
  physicalStock!: number;
  theoreticalStock!: number;
  targetStock!: number;
  safetyStock!: number;
  costPerUnit!: number;
  barcode?: string;
  storageArea?: string;
  shelfLifeDays?: number;
  reorderPoint!: number;
  status!: StockStatus;
}

import { UnitOfMeasure } from '../../inventory/entities/inventory-item.entity';

export type DiscrepancyTier = 'none' | 'minor' | 'critical';

export class VarianceItemEntity {
  id!: string;
  varianceId!: string;
  itemId!: string;
  expectedQuantity!: number;
  countedQuantity!: number;
  varianceQuantity!: number;
  unit!: UnitOfMeasure;
  unitCost!: number;
  varianceValue!: number;
  discrepancyTier!: DiscrepancyTier;
  createdAt!: Date;
}

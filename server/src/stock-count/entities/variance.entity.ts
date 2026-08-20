import { BaseEntity } from '../../common/entities/base.entity';

export class VarianceEntity extends BaseEntity {
  storeId!: string;
  stockCountId!: string;
  varianceNumber!: string;
  totalExpectedValue!: number;
  totalCountedValue!: number;
  netVarianceValue!: number;
  totalItemsCounted!: number;
  itemsWithDiscrepancyCount!: number;
  approvedBy?: string;
  approvedAt?: Date;
  ledgerSyncedAt?: Date;
  notes?: string;
}

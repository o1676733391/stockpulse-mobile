import { BaseEntity } from '../../common/entities/base.entity';
import { StockCountType } from './count-schedule.entity';

export type StockCountStatus = 'draft' | 'in_progress' | 'completed' | 'approved' | 'rejected';

export class StockCountEntity extends BaseEntity {
  storeId!: string;
  scheduleId?: string;
  sessionNumber!: string;
  conductedBy!: string;
  status!: StockCountStatus;
  countType!: StockCountType;
  totalItems!: number;
  totalCounted!: number;
  startedAt!: Date;
  completedAt?: Date;
  notes?: string;
}

import { BaseEntity } from '../../common/entities/base.entity';

export type StockCountType = 'blind' | 'standard';

export class CountScheduleEntity extends BaseEntity {
  storeId!: string;
  name!: string;
  frequency!: string;
  countType!: StockCountType;
  targetCategoryIds?: string[];
  isActive!: boolean;
}

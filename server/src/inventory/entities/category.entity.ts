import { BaseEntity } from '../../common/entities/base.entity';

export class CategoryEntity extends BaseEntity {
  storeId!: string;
  name!: string;
  description?: string;
  icon?: string;
  sortOrder!: number;
}

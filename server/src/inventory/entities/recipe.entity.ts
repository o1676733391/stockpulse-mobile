import { BaseEntity } from '../../common/entities/base.entity';

export class RecipeEntity extends BaseEntity {
  storeId!: string;
  code!: string;
  name!: string;
  category?: string;
  portionYield!: number;
  posItemName?: string;
  isActive!: boolean;
}

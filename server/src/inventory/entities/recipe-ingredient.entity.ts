import { UnitOfMeasure } from './inventory-item.entity';

export class RecipeIngredientEntity {
  id!: string;
  recipeId!: string;
  itemId!: string;
  quantity!: number;
  unit!: UnitOfMeasure;
  wastePercentage!: number;
  createdAt!: Date;
  updatedAt!: Date;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { UnitOfMeasure } from '../../inventory/entities/inventory-item.entity';

export class CreateRecipeIngredientDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e0a5', description: 'Inventory Item UUID' })
  @IsUUID()
  itemId!: string;

  @ApiProperty({ example: 0.25, description: 'Quantity required per recipe portion' })
  @IsNumber()
  @Min(0.0001)
  quantity!: number;

  @ApiProperty({ example: 'kg', enum: ['kg', 'g', 'L', 'ml', 'pcs', 'pack', 'box', 'can', 'bottle', 'portion'] })
  @IsEnum(['kg', 'g', 'L', 'ml', 'pcs', 'pack', 'box', 'can', 'bottle', 'portion'])
  unit!: UnitOfMeasure;

  @ApiPropertyOptional({ example: 2.0, description: 'Waste / prep loss percentage (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  wastePercentage?: number;
}

export class CreateRecipeDto {
  @ApiProperty({ example: 'REC-PIZZA-MARG', description: 'Unique recipe code within the store' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Pizza Margherita 30cm', description: 'Descriptive recipe dish name' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Pizza', description: 'Recipe menu category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 1.0, description: 'Portion yield produced by one batch' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  portionYield?: number;

  @ApiPropertyOptional({ example: 'Pizza Margherita', description: 'POS matching title' })
  @IsOptional()
  @IsString()
  posItemName?: string;

  @ApiPropertyOptional({ type: [CreateRecipeIngredientDto], description: 'Ingredients that make up the recipe' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeIngredientDto)
  ingredients?: CreateRecipeIngredientDto[];
}

export class UpdateRecipeDto {
  @ApiPropertyOptional({ example: 'REC-PIZZA-MARG-V2' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'Pizza Margherita Speciale' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Pizza' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 1.0 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  portionYield?: number;

  @ApiPropertyOptional({ example: 'Pizza Margherita Spec' })
  @IsOptional()
  @IsString()
  posItemName?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [CreateRecipeIngredientDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeIngredientDto)
  ingredients?: CreateRecipeIngredientDto[];
}

export class QueryRecipesDto {
  @ApiPropertyOptional({ example: 'pizza', description: 'Search term for name or code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'Pizza', description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: true, description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class DeductRecipeDto {
  @ApiProperty({ example: 5, description: 'Number of portions prepared / sold to deduct' })
  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @ApiPropertyOptional({ example: 'POS_SALE', description: 'Reason or origin of deduction' })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional({ example: 'receipt-10293' })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional({ example: 'Lunch service sales' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class RecipeIngredientResponseDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e0a5' })
  id!: string;

  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e0c1' })
  recipeId!: string;

  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e0a5' })
  itemId!: string;

  @ApiProperty({ example: 'Pizza Flour Tipo 00' })
  itemName!: string;

  @ApiProperty({ example: 'ING-001' })
  itemSku!: string;

  @ApiProperty({ example: 0.25 })
  quantity!: number;

  @ApiProperty({ example: 'kg' })
  unit!: UnitOfMeasure;

  @ApiProperty({ example: 2.0 })
  wastePercentage!: number;

  @ApiProperty({ example: 1.25 })
  costPerUnit!: number;

  @ApiProperty({ example: 0.3188 })
  lineCost!: number;
}

export class RecipeResponseDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e0c1' })
  id!: string;

  @ApiProperty({ example: '01915dfa-9012-7000-8000-000000000002' })
  storeId!: string;

  @ApiProperty({ example: 'REC-PIZZA-MARG' })
  code!: string;

  @ApiProperty({ example: 'Pizza Margherita 30cm' })
  name!: string;

  @ApiProperty({ example: 'Pizza' })
  category!: string;

  @ApiProperty({ example: 1.0 })
  portionYield!: number;

  @ApiProperty({ example: 'Pizza Margherita' })
  posItemName!: string;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: 1.45, description: 'Calculated cost per portion based on ingredient unit costs and waste' })
  costPerPortion!: number;

  @ApiProperty({ type: [RecipeIngredientResponseDto] })
  ingredients!: RecipeIngredientResponseDto[];

  @ApiProperty({ example: '2026-08-20T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-20T00:00:00.000Z' })
  updatedAt!: string;
}

export class RecipeDeductionDetailDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e0a5' })
  itemId!: string;

  @ApiProperty({ example: 'Pizza Flour Tipo 00' })
  itemName!: string;

  @ApiProperty({ example: 1.275 })
  quantityDeducted!: number;

  @ApiProperty({ example: 'kg' })
  unit!: string;

  @ApiProperty({ example: 1.25 })
  unitCost!: number;

  @ApiProperty({ example: 1.59 })
  totalCost!: number;

  @ApiProperty({ example: 25.0 })
  previousStock!: number;

  @ApiProperty({ example: 23.725 })
  newStock!: number;
}

export class RecipeDeductionResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e0c1' })
  recipeId!: string;

  @ApiProperty({ example: 'Pizza Margherita 30cm' })
  recipeName!: string;

  @ApiProperty({ example: 5 })
  portionsDeducted!: number;

  @ApiProperty({ example: 7.95 })
  totalCostImpact!: number;

  @ApiProperty({ type: [RecipeDeductionDetailDto] })
  deductions!: RecipeDeductionDetailDto[];
}

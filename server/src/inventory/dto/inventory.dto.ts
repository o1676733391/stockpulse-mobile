import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { StockStatus, UnitOfMeasure } from '../entities/inventory-item.entity';

export class QueryInventoryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e010', description: 'Filter by category UUID' })
  @IsOptional()
  @IsUUID('4', { message: 'Category ID must be a valid UUID' })
  categoryId?: string;

  @ApiPropertyOptional({
    example: 'low',
    enum: ['healthy', 'low', 'critical', 'overstock'],
    description: 'Filter by dynamic stock health status',
  })
  @IsOptional()
  @IsEnum(['healthy', 'low', 'critical', 'overstock'], {
    message: 'Status must be one of: healthy, low, critical, overstock',
  })
  status?: StockStatus;

  @ApiPropertyOptional({ example: 'Walk-in Chiller', description: 'Filter by storage zone' })
  @IsOptional()
  @IsString()
  storageArea?: string;

  @ApiPropertyOptional({ example: false, default: false, description: 'Whether to include soft-deleted/archived items' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeArchived?: boolean = false;
}

export class CreateInventoryItemDto {
  @ApiProperty({ example: 'DAI-001', description: 'Unique Stock Keeping Unit code' })
  @IsString()
  @IsNotEmpty({ message: 'SKU code is required' })
  @MaxLength(50)
  sku!: string;

  @ApiProperty({ example: 'Whole Milk 3.5% Fat (1L)', description: 'Product descriptive name' })
  @IsString()
  @IsNotEmpty({ message: 'Item name is required' })
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e010', description: 'Category UUID' })
  @IsOptional()
  @IsUUID('4', { message: 'Category ID must be a valid UUID' })
  categoryId?: string;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e020', description: 'Primary supplier UUID' })
  @IsOptional()
  @IsUUID('4', { message: 'Supplier ID must be a valid UUID' })
  supplierId?: string;

  @ApiProperty({ example: 'L', enum: ['kg', 'g', 'L', 'ml', 'pcs', 'can', 'bottle', 'pack'] })
  @IsEnum(['kg', 'g', 'L', 'ml', 'pcs', 'can', 'bottle', 'pack'], {
    message: 'Invalid unit of measure',
  })
  unit!: UnitOfMeasure;

  @ApiProperty({ example: 40, description: 'Target optimal inventory level' })
  @IsNumber({}, { message: 'Target stock must be a number' })
  @Min(0, { message: 'Target stock cannot be negative' })
  targetStock!: number;

  @ApiProperty({ example: 10, description: 'Safety stock minimum buffer threshold' })
  @IsNumber({}, { message: 'Safety stock must be a number' })
  @Min(0, { message: 'Safety stock cannot be negative' })
  safetyStock!: number;

  @ApiProperty({ example: 1.25, description: 'Cost price per unit of measure' })
  @IsNumber({}, { message: 'Cost per unit must be a number' })
  @Min(0, { message: 'Cost per unit cannot be negative' })
  costPerUnit!: number;

  @ApiPropertyOptional({ example: '8935001234567', description: 'EAN/UPC barcode string' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string;

  @ApiPropertyOptional({ example: 'Walk-in Chiller A2', description: 'Storage zone location' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  storageArea?: string;

  @ApiPropertyOptional({ example: 14, description: 'Shelf life duration in days for FEFO' })
  @IsOptional()
  @IsInt()
  @Min(1)
  shelfLifeDays?: number;
}

export class UpdateInventoryItemDto {
  @ApiPropertyOptional({ example: 'Whole Milk 3.5% Fat (1L Carton)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e010' })
  @IsOptional()
  @IsUUID('4')
  categoryId?: string | null;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e020' })
  @IsOptional()
  @IsUUID('4')
  supplierId?: string | null;

  @ApiPropertyOptional({ example: 'L', enum: ['kg', 'g', 'L', 'ml', 'pcs', 'can', 'bottle', 'pack'] })
  @IsOptional()
  @IsEnum(['kg', 'g', 'L', 'ml', 'pcs', 'can', 'bottle', 'pack'])
  unit?: UnitOfMeasure;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  targetStock?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  safetyStock?: number;

  @ApiPropertyOptional({ example: 1.30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPerUnit?: number;

  @ApiPropertyOptional({ example: '8935001234567' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string;

  @ApiPropertyOptional({ example: 'Walk-in Chiller Shelf 1' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  storageArea?: string;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @IsInt()
  @Min(1)
  shelfLifeDays?: number;

  @ApiPropertyOptional({ example: 3, description: 'Optimistic concurrency control version tag' })
  @IsOptional()
  @IsInt()
  version?: number;
}

export class CreateStockAdjustmentDto {
  @ApiProperty({ example: -2.5, description: 'Stock delta adjustment (+ to increment, - to decrement)' })
  @IsNumber({}, { message: 'Stock delta must be a number' })
  delta!: number;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e099', description: 'Batch UUID if adjusting a specific FEFO lot' })
  @IsOptional()
  @IsUUID('4')
  batchId?: string;

  @ApiProperty({
    example: 'SPOILAGE_TRIM_LOSS',
    enum: [
      'SPOILAGE_TRIM_LOSS',
      'PREPARATION_WASTE',
      'STORAGE_FAILURE',
      'UNRECORDED_USAGE',
      'SUPPLIER_SHORTAGE',
      'MANUAL_CORRECTION',
    ],
    description: 'Audit shrinkage reason classification',
  })
  @IsEnum([
    'SPOILAGE_TRIM_LOSS',
    'PREPARATION_WASTE',
    'STORAGE_FAILURE',
    'UNRECORDED_USAGE',
    'SUPPLIER_SHORTAGE',
    'MANUAL_CORRECTION',
  ])
  reasonCode!: string;

  @ApiPropertyOptional({ example: 'Milk expired past safe temperature window', description: 'Detailed justification' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class InventoryBatchSummaryDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e099' })
  id!: string;

  @ApiProperty({ example: 'LOT-20260820-001' })
  batchNumber!: string;

  @ApiProperty({ example: 20 })
  quantity!: number;

  @ApiProperty({ example: 1.25 })
  costPerUnit!: number;

  @ApiProperty({ example: '2026-09-10' })
  expiryDate!: string;

  @ApiProperty({ example: '2026-08-20' })
  receivedDate!: string;

  @ApiProperty({ example: 'active', enum: ['active', 'depleted', 'expired'] })
  status!: string;
}

export class InventoryTransactionSummaryDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e088' })
  id!: string;

  @ApiProperty({ example: 'TX-20260820-0001' })
  transactionNumber!: string;

  @ApiProperty({ example: 'MANUAL_ADJUSTMENT' })
  transactionType!: string;

  @ApiProperty({ example: -2.5 })
  delta!: number;

  @ApiProperty({ example: 25 })
  previousStock!: number;

  @ApiProperty({ example: 22.5 })
  newStock!: number;

  @ApiProperty({ example: -3.125 })
  costImpact!: number;

  @ApiPropertyOptional({ example: 'Mario Batali' })
  actorName?: string;

  @ApiPropertyOptional({ example: 'MANUAL_ADJUSTMENT' })
  referenceType?: string;

  @ApiPropertyOptional({ example: 'Spoilage loss' })
  note?: string;

  @ApiProperty({ example: '2026-08-20T07:45:00.000Z' })
  createdAt!: string;
}

export class InventoryItemResponseDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e0a1' })
  id!: string;

  @ApiProperty({ example: '01915dfa-9012-7000-8000-000000000002' })
  storeId!: string;

  @ApiPropertyOptional({ example: '01915dfa-9012-7000-8000-000000000001' })
  organizationId?: string;

  @ApiProperty({ example: 'DAI-001' })
  sku!: string;

  @ApiProperty({ example: 'Whole Milk 3.5% Fat (1L)' })
  name!: string;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e010' })
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Dairy & Eggs' })
  categoryName?: string;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e020' })
  supplierId?: string;

  @ApiPropertyOptional({ example: 'Fresh Farms Direct' })
  supplierName?: string;

  @ApiProperty({ example: 'L' })
  unit!: UnitOfMeasure;

  @ApiProperty({ example: 22.5 })
  physicalStock!: number;

  @ApiProperty({ example: 22.5 })
  theoreticalStock!: number;

  @ApiProperty({ example: 40 })
  targetStock!: number;

  @ApiProperty({ example: 10 })
  safetyStock!: number;

  @ApiProperty({ example: 15 })
  reorderPoint!: number;

  @ApiProperty({ example: 1.25 })
  costPerUnit!: number;

  @ApiProperty({ example: 28.125 })
  totalValue!: number;

  @ApiPropertyOptional({ example: '8935001234567' })
  barcode?: string;

  @ApiPropertyOptional({ example: 'Walk-in Chiller' })
  storageArea?: string;

  @ApiPropertyOptional({ example: 14 })
  shelfLifeDays?: number;

  @ApiProperty({ example: 'healthy', enum: ['healthy', 'low', 'critical', 'overstock'] })
  status!: StockStatus;

  @ApiProperty({ example: 4 })
  version!: number;

  @ApiProperty({ example: false })
  isArchived!: boolean;

  @ApiProperty({ example: '2026-08-20T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-20T08:00:00.000Z' })
  updatedAt!: string;
}

export class InventoryItemDetailResponseDto extends InventoryItemResponseDto {
  @ApiProperty({ type: () => [InventoryBatchSummaryDto] })
  batches!: InventoryBatchSummaryDto[];

  @ApiProperty({ type: () => [InventoryTransactionSummaryDto] })
  recentTransactions!: InventoryTransactionSummaryDto[];
}

export class StockAdjustmentResponseDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e088' })
  transactionId!: string;

  @ApiProperty({ example: 'TX-20260820-0001' })
  transactionNumber!: string;

  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e0a1' })
  itemId!: string;

  @ApiProperty({ example: 25 })
  previousStock!: number;

  @ApiProperty({ example: 22.5 })
  newStock!: number;

  @ApiProperty({ example: -2.5 })
  delta!: number;

  @ApiProperty({ example: -3.125 })
  costImpact!: number;

  @ApiProperty({ example: 'healthy' })
  status!: StockStatus;

  @ApiProperty({ example: 4 })
  version!: number;

  @ApiProperty({ example: '2026-08-20T07:45:00.000Z' })
  timestamp!: string;
}

export class ArchiveItemResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Item archived successfully' })
  message!: string;

  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e0a1' })
  id!: string;

  @ApiProperty({ example: '2026-08-20T08:15:00.000Z' })
  archivedAt!: string;
}

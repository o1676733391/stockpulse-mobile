import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { UnitOfMeasure } from '../../inventory/entities/inventory-item.entity';
import { StockCountType } from '../entities/count-schedule.entity';
import { StockCountStatus } from '../entities/stock-count.entity';
import { DiscrepancyTier } from '../entities/variance-item.entity';

export class StartStockCountSessionDto {
  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e030', description: 'Schedule UUID if linked to planned recurring count' })
  @IsOptional()
  @IsUUID('4')
  scheduleId?: string;

  @ApiProperty({
    example: 'blind',
    enum: ['blind', 'standard'],
    description: 'Blind count hides system theoretical stock from staff during counting',
  })
  @IsEnum(['blind', 'standard'], { message: 'Count type must be blind or standard' })
  countType!: StockCountType;

  @ApiPropertyOptional({
    example: ['01915dfa-b1c4-7221-9988-51b72e04e010'],
    description: 'Category filters for cycle count (omitted for full store audit)',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  targetCategoryIds?: string[];

  @ApiPropertyOptional({ example: 'Friday end-of-day bar audit' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Daily Closing Count' })
  @IsOptional()
  @IsString()
  name?: string;
}

export class RecordCountItemDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e0a1', description: 'Inventory item UUID' })
  @IsUUID(undefined, { message: 'Item ID must be a valid UUID' })
  @IsNotEmpty()
  itemId!: string;

  @ApiProperty({ example: 38.5, description: 'Physical quantity counted by staff' })
  @IsOptional()
  @IsNumber({}, { message: 'Counted quantity must be a valid number' })
  @Min(0, { message: 'Counted quantity cannot be negative' })
  countedQty!: number;

  @ApiPropertyOptional({ example: 38.5, description: 'Alias for countedQty' })
  @IsOptional()
  @IsNumber({}, { message: 'Counted quantity must be a valid number' })
  @Min(0, { message: 'Counted quantity cannot be negative' })
  countedQuantity?: number;

  @ApiProperty({ example: 'L', enum: ['kg', 'g', 'L', 'ml', 'pcs', 'can', 'bottle', 'pack'] })
  @IsEnum(['kg', 'g', 'L', 'ml', 'pcs', 'can', 'bottle', 'pack'])
  unit!: UnitOfMeasure;

  @ApiPropertyOptional({ example: 'Partial container counted on shelf 2' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkRecordCountItemsDto {
  @ApiProperty({ type: () => [RecordCountItemDto], description: 'Array of counted inventory items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecordCountItemDto)
  items!: RecordCountItemDto[];
}

export class SubmitCountSessionDto {
  @ApiPropertyOptional({ example: 'Count completed by evening shift' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class QueryCountHistoryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'completed',
    enum: ['draft', 'in_progress', 'completed', 'approved', 'rejected'],
  })
  @IsOptional()
  @IsEnum(['draft', 'in_progress', 'completed', 'approved', 'rejected'])
  status?: StockCountStatus;

  @ApiPropertyOptional({ example: 'blind', enum: ['blind', 'standard'] })
  @IsOptional()
  @IsEnum(['blind', 'standard'])
  countType?: StockCountType;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e001' })
  @IsOptional()
  @IsUUID('4')
  conductedBy?: string;
}

export class StockCountItemResponseDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e077' })
  id!: string;

  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e055' })
  stockCountId!: string;

  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e0a1' })
  itemId!: string;

  @ApiProperty({ example: 'DAI-001' })
  sku!: string;

  @ApiProperty({ example: 'Whole Milk 3.5%' })
  name!: string;

  @ApiProperty({ example: 'L' })
  unit!: UnitOfMeasure;

  @ApiProperty({ example: 38.5 })
  countedQuantity!: number;

  @ApiPropertyOptional({ example: 40 })
  expectedQuantity?: number;

  @ApiPropertyOptional({ example: 'Counted on shelf' })
  notes?: string;

  @ApiProperty({ example: '2026-08-20T08:10:00.000Z' })
  recordedAt!: string;
}

export class StockCountSessionResponseDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e055' })
  id!: string;

  @ApiProperty({ example: 'SC-20260820-0001' })
  sessionNumber!: string;

  @ApiProperty({ example: '01915dfa-9012-7000-8000-000000000002' })
  storeId!: string;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e030' })
  scheduleId?: string;

  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e001' })
  conductedBy!: string;

  @ApiPropertyOptional({ example: 'Mario Batali' })
  conductedByName?: string;

  @ApiProperty({ example: 'completed', enum: ['draft', 'in_progress', 'completed', 'approved', 'rejected'] })
  status!: StockCountStatus;

  @ApiProperty({ example: 'blind', enum: ['blind', 'standard'] })
  countType!: StockCountType;

  @ApiProperty({ example: 25 })
  totalItems!: number;

  @ApiProperty({ example: 25 })
  totalCounted!: number;

  @ApiProperty({ example: '2026-08-20T08:00:00.000Z' })
  startedAt!: string;

  @ApiPropertyOptional({ example: '2026-08-20T08:30:00.000Z' })
  completedAt?: string;

  @ApiPropertyOptional({ example: 'Evening audit' })
  notes?: string;

  @ApiPropertyOptional({ example: -12.5 })
  netVarianceValue?: number;

  @ApiPropertyOptional({ example: 2 })
  itemsWithDiscrepancies?: number;

  @ApiProperty({ example: '2026-08-20T08:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-20T08:30:00.000Z' })
  updatedAt!: string;
}

export class StockCountDetailResponseDto extends StockCountSessionResponseDto {
  @ApiProperty({ type: () => [StockCountItemResponseDto] })
  items!: StockCountItemResponseDto[];

  @ApiPropertyOptional({ description: 'Calculated shrinkage variance metrics' })
  variance?: VarianceReviewResponseDto | null;
}

export class VarianceItemDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e0a1' })
  itemId!: string;

  @ApiProperty({ example: 'DAI-001' })
  sku!: string;

  @ApiProperty({ example: 'Whole Milk 3.5%' })
  name!: string;

  @ApiProperty({ example: 'L' })
  unit!: UnitOfMeasure;

  @ApiProperty({ example: 1.25 })
  unitCost!: number;

  @ApiProperty({ example: 40 })
  expectedQty!: number;

  @ApiProperty({ example: 38.5 })
  countedQty!: number;

  @ApiProperty({ example: -1.5 })
  varianceQty!: number;

  @ApiProperty({ example: -3.75 })
  variancePercentage!: number;

  @ApiProperty({ example: -1.875 })
  varianceValue!: number;

  @ApiProperty({ example: 'minor', enum: ['none', 'minor', 'critical'] })
  discrepancyTier!: DiscrepancyTier;
}

export class VarianceReviewResponseDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e066' })
  varianceId!: string;

  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e055' })
  sessionId!: string;

  @ApiProperty({ example: 'SC-20260820-0001' })
  sessionNumber!: string;

  @ApiProperty({ example: 500.0 })
  totalExpectedValue!: number;

  @ApiProperty({ example: 487.5 })
  totalCountedValue!: number;

  @ApiProperty({ example: -12.5 })
  netVarianceValue!: number;

  @ApiProperty({ example: 25 })
  totalItemsCounted!: number;

  @ApiProperty({ example: 2 })
  itemsWithDiscrepancyCount!: number;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e001' })
  approvedBy?: string;

  @ApiPropertyOptional({ example: 'Mario Batali' })
  approvedByName?: string;

  @ApiPropertyOptional({ example: '2026-08-20T08:45:00.000Z' })
  approvedAt?: string;

  @ApiPropertyOptional({ example: '2026-08-20T08:45:00.000Z' })
  ledgerSyncedAt?: string;

  @ApiPropertyOptional({ example: 'Variance approved by manager' })
  notes?: string;

  @ApiProperty({ type: () => [VarianceItemDto] })
  varianceItems!: VarianceItemDto[];
}

export class ApproveVarianceResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Stock variance approved and physical stock synchronized with audit ledger' })
  message!: string;

  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e055' })
  sessionId!: string;

  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e066' })
  varianceId!: string;

  @ApiProperty({ example: 2 })
  syncedItemsCount!: number;

  @ApiProperty({ example: -12.5 })
  netVarianceValue!: number;

  @ApiProperty({ example: '2026-08-20T08:45:00.000Z' })
  ledgerSyncedAt!: string;
}

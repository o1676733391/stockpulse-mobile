import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PurchaseOrderStatus } from '../entities/purchase-order.entity';

export class PurchaseOrderItemInputDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e0a1', description: 'Inventory item UUID' })
  @IsUUID('4', { message: 'Item ID must be a valid UUID' })
  itemId!: string;

  @ApiProperty({ example: 50, description: 'Quantity to order from supplier' })
  @IsNumber({}, { message: 'Quantity ordered must be a number' })
  @Min(0.001, { message: 'Quantity ordered must be greater than 0' })
  quantityOrdered!: number;

  @ApiProperty({ example: 'L', enum: ['kg', 'g', 'L', 'ml', 'pcs', 'can', 'bottle', 'pack'] })
  @IsEnum(['kg', 'g', 'L', 'ml', 'pcs', 'can', 'bottle', 'pack'])
  unit!: string;

  @ApiProperty({ example: 1.25, description: 'Agreed unit price' })
  @IsNumber({}, { message: 'Unit price must be a number' })
  @Min(0, { message: 'Unit price cannot be negative' })
  unitPrice!: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e020', description: 'Supplier UUID' })
  @IsUUID('4', { message: 'Supplier ID must be a valid UUID' })
  supplierId!: string;

  @ApiProperty({ example: '2026-08-20', description: 'Purchase order date (ISO string)' })
  @IsDateString({}, { message: 'Order date must be a valid ISO date string' })
  orderDate!: string;

  @ApiPropertyOptional({ example: '2026-08-22', description: 'Expected supplier delivery date' })
  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @ApiProperty({ type: () => [PurchaseOrderItemInputDto], description: 'List of order lines' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemInputDto)
  items!: PurchaseOrderItemInputDto[];

  @ApiPropertyOptional({ example: 'Urgent weekend dairy restock' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdatePurchaseOrderDto {
  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e020' })
  @IsOptional()
  @IsUUID('4')
  supplierId?: string;

  @ApiPropertyOptional({ example: '2026-08-20' })
  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @ApiPropertyOptional({ example: '2026-08-22' })
  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @ApiPropertyOptional({ type: () => [PurchaseOrderItemInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemInputDto)
  items?: PurchaseOrderItemInputDto[];

  @ApiPropertyOptional({ example: 'Updated notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CancelPurchaseOrderDto {
  @ApiProperty({ example: 'Supplier out of stock / pricing mismatch', description: 'Mandatory cancellation reason' })
  @IsString()
  @IsNotEmpty({ message: 'A cancellation reason is required' })
  @MaxLength(500)
  reason!: string;
}

export class QueryPurchaseOrdersDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'approved',
    enum: [
      'draft',
      'submitted',
      'approved',
      'received',
      'cancelled',
      'partially_received',
      'sent',
      'confirmed',
    ],
  })
  @IsOptional()
  @IsEnum([
    'draft',
    'submitted',
    'approved',
    'received',
    'cancelled',
    'partially_received',
    'sent',
    'confirmed',
  ])
  status?: PurchaseOrderStatus;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e020' })
  @IsOptional()
  @IsUUID('4')
  supplierId?: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'active', description: 'Tab filter: active or history' })
  @IsOptional()
  @IsString()
  tab?: string;
}

export class PurchaseOrderItemResponseDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e033' })
  id!: string;

  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e055' })
  poId!: string;

  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e0a1' })
  itemId!: string;

  @ApiProperty({ example: 'DAI-001' })
  sku!: string;

  @ApiProperty({ example: 'Whole Milk 3.5%' })
  name!: string;

  @ApiProperty({ example: 50 })
  quantityOrdered!: number;

  @ApiProperty({ example: 0 })
  quantityReceived!: number;

  @ApiProperty({ example: 'L' })
  unit!: string;

  @ApiProperty({ example: 1.25 })
  unitPrice!: number;

  @ApiProperty({ example: 62.5 })
  totalPrice!: number;
}

export class PurchaseOrderResponseDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e055' })
  id!: string;

  @ApiProperty({ example: '01915dfa-9012-7000-8000-000000000002' })
  storeId!: string;

  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e020' })
  supplierId!: string;

  @ApiPropertyOptional({ example: 'Fresh Farms Direct' })
  supplierName?: string;

  @ApiProperty({ example: 'PO-20260820-0001' })
  orderNumber!: string;

  @ApiProperty({ example: '2026-08-20' })
  orderDate!: string;

  @ApiPropertyOptional({ example: '2026-08-22' })
  expectedDeliveryDate?: string;

  @ApiProperty({ example: 'draft', enum: ['draft', 'submitted', 'approved', 'received', 'cancelled'] })
  status!: PurchaseOrderStatus;

  @ApiProperty({ example: 100.0 })
  subtotal!: number;

  @ApiProperty({ example: 10.0 })
  taxAmount!: number;

  @ApiProperty({ example: 110.0 })
  totalAmount!: number;

  @ApiProperty({ example: 2 })
  itemCount!: number;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e001' })
  submittedBy?: string;

  @ApiPropertyOptional({ example: '2026-08-20T08:15:00.000Z' })
  submittedAt?: string;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e001' })
  approvedBy?: string;

  @ApiPropertyOptional({ example: 'Mario Batali' })
  approvedByName?: string;

  @ApiPropertyOptional({ example: '2026-08-20T08:30:00.000Z' })
  approvedAt?: string;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e001' })
  cancelledBy?: string;

  @ApiPropertyOptional({ example: '2026-08-20T08:45:00.000Z' })
  cancelledAt?: string;

  @ApiPropertyOptional({ example: 'Duplicate order' })
  cancellationReason?: string;

  @ApiPropertyOptional({ example: 'Urgent order' })
  notes?: string;

  @ApiProperty({ example: '2026-08-20T08:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-20T08:30:00.000Z' })
  updatedAt!: string;
}

export class PurchaseOrderDetailResponseDto extends PurchaseOrderResponseDto {
  @ApiProperty({ type: () => [PurchaseOrderItemResponseDto] })
  items!: PurchaseOrderItemResponseDto[];
}

export class GoodsReceiptItemInputDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e0a1' })
  @IsUUID('4', { message: 'Item ID must be a valid UUID' })
  itemId!: string;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e033' })
  @IsOptional()
  @IsUUID('4')
  poItemId?: string;

  @ApiProperty({ example: 50, description: 'Actual quantity received at loading dock' })
  @IsNumber({}, { message: 'Quantity received must be a number' })
  @Min(0.001, { message: 'Quantity received must be greater than 0' })
  quantityReceived!: number;

  @ApiProperty({ example: 'L' })
  @IsEnum(['kg', 'g', 'L', 'ml', 'pcs', 'can', 'bottle', 'pack'])
  unit!: string;

  @ApiProperty({ example: 1.25 })
  @IsNumber({}, { message: 'Price per unit must be a number' })
  @Min(0)
  pricePerUnit!: number;

  @ApiProperty({ example: 'LOT-20260820-001', description: 'Batch number for FEFO lot tracking' })
  @IsString()
  @IsNotEmpty({ message: 'Batch / Lot number is required for FEFO tracking' })
  batchNumber!: string;

  @ApiProperty({ example: '2026-09-10', description: 'Perishable expiration date' })
  @IsDateString({}, { message: 'Expiry date is required for perishable stock' })
  expiryDate!: string;
}

export class CreateGoodsReceiptDto {
  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e055', description: 'Linked PO UUID' })
  @IsOptional()
  @IsUUID('4')
  poId?: string;

  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e020', description: 'Supplier UUID' })
  @IsUUID('4', { message: 'Supplier ID must be a valid UUID' })
  supplierId!: string;

  @ApiProperty({ example: 'INV-99201', description: 'Delivery invoice number' })
  @IsString()
  @IsNotEmpty({ message: 'Invoice / Delivery note number is required' })
  invoiceNumber!: string;

  @ApiProperty({ example: '2026-08-20' })
  @IsDateString()
  receiptDate!: string;

  @ApiProperty({ type: () => [GoodsReceiptItemInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GoodsReceiptItemInputDto)
  items!: GoodsReceiptItemInputDto[];

  @ApiPropertyOptional({ example: 'All crates intact and temperature checked 3.8C' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class QueryGoodsReceiptsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e020' })
  @IsOptional()
  @IsUUID('4')
  supplierId?: string;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e055' })
  @IsOptional()
  @IsUUID('4')
  poId?: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class GoodsReceiptItemResponseDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e044' })
  id!: string;

  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e066' })
  goodsReceiptId!: string;

  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e0a1' })
  itemId!: string;

  @ApiProperty({ example: 'DAI-001' })
  sku!: string;

  @ApiProperty({ example: 'Whole Milk 3.5%' })
  name!: string;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e033' })
  poItemId?: string;

  @ApiProperty({ example: 50 })
  quantityReceived!: number;

  @ApiProperty({ example: 'L' })
  unit!: string;

  @ApiProperty({ example: 1.25 })
  pricePerUnit!: number;

  @ApiProperty({ example: 62.5 })
  totalPrice!: number;

  @ApiProperty({ example: 'LOT-20260820-001' })
  batchNumber!: string;

  @ApiProperty({ example: '2026-09-10' })
  expiryDate!: string;
}

export class GoodsReceiptResponseDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e066' })
  id!: string;

  @ApiProperty({ example: '01915dfa-9012-7000-8000-000000000002' })
  storeId!: string;

  @ApiProperty({ example: 'GR-20260820-0001' })
  receiptNumber!: string;

  @ApiProperty({ example: 'INV-99201' })
  invoiceNumber!: string;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e055' })
  poId?: string;

  @ApiPropertyOptional({ example: 'PO-20260820-0001' })
  poOrderNumber?: string;

  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e020' })
  supplierId!: string;

  @ApiPropertyOptional({ example: 'Fresh Farms Direct' })
  supplierName?: string;

  @ApiProperty({ example: '2026-08-20' })
  receiptDate!: string;

  @ApiProperty({ example: 62.5 })
  totalAmount!: number;

  @ApiProperty({ example: 'verified', enum: ['draft', 'verified', 'discrepancy'] })
  status!: 'draft' | 'verified' | 'discrepancy';

  @ApiProperty({ example: 1 })
  itemCount!: number;

  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e001' })
  receivedBy!: string;

  @ApiPropertyOptional({ example: 'Mario Batali' })
  receivedByName?: string;

  @ApiPropertyOptional({ example: 'Delivery checked in' })
  notes?: string;

  @ApiProperty({ example: '2026-08-20T08:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-20T08:00:00.000Z' })
  updatedAt!: string;
}

export class GoodsReceiptDetailResponseDto extends GoodsReceiptResponseDto {
  @ApiProperty({ type: () => [GoodsReceiptItemResponseDto] })
  items!: GoodsReceiptItemResponseDto[];
}

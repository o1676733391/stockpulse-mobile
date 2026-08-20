import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export type AuditEventAction =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'INVENTORY_CREATE'
  | 'INVENTORY_UPDATE'
  | 'INVENTORY_ADJUST'
  | 'INVENTORY_ARCHIVE'
  | 'STOCK_COUNT_START'
  | 'STOCK_COUNT_SUBMIT'
  | 'STOCK_COUNT_APPROVE'
  | 'OCR_UPLOAD'
  | 'OCR_ITEM_UPDATE'
  | 'OCR_CONFIRM'
  | 'OCR_REJECT'
  | 'PO_CREATE'
  | 'PO_SUBMIT'
  | 'PO_APPROVE'
  | 'PO_CANCEL'
  | 'GOODS_RECEIPT_CREATE';

export type AuditEntityType =
  | 'auth'
  | 'inventory_item'
  | 'stock_count'
  | 'variance'
  | 'ocr_document'
  | 'purchase_order'
  | 'goods_receipt'
  | 'supplier'
  | 'user';

export class AuditQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'INVENTORY_ADJUST', description: 'Filter by event action identifier' })
  @IsOptional()
  @IsString()
  eventAction?: string;

  @ApiPropertyOptional({ example: 'inventory_item', description: 'Filter by entity domain type' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e001', description: 'Filter by performing actor UUID' })
  @IsOptional()
  @IsUUID('4')
  actorId?: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class CreateAuditLogDto {
  @ApiProperty({ example: '01915dfa-9012-7000-8000-000000000001' })
  @IsUUID('4')
  organizationId!: string;

  @ApiProperty({ example: '01915dfa-9012-7000-8000-000000000002' })
  @IsUUID('4')
  storeId!: string;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e001' })
  @IsOptional()
  @IsUUID('4')
  actorId?: string;

  @ApiPropertyOptional({ example: 'Mario Batali' })
  @IsOptional()
  @IsString()
  actorName?: string;

  @ApiPropertyOptional({ example: 'manager' })
  @IsOptional()
  @IsString()
  actorRole?: string;

  @ApiPropertyOptional({ example: '192.168.1.50' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ example: 'StockPulse Mobile iOS/1.2.0' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({ example: 'INVENTORY_ADJUST' })
  @IsString()
  @IsNotEmpty()
  eventAction!: string;

  @ApiProperty({ example: 'inventory_item' })
  @IsString()
  @IsNotEmpty()
  entityType!: string;

  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e0a1' })
  @IsString()
  @IsNotEmpty()
  entityId!: string;

  @ApiPropertyOptional({ example: 'DAI-001 (Whole Milk)' })
  @IsOptional()
  @IsString()
  entityIdentifier?: string;

  @ApiPropertyOptional({ example: { physicalStock: 25 } })
  @IsOptional()
  stateBefore?: Record<string, unknown>;

  @ApiPropertyOptional({ example: { physicalStock: 22.5 } })
  @IsOptional()
  stateAfter?: Record<string, unknown>;

  @ApiPropertyOptional({ example: { delta: -2.5 } })
  @IsOptional()
  stateDiff?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'SPOILAGE_TRIM_LOSS' })
  @IsOptional()
  @IsString()
  reasonCode?: string;
}

export class AuditLogResponseDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e033' })
  id!: string;

  @ApiProperty({ example: '01915dfa-9012-7000-8000-000000000001' })
  organizationId!: string;

  @ApiProperty({ example: '01915dfa-9012-7000-8000-000000000002' })
  storeId!: string;

  @ApiProperty({ example: 'AUD-20260820-0001' })
  eventNumber!: string;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e001' })
  actorId?: string;

  @ApiPropertyOptional({ example: 'Mario Batali' })
  actorName?: string;

  @ApiPropertyOptional({ example: 'manager' })
  actorRole?: string;

  @ApiPropertyOptional({ example: '192.168.1.50' })
  ipAddress?: string;

  @ApiPropertyOptional({ example: 'StockPulse iOS/1.2.0' })
  userAgent?: string;

  @ApiProperty({ example: 'INVENTORY_ADJUST' })
  eventAction!: string;

  @ApiProperty({ example: 'inventory_item' })
  entityType!: string;

  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e0a1' })
  entityId!: string;

  @ApiPropertyOptional({ example: 'DAI-001 (Whole Milk)' })
  entityIdentifier?: string;

  @ApiPropertyOptional({ example: { physicalStock: 25 } })
  stateBefore?: Record<string, unknown>;

  @ApiPropertyOptional({ example: { physicalStock: 22.5 } })
  stateAfter?: Record<string, unknown>;

  @ApiPropertyOptional({ example: { delta: -2.5 } })
  stateDiff?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'SPOILAGE_TRIM_LOSS' })
  reasonCode?: string;

  @ApiProperty({ example: '0000000000000000000000000000000000000000000000000000000000000000' })
  prevHash!: string;

  @ApiProperty({ example: '9b1deb4d3b7d4bad9bdd2b0d7b3dcb6d88a1b2c3d4e5f60718293a4b5c6d7e8f' })
  currentHash!: string;

  @ApiProperty({ example: '2026-08-20T08:00:00.000Z' })
  createdAt!: string;
}

export class AuditChainVerificationResponseDto {
  @ApiProperty({ example: true, description: 'True if 100% of cryptographic hashes and previous hashes are unbroken' })
  isValid!: boolean;

  @ApiProperty({ example: 250, description: 'Total sequential audit log blocks verified' })
  totalRecordsVerified!: number;

  @ApiPropertyOptional({ example: null, description: 'UUID of record that failed verification if tampered' })
  tamperedRecordId?: string;

  @ApiProperty({ example: 'Cryptographic ledger chain integrity verified successfully' })
  message!: string;

  @ApiProperty({ example: '2026-08-20T08:30:00.000Z' })
  verifiedAt!: string;
}

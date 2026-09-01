import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { OcrStatus } from '../entities/ocr-document.entity';

export class PresignedUploadRequestDto {
  @ApiProperty({
    example: 'image/jpeg',
    enum: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    description: 'MIME type of receipt or POS Z-report image',
  })
  @IsEnum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], {
    message: 'Allowed file formats: image/jpeg, image/png, image/webp, application/pdf',
  })
  mimeType!: string;

  @ApiProperty({ example: 204800, description: 'File size in bytes (max 10MB)' })
  @IsNumber()
  @Min(1, { message: 'File size must be greater than 0 bytes' })
  @Max(10485760, { message: 'File size cannot exceed 10MB (10485760 bytes)' })
  fileSizeBytes!: number;

  @ApiProperty({
    example: 'pos_z_report',
    enum: ['pos_z_report', 'supplier_invoice', 'generic_receipt'],
    description: 'Document classification type',
  })
  @IsEnum(['pos_z_report', 'supplier_invoice', 'generic_receipt'])
  documentType!: string;
}

export class TriggerScanRequestDto {
  @ApiPropertyOptional({
    example: 'stores/store-01/ocr/raw/pos_z_report_20260820.jpg',
    description: 'Storage path returned from presigned upload step',
  })
  @IsOptional()
  @IsString()
  storagePath?: string;

  @ApiPropertyOptional({
    example: 'pos_z_report',
    enum: ['pos_z_report', 'supplier_invoice', 'generic_receipt'],
  })
  @IsOptional()
  @IsEnum(['pos_z_report', 'supplier_invoice', 'generic_receipt'])
  documentType?: string;

  @ApiPropertyOptional({ description: 'Optional base64 image representation' })
  @IsOptional()
  @IsString()
  imageBase64?: string;
}

export class UpdateOcrItemDto {
  @ApiPropertyOptional({ example: 'Espresso Double Shot (2x)', description: 'Corrected line item description' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ example: 4, description: 'Corrected quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ example: 3.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ example: 14.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalPrice?: number;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e077', description: 'Matched BOM recipe UUID' })
  @IsOptional()
  @IsUUID('all')
  matchedRecipeId?: string | null;
}

export class ConfirmOcrDeductionDto {
  @ApiPropertyOptional({ example: 'POS shift reconciliation confirmed by supervisor' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ example: true, default: true, description: 'Whether to deduct raw ingredients via BOM recipes' })
  @IsOptional()
  @IsBoolean()
  applyDeductions?: boolean = true;

  @ApiPropertyOptional({ description: 'Optional line items passed during review confirmation' })
  @IsOptional()
  @IsArray()
  items?: any[];

  @ApiPropertyOptional({ description: 'Optional report ID when using flat confirm payload' })
  @IsOptional()
  @IsString()
  reportId?: string;
}

export class RejectOcrDocumentDto {
  @ApiProperty({ example: 'Image is unreadable or blurry', description: 'Mandatory rejection reason' })
  @IsString()
  @IsNotEmpty({ message: 'A rejection reason is required' })
  @MaxLength(500)
  reason!: string;
}

export class QueryOcrDocumentsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'review_pending',
    enum: ['processing', 'review_pending', 'confirmed', 'rejected', 'failed'],
  })
  @IsOptional()
  @IsEnum(['processing', 'review_pending', 'confirmed', 'rejected', 'failed'])
  status?: OcrStatus;

  @ApiPropertyOptional({ example: 'pos_z_report', enum: ['pos_z_report', 'supplier_invoice', 'generic_receipt'] })
  @IsOptional()
  @IsEnum(['pos_z_report', 'supplier_invoice', 'generic_receipt'])
  documentType?: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class OcrItemResponseDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e088' })
  id!: string;

  @ApiProperty({ example: 1 })
  lineNumber!: number;

  @ApiProperty({ example: '2x Caffe Latte $8.00' })
  rawText!: string;

  @ApiProperty({ example: 'Caffe Latte' })
  description!: string;

  @ApiPropertyOptional({ example: 'ART-101' })
  articleNumber?: string;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiPropertyOptional({ example: 4.0 })
  unitPrice?: number;

  @ApiPropertyOptional({ example: 8.0 })
  totalPrice?: number;

  @ApiProperty({ example: 0.96, description: 'Document AI OCR parsing confidence (0.0 to 1.0)' })
  confidence!: number;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e077' })
  matchedRecipeId?: string;

  @ApiPropertyOptional({ example: 'Caffe Latte Recipe' })
  matchedRecipeName?: string;

  @ApiProperty({ example: 'exact', enum: ['exact', 'fuzzy', 'unmatched'] })
  matchStatus!: string;

  @ApiProperty({ example: false, description: 'True if confidence < 80% or unmatched recipe' })
  needsReview!: boolean;
}

export class OcrBomPreviewItemDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e088' })
  ocrItemId!: string;

  @ApiProperty({ example: 'Caffe Latte' })
  recipeName!: string;

  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e0a1' })
  ingredientId!: string;

  @ApiProperty({ example: 'Whole Milk 3.5%' })
  ingredientName!: string;

  @ApiProperty({ example: 0.4 })
  quantityDeducted!: number;

  @ApiProperty({ example: 'L' })
  unit!: string;

  @ApiProperty({ example: 1.25 })
  unitCost!: number;

  @ApiProperty({ example: 0.5 })
  totalCost!: number;
}

export class OcrDocumentResponseDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e055' })
  id!: string;

  @ApiProperty({ example: '01915dfa-9012-7000-8000-000000000002' })
  storeId!: string;

  @ApiProperty({ example: 'pos_z_report' })
  documentType!: string;

  @ApiProperty({ example: 'pos_z_report_20260820.jpg' })
  fileName!: string;

  @ApiProperty({ example: 'stores/store-01/ocr/raw/pos_z_report_20260820.jpg' })
  storagePath!: string;

  @ApiProperty({ example: 'image/jpeg' })
  mimeType!: string;

  @ApiProperty({ example: 204800 })
  fileSizeBytes!: number;

  @ApiProperty({ example: 'review_pending', enum: ['processing', 'review_pending', 'confirmed', 'rejected', 'failed'] })
  status!: OcrStatus;

  @ApiPropertyOptional({ example: 0.94 })
  overallConfidence?: number;

  @ApiProperty({ example: false })
  needsReview!: boolean;

  @ApiPropertyOptional({ example: '2026-08-20T08:05:00.000Z' })
  processedAt?: string;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e001' })
  confirmedBy?: string;

  @ApiPropertyOptional({ example: 'Mario Batali' })
  confirmedByName?: string;

  @ApiPropertyOptional({ example: '2026-08-20T08:30:00.000Z' })
  confirmedAt?: string;

  @ApiPropertyOptional({ example: 'Low resolution image' })
  errorMessage?: string;

  @ApiProperty({ example: '2026-08-20T08:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-20T08:05:00.000Z' })
  updatedAt!: string;
}

export class OcrDocumentDetailResponseDto extends OcrDocumentResponseDto {
  @ApiPropertyOptional({
    example: {
      documentNumber: 'Z-10029',
      date: '2026-08-20',
      totalAmount: 185.5,
    },
  })
  metadata?: {
    documentNumber?: string;
    date?: string;
    supplierName?: string;
    currency?: string;
    netAmount?: number;
    taxAmount?: number;
    totalAmount?: number;
  };

  @ApiProperty({ type: () => [OcrItemResponseDto] })
  extractedLines!: OcrItemResponseDto[];

  @ApiProperty({ type: () => [OcrBomPreviewItemDto] })
  bomPreview!: OcrBomPreviewItemDto[];
}

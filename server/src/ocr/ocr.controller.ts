import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { CurrentStore } from '../common/decorators/current-store.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import {
  ConfirmOcrDeductionDto,
  CreateOcrItemDto,
  OcrDocumentDetailResponseDto,
  OcrDocumentResponseDto,
  PresignedUploadRequestDto,
  QueryOcrDocumentsDto,
  RejectOcrDocumentDto,
  RevertOcrDocumentDto,
  TriggerScanRequestDto,
  UpdateOcrItemDto,
} from './dto/ocr.dto';
import { OcrService } from './ocr.service';

@ApiTags('OCR')
@ApiBearerAuth('BearerAuth')
@ApiHeader({
  name: 'X-Store-Id',
  description: 'Active store tenant UUID context',
  required: true,
})
@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post('presigned-upload')
  @Roles('admin', 'superadmin', 'manager', 'supervisor', 'staff')
  @RequirePermissions('ocr:scan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate pre-signed upload URL for direct receipt upload' })
  @ApiResponse({
    status: 200,
    description: 'Signed URL and storage path generated',
  })
  async generatePresignedUpload(
    @Body() dto: PresignedUploadRequestDto,
    @CurrentStore() storeId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.ocrService.generatePresignedUploadUrl(dto, storeId, actorId);
  }

  @Post('scan')
  @Roles('admin', 'superadmin', 'manager', 'supervisor', 'staff')
  @RequirePermissions('ocr:scan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger OCR scan for uploaded receipt document' })
  @ApiResponse({
    status: 200,
    description: 'OCR processing triggered',
  })
  async triggerScan(
    @Body() dto: TriggerScanRequestDto,
    @CurrentStore() storeId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.ocrService.triggerScan(dto, storeId, actorId);
  }

  @Get('documents')
  @Roles('admin', 'superadmin', 'manager', 'supervisor', 'staff', 'auditor')
  @RequirePermissions('ocr:view')
  @ApiOperation({ summary: 'List historical OCR documents with pagination and status filters' })
  @ApiResponse({
    status: 200,
    description: 'Paginated OCR documents list',
    type: PaginatedResponseDto,
  })
  async findDocuments(
    @Query() query: QueryOcrDocumentsDto,
    @CurrentStore() storeId: string,
  ): Promise<PaginatedResponseDto<OcrDocumentResponseDto>> {
    return this.ocrService.findDocuments(query, storeId);
  }

  @Get('documents/:id')
  @Roles('admin', 'superadmin', 'manager', 'supervisor', 'staff', 'auditor')
  @RequirePermissions('ocr:view')
  @ApiOperation({
    summary: 'Get full OCR document details, extracted lines, confidence scores, and BOM previews',
  })
  @ApiParam({ name: 'id', description: 'OCR document UUID' })
  @ApiResponse({
    status: 200,
    description: 'Document extraction details',
    type: OcrDocumentDetailResponseDto,
  })
  async getDocumentById(
    @Param('id') id: string,
    @CurrentStore() storeId: string,
  ): Promise<OcrDocumentDetailResponseDto> {
    return this.ocrService.getDocumentById(id, storeId);
  }

  @Patch('documents/:id/items/:itemId')
  @Roles('admin', 'superadmin', 'manager', 'supervisor')
  @RequirePermissions('ocr:review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually correct an extracted line item during review workflow' })
  @ApiParam({ name: 'id', description: 'OCR document UUID' })
  @ApiParam({ name: 'itemId', description: 'OCR line item UUID' })
  @ApiResponse({
    status: 200,
    description: 'Line item corrected',
  })
  async updateDocumentItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateOcrItemDto,
    @CurrentStore() storeId: string,
  ): Promise<{ success: boolean }> {
    return this.ocrService.updateDocumentItem(id, itemId, dto, storeId);
  }

  @Post('documents/:id/confirm')
  @Roles('admin', 'superadmin', 'manager', 'supervisor')
  @RequirePermissions('ocr:review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm document review and execute automated BOM ingredient deductions',
  })
  @ApiParam({ name: 'id', description: 'OCR document UUID' })
  @ApiResponse({
    status: 200,
    description: 'Document confirmed and inventory ledger synchronized',
  })
  async confirmReview(
    @Param('id') id: string,
    @Body() dto: ConfirmOcrDeductionDto,
    @CurrentStore() storeId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.ocrService.confirmReview(id, dto, storeId, actorId);
  }

  @Post('confirm')
  @Roles('admin', 'superadmin', 'manager', 'supervisor')
  @RequirePermissions('ocr:review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Flat endpoint to confirm document review and execute automated BOM ingredient deductions',
  })
  @ApiResponse({
    status: 200,
    description: 'Document confirmed and inventory ledger synchronized',
  })
  async confirmReviewFlat(
    @Body() dto: ConfirmOcrDeductionDto,
    @CurrentStore() storeId: string,
    @CurrentUser('id') actorId: string,
  ) {
    const docId = dto.reportId || 'default-doc';
    return this.ocrService.confirmReview(docId, dto, storeId, actorId);
  }

  @Post('documents/:id/reject')
  @Roles('admin', 'superadmin', 'manager', 'supervisor')
  @RequirePermissions('ocr:review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject OCR extraction results' })
  @ApiParam({ name: 'id', description: 'OCR document UUID' })
  @ApiResponse({
    status: 200,
    description: 'Document marked as rejected',
  })
  async rejectDocument(
    @Param('id') id: string,
    @Body() dto: RejectOcrDocumentDto,
    @CurrentStore() storeId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.ocrService.rejectDocument(id, dto, storeId, actorId);
  }

  @Post('documents/:id/items')
  @Roles('admin', 'superadmin', 'manager', 'supervisor')
  @RequirePermissions('ocr:review')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new line item during review workflow' })
  @ApiParam({ name: 'id', description: 'OCR document UUID' })
  async addDocumentItem(
    @Param('id') id: string,
    @Body() dto: CreateOcrItemDto,
    @CurrentStore() storeId: string,
  ) {
    return this.ocrService.addDocumentItem(id, dto, storeId);
  }

  @Delete('documents/:id/items/:itemId')
  @Roles('admin', 'superadmin', 'manager', 'supervisor')
  @RequirePermissions('ocr:review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a line item during review workflow' })
  @ApiParam({ name: 'id', description: 'OCR document UUID' })
  @ApiParam({ name: 'itemId', description: 'OCR line item UUID' })
  async deleteDocumentItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentStore() storeId: string,
  ) {
    return this.ocrService.deleteDocumentItem(id, itemId, storeId);
  }

  @Post('documents/:id/revert')
  @Roles('admin', 'superadmin', 'manager', 'supervisor')
  @RequirePermissions('ocr:review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revert warehouse stock changes for a duplicate or voided confirmed invoice' })
  @ApiParam({ name: 'id', description: 'OCR document UUID' })
  async revertDocument(
    @Param('id') id: string,
    @Body() dto: RevertOcrDocumentDto,
    @CurrentStore() storeId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.ocrService.revertReview(id, dto, storeId, actorId);
  }

  @Delete('documents/:id')
  @Roles('admin', 'superadmin', 'manager')
  @RequirePermissions('ocr:review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an OCR document with optional warehouse rollback' })
  @ApiParam({ name: 'id', description: 'OCR document UUID' })
  async deleteDocument(
    @Param('id') id: string,
    @Query('revertWarehouse') revertWarehouse: string,
    @CurrentStore() storeId: string,
    @CurrentUser('id') actorId: string,
  ) {
    const shouldRevert = revertWarehouse === 'true';
    return this.ocrService.deleteDocument(id, storeId, actorId, shouldRevert);
  }

  @Get('documents/:id/duplicate')
  @Roles('admin', 'superadmin', 'manager', 'supervisor', 'staff')
  @RequirePermissions('ocr:view')
  @ApiOperation({ summary: 'Check if a confirmed duplicate document exists' })
  @ApiParam({ name: 'id', description: 'OCR document UUID' })
  async checkDuplicate(
    @Param('id') id: string,
    @CurrentStore() storeId: string,
  ) {
    return this.ocrService.checkDuplicate(id, storeId);
  }
}

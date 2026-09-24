import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
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
import { OcrRepository } from './ocr.repository';
import { OcrProviderFactory } from './providers/ocr-provider.factory';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(
    private readonly ocrProviderFactory: OcrProviderFactory,
    private readonly ocrRepository: OcrRepository,
  ) {}

  /**
   * Generate pre-signed upload URL for direct mobile/client asset storage.
   */
  async generatePresignedUploadUrl(
    dto: PresignedUploadRequestDto,
    storeId: string,
    actorId?: string,
  ): Promise<{ uploadUrl: string; storagePath: string; documentId: string; expiresInSeconds: number }> {
    this.logger.log(`OcrService.generatePresignedUploadUrl: store=${storeId}, type=${dto.documentType}`);

    const ext = dto.mimeType.split('/')[1] || 'jpg';
    const fileName = `ocr_${Date.now()}.${ext}`;
    const storagePath = `stores/${storeId}/ocr/${fileName}`;

    const doc = await this.ocrRepository.createDocument({
      storeId,
      documentType: dto.documentType,
      fileName,
      storagePath,
      mimeType: dto.mimeType,
      fileSizeBytes: dto.fileSizeBytes,
      actorId,
    });

    const uploadUrl = `https://kicsoybxslqkdmuyqakl.supabase.co/storage/v1/upload/sign/receipts/${storagePath}`;

    return {
      uploadUrl,
      storagePath,
      documentId: doc.id,
      expiresInSeconds: 300,
    };
  }

  /**
   * Direct upload receipt file and trigger OCR processing pipeline.
   */
  async uploadAndProcess(
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    storeId: string,
    actorId: string,
    documentType: string = 'pos_z_report',
  ): Promise<OcrDocumentDetailResponseDto> {
    this.logger.log(`OcrService.uploadAndProcess: file=${file.originalname}, size=${file.size}`);

    const storagePath = `stores/${storeId}/ocr/${Date.now()}_${file.originalname}`;
    const doc = await this.ocrRepository.createDocument({
      storeId,
      documentType,
      fileName: file.originalname,
      storagePath,
      mimeType: file.mimetype,
      fileSizeBytes: file.size,
      actorId,
    });

    await this.processBuffer(doc.id, file.buffer, file.mimetype, storeId);
    const detail = await this.getDocumentById(doc.id, storeId);
    return detail;
  }

  /**
   * Trigger OCR processing for a previously uploaded or base64 document.
   */
  async triggerScan(
    dto: TriggerScanRequestDto,
    storeId: string,
    actorId?: string,
  ): Promise<{ documentId: string; status: string; extractedItemCount?: number }> {
    const documentType = dto.documentType || 'pos_z_report';
    const storagePath = dto.storagePath || `stores/${storeId}/ocr/pos_z_report_${Date.now()}.jpg`;
    this.logger.log(`OcrService.triggerScan on path: ${storagePath} in store: ${storeId}`);

    const fileName = storagePath.split('/').pop() || 'receipt.jpg';
    const doc = await this.ocrRepository.createDocument({
      storeId,
      documentType,
      fileName,
      storagePath,
      mimeType: 'image/jpeg',
      fileSizeBytes: 100000,
      actorId,
    });

    // Load real image from base64, storagePath on disk, or sample fixtures
    let sampleBuffer: Buffer;
    if (dto.imageBase64 && dto.imageBase64.trim() !== '') {
      sampleBuffer = Buffer.from(dto.imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    } else {
      const resolvedPath = path.resolve(process.cwd(), storagePath);
      const fixturePath = path.resolve(process.cwd(), '../data-sample/receipt/rec-1.jpg');
      const localFixturePath = path.resolve(process.cwd(), 'data-sample/receipt/rec-1.jpg');

      if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
        sampleBuffer = fs.readFileSync(resolvedPath);
      } else if (fs.existsSync(fixturePath)) {
        sampleBuffer = fs.readFileSync(fixturePath);
      } else if (fs.existsSync(localFixturePath)) {
        sampleBuffer = fs.readFileSync(localFixturePath);
      } else {
        throw new BadRequestException('No image buffer or base64 data provided for OCR scanning');
      }
    }

    await this.processBuffer(doc.id, sampleBuffer, 'image/jpeg', storeId, documentType);

    const docDetail = await this.getDocumentById(doc.id, storeId);

    return {
      documentId: doc.id,
      status: 'review_pending',
      extractedItemCount: docDetail.extractedLines.length,
    };
  }

  /**
   * Core processing engine invoking Gemini Multimodal Vision with invoice-type prompt.
   */
  async processBuffer(
    documentId: string,
    buffer: Buffer,
    mimeType: string,
    storeId: string,
    documentType?: string,
  ): Promise<void> {
    try {
      const provider = this.ocrProviderFactory.getProvider();
      this.logger.log(
        `Executing OCR via provider: ${provider.providerName} (${provider.providerId}) with docType=${documentType}`,
      );

      const extraction = await provider.processDocument(buffer, mimeType, { documentType });
      await this.ocrRepository.saveExtractionResults(documentId, storeId, extraction);
    } catch (err: any) {
      this.logger.error(`OCR processing failed: ${err.message}`, err.stack);
      await this.ocrRepository.markDocumentFailed(documentId, storeId, err.message);
      throw err;
    }
  }

  /**
   * Get full document review detail with extracted lines and BOM previews.
   */
  async getDocumentById(
    documentId: string,
    storeId: string,
  ): Promise<OcrDocumentDetailResponseDto> {
    const doc = await this.ocrRepository.findDocumentById(documentId, storeId);
    if (!doc) {
      throw new NotFoundException(`OCR Document '${documentId}' not found in store '${storeId}'`);
    }
    return doc;
  }

  /**
   * Query OCR documents list.
   */
  async findDocuments(
    query: QueryOcrDocumentsDto,
    storeId: string,
  ): Promise<PaginatedResponseDto<OcrDocumentResponseDto>> {
    return this.ocrRepository.findDocuments(query, storeId);
  }

  /**
   * Correct or adjust an extracted line item during review.
   */
  async updateDocumentItem(
    documentId: string,
    itemId: string,
    dto: UpdateOcrItemDto,
    storeId: string,
  ): Promise<{ success: boolean }> {
    const doc = await this.getDocumentById(documentId, storeId);
    if (doc.status !== 'review_pending' && doc.status !== 'processing') {
      throw new BadRequestException(
        `Cannot edit item for document with status '${doc.status}' (must be 'review_pending')`,
      );
    }

    await this.ocrRepository.updateDocumentItem(documentId, itemId, dto, storeId);
    return { success: true };
  }

  /**
   * Add manual line item to document during review.
   */
  async addDocumentItem(
    documentId: string,
    dto: CreateOcrItemDto,
    storeId: string,
  ): Promise<any> {
    const doc = await this.getDocumentById(documentId, storeId);
    if (doc.status !== 'review_pending' && doc.status !== 'processing') {
      throw new BadRequestException(
        `Cannot add item for document with status '${doc.status}' (must be 'review_pending')`,
      );
    }

    return this.ocrRepository.addDocumentItem(documentId, dto, storeId);
  }

  /**
   * Delete an extracted line item during review.
   */
  async deleteDocumentItem(
    documentId: string,
    itemId: string,
    storeId: string,
  ): Promise<{ success: boolean }> {
    const doc = await this.getDocumentById(documentId, storeId);
    if (doc.status !== 'review_pending' && doc.status !== 'processing') {
      throw new BadRequestException(
        `Cannot delete item for document with status '${doc.status}' (must be 'review_pending')`,
      );
    }

    await this.ocrRepository.deleteDocumentItem(documentId, itemId, storeId);
    return { success: true };
  }

  /**
   * Confirm document review and apply inventory updates (deductions for order invoices, additions for goods receipts).
   */
  async confirmReview(
    documentId: string,
    dto: ConfirmOcrDeductionDto,
    storeId: string,
    actorId: string,
  ): Promise<{
    success: boolean;
    documentId: string;
    message: string;
    deductions: Array<{
      itemId: string;
      itemName: string;
      delta: number;
      unit: string;
      costEur: number;
      theoreticalBefore: number;
      theoreticalAfter: number;
    }>;
  }> {
    this.logger.log(`OcrService.confirmReview: doc=${documentId} by actor=${actorId}`);

    const doc = await this.getDocumentById(documentId, storeId);
    if (doc.status === 'confirmed') {
      throw new BadRequestException('OCR document has already been confirmed and processed');
    }

    if (doc.status !== 'review_pending' && doc.status !== 'processing') {
      throw new BadRequestException(
        `Cannot confirm document with status '${doc.status}' (must be 'review_pending')`,
      );
    }

    let appliedDeductions: Array<{
      itemId: string;
      itemName: string;
      delta: number;
      unit: string;
      costEur: number;
      theoreticalBefore: number;
      theoreticalAfter: number;
    }> = [];

    const isGoodsReceipt =
      doc.documentType === 'goods_receipt' ||
      doc.documentType === 'supplier_invoice';

    if (isGoodsReceipt) {
      // Execute Goods Receipt inbound stock additions
      appliedDeductions = await this.ocrRepository.applyGoodsReceiptStock(
        storeId,
        documentId,
        actorId,
        doc.extractedLines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          matchedItemId: l.matchedRecipeId,
        })),
      );
    } else if (dto.applyDeductions !== false && doc.bomPreview.length > 0) {
      // Execute Order Invoice BOM Deductions
      const deductions = doc.bomPreview.map((b) => ({
        ocrItemId: b.ocrItemId,
        itemId: b.ingredientId,
        quantityDeducted: b.quantityDeducted,
        unit: b.unit,
        unitCost: b.unitCost,
        totalCost: b.totalCost,
      }));

      appliedDeductions = await this.ocrRepository.applyBomDeductions(
        storeId,
        documentId,
        actorId,
        deductions,
      );
    }

    await this.ocrRepository.markDocumentConfirmed(documentId, storeId, actorId, dto.notes);

    return {
      success: true,
      documentId,
      message: isGoodsReceipt
        ? 'Goods receipt confirmed and warehouse inventory stock updated'
        : 'OCR order invoice confirmed and BOM recipe deductions synchronized',
      deductions: appliedDeductions,
    };
  }

  /**
   * Revert and rollback warehouse stock for an already confirmed document (e.g. duplicate scan).
   */
  async revertReview(
    documentId: string,
    dto: RevertOcrDocumentDto,
    storeId: string,
    actorId: string,
  ): Promise<{ success: boolean; revertedItemsCount: number; message: string }> {
    this.logger.log(`OcrService.revertReview: doc=${documentId} by actor=${actorId}`);
    const doc = await this.getDocumentById(documentId, storeId);
    if (doc.status !== 'confirmed') {
      throw new BadRequestException(
        `Cannot revert document with status '${doc.status}' (must be 'confirmed')`,
      );
    }

    return this.ocrRepository.revertWarehouseStock(storeId, documentId, actorId, dto?.reason);
  }

  /**
   * Delete OCR document record with optional warehouse rollback if confirmed.
   */
  async deleteDocument(
    documentId: string,
    storeId: string,
    actorId?: string,
    revertWarehouse: boolean = false,
  ): Promise<{ success: boolean }> {
    const doc = await this.getDocumentById(documentId, storeId);
    if (doc.status === 'confirmed' && revertWarehouse && actorId) {
      await this.ocrRepository.revertWarehouseStock(
        storeId,
        documentId,
        actorId,
        'Auto-rollback upon document deletion',
      );
    }

    await this.ocrRepository.deleteDocument(documentId, storeId);
    return { success: true };
  }

  /**
   * Check if an identical document number was already confirmed in the store.
   */
  async checkDuplicate(
    documentId: string,
    storeId: string,
  ): Promise<{ isDuplicate: boolean; duplicateDoc?: OcrDocumentResponseDto | null }> {
    const doc = await this.getDocumentById(documentId, storeId);
    const docNum = doc.metadata?.documentNumber;
    if (!docNum || !docNum.trim()) return { isDuplicate: false };

    const duplicate = await this.ocrRepository.findDuplicateConfirmedDocument(
      storeId,
      docNum,
      documentId,
    );

    return {
      isDuplicate: !!duplicate,
      duplicateDoc: duplicate,
    };
  }

  /**
   * Reject OCR document.
   */
  async rejectDocument(
    documentId: string,
    dto: RejectOcrDocumentDto,
    storeId: string,
    actorId: string,
  ): Promise<{ success: boolean; documentId: string }> {
    const doc = await this.getDocumentById(documentId, storeId);
    if (doc.status === 'confirmed') {
      throw new BadRequestException('Cannot reject an already confirmed document');
    }

    await this.ocrRepository.markDocumentRejected(documentId, storeId, actorId, dto.reason);
    return { success: true, documentId };
  }
}

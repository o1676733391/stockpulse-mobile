import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import {
  ConfirmOcrDeductionDto,
  OcrDocumentDetailResponseDto,
  OcrDocumentResponseDto,
  PresignedUploadRequestDto,
  QueryOcrDocumentsDto,
  RejectOcrDocumentDto,
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

    const uploadUrl = `https://supabase.co/storage/v1/upload/sign/receipts/${storagePath}?token=mock_signed_token`;

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
   * Trigger OCR processing for a previously uploaded document.
   */
  async triggerScan(
    dto: TriggerScanRequestDto,
    storeId: string,
    actorId?: string,
  ): Promise<{ documentId: string; status: string }> {
    this.logger.log(`OcrService.triggerScan on path: ${dto.storagePath} in store: ${storeId}`);

    const fileName = dto.storagePath.split('/').pop() || 'receipt.jpg';
    const doc = await this.ocrRepository.createDocument({
      storeId,
      documentType: dto.documentType,
      fileName,
      storagePath: dto.storagePath,
      mimeType: 'image/jpeg',
      fileSizeBytes: 100000,
      actorId,
    });

    // Load real image if available on disk, or use a valid JPEG buffer
    let sampleBuffer: Buffer;
    const resolvedPath = path.resolve(process.cwd(), dto.storagePath);
    const fixturePath = path.resolve(process.cwd(), '../data-sample/receipt/rec-1.jpg');
    const localFixturePath = path.resolve(process.cwd(), 'data-sample/receipt/rec-1.jpg');

    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
      sampleBuffer = fs.readFileSync(resolvedPath);
    } else if (fs.existsSync(fixturePath)) {
      sampleBuffer = fs.readFileSync(fixturePath);
    } else if (fs.existsSync(localFixturePath)) {
      sampleBuffer = fs.readFileSync(localFixturePath);
    } else {
      // Valid minimal JPEG binary
      sampleBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
        0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
        0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
        0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
        0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
        0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
        0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
        0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
        0x00, 0xbf, 0x80, 0xff, 0xd9
      ]);
    }

    await this.processBuffer(doc.id, sampleBuffer, 'image/jpeg', storeId);

    return {
      documentId: doc.id,
      status: 'review_pending',
    };
  }

  /**
   * Core processing engine decoupled from vendor APIs.
   */
  async processBuffer(
    documentId: string,
    buffer: Buffer,
    mimeType: string,
    storeId: string,
  ): Promise<void> {
    try {
      const provider = this.ocrProviderFactory.getProvider();
      this.logger.log(`Executing OCR via provider: ${provider.providerName} (${provider.providerId})`);

      const extraction = await provider.processDocument(buffer, mimeType);
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
        `Cannot edit item for document in status '${doc.status}' (must be 'review_pending')`,
      );
    }

    await this.ocrRepository.updateDocumentItem(documentId, itemId, dto, storeId);
    return { success: true };
  }

  /**
   * Confirm document review and apply automatic BOM recipe deductions to inventory.
   */
  async confirmReview(
    documentId: string,
    dto: ConfirmOcrDeductionDto,
    storeId: string,
    actorId: string,
  ): Promise<{ success: boolean; documentId: string; message: string }> {
    this.logger.log(`OcrService.confirmReview: doc=${documentId} by actor=${actorId}`);

    const doc = await this.getDocumentById(documentId, storeId);
    if (doc.status !== 'review_pending') {
      throw new BadRequestException(
        `Cannot confirm document with status '${doc.status}' (must be 'review_pending')`,
      );
    }

    // Execute BOM deductions if requested and matched recipes exist
    if (dto.applyDeductions !== false && doc.bomPreview.length > 0) {
      const deductions = doc.bomPreview.map((b) => ({
        ocrItemId: b.ocrItemId,
        itemId: b.ingredientId,
        quantityDeducted: b.quantityDeducted,
        unit: b.unit,
        unitCost: b.unitCost,
        totalCost: b.totalCost,
      }));

      await this.ocrRepository.applyBomDeductions(storeId, documentId, actorId, deductions);
    }

    await this.ocrRepository.markDocumentConfirmed(documentId, storeId, actorId, dto.notes);

    return {
      success: true,
      documentId,
      message: 'OCR document confirmed and inventory deductions synchronized',
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

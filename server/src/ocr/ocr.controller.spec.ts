import { Test, TestingModule } from '@nestjs/testing';
import {
  ConfirmOcrDeductionDto,
  OcrDocumentDetailResponseDto,
  OcrDocumentResponseDto,
  PresignedUploadRequestDto,
  RejectOcrDocumentDto,
  TriggerScanRequestDto,
  UpdateOcrItemDto,
} from './dto/ocr.dto';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';

describe('OcrController', () => {
  let controller: OcrController;
  let service: jest.Mocked<OcrService>;

  const mockDoc: OcrDocumentResponseDto = {
    id: 'doc-01',
    storeId: 'store-01',
    documentType: 'pos_z_report',
    fileName: 'receipt.jpg',
    storagePath: 'stores/store-01/ocr/receipt.jpg',
    mimeType: 'image/jpeg',
    fileSizeBytes: 200000,
    status: 'review_pending',
    overallConfidence: 0.95,
    needsReview: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockDetail: OcrDocumentDetailResponseDto = {
    ...mockDoc,
    extractedLines: [],
    bomPreview: [],
  };

  beforeEach(async () => {
    const mockService = {
      generatePresignedUploadUrl: jest.fn().mockResolvedValue({
        uploadUrl: 'https://supabase.co/upload',
        storagePath: 'stores/store-01/ocr/receipt.jpg',
        documentId: 'doc-01',
        expiresInSeconds: 300,
      }),
      triggerScan: jest.fn().mockResolvedValue({ documentId: 'doc-01', status: 'review_pending' }),
      getDocumentById: jest.fn().mockResolvedValue(mockDetail),
      findDocuments: jest.fn().mockResolvedValue({
        data: [mockDoc],
        meta: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }),
      updateDocumentItem: jest.fn().mockResolvedValue({ success: true }),
      confirmReview: jest.fn().mockResolvedValue({
        success: true,
        documentId: 'doc-01',
        message: 'Confirmed',
      }),
      rejectDocument: jest.fn().mockResolvedValue({ success: true, documentId: 'doc-01' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OcrController],
      providers: [
        {
          provide: OcrService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<OcrController>(OcrController);
    service = module.get(OcrService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generatePresignedUpload', () => {
    it('should delegate to OcrService', async () => {
      const dto: PresignedUploadRequestDto = {
        mimeType: 'image/jpeg',
        fileSizeBytes: 150000,
        documentType: 'pos_z_report',
      };

      const result = await controller.generatePresignedUpload(dto, 'store-01', 'actor-01');
      expect(service.generatePresignedUploadUrl).toHaveBeenCalledWith(dto, 'store-01', 'actor-01');
      expect(result.uploadUrl).toBeDefined();
    });
  });

  describe('triggerScan', () => {
    it('should trigger OCR scan', async () => {
      const dto: TriggerScanRequestDto = {
        storagePath: 'stores/store-01/ocr/rec.jpg',
        documentType: 'pos_z_report',
      };

      const result = await controller.triggerScan(dto, 'store-01', 'actor-01');
      expect(service.triggerScan).toHaveBeenCalledWith(dto, 'store-01', 'actor-01');
      expect(result.status).toBe('review_pending');
    });
  });

  describe('updateDocumentItem', () => {
    it('should update line item in review', async () => {
      const dto: UpdateOcrItemDto = { quantity: 2 };
      const result = await controller.updateDocumentItem('doc-01', 'line-01', dto, 'store-01');

      expect(service.updateDocumentItem).toHaveBeenCalledWith('doc-01', 'line-01', dto, 'store-01');
      expect(result.success).toBe(true);
    });
  });

  describe('confirmReview', () => {
    it('should confirm document review', async () => {
      const dto: ConfirmOcrDeductionDto = { notes: 'Reviewed' };
      const result = await controller.confirmReview('doc-01', dto, 'store-01', 'actor-01');

      expect(service.confirmReview).toHaveBeenCalledWith('doc-01', dto, 'store-01', 'actor-01');
      expect(result.success).toBe(true);
    });
  });

  describe('rejectDocument', () => {
    it('should reject document', async () => {
      const dto: RejectOcrDocumentDto = { reason: 'Corrupt file' };
      const result = await controller.rejectDocument('doc-01', dto, 'store-01', 'actor-01');

      expect(service.rejectDocument).toHaveBeenCalledWith('doc-01', dto, 'store-01', 'actor-01');
      expect(result.success).toBe(true);
    });
  });
});

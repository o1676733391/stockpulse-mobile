import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ConfirmOcrDeductionDto,
  OcrDocumentDetailResponseDto,
  OcrDocumentResponseDto,
  PresignedUploadRequestDto,
  RejectOcrDocumentDto,
  UpdateOcrItemDto,
} from './dto/ocr.dto';
import { OcrRepository } from './ocr.repository';
import { OcrService } from './ocr.service';
import { OcrProviderFactory } from './providers/ocr-provider.factory';

describe('OcrService', () => {
  let service: OcrService;
  let repository: jest.Mocked<OcrRepository>;
  let providerFactory: jest.Mocked<OcrProviderFactory>;

  const mockDoc: OcrDocumentResponseDto = {
    id: 'doc-uuid-01',
    storeId: 'store-uuid-01',
    documentType: 'pos_z_report',
    fileName: 'receipt.jpg',
    storagePath: 'stores/store-uuid-01/ocr/receipt.jpg',
    mimeType: 'image/jpeg',
    fileSizeBytes: 240000,
    status: 'review_pending',
    overallConfidence: 0.95,
    needsReview: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockDetail: OcrDocumentDetailResponseDto = {
    ...mockDoc,
    metadata: {
      documentNumber: 'POS-001',
      date: '2026-08-20',
      totalAmount: 50.0,
      currency: 'EUR',
    },
    extractedLines: [
      {
        id: 'line-01',
        lineNumber: 1,
        rawText: '2x CHICKEN BURGER 25.00',
        description: 'Chicken Burger',
        quantity: 2,
        totalPrice: 25.0,
        confidence: 0.96,
        matchedRecipeId: 'rec-01',
        matchedRecipeName: 'Chicken Burger',
        matchStatus: 'EXACT_CODE',
        needsReview: false,
      },
    ],
    bomPreview: [
      {
        ocrItemId: 'line-01',
        recipeName: 'Chicken Burger',
        ingredientId: 'item-chk-01',
        ingredientName: 'Chicken Breast',
        quantityDeducted: 0.4,
        unit: 'kg',
        unitCost: 5.0,
        totalCost: 2.0,
      },
    ],
  };

  beforeEach(async () => {
    const mockRepo = {
      createDocument: jest.fn().mockResolvedValue(mockDoc),
      findDocumentById: jest.fn().mockResolvedValue(mockDetail),
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
      saveExtractionResults: jest.fn().mockResolvedValue(undefined),
      updateDocumentItem: jest.fn().mockResolvedValue(undefined),
      markDocumentConfirmed: jest.fn().mockResolvedValue(undefined),
      markDocumentRejected: jest.fn().mockResolvedValue(undefined),
      markDocumentFailed: jest.fn().mockResolvedValue(undefined),
      applyBomDeductions: jest.fn().mockResolvedValue(undefined),
    };

    const mockProvider = {
      providerId: 'google_document_ai',
      providerName: 'Google Document AI',
      processDocument: jest.fn().mockResolvedValue({
        providerId: 'google_document_ai',
        processingDurationMs: 500,
        overallConfidence: 0.95,
        metadata: { totalAmount: 50 },
        lineItems: [
          {
            lineNumber: 1,
            rawText: '2x CHICKEN BURGER 25.00',
            description: 'Chicken Burger',
            quantity: 2,
            totalPrice: 25.0,
            confidence: 0.96,
          },
        ],
      }),
      healthCheck: jest.fn().mockResolvedValue(true),
    };

    const mockFactory = {
      getProvider: jest.fn().mockReturnValue(mockProvider),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OcrService,
        {
          provide: OcrRepository,
          useValue: mockRepo,
        },
        {
          provide: OcrProviderFactory,
          useValue: mockFactory,
        },
      ],
    }).compile();

    service = module.get<OcrService>(OcrService);
    repository = module.get(OcrRepository);
    providerFactory = module.get(OcrProviderFactory);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generatePresignedUploadUrl', () => {
    it('should create document and return signed upload URL', async () => {
      const dto: PresignedUploadRequestDto = {
        mimeType: 'image/jpeg',
        fileSizeBytes: 200000,
        documentType: 'pos_z_report',
      };

      const result = await service.generatePresignedUploadUrl(dto, 'store-uuid-01', 'actor-01');

      expect(repository.createDocument).toHaveBeenCalled();
      expect(result.uploadUrl).toContain('supabase.co');
      expect(result.documentId).toBe('doc-uuid-01');
    });
  });

  describe('triggerScan', () => {
    it('should process scan via OCRProvider', async () => {
      const result = await service.triggerScan(
        { storagePath: 'stores/store-uuid-01/ocr/receipt.jpg', documentType: 'pos_z_report' },
        'store-uuid-01',
        'actor-01',
      );

      expect(repository.createDocument).toHaveBeenCalled();
      expect(repository.saveExtractionResults).toHaveBeenCalled();
      expect(result.status).toBe('review_pending');
    });
  });

  describe('updateDocumentItem', () => {
    it('should allow modifying line item in review_pending status', async () => {
      const dto: UpdateOcrItemDto = { quantity: 3, description: 'Corrected Burger' };
      const result = await service.updateDocumentItem('doc-uuid-01', 'line-01', dto, 'store-uuid-01');

      expect(repository.updateDocumentItem).toHaveBeenCalledWith(
        'doc-uuid-01',
        'line-01',
        dto,
        'store-uuid-01',
      );
      expect(result.success).toBe(true);
    });

    it('should throw BadRequestException if document is already confirmed', async () => {
      repository.findDocumentById.mockResolvedValueOnce({
        ...mockDetail,
        status: 'confirmed',
      });

      const dto: UpdateOcrItemDto = { quantity: 3 };
      await expect(
        service.updateDocumentItem('doc-uuid-01', 'line-01', dto, 'store-uuid-01'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmReview', () => {
    it('should confirm document and apply BOM deductions to inventory', async () => {
      const dto: ConfirmOcrDeductionDto = { notes: 'Approved after review', applyDeductions: true };
      const result = await service.confirmReview('doc-uuid-01', dto, 'store-uuid-01', 'manager-01');

      expect(repository.applyBomDeductions).toHaveBeenCalled();
      expect(repository.markDocumentConfirmed).toHaveBeenCalledWith(
        'doc-uuid-01',
        'store-uuid-01',
        'manager-01',
        'Approved after review',
      );
      expect(result.success).toBe(true);
    });
  });

  describe('rejectDocument', () => {
    it('should mark document as rejected', async () => {
      const dto: RejectOcrDocumentDto = { reason: 'Image unreadable and blurry' };
      const result = await service.rejectDocument('doc-uuid-01', dto, 'store-uuid-01', 'manager-01');

      expect(repository.markDocumentRejected).toHaveBeenCalledWith(
        'doc-uuid-01',
        'store-uuid-01',
        'manager-01',
        'Image unreadable and blurry',
      );
      expect(result.success).toBe(true);
    });
  });
});

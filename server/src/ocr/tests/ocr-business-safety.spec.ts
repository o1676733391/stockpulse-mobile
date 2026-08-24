import { BadRequestException } from '@nestjs/common';
import { IOcrProvider } from '../interfaces/ocr-provider.interface';
import { OcrRepository } from '../ocr.repository';
import { OcrService } from '../ocr.service';
import { OcrProviderFactory } from '../providers/ocr-provider.factory';

describe('OCR Agent - Business Safety & Ledger Protection Tests', () => {
  let service: OcrService;
  let ocrRepository: OcrRepository;
  let ocrProviderFactory: OcrProviderFactory;

  const mockProvider: IOcrProvider = {
    providerId: 'gemini_vision',
    providerName: 'Google Gemini Multimodal Vision OCR Agent',
    healthCheck: jest.fn().mockResolvedValue(true),
    processDocument: jest.fn().mockResolvedValue({
      providerId: 'gemini_vision',
      processingDurationMs: 120,
      overallConfidence: 0.98,
      metadata: {
        documentNumber: 'BON-SAFE-001',
        date: '2026-08-20',
        totalAmount: 50.0,
      },
      lineItems: [
        {
          lineNumber: 1,
          description: 'Classic Cheeseburger',
          quantity: 2,
          unitPrice: 15.0,
          totalPrice: 30.0,
          confidence: 0.98,
        },
      ],
      rawResponse: {},
    }),
  };

  beforeEach(() => {
    ocrRepository = {
      createDocument: jest.fn().mockResolvedValue({
        id: 'doc-safety-01',
        storeId: 'store-01',
        documentType: 'pos_z_report',
        status: 'processing',
        needsReview: true,
      }),
      findDocumentById: jest.fn().mockResolvedValue({
        id: 'doc-safety-01',
        storeId: 'store-01',
        status: 'review_pending',
        overallConfidence: 0.98,
        extractedLines: [
          {
            id: 'item-01',
            lineNumber: 1,
            description: 'Classic Cheeseburger',
            quantity: 2,
            unitPrice: 15.0,
            totalPrice: 30.0,
            confidence: 0.98,
            needsReview: false,
          },
        ],
        bomPreview: [
          {
            ocrItemId: 'item-01',
            recipeName: 'Classic Cheeseburger',
            ingredientId: 'ing-beef-01',
            ingredientName: 'Beef Patty 180g',
            quantityDeducted: 2,
            unit: 'pcs',
            unitCost: 2.5,
            totalCost: 5.0,
          },
        ],
      }),
      findDocuments: jest.fn(),
      saveExtractionResults: jest.fn().mockResolvedValue(undefined),
      updateDocumentItem: jest.fn().mockResolvedValue(undefined),
      markDocumentConfirmed: jest.fn().mockResolvedValue(undefined),
      markDocumentRejected: jest.fn().mockResolvedValue(undefined),
      markDocumentFailed: jest.fn().mockResolvedValue(undefined),
      applyBomDeductions: jest.fn().mockResolvedValue(undefined),
    } as unknown as OcrRepository;

    ocrProviderFactory = {
      getProvider: jest.fn(() => mockProvider),
    } as unknown as OcrProviderFactory;

    service = new OcrService(ocrProviderFactory, ocrRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('7. Business Safety Constraints', () => {
    it('CRITICAL: OCR document scan must NEVER directly deduct BOM ingredients or modify stock upon scanning', async () => {
      // Trigger scan
      await service.processBuffer(
        'doc-safety-01',
        Buffer.from('fake-image-bytes'),
        'image/jpeg',
        'store-01',
      );

      // Verify OCR provider was called
      expect(mockProvider.processDocument).toHaveBeenCalled();
      // Verify extraction results saved to document review staging table
      expect(ocrRepository.saveExtractionResults).toHaveBeenCalledWith(
        'doc-safety-01',
        'store-01',
        expect.anything(),
      );

      // CRITICAL ASSERTION: applyBomDeductions must NOT have been called during scan!
      expect(ocrRepository.applyBomDeductions).not.toHaveBeenCalled();
      expect(ocrRepository.markDocumentConfirmed).not.toHaveBeenCalled();
    });

    it('CRITICAL: OCR results require explicit manual confirmation before deducting BOM ingredients', async () => {
      // 1. Before confirmation: No BOM deductions applied
      expect(ocrRepository.applyBomDeductions).not.toHaveBeenCalled();

      // 2. User/Manager explicitly triggers confirmation
      const confirmDto = {
        applyDeductions: true,
        notes: 'Manager approved register closure Z-report',
      };

      const result = await service.confirmReview(
        'doc-safety-01',
        confirmDto,
        'store-01',
        'user-manager-01',
      );

      // 3. After confirmation: Deductions applied and document marked confirmed
      expect(ocrRepository.applyBomDeductions).toHaveBeenCalledWith(
        'store-01',
        'doc-safety-01',
        'user-manager-01',
        expect.arrayContaining([
          expect.objectContaining({
            itemId: 'ing-beef-01',
            quantityDeducted: 2,
          }),
        ]),
      );
      expect(ocrRepository.markDocumentConfirmed).toHaveBeenCalledWith(
        'doc-safety-01',
        'store-01',
        'user-manager-01',
        confirmDto.notes,
      );
      expect(result.success).toBe(true);
    });

    it('CRITICAL: Rejecting an OCR document must NEVER deduct inventory or create ledger adjustments', async () => {
      await service.rejectDocument(
        'doc-safety-01',
        { reason: 'Image was too blurry and unreadable' },
        'store-01',
        'user-manager-01',
      );

      expect(ocrRepository.markDocumentRejected).toHaveBeenCalledWith(
        'doc-safety-01',
        'store-01',
        'user-manager-01',
        'Image was too blurry and unreadable',
      );
      expect(ocrRepository.applyBomDeductions).not.toHaveBeenCalled();
    });

    it('CRITICAL: Cannot confirm already confirmed document (idempotency / duplicate protection)', async () => {
      (ocrRepository.findDocumentById as jest.Mock).mockResolvedValueOnce({
        id: 'doc-safety-01',
        storeId: 'store-01',
        status: 'confirmed', // Already confirmed!
      });

      await expect(
        service.confirmReview(
          'doc-safety-01',
          { applyDeductions: true },
          'store-01',
          'user-manager-01',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

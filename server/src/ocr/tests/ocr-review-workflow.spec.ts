import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OcrRepository } from '../ocr.repository';
import { OcrService } from '../ocr.service';
import { OcrProviderFactory } from '../providers/ocr-provider.factory';

describe('OCR - Review & Correction Workflow Tests', () => {
  let service: OcrService;
  let repository: OcrRepository;
  let factory: OcrProviderFactory;

  const mockReviewDocument = {
    id: 'doc-review-01',
    storeId: 'store-01',
    documentType: 'pos_z_report',
    fileName: 'z_report_20260820.jpg',
    storagePath: 'stores/store-01/ocr/z_report_20260820.jpg',
    mimeType: 'image/jpeg',
    status: 'review_pending',
    overallConfidence: 0.78, // Low confidence, review required
    needsReview: true,
    extractedLines: [
      {
        id: 'line-01',
        lineNumber: 1,
        rawText: '2x Espreso 2.50 5.00',
        description: 'Espreso',
        quantity: 2,
        unitPrice: 2.5,
        totalPrice: 5.0,
        confidence: 0.75,
        matchedRecipeId: null, // Unmatched
        needsReview: true,
      },
    ],
    bomPreview: [
      {
        ocrItemId: 'line-01',
        recipeName: 'Espresso Single Shot',
        ingredientId: 'ing-coffee-beans',
        ingredientName: 'Espresso Coffee Beans',
        quantityDeducted: 0.018, // 18g for 2 shots
        unit: 'kg',
        unitCost: 20.0,
        totalCost: 0.36,
      },
    ],
  };

  beforeEach(() => {
    repository = {
      findDocumentById: jest.fn().mockResolvedValue(mockReviewDocument),
      updateDocumentItem: jest.fn().mockResolvedValue(undefined),
      markDocumentConfirmed: jest.fn().mockResolvedValue(undefined),
      markDocumentRejected: jest.fn().mockResolvedValue(undefined),
      applyBomDeductions: jest.fn().mockResolvedValue(undefined),
    } as unknown as OcrRepository;

    factory = {
      getProvider: jest.fn(),
    } as unknown as OcrProviderFactory;

    service = new OcrService(factory, repository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Line Item Corrections During Review', () => {
    it('should allow supervisor to correct item description, quantity, and recipe matching', async () => {
      const updateDto = {
        description: 'Espresso Double Shot',
        quantity: 3,
        unitPrice: 2.5,
        totalPrice: 7.5,
        matchedRecipeId: 'rec-espresso-double',
      };

      const res = await service.updateDocumentItem(
        'doc-review-01',
        'line-01',
        updateDto,
        'store-01',
      );

      expect(res.success).toBe(true);
      expect(repository.updateDocumentItem).toHaveBeenCalledWith(
        'doc-review-01',
        'line-01',
        updateDto,
        'store-01',
      );
    });

    it('should reject line item edit on a document that is already confirmed', async () => {
      (repository.findDocumentById as jest.Mock).mockResolvedValueOnce({
        ...mockReviewDocument,
        status: 'confirmed',
      });

      await expect(
        service.updateDocumentItem(
          'doc-review-01',
          'line-01',
          { quantity: 5 },
          'store-01',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject line item edit on a document that is already rejected', async () => {
      (repository.findDocumentById as jest.Mock).mockResolvedValueOnce({
        ...mockReviewDocument,
        status: 'rejected',
      });

      await expect(
        service.updateDocumentItem(
          'doc-review-01',
          'line-01',
          { quantity: 5 },
          'store-01',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when document does not exist', async () => {
      (repository.findDocumentById as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.updateDocumentItem(
          'doc-ghost',
          'line-01',
          { quantity: 5 },
          'store-01',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('2. Confirmation & BOM Deductions', () => {
    it('should confirm document review and apply BOM deductions to raw inventory', async () => {
      const res = await service.confirmReview(
        'doc-review-01',
        { applyDeductions: true, notes: 'Verified by evening shift supervisor' },
        'store-01',
        'user-supervisor-01',
      );

      expect(res.success).toBe(true);
      expect(repository.applyBomDeductions).toHaveBeenCalledWith(
        'store-01',
        'doc-review-01',
        'user-supervisor-01',
        expect.arrayContaining([
          expect.objectContaining({
            itemId: 'ing-coffee-beans',
            quantityDeducted: 0.018,
          }),
        ]),
      );
      expect(repository.markDocumentConfirmed).toHaveBeenCalledWith(
        'doc-review-01',
        'store-01',
        'user-supervisor-01',
        'Verified by evening shift supervisor',
      );
    });

    it('should confirm document review without BOM deductions if applyDeductions is false', async () => {
      const res = await service.confirmReview(
        'doc-review-01',
        { applyDeductions: false, notes: 'Financial review only without stock decrement' },
        'store-01',
        'user-supervisor-01',
      );

      expect(res.success).toBe(true);
      expect(repository.applyBomDeductions).not.toHaveBeenCalled();
      expect(repository.markDocumentConfirmed).toHaveBeenCalled();
    });
  });

  describe('3. Rejection Workflow', () => {
    it('should reject unreadable OCR document and record audit reason without deductions', async () => {
      const res = await service.rejectDocument(
        'doc-review-01',
        { reason: 'Receipt was heavily torn and ink was washed out' },
        'store-01',
        'user-supervisor-01',
      );

      expect(res.success).toBe(true);
      expect(repository.markDocumentRejected).toHaveBeenCalledWith(
        'doc-review-01',
        'store-01',
        'user-supervisor-01',
        'Receipt was heavily torn and ink was washed out',
      );
      expect(repository.applyBomDeductions).not.toHaveBeenCalled();
    });

    it('should prevent rejecting an already confirmed document', async () => {
      (repository.findDocumentById as jest.Mock).mockResolvedValueOnce({
        ...mockReviewDocument,
        status: 'confirmed',
      });

      await expect(
        service.rejectDocument(
          'doc-review-01',
          { reason: 'Too late to reject' },
          'store-01',
          'user-supervisor-01',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

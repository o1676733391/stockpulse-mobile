import { OcrRepository } from '../../ocr/ocr.repository';
import { OcrService } from '../../ocr/ocr.service';
import { OcrProviderFactory } from '../../ocr/providers/ocr-provider.factory';

describe('BOM Deduction - OCR Review & Integration Tests', () => {
  let ocrService: OcrService;
  let ocrRepository: OcrRepository;
  let providerFactory: OcrProviderFactory;

  const mockConfirmedDocument = {
    id: 'doc-bom-int-01',
    storeId: 'store-01',
    documentType: 'pos_z_report',
    fileName: 'z_report_daily.jpg',
    storagePath: 'stores/store-01/ocr/z_report_daily.jpg',
    mimeType: 'image/jpeg',
    status: 'review_pending',
    overallConfidence: 0.95,
    needsReview: false,
    extractedLines: [
      {
        id: 'line-01',
        lineNumber: 1,
        rawText: '10x Cappuccino 4.50 45.00',
        description: 'Cappuccino',
        quantity: 10,
        unitPrice: 4.5,
        totalPrice: 45.0,
        confidence: 0.98,
        matchedRecipeId: 'rec-cappuccino-01',
        needsReview: false,
      },
    ],
    bomPreview: [
      {
        ocrItemId: 'line-01',
        recipeName: 'Cappuccino 8oz',
        ingredientId: 'ing-coffee-beans',
        ingredientName: 'Arabica Beans',
        quantityDeducted: 0.189, // 10 * 0.018 * 1.05
        unit: 'kg',
        unitCost: 24.0,
        totalCost: 4.54,
      },
      {
        ocrItemId: 'line-01',
        recipeName: 'Cappuccino 8oz',
        ingredientId: 'ing-milk',
        ingredientName: 'Fresh Milk',
        quantityDeducted: 1.98, // 10 * 0.18 * 1.10
        unit: 'L',
        unitCost: 1.5,
        totalCost: 2.97,
      },
    ],
  };

  beforeEach(() => {
    ocrRepository = {
      findDocumentById: jest.fn().mockResolvedValue(mockConfirmedDocument),
      markDocumentConfirmed: jest.fn().mockResolvedValue(undefined),
      applyBomDeductions: jest.fn().mockResolvedValue(undefined),
    } as unknown as OcrRepository;

    providerFactory = {
      getProvider: jest.fn(),
    } as unknown as OcrProviderFactory;

    ocrService = new OcrService(providerFactory, ocrRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('1. Should deduct all previewed BOM ingredients on manager confirmation', async () => {
    const result = await ocrService.confirmReview(
      'doc-bom-int-01',
      { applyDeductions: true, notes: 'Closing shift confirmation' },
      'store-01',
      'user-mgr-01',
    );

    expect(result.success).toBe(true);
    expect(result.documentId).toBe('doc-bom-int-01');

    expect(ocrRepository.applyBomDeductions).toHaveBeenCalledWith(
      'store-01',
      'doc-bom-int-01',
      'user-mgr-01',
      expect.arrayContaining([
        expect.objectContaining({
          itemId: 'ing-coffee-beans',
          quantityDeducted: 0.189,
          totalCost: 4.54,
        }),
        expect.objectContaining({
          itemId: 'ing-milk',
          quantityDeducted: 1.98,
          totalCost: 2.97,
        }),
      ]),
    );
    expect(ocrRepository.markDocumentConfirmed).toHaveBeenCalledWith(
      'doc-bom-int-01',
      'store-01',
      'user-mgr-01',
      'Closing shift confirmation',
    );
  });

  it('2. Should skip BOM deductions if applyDeductions=false', async () => {
    const result = await ocrService.confirmReview(
      'doc-bom-int-01',
      { applyDeductions: false, notes: 'Financial only confirmation' },
      'store-01',
      'user-mgr-01',
    );

    expect(result.success).toBe(true);
    expect(result.documentId).toBe('doc-bom-int-01');
    expect(ocrRepository.applyBomDeductions).not.toHaveBeenCalled();
    expect(ocrRepository.markDocumentConfirmed).toHaveBeenCalled();
  });
});

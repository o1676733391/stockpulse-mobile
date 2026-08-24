import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  MOCK_BLURRY_LOW_CONFIDENCE_RECEIPT,
  MOCK_CLEAR_ENGLISH_POS_ZREPORT,
  MOCK_CLEAR_GERMAN_RECEIPT,
  MOCK_DUPLICATE_ITEMS_RECEIPT,
  MOCK_MISSING_DATA_RECEIPT,
  MOCK_ROTATED_CROPPED_RECEIPT,
} from '../../../test/fixtures/ocr-agent-fixtures';
import { GeminiVisionProvider } from '../providers/gemini-vision.provider';

describe('OCR Agent - Document & Structured Extraction Tests', () => {
  let provider: GeminiVisionProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiVisionProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'gemini.apiKey') return 'mock-test-key';
              if (key === 'gemini.model') return 'gemini-2.0-flash';
              return null;
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<GeminiVisionProvider>(GeminiVisionProvider);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Document Extraction Scenarios', () => {
    it('should accurately extract clear German Kassenzettel layout', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => MOCK_CLEAR_GERMAN_RECEIPT,
      }) as any;

      const result = await provider.processDocument(Buffer.from('clear-german-doc'), 'image/jpeg');

      expect(result.metadata.documentNumber).toBe('BON-DE-20260820-001');
      expect(result.metadata.supplierName).toBe('Brauhaus & Biergarten München');
      expect(result.metadata.totalAmount).toBe(46.0);
      expect(result.lineItems).toHaveLength(3);
      expect(result.overallConfidence).toBeGreaterThanOrEqual(0.95);
    });

    it('should accurately extract English POS Z-Report layout', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => MOCK_CLEAR_ENGLISH_POS_ZREPORT,
      }) as any;

      const result = await provider.processDocument(Buffer.from('pos-z-report'), 'application/pdf');

      expect(result.metadata.documentNumber).toBe('Z-REP-20260820-TILL1');
      expect(result.metadata.totalAmount).toBe(148.75);
      expect(result.lineItems[0].description).toBe('Classic Cheeseburger');
      expect(result.lineItems[0].quantity).toBe(5);
      expect(result.lineItems[0].totalPrice).toBe(70.0);
    });

    it('should assign low confidence score to blurry receipts', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => MOCK_BLURRY_LOW_CONFIDENCE_RECEIPT,
      }) as any;

      const result = await provider.processDocument(Buffer.from('blurry-doc'), 'image/jpeg');

      expect(result.overallConfidence).toBeLessThan(0.60);
      expect(result.lineItems[0].confidence).toBeLessThan(0.60);
      expect(result.lineItems[1].confidence).toBeLessThan(0.60);
    });

    it('should handle partially cropped or rotated receipts with missing vendor headers', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => MOCK_ROTATED_CROPPED_RECEIPT,
      }) as any;

      const result = await provider.processDocument(Buffer.from('rotated-cropped'), 'image/png');

      expect(result.metadata.supplierName).toBeDefined();
      expect(result.lineItems[0].description).toBe('Cropped burger item');
      expect(result.lineItems[0].totalPrice).toBe(12.0);
    });
  });

  describe('2. Structured Extraction & Data Normalization', () => {
    it('should extract item name, quantity, unit price, total, and receipt date', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => MOCK_CLEAR_GERMAN_RECEIPT,
      }) as any;

      const result = await provider.processDocument(Buffer.from('doc'), 'image/jpeg');
      const item = result.lineItems[0];

      expect(item.description).toBe('Schnitzel Wiener Art m. Pommes');
      expect(item.quantity).toBe(2);
      expect(item.unitPrice).toBe(16.5);
      expect(item.totalPrice).toBe(33.0);
      expect(result.metadata.date).toBe('2026-08-20');
    });
  });

  describe('3. Missing Data Handling', () => {
    it('should safely default missing quantity to 1 without throwing', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => MOCK_MISSING_DATA_RECEIPT,
      }) as any;

      const result = await provider.processDocument(Buffer.from('missing-fields'), 'image/jpeg');

      expect(result.lineItems[0].quantity).toBe(1);
      expect(result.lineItems[0].description).toBe('Item without explicit quantity or price');
      expect(result.metadata.date).toBeDefined();
    });
  });

  describe('4. Duplicate Items Handling', () => {
    it('should extract all duplicate lines with distinct line numbers', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => MOCK_DUPLICATE_ITEMS_RECEIPT,
      }) as any;

      const result = await provider.processDocument(Buffer.from('dup-doc'), 'image/jpeg');

      expect(result.lineItems).toHaveLength(2);
      expect(result.lineItems[0].lineNumber).toBe(1);
      expect(result.lineItems[1].lineNumber).toBe(2);
      expect(result.lineItems[0].description).toBe('Espresso');
      expect(result.lineItems[1].description).toBe('Espresso');
    });
  });
});

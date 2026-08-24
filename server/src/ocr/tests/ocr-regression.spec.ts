import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  MOCK_BLURRY_LOW_CONFIDENCE_RECEIPT,
  MOCK_CLEAR_DUTCH_RECEIPT,
  MOCK_CLEAR_ENGLISH_POS_ZREPORT,
  MOCK_CLEAR_GERMAN_RECEIPT,
  MOCK_CONFLICTING_FINANCIALS_RECEIPT,
  MOCK_DUPLICATE_ITEMS_RECEIPT,
  MOCK_MARKDOWN_WRAPPED_GEMINI_RESPONSE,
  MOCK_MISSING_DATA_RECEIPT,
  MOCK_ROTATED_CROPPED_RECEIPT,
} from '../../../test/fixtures/ocr-agent-fixtures';
import { GeminiVisionProvider } from '../providers/gemini-vision.provider';

describe('OCR Agent - Prompt & Extraction Regression Suite', () => {
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

  describe('9. Complete Deterministic Regression Suite', () => {
    const regressionFixtures = [
      {
        name: 'Clear German Kassenzettel',
        fixture: MOCK_CLEAR_GERMAN_RECEIPT,
        minItems: 3,
        expectedCurrency: 'EUR',
        minConfidence: 0.95,
      },
      {
        name: 'Clear Dutch Kassabon',
        fixture: MOCK_CLEAR_DUTCH_RECEIPT,
        minItems: 3,
        expectedCurrency: 'EUR',
        minConfidence: 0.94,
      },
      {
        name: 'Clear English POS Z-Report',
        fixture: MOCK_CLEAR_ENGLISH_POS_ZREPORT,
        minItems: 3,
        expectedCurrency: 'EUR',
        minConfidence: 0.95,
      },
      {
        name: 'Blurry Low-Confidence Document',
        fixture: MOCK_BLURRY_LOW_CONFIDENCE_RECEIPT,
        minItems: 2,
        expectedCurrency: 'EUR',
        maxConfidence: 0.60,
      },
      {
        name: 'Rotated & Cropped Document',
        fixture: MOCK_ROTATED_CROPPED_RECEIPT,
        minItems: 1,
        expectedCurrency: 'EUR',
        minConfidence: 0.70,
      },
      {
        name: 'Missing Fields Document',
        fixture: MOCK_MISSING_DATA_RECEIPT,
        minItems: 1,
        expectedCurrency: 'EUR',
        minConfidence: 0.60,
      },
      {
        name: 'Markdown-Wrapped Output',
        fixture: MOCK_MARKDOWN_WRAPPED_GEMINI_RESPONSE,
        minItems: 1,
        expectedCurrency: 'EUR',
        minConfidence: 0.90,
      },
      {
        name: 'Conflicting Financial Sums Document',
        fixture: MOCK_CONFLICTING_FINANCIALS_RECEIPT,
        minItems: 1,
        expectedCurrency: 'EUR',
        minConfidence: 0.85,
      },
      {
        name: 'Duplicate Line Items Document',
        fixture: MOCK_DUPLICATE_ITEMS_RECEIPT,
        minItems: 2,
        expectedCurrency: 'EUR',
        minConfidence: 0.90,
      },
    ];

    regressionFixtures.forEach(({ name, fixture, minItems, minConfidence, maxConfidence }) => {
      it(`Regression Check: ${name} must conform to schema and extraction expectations`, async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => fixture,
        }) as any;

        const result = await provider.processDocument(Buffer.from(`regress-${name}`), 'image/jpeg');

        expect(result.providerId).toBe('gemini_vision');
        expect(result.lineItems.length).toBeGreaterThanOrEqual(minItems);
        expect(result.metadata.currency).toBeDefined();

        if (minConfidence !== undefined) {
          expect(result.overallConfidence).toBeGreaterThanOrEqual(minConfidence);
        }
        if (maxConfidence !== undefined) {
          expect(result.overallConfidence).toBeLessThanOrEqual(maxConfidence);
        }
      });
    });
  });
});

import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { OcrRepository } from '../ocr.repository';
import { OcrService } from '../ocr.service';
import { GeminiVisionProvider } from '../providers/gemini-vision.provider';
import { OcrProviderFactory } from '../providers/ocr-provider.factory';

jest.setTimeout(15000);

describe('OCR Agent - Failure Handling & Resilience Tests', () => {
  let provider: GeminiVisionProvider;
  let ocrService: OcrService;
  let ocrRepository: OcrRepository;

  const origCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  beforeEach(async () => {
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
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

    ocrRepository = {
      createDocument: jest.fn(),
      findDocumentById: jest.fn(),
      findDocuments: jest.fn(),
      saveExtractionResults: jest.fn(),
      updateDocumentItem: jest.fn(),
      markDocumentConfirmed: jest.fn(),
      markDocumentRejected: jest.fn(),
      markDocumentFailed: jest.fn().mockResolvedValue(undefined),
      applyBomDeductions: jest.fn(),
    } as unknown as OcrRepository;

    const factory = {
      getProvider: jest.fn(() => provider),
    } as unknown as OcrProviderFactory;

    ocrService = new OcrService(factory, ocrRepository);
  });

  afterEach(() => {
    if (origCredentials) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = origCredentials;
    }
    jest.restoreAllMocks();
  });

  describe('8. Provider Failure Scenarios', () => {
    it('should handle Gemini HTTP 429 Rate Limit error gracefully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Rate limit quota exceeded for requests per minute',
      }) as any;

      const result = await provider.processDocument(Buffer.from('doc'), 'image/jpeg');

      // Provider falls back to resilient fallback agent without crashing
      expect(result.rawResponse).toBeDefined();
      expect(result.lineItems.length).toBeGreaterThan(0);
    }, 15000);

    it('should handle Gemini HTTP 503 Service Unavailable gracefully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => 'The model is overloaded. Please try again later.',
      }) as any;

      const result = await provider.processDocument(Buffer.from('doc'), 'image/jpeg');

      expect(result.rawResponse).toBeDefined();
      expect(result.overallConfidence).toBeDefined();
    }, 15000);

    it('should handle network timeout / fetch rejection', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Connection timed out after 30000ms'));

      const result = await provider.processDocument(Buffer.from('doc'), 'image/jpeg');

      expect(result.rawResponse).toBeDefined();
      expect(result.lineItems.length).toBeGreaterThan(0);
    }, 15000);

    it('should record document as failed when an unrecoverable repository error occurs', async () => {
      jest.spyOn(provider, 'processDocument').mockRejectedValueOnce(new Error('Fatal unrecoverable buffer corruption'));

      await expect(
        ocrService.processBuffer(
          'doc-err-01',
          Buffer.from('bad-buffer'),
          'image/jpeg',
          'store-01',
        ),
      ).rejects.toThrow('Fatal unrecoverable buffer corruption');

      expect(ocrRepository.markDocumentFailed).toHaveBeenCalledWith(
        'doc-err-01',
        'store-01',
        'Fatal unrecoverable buffer corruption',
      );
    });
  });
});

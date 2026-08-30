import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  MOCK_CLEAR_GERMAN_RECEIPT,
  MOCK_CLEAR_DUTCH_RECEIPT,
  MOCK_MARKDOWN_WRAPPED_GEMINI_RESPONSE,
} from '../../../test/fixtures/ocr-agent-fixtures';
import { GeminiVisionProvider } from './gemini-vision.provider';

describe('GeminiVisionProvider', () => {
  let provider: GeminiVisionProvider;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiVisionProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'gemini.apiKey') return 'mock-gemini-key-test';
              if (key === 'gemini.model') return 'gemini-2.0-flash';
              return null;
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<GeminiVisionProvider>(GeminiVisionProvider);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined and return healthy status', async () => {
    expect(provider).toBeDefined();
    expect(provider.providerId).toBe('gemini_vision');
    const isHealthy = await provider.healthCheck();
    expect(isHealthy).toBe(true);
  });

  it('should extract clean JSON from markdown code fences', () => {
    const markdown = '```json\n{"key": "value"}\n```';
    const cleaned = provider.extractCleanJson(markdown);
    expect(JSON.parse(cleaned)).toEqual({ key: 'value' });
  });

  it('should process German Kassenzettel receipt via Gemini API mock', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_CLEAR_GERMAN_RECEIPT,
    }) as any;

    const mockBuffer = Buffer.from('mock-german-receipt-image-content');
    const result = await provider.processDocument(mockBuffer, 'image/jpeg');

    expect(result.providerId).toBe('gemini_vision');
    expect(result.lineItems.length).toBe(3);
    expect(result.lineItems[0].description).toBe('Schnitzel Wiener Art m. Pommes');
    expect(result.lineItems[0].quantity).toBe(2);
    expect(result.lineItems[0].totalPrice).toBe(33.0);
    expect(result.metadata.supplierName).toBe('Brauhaus & Biergarten München');
    expect(result.metadata.totalAmount).toBe(46.0);
    expect(result.overallConfidence).toBeGreaterThan(0.95);
  });

  it('should process Dutch Kassabon receipt via Gemini API mock', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_CLEAR_DUTCH_RECEIPT,
    }) as any;

    const mockBuffer = Buffer.from('mock-dutch-receipt-image-content');
    const result = await provider.processDocument(mockBuffer, 'image/png');

    expect(result.lineItems.length).toBe(3);
    expect(result.lineItems[0].description).toBe('Bitterballen (8 Stk)');
    expect(result.metadata.supplierName).toBe('Grand Café de Gracht Amsterdam');
    expect(result.metadata.totalAmount).toBe(25.0);
  });

  it('should handle markdown wrapped JSON responses from Gemini LLM', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_MARKDOWN_WRAPPED_GEMINI_RESPONSE,
    }) as any;

    const mockBuffer = Buffer.from('mock-image');
    const result = await provider.processDocument(mockBuffer, 'image/jpeg');

    expect(result.metadata.documentNumber).toBe('MD-FENCE-001');
    expect(result.lineItems[0].description).toBe('Cleaned from Markdown');
    expect(result.lineItems[0].totalPrice).toBe(20.0);
  });

  it('should fall back to resilient parser if GEMINI_API_KEY is not configured', async () => {
    const originalApiKey = process.env.GEMINI_API_KEY;
    const originalGcpCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

    try {
      const unconfiguredModule = await Test.createTestingModule({
        providers: [
          GeminiVisionProvider,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => ''),
            },
          },
        ],
      }).compile();

      const fallbackProvider = unconfiguredModule.get<GeminiVisionProvider>(GeminiVisionProvider);
      const mockBuffer = Buffer.from('mock-image');
      const result = await fallbackProvider.processDocument(mockBuffer, 'image/jpeg');

      expect(result.providerId).toBe('gemini_vision');
      expect(result.lineItems.length).toBeGreaterThan(0);
      expect(result.metadata.supplierName).toContain('Agent Fallback');
    } finally {
      if (originalApiKey) process.env.GEMINI_API_KEY = originalApiKey;
      if (originalGcpCreds) process.env.GOOGLE_APPLICATION_CREDENTIALS = originalGcpCreds;
    }
  });
});

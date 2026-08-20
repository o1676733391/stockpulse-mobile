import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { GoogleDocumentAiProvider } from './google-document-ai.provider';

describe('GoogleDocumentAiProvider', () => {
  let provider: GoogleDocumentAiProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleDocumentAiProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'GCP_PROJECT_ID') return 'stockpulse-test-proj';
              if (key === 'GCP_LOCATION') return 'us';
              if (key === 'GCP_DOCUMENT_AI_PROCESSOR_ID') return 'proc-test-01';
              return null;
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<GoogleDocumentAiProvider>(GoogleDocumentAiProvider);
  });

  it('should be defined with correct providerId', () => {
    expect(provider).toBeDefined();
    expect(provider.providerId).toBe('google_document_ai');
  });

  it('should process document buffer and extract line items and confidence scores', async () => {
    const sampleBuffer = Buffer.from('mock_receipt_image_binary_data');
    const result = await provider.processDocument(sampleBuffer, 'image/jpeg');

    expect(result.providerId).toBe('google_document_ai');
    expect(result.overallConfidence).toBeGreaterThan(0.8);
    expect(result.lineItems.length).toBeGreaterThan(0);
    expect(result.metadata.totalAmount).toBeGreaterThan(0);

    const firstItem = result.lineItems[0];
    expect(firstItem.confidence).toBeGreaterThan(0.85);
    expect(firstItem.description).toBeDefined();
    expect(firstItem.quantity).toBeGreaterThan(0);
  });

  it('should pass healthCheck', async () => {
    const isHealthy = await provider.healthCheck();
    expect(isHealthy).toBe(true);
  });
});

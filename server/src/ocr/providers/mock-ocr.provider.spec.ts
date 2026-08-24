import { Test, TestingModule } from '@nestjs/testing';
import { MockOcrProvider } from './mock-ocr.provider';

describe('MockOcrProvider', () => {
  let provider: MockOcrProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MockOcrProvider],
    }).compile();

    provider = module.get<MockOcrProvider>(MockOcrProvider);
  });

  it('should be defined and return healthy status', async () => {
    expect(provider).toBeDefined();
    expect(provider.providerId).toBe('mock_provider');
    const isHealthy = await provider.healthCheck();
    expect(isHealthy).toBe(true);
  });

  it('should extract deterministic mock line items without network calls', async () => {
    const buffer = Buffer.from('mock-test-image');
    const result = await provider.processDocument(buffer, 'image/jpeg');

    expect(result.providerId).toBe('mock_provider');
    expect(result.lineItems).toHaveLength(1);
    expect(result.lineItems[0].description).toBe('Pasta Carbonara');
    expect(result.lineItems[0].quantity).toBe(1);
    expect(result.lineItems[0].unitPrice).toBe(18.0);
    expect(result.overallConfidence).toBeGreaterThan(0.95);
    expect(result.metadata.documentNumber).toBe('POS-MOCK-01');
  });
});

import { Injectable, Logger } from '@nestjs/common';
import {
  IOcrProvider,
  OcrProviderType,
  RawOcrExtractionResult,
} from '../interfaces/ocr-provider.interface';

@Injectable()
export class MockOcrProvider implements IOcrProvider {
  readonly providerId: OcrProviderType = 'mock_provider';
  readonly providerName: string = 'Mock OCR Provider for Local Testing';
  private readonly logger = new Logger(MockOcrProvider.name);

  async processDocument(
    _content: Buffer,
    _mimeType: string,
  ): Promise<RawOcrExtractionResult> {
    this.logger.log('MockOcrProvider.processDocument invoked');
    return {
      providerId: this.providerId,
      processingDurationMs: 120,
      overallConfidence: 0.98,
      metadata: {
        documentNumber: 'POS-MOCK-01',
        date: new Date().toISOString().split('T')[0],
        totalAmount: 95.0,
      },
      lineItems: [
        {
          lineNumber: 1,
          rawText: '1x PASTA CARBONARA 18.00 18.00',
          description: 'Pasta Carbonara',
          quantity: 1,
          unitPrice: 18.0,
          totalPrice: 18.0,
          confidence: 0.99,
        },
      ],
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

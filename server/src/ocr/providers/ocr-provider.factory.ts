import { Injectable } from '@nestjs/common';
import { IOcrProvider, OcrProviderType } from '../interfaces/ocr-provider.interface';
import { GoogleDocumentAiProvider } from './google-document-ai.provider';
import { MockOcrProvider } from './mock-ocr.provider';

@Injectable()
export class OcrProviderFactory {
  private readonly providers = new Map<OcrProviderType, IOcrProvider>();

  constructor(
    private readonly googleDocumentAiProvider: GoogleDocumentAiProvider,
    private readonly mockOcrProvider: MockOcrProvider,
  ) {
    this.providers.set('google_document_ai', this.googleDocumentAiProvider);
    this.providers.set('mock_provider', this.mockOcrProvider);
  }

  getProvider(type: OcrProviderType = 'google_document_ai'): IOcrProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      return this.mockOcrProvider;
    }
    return provider;
  }
}

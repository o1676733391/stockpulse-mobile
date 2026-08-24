import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IOcrProvider, OcrProviderType } from '../interfaces/ocr-provider.interface';
import { GeminiVisionProvider } from './gemini-vision.provider';
import { GoogleDocumentAiProvider } from './google-document-ai.provider';
import { MockOcrProvider } from './mock-ocr.provider';

@Injectable()
export class OcrProviderFactory {
  private readonly providers = new Map<OcrProviderType, IOcrProvider>();
  private readonly defaultProviderType: OcrProviderType;

  constructor(
    private readonly configService: ConfigService,
    private readonly geminiVisionProvider: GeminiVisionProvider,
    private readonly googleDocumentAiProvider: GoogleDocumentAiProvider,
    private readonly mockOcrProvider: MockOcrProvider,
  ) {
    this.providers.set('gemini_vision', this.geminiVisionProvider);
    this.providers.set('google_document_ai', this.googleDocumentAiProvider);
    this.providers.set('mock_provider', this.mockOcrProvider);

    const configuredDefault = this.configService.get<string>('gemini.defaultProvider') ||
      process.env.OCR_DEFAULT_PROVIDER ||
      'gemini_vision';
    this.defaultProviderType = configuredDefault as OcrProviderType;
  }

  getProvider(type?: OcrProviderType): IOcrProvider {
    const selectedType = type || this.defaultProviderType || 'gemini_vision';
    const provider = this.providers.get(selectedType);
    if (!provider) {
      return this.providers.get('gemini_vision') || this.mockOcrProvider;
    }
    return provider;
  }
}

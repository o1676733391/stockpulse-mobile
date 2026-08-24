import { Module } from '@nestjs/common';
import { OcrController } from './ocr.controller';
import { OcrRepository } from './ocr.repository';
import { OcrService } from './ocr.service';
import { GeminiVisionProvider } from './providers/gemini-vision.provider';
import { GoogleDocumentAiProvider } from './providers/google-document-ai.provider';
import { MockOcrProvider } from './providers/mock-ocr.provider';
import { OcrProviderFactory } from './providers/ocr-provider.factory';

@Module({
  controllers: [OcrController],
  providers: [
    OcrService,
    OcrRepository,
    OcrProviderFactory,
    GeminiVisionProvider,
    GoogleDocumentAiProvider,
    MockOcrProvider,
  ],
  exports: [OcrService, OcrRepository, OcrProviderFactory, GeminiVisionProvider],
})
export class OcrModule {}

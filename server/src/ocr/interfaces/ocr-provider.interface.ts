export type OcrProviderType =
  | 'google_document_ai'
  | 'gemini_vision'
  | 'azure_document_intelligence'
  | 'aws_textract'
  | 'mock_provider';

export interface RawOcrLineItem {
  lineNumber: number;
  rawText: string;
  description: string;
  articleNumber?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  confidence: number;
}

export interface RawOcrMetadata {
  documentNumber?: string;
  date?: string;
  supplierName?: string;
  currency?: string;
  netAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
}

export interface RawOcrExtractionResult {
  providerId: OcrProviderType;
  processingDurationMs: number;
  overallConfidence: number;
  metadata: RawOcrMetadata;
  lineItems: RawOcrLineItem[];
  rawResponse?: Record<string, unknown>;
}

export interface OcrProcessOptions {
  languageHints?: string[];
  documentType?: string;
  expectedCurrency?: string;
}

/**
 * Core OCR Provider abstraction interface.
 * Decouples all OCR consumers and business logic from specific cloud vendor APIs.
 */
export interface OCRProvider {
  readonly providerId: OcrProviderType;
  readonly providerName: string;

  processDocument(
    content: Buffer,
    mimeType: string,
    options?: OcrProcessOptions,
  ): Promise<RawOcrExtractionResult>;

  healthCheck(): Promise<boolean>;
}

// Alias for clean naming consistency
export type IOcrProvider = OCRProvider;

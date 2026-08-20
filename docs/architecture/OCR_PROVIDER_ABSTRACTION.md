# StockPulse — OCR Provider Abstraction Interfaces (TypeScript)

> **Version:** 1.0.0  
> **Target Providers:** Google Cloud Document AI, Google Gemini Vision, Azure AI Document Intelligence, AWS Textract  
> **Design Pattern:** Strategy Pattern + Abstract Factory  
> **Companion Document:** [OCR_ARCHITECTURE.md](file:///d:/Project%20Local/fnb-mobile/docs/architecture/OCR_ARCHITECTURE.md)  

---

```typescript
// ============================================================================
// StockPulse OCR Provider Abstraction — Pure TypeScript Interface Contracts
// ============================================================================

/**
 * Supported OCR engine identifiers.
 */
export type OcrProviderType =
  | 'google_document_ai'
  | 'gemini_vision'
  | 'azure_document_intelligence'
  | 'aws_textract'
  | 'mock_provider';

/**
 * Standard supported document MIME types.
 */
export type OcrDocumentMimeType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/tiff'
  | 'application/pdf';

/**
 * Recognized business document classifications.
 */
export type OcrDocumentClassification =
  | 'pos_z_report'
  | 'pos_shift_summary'
  | 'supplier_invoice'
  | 'delivery_note'
  | 'generic_receipt';

/**
 * Standard normalized unit of measure for extracted ingredient/item quantities.
 */
export type OcrUnitOfMeasure = 'kg' | 'g' | 'L' | 'ml' | 'pcs' | 'can' | 'bottle' | 'pack';

// ----------------------------------------------------------------------------
// 1. Input Data Contracts
// ----------------------------------------------------------------------------

/**
 * Input payload passed to the OCR provider.
 */
export interface OcrDocumentInput {
  /** Raw binary buffer of the document/image */
  readonly content: Buffer;
  
  /** MIME type of the document */
  readonly mimeType: OcrDocumentMimeType;
  
  /** Intended document classification */
  readonly classification: OcrDocumentClassification;
  
  /** Unique document/job reference ID */
  readonly referenceId: string;
  
  /** Associated store ID for tenant-aware processing */
  readonly storeId: string;
  
  /** SHA-256 checksum of the content buffer for deduplication & caching */
  readonly checksumSha256: string;
  
  /** Original file size in bytes */
  readonly fileSizeBytes: number;
}

/**
 * Processing configuration options for the OCR engine.
 */
export interface OcrProcessingOptions {
  /** Expected document languages (e.g. ['de', 'en']) */
  readonly languageHints?: string[];
  
  /** Expected currency symbol/code (e.g. 'EUR', '€') */
  readonly defaultCurrency?: string;
  
  /** Maximum allowable processing time before timeout */
  readonly timeoutMs?: number;
  
  /** Include raw provider response payload for debugging/auditing */
  readonly includeRawResponse?: boolean;
  
  /** Custom prompt or instructions (utilized by multimodal models like Gemini) */
  readonly systemPromptOverrides?: string;
}

// ----------------------------------------------------------------------------
// 2. Normalized Output Data Contracts
// ----------------------------------------------------------------------------

/**
 * Geometric bounding polygon coordinates on normalized scale (0.0 to 1.0).
 */
export interface OcrBoundingPolygon {
  readonly vertices: Array<{
    readonly x: number;
    readonly y: number;
  }>;
}

/**
 * Individual line item extracted from the document.
 */
export interface OcrExtractedLineItem {
  /** 1-based sequential line number */
  readonly lineNumber: number;
  
  /** Raw, unparsed text line extracted from document */
  readonly rawText: string;
  
  /** Cleaned / parsed item or dish name */
  readonly description: string;
  
  /** Article number, product code or SKU printed on receipt */
  readonly articleNumber?: string;
  
  /** Numerical quantity sold or delivered */
  readonly quantity: number;
  
  /** Unit of measure (if printed, e.g. 'kg', 'portions') */
  readonly unit?: OcrUnitOfMeasure | string;
  
  /** Price per individual unit */
  readonly unitPrice?: number;
  
  /** Total line price (quantity * unitPrice) */
  readonly totalPrice?: number;
  
  /** Applied VAT / Tax percentage for this item (e.g. 19.0 or 7.0) */
  readonly taxRatePercent?: number;
  
  /** Confidence score of this specific line item extraction (0.00 to 1.00) */
  readonly confidence: number;
  
  /** Optional bounding box on document for visual highlight in mobile UI */
  readonly boundingBox?: OcrBoundingPolygon;
}

/**
 * Header and summary metadata extracted from the document.
 */
export interface OcrDocumentMetadata {
  /** Receipt / register / invoice reference number (e.g. "POS-8821", "INV-99812") */
  readonly documentNumber?: string;
  
  /** Register or terminal ID (e.g. "POS-01") */
  readonly terminalId?: string;
  
  /** Cashier / server / staff identifier */
  readonly operatorName?: string;
  
  /** Restaurant shift name (e.g. 'Lunch', 'Dinner', 'Night') */
  readonly shiftName?: 'Lunch' | 'Dinner' | 'Night' | string;
  
  /** Document transaction date in ISO format (YYYY-MM-DD) */
  readonly transactionDate?: string;
  
  /** Document transaction time (HH:MM:SS) */
  readonly transactionTime?: string;
  
  /** Merchant or supplier business name */
  readonly merchantName?: string;
  
  /** Merchant address */
  readonly merchantAddress?: string;
  
  /** Merchant tax / VAT registration ID */
  readonly taxIdentifier?: string;
  
  /** Three-letter ISO currency code (e.g. "EUR", "USD") */
  readonly currency: string;
  
  /** Net subtotal before taxes */
  readonly subtotalAmount?: number;
  
  /** Total tax / VAT amount */
  readonly taxAmount?: number;
  
  /** Tip / gratuity amount */
  readonly tipAmount?: number;
  
  /** Final gross total amount */
  readonly totalAmount: number;
}

/**
 * Canonical normalized result returned by any OCR provider implementation.
 */
export interface RawOcrExtractionResult {
  /** Identifier of the provider that executed this extraction */
  readonly providerId: OcrProviderType;
  
  /** Execution wall time in milliseconds */
  readonly processingDurationMs: number;
  
  /** Mean confidence score across all extracted fields (0.00 to 1.00) */
  readonly overallConfidence: number;
  
  /** Extracted header, business, and monetary metadata */
  readonly metadata: OcrDocumentMetadata;
  
  /** Extracted line items (menu dishes, ingredients, or products) */
  readonly lineItems: readonly OcrExtractedLineItem[];
  
  /** Total number of parsed line items */
  readonly totalItemCount: number;
  
  /** Total number of portions/units across all line items */
  readonly totalPortionsCount: number;
  
  /** Optional raw response object from underlying vendor SDK for debugging */
  readonly rawProviderResponse?: Readonly<Record<string, unknown>>;
}

// ----------------------------------------------------------------------------
// 3. Provider Capabilities & Health
// ----------------------------------------------------------------------------

/**
 * Feature capabilities declared by a provider.
 */
export interface OcrProviderCapabilities {
  /** Supports multi-page PDF documents */
  readonly supportsMultiPagePdf: boolean;
  
  /** Returns exact bounding box coordinates for words/lines */
  readonly supportsBoundingBoxes: boolean;
  
  /** Extracts native field-level confidence ratings */
  readonly supportsFieldConfidence: boolean;
  
  /** Optimized specifically for restaurant POS thermal receipts */
  readonly supportsPosReceipts: boolean;
  
  /** Optimized for supplier invoices & B2B delivery notes */
  readonly supportsInvoices: boolean;
  
  /** List of officially supported MIME types */
  readonly supportedMimeTypes: readonly OcrDocumentMimeType[];
}

/**
 * Health check status of an OCR provider connection.
 */
export interface OcrProviderHealth {
  readonly isHealthy: boolean;
  readonly providerId: OcrProviderType;
  readonly latencyMs: number;
  readonly message?: string;
  readonly lastCheckedAt: string;
}

// ----------------------------------------------------------------------------
// 4. Core Provider Interface (The Contract)
// ----------------------------------------------------------------------------

/**
 * The core OCR Provider interface.
 * All OCR vendor adapters must implement this contract.
 * The application domain must depend ONLY on this interface.
 */
export interface IOcrProvider {
  /** Unique provider identifier */
  readonly providerId: OcrProviderType;
  
  /** Human-readable provider title */
  readonly providerName: string;
  
  /** Feature capabilities of this provider */
  readonly capabilities: OcrProviderCapabilities;
  
  /**
   * Process a binary document and extract normalized structured data.
   *
   * @param input Document buffer and metadata
   * @param options Processing parameters (timeouts, language hints)
   * @returns Canonical extraction result conforming to RawOcrExtractionResult
   * @throws OcrProviderException on extraction failures
   */
  processDocument(
    input: OcrDocumentInput,
    options?: OcrProcessingOptions
  ): Promise<RawOcrExtractionResult>;
  
  /**
   * Verify provider API connectivity and credential validity.
   */
  healthCheck(): Promise<OcrProviderHealth>;
}

// ----------------------------------------------------------------------------
// 5. Provider Factory & Registry Interface
// ----------------------------------------------------------------------------

/**
 * Registry metadata describing an available provider.
 */
export interface OcrProviderRegistration {
  readonly providerId: OcrProviderType;
  readonly providerName: string;
  readonly isDefault: boolean;
  readonly isEnabled: boolean;
  readonly capabilities: OcrProviderCapabilities;
}

/**
 * Abstract factory for resolving and managing OCR providers at runtime.
 */
export interface IOcrProviderFactory {
  /**
   * Register a new provider implementation.
   */
  registerProvider(provider: IOcrProvider, isDefault?: boolean): void;
  
  /**
   * Resolve an active provider by ID, or return the default active provider.
   */
  getProvider(providerId?: OcrProviderType): IOcrProvider;
  
  /**
   * List all registered OCR providers and their capabilities.
   */
  listProviders(): readonly OcrProviderRegistration[];
  
  /**
   * Switch the primary active default provider at runtime without redeployment.
   */
  setDefaultProvider(providerId: OcrProviderType): void;
}

// ----------------------------------------------------------------------------
// 6. Error & Exception Model
// ----------------------------------------------------------------------------

export type OcrErrorCode =
  | 'DOCUMENT_UNREADABLE'
  | 'UNSUPPORTED_MIME_TYPE'
  | 'FILE_SIZE_EXCEEDED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'PROVIDER_TIMEOUT'
  | 'PROVIDER_AUTH_ERROR'
  | 'PROVIDER_UNAVAILABLE'
  | 'PARSE_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Standard domain exception thrown on OCR extraction errors.
 */
export interface IOcrProviderError {
  readonly errorCode: OcrErrorCode;
  readonly providerId: OcrProviderType;
  readonly message: string;
  readonly isRetryable: boolean;
  readonly httpStatus: number;
  readonly rawVendorError?: unknown;
}
```

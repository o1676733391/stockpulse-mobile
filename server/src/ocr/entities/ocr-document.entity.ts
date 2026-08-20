import { BaseEntity } from '../../common/entities/base.entity';

export type OcrStatus = 'processing' | 'review_pending' | 'confirmed' | 'rejected' | 'failed';

export class OcrDocumentEntity extends BaseEntity {
  storeId!: string;
  documentType!: string;
  storagePath!: string;
  fileName!: string;
  mimeType!: string;
  fileSizeBytes!: number;
  status!: OcrStatus;
  overallConfidence?: number;
  rawProviderResponse?: Record<string, unknown>;
  processedAt?: Date;
  confirmedBy?: string;
  confirmedAt?: Date;
  errorMessage?: string;
}

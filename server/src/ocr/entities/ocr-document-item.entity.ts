export class OcrDocumentItemEntity {
  id!: string;
  ocrDocumentId!: string;
  lineNumber!: number;
  rawText!: string;
  description!: string;
  articleNumber?: string;
  quantity!: number;
  unitPrice?: number;
  totalPrice?: number;
  confidence!: number;
  matchedRecipeId?: string;
  matchConfidence?: number;
  matchStatus!: 'EXACT_CODE' | 'FUZZY_NAME' | 'MANUAL_OVERRIDE' | 'UNMATCHED';
  createdAt!: Date;
}

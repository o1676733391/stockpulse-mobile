export type OcrState = 'idle' | 'capturing' | 'processing' | 'review' | 'success' | 'error';

export type OcrDocumentType = 'order_invoice' | 'goods_receipt' | 'pos_z_report' | 'supplier_invoice';

export type OcrDocumentStatus = 'pending' | 'processing' | 'confirmed' | 'rejected' | 'reverted';

export interface RecipeIngredient {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  costPerServing: number;
  active: boolean;
  ingredients: RecipeIngredient[];
}

export interface OcrItem {
  id: string;
  artNr: string;
  item: string;
  recipeId?: string;
  qty: number;
  confidence: number;
  unitPrice?: number;
  unit?: string;
}

export interface OcrReport {
  id: string;
  reportNumber: string;
  date: string;
  shift: string;
  storeName: string;
  documentType?: OcrDocumentType;
  status?: OcrDocumentStatus;
  items: OcrItem[];
  rawImageUrl?: string;
  totalAmount?: number;
  vatAmount?: number;
  vendorName?: string;
  isDuplicate?: boolean;
  duplicateOfId?: string;
  revertedAt?: string;
  revertReason?: string;
}

export interface OcrHistoryItem {
  id: string;
  documentType: OcrDocumentType;
  documentNumber: string;
  vendorName?: string;
  date: string;
  status: OcrDocumentStatus;
  itemCount: number;
  totalAmount?: number;
  currency?: string;
  createdAt: string;
  isDuplicate?: boolean;
  revertedAt?: string;
}

export interface OcrDuplicateCheckResult {
  isDuplicate: boolean;
  duplicateOf?: {
    id: string;
    documentNumber: string;
    date: string;
    status: string;
  };
}

export interface BomIngredientDeduction {
  itemId: string;
  itemName: string;
  delta: number;
  unit: string;
  costEur: number;
  theoreticalBefore: number;
  theoreticalAfter: number;
}

export interface BomDeductionResult {
  reportId: string;
  reportNumber: string;
  date: string;
  shift: string;
  totalPortions: number;
  menuItemCount: number;
  deductions: BomIngredientDeduction[];
  timestamp: string;
  documentType?: OcrDocumentType;
}

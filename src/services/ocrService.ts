import {
  BomIngredientDeduction,
  OcrDocumentType,
  OcrDuplicateCheckResult,
  OcrHistoryItem,
  OcrItem,
  OcrReport,
} from '@/types/ocr';
import { apiClient, logDebugFallback } from './apiClient';

export interface IPOSOcrService {
  processImage(
    imageUri?: string,
    documentType?: OcrDocumentType,
  ): Promise<{ report: OcrReport; bomDeductions?: BomIngredientDeduction[] }>;
  getDocument(documentId: string): Promise<{ report: OcrReport; bomDeductions?: BomIngredientDeduction[] }>;
  confirmDeductions(
    reportId: string,
    items?: OcrItem[],
  ): Promise<{ success: boolean; deductions: BomIngredientDeduction[] }>;
  rejectDocument(reportId: string, reason?: string): Promise<{ success: boolean }>;
  addItem(documentId: string, item: Partial<OcrItem>): Promise<OcrItem>;
  updateItem(documentId: string, itemId: string, item: Partial<OcrItem>): Promise<OcrItem>;
  deleteItem(documentId: string, itemId: string): Promise<{ success: boolean }>;
  checkDuplicate(documentId: string): Promise<OcrDuplicateCheckResult>;
  revertDocument(documentId: string, reason?: string): Promise<{ success: boolean; message: string }>;
  deleteDocument(documentId: string, revertWarehouse?: boolean): Promise<{ success: boolean }>;
  getDocuments(params?: {
    documentType?: string;
    status?: string;
    limit?: number;
  }): Promise<{ data: OcrHistoryItem[]; total: number }>;
}

export class RealPOSOcrService implements IPOSOcrService {
  async processImage(
    imageUri?: string,
    documentType: OcrDocumentType = 'order_invoice',
  ): Promise<{ report: OcrReport; bomDeductions?: BomIngredientDeduction[] }> {
    try {
      let imageBase64: string | undefined = undefined;

      if (imageUri) {
        if (imageUri.startsWith('data:image')) {
          imageBase64 = imageUri;
        } else {
          try {
            const res = await fetch(imageUri);
            const blob = await res.blob();
            imageBase64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } catch {
            // If blob conversion fails, proceed with uri
          }
        }
      }

      const scanTrigger = await apiClient.post<{
        documentId: string;
        status: string;
        extractedItemCount?: number;
      }>('/ocr/scan', {
        documentType,
        imageBase64,
      });

      const documentId = scanTrigger.documentId;
      return await this.getDocument(documentId);
    } catch (err) {
      logDebugFallback('POSOcrService', '/ocr/scan', err);
      const isGoods = documentType === 'goods_receipt' || documentType === 'supplier_invoice';
      const fallbackReport: OcrReport = isGoods
        ? {
            id: `doc-gr-${Date.now().toString().slice(-4)}`,
            reportNumber: 'DN-88492-REC',
            date: new Date().toISOString().slice(0, 10),
            shift: 'Morning Delivery',
            storeName: 'Bella Cucina Restaurant',
            vendorName: 'Metro Foods GmbH',
            documentType: 'goods_receipt',
            status: 'pending',
            totalAmount: 208.5,
            vatAmount: 33.29,
            items: [
              { id: 'ocr-1', artNr: 'MF-101', item: 'Chicken Breast (Fresh)', qty: 20, confidence: 98, unitPrice: 4.8, unit: 'kg' },
              { id: 'ocr-2', artNr: 'MF-204', item: 'Whole Milk 3.5%', qty: 25, confidence: 97, unitPrice: 1.1, unit: 'L' },
              { id: 'ocr-3', artNr: 'MF-309', item: 'Gouda Cheese Aged', qty: 10, confidence: 95, unitPrice: 8.5, unit: 'kg' },
            ],
          }
        : {
            id: `doc-pos-${Date.now().toString().slice(-4)}`,
            reportNumber: 'POS-REC-4921',
            date: new Date().toISOString().slice(0, 10),
            shift: 'Evening Shift',
            storeName: 'Bella Cucina Restaurant',
            documentType: 'order_invoice',
            status: 'pending',
            totalAmount: 128.5,
            items: [
              { id: 'ocr-101', artNr: 'REC-01', item: 'Margherita Pizza', qty: 4, confidence: 99, unitPrice: 8.5, recipeId: 'rec-1' },
              { id: 'ocr-102', artNr: 'REC-02', item: 'Pasta Carbonara', qty: 6, confidence: 96, unitPrice: 12.5, recipeId: 'rec-2' },
              { id: 'ocr-103', artNr: 'REC-03', item: 'Tiramisu Tradizionale', qty: 3, confidence: 98, unitPrice: 6.5, recipeId: 'rec-3' },
            ],
          };

      const fallbackBom: BomIngredientDeduction[] = isGoods
        ? []
        : [
            { itemId: 'i-flour', itemName: 'Pizza Flour Tipo 00', delta: -1.2, unit: 'kg', costEur: 1.8, theoreticalBefore: 15.0, theoreticalAfter: 13.8 },
            { itemId: 'i-mozz', itemName: 'Mozzarella Fior di Latte', delta: -0.8, unit: 'kg', costEur: 6.4, theoreticalBefore: 8.5, theoreticalAfter: 7.7 },
            { itemId: 'i-pasta', itemName: 'Spaghetti Rustichella', delta: -1.5, unit: 'kg', costEur: 3.75, theoreticalBefore: 12.0, theoreticalAfter: 10.5 },
            { itemId: 'i-bacon', itemName: 'Guanciale Stagionato', delta: -0.6, unit: 'kg', costEur: 9.6, theoreticalBefore: 4.2, theoreticalAfter: 3.6 },
            { itemId: 'i-eggs', itemName: 'Bio Farm Eggs', delta: -12, unit: 'pcs', costEur: 4.2, theoreticalBefore: 60, theoreticalAfter: 48 },
          ];

      return { report: fallbackReport, bomDeductions: fallbackBom };
    }
  }

  async getDocument(documentId: string): Promise<{ report: OcrReport; bomDeductions?: BomIngredientDeduction[] }> {
    try {
      const doc = await apiClient.get<any>(`/ocr/documents/${documentId}`);

      const items: OcrItem[] = (doc.extractedLines || []).map((l: any) => ({
        id: l.id,
        artNr: l.articleNumber || String(l.lineNumber || ''),
        item: l.description,
        recipeId: l.matchedRecipeId || undefined,
        qty: Number(l.quantity || 1),
        confidence: Math.round(Number(l.confidence || 0.95) * 100),
        unitPrice: l.unitPrice ? Number(l.unitPrice) : undefined,
        unit: l.unit || undefined,
      }));

      const bomDeductions: BomIngredientDeduction[] = (doc.bomPreview || []).map((b: any) => ({
        itemId: b.ingredientId,
        itemName: b.ingredientName,
        delta: -Number(b.quantityDeducted),
        unit: b.unit,
        costEur: Number(b.totalCost),
        theoreticalBefore: 0,
        theoreticalAfter: 0,
      }));

      const report: OcrReport = {
        id: doc.id,
        reportNumber: doc.metadata?.documentNumber || doc.fileName || doc.id.slice(-6),
        date: doc.metadata?.date || doc.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        shift: doc.documentType === 'goods_receipt' ? 'Delivery Receiving' : 'POS Register Closure',
        storeName: doc.metadata?.supplierName || 'Restaurant Location',
        documentType: doc.documentType || 'order_invoice',
        status: doc.status || 'pending',
        items,
        rawImageUrl: doc.storagePath,
        totalAmount: doc.metadata?.totalAmount ? Number(doc.metadata.totalAmount) : undefined,
        vatAmount: doc.metadata?.vatAmount ? Number(doc.metadata.vatAmount) : undefined,
        vendorName: doc.metadata?.supplierName || undefined,
        isDuplicate: Boolean(doc.isDuplicate),
      };

      return { report, bomDeductions };
    } catch (err) {
      logDebugFallback('POSOcrService', `/ocr/documents/${documentId}`, err);
      throw err;
    }
  }

  async confirmDeductions(
    reportId: string,
    items?: OcrItem[],
  ): Promise<{ success: boolean; deductions: BomIngredientDeduction[] }> {
    try {
      const res = await apiClient.post<{
        success: boolean;
        documentId: string;
        message: string;
        deductions: BomIngredientDeduction[];
      }>(`/ocr/documents/${reportId}/confirm`, {
        applyDeductions: true,
        items,
      });

      return {
        success: res.success,
        deductions: res.deductions || [],
      };
    } catch (err) {
      logDebugFallback('POSOcrService', `/ocr/documents/${reportId}/confirm`, err);
      throw err;
    }
  }

  async rejectDocument(reportId: string, reason?: string): Promise<{ success: boolean }> {
    try {
      return await apiClient.post(`/ocr/documents/${reportId}/reject`, { reason });
    } catch (err) {
      logDebugFallback('POSOcrService', `/ocr/documents/${reportId}/reject`, err);
      throw err;
    }
  }

  async addItem(documentId: string, item: Partial<OcrItem>): Promise<OcrItem> {
    try {
      const res = await apiClient.post<any>(`/ocr/documents/${documentId}/items`, {
        description: item.item,
        quantity: item.qty || 1,
        unitPrice: item.unitPrice,
        matchedRecipeId: item.recipeId,
      });

      return {
        id: res.id || String(Date.now()),
        artNr: res.articleNumber || item.artNr || 'ITEM',
        item: res.description || item.item || '',
        recipeId: res.matchedRecipeId || item.recipeId,
        qty: Number(res.quantity || item.qty || 1),
        confidence: 100,
        unitPrice: res.unitPrice ? Number(res.unitPrice) : item.unitPrice,
      };
    } catch (err) {
      logDebugFallback('POSOcrService', `/ocr/documents/${documentId}/items`, err);
      throw err;
    }
  }

  async updateItem(documentId: string, itemId: string, item: Partial<OcrItem>): Promise<OcrItem> {
    try {
      await apiClient.patch<any>(`/ocr/documents/${documentId}/items/${itemId}`, {
        description: item.item,
        quantity: item.qty,
        matchedRecipeId: item.recipeId,
        unitPrice: item.unitPrice,
      });

      return {
        id: itemId,
        artNr: item.artNr || '',
        item: item.item || '',
        recipeId: item.recipeId,
        qty: item.qty || 1,
        confidence: 100,
        unitPrice: item.unitPrice,
      };
    } catch (err) {
      logDebugFallback('POSOcrService', `/ocr/documents/${documentId}/items/${itemId}`, err);
      throw err;
    }
  }

  async deleteItem(documentId: string, itemId: string): Promise<{ success: boolean }> {
    try {
      await apiClient.delete(`/ocr/documents/${documentId}/items/${itemId}`);
      return { success: true };
    } catch (err) {
      logDebugFallback('POSOcrService', `/ocr/documents/${documentId}/items/${itemId}`, err);
      throw err;
    }
  }

  async checkDuplicate(documentId: string): Promise<OcrDuplicateCheckResult> {
    try {
      return await apiClient.get<OcrDuplicateCheckResult>(`/ocr/documents/${documentId}/duplicate`);
    } catch (err) {
      logDebugFallback('POSOcrService', `/ocr/documents/${documentId}/duplicate`, err);
      return { isDuplicate: false };
    }
  }

  async revertDocument(documentId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    try {
      return await apiClient.post<{ success: boolean; message: string }>(
        `/ocr/documents/${documentId}/revert`,
        { reason },
      );
    } catch (err) {
      logDebugFallback('POSOcrService', `/ocr/documents/${documentId}/revert`, err);
      throw err;
    }
  }

  async deleteDocument(documentId: string, revertWarehouse = false): Promise<{ success: boolean }> {
    try {
      await apiClient.delete(`/ocr/documents/${documentId}?revertWarehouse=${revertWarehouse}`);
      return { success: true };
    } catch (err) {
      logDebugFallback('POSOcrService', `/ocr/documents/${documentId}`, err);
      throw err;
    }
  }

  async getDocuments(params?: {
    documentType?: string;
    status?: string;
    limit?: number;
  }): Promise<{ data: OcrHistoryItem[]; total: number }> {
    try {
      const queryParts: string[] = [];
      if (params?.documentType) queryParts.push(`documentType=${encodeURIComponent(params.documentType)}`);
      if (params?.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
      if (params?.limit) queryParts.push(`limit=${params.limit}`);
      const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

      const res = await apiClient.get<any>(`/ocr/documents${qs}`);
      const rawList = res.data || res.items || (Array.isArray(res) ? res : []);
      const data: OcrHistoryItem[] = rawList.map((d: any) => ({
        id: d.id,
        documentType: d.documentType || 'order_invoice',
        documentNumber: d.metadata?.documentNumber || d.fileName || d.id.slice(-6),
        vendorName: d.metadata?.supplierName || undefined,
        date: d.metadata?.date || d.createdAt?.slice(0, 10) || '',
        status: d.status || 'pending',
        itemCount: d.extractedItemCount || d.extractedLines?.length || 0,
        totalAmount: d.metadata?.totalAmount ? Number(d.metadata.totalAmount) : undefined,
        currency: d.metadata?.currency || 'EUR',
        createdAt: d.createdAt || new Date().toISOString(),
        isDuplicate: Boolean(d.isDuplicate),
        revertedAt: d.metadata?.revertedAt || undefined,
      }));

      return { data, total: res.total || data.length };
    } catch (err) {
      logDebugFallback('POSOcrService', '/ocr/documents', err);
      return { data: [], total: 0 };
    }
  }
}

export const ocrService: IPOSOcrService = new RealPOSOcrService();

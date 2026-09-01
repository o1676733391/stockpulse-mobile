import { BomIngredientDeduction, OcrItem, OcrReport } from '@/types/ocr';
import { apiClient, logDebugFallback } from './apiClient';

export interface IPOSOcrService {
  processImage(imageUri?: string): Promise<{ report: OcrReport; bomDeductions?: BomIngredientDeduction[] }>;
  getDocument(documentId: string): Promise<{ report: OcrReport; bomDeductions?: BomIngredientDeduction[] }>;
  confirmDeductions(reportId: string, items?: OcrItem[]): Promise<{ success: boolean; deductions: BomIngredientDeduction[] }>;
  rejectDocument(reportId: string, reason?: string): Promise<{ success: boolean }>;
  updateItem(documentId: string, itemId: string, item: Partial<OcrItem>): Promise<OcrItem>;
}

export class RealPOSOcrService implements IPOSOcrService {
  async processImage(imageUri?: string): Promise<{ report: OcrReport; bomDeductions?: BomIngredientDeduction[] }> {
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
        documentType: 'pos_z_report',
        imageBase64,
      });

      const documentId = scanTrigger.documentId;
      return await this.getDocument(documentId);
    } catch (err) {
      logDebugFallback('POSOcrService', '/ocr/scan', err);
      throw err;
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
        shift: 'POS Register Closure',
        storeName: doc.metadata?.supplierName || 'Restaurant Location',
        items,
        rawImageUrl: doc.storagePath,
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

  async updateItem(documentId: string, itemId: string, item: Partial<OcrItem>): Promise<OcrItem> {
    try {
      const updated = await apiClient.patch<any>(`/ocr/documents/${documentId}/items/${itemId}`, {
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
}

export const ocrService: IPOSOcrService = new RealPOSOcrService();

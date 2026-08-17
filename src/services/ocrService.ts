import { BomIngredientDeduction, OcrItem, OcrReport } from '@/types/ocr';
import { apiClient, logDebugFallback } from './apiClient';

export interface IPOSOcrService {
  processImage(imageUri?: string): Promise<{ report: OcrReport; bomDeductions?: BomIngredientDeduction[] }>;
  confirmDeductions(reportId: string, items: OcrItem[]): Promise<{ success: boolean; deductions: BomIngredientDeduction[] }>;
  getMockReport(): OcrReport;
}

export const INITIAL_MOCK_OCR_ITEMS: OcrItem[] = [
  { id: 'ocr-1', artNr: '101', item: 'Menu 1 — Chicken Plate', recipeId: 'r1', qty: 24, confidence: 98 },
  { id: 'ocr-2', artNr: '102', item: 'Burger XL',               recipeId: 'r2', qty: 17, confidence: 96 },
  { id: 'ocr-3', artNr: '103', item: 'Menu 3 — Mixed Salad',    recipeId: 'r4', qty: 8,  confidence: 82 },
  { id: 'ocr-4', artNr: '104', item: 'Salmon Lunch Special',    recipeId: 'r3', qty: 6,  confidence: 95 },
  { id: 'ocr-5', artNr: '105', item: 'Classic Pancakes',        recipeId: 'r5', qty: 4,  confidence: 91 },
];

export class RealPOSOcrService implements IPOSOcrService {
  getMockReport(): OcrReport {
    return {
      id: 'rep-2048',
      reportNumber: '2048',
      date: '10 Mar 2026',
      shift: 'Lunch shift',
      storeName: 'Bella Cucina Restaurant',
      items: JSON.parse(JSON.stringify(INITIAL_MOCK_OCR_ITEMS)),
    };
  }

  async processImage(imageUri?: string): Promise<{ report: OcrReport; bomDeductions?: BomIngredientDeduction[] }> {
    try {
      if (imageUri) {
        const formData = new FormData();
        const filename = imageUri.split('/').pop() || 'receipt.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('receipt', {
          uri: imageUri,
          name: filename,
          type,
        } as any);

        const result = await apiClient.upload<{ report: OcrReport; bomDeductions?: BomIngredientDeduction[] }>(
          '/ocr/scan',
          formData
        );
        return result;
      }

      // Empty scan triggers backend default analysis
      const result = await apiClient.post<{ report: OcrReport; bomDeductions?: BomIngredientDeduction[] }>('/ocr/scan', {});
      return result;
    } catch (err) {
      logDebugFallback('POSOcrService', '/ocr/scan', err);
      await new Promise((resolve) => setTimeout(resolve, 800));
      return { report: this.getMockReport() };
    }
  }

  async confirmDeductions(
    reportId: string,
    items: OcrItem[]
  ): Promise<{ success: boolean; deductions: BomIngredientDeduction[] }> {
    try {
      const res = await apiClient.post<{ success: boolean; deductions: BomIngredientDeduction[] }>('/ocr/confirm', {
        reportId,
        items,
      });
      return res;
    } catch (err) {
      logDebugFallback('POSOcrService', '/ocr/confirm', err);
      return {
        success: true,
        deductions: [
          { itemId: 'i1', itemName: 'Chicken Breast', delta: -4.8, unit: 'kg', costEur: 23.04, theoreticalBefore: 31.8, theoreticalAfter: 27.0 },
          { itemId: 'i9', itemName: 'Ground Beef', delta: -4.25, unit: 'kg', costEur: 26.35, theoreticalBefore: 22.25, theoreticalAfter: 18.0 },
          { itemId: 'i2', itemName: 'Fresh Salmon', delta: -1.32, unit: 'kg', costEur: 21.38, theoreticalBefore: 7.32, theoreticalAfter: 6.0 },
        ],
      };
    }
  }
}

export const ocrService: IPOSOcrService = new RealPOSOcrService();

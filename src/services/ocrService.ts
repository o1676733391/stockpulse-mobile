import { OcrItem, OcrReport } from '@/types/ocr';

export interface IPOSOcrService {
  processImage(imageUri?: string): Promise<OcrReport>;
  getMockReport(): OcrReport;
}

export const INITIAL_MOCK_OCR_ITEMS: OcrItem[] = [
  { id: 'ocr-1', artNr: '101', item: 'Menu 1 — Chicken Plate', recipeId: 'r1', qty: 24, confidence: 98 },
  { id: 'ocr-2', artNr: '102', item: 'Burger XL',               recipeId: 'r2', qty: 17, confidence: 96 },
  { id: 'ocr-3', artNr: '103', item: 'Menu 3 — Mixed Salad',    recipeId: 'r4', qty: 8,  confidence: 82 },
  { id: 'ocr-4', artNr: '104', item: 'Salmon Lunch Special',    recipeId: 'r3', qty: 6,  confidence: 95 },
  { id: 'ocr-5', artNr: '105', item: 'Classic Pancakes',        recipeId: 'r5', qty: 4,  confidence: 91 },
];

export class MockPOSOcrService implements IPOSOcrService {
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

  async processImage(imageUri?: string): Promise<OcrReport> {
    // Simulate OCR extraction latency
    await new Promise((resolve) => setTimeout(resolve, 800));
    return this.getMockReport();
  }
}

export const ocrService: IPOSOcrService = new MockPOSOcrService();

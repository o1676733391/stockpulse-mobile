import { SupabaseService } from '../../database/supabase.service';
import { OcrRepository } from '../ocr.repository';

describe('OCR Agent - Product Mapping & Confidence Scoring Tests', () => {
  let repository: OcrRepository;

  beforeEach(() => {
    const mockSupabaseService = {
      getAdminClient: jest.fn(() => null), // Uses mock mapper
    } as unknown as SupabaseService;

    repository = new OcrRepository(mockSupabaseService);
  });

  describe('5. Product & Recipe Mapping', () => {
    it('should map known items and compute needsReview flag based on confidence threshold', async () => {
      const doc = await repository.findDocumentById('doc-01', 'store-01');
      expect(doc).toBeDefined();
      expect(doc?.extractedLines.length).toBeGreaterThan(0);

      // Verify that lines with low confidence or missing recipe are flagged for manual review
      for (const line of doc!.extractedLines) {
        if (line.confidence < 0.85 || !line.matchedRecipeId) {
          expect(line.needsReview).toBe(true);
        }
      }
    });

    it('should allow supervisor to override and update matched recipe ID', async () => {
      await expect(
        repository.updateDocumentItem('doc-01', 'item-01', {
          matchedRecipeId: 'rec-custom-01',
          description: 'Updated Item Name',
        }, 'store-01'),
      ).resolves.not.toThrow();
    });
  });

  describe('6. Confidence Validation Rules', () => {
    it('should enforce that low-confidence results (< 0.85) set needsReview=true', async () => {
      const doc = await repository.findDocumentById('doc-01', 'store-01');
      const lowConfidenceItem = doc?.extractedLines.find((l) => l.confidence < 0.85);

      if (lowConfidenceItem) {
        expect(lowConfidenceItem.needsReview).toBe(true);
      }
    });
  });
});

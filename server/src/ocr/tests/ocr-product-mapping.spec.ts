import { SupabaseService } from '../../database/supabase.service';
import { OcrRepository } from '../ocr.repository';

describe('OCR Agent - Product Mapping & Confidence Scoring Tests', () => {
  let repository: OcrRepository;

  let mockSupabaseClient: any;

  beforeEach(() => {
    mockSupabaseClient = {
      from: jest.fn((table: string) => {
        if (table === 'ocr_documents') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'doc-01',
                store_id: 'store-01',
                document_type: 'receipt',
                file_name: 'test.jpg',
                storage_path: 'test/test.jpg',
                status: 'review_pending',
                overall_confidence: 0.9,
                processed_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            }),
          };
        } else if (table === 'ocr_document_items') {
          const updateChain = {
            eq: jest.fn().mockReturnThis(),
          };
          (updateChain.eq as jest.Mock)
            .mockReturnValueOnce(updateChain)
            .mockResolvedValueOnce({ error: null });

          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'item-01',
                  line_number: 1,
                  raw_text: 'BURGER 10.00',
                  description: 'Burger',
                  quantity: 1,
                  unit_price: 10.0,
                  total_price: 10.0,
                  confidence: 0.95,
                  matched_recipe_id: 'rec-01',
                  match_status: 'AUTOMATIC',
                  recipes: { id: 'rec-01', name: 'Burger' },
                },
                {
                  id: 'item-02',
                  line_number: 2,
                  raw_text: 'LOWCONF 5.00',
                  description: 'Low Conf Item',
                  quantity: 1,
                  unit_price: 5.0,
                  total_price: 5.0,
                  confidence: 0.50,
                  matched_recipe_id: null,
                  match_status: 'UNMATCHED',
                  recipes: null,
                },
              ],
              error: null,
            }),
            update: jest.fn().mockReturnValue(updateChain),
          };
        } else if (table === 'ocr_bom_deductions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        } else if (table === 'recipe_ingredients') {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          is: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    };

    const mockSupabaseService = {
      getAdminClient: jest.fn(() => mockSupabaseClient),
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

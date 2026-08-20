import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from '../database/supabase.service';
import { RawOcrExtractionResult } from './interfaces/ocr-provider.interface';
import { OcrRepository } from './ocr.repository';

describe('OcrRepository', () => {
  let repository: OcrRepository;
  let supabaseService: jest.Mocked<SupabaseService>;

  const mockSupabaseClient = {
    from: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OcrRepository,
        {
          provide: SupabaseService,
          useValue: {
            getAdminClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
      ],
    }).compile();

    repository = module.get<OcrRepository>(OcrRepository);
    supabaseService = module.get(SupabaseService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('createDocument', () => {
    it('should insert ocr document into Supabase', async () => {
      const insertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: {
            id: 'doc-01',
            store_id: 'store-01',
            document_type: 'pos_z_report',
            file_name: 'receipt.jpg',
            storage_path: 'stores/store-01/ocr/receipt.jpg',
            mime_type: 'image/jpeg',
            file_size_bytes: 100000,
            status: 'processing',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(insertChain as any);

      const result = await repository.createDocument({
        storeId: 'store-01',
        documentType: 'pos_z_report',
        fileName: 'receipt.jpg',
        storagePath: 'stores/store-01/ocr/receipt.jpg',
        mimeType: 'image/jpeg',
        fileSizeBytes: 100000,
      });

      expect(result.id).toBe('doc-01');
      expect(result.status).toBe('processing');
    });
  });

  describe('saveExtractionResults', () => {
    it('should update document status and insert extracted line items', async () => {
      const updateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      (updateChain.eq as jest.Mock)
        .mockReturnValueOnce(updateChain)
        .mockResolvedValueOnce({ error: null });

      const lineInsertChain = {
        insert: jest.fn().mockResolvedValueOnce({ error: null }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(updateChain as any)
        .mockReturnValueOnce(lineInsertChain as any);

      const extraction: RawOcrExtractionResult = {
        providerId: 'google_document_ai',
        processingDurationMs: 450,
        overallConfidence: 0.96,
        metadata: { totalAmount: 45.0 },
        lineItems: [
          {
            lineNumber: 1,
            rawText: '2x BURGER 20.00',
            description: 'Burger',
            quantity: 2,
            totalPrice: 20.0,
            confidence: 0.97,
          },
        ],
      };

      await repository.saveExtractionResults('doc-01', 'store-01', extraction);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ocr_documents');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ocr_document_items');
    });
  });

  describe('markDocumentConfirmed', () => {
    it('should update document status to confirmed', async () => {
      const updateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      (updateChain.eq as jest.Mock)
        .mockReturnValueOnce(updateChain)
        .mockResolvedValueOnce({ error: null });

      mockSupabaseClient.from.mockReturnValueOnce(updateChain as any);

      await repository.markDocumentConfirmed('doc-01', 'store-01', 'actor-01');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ocr_documents');
    });
  });
});

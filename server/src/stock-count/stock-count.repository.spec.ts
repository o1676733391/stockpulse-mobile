import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from '../database/supabase.service';
import {
  RecordCountItemDto,
  StartStockCountSessionDto,
} from './dto/stock-count.dto';
import { StockCountRepository } from './stock-count.repository';

describe('StockCountRepository', () => {
  let repository: StockCountRepository;
  let supabaseService: jest.Mocked<SupabaseService>;

  const mockSupabaseClient = {
    from: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockCountRepository,
        {
          provide: SupabaseService,
          useValue: {
            getAdminClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
      ],
    }).compile();

    repository = module.get<StockCountRepository>(StockCountRepository);
    supabaseService = module.get(SupabaseService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('createSession', () => {
    it('should insert stock count session', async () => {
      const insertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: {
            id: 'session-01',
            session_number: 'CNT-20260820-001',
            store_id: 'store-01',
            conducted_by: 'user-01',
            status: 'in_progress',
            count_type: 'blind',
            total_items: 10,
            total_counted: 0,
            started_at: new Date().toISOString(),
          },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(insertChain as any);

      const dto: StartStockCountSessionDto = { countType: 'blind' };
      const result = await repository.createSession(dto, 'store-01', 'user-01', 10);

      expect(result.id).toBe('session-01');
      expect(result.status).toBe('in_progress');
      expect(result.totalItems).toBe(10);
    });
  });

  describe('recordItemCount', () => {
    it('should upsert stock count item and update total counted', async () => {
      const upsertChain = {
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: {
            id: 'ci-01',
            stock_count_id: 'session-01',
            item_id: 'item-01',
            counted_quantity: 15,
            unit: 'kg',
            recorded_at: new Date().toISOString(),
            inventory_items: { sku: 'SKU-01', name: 'Flour' },
          },
          error: null,
        }),
      };

      const countChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValueOnce({ count: 1, error: null }),
      };

      const updateCountChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValueOnce({ error: null }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(upsertChain as any)
        .mockReturnValueOnce(countChain as any)
        .mockReturnValueOnce(updateCountChain as any);

      const dto: RecordCountItemDto = { itemId: 'item-01', countedQty: 15, unit: 'kg' };
      const result = await repository.recordItemCount('session-01', dto);

      expect(result.countedQuantity).toBe(15);
      expect(result.sku).toBe('SKU-01');
    });
  });

  describe('saveVarianceResults', () => {
    it('should upsert variance header and line items', async () => {
      const headerChain = {
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: { id: 'var-01' },
          error: null,
        }),
      };

      const itemsChain = {
        upsert: jest.fn().mockResolvedValueOnce({ error: null }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(headerChain as any)
        .mockReturnValueOnce(itemsChain as any);

      const varianceId = await repository.saveVarianceResults('session-01', 'store-01', {
        varianceNumber: 'VAR-01',
        totalExpectedValue: 100,
        totalCountedValue: 90,
        netVarianceValue: -10,
        totalItemsCounted: 1,
        itemsWithDiscrepancyCount: 1,
        items: [
          {
            itemId: 'item-01',
            sku: 'SKU-01',
            name: 'Flour',
            unit: 'kg',
            unitCost: 2.0,
            expectedQty: 50,
            countedQty: 45,
            varianceQty: -5,
            variancePercentage: -10,
            varianceValue: -10.0,
            discrepancyTier: 'minor',
          },
        ],
      });

      expect(varianceId).toBe('var-01');
    });
  });
});

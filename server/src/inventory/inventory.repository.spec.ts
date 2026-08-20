import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from '../database/supabase.service';
import {
  CreateInventoryItemDto,
  CreateStockAdjustmentDto,
  QueryInventoryDto,
  UpdateInventoryItemDto,
} from './dto/inventory.dto';
import { InventoryRepository } from './inventory.repository';

describe('InventoryRepository', () => {
  let repository: InventoryRepository;
  let supabaseService: jest.Mocked<SupabaseService>;

  const mockSupabaseClient = {
    from: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryRepository,
        {
          provide: SupabaseService,
          useValue: {
            getAdminClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
      ],
    }).compile();

    repository = module.get<InventoryRepository>(InventoryRepository);
    supabaseService = module.get(SupabaseService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findPaginated', () => {
    it('should query Supabase with store filter and pagination ranges', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValueOnce({
          data: [
            {
              id: 'item-01',
              store_id: 'store-01',
              sku: 'SKU-01',
              name: 'Item 1',
              physical_stock: 10,
              cost_per_unit: 2.0,
              status: 'healthy',
            },
          ],
          count: 1,
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(mockChain as any);

      const query: QueryInventoryDto = { page: 1, limit: 10, search: 'Item' };
      const result = await repository.findPaginated(query, 'store-01');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('inventory_items');
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });
  });

  describe('create', () => {
    it('should create SKU if not duplicate', async () => {
      // 1. Check duplicate findBySku returns null
      const checkChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({ data: null, error: null }),
      };

      // 2. Insert chain
      const insertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: {
            id: 'new-uuid',
            store_id: 'store-01',
            sku: 'NEW-01',
            name: 'New Item',
            unit: 'kg',
            physical_stock: 0,
            cost_per_unit: 5.0,
            status: 'critical',
            version: 1,
          },
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(checkChain as any)
        .mockReturnValueOnce(insertChain as any);

      const dto: CreateInventoryItemDto = {
        sku: 'NEW-01',
        name: 'New Item',
        unit: 'kg',
        targetStock: 20,
        safetyStock: 5,
        costPerUnit: 5.0,
      };

      const result = await repository.create(dto, 'store-01', 'actor-01');

      expect(result.sku).toBe('NEW-01');
      expect(result.status).toBe('critical');
    });

    it('should throw ConflictException if SKU already exists in store', async () => {
      const checkChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: { id: 'existing-id', sku: 'EXISTING-01' },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(checkChain as any);

      const dto: CreateInventoryItemDto = {
        sku: 'EXISTING-01',
        name: 'Duplicate',
        unit: 'kg',
        targetStock: 10,
        safetyStock: 2,
        costPerUnit: 1.0,
      };

      await expect(repository.create(dto, 'store-01')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update item when found', async () => {
      // 1. findById
      const findChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: {
            id: 'item-01',
            store_id: 'store-01',
            sku: 'SKU-01',
            name: 'Old Name',
            physical_stock: 10,
            safety_stock: 5,
            target_stock: 20,
            cost_per_unit: 3.0,
            status: 'healthy',
            version: 1,
          },
          error: null,
        }),
      };

      // 2. batches query
      const batchesChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce({ data: [], error: null }),
      };

      // 3. transactions query
      const txChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce({ data: [], error: null }),
      };

      // 4. update query
      const updateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: {
            id: 'item-01',
            store_id: 'store-01',
            sku: 'SKU-01',
            name: 'Updated Name',
            physical_stock: 10,
            safety_stock: 5,
            target_stock: 20,
            cost_per_unit: 3.0,
            status: 'healthy',
            version: 2,
          },
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(findChain as any)
        .mockReturnValueOnce(batchesChain as any)
        .mockReturnValueOnce(txChain as any)
        .mockReturnValueOnce(updateChain as any);

      const dto: UpdateInventoryItemDto = { name: 'Updated Name' };
      const result = await repository.update('item-01', dto, 'store-01', 'actor-01');

      expect(result.name).toBe('Updated Name');
      expect(result.version).toBe(2);
    });
  });

  describe('archive', () => {
    it('should soft-delete item', async () => {
      // 1. findById
      const findChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: {
            id: 'item-01',
            store_id: 'store-01',
            sku: 'SKU-01',
            name: 'Item To Archive',
            physical_stock: 0,
            version: 1,
          },
          error: null,
        }),
      };

      // 2. batches query
      const batchesChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce({ data: [], error: null }),
      };

      // 3. transactions query
      const txChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce({ data: [], error: null }),
      };

      // 4. update soft-delete query
      const archiveChain: any = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn(),
      };
      archiveChain.eq
        .mockReturnValueOnce(archiveChain)
        .mockResolvedValueOnce({ error: null });

      mockSupabaseClient.from
        .mockReturnValueOnce(findChain as any)
        .mockReturnValueOnce(batchesChain as any)
        .mockReturnValueOnce(txChain as any)
        .mockReturnValueOnce(archiveChain as any);

      const result = await repository.archive('item-01', 'store-01', 'actor-01');

      expect(result.success).toBe(true);
      expect(result.id).toBe('item-01');
    });
  });
});

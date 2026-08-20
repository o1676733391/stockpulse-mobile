import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CreateInventoryItemDto,
  InventoryItemDetailResponseDto,
  InventoryItemResponseDto,
  QueryInventoryDto,
  UpdateInventoryItemDto,
} from './dto/inventory.dto';
import { InventoryRepository } from './inventory.repository';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let repository: jest.Mocked<InventoryRepository>;

  const mockItem: InventoryItemResponseDto = {
    id: 'item-uuid-01',
    storeId: 'store-uuid-01',
    sku: 'DAI-001',
    name: 'Whole Milk 3.5%',
    unit: 'L',
    physicalStock: 20,
    theoreticalStock: 20,
    targetStock: 40,
    safetyStock: 10,
    reorderPoint: 10,
    costPerUnit: 1.2,
    totalValue: 24.0,
    status: 'healthy',
    version: 1,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockDetail: InventoryItemDetailResponseDto = {
    ...mockItem,
    batches: [],
    recentTransactions: [],
  };

  beforeEach(async () => {
    const mockRepository = {
      findPaginated: jest.fn().mockResolvedValue({
        data: [mockItem],
        meta: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }),
      findById: jest.fn().mockResolvedValue(mockDetail),
      findBySku: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockItem),
      update: jest.fn().mockResolvedValue(mockItem),
      archive: jest.fn().mockResolvedValue({
        success: true,
        message: 'Archived',
        id: 'item-uuid-01',
        archivedAt: new Date().toISOString(),
      }),
      adjustStock: jest.fn().mockResolvedValue({
        transactionId: 'tx-01',
        transactionNumber: 'TXN-01',
        itemId: 'item-uuid-01',
        previousStock: 20,
        newStock: 25,
        delta: 5,
        costImpact: 6.0,
        status: 'healthy',
        version: 2,
        timestamp: new Date().toISOString(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: InventoryRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    repository = module.get(InventoryRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findPaginated', () => {
    it('should return paginated inventory items', async () => {
      const query: QueryInventoryDto = { page: 1, limit: 10 };
      const result = await service.findPaginated(query, 'store-uuid-01');

      expect(repository.findPaginated).toHaveBeenCalledWith(
        query,
        'store-uuid-01',
        undefined,
      );
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return inventory item details', async () => {
      const result = await service.findById('item-uuid-01', 'store-uuid-01');

      expect(repository.findById).toHaveBeenCalledWith(
        'item-uuid-01',
        'store-uuid-01',
      );
      expect(result.sku).toBe('DAI-001');
    });

    it('should throw NotFoundException if item does not exist', async () => {
      repository.findById.mockResolvedValueOnce(null);

      await expect(
        service.findById('non-existent', 'store-uuid-01'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should delegate creation to repository', async () => {
      const dto: CreateInventoryItemDto = {
        sku: 'DAI-001',
        name: 'Whole Milk 3.5%',
        unit: 'L',
        targetStock: 40,
        safetyStock: 10,
        costPerUnit: 1.2,
      };

      const result = await service.create(dto, 'store-uuid-01', 'actor-01');

      expect(repository.create).toHaveBeenCalledWith(
        dto,
        'store-uuid-01',
        'actor-01',
      );
      expect(result.sku).toBe('DAI-001');
    });
  });

  describe('update', () => {
    it('should delegate update to repository', async () => {
      const dto: UpdateInventoryItemDto = {
        name: 'Whole Milk 3.8% Organic',
        targetStock: 50,
      };

      const result = await service.update(
        'item-uuid-01',
        dto,
        'store-uuid-01',
        'actor-01',
      );

      expect(repository.update).toHaveBeenCalledWith(
        'item-uuid-01',
        dto,
        'store-uuid-01',
        'actor-01',
      );
      expect(result).toBeDefined();
    });
  });

  describe('archive', () => {
    it('should delegate archiving to repository', async () => {
      const result = await service.archive('item-uuid-01', 'store-uuid-01', 'actor-01');

      expect(repository.archive).toHaveBeenCalledWith(
        'item-uuid-01',
        'store-uuid-01',
        'actor-01',
      );
      expect(result.success).toBe(true);
    });
  });
});

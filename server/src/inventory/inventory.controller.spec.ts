import { Test, TestingModule } from '@nestjs/testing';
import {
  CreateInventoryItemDto,
  CreateStockAdjustmentDto,
  InventoryItemDetailResponseDto,
  InventoryItemResponseDto,
  QueryInventoryDto,
  UpdateInventoryItemDto,
} from './dto/inventory.dto';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

describe('InventoryController', () => {
  let controller: InventoryController;
  let service: jest.Mocked<InventoryService>;

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
    const mockService = {
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
      controllers: [InventoryController],
      providers: [
        {
          provide: InventoryService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<InventoryController>(InventoryController);
    service = module.get(InventoryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findPaginated', () => {
    it('should return paginated items from service', async () => {
      const query: QueryInventoryDto = { page: 1, limit: 10 };
      const result = await controller.findPaginated(
        query,
        'store-uuid-01',
        'org-uuid-01',
      );

      expect(service.findPaginated).toHaveBeenCalledWith(
        query,
        'store-uuid-01',
        'org-uuid-01',
      );
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return item detail by ID', async () => {
      const result = await controller.findById('item-uuid-01', 'store-uuid-01');

      expect(service.findById).toHaveBeenCalledWith(
        'item-uuid-01',
        'store-uuid-01',
      );
      expect(result.sku).toBe('DAI-001');
    });
  });

  describe('create', () => {
    it('should create new SKU', async () => {
      const dto: CreateInventoryItemDto = {
        sku: 'DAI-001',
        name: 'Whole Milk 3.5%',
        unit: 'L',
        targetStock: 40,
        safetyStock: 10,
        costPerUnit: 1.2,
      };

      const result = await controller.create(dto, 'store-uuid-01', 'user-01');

      expect(service.create).toHaveBeenCalledWith(
        dto,
        'store-uuid-01',
        'user-01',
      );
      expect(result.sku).toBe('DAI-001');
    });
  });

  describe('update', () => {
    it('should update item', async () => {
      const dto: UpdateInventoryItemDto = { name: 'Updated Milk' };
      const result = await controller.update(
        'item-uuid-01',
        dto,
        'store-uuid-01',
        'user-01',
      );

      expect(service.update).toHaveBeenCalledWith(
        'item-uuid-01',
        dto,
        'store-uuid-01',
        'user-01',
      );
      expect(result).toBeDefined();
    });
  });

  describe('archive', () => {
    it('should archive item', async () => {
      const result = await controller.archive('item-uuid-01', 'store-uuid-01', 'user-01');

      expect(service.archive).toHaveBeenCalledWith(
        'item-uuid-01',
        'store-uuid-01',
        'user-01',
      );
      expect(result.success).toBe(true);
    });
  });

  describe('adjustStock', () => {
    it('should execute stock adjustment', async () => {
      const dto: CreateStockAdjustmentDto = {
        delta: 5,
        reasonCode: 'MANUAL_CORRECTION',
      };

      const result = await controller.adjustStock(
        'item-uuid-01',
        dto,
        'store-uuid-01',
        'user-01',
      );

      expect(service.adjustStock).toHaveBeenCalledWith(
        'item-uuid-01',
        dto,
        'store-uuid-01',
        'user-01',
      );
      expect(result.delta).toBe(5);
    });
  });
});

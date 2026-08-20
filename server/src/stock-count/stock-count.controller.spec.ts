import { Test, TestingModule } from '@nestjs/testing';
import {
  ApproveVarianceResponseDto,
  RecordCountItemDto,
  StartStockCountSessionDto,
  StockCountDetailResponseDto,
  StockCountItemResponseDto,
  StockCountSessionResponseDto,
  SubmitCountSessionDto,
  VarianceReviewResponseDto,
} from './dto/stock-count.dto';
import { StockCountController } from './stock-count.controller';
import { StockCountService } from './stock-count.service';

describe('StockCountController', () => {
  let controller: StockCountController;
  let service: jest.Mocked<StockCountService>;

  const mockSession: StockCountSessionResponseDto = {
    id: 'session-01',
    sessionNumber: 'SC-20260820-001',
    storeId: 'store-01',
    conductedBy: 'user-01',
    status: 'in_progress',
    countType: 'blind',
    totalItems: 3,
    totalCounted: 0,
    startedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockDetail: StockCountDetailResponseDto = {
    ...mockSession,
    items: [],
    variance: null,
  };

  const mockVariance: VarianceReviewResponseDto = {
    varianceId: 'var-01',
    sessionId: 'session-01',
    sessionNumber: 'SC-20260820-001',
    totalExpectedValue: 100,
    totalCountedValue: 90,
    netVarianceValue: -10,
    totalItemsCounted: 1,
    itemsWithDiscrepancyCount: 1,
    varianceItems: [],
  };

  beforeEach(async () => {
    const mockService = {
      startSession: jest.fn().mockResolvedValue(mockSession),
      recordItemCount: jest.fn().mockResolvedValue({
        id: 'ci-01',
        stockCountId: 'session-01',
        itemId: 'item-01',
        sku: 'DAI-001',
        name: 'Milk',
        unit: 'L',
        countedQuantity: 18,
        recordedAt: new Date().toISOString(),
      }),
      bulkRecordItemCounts: jest.fn().mockResolvedValue({ success: true, recordedCount: 2 }),
      submitCount: jest.fn().mockResolvedValue(mockVariance),
      getVarianceSummary: jest.fn().mockResolvedValue(mockVariance),
      approveVariance: jest.fn().mockResolvedValue({
        success: true,
        message: 'Approved',
        sessionId: 'session-01',
        varianceId: 'var-01',
        syncedItemsCount: 1,
        netVarianceValue: -10,
        ledgerSyncedAt: new Date().toISOString(),
      }),
      findHistory: jest.fn().mockResolvedValue({
        data: [mockSession],
        meta: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }),
      findSessionById: jest.fn().mockResolvedValue(mockDetail),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockCountController],
      providers: [
        {
          provide: StockCountService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<StockCountController>(StockCountController);
    service = module.get(StockCountService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('startSession', () => {
    it('should delegate to StockCountService.startSession', async () => {
      const dto: StartStockCountSessionDto = { countType: 'blind' };
      const result = await controller.startSession(dto, 'store-01', 'user-01');

      expect(service.startSession).toHaveBeenCalledWith(dto, 'store-01', 'user-01');
      expect(result.id).toBe('session-01');
    });
  });

  describe('recordItemCount', () => {
    it('should record counted item', async () => {
      const dto: RecordCountItemDto = { itemId: 'item-01', countedQty: 18, unit: 'L' };
      const result = await controller.recordItemCount('session-01', 'item-01', dto, 'store-01');

      expect(service.recordItemCount).toHaveBeenCalledWith('session-01', dto, 'store-01');
      expect(result.countedQuantity).toBe(18);
    });
  });

  describe('submitCount', () => {
    it('should submit count and return calculated variance', async () => {
      const dto: SubmitCountSessionDto = { notes: 'Finished' };
      const result = await controller.submitCount('session-01', dto, 'store-01', 'user-01');

      expect(service.submitCount).toHaveBeenCalledWith('session-01', dto, 'store-01', 'user-01');
      expect(result.netVarianceValue).toBe(-10);
    });
  });

  describe('approveVariance', () => {
    it('should approve variance through service', async () => {
      const result = await controller.approveVariance('session-01', 'store-01', 'manager-01');

      expect(service.approveVariance).toHaveBeenCalledWith('session-01', 'store-01', 'manager-01');
      expect(result.success).toBe(true);
    });
  });

  describe('findHistory', () => {
    it('should query history via service', async () => {
      const result = await controller.findHistory({ page: 1, limit: 10 }, 'store-01');

      expect(service.findHistory).toHaveBeenCalledWith({ page: 1, limit: 10 }, 'store-01');
      expect(result.data).toHaveLength(1);
    });
  });
});

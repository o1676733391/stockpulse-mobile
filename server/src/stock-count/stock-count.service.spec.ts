import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  RecordCountItemDto,
  StartStockCountSessionDto,
  StockCountDetailResponseDto,
  StockCountSessionResponseDto,
} from './dto/stock-count.dto';
import { StockCountRepository } from './stock-count.repository';
import { StockCountService } from './stock-count.service';

describe('StockCountService', () => {
  let service: StockCountService;
  let repository: jest.Mocked<StockCountRepository>;

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

  const mockSessionDetail: StockCountDetailResponseDto = {
    ...mockSession,
    items: [],
    variance: null,
  };

  beforeEach(async () => {
    const mockRepo = {
      findStoreItemsForCount: jest.fn().mockResolvedValue([
        {
          id: 'item-01',
          sku: 'DAI-001',
          name: 'Milk 1L',
          unit: 'L',
          physicalStock: 20,
          costPerUnit: 1.5,
        },
        {
          id: 'item-02',
          sku: 'MEA-002',
          name: 'Steak 250g',
          unit: 'pcs',
          physicalStock: 10,
          costPerUnit: 12.0,
        },
        {
          id: 'item-03',
          sku: 'VEG-003',
          name: 'Tomatoes',
          unit: 'kg',
          physicalStock: 5,
          costPerUnit: 2.0,
        },
      ]),
      findSessionById: jest.fn().mockResolvedValue(mockSessionDetail),
      createSession: jest.fn().mockResolvedValue(mockSession),
      recordItemCount: jest.fn().mockResolvedValue({
        id: 'ci-01',
        stockCountId: 'session-01',
        itemId: 'item-01',
        sku: 'DAI-001',
        name: 'Milk 1L',
        unit: 'L',
        countedQuantity: 18,
        recordedAt: new Date().toISOString(),
      }),
      bulkRecordItemCounts: jest.fn().mockResolvedValue(undefined),
      findSessionCountedItems: jest.fn().mockResolvedValue([
        { itemId: 'item-01', countedQuantity: 18, unit: 'L' }, // Variance: -2 (Loss: -$3.00, -10%) -> minor
        { itemId: 'item-02', countedQuantity: 5, unit: 'pcs' },  // Variance: -5 (Loss: -$60.00, -50%) -> critical (>15%)
        { itemId: 'item-03', countedQuantity: 5, unit: 'kg' },   // Variance: 0 (No variance) -> none
      ]),
      saveVarianceResults: jest.fn().mockResolvedValue('var-uuid-01'),
      completeSession: jest.fn().mockResolvedValue(undefined),
      getVarianceSummary: jest.fn().mockResolvedValue({
        varianceId: 'var-uuid-01',
        sessionId: 'session-01',
        sessionNumber: 'SC-20260820-001',
        totalExpectedValue: 160.0,
        totalCountedValue: 97.0,
        netVarianceValue: -63.0,
        totalItemsCounted: 3,
        itemsWithDiscrepancyCount: 2,
        varianceItems: [
          {
            itemId: 'item-01',
            sku: 'DAI-001',
            name: 'Milk 1L',
            unit: 'L',
            unitCost: 1.5,
            expectedQty: 20,
            countedQty: 18,
            varianceQty: -2,
            variancePercentage: -10,
            varianceValue: -3.0,
            discrepancyTier: 'minor',
          },
          {
            itemId: 'item-02',
            sku: 'MEA-002',
            name: 'Steak 250g',
            unit: 'pcs',
            unitCost: 12.0,
            expectedQty: 10,
            countedQty: 5,
            varianceQty: -5,
            variancePercentage: -50,
            varianceValue: -60.0,
            discrepancyTier: 'critical',
          },
        ],
      }),
      applyVarianceSyncToLedger: jest.fn().mockResolvedValue(undefined),
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
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockCountService,
        {
          provide: StockCountRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<StockCountService>(StockCountService);
    repository = module.get(StockCountRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startSession', () => {
    it('should query store items and create new session in progress', async () => {
      const dto: StartStockCountSessionDto = { countType: 'blind' };
      const result = await service.startSession(dto, 'store-01', 'user-01');

      expect(repository.findStoreItemsForCount).toHaveBeenCalledWith('store-01', undefined);
      expect(repository.createSession).toHaveBeenCalledWith(dto, 'store-01', 'user-01', 3);
      expect(result.status).toBe('in_progress');
    });
  });

  describe('recordItemCount', () => {
    it('should record count if session is in progress', async () => {
      const dto: RecordCountItemDto = { itemId: 'item-01', countedQty: 18, unit: 'L' };
      const result = await service.recordItemCount('session-01', dto, 'store-01');

      expect(repository.recordItemCount).toHaveBeenCalledWith('session-01', dto);
      expect(result.countedQuantity).toBe(18);
    });

    it('should throw BadRequestException if session is already completed', async () => {
      repository.findSessionById.mockResolvedValueOnce({
        ...mockSessionDetail,
        status: 'completed',
      });

      const dto: RecordCountItemDto = { itemId: 'item-01', countedQty: 18, unit: 'L' };
      await expect(
        service.recordItemCount('session-01', dto, 'store-01'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitCount & Variance Calculation', () => {
    it('should calculate variance mathematics and categorize discrepancy tiers correctly', async () => {
      const result = await service.submitCount('session-01', { notes: 'EOD Count' }, 'store-01', 'user-01');

      expect(repository.saveVarianceResults).toHaveBeenCalled();
      expect(repository.completeSession).toHaveBeenCalledWith('session-01', 'store-01', 'EOD Count');

      expect(result.itemsWithDiscrepancyCount).toBe(2);
      expect(result.netVarianceValue).toBe(-63.0); // ($18*1.5 + 5*12 + 5*2) - (20*1.5 + 10*12 + 5*2) = 97 - 160 = -63

      const milk = result.varianceItems.find((i) => i.itemId === 'item-01');
      expect(milk?.varianceQty).toBe(-2);
      expect(milk?.varianceValue).toBe(-3.0);
      expect(milk?.discrepancyTier).toBe('minor'); // 10% shrinkage < 15% threshold

      const steak = result.varianceItems.find((i) => i.itemId === 'item-02');
      expect(steak?.varianceQty).toBe(-5);
      expect(steak?.varianceValue).toBe(-60.0);
      expect(steak?.discrepancyTier).toBe('critical'); // 50% shrinkage >= 15% threshold

      const tomato = result.varianceItems.find((i) => i.itemId === 'item-03');
      expect(tomato?.varianceQty).toBe(0);
      expect(tomato?.discrepancyTier).toBe('none');
    });
  });

  describe('approveVariance', () => {
    it('should approve completed count and trigger ledger reconciliation', async () => {
      repository.findSessionById.mockResolvedValueOnce({
        ...mockSessionDetail,
        status: 'completed',
      });

      const result = await service.approveVariance('session-01', 'store-01', 'manager-01');

      expect(repository.applyVarianceSyncToLedger).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.syncedItemsCount).toBe(2);
    });

    it('should throw BadRequestException if approving an uncompleted session', async () => {
      repository.findSessionById.mockResolvedValueOnce({
        ...mockSessionDetail,
        status: 'in_progress',
      });

      await expect(
        service.approveVariance('session-01', 'store-01', 'manager-01'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

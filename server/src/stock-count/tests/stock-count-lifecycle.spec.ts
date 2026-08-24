import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StockCountRepository } from '../stock-count.repository';
import { StockCountService } from '../stock-count.service';

describe('Stock Count - Session Lifecycle & State Transition Tests', () => {
  let service: StockCountService;
  let repository: StockCountRepository;

  const mockSession = {
    id: 'session-life-01',
    sessionNumber: 'SC-20260820-0099',
    storeId: 'store-01',
    countType: 'blind',
    status: 'in_progress',
    totalItemsExpected: 10,
    totalItemsCounted: 0,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    repository = {
      findSessionById: jest.fn().mockResolvedValue(mockSession),
      findStoreItemsForCount: jest.fn().mockResolvedValue([]),
      findSessionCountedItems: jest.fn().mockResolvedValue([]),
      createSession: jest.fn().mockResolvedValue(mockSession),
      recordItemCount: jest.fn().mockResolvedValue({
        id: 'line-01',
        stockCountId: 'session-life-01',
        itemId: 'item-01',
        sku: 'DAI-001',
        name: 'Whole Milk',
        unit: 'L',
        countedQuantity: 15.0,
        recordedAt: new Date().toISOString(),
      }),
      bulkRecordItemCounts: jest.fn().mockResolvedValue(undefined),
      saveVarianceResults: jest.fn().mockResolvedValue('var-01'),
      completeSession: jest.fn().mockResolvedValue(undefined),
      applyVarianceSyncToLedger: jest.fn().mockResolvedValue(undefined),
      getVarianceSummary: jest.fn().mockResolvedValue({
        varianceId: 'var-01',
        sessionId: 'session-life-01',
        netVarianceValue: -15.0,
        varianceItems: [],
      }),
      findHistory: jest.fn().mockResolvedValue({
        data: [mockSession],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    } as unknown as StockCountRepository;

    service = new StockCountService(repository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Session Creation & Recording', () => {
    it('should start a new blind stock count session', async () => {
      const res = await service.startSession(
        { countType: 'blind', notes: 'Friday night blind audit' },
        'store-01',
        'actor-01',
      );

      expect(res.id).toBe('session-life-01');
      expect(repository.createSession).toHaveBeenCalled();
    });

    it('should record single item count during active session', async () => {
      const line = await service.recordItemCount(
        'session-life-01',
        { itemId: '01915dfa-b1c4-7221-9988-51b72e04e0a1', countedQty: 15.0, unit: 'L' },
        'store-01',
      );

      expect(line.countedQuantity).toBe(15.0);
      expect(repository.recordItemCount).toHaveBeenCalled();
    });

    it('should bulk record multiple item counts', async () => {
      const res = await service.bulkRecordItemCounts(
        'session-life-01',
        {
          items: [
            { itemId: '01915dfa-b1c4-7221-9988-51b72e04e0a1', countedQty: 10.0, unit: 'L' },
            { itemId: '01915dfa-b1c4-7221-9988-51b72e04e0a2', countedQty: 25.5, unit: 'pcs' },
          ],
        },
        'store-01',
      );

      expect(res.success).toBe(true);
      expect(res.recordedCount).toBe(2);
      expect(repository.bulkRecordItemCounts).toHaveBeenCalled();
    });

    it('should reject recording count on a completed session', async () => {
      (repository.findSessionById as jest.Mock).mockResolvedValueOnce({
        ...mockSession,
        status: 'completed',
      });

      await expect(
        service.recordItemCount(
          'session-life-01',
          { itemId: '01915dfa-b1c4-7221-9988-51b72e04e0a1', countedQty: 5.0, unit: 'L' },
          'store-01',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when recording on non-existent session', async () => {
      (repository.findSessionById as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.recordItemCount(
          'session-ghost',
          { itemId: '01915dfa-b1c4-7221-9988-51b72e04e0a1', countedQty: 5.0, unit: 'L' },
          'store-01',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('2. Submission & Duplicate Protection', () => {
    it('should submit count session and transition status to completed', async () => {
      const result = await service.submitCount(
        'session-life-01',
        { notes: 'Submitted by supervisor' },
        'store-01',
        'actor-01',
      );

      expect(result.sessionId).toBe('session-life-01');
      expect(repository.completeSession).toHaveBeenCalledWith(
        'session-life-01',
        'store-01',
        'Submitted by supervisor',
      );
    });

    it('CRITICAL: Duplicate Submission - Should reject submitting already completed session', async () => {
      (repository.findSessionById as jest.Mock).mockResolvedValueOnce({
        ...mockSession,
        status: 'completed', // Already completed
      });

      await expect(
        service.submitCount(
          'session-life-01',
          { notes: 'Resubmission attempt' },
          'store-01',
          'actor-01',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('CRITICAL: Duplicate Approval - Should reject approving already approved session', async () => {
      (repository.findSessionById as jest.Mock).mockResolvedValueOnce({
        ...mockSession,
        status: 'approved', // Already approved
      });

      await expect(
        service.approveVariance('session-life-01', 'store-01', 'actor-01'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. Variance Approval & History', () => {
    it('should approve variance for completed session and synchronize stock balances', async () => {
      (repository.findSessionById as jest.Mock).mockResolvedValueOnce({
        ...mockSession,
        status: 'completed',
      });

      const res = await service.approveVariance('session-life-01', 'store-01', 'actor-01');

      expect(res.success).toBe(true);
      expect(repository.applyVarianceSyncToLedger).toHaveBeenCalledWith(
        'session-life-01',
        'var-01',
        'store-01',
        'actor-01',
        expect.anything(),
      );
    });

    it('should retrieve count session history with filters', async () => {
      const history = await service.findHistory({ page: 1, limit: 10 }, 'store-01');

      expect(history.data).toHaveLength(1);
      expect(history.meta.page).toBe(1);
      expect(repository.findHistory).toHaveBeenCalled();
    });
  });
});

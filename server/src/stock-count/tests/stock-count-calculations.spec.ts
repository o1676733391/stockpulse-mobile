import { StockCountRepository } from '../stock-count.repository';
import { StockCountService } from '../stock-count.service';

describe('Stock Count - Mathematical Calculations & Variance Engine Tests', () => {
  let service: StockCountService;
  let repository: StockCountRepository;

  const mockSession = {
    id: 'session-calc-01',
    sessionNumber: 'SC-20260820-0001',
    storeId: 'store-01',
    countType: 'standard',
    status: 'in_progress',
    totalItemsExpected: 5,
  };

  beforeEach(() => {
    repository = {
      findSessionById: jest.fn().mockResolvedValue(mockSession),
      findStoreItemsForCount: jest.fn(),
      findSessionCountedItems: jest.fn(),
      saveVarianceResults: jest.fn().mockResolvedValue('var-uuid-001'),
      completeSession: jest.fn().mockResolvedValue(undefined),
    } as unknown as StockCountRepository;

    service = new StockCountService(repository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('1. Exact Match: Should calculate 0 variance and tier as "none"', async () => {
    (repository.findStoreItemsForCount as jest.Mock).mockResolvedValueOnce([
      {
        id: 'item-01',
        sku: 'DAI-001',
        name: 'Whole Milk 3.5%',
        unit: 'L',
        costPerUnit: 1.5,
        physicalStock: 20.0,
      },
    ]);

    (repository.findSessionCountedItems as jest.Mock).mockResolvedValueOnce([
      {
        itemId: 'item-01',
        countedQuantity: 20.0, // Exact match
      },
    ]);

    const result = await service.submitCount(
      'session-calc-01',
      { notes: 'Closing audit' },
      'store-01',
      'user-01',
    );

    expect(result.varianceItems).toHaveLength(1);
    const item = result.varianceItems[0];
    expect(item.expectedQty).toBe(20.0);
    expect(item.countedQty).toBe(20.0);
    expect(item.varianceQty).toBe(0);
    expect(item.varianceValue).toBe(0);
    expect(item.variancePercentage).toBe(0);
    expect(item.discrepancyTier).toBe('none');
    expect(result.itemsWithDiscrepancyCount).toBe(0);
    expect(result.netVarianceValue).toBe(0);
  });

  it('2. Shortage / Shrinkage: Should calculate negative variance and financial loss', async () => {
    (repository.findStoreItemsForCount as jest.Mock).mockResolvedValueOnce([
      {
        id: 'item-02',
        sku: 'MEA-001',
        name: 'Beef Patty 180g',
        unit: 'pcs',
        costPerUnit: 2.5,
        physicalStock: 50.0,
      },
    ]);

    (repository.findSessionCountedItems as jest.Mock).mockResolvedValueOnce([
      {
        itemId: 'item-02',
        countedQuantity: 42.0, // Shortage of 8 pcs
      },
    ]);

    const result = await service.submitCount(
      'session-calc-01',
      { notes: 'Shrinkage detected' },
      'store-01',
      'user-01',
    );

    const item = result.varianceItems[0];
    expect(item.varianceQty).toBe(-8.0);
    expect(item.varianceValue).toBe(-20.0); // -8 * 2.50 = -20.00
    expect(item.variancePercentage).toBe(-16.0); // -8 / 50 = -16.00%
    expect(item.discrepancyTier).toBe('critical'); // >= 15% threshold
    expect(result.itemsWithDiscrepancyCount).toBe(1);
    expect(result.netVarianceValue).toBe(-20.0);
  });

  it('3. Surplus: Should calculate positive variance and financial gain', async () => {
    (repository.findStoreItemsForCount as jest.Mock).mockResolvedValueOnce([
      {
        id: 'item-03',
        sku: 'BEV-001',
        name: 'Coca Cola 330ml',
        unit: 'can',
        costPerUnit: 0.8,
        physicalStock: 100.0,
      },
    ]);

    (repository.findSessionCountedItems as jest.Mock).mockResolvedValueOnce([
      {
        itemId: 'item-03',
        countedQuantity: 105.0, // Surplus of 5 cans
      },
    ]);

    const result = await service.submitCount(
      'session-calc-01',
      { notes: 'Extra stock in secondary storage' },
      'store-01',
      'user-01',
    );

    const item = result.varianceItems[0];
    expect(item.varianceQty).toBe(5.0);
    expect(item.varianceValue).toBe(4.0); // 5 * 0.80 = 4.00
    expect(item.variancePercentage).toBe(5.0); // 5 / 100 = 5.00%
    expect(item.discrepancyTier).toBe('minor'); // < 15% and < $100
    expect(result.netVarianceValue).toBe(4.0);
  });

  it('4. Zero Quantity Counted: Should handle uncounted items as complete loss (-100%)', async () => {
    (repository.findStoreItemsForCount as jest.Mock).mockResolvedValueOnce([
      {
        id: 'item-04',
        sku: 'PRO-001',
        name: 'Salmon Fillet Fresh (1kg)',
        unit: 'kg',
        costPerUnit: 25.0,
        physicalStock: 10.0,
      },
    ]);

    (repository.findSessionCountedItems as jest.Mock).mockResolvedValueOnce([]); // Nothing counted (0)

    const result = await service.submitCount(
      'session-calc-01',
      { notes: 'Item missing from freezer' },
      'store-01',
      'user-01',
    );

    const item = result.varianceItems[0];
    expect(item.countedQty).toBe(0);
    expect(item.varianceQty).toBe(-10.0);
    expect(item.varianceValue).toBe(-250.0); // -10 * 25 = -250.00
    expect(item.variancePercentage).toBe(-100.0);
    expect(item.discrepancyTier).toBe('critical'); // >= $100 and >= 15%
    expect(result.netVarianceValue).toBe(-250.0);
  });

  it('5. Decimal Quantities: Should accurately calculate fractional units (e.g. kg/L)', async () => {
    (repository.findStoreItemsForCount as jest.Mock).mockResolvedValueOnce([
      {
        id: 'item-05',
        sku: 'CHE-001',
        name: 'Parmigiano Reggiano 24M',
        unit: 'kg',
        costPerUnit: 32.5,
        physicalStock: 4.85,
      },
    ]);

    (repository.findSessionCountedItems as jest.Mock).mockResolvedValueOnce([
      {
        itemId: 'item-05',
        countedQuantity: 4.6, // Shortage of 0.25 kg
      },
    ]);

    const result = await service.submitCount(
      'session-calc-01',
      { notes: 'Scale weight verification' },
      'store-01',
      'user-01',
    );

    const item = result.varianceItems[0];
    expect(item.expectedQty).toBe(4.85);
    expect(item.countedQty).toBe(4.6);
    expect(item.varianceQty).toBeCloseTo(-0.25, 4);
    expect(item.varianceValue).toBe(-8.12);
    expect(item.discrepancyTier).toBe('minor');
  });

  it('6. Severity Tier Thresholds: Should flag $100+ absolute value as critical even with low %', async () => {
    (repository.findStoreItemsForCount as jest.Mock).mockResolvedValueOnce([
      {
        id: 'item-06',
        sku: 'WIN-001',
        name: 'Vintage Bordeaux Grand Cru',
        unit: 'bottle',
        costPerUnit: 150.0,
        physicalStock: 20.0,
      },
    ]);

    (repository.findSessionCountedItems as jest.Mock).mockResolvedValueOnce([
      {
        itemId: 'item-06',
        countedQuantity: 19.0, // Loss of 1 bottle (5% variance, but $150 value)
      },
    ]);

    const result = await service.submitCount(
      'session-calc-01',
      { notes: 'Wine cellar count' },
      'store-01',
      'user-01',
    );

    const item = result.varianceItems[0];
    expect(item.variancePercentage).toBe(-5.0); // < 15%
    expect(item.varianceValue).toBe(-150.0); // >= $100
    expect(item.discrepancyTier).toBe('critical'); // Triggers critical tier due to absolute dollar impact
  });
});

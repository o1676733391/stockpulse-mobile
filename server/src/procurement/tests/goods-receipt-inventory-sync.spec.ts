import { BadRequestException } from '@nestjs/common';
import { ProcurementRepository } from '../procurement.repository';
import { ProcurementService } from '../procurement.service';

describe('Procurement - Goods Receipt & Inventory Synchronization Tests', () => {
  let service: ProcurementService;
  let repository: ProcurementRepository;

  const mockApprovedPo = {
    id: '01915dfa-b1c4-7221-9988-51b72e04e055',
    orderNumber: 'PO-20260820-0099',
    storeId: '01915dfa-9012-7000-8000-000000000002',
    supplierId: '01915dfa-b1c4-7221-9988-51b72e04e020',
    status: 'approved',
    totalAmount: 1000.0,
    items: [
      {
        id: '01915dfa-b1c4-7221-9988-51b72e04e033',
        poId: '01915dfa-b1c4-7221-9988-51b72e04e055',
        itemId: '01915dfa-b1c4-7221-9988-51b72e04e0a1',
        quantityOrdered: 100,
        unitPrice: 1.5,
        totalPrice: 150.0,
      },
      {
        id: '01915dfa-b1c4-7221-9988-51b72e04e034',
        poId: '01915dfa-b1c4-7221-9988-51b72e04e055',
        itemId: '01915dfa-b1c4-7221-9988-51b72e04e0a2',
        quantityOrdered: 20,
        unitPrice: 25.0,
        totalPrice: 500.0,
      },
    ],
  };

  beforeEach(() => {
    repository = {
      findPurchaseOrderById: jest.fn().mockResolvedValue(mockApprovedPo),
      createGoodsReceipt: jest.fn().mockResolvedValue({
        id: 'gr-01',
        receiptNumber: 'GR-20260820-0001',
        poId: '01915dfa-b1c4-7221-9988-51b72e04e055',
        storeId: '01915dfa-9012-7000-8000-000000000002',
        supplierId: '01915dfa-b1c4-7221-9988-51b72e04e020',
        deliveryNoteNumber: 'DN-9988',
        totalItemsCount: 2,
        totalQuantityReceived: 120,
        status: 'completed',
        receivedAt: new Date().toISOString(),
        receivedBy: 'actor-01',
        createdAt: new Date().toISOString(),
        items: [],
      }),
      updatePurchaseOrderStatus: jest.fn().mockResolvedValue(undefined),
    } as unknown as ProcurementRepository;

    service = new ProcurementService(repository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Goods Receipt Execution', () => {
    it('Full Receipt: Should receive complete ordered quantity and delegate to repository', async () => {
      const receiptDto = {
        poId: '01915dfa-b1c4-7221-9988-51b72e04e055',
        supplierId: '01915dfa-b1c4-7221-9988-51b72e04e020',
        invoiceNumber: 'INV-1001',
        receiptDate: '2026-08-20',
        items: [
          {
            poItemId: '01915dfa-b1c4-7221-9988-51b72e04e033',
            itemId: '01915dfa-b1c4-7221-9988-51b72e04e0a1',
            quantityReceived: 100,
            pricePerUnit: 1.5,
            unit: 'L',
            batchNumber: 'BAT-MILK-001',
            expiryDate: '2026-09-01',
          },
          {
            poItemId: '01915dfa-b1c4-7221-9988-51b72e04e034',
            itemId: '01915dfa-b1c4-7221-9988-51b72e04e0a2',
            quantityReceived: 20,
            pricePerUnit: 25.0,
            unit: 'kg',
            batchNumber: 'BAT-COF-001',
            expiryDate: '2026-12-31',
          },
        ],
      };

      const result = await service.receiveGoods(receiptDto, '01915dfa-9012-7000-8000-000000000002', 'actor-01');

      expect(result.id).toBe('gr-01');
      expect(repository.createGoodsReceipt).toHaveBeenCalledWith(
        receiptDto,
        '01915dfa-9012-7000-8000-000000000002',
        'actor-01',
      );
    });

    it('Partial Receipt: Should allow receiving partial quantity and create goods receipt', async () => {
      const receiptDto = {
        poId: '01915dfa-b1c4-7221-9988-51b72e04e055',
        supplierId: '01915dfa-b1c4-7221-9988-51b72e04e020',
        invoiceNumber: 'INV-1002',
        receiptDate: '2026-08-20',
        items: [
          {
            poItemId: '01915dfa-b1c4-7221-9988-51b72e04e033',
            itemId: '01915dfa-b1c4-7221-9988-51b72e04e0a1',
            quantityReceived: 50, // Partial 50 of 100
            pricePerUnit: 1.5,
            unit: 'L',
            batchNumber: 'BAT-MILK-002',
            expiryDate: '2026-09-01',
          },
        ],
      };

      const result = await service.receiveGoods(receiptDto, '01915dfa-9012-7000-8000-000000000002', 'actor-01');

      expect(result.id).toBe('gr-01');
      expect(repository.createGoodsReceipt).toHaveBeenCalledWith(
        receiptDto,
        '01915dfa-9012-7000-8000-000000000002',
        'actor-01',
      );
    });

    it('Bypass Protection: Should reject goods receipt against an unapproved draft PO', async () => {
      (repository.findPurchaseOrderById as jest.Mock).mockResolvedValueOnce({
        ...mockApprovedPo,
        status: 'draft', // Draft PO
      });

      const receiptDto = {
        poId: '01915dfa-b1c4-7221-9988-51b72e04e055',
        supplierId: '01915dfa-b1c4-7221-9988-51b72e04e020',
        invoiceNumber: 'INV-FAIL',
        receiptDate: '2026-08-20',
        items: [
          {
            poItemId: '01915dfa-b1c4-7221-9988-51b72e04e033',
            itemId: '01915dfa-b1c4-7221-9988-51b72e04e0a1',
            quantityReceived: 10,
            pricePerUnit: 1.5,
            unit: 'L',
            batchNumber: 'BAT-FAIL',
            expiryDate: '2026-09-01',
          },
        ],
      };

      await expect(
        service.receiveGoods(receiptDto, '01915dfa-9012-7000-8000-000000000002', 'actor-01'),
      ).rejects.toThrow(BadRequestException);
    });

    it('Bypass Protection: Should reject goods receipt against a cancelled PO', async () => {
      (repository.findPurchaseOrderById as jest.Mock).mockResolvedValueOnce({
        ...mockApprovedPo,
        status: 'cancelled',
      });

      const receiptDto = {
        poId: '01915dfa-b1c4-7221-9988-51b72e04e055',
        supplierId: '01915dfa-b1c4-7221-9988-51b72e04e020',
        invoiceNumber: 'INV-FAIL',
        receiptDate: '2026-08-20',
        items: [
          {
            poItemId: '01915dfa-b1c4-7221-9988-51b72e04e033',
            itemId: '01915dfa-b1c4-7221-9988-51b72e04e0a1',
            quantityReceived: 10,
            pricePerUnit: 1.5,
            unit: 'L',
            batchNumber: 'BAT-FAIL',
            expiryDate: '2026-09-01',
          },
        ],
      };

      await expect(
        service.receiveGoods(receiptDto, '01915dfa-9012-7000-8000-000000000002', 'actor-01'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. Transaction Atomicity & Partial Update Prevention', () => {
    it('CRITICAL: Failed goods receipt creation must abort without creating receipt', async () => {
      (repository.createGoodsReceipt as jest.Mock).mockRejectedValueOnce(
        new Error('Database transaction lock error'),
      );

      const receiptDto = {
        poId: '01915dfa-b1c4-7221-9988-51b72e04e055',
        supplierId: '01915dfa-b1c4-7221-9988-51b72e04e020',
        invoiceNumber: 'INV-ATOMIC-FAIL',
        receiptDate: '2026-08-20',
        items: [
          {
            poItemId: '01915dfa-b1c4-7221-9988-51b72e04e033',
            itemId: '01915dfa-b1c4-7221-9988-51b72e04e0a1',
            quantityReceived: 100,
            pricePerUnit: 1.5,
            unit: 'L',
            batchNumber: 'BAT-FAIL',
            expiryDate: '2026-09-01',
          },
        ],
      };

      await expect(
        service.receiveGoods(receiptDto, '01915dfa-9012-7000-8000-000000000002', 'actor-01'),
      ).rejects.toThrow('Database transaction lock error');
    });
  });
});

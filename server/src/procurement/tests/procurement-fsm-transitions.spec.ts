import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PurchaseOrderStatus } from '../entities/purchase-order.entity';
import { ProcurementRepository } from '../procurement.repository';
import { ProcurementService } from '../procurement.service';

describe('Procurement - Purchase Order State Transitions (FSM) Tests', () => {
  let service: ProcurementService;
  let repository: ProcurementRepository;
  let currentPoState: any;

  const createMockPo = (status: PurchaseOrderStatus = 'draft') => ({
    id: 'po-test-01',
    poNumber: 'PO-20260820-001',
    storeId: 'store-01',
    supplierId: 'sup-01',
    status,
    totalAmount: 500.0,
    items: [
      {
        id: 'poi-01',
        purchaseOrderId: 'po-test-01',
        itemId: 'item-01',
        orderedQuantity: 50,
        unitPrice: 10.0,
        totalPrice: 500.0,
      },
    ],
  });

  beforeEach(() => {
    currentPoState = createMockPo('draft');

    repository = {
      findPurchaseOrderById: jest.fn().mockImplementation((id: string, storeId: string) => {
        if (id === 'po-ghost') return Promise.resolve(null);
        return Promise.resolve(currentPoState);
      }),
      createPurchaseOrder: jest.fn().mockResolvedValue(createMockPo('draft')),
      updatePurchaseOrderStatus: jest.fn().mockImplementation((id: string, storeId: string, status: PurchaseOrderStatus) => {
        currentPoState = { ...currentPoState, status };
        return Promise.resolve(undefined);
      }),
      recordAudit: jest.fn().mockResolvedValue(undefined),
    } as unknown as ProcurementRepository;

    service = new ProcurementService(repository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Valid State Transitions', () => {
    it('Draft -> Submitted: Should transition draft PO to submitted state', async () => {
      currentPoState = createMockPo('draft');

      const result = await service.submitOrder('po-test-01', 'store-01', 'actor-01');

      expect(result.status).toBe('submitted');
      expect(repository.updatePurchaseOrderStatus).toHaveBeenCalledWith(
        'po-test-01',
        'store-01',
        'submitted',
        expect.objectContaining({ actorId: 'actor-01' }),
      );
    });

    it('Submitted -> Approved: Should transition submitted PO to approved state', async () => {
      currentPoState = createMockPo('submitted');

      const result = await service.approveOrder('po-test-01', 'store-01', 'mgr-01');

      expect(result.status).toBe('approved');
      expect(repository.updatePurchaseOrderStatus).toHaveBeenCalledWith(
        'po-test-01',
        'store-01',
        'approved',
        expect.objectContaining({ actorId: 'mgr-01' }),
      );
    });

    it('Draft/Submitted/Approved -> Cancelled: Should allow cancellation before receipt', async () => {
      currentPoState = createMockPo('approved');

      const result = await service.cancelOrder(
        'po-test-01',
        { reason: 'Supplier out of stock' },
        'store-01',
        'mgr-01',
      );

      expect(result.status).toBe('cancelled');
      expect(repository.updatePurchaseOrderStatus).toHaveBeenCalledWith(
        'po-test-01',
        'store-01',
        'cancelled',
        expect.objectContaining({ actorId: 'mgr-01', reason: 'Supplier out of stock' }),
      );
    });
  });

  describe('2. Invalid State Transitions & Bypass Prevention', () => {
    it('Bypass Protection: Cannot approve a draft PO directly without submitting first', async () => {
      currentPoState = createMockPo('draft');

      await expect(service.approveOrder('po-test-01', 'store-01', 'mgr-01')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('Double Submission Protection: Cannot submit an already submitted PO', async () => {
      currentPoState = createMockPo('submitted');

      await expect(service.submitOrder('po-test-01', 'store-01', 'actor-01')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('Double Approval Protection: Cannot approve an already approved PO', async () => {
      currentPoState = createMockPo('approved');

      await expect(service.approveOrder('po-test-01', 'store-01', 'mgr-01')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('Cancelled Immutability: Cannot submit or approve a cancelled PO', async () => {
      currentPoState = createMockPo('cancelled');

      await expect(service.submitOrder('po-test-01', 'store-01', 'actor-01')).rejects.toThrow(
        BadRequestException,
      );

      currentPoState = createMockPo('cancelled');

      await expect(service.approveOrder('po-test-01', 'store-01', 'mgr-01')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('Received Immutability: Cannot cancel an already received PO', async () => {
      currentPoState = createMockPo('received');

      await expect(
        service.cancelOrder('po-test-01', { reason: 'Late cancellation' }, 'store-01', 'mgr-01'),
      ).rejects.toThrow(BadRequestException);
    });

    it('Non-Existent PO: Should throw NotFoundException', async () => {
      await expect(service.submitOrder('po-ghost', 'store-01', 'actor-01')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

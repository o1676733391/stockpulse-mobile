import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CancelPurchaseOrderDto,
  CreateGoodsReceiptDto,
  CreatePurchaseOrderDto,
  GoodsReceiptDetailResponseDto,
  PurchaseOrderDetailResponseDto,
  PurchaseOrderResponseDto,
  UpdatePurchaseOrderDto,
} from './dto/procurement.dto';
import { ProcurementRepository } from './procurement.repository';
import { ProcurementService } from './procurement.service';

describe('ProcurementService (State Transitions & Workflows)', () => {
  let service: ProcurementService;
  let repository: jest.Mocked<ProcurementRepository>;

  const mockPoDetail: PurchaseOrderDetailResponseDto = {
    id: 'po-uuid-01',
    storeId: 'store-uuid-01',
    supplierId: 'sup-uuid-01',
    supplierName: 'Fresh Dairy Co',
    orderNumber: 'PO-20260820-001',
    orderDate: '2026-08-20',
    expectedDeliveryDate: '2026-08-22',
    status: 'draft',
    subtotal: 100.0,
    taxAmount: 10.0,
    totalAmount: 110.0,
    itemCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: 'poi-01',
        poId: 'po-uuid-01',
        itemId: 'item-01',
        sku: 'DAI-001',
        name: 'Whole Milk 1L',
        quantityOrdered: 50,
        quantityReceived: 0,
        unit: 'L',
        unitPrice: 2.0,
        totalPrice: 100.0,
      },
    ],
  };

  const mockGrDetail: GoodsReceiptDetailResponseDto = {
    id: 'gr-uuid-01',
    storeId: 'store-uuid-01',
    receiptNumber: 'GR-20260820-001',
    invoiceNumber: 'INV-1001',
    poId: 'po-uuid-01',
    poOrderNumber: 'PO-20260820-001',
    supplierId: 'sup-uuid-01',
    supplierName: 'Fresh Dairy Co',
    receiptDate: '2026-08-20',
    totalAmount: 110.0,
    status: 'verified',
    itemCount: 1,
    receivedBy: 'actor-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: 'gri-01',
        goodsReceiptId: 'gr-uuid-01',
        itemId: 'item-01',
        sku: 'DAI-001',
        name: 'Whole Milk 1L',
        quantityReceived: 50,
        unit: 'L',
        pricePerUnit: 2.0,
        totalPrice: 100.0,
        batchNumber: 'LOT-20260820',
        expiryDate: '2026-09-15',
      },
    ],
  };

  beforeEach(async () => {
    const mockRepo = {
      findPurchaseOrders: jest.fn().mockResolvedValue({
        data: [mockPoDetail],
        meta: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }),
      findPurchaseOrderById: jest.fn().mockResolvedValue(mockPoDetail),
      createPurchaseOrder: jest.fn().mockResolvedValue(mockPoDetail),
      updatePurchaseOrder: jest.fn().mockResolvedValue(mockPoDetail),
      updatePurchaseOrderStatus: jest.fn().mockResolvedValue(undefined),
      findGoodsReceipts: jest.fn().mockResolvedValue({
        data: [mockGrDetail],
        meta: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }),
      findGoodsReceiptById: jest.fn().mockResolvedValue(mockGrDetail),
      createGoodsReceipt: jest.fn().mockResolvedValue(mockGrDetail),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcurementService,
        {
          provide: ProcurementRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<ProcurementService>(ProcurementService);
    repository = module.get(ProcurementRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPurchaseOrder', () => {
    it('should create PO in draft status', async () => {
      const dto: CreatePurchaseOrderDto = {
        supplierId: 'sup-uuid-01',
        orderDate: '2026-08-20',
        items: [
          {
            itemId: 'item-01',
            quantityOrdered: 50,
            unit: 'L',
            unitPrice: 2.0,
          },
        ],
      };

      const result = await service.createPurchaseOrder(dto, 'store-uuid-01', 'actor-01');

      expect(repository.createPurchaseOrder).toHaveBeenCalledWith(dto, 'store-uuid-01', 'actor-01');
      expect(result.status).toBe('draft');
    });

    it('should throw BadRequestException if items array is empty', async () => {
      const dto: CreatePurchaseOrderDto = {
        supplierId: 'sup-uuid-01',
        orderDate: '2026-08-20',
        items: [],
      };

      await expect(service.createPurchaseOrder(dto, 'store-uuid-01', 'actor-01')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('State Transition: Draft -> Submitted', () => {
    it('should transition from draft to submitted', async () => {
      repository.findPurchaseOrderById
        .mockResolvedValueOnce({ ...mockPoDetail, status: 'draft' })
        .mockResolvedValueOnce({ ...mockPoDetail, status: 'submitted' });

      const result = await service.submitOrder('po-uuid-01', 'store-uuid-01', 'actor-01');

      expect(repository.updatePurchaseOrderStatus).toHaveBeenCalledWith(
        'po-uuid-01',
        'store-uuid-01',
        'submitted',
        { actorId: 'actor-01' },
      );
      expect(result.status).toBe('submitted');
    });

    it('should throw BadRequestException when submitting an already submitted or approved PO', async () => {
      repository.findPurchaseOrderById.mockResolvedValueOnce({
        ...mockPoDetail,
        status: 'approved',
      });

      await expect(
        service.submitOrder('po-uuid-01', 'store-uuid-01', 'actor-01'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('State Transition: Submitted -> Approved', () => {
    it('should transition from submitted to approved', async () => {
      repository.findPurchaseOrderById
        .mockResolvedValueOnce({ ...mockPoDetail, status: 'submitted' })
        .mockResolvedValueOnce({ ...mockPoDetail, status: 'approved' });

      const result = await service.approveOrder('po-uuid-01', 'store-uuid-01', 'manager-01');

      expect(repository.updatePurchaseOrderStatus).toHaveBeenCalledWith(
        'po-uuid-01',
        'store-uuid-01',
        'approved',
        { actorId: 'manager-01' },
      );
      expect(result.status).toBe('approved');
    });

    it('should throw BadRequestException when approving a PO still in draft', async () => {
      repository.findPurchaseOrderById.mockResolvedValueOnce({
        ...mockPoDetail,
        status: 'draft',
      });

      await expect(
        service.approveOrder('po-uuid-01', 'store-uuid-01', 'manager-01'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('State Transition: Approved -> Received (via Goods Receipt)', () => {
    it('should allow goods receipt creation when PO is approved', async () => {
      repository.findPurchaseOrderById.mockResolvedValueOnce({
        ...mockPoDetail,
        status: 'approved',
      });

      const dto: CreateGoodsReceiptDto = {
        poId: 'po-uuid-01',
        supplierId: 'sup-uuid-01',
        invoiceNumber: 'INV-1001',
        receiptDate: '2026-08-20',
        items: [
          {
            itemId: 'item-01',
            quantityReceived: 50,
            unit: 'L',
            pricePerUnit: 2.0,
            batchNumber: 'LOT-20260820',
            expiryDate: '2026-09-15',
          },
        ],
      };

      const result = await service.receiveGoods(dto, 'store-uuid-01', 'actor-01');

      expect(repository.createGoodsReceipt).toHaveBeenCalledWith(dto, 'store-uuid-01', 'actor-01');
      expect(result.status).toBe('verified');
    });

    it('should throw BadRequestException if receiving goods against unapproved draft PO', async () => {
      repository.findPurchaseOrderById.mockResolvedValueOnce({
        ...mockPoDetail,
        status: 'draft',
      });

      const dto: CreateGoodsReceiptDto = {
        poId: 'po-uuid-01',
        supplierId: 'sup-uuid-01',
        invoiceNumber: 'INV-1001',
        receiptDate: '2026-08-20',
        items: [
          {
            itemId: 'item-01',
            quantityReceived: 50,
            unit: 'L',
            pricePerUnit: 2.0,
            batchNumber: 'LOT-20260820',
            expiryDate: '2026-09-15',
          },
        ],
      };

      await expect(service.receiveGoods(dto, 'store-uuid-01', 'actor-01')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('State Transition: Draft / Submitted / Approved -> Cancelled', () => {
    it('should allow cancelling a draft PO', async () => {
      repository.findPurchaseOrderById
        .mockResolvedValueOnce({ ...mockPoDetail, status: 'draft' })
        .mockResolvedValueOnce({ ...mockPoDetail, status: 'cancelled' });

      const dto: CancelPurchaseOrderDto = { reason: 'Duplicate order' };
      const result = await service.cancelOrder('po-uuid-01', dto, 'store-uuid-01', 'actor-01');

      expect(repository.updatePurchaseOrderStatus).toHaveBeenCalledWith(
        'po-uuid-01',
        'store-uuid-01',
        'cancelled',
        { actorId: 'actor-01', reason: 'Duplicate order' },
      );
      expect(result.status).toBe('cancelled');
    });

    it('should throw BadRequestException when trying to cancel an already received PO', async () => {
      repository.findPurchaseOrderById.mockResolvedValueOnce({
        ...mockPoDetail,
        status: 'received',
      });

      const dto: CancelPurchaseOrderDto = { reason: 'Too late' };
      await expect(
        service.cancelOrder('po-uuid-01', dto, 'store-uuid-01', 'actor-01'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when cancelling an already cancelled PO', async () => {
      repository.findPurchaseOrderById.mockResolvedValueOnce({
        ...mockPoDetail,
        status: 'cancelled',
      });

      const dto: CancelPurchaseOrderDto = { reason: 'Already cancelled' };
      await expect(
        service.cancelOrder('po-uuid-01', dto, 'store-uuid-01', 'actor-01'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

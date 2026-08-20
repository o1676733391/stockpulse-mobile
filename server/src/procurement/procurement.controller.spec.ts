import { Test, TestingModule } from '@nestjs/testing';
import {
  CancelPurchaseOrderDto,
  CreateGoodsReceiptDto,
  CreatePurchaseOrderDto,
  GoodsReceiptDetailResponseDto,
  PurchaseOrderDetailResponseDto,
  PurchaseOrderResponseDto,
} from './dto/procurement.dto';
import { ProcurementController } from './procurement.controller';
import { ProcurementService } from './procurement.service';

describe('ProcurementController', () => {
  let controller: ProcurementController;
  let service: jest.Mocked<ProcurementService>;

  const mockPoDetail: PurchaseOrderDetailResponseDto = {
    id: 'po-01',
    storeId: 'store-01',
    supplierId: 'sup-01',
    supplierName: 'Dairy Supplier',
    orderNumber: 'PO-01',
    orderDate: '2026-08-20',
    status: 'draft',
    subtotal: 100,
    taxAmount: 10,
    totalAmount: 110,
    itemCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [],
  };

  const mockGrDetail: GoodsReceiptDetailResponseDto = {
    id: 'gr-01',
    storeId: 'store-01',
    receiptNumber: 'GR-01',
    invoiceNumber: 'INV-01',
    supplierId: 'sup-01',
    receiptDate: '2026-08-20',
    totalAmount: 110,
    status: 'verified',
    itemCount: 1,
    receivedBy: 'user-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [],
  };

  beforeEach(async () => {
    const mockService = {
      createPurchaseOrder: jest.fn().mockResolvedValue(mockPoDetail),
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
      updatePurchaseOrder: jest.fn().mockResolvedValue(mockPoDetail),
      submitOrder: jest.fn().mockResolvedValue({ ...mockPoDetail, status: 'submitted' }),
      approveOrder: jest.fn().mockResolvedValue({ ...mockPoDetail, status: 'approved' }),
      cancelOrder: jest.fn().mockResolvedValue({ ...mockPoDetail, status: 'cancelled' }),
      receiveGoods: jest.fn().mockResolvedValue(mockGrDetail),
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
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProcurementController],
      providers: [
        {
          provide: ProcurementService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ProcurementController>(ProcurementController);
    service = module.get(ProcurementService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPurchaseOrder', () => {
    it('should create draft purchase order', async () => {
      const dto: CreatePurchaseOrderDto = {
        supplierId: 'sup-01',
        orderDate: '2026-08-20',
        items: [{ itemId: 'item-01', quantityOrdered: 10, unit: 'kg', unitPrice: 5 }],
      };

      const result = await controller.createPurchaseOrder(dto, 'store-01', 'actor-01');

      expect(service.createPurchaseOrder).toHaveBeenCalledWith(dto, 'store-01', 'actor-01');
      expect(result.id).toBe('po-01');
    });
  });

  describe('submitOrder', () => {
    it('should submit PO', async () => {
      const result = await controller.submitOrder('po-01', 'store-01', 'actor-01');

      expect(service.submitOrder).toHaveBeenCalledWith('po-01', 'store-01', 'actor-01');
      expect(result.status).toBe('submitted');
    });
  });

  describe('approveOrder', () => {
    it('should approve PO', async () => {
      const result = await controller.approveOrder('po-01', 'store-01', 'actor-01');

      expect(service.approveOrder).toHaveBeenCalledWith('po-01', 'store-01', 'actor-01');
      expect(result.status).toBe('approved');
    });
  });

  describe('cancelOrder', () => {
    it('should cancel PO', async () => {
      const dto: CancelPurchaseOrderDto = { reason: 'Out of budget' };
      const result = await controller.cancelOrder('po-01', dto, 'store-01', 'actor-01');

      expect(service.cancelOrder).toHaveBeenCalledWith('po-01', dto, 'store-01', 'actor-01');
      expect(result.status).toBe('cancelled');
    });
  });

  describe('receiveGoods', () => {
    it('should record Goods Receipt', async () => {
      const dto: CreateGoodsReceiptDto = {
        supplierId: 'sup-01',
        invoiceNumber: 'INV-10',
        receiptDate: '2026-08-20',
        items: [
          {
            itemId: 'item-01',
            quantityReceived: 10,
            unit: 'kg',
            pricePerUnit: 5,
            batchNumber: 'LOT-1',
            expiryDate: '2026-09-01',
          },
        ],
      };

      const result = await controller.receiveGoods(dto, 'store-01', 'actor-01');

      expect(service.receiveGoods).toHaveBeenCalledWith(dto, 'store-01', 'actor-01');
      expect(result.id).toBe('gr-01');
    });
  });
});

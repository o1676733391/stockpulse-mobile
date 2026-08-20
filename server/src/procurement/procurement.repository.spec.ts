import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from '../database/supabase.service';
import {
  CreateGoodsReceiptDto,
  CreatePurchaseOrderDto,
  QueryPurchaseOrdersDto,
} from './dto/procurement.dto';
import { ProcurementRepository } from './procurement.repository';

describe('ProcurementRepository', () => {
  let repository: ProcurementRepository;
  let supabaseService: jest.Mocked<SupabaseService>;

  const mockSupabaseClient = {
    from: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcurementRepository,
        {
          provide: SupabaseService,
          useValue: {
            getAdminClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
      ],
    }).compile();

    repository = module.get<ProcurementRepository>(ProcurementRepository);
    supabaseService = module.get(SupabaseService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findPurchaseOrders', () => {
    it('should query Supabase with store filter and pagination', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValueOnce({
          data: [
            {
              id: 'po-01',
              store_id: 'store-01',
              supplier_id: 'sup-01',
              order_number: 'PO-01',
              order_date: '2026-08-20',
              status: 'draft',
              subtotal: 100,
              tax_amount: 10,
              total_amount: 110,
              suppliers: { name: 'Dairy Co' },
            },
          ],
          count: 1,
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(mockChain as any);

      const query: QueryPurchaseOrdersDto = { page: 1, limit: 10 };
      const result = await repository.findPurchaseOrders(query, 'store-01');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('purchase_orders');
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('createPurchaseOrder', () => {
    it('should insert purchase order header and line items', async () => {
      const headerInsertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: {
            id: 'po-01',
            store_id: 'store-01',
            supplier_id: 'sup-01',
            order_number: 'PO-01',
            order_date: '2026-08-20',
            status: 'draft',
            subtotal: 50,
            tax_amount: 5,
            total_amount: 55,
          },
          error: null,
        }),
      };

      const lineInsertChain = {
        insert: jest.fn().mockResolvedValueOnce({ error: null }),
      };

      // For findPurchaseOrderById called inside createPurchaseOrder
      const poFindChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: {
            id: 'po-01',
            store_id: 'store-01',
            supplier_id: 'sup-01',
            order_number: 'PO-01',
            order_date: '2026-08-20',
            status: 'draft',
            subtotal: 50,
            tax_amount: 5,
            total_amount: 55,
            suppliers: { name: 'Supplier' },
          },
          error: null,
        }),
      };

      const itemsFindChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValueOnce({
          data: [
            {
              id: 'poi-01',
              purchase_order_id: 'po-01',
              item_id: 'item-01',
              quantity_ordered: 10,
              unit: 'L',
              unit_price: 5,
              total_price: 50,
              inventory_items: { sku: 'DAI-01', name: 'Milk' },
            },
          ],
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(headerInsertChain as any)
        .mockReturnValueOnce(lineInsertChain as any)
        .mockReturnValueOnce(poFindChain as any)
        .mockReturnValueOnce(itemsFindChain as any);

      const dto: CreatePurchaseOrderDto = {
        supplierId: 'sup-01',
        orderDate: '2026-08-20',
        items: [{ itemId: 'item-01', quantityOrdered: 10, unit: 'L', unitPrice: 5 }],
      };

      const result = await repository.createPurchaseOrder(dto, 'store-01', 'actor-01');

      expect(result.id).toBe('po-01');
      expect(result.status).toBe('draft');
      expect(result.items).toHaveLength(1);
    });
  });
});

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditRepository } from './audit.repository';
import { AuditService } from './audit.service';
import { AuditLogResponseDto, CreateAuditLogDto } from './dto/audit.dto';

describe('AuditService (Domain Tracking & Immutability)', () => {
  let service: AuditService;
  let repository: jest.Mocked<AuditRepository>;

  const mockAuditRecord: AuditLogResponseDto = {
    id: 'aud-01',
    organizationId: 'org-01',
    storeId: 'store-01',
    eventNumber: 'AUD-20260820-0001',
    actorId: 'user-01',
    actorName: 'Mario Batali',
    actorRole: 'manager',
    eventAction: 'USER_LOGIN',
    entityType: 'auth',
    entityId: 'user-01',
    entityIdentifier: 'Mario Batali',
    prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
    currentHash: '9b1deb4d3b7d4bad9bdd2b0d7b3dcb6d88a1b2c3d4e5f60718293a4b5c6d7e8f',
    createdAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn().mockImplementation((data: CreateAuditLogDto) =>
        Promise.resolve({
          ...mockAuditRecord,
          ...data,
          id: 'aud-created-01',
          createdAt: new Date().toISOString(),
        }),
      ),
      findById: jest.fn().mockResolvedValue(mockAuditRecord),
      searchAuditLogs: jest.fn().mockResolvedValue({
        data: [mockAuditRecord],
        meta: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }),
      verifyChainIntegrity: jest.fn().mockResolvedValue({
        isValid: true,
        totalRecordsVerified: 1,
        message: 'Chain valid',
        verifiedAt: new Date().toISOString(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: AuditRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    repository = module.get(AuditRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('trackLogin', () => {
    it('should track user login audit event', async () => {
      const result = await service.trackLogin({
        actorId: 'user-01',
        actorName: 'Mario Batali',
        actorRole: 'manager',
        storeId: 'store-01',
        organizationId: 'org-01',
        ipAddress: '192.168.1.1',
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventAction: 'USER_LOGIN',
          entityType: 'auth',
          actorId: 'user-01',
        }),
      );
      expect(result.eventAction).toBe('USER_LOGIN');
    });
  });

  describe('trackInventoryUpdate', () => {
    it('should track inventory adjustments and item updates', async () => {
      const result = await service.trackInventoryUpdate({
        actorId: 'user-01',
        actorName: 'Mario Batali',
        actorRole: 'manager',
        storeId: 'store-01',
        organizationId: 'org-01',
        action: 'INVENTORY_ADJUST',
        itemId: 'item-01',
        sku: 'DAI-001',
        stateDiff: { delta: -5 },
        reasonCode: 'SPOILAGE',
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventAction: 'INVENTORY_ADJUST',
          entityType: 'inventory_item',
          entityId: 'item-01',
          entityIdentifier: 'DAI-001',
        }),
      );
      expect(result.eventAction).toBe('INVENTORY_ADJUST');
    });
  });

  describe('trackStockCount', () => {
    it('should track stock count submission and variance approval', async () => {
      const result = await service.trackStockCount({
        actorId: 'user-01',
        actorName: 'Mario Batali',
        actorRole: 'manager',
        storeId: 'store-01',
        organizationId: 'org-01',
        action: 'STOCK_COUNT_APPROVE',
        sessionId: 'session-01',
        sessionNumber: 'SC-20260820-0001',
        details: { totalVarianceValue: -12.5 },
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventAction: 'STOCK_COUNT_APPROVE',
          entityType: 'stock_count',
          entityId: 'session-01',
        }),
      );
      expect(result.eventAction).toBe('STOCK_COUNT_APPROVE');
    });
  });

  describe('trackOcrApproval', () => {
    it('should track OCR document confirmation & BOM ingredient deductions', async () => {
      const result = await service.trackOcrApproval({
        actorId: 'user-01',
        actorName: 'Mario Batali',
        actorRole: 'manager',
        storeId: 'store-01',
        organizationId: 'org-01',
        action: 'OCR_CONFIRM',
        documentId: 'ocr-doc-01',
        fileName: 'pos_z_report.jpg',
        details: { itemsDeducted: 12 },
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventAction: 'OCR_CONFIRM',
          entityType: 'ocr_document',
          entityId: 'ocr-doc-01',
        }),
      );
      expect(result.eventAction).toBe('OCR_CONFIRM');
    });
  });

  describe('trackPurchaseOrder', () => {
    it('should track Purchase Order state transition events', async () => {
      const result = await service.trackPurchaseOrder({
        actorId: 'user-01',
        actorName: 'Mario Batali',
        actorRole: 'manager',
        storeId: 'store-01',
        organizationId: 'org-01',
        action: 'PO_APPROVE',
        poId: 'po-01',
        orderNumber: 'PO-20260820-001',
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventAction: 'PO_APPROVE',
          entityType: 'purchase_order',
          entityId: 'po-01',
        }),
      );
      expect(result.eventAction).toBe('PO_APPROVE');
    });
  });

  describe('trackGoodsReceipt', () => {
    it('should track Goods Receipt arrivals and FEFO batch creations', async () => {
      const result = await service.trackGoodsReceipt({
        actorId: 'user-01',
        actorName: 'Mario Batali',
        actorRole: 'manager',
        storeId: 'store-01',
        organizationId: 'org-01',
        grId: 'gr-01',
        receiptNumber: 'GR-20260820-001',
        poId: 'po-01',
        totalAmount: 165.0,
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventAction: 'GOODS_RECEIPT_CREATE',
          entityType: 'goods_receipt',
          entityId: 'gr-01',
        }),
      );
      expect(result.eventAction).toBe('GOODS_RECEIPT_CREATE');
    });
  });

  describe('verifyChainIntegrity', () => {
    it('should verify cryptographic chain integrity', async () => {
      const result = await service.verifyChainIntegrity('store-01');
      expect(result.isValid).toBe(true);
      expect(repository.verifyChainIntegrity).toHaveBeenCalledWith('store-01');
    });
  });
});

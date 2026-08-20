import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditLogResponseDto, CreateAuditLogDto } from './dto/audit.dto';

describe('AuditController', () => {
  let controller: AuditController;
  let service: jest.Mocked<AuditService>;

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
    prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
    currentHash: '9b1deb4d3b7d4bad9bdd2b0d7b3dcb6d88a1b2c3d4e5f60718293a4b5c6d7e8f',
    createdAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    const mockService = {
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
      findById: jest.fn().mockResolvedValue(mockAuditRecord),
      verifyChainIntegrity: jest.fn().mockResolvedValue({
        isValid: true,
        totalRecordsVerified: 1,
        message: 'Chain valid',
        verifiedAt: new Date().toISOString(),
      }),
      logEvent: jest.fn().mockResolvedValue(mockAuditRecord),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    service = module.get(AuditService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      const result = await controller.searchAuditLogs({ page: 1, limit: 50 }, 'store-01');
      expect(service.searchAuditLogs).toHaveBeenCalledWith('store-01', { page: 1, limit: 50 });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return audit record detail', async () => {
      const result = await controller.findById('aud-01', 'store-01');
      expect(service.findById).toHaveBeenCalledWith('aud-01', 'store-01');
      expect(result.id).toBe('aud-01');
    });
  });

  describe('verifyChainIntegrity', () => {
    it('should return chain verification result', async () => {
      const result = await controller.verifyChainIntegrity('store-01');
      expect(service.verifyChainIntegrity).toHaveBeenCalledWith('store-01');
      expect(result.isValid).toBe(true);
    });
  });

  describe('logEvent', () => {
    it('should log audit event', async () => {
      const dto: CreateAuditLogDto = {
        organizationId: 'org-01',
        storeId: 'store-01',
        actorId: 'user-01',
        eventAction: 'USER_LOGIN',
        entityType: 'auth',
        entityId: 'user-01',
      };
      const result = await controller.logEvent(dto);
      expect(service.logEvent).toHaveBeenCalledWith(dto);
      expect(result.id).toBe('aud-01');
    });
  });
});

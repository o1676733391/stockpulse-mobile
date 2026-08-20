import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from '../database/supabase.service';
import { AuditRepository } from './audit.repository';
import { CreateAuditLogDto, AuditQueryDto } from './dto/audit.dto';

describe('AuditRepository (Immutability & Cryptographic Hash Chaining)', () => {
  let repository: AuditRepository;
  let supabaseService: jest.Mocked<SupabaseService>;

  const mockSupabaseClient = {
    from: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditRepository,
        {
          provide: SupabaseService,
          useValue: {
            getAdminClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
      ],
    }).compile();

    repository = module.get<AuditRepository>(AuditRepository);
    supabaseService = module.get(SupabaseService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('Immutability (WORM enforcement)', () => {
    it('should throw ForbiddenException on update attempt', async () => {
      await expect(repository.update()).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException on delete attempt', async () => {
      await expect(repository.delete()).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create (Append-only write & Hash Chaining)', () => {
    it('should calculate SHA-256 hash and append record', async () => {
      // Mock getLatestHash query
      const latestHashChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: { current_hash: '0000000000000000000000000000000000000000000000000000000000000000' },
          error: null,
        }),
      };

      // Mock insert query
      const insertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: {
            id: 'aud-01',
            organization_id: 'org-01',
            store_id: 'store-01',
            event_number: 'AUD-20260820-0001',
            event_action: 'USER_LOGIN',
            entity_type: 'auth',
            entity_id: 'user-01',
            prev_hash: '0000000000000000000000000000000000000000000000000000000000000000',
            current_hash: 'mock-sha256-hash',
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(latestHashChain as any)
        .mockReturnValueOnce(insertChain as any);

      const dto: CreateAuditLogDto = {
        organizationId: 'org-01',
        storeId: 'store-01',
        actorId: 'user-01',
        actorName: 'Mario Batali',
        eventAction: 'USER_LOGIN',
        entityType: 'auth',
        entityId: 'user-01',
      };

      const result = await repository.create(dto);

      expect(result.id).toBe('aud-01');
      expect(result.currentHash).toBeDefined();
    });
  });

  describe('searchAuditLogs', () => {
    it('should search audit logs with store filter and pagination', async () => {
      const searchChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValueOnce({
          data: [
            {
              id: 'aud-01',
              organization_id: 'org-01',
              store_id: 'store-01',
              event_number: 'AUD-01',
              event_action: 'USER_LOGIN',
              entity_type: 'auth',
              entity_id: 'user-01',
              created_at: new Date().toISOString(),
            },
          ],
          count: 1,
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(searchChain as any);

      const query: AuditQueryDto = { page: 1, limit: 10 };
      const result = await repository.searchAuditLogs('store-01', query);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });
});

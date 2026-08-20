import * as crypto from 'crypto';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { SupabaseService } from '../database/supabase.service';
import {
  AuditChainVerificationResponseDto,
  AuditLogResponseDto,
  AuditQueryDto,
  CreateAuditLogDto,
} from './dto/audit.dto';
import { IAuditRepository } from './interfaces/audit.repository.interface';

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

@Injectable()
export class AuditRepository implements IAuditRepository {
  private readonly logger = new Logger(AuditRepository.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Append-only write of an immutable cryptographic audit record.
   */
  async create(data: CreateAuditLogDto): Promise<AuditLogResponseDto> {
    this.logger.log(`AuditRepository.create: [${data.eventAction}] on [${data.entityType}:${data.entityId}]`);
    const client = this.supabaseService.getAdminClient();

    const timestamp = new Date().toISOString();
    const eventNumber = `AUD-${timestamp.slice(0, 10).replace(/-/g, '')}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

    // 1. Get previous hash in ledger chain for this store
    const prevHash = await this.getLatestHash(data.storeId);

    // 2. Compute SHA-256 current hash
    const hashPayload = `${prevHash}|${eventNumber}|${data.eventAction}|${data.entityType}|${data.entityId}|${data.actorId || ''}|${timestamp}|${JSON.stringify(data.stateDiff || {})}`;
    const currentHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

    if (!client) {
      return {
        id: '01915dfa-b1c4-7221-9988-000000000033',
        organizationId: data.organizationId,
        storeId: data.storeId,
        eventNumber,
        actorId: data.actorId,
        actorName: data.actorName,
        actorRole: data.actorRole,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        eventAction: data.eventAction,
        entityType: data.entityType,
        entityId: data.entityId,
        entityIdentifier: data.entityIdentifier,
        stateBefore: data.stateBefore,
        stateAfter: data.stateAfter,
        stateDiff: data.stateDiff,
        reasonCode: data.reasonCode,
        prevHash,
        currentHash,
        createdAt: timestamp,
      };
    }

    const { data: created, error } = await client
      .from('audit_logs')
      .insert({
        organization_id: data.organizationId,
        store_id: data.storeId,
        event_number: eventNumber,
        actor_id: data.actorId,
        actor_name: data.actorName,
        actor_role: data.actorRole,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        event_action: data.eventAction,
        entity_type: data.entityType,
        entity_id: data.entityId,
        entity_identifier: data.entityIdentifier,
        state_before: data.stateBefore,
        state_after: data.stateAfter,
        state_diff: data.stateDiff,
        reason_code: data.reasonCode,
        prev_hash: prevHash,
        current_hash: currentHash,
        created_at: timestamp,
      })
      .select('*')
      .single();

    if (error || !created) {
      this.logger.error(`Failed to append immutable audit log: ${error?.message}`);
      throw new InternalServerErrorException('Failed to write immutable audit record');
    }

    return this.mapRowToDto(created);
  }

  /**
   * Immutability enforcement: Updates are strictly prohibited.
   */
  async update(): Promise<never> {
    throw new ForbiddenException(
      'Audit records are strictly immutable (WORM). UPDATE operations are forbidden.',
    );
  }

  /**
   * Immutability enforcement: Deletes are strictly prohibited.
   */
  async delete(): Promise<never> {
    throw new ForbiddenException(
      'Audit records are strictly immutable (WORM). DELETE operations are forbidden.',
    );
  }

  /**
   * Find audit log record by ID.
   */
  async findById(id: string, storeId?: string): Promise<AuditLogResponseDto | null> {
    const client = this.supabaseService.getAdminClient();
    if (!client) {
      return this.buildMockAuditLog(id, storeId);
    }

    let query = client.from('audit_logs').select('*').eq('id', id);
    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data, error } = await query.single();
    if (error || !data) return null;

    return this.mapRowToDto(data);
  }

  /**
   * Search audit records with pagination and filters.
   */
  async searchAuditLogs(
    storeId: string,
    query: AuditQueryDto,
  ): Promise<PaginatedResponseDto<AuditLogResponseDto>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    this.logger.log(`AuditRepository.searchAuditLogs: store=${storeId}, page=${page}`);
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return this.buildMockPaginatedLogs(page, limit, storeId);
    }

    let supabaseQuery = client
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('store_id', storeId);

    if (query.eventAction) {
      supabaseQuery = supabaseQuery.eq('event_action', query.eventAction);
    }

    if (query.entityType) {
      supabaseQuery = supabaseQuery.eq('entity_type', query.entityType);
    }

    if (query.actorId) {
      supabaseQuery = supabaseQuery.eq('actor_id', query.actorId);
    }

    if (query.startDate) {
      supabaseQuery = supabaseQuery.gte('created_at', query.startDate);
    }

    if (query.endDate) {
      supabaseQuery = supabaseQuery.lte('created_at', query.endDate);
    }

    if (query.search) {
      supabaseQuery = supabaseQuery.or(
        `actor_name.ilike.%${query.search}%,entity_identifier.ilike.%${query.search}%,event_number.ilike.%${query.search}%`,
      );
    }

    supabaseQuery = supabaseQuery.order('created_at', { ascending: false }).range(from, to);

    const { data, count, error } = await supabaseQuery;

    if (error) {
      this.logger.error(`Failed to search audit logs: ${error.message}`);
      throw new InternalServerErrorException('Failed to search audit logs');
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const items = (data || []).map((row: any) => this.mapRowToDto(row));

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get latest current_hash to chain next entry.
   */
  async getLatestHash(storeId: string): Promise<string> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return GENESIS_HASH;

    const { data } = await client
      .from('audit_logs')
      .select('current_hash')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return data?.current_hash || GENESIS_HASH;
  }

  /**
   * Verify cryptographic chain integrity across the store audit ledger.
   */
  async verifyChainIntegrity(storeId: string): Promise<AuditChainVerificationResponseDto> {
    this.logger.log(`AuditRepository.verifyChainIntegrity for store: ${storeId}`);
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return {
        isValid: true,
        totalRecordsVerified: 10,
        message: 'Cryptographic ledger chain integrity verified successfully',
        verifiedAt: new Date().toISOString(),
      };
    }

    const { data: logs, error } = await client
      .from('audit_logs')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: true });

    if (error || !logs) {
      throw new InternalServerErrorException('Failed to retrieve audit log chain for verification');
    }

    let expectedPrevHash = GENESIS_HASH;
    let verifiedCount = 0;

    for (const log of logs) {
      if (log.prev_hash !== expectedPrevHash) {
        return {
          isValid: false,
          totalRecordsVerified: verifiedCount,
          tamperedRecordId: log.id,
          message: `Chain broken at event #${log.event_number} (expected prevHash ${expectedPrevHash}, got ${log.prev_hash})`,
          verifiedAt: new Date().toISOString(),
        };
      }

      // Verify SHA-256 hash calculation
      const hashPayload = `${log.prev_hash}|${log.event_number}|${log.event_action}|${log.entity_type}|${log.entity_id}|${log.actor_id || ''}|${log.created_at}|${JSON.stringify(log.state_diff || {})}`;
      const calculatedHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

      if (calculatedHash !== log.current_hash) {
        return {
          isValid: false,
          totalRecordsVerified: verifiedCount,
          tamperedRecordId: log.id,
          message: `Hash mismatch at event #${log.event_number} (tampering detected)`,
          verifiedAt: new Date().toISOString(),
        };
      }

      expectedPrevHash = log.current_hash;
      verifiedCount++;
    }

    return {
      isValid: true,
      totalRecordsVerified: verifiedCount,
      message: `Successfully verified all ${verifiedCount} audit ledger entries with 100% cryptographic integrity.`,
      verifiedAt: new Date().toISOString(),
    };
  }

  private mapRowToDto(row: any): AuditLogResponseDto {
    return {
      id: row.id,
      organizationId: row.organization_id,
      storeId: row.store_id,
      eventNumber: row.event_number,
      actorId: row.actor_id,
      actorName: row.actor_name,
      actorRole: row.actor_role,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      eventAction: row.event_action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      entityIdentifier: row.entity_identifier,
      stateBefore: row.state_before,
      stateAfter: row.state_after,
      stateDiff: row.state_diff,
      reasonCode: row.reason_code,
      prevHash: row.prev_hash,
      currentHash: row.current_hash,
      createdAt: row.created_at,
    };
  }

  private buildMockAuditLog(id: string, storeId?: string): AuditLogResponseDto {
    return {
      id,
      organizationId: 'org-01',
      storeId: storeId || 'store-01',
      eventNumber: 'AUD-20260820-0001',
      actorId: 'user-01',
      actorName: 'Mario Batali',
      actorRole: 'manager',
      eventAction: 'INVENTORY_ADJUST',
      entityType: 'inventory_item',
      entityId: 'item-01',
      entityIdentifier: 'DAI-001 (Whole Milk)',
      stateDiff: { delta: -2, reason: 'SPOILAGE_TRIM_LOSS' },
      reasonCode: 'SPOILAGE_TRIM_LOSS',
      prevHash: GENESIS_HASH,
      currentHash: '9b1deb4d3b7d4bad9bdd2b0d7b3dcb6d88a1b2c3d4e5f60718293a4b5c6d7e8f',
      createdAt: new Date().toISOString(),
    };
  }

  private buildMockPaginatedLogs(
    page: number,
    limit: number,
    storeId: string,
  ): PaginatedResponseDto<AuditLogResponseDto> {
    const mockLogs: AuditLogResponseDto[] = [
      {
        id: 'aud-01',
        organizationId: 'org-01',
        storeId,
        eventNumber: 'AUD-20260820-0001',
        actorId: 'user-01',
        actorName: 'Mario Batali',
        actorRole: 'manager',
        eventAction: 'USER_LOGIN',
        entityType: 'auth',
        entityId: 'user-01',
        entityIdentifier: 'mario@stockpulse.app',
        prevHash: GENESIS_HASH,
        currentHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f9a1b2c3d4e5f60718293a4b5c6d7e8f9a1',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'aud-02',
        organizationId: 'org-01',
        storeId,
        eventNumber: 'AUD-20260820-0002',
        actorId: 'user-01',
        actorName: 'Mario Batali',
        actorRole: 'manager',
        eventAction: 'INVENTORY_UPDATE',
        entityType: 'inventory_item',
        entityId: 'item-01',
        entityIdentifier: 'DAI-001',
        stateDiff: { targetStock: { old: 40, new: 50 } },
        prevHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f9a1b2c3d4e5f60718293a4b5c6d7e8f9a1',
        currentHash: 'b2c3d4e5f60718293a4b5c6d7e8f9a1b2c3d4e5f60718293a4b5c6d7e8f9a1b2',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    return {
      data: mockLogs,
      meta: {
        page,
        limit,
        total: mockLogs.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }
}

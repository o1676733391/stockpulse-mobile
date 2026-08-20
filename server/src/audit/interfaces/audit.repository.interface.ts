import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import {
  AuditChainVerificationResponseDto,
  AuditLogResponseDto,
  AuditQueryDto,
  CreateAuditLogDto,
} from '../dto/audit.dto';

export interface IAuditRepository {
  create(data: CreateAuditLogDto): Promise<AuditLogResponseDto>;

  findById(id: string, storeId?: string): Promise<AuditLogResponseDto | null>;

  searchAuditLogs(
    storeId: string,
    query: AuditQueryDto,
  ): Promise<PaginatedResponseDto<AuditLogResponseDto>>;

  getLatestHash(storeId: string): Promise<string>;

  verifyChainIntegrity(storeId: string): Promise<AuditChainVerificationResponseDto>;
}

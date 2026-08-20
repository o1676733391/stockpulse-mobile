import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { CurrentStore } from '../common/decorators/current-store.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import {
  AuditChainVerificationResponseDto,
  AuditLogResponseDto,
  AuditQueryDto,
  CreateAuditLogDto,
} from './dto/audit.dto';
import { AuditService } from './audit.service';

@ApiTags('Audit')
@ApiBearerAuth('BearerAuth')
@ApiHeader({
  name: 'X-Store-Id',
  description: 'Active store tenant UUID context',
  required: true,
})
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @Roles('superadmin', 'manager', 'auditor')
  @RequirePermissions('audit:view')
  @ApiOperation({ summary: 'Search immutable audit logs with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Paginated audit records',
    type: PaginatedResponseDto,
  })
  async searchAuditLogs(
    @Query() query: AuditQueryDto,
    @CurrentStore() storeId: string,
  ): Promise<PaginatedResponseDto<AuditLogResponseDto>> {
    return this.auditService.searchAuditLogs(storeId, query);
  }

  @Get('logs/:id')
  @Roles('superadmin', 'manager', 'auditor')
  @RequirePermissions('audit:view')
  @ApiOperation({ summary: 'Get single audit record detail with state before/after diff' })
  @ApiParam({ name: 'id', description: 'Audit record UUID' })
  @ApiResponse({
    status: 200,
    description: 'Audit log record details',
    type: AuditLogResponseDto,
  })
  async findById(
    @Param('id') id: string,
    @CurrentStore() storeId: string,
  ): Promise<AuditLogResponseDto> {
    return this.auditService.findById(id, storeId);
  }

  @Get('verify-chain')
  @Roles('superadmin', 'manager', 'auditor')
  @RequirePermissions('audit:view')
  @ApiOperation({ summary: 'Verify cryptographic SHA-256 hash chain integrity of store audit ledger' })
  @ApiResponse({
    status: 200,
    description: 'Audit chain verification report',
    type: AuditChainVerificationResponseDto,
  })
  async verifyChainIntegrity(
    @CurrentStore() storeId: string,
  ): Promise<AuditChainVerificationResponseDto> {
    return this.auditService.verifyChainIntegrity(storeId);
  }

  @Post('logs')
  @Roles('superadmin', 'manager')
  @RequirePermissions('audit:view')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Append an immutable audit event (internal / system use)' })
  @ApiResponse({
    status: 201,
    description: 'Audit record appended to immutable ledger',
    type: AuditLogResponseDto,
  })
  async logEvent(
    @Body() dto: CreateAuditLogDto,
  ): Promise<AuditLogResponseDto> {
    return this.auditService.logEvent(dto);
  }
}

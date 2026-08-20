import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import {
  ApproveVarianceResponseDto,
  BulkRecordCountItemsDto,
  QueryCountHistoryDto,
  RecordCountItemDto,
  StartStockCountSessionDto,
  StockCountDetailResponseDto,
  StockCountItemResponseDto,
  StockCountSessionResponseDto,
  SubmitCountSessionDto,
  VarianceReviewResponseDto,
} from './dto/stock-count.dto';
import { StockCountService } from './stock-count.service';

@ApiTags('Stock Counts')
@ApiBearerAuth('BearerAuth')
@ApiHeader({
  name: 'X-Store-Id',
  description: 'Active store tenant UUID context',
  required: true,
})
@Controller('stock-counts')
export class StockCountController {
  constructor(private readonly stockCountService: StockCountService) {}

  @Post('sessions')
  @Roles('superadmin', 'manager', 'supervisor', 'staff')
  @RequirePermissions('stock_count:conduct')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Instantiate a new stocktaking audit session' })
  @ApiResponse({
    status: 201,
    description: 'Stock count session started',
    type: StockCountSessionResponseDto,
  })
  async startSession(
    @Body() dto: StartStockCountSessionDto,
    @CurrentStore() storeId: string,
    @CurrentUser('id') actorId: string,
  ): Promise<StockCountSessionResponseDto> {
    return this.stockCountService.startSession(dto, storeId, actorId);
  }

  @Put('sessions/:sessionId/items/:itemId')
  @Roles('superadmin', 'manager', 'supervisor', 'staff')
  @RequirePermissions('stock_count:conduct')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record counted quantity for SKU in active session' })
  @ApiParam({ name: 'sessionId', description: 'Stock count session UUID' })
  @ApiParam({ name: 'itemId', description: 'Inventory item UUID' })
  @ApiResponse({
    status: 200,
    description: 'Counted quantity recorded',
    type: StockCountItemResponseDto,
  })
  async recordItemCount(
    @Param('sessionId') sessionId: string,
    @Param('itemId') itemId: string,
    @Body() dto: RecordCountItemDto,
    @CurrentStore() storeId: string,
  ): Promise<StockCountItemResponseDto> {
    dto.itemId = itemId;
    return this.stockCountService.recordItemCount(sessionId, dto, storeId);
  }

  @Post('sessions/:sessionId/items')
  @Roles('superadmin', 'manager', 'supervisor', 'staff')
  @RequirePermissions('stock_count:conduct')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk record multiple counted SKUs' })
  @ApiParam({ name: 'sessionId', description: 'Stock count session UUID' })
  async bulkRecordItemCounts(
    @Param('sessionId') sessionId: string,
    @Body() dto: BulkRecordCountItemsDto,
    @CurrentStore() storeId: string,
  ): Promise<{ success: boolean; recordedCount: number }> {
    return this.stockCountService.bulkRecordItemCounts(sessionId, dto, storeId);
  }

  @Post('sessions/:sessionId/submit')
  @Roles('superadmin', 'manager', 'supervisor')
  @RequirePermissions('stock_count:conduct')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit count session and trigger algorithmic variance calculation',
  })
  @ApiParam({ name: 'sessionId', description: 'Stock count session UUID' })
  @ApiResponse({
    status: 200,
    description: 'Count submitted and variance calculated',
    type: VarianceReviewResponseDto,
  })
  async submitCount(
    @Param('sessionId') sessionId: string,
    @Body() dto: SubmitCountSessionDto,
    @CurrentStore() storeId: string,
    @CurrentUser('id') actorId: string,
  ): Promise<VarianceReviewResponseDto> {
    return this.stockCountService.submitCount(sessionId, dto, storeId, actorId);
  }

  @Get('sessions/:sessionId/variance')
  @Roles('superadmin', 'manager', 'supervisor', 'auditor')
  @RequirePermissions('stock_count:conduct')
  @ApiOperation({ summary: 'Get variance breakdown for count session' })
  @ApiParam({ name: 'sessionId', description: 'Stock count session UUID' })
  @ApiResponse({
    status: 200,
    description: 'Variance analysis and shrinkage breakdown',
    type: VarianceReviewResponseDto,
  })
  async getVarianceSummary(
    @Param('sessionId') sessionId: string,
    @CurrentStore() storeId: string,
  ): Promise<VarianceReviewResponseDto> {
    return this.stockCountService.getVarianceSummary(sessionId, storeId);
  }

  @Post('sessions/:sessionId/variance/approve')
  @Roles('superadmin', 'manager')
  @RequirePermissions('stock_count:approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve variance and synchronize physical stock ledger',
  })
  @ApiParam({ name: 'sessionId', description: 'Stock count session UUID' })
  @ApiResponse({
    status: 200,
    description: 'Variance approved and physical stocks synchronized',
    type: ApproveVarianceResponseDto,
  })
  async approveVariance(
    @Param('sessionId') sessionId: string,
    @CurrentStore() storeId: string,
    @CurrentUser('id') actorId: string,
  ): Promise<ApproveVarianceResponseDto> {
    return this.stockCountService.approveVariance(sessionId, storeId, actorId);
  }

  @Get('history')
  @Roles('superadmin', 'manager', 'supervisor', 'auditor')
  @RequirePermissions('stock_count:conduct')
  @ApiOperation({ summary: 'List historical stocktaking sessions with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Paginated stock count history',
    type: PaginatedResponseDto,
  })
  async findHistory(
    @Query() query: QueryCountHistoryDto,
    @CurrentStore() storeId: string,
  ): Promise<PaginatedResponseDto<StockCountSessionResponseDto>> {
    return this.stockCountService.findHistory(query, storeId);
  }

  @Get('sessions/:sessionId')
  @Roles('superadmin', 'manager', 'supervisor', 'staff', 'auditor')
  @RequirePermissions('stock_count:conduct')
  @ApiOperation({ summary: 'Get detailed stock count session by ID' })
  @ApiParam({ name: 'sessionId', description: 'Stock count session UUID' })
  @ApiResponse({
    status: 200,
    description: 'Stock count session details',
    type: StockCountDetailResponseDto,
  })
  async findSessionById(
    @Param('sessionId') sessionId: string,
    @CurrentStore() storeId: string,
  ): Promise<StockCountDetailResponseDto> {
    return this.stockCountService.findSessionById(sessionId, storeId);
  }
}

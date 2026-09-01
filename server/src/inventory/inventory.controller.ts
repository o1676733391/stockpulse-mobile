import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import {
  ArchiveItemResponseDto,
  CreateInventoryItemDto,
  CreateStockAdjustmentDto,
  InventoryItemDetailResponseDto,
  InventoryItemResponseDto,
  QueryInventoryDto,
  StockAdjustmentResponseDto,
  UpdateInventoryItemDto,
} from './dto/inventory.dto';
import { InventoryService } from './inventory.service';

@ApiTags('Inventory')
@ApiBearerAuth('BearerAuth')
@ApiHeader({
  name: 'X-Store-Id',
  description: 'Active store tenant UUID context',
  required: true,
})
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @RequirePermissions('inventory:view')
  @ApiOperation({
    summary: 'List paginated inventory items with filters and search',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of inventory items',
    type: PaginatedResponseDto,
  })
  async findPaginated(
    @Query() query: QueryInventoryDto,
    @CurrentStore() storeId: string,
    @CurrentUser('organizationId') organizationId?: string,
  ): Promise<PaginatedResponseDto<InventoryItemResponseDto>> {
    return this.inventoryService.findPaginated(query, storeId, organizationId);
  }

  @Get('expiring-batches')
  @RequirePermissions('inventory:view')
  @ApiOperation({ summary: 'List active batches nearing expiration threshold' })
  async getExpiringBatches(@CurrentStore() storeId: string) {
    return this.inventoryService.getExpiringBatches(storeId);
  }

  @Get('expired-batches')
  @RequirePermissions('inventory:view')
  @ApiOperation({ summary: 'List expired inventory batches' })
  async getExpiredBatches(@CurrentStore() storeId: string) {
    return this.inventoryService.getExpiredBatches(storeId);
  }

  @Get(':id')
  @RequirePermissions('inventory:view')
  @ApiOperation({
    summary: 'Get comprehensive inventory item details including FEFO batches',
  })
  @ApiParam({ name: 'id', description: 'Inventory item UUID' })
  @ApiResponse({
    status: 200,
    description: 'Inventory item details',
    type: InventoryItemDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  async findById(
    @Param('id') id: string,
    @CurrentStore() storeId: string,
  ): Promise<InventoryItemDetailResponseDto> {
    return this.inventoryService.findById(id, storeId);
  }

  @Post()
  @Roles('superadmin', 'manager')
  @RequirePermissions('inventory:manage_skus')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new inventory SKU definition in the store' })
  @ApiResponse({
    status: 201,
    description: 'Inventory item created successfully',
    type: InventoryItemResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'SKU code already exists in store' })
  async create(
    @Body() dto: CreateInventoryItemDto,
    @CurrentStore() storeId: string,
    @CurrentUser('id') actorId: string,
  ): Promise<InventoryItemResponseDto> {
    return this.inventoryService.create(dto, storeId, actorId);
  }

  @Patch(':id')
  @Roles('superadmin', 'manager')
  @RequirePermissions('inventory:manage_skus')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update existing inventory item master attributes with optimistic locking',
  })
  @ApiParam({ name: 'id', description: 'Inventory item UUID' })
  @ApiResponse({
    status: 200,
    description: 'Inventory item updated successfully',
    type: InventoryItemResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  @ApiResponse({ status: 409, description: 'Optimistic locking conflict' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryItemDto,
    @CurrentStore() storeId: string,
    @CurrentUser('id') actorId: string,
  ): Promise<InventoryItemResponseDto> {
    return this.inventoryService.update(id, dto, storeId, actorId);
  }

  @Delete(':id')
  @Roles('superadmin', 'manager')
  @RequirePermissions('inventory:manage_skus')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive (soft-delete) an inventory SKU' })
  @ApiParam({ name: 'id', description: 'Inventory item UUID' })
  @ApiResponse({
    status: 200,
    description: 'Inventory item archived successfully',
    type: ArchiveItemResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  async archive(
    @Param('id') id: string,
    @CurrentStore() storeId: string,
    @CurrentUser('id') actorId: string,
  ): Promise<ArchiveItemResponseDto> {
    return this.inventoryService.archive(id, storeId, actorId);
  }

  @Post(':id/adjustments')
  @Roles('superadmin', 'manager', 'supervisor')
  @RequirePermissions('inventory:adjust')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Execute manual stock adjustment with ledger sync' })
  @ApiParam({ name: 'id', description: 'Inventory item UUID' })
  @ApiResponse({
    status: 201,
    description: 'Stock adjustment applied and recorded in ledger',
    type: StockAdjustmentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Adjustment would result in negative balance',
  })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  async adjustStock(
    @Param('id') id: string,
    @Body() dto: CreateStockAdjustmentDto,
    @CurrentStore() storeId: string,
    @CurrentUser('id') actorId: string,
  ): Promise<StockAdjustmentResponseDto> {
    return this.inventoryService.adjustStock(id, dto, storeId, actorId);
  }
}

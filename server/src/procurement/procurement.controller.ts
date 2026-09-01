import {
  Body,
  Controller,
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
  CancelPurchaseOrderDto,
  CreateGoodsReceiptDto,
  CreatePurchaseOrderDto,
  GoodsReceiptDetailResponseDto,
  GoodsReceiptResponseDto,
  PurchaseOrderDetailResponseDto,
  PurchaseOrderResponseDto,
  QueryGoodsReceiptsDto,
  QueryPurchaseOrdersDto,
  UpdatePurchaseOrderDto,
} from './dto/procurement.dto';
import { ProcurementService } from './procurement.service';

@ApiTags('Procurement')
@ApiBearerAuth('BearerAuth')
@ApiHeader({
  name: 'X-Store-Id',
  description: 'Active store tenant UUID context',
  required: true,
})
@Controller('procurement')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Post('purchase-orders')
  @Roles('superadmin', 'manager', 'supervisor')
  @RequirePermissions('procurement:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Draft a new Purchase Order for supplier' })
  @ApiResponse({
    status: 201,
    description: 'Purchase order created in draft state',
    type: PurchaseOrderDetailResponseDto,
  })
  async createPurchaseOrder(
    @Body() dto: CreatePurchaseOrderDto,
    @CurrentStore() storeId: string,
    @CurrentUser('id') actorId: string,
  ): Promise<PurchaseOrderDetailResponseDto> {
    return this.procurementService.createPurchaseOrder(dto, storeId, actorId);
  }

  @Get('poq-recommendations')
  @Roles('superadmin', 'manager', 'supervisor', 'staff')
  @RequirePermissions('procurement:view')
  @ApiOperation({ summary: 'Get POQ order recommendations grouped by supplier' })
  async getPOQRecommendations(@CurrentStore() storeId: string) {
    return this.procurementService.getPOQRecommendations(storeId);
  }

  @Get('purchase-orders')
  @Roles('superadmin', 'manager', 'supervisor', 'staff', 'auditor')
  @RequirePermissions('procurement:view')
  @ApiOperation({ summary: 'List paginated Purchase Orders with status filters' })
  @ApiResponse({
    status: 200,
    description: 'Paginated purchase orders list',
    type: PaginatedResponseDto,
  })
  async findPurchaseOrders(
    @Query() query: QueryPurchaseOrdersDto,
    @CurrentStore() storeId: string,
  ): Promise<PaginatedResponseDto<PurchaseOrderResponseDto>> {
    return this.procurementService.findPurchaseOrders(query, storeId);
  }

  @Get('purchase-orders/:id')
  @Roles('superadmin', 'manager', 'supervisor', 'staff', 'auditor')
  @RequirePermissions('procurement:view')
  @ApiOperation({ summary: 'Get Purchase Order detail with line items' })
  @ApiParam({ name: 'id', description: 'Purchase order UUID' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order details',
    type: PurchaseOrderDetailResponseDto,
  })
  async findPurchaseOrderById(
    @Param('id') id: string,
    @CurrentStore() storeId: string,
  ): Promise<PurchaseOrderDetailResponseDto> {
    return this.procurementService.findPurchaseOrderById(id, storeId);
  }

  @Patch('purchase-orders/:id')
  @Roles('superadmin', 'manager', 'supervisor')
  @RequirePermissions('procurement:create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update Purchase Order draft metadata or line items' })
  @ApiParam({ name: 'id', description: 'Purchase order UUID' })
  async updatePurchaseOrder(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderDto,
    @CurrentStore() storeId: string,
    @CurrentUser('id') actorId: string,
  ): Promise<PurchaseOrderDetailResponseDto> {
    return this.procurementService.updatePurchaseOrder(id, dto, storeId, actorId);
  }

  @Post('purchase-orders/:id/submit')
  @Roles('superadmin', 'manager', 'supervisor')
  @RequirePermissions('procurement:create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transition PO state: draft -> submitted' })
  @ApiParam({ name: 'id', description: 'Purchase order UUID' })
  async submitOrder(
    @Param('id') id: string,
    @CurrentStore() storeId: string,
    @CurrentUser('id') actorId: string,
  ): Promise<PurchaseOrderDetailResponseDto> {
    return this.procurementService.submitOrder(id, storeId, actorId);
  }

  @Post('purchase-orders/:id/approve')
  @Roles('superadmin', 'manager')
  @RequirePermissions('procurement:approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transition PO state: submitted -> approved' })
  @ApiParam({ name: 'id', description: 'Purchase order UUID' })
  async approveOrder(
    @Param('id') id: string,
    @CurrentStore() storeId: string,
    @CurrentUser('id') actorId: string,
  ): Promise<PurchaseOrderDetailResponseDto> {
    return this.procurementService.approveOrder(id, storeId, actorId);
  }

  @Post('purchase-orders/:id/cancel')
  @Roles('superadmin', 'manager', 'supervisor')
  @RequirePermissions('procurement:create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transition PO state: draft/submitted/approved -> cancelled' })
  @ApiParam({ name: 'id', description: 'Purchase order UUID' })
  async cancelOrder(
    @Param('id') id: string,
    @Body() dto: CancelPurchaseOrderDto,
    @CurrentStore() storeId: string,
    @CurrentUser('id') actorId: string,
  ): Promise<PurchaseOrderDetailResponseDto> {
    return this.procurementService.cancelOrder(id, dto, storeId, actorId);
  }

  @Post('goods-receipts')
  @Roles('superadmin', 'manager', 'supervisor', 'staff')
  @RequirePermissions('procurement:receive')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Receive supplier delivery, update inventory stocks, and add batches' })
  @ApiResponse({
    status: 201,
    description: 'Goods receipt created and stock synchronized',
    type: GoodsReceiptDetailResponseDto,
  })
  async receiveGoods(
    @Body() dto: CreateGoodsReceiptDto,
    @CurrentStore() storeId: string,
    @CurrentUser('id') actorId: string,
  ): Promise<GoodsReceiptDetailResponseDto> {
    return this.procurementService.receiveGoods(dto, storeId, actorId);
  }

  @Get('goods-receipts')
  @Roles('superadmin', 'manager', 'supervisor', 'staff', 'auditor')
  @RequirePermissions('procurement:view')
  @ApiOperation({ summary: 'List paginated Goods Receipts history' })
  @ApiResponse({
    status: 200,
    description: 'Paginated goods receipts list',
    type: PaginatedResponseDto,
  })
  async findGoodsReceipts(
    @Query() query: QueryGoodsReceiptsDto,
    @CurrentStore() storeId: string,
  ): Promise<PaginatedResponseDto<GoodsReceiptResponseDto>> {
    return this.procurementService.findGoodsReceipts(query, storeId);
  }

  @Get('goods-receipts/:id')
  @Roles('superadmin', 'manager', 'supervisor', 'staff', 'auditor')
  @RequirePermissions('procurement:view')
  @ApiOperation({ summary: 'Get Goods Receipt details with batch numbers and line items' })
  @ApiParam({ name: 'id', description: 'Goods receipt UUID' })
  @ApiResponse({
    status: 200,
    description: 'Goods receipt details',
    type: GoodsReceiptDetailResponseDto,
  })
  async findGoodsReceiptById(
    @Param('id') id: string,
    @CurrentStore() storeId: string,
  ): Promise<GoodsReceiptDetailResponseDto> {
    return this.procurementService.findGoodsReceiptById(id, storeId);
  }
}

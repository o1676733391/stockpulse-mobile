import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
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
import { PurchaseOrderStatus } from './entities/purchase-order.entity';
import { ProcurementRepository } from './procurement.repository';

@Injectable()
export class ProcurementService {
  private readonly logger = new Logger(ProcurementService.name);

  constructor(private readonly procurementRepository: ProcurementRepository) {}

  /**
   * List Purchase Orders with pagination and filters.
   */
  async findPurchaseOrders(
    query: QueryPurchaseOrdersDto,
    storeId: string,
  ): Promise<PaginatedResponseDto<PurchaseOrderResponseDto>> {
    return this.procurementRepository.findPurchaseOrders(query, storeId);
  }

  /**
   * Get single Purchase Order details with line items.
   */
  async findPurchaseOrderById(
    id: string,
    storeId: string,
  ): Promise<PurchaseOrderDetailResponseDto> {
    const po = await this.procurementRepository.findPurchaseOrderById(id, storeId);
    if (!po) {
      throw new NotFoundException(`Purchase Order '${id}' not found in store '${storeId}'`);
    }
    return po;
  }

  /**
   * Create a new Purchase Order in 'draft' status.
   */
  async createPurchaseOrder(
    dto: CreatePurchaseOrderDto,
    storeId: string,
    actorId: string,
  ): Promise<PurchaseOrderDetailResponseDto> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Purchase order must contain at least one line item');
    }
    return this.procurementRepository.createPurchaseOrder(dto, storeId, actorId);
  }

  /**
   * Update Purchase Order (only allowed while in 'draft' status).
   */
  async updatePurchaseOrder(
    id: string,
    dto: UpdatePurchaseOrderDto,
    storeId: string,
    actorId: string,
  ): Promise<PurchaseOrderDetailResponseDto> {
    const po = await this.findPurchaseOrderById(id, storeId);
    if (po.status !== 'draft') {
      throw new BadRequestException(
        `Cannot update purchase order in '${po.status}' status (edits only permitted in 'draft')`,
      );
    }
    return this.procurementRepository.updatePurchaseOrder(id, dto, storeId, actorId);
  }

  /**
   * State Transition: 'draft' -> 'submitted'
   */
  async submitOrder(
    id: string,
    storeId: string,
    actorId: string,
  ): Promise<PurchaseOrderDetailResponseDto> {
    this.logger.log(`ProcurementService.submitOrder: PO=${id} by actor=${actorId}`);

    const po = await this.findPurchaseOrderById(id, storeId);
    if (po.status !== 'draft') {
      throw new BadRequestException(
        `Invalid state transition: Cannot submit purchase order from status '${po.status}' (expected 'draft')`,
      );
    }

    await this.procurementRepository.updatePurchaseOrderStatus(id, storeId, 'submitted', {
      actorId,
    });

    return this.findPurchaseOrderById(id, storeId);
  }

  /**
   * State Transition: 'submitted' -> 'approved'
   */
  async approveOrder(
    id: string,
    storeId: string,
    actorId: string,
  ): Promise<PurchaseOrderDetailResponseDto> {
    this.logger.log(`ProcurementService.approveOrder: PO=${id} by approver=${actorId}`);

    const po = await this.findPurchaseOrderById(id, storeId);
    if (po.status !== 'submitted') {
      throw new BadRequestException(
        `Invalid state transition: Cannot approve purchase order from status '${po.status}' (expected 'submitted')`,
      );
    }

    await this.procurementRepository.updatePurchaseOrderStatus(id, storeId, 'approved', {
      actorId,
    });

    return this.findPurchaseOrderById(id, storeId);
  }

  /**
   * State Transition: 'draft' | 'submitted' | 'approved' -> 'cancelled'
   */
  async cancelOrder(
    id: string,
    dto: CancelPurchaseOrderDto,
    storeId: string,
    actorId: string,
  ): Promise<PurchaseOrderDetailResponseDto> {
    this.logger.log(`ProcurementService.cancelOrder: PO=${id}, reason=${dto.reason}`);

    const po = await this.findPurchaseOrderById(id, storeId);
    if (po.status === 'received' || po.status === 'partially_received') {
      throw new BadRequestException(
        `Invalid state transition: Cannot cancel purchase order with status '${po.status}'`,
      );
    }

    if (po.status === 'cancelled') {
      throw new BadRequestException('Purchase order is already cancelled');
    }

    await this.procurementRepository.updatePurchaseOrderStatus(id, storeId, 'cancelled', {
      actorId,
      reason: dto.reason,
    });

    return this.findPurchaseOrderById(id, storeId);
  }

  /**
   * List Goods Receipts with pagination.
   */
  async findGoodsReceipts(
    query: QueryGoodsReceiptsDto,
    storeId: string,
  ): Promise<PaginatedResponseDto<GoodsReceiptResponseDto>> {
    return this.procurementRepository.findGoodsReceipts(query, storeId);
  }

  /**
   * Get single Goods Receipt detail.
   */
  async findGoodsReceiptById(
    id: string,
    storeId: string,
  ): Promise<GoodsReceiptDetailResponseDto> {
    const gr = await this.procurementRepository.findGoodsReceiptById(id, storeId);
    if (!gr) {
      throw new NotFoundException(`Goods Receipt '${id}' not found in store '${storeId}'`);
    }
    return gr;
  }

  /**
   * Create Goods Receipt, enforce approved PO state constraint, update stocks, and record ledger.
   */
  async receiveGoods(
    dto: CreateGoodsReceiptDto,
    storeId: string,
    actorId: string,
  ): Promise<GoodsReceiptDetailResponseDto> {
    this.logger.log(`ProcurementService.receiveGoods: store=${storeId}, PO=${dto.poId}`);

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Goods receipt must contain at least one received item');
    }

    // If linked to PO, validate that PO is in 'approved' status
    if (dto.poId) {
      const po = await this.findPurchaseOrderById(dto.poId, storeId);
      if (po.status !== 'approved' && po.status !== 'partially_received' && po.status !== 'sent' && po.status !== 'confirmed') {
        throw new BadRequestException(
          `Invalid state transition: Cannot receive goods for purchase order with status '${po.status}' (PO must be 'approved')`,
        );
      }
    }

    return this.procurementRepository.createGoodsReceipt(dto, storeId, actorId);
  }
}

import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import {
  CreateGoodsReceiptDto,
  CreatePurchaseOrderDto,
  GoodsReceiptDetailResponseDto,
  GoodsReceiptResponseDto,
  PurchaseOrderDetailResponseDto,
  PurchaseOrderResponseDto,
  QueryGoodsReceiptsDto,
  QueryPurchaseOrdersDto,
  UpdatePurchaseOrderDto,
} from '../dto/procurement.dto';
import { PurchaseOrderStatus } from '../entities/purchase-order.entity';

export interface IProcurementRepository {
  // Purchase Orders
  findPurchaseOrders(
    query: QueryPurchaseOrdersDto,
    storeId: string,
  ): Promise<PaginatedResponseDto<PurchaseOrderResponseDto>>;

  findPurchaseOrderById(
    id: string,
    storeId: string,
  ): Promise<PurchaseOrderDetailResponseDto | null>;

  createPurchaseOrder(
    dto: CreatePurchaseOrderDto,
    storeId: string,
    actorId: string,
  ): Promise<PurchaseOrderDetailResponseDto>;

  updatePurchaseOrder(
    id: string,
    dto: UpdatePurchaseOrderDto,
    storeId: string,
    actorId: string,
  ): Promise<PurchaseOrderDetailResponseDto>;

  updatePurchaseOrderStatus(
    id: string,
    storeId: string,
    status: PurchaseOrderStatus,
    auditData?: {
      actorId: string;
      reason?: string;
    },
  ): Promise<void>;

  // Goods Receipts
  findGoodsReceipts(
    query: QueryGoodsReceiptsDto,
    storeId: string,
  ): Promise<PaginatedResponseDto<GoodsReceiptResponseDto>>;

  findGoodsReceiptById(
    id: string,
    storeId: string,
  ): Promise<GoodsReceiptDetailResponseDto | null>;

  createGoodsReceipt(
    dto: CreateGoodsReceiptDto,
    storeId: string,
    actorId: string,
  ): Promise<GoodsReceiptDetailResponseDto>;
}

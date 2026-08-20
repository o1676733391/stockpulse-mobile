import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import {
  ArchiveItemResponseDto,
  CreateInventoryItemDto,
  CreateStockAdjustmentDto,
  InventoryItemDetailResponseDto,
  InventoryItemResponseDto,
  QueryInventoryDto,
  StockAdjustmentResponseDto,
  UpdateInventoryItemDto,
} from '../dto/inventory.dto';

export interface IInventoryRepository {
  findPaginated(
    query: QueryInventoryDto,
    storeId: string,
    organizationId?: string,
  ): Promise<PaginatedResponseDto<InventoryItemResponseDto>>;

  findById(
    id: string,
    storeId: string,
  ): Promise<InventoryItemDetailResponseDto | null>;

  findBySku(
    sku: string,
    storeId: string,
  ): Promise<InventoryItemResponseDto | null>;

  create(
    data: CreateInventoryItemDto,
    storeId: string,
    actorId?: string,
  ): Promise<InventoryItemResponseDto>;

  update(
    id: string,
    data: UpdateInventoryItemDto,
    storeId: string,
    actorId?: string,
  ): Promise<InventoryItemResponseDto>;

  archive(
    id: string,
    storeId: string,
    actorId?: string,
  ): Promise<ArchiveItemResponseDto>;

  adjustStock(
    itemId: string,
    dto: CreateStockAdjustmentDto,
    storeId: string,
    actorId: string,
  ): Promise<StockAdjustmentResponseDto>;
}

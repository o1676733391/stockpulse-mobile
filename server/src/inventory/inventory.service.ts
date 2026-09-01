import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
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
import { InventoryRepository } from './inventory.repository';

@Injectable()
export class InventoryService {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  /**
   * List inventory items with pagination, filtering, and tenant store isolation.
   */
  async findPaginated(
    query: QueryInventoryDto,
    storeId: string,
    organizationId?: string,
  ): Promise<PaginatedResponseDto<InventoryItemResponseDto>> {
    return this.inventoryRepository.findPaginated(query, storeId, organizationId);
  }

  /**
   * Get single inventory item details including FEFO batches and transaction history.
   */
  async findById(
    id: string,
    storeId: string,
  ): Promise<InventoryItemDetailResponseDto> {
    const item = await this.inventoryRepository.findById(id, storeId);
    if (!item) {
      throw new NotFoundException(`Inventory item with ID '${id}' not found in store '${storeId}'`);
    }
    return item;
  }

  /**
   * Create a new inventory SKU definition in the store.
   */
  async create(
    dto: CreateInventoryItemDto,
    storeId: string,
    actorId?: string,
  ): Promise<InventoryItemResponseDto> {
    return this.inventoryRepository.create(dto, storeId, actorId);
  }

  /**
   * Update an existing SKU's master attributes with optimistic locking.
   */
  async update(
    id: string,
    dto: UpdateInventoryItemDto,
    storeId: string,
    actorId?: string,
  ): Promise<InventoryItemResponseDto> {
    return this.inventoryRepository.update(id, dto, storeId, actorId);
  }

  /**
   * Soft-delete (archive) an inventory item.
   */
  async archive(
    id: string,
    storeId: string,
    actorId?: string,
  ): Promise<ArchiveItemResponseDto> {
    return this.inventoryRepository.archive(id, storeId, actorId);
  }

  /**
   * Execute manual stock adjustments with immediate transaction ledger sync.
   */
  async adjustStock(
    itemId: string,
    dto: CreateStockAdjustmentDto,
    storeId: string,
    actorId: string,
  ): Promise<StockAdjustmentResponseDto> {
    return this.inventoryRepository.adjustStock(itemId, dto, storeId, actorId);
  }

  async getExpiringBatches(storeId: string) {
    return this.inventoryRepository.getExpiringBatches(storeId);
  }

  async getExpiredBatches(storeId: string) {
    return this.inventoryRepository.getExpiredBatches(storeId);
  }
}

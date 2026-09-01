import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { SupabaseService } from '../database/supabase.service';
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
import { StockStatus, UnitOfMeasure } from './entities/inventory-item.entity';
import { IInventoryRepository } from './interfaces/inventory.repository.interface';

@Injectable()
export class InventoryRepository implements IInventoryRepository {
  private readonly logger = new Logger(InventoryRepository.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * List inventory items with pagination, category/status filters, and search.
   */
  async findPaginated(
    query: QueryInventoryDto,
    storeId: string,
    organizationId?: string,
  ): Promise<PaginatedResponseDto<InventoryItemResponseDto>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    this.logger.log(
      `InventoryRepository.findPaginated: store=${storeId}, page=${page}, limit=${limit}`,
    );

    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return this.buildMockPaginatedResponse(page, limit, storeId);
    }

    let supabaseQuery = client
      .from('inventory_items')
      .select(
        `
        id,
        store_id,
        sku,
        name,
        category_id,
        unit,
        physical_stock,
        theoretical_stock,
        target_stock,
        safety_stock,
        cost_per_unit,
        status,
        barcode,
        storage_area,
        shelf_life_days,
        version,
        created_at,
        updated_at,
        deleted_at,
        categories (
          id,
          name
        )
      `,
        { count: 'exact' },
      )
      .eq('store_id', storeId);

    if (!query.includeArchived) {
      supabaseQuery = supabaseQuery.is('deleted_at', null);
    }

    if (query.categoryId) {
      supabaseQuery = supabaseQuery.eq('category_id', query.categoryId);
    }

    if (query.status) {
      supabaseQuery = supabaseQuery.eq('status', query.status);
    }

    if (query.storageArea) {
      supabaseQuery = supabaseQuery.eq('storage_area', query.storageArea);
    }

    if (query.search) {
      supabaseQuery = supabaseQuery.or(
        `name.ilike.%${query.search}%,sku.ilike.%${query.search}%`,
      );
    }

    const sortField = query.sortBy === 'name' ? 'name' : query.sortBy === 'sku' ? 'sku' : 'created_at';
    const isAscending = query.sortOrder?.toUpperCase() === 'ASC';

    supabaseQuery = supabaseQuery
      .order(sortField, { ascending: isAscending })
      .range(from, to);

    const { data: rows, count, error } = await supabaseQuery;

    if (error) {
      this.logger.error(`Failed to list inventory: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve inventory list');
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: (rows || []).map((row: any) => this.mapRowToResponseDto(row)),
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
   * Find single inventory item by ID with full details, FEFO batches, and recent transactions.
   */
  async findById(
    id: string,
    storeId: string,
  ): Promise<InventoryItemDetailResponseDto | null> {
    this.logger.log(`InventoryRepository.findById: ${id} in store: ${storeId}`);
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return this.buildMockDetailResponse(id, storeId);
    }

    const { data: item, error: itemError } = await client
      .from('inventory_items')
      .select(
        `
        id,
        store_id,
        sku,
        name,
        category_id,
        unit,
        physical_stock,
        theoretical_stock,
        target_stock,
        safety_stock,
        cost_per_unit,
        status,
        barcode,
        storage_area,
        shelf_life_days,
        version,
        created_at,
        updated_at,
        deleted_at,
        categories (
          id,
          name
        )
      `,
      )
      .eq('id', id)
      .eq('store_id', storeId)
      .single();

    if (itemError || !item) {
      return null;
    }

    // Fetch active FEFO batches for this item
    const { data: batches } = await client
      .from('inventory_batches')
      .select(
        `
        id,
        batch_number,
        quantity,
        cost_per_unit,
        expiry_date,
        received_date,
        status
      `,
      )
      .eq('item_id', id)
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('expiry_date', { ascending: true })
      .limit(10);

    // Fetch recent transaction ledger entries
    const { data: transactions } = await client
      .from('inventory_transactions')
      .select(
        `
        id,
        transaction_number,
        transaction_type,
        delta,
        previous_stock,
        new_stock,
        cost_impact,
        actor_name,
        reference_type,
        note,
        created_at
      `,
      )
      .eq('item_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    const baseDto = this.mapRowToResponseDto(item);

    return {
      ...baseDto,
      batches: (batches || []).map((b: any) => ({
        id: b.id,
        batchNumber: b.batch_number,
        quantity: Number(b.quantity),
        costPerUnit: Number(b.cost_per_unit),
        expiryDate: b.expiry_date,
        receivedDate: b.received_date,
        status: b.status,
      })),
      recentTransactions: (transactions || []).map((t: any) => ({
        id: t.id,
        transactionNumber: t.transaction_number,
        transactionType: t.transaction_type,
        delta: Number(t.delta),
        previousStock: Number(t.previous_stock),
        newStock: Number(t.new_stock),
        costImpact: Number(t.cost_impact),
        actorName: t.actor_name,
        referenceType: t.reference_type,
        note: t.note,
        createdAt: t.created_at,
      })),
    };
  }

  /**
   * Find item by unique SKU in store.
   */
  async findBySku(
    sku: string,
    storeId: string,
  ): Promise<InventoryItemResponseDto | null> {
    const client = this.supabaseService.getAdminClient();

    if (!client) return null;

    const { data } = await client
      .from('inventory_items')
      .select('*')
      .eq('sku', sku.trim().toUpperCase())
      .eq('store_id', storeId)
      .is('deleted_at', null)
      .single();

    return data ? this.mapRowToResponseDto(data) : null;
  }

  /**
   * Create new SKU definition with initial zero stock.
   */
  async create(
    data: CreateInventoryItemDto,
    storeId: string,
    actorId?: string,
  ): Promise<InventoryItemResponseDto> {
    this.logger.log(
      `InventoryRepository.create: SKU=${data.sku}, Name=${data.name} in store=${storeId}`,
    );
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return {
        id: '01915dfa-b1c4-7221-9988-51b72e04e0a1',
        storeId,
        sku: data.sku.toUpperCase(),
        name: data.name,
        categoryId: data.categoryId,
        supplierId: data.supplierId,
        unit: data.unit,
        physicalStock: 0,
        theoreticalStock: 0,
        targetStock: data.targetStock,
        safetyStock: data.safetyStock,
        reorderPoint: data.safetyStock,
        costPerUnit: data.costPerUnit,
        totalValue: 0,
        status: 'critical',
        barcode: data.barcode,
        storageArea: data.storageArea,
        shelfLifeDays: data.shelfLifeDays,
        version: 1,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const skuUpper = data.sku.trim().toUpperCase();

    // Check SKU duplicate in store
    const existing = await this.findBySku(skuUpper, storeId);
    if (existing) {
      throw new ConflictException(
        `An inventory item with SKU '${skuUpper}' already exists in this store`,
      );
    }

    const initialStatus: StockStatus = 'critical'; // 0 stock < safetyStock

    const { data: created, error } = await client
      .from('inventory_items')
      .insert({
        store_id: storeId,
        sku: skuUpper,
        name: data.name.trim(),
        category_id: data.categoryId,
        unit: data.unit,
        physical_stock: 0,
        theoretical_stock: 0,
        target_stock: data.targetStock,
        safety_stock: data.safetyStock,
        cost_per_unit: data.costPerUnit,
        status: initialStatus,
        barcode: data.barcode,
        storage_area: data.storageArea,
        shelf_life_days: data.shelfLifeDays,
        created_by: actorId,
        updated_by: actorId,
        version: 1,
      })
      .select('*')
      .single();

    if (error || !created) {
      this.logger.error(`Failed to create inventory item: ${error?.message}`);
      throw new InternalServerErrorException('Failed to create inventory item');
    }

    return this.mapRowToResponseDto(created);
  }

  /**
   * Update SKU master metadata with optimistic concurrency check.
   */
  async update(
    id: string,
    data: UpdateInventoryItemDto,
    storeId: string,
    actorId?: string,
  ): Promise<InventoryItemResponseDto> {
    this.logger.log(`InventoryRepository.update: ID=${id} in store=${storeId}`);
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return {
        id,
        storeId,
        sku: 'MOCK-SKU-01',
        name: data.name || 'Updated Item',
        unit: data.unit || 'kg',
        physicalStock: 15,
        theoreticalStock: 15,
        targetStock: data.targetStock || 25,
        safetyStock: data.safetyStock || 5,
        reorderPoint: data.safetyStock || 5,
        costPerUnit: data.costPerUnit || 6.5,
        totalValue: 15 * (data.costPerUnit || 6.5),
        status: 'healthy',
        version: (data.version || 1) + 1,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const currentItem = await this.findById(id, storeId);
    if (!currentItem) {
      throw new NotFoundException(`Inventory item with ID '${id}' not found`);
    }

    if (data.version && currentItem.version !== data.version) {
      throw new ConflictException(
        `Optimistic lock conflict: Item was modified by another user (expected v${data.version}, current v${currentItem.version})`,
      );
    }

    const newTargetStock = data.targetStock ?? currentItem.targetStock;
    const newSafetyStock = data.safetyStock ?? currentItem.safetyStock;
    const physicalStock = currentItem.physicalStock;

    // Recalculate status based on new safety/target stock
    let status: StockStatus = currentItem.status;
    if (physicalStock <= 0) {
      status = 'critical';
    } else if (physicalStock < newSafetyStock) {
      status = 'low';
    } else if (physicalStock > newTargetStock * 1.5) {
      status = 'overstock';
    } else {
      status = 'healthy';
    }

    const updatePayload: Record<string, any> = {
      updated_by: actorId,
      updated_at: new Date().toISOString(),
      version: currentItem.version + 1,
      status,
    };

    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.categoryId !== undefined) updatePayload.category_id = data.categoryId;
    if (data.unit !== undefined) updatePayload.unit = data.unit;
    if (data.targetStock !== undefined) updatePayload.target_stock = data.targetStock;
    if (data.safetyStock !== undefined) updatePayload.safety_stock = data.safetyStock;
    if (data.costPerUnit !== undefined) updatePayload.cost_per_unit = data.costPerUnit;
    if (data.barcode !== undefined) updatePayload.barcode = data.barcode;
    if (data.storageArea !== undefined) updatePayload.storage_area = data.storageArea;
    if (data.shelfLifeDays !== undefined) updatePayload.shelf_life_days = data.shelfLifeDays;

    const { data: updated, error } = await client
      .from('inventory_items')
      .update(updatePayload)
      .eq('id', id)
      .eq('store_id', storeId)
      .select('*')
      .single();

    if (error || !updated) {
      this.logger.error(`Failed to update inventory item: ${error?.message}`);
      throw new InternalServerErrorException('Failed to update inventory item');
    }

    return this.mapRowToResponseDto(updated);
  }

  /**
   * Archive (soft-delete) an inventory item.
   */
  async archive(
    id: string,
    storeId: string,
    actorId?: string,
  ): Promise<ArchiveItemResponseDto> {
    this.logger.log(`InventoryRepository.archive: ID=${id} in store=${storeId}`);
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return {
        success: true,
        message: 'Item archived successfully',
        id,
        archivedAt: new Date().toISOString(),
      };
    }

    const currentItem = await this.findById(id, storeId);
    if (!currentItem) {
      throw new NotFoundException(`Inventory item with ID '${id}' not found`);
    }

    const now = new Date().toISOString();
    const { error } = await client
      .from('inventory_items')
      .update({
        deleted_at: now,
        deleted_by: actorId,
        updated_at: now,
      })
      .eq('id', id)
      .eq('store_id', storeId);

    if (error) {
      this.logger.error(`Failed to archive item ${id}: ${error.message}`);
      throw new InternalServerErrorException('Failed to archive inventory item');
    }

    return {
      success: true,
      message: `Inventory item '${currentItem.name}' (${currentItem.sku}) has been archived`,
      id,
      archivedAt: now,
    };
  }

  /**
   * Execute manual stock adjustment, atomic stock update, and immutable transaction ledger sync.
   */
  async adjustStock(
    itemId: string,
    dto: CreateStockAdjustmentDto,
    storeId: string,
    actorId: string,
  ): Promise<StockAdjustmentResponseDto> {
    this.logger.log(
      `InventoryRepository.adjustStock: Item=${itemId}, Delta=${dto.delta}, Reason=${dto.reasonCode}`,
    );
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return {
        transactionId: '01915dfa-b1c4-7221-9988-000000000099',
        transactionNumber: `TXN-${Date.now().toString(36).toUpperCase()}`,
        itemId,
        previousStock: 20.0,
        newStock: 20.0 + dto.delta,
        delta: dto.delta,
        costImpact: dto.delta * 5.0,
        status: 'healthy',
        version: 2,
        timestamp: new Date().toISOString(),
      };
    }

    const currentItem = await this.findById(itemId, storeId);
    if (!currentItem) {
      throw new NotFoundException(`Inventory item with ID '${itemId}' not found`);
    }

    const previousStock = currentItem.physicalStock;
    const newStock = previousStock + dto.delta;

    if (newStock < 0) {
      throw new BadRequestException(
        `Adjustment would cause negative inventory balance (${previousStock} + ${dto.delta} = ${newStock})`,
      );
    }

    let status: StockStatus = 'healthy';
    if (newStock <= 0) {
      status = 'critical';
    } else if (newStock < currentItem.safetyStock) {
      status = 'low';
    } else if (newStock > currentItem.targetStock * 1.5) {
      status = 'overstock';
    }

    const costImpact = dto.delta * currentItem.costPerUnit;
    const txNumber = `ADJ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString(36).toUpperCase()}`;

    // 1. Insert transaction into immutable ledger
    const { data: txRecord, error: txError } = await client
      .from('inventory_transactions')
      .insert({
        store_id: storeId,
        item_id: itemId,
        batch_id: dto.batchId,
        transaction_number: txNumber,
        transaction_type: 'MANUAL_ADJUSTMENT',
        delta: dto.delta,
        previous_stock: previousStock,
        new_stock: newStock,
        cost_impact: costImpact,
        actor_id: actorId,
        note: `Reason: ${dto.reasonCode}${dto.note ? ` - ${dto.note}` : ''}`,
      })
      .select('id')
      .single();

    if (txError || !txRecord) {
      this.logger.error(`Failed to record inventory transaction: ${txError?.message}`);
      throw new InternalServerErrorException('Failed to write inventory transaction ledger');
    }

    // 2. Update item physical stock and version
    const { data: updatedItem, error: updateError } = await client
      .from('inventory_items')
      .update({
        physical_stock: newStock,
        theoretical_stock: currentItem.theoreticalStock + dto.delta,
        status,
        version: currentItem.version + 1,
        updated_by: actorId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .eq('store_id', storeId)
      .select('version')
      .single();

    if (updateError || !updatedItem) {
      this.logger.error(`Failed to update item balance: ${updateError?.message}`);
      throw new InternalServerErrorException('Failed to update inventory balance');
    }

    return {
      transactionId: txRecord.id,
      transactionNumber: txNumber,
      itemId,
      previousStock,
      newStock,
      delta: dto.delta,
      costImpact,
      status,
      version: updatedItem.version,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Helper mapping Supabase row to InventoryItemResponseDto.
   */
  private mapRowToResponseDto(row: any): InventoryItemResponseDto {
    const physicalStock = Number(row.physical_stock || 0);
    const costPerUnit = Number(row.cost_per_unit || 0);
    const category = row.categories;

    return {
      id: row.id,
      storeId: row.store_id,
      sku: row.sku,
      name: row.name,
      categoryId: row.category_id,
      categoryName: category?.name,
      supplierId: row.supplier_id,
      unit: row.unit as UnitOfMeasure,
      physicalStock,
      theoreticalStock: Number(row.theoretical_stock || 0),
      targetStock: Number(row.target_stock || 0),
      safetyStock: Number(row.safety_stock || 0),
      reorderPoint: Number(row.reorder_point || row.safety_stock || 0),
      costPerUnit,
      totalValue: physicalStock * costPerUnit,
      barcode: row.barcode,
      storageArea: row.storage_area,
      shelfLifeDays: row.shelf_life_days,
      status: row.status as StockStatus,
      version: row.version || 1,
      isArchived: row.deleted_at !== null && row.deleted_at !== undefined,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    };
  }

  private buildMockPaginatedResponse(
    page: number,
    limit: number,
    storeId: string,
  ): PaginatedResponseDto<InventoryItemResponseDto> {
    const mockItems: InventoryItemResponseDto[] = [
      {
        id: '01915dfa-b1c4-7221-9988-51b72e04e0a1',
        storeId,
        sku: 'DAI-001',
        name: 'Whole Milk 3.5%',
        categoryId: 'cat-01',
        categoryName: 'Dairy & Eggs',
        unit: 'L',
        physicalStock: 24,
        theoreticalStock: 24,
        targetStock: 40,
        safetyStock: 10,
        reorderPoint: 10,
        costPerUnit: 1.25,
        totalValue: 30.0,
        status: 'healthy',
        storageArea: 'Walk-in Fridge',
        version: 1,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '01915dfa-b1c4-7221-9988-51b72e04e0a2',
        storeId,
        sku: 'MEA-002',
        name: 'Organic Beef Patty 180g',
        categoryId: 'cat-02',
        categoryName: 'Meat & Poultry',
        unit: 'pcs',
        physicalStock: 8,
        theoreticalStock: 12,
        targetStock: 50,
        safetyStock: 15,
        reorderPoint: 15,
        costPerUnit: 2.8,
        totalValue: 22.4,
        status: 'low',
        storageArea: 'Main Freezer',
        version: 3,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    return {
      data: mockItems,
      meta: {
        page,
        limit,
        total: mockItems.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  private buildMockDetailResponse(
    id: string,
    storeId: string,
  ): InventoryItemDetailResponseDto {
    return {
      id,
      storeId,
      sku: 'DAI-001',
      name: 'Whole Milk 3.5%',
      categoryId: 'cat-01',
      categoryName: 'Dairy & Eggs',
      unit: 'L',
      physicalStock: 24,
      theoreticalStock: 24,
      targetStock: 40,
      safetyStock: 10,
      reorderPoint: 10,
      costPerUnit: 1.25,
      totalValue: 30.0,
      status: 'healthy',
      storageArea: 'Walk-in Fridge',
      shelfLifeDays: 14,
      version: 1,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      batches: [
        {
          id: 'batch-01',
          batchNumber: 'LOT-2026-08-20',
          quantity: 24,
          costPerUnit: 1.25,
          expiryDate: '2026-09-05',
          receivedDate: '2026-08-20',
          status: 'active',
        },
      ],
      recentTransactions: [
        {
          id: 'tx-01',
          transactionNumber: 'REC-202608-001',
          transactionType: 'PURCHASE_RECEIPT',
          delta: 24,
          previousStock: 0,
          newStock: 24,
          costImpact: 30.0,
          actorName: 'Store Manager',
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }

  async getExpiringBatches(storeId: string) {
    const client = this.supabaseService.getAdminClient();
    if (!client) return [];

    const { data } = await client
      .from('inventory_batches')
      .select(`
        id,
        batch_number,
        quantity,
        cost_per_unit,
        expiry_date,
        status,
        inventory_items!inner (
          id,
          name,
          unit,
          store_id,
          categories (
            name
          )
        )
      `)
      .eq('inventory_items.store_id', storeId)
      .eq('status', 'active')
      .order('expiry_date', { ascending: true })
      .limit(10);

    return (data || []).map((b: any) => {
      const days = Math.max(0, Math.ceil((new Date(b.expiry_date).getTime() - Date.now()) / 86400000));
      return {
        id: b.id,
        name: b.inventory_items?.name,
        batch: b.batch_number,
        qty: Number(b.quantity),
        unit: b.inventory_items?.unit,
        days,
        value: parseFloat((Number(b.quantity) * Number(b.cost_per_unit)).toFixed(2)),
        costPerUnit: Number(b.cost_per_unit),
        status: days <= 2 ? 'critical' : 'soon',
        category: (b.inventory_items?.categories as any)?.name || 'General',
        expiryDate: b.expiry_date,
      };
    });
  }

  async getExpiredBatches(storeId: string) {
    const client = this.supabaseService.getAdminClient();
    if (!client) return [];

    const { data } = await client
      .from('inventory_batches')
      .select(`
        id,
        batch_number,
        quantity,
        cost_per_unit,
        expiry_date,
        status,
        inventory_items!inner (
          id,
          name,
          unit,
          store_id,
          categories (
            name
          )
        )
      `)
      .eq('inventory_items.store_id', storeId)
      .eq('status', 'expired')
      .order('expiry_date', { ascending: false })
      .limit(10);

    return (data || []).map((b: any) => ({
      id: b.id,
      name: b.inventory_items?.name,
      batch: b.batch_number,
      qty: Number(b.quantity),
      unit: b.inventory_items?.unit,
      costPerUnit: Number(b.cost_per_unit),
      lossValue: parseFloat((Number(b.quantity) * Number(b.cost_per_unit)).toFixed(2)),
      expiredDate: b.expiry_date,
      category: (b.inventory_items?.categories as any)?.name || 'General',
      status: 'expired',
    }));
  }
}

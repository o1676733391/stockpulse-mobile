import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { SupabaseService } from '../database/supabase.service';
import {
  QueryCountHistoryDto,
  RecordCountItemDto,
  StartStockCountSessionDto,
  StockCountDetailResponseDto,
  StockCountItemResponseDto,
  StockCountSessionResponseDto,
  VarianceItemDto,
  VarianceReviewResponseDto,
} from './dto/stock-count.dto';
import { IStockCountRepository } from './interfaces/stock-count.repository.interface';

@Injectable()
export class StockCountRepository implements IStockCountRepository {
  private readonly logger = new Logger(StockCountRepository.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Query historical stock count sessions with pagination and filters.
   */
  async findHistory(
    query: QueryCountHistoryDto,
    storeId: string,
  ): Promise<PaginatedResponseDto<StockCountSessionResponseDto>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    this.logger.log(`StockCountRepository.findHistory: store=${storeId}, page=${page}`);
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return this.buildMockHistoryResponse(page, limit, storeId);
    }

    let supabaseQuery = client
      .from('stock_counts')
      .select(
        `
        id,
        session_number,
        store_id,
        schedule_id,
        conducted_by,
        status,
        count_type,
        total_items,
        total_counted,
        started_at,
        completed_at,
        notes,
        created_at,
        updated_at,
        users (
          name
        ),
        variances (
          net_variance_value,
          items_with_discrepancy_count
        )
      `,
        { count: 'exact' },
      )
      .eq('store_id', storeId)
      .is('deleted_at', null);

    if (query.status) {
      supabaseQuery = supabaseQuery.eq('status', query.status);
    }

    if (query.countType) {
      supabaseQuery = supabaseQuery.eq('count_type', query.countType);
    }

    if (query.conductedBy) {
      supabaseQuery = supabaseQuery.eq('conducted_by', query.conductedBy);
    }

    if (query.startDate) {
      supabaseQuery = supabaseQuery.gte('started_at', query.startDate);
    }

    if (query.endDate) {
      supabaseQuery = supabaseQuery.lte('started_at', query.endDate);
    }

    supabaseQuery = supabaseQuery.order('started_at', { ascending: false }).range(from, to);

    const { data, count, error } = await supabaseQuery;

    if (error) {
      this.logger.error(`Failed to retrieve stock count history: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve stock count history');
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const items: StockCountSessionResponseDto[] = (data || []).map((row: any) => {
      const user = row.users;
      const variance = Array.isArray(row.variances) ? row.variances[0] : row.variances;
      return {
        id: row.id,
        sessionNumber: row.session_number,
        storeId: row.store_id,
        scheduleId: row.schedule_id,
        conductedBy: row.conducted_by,
        conductedByName: user?.name,
        status: row.status,
        countType: row.count_type,
        totalItems: Number(row.total_items || 0),
        totalCounted: Number(row.total_counted || 0),
        startedAt: row.started_at,
        completedAt: row.completed_at,
        notes: row.notes,
        netVarianceValue: variance ? Number(variance.net_variance_value) : undefined,
        itemsWithDiscrepancies: variance ? Number(variance.items_with_discrepancy_count) : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    return {
      data: items,
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
   * Find single count session by ID with line items and variance details.
   */
  async findSessionById(
    sessionId: string,
    storeId: string,
  ): Promise<StockCountDetailResponseDto | null> {
    this.logger.log(`StockCountRepository.findSessionById: ${sessionId} in store=${storeId}`);
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return this.buildMockSessionDetail(sessionId, storeId);
    }

    const { data: session, error: sessionError } = await client
      .from('stock_counts')
      .select(
        `
        id,
        session_number,
        store_id,
        schedule_id,
        conducted_by,
        status,
        count_type,
        total_items,
        total_counted,
        started_at,
        completed_at,
        notes,
        created_at,
        updated_at,
        users (
          name
        )
      `,
      )
      .eq('id', sessionId)
      .eq('store_id', storeId)
      .is('deleted_at', null)
      .single();

    if (sessionError || !session) {
      return null;
    }

    // Fetch line items
    const { data: countItems } = await client
      .from('stock_count_items')
      .select(
        `
        id,
        stock_count_id,
        item_id,
        counted_quantity,
        unit,
        notes,
        recorded_at,
        inventory_items (
          sku,
          name,
          physical_stock
        )
      `,
      )
      .eq('stock_count_id', sessionId);

    // Fetch variance summary if available
    const varianceSummary = await this.getVarianceSummary(sessionId, storeId);

    const items: StockCountItemResponseDto[] = (countItems || []).map((ci: any) => {
      const invItem = ci.inventory_items;
      return {
        id: ci.id,
        stockCountId: ci.stock_count_id,
        itemId: ci.item_id,
        sku: invItem?.sku || '',
        name: invItem?.name || '',
        unit: ci.unit,
        countedQuantity: Number(ci.counted_quantity),
        expectedQuantity:
          session.count_type === 'standard' || session.status === 'completed' || session.status === 'approved'
            ? Number(invItem?.physical_stock || 0)
            : undefined,
        notes: ci.notes,
        recordedAt: ci.recorded_at,
      };
    });

    const user = session.users as any;

    return {
      id: session.id,
      sessionNumber: session.session_number,
      storeId: session.store_id,
      scheduleId: session.schedule_id,
      conductedBy: session.conducted_by,
      conductedByName: user?.name,
      status: session.status,
      countType: session.count_type,
      totalItems: Number(session.total_items || items.length),
      totalCounted: Number(session.total_counted || items.length),
      startedAt: session.started_at,
      completedAt: session.completed_at,
      notes: session.notes,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      items,
      variance: varianceSummary,
    };
  }

  /**
   * Instantiate a new stocktaking audit session.
   */
  async createSession(
    data: StartStockCountSessionDto,
    storeId: string,
    actorId: string,
    totalTargetItems: number,
  ): Promise<StockCountSessionResponseDto> {
    this.logger.log(`StockCountRepository.createSession in store=${storeId}`);
    const client = this.supabaseService.getAdminClient();

    const sessionNumber = `CNT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

    if (!client) {
      return {
        id: '01915dfa-b1c4-7221-9988-000000000088',
        sessionNumber,
        storeId,
        scheduleId: data.scheduleId,
        conductedBy: actorId,
        conductedByName: 'Mario Batali',
        status: 'in_progress',
        countType: data.countType,
        totalItems: totalTargetItems,
        totalCounted: 0,
        startedAt: new Date().toISOString(),
        notes: data.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const { data: created, error } = await client
      .from('stock_counts')
      .insert({
        store_id: storeId,
        schedule_id: data.scheduleId,
        session_number: sessionNumber,
        conducted_by: actorId,
        status: 'in_progress',
        count_type: data.countType,
        total_items: totalTargetItems,
        total_counted: 0,
        started_at: new Date().toISOString(),
        notes: data.notes || data.name,
        created_by: actorId,
        updated_by: actorId,
      })
      .select('*')
      .single();

    if (error || !created) {
      this.logger.error(`Failed to create count session: ${error?.message}`);
      throw new InternalServerErrorException('Failed to create stock count session');
    }

    return {
      id: created.id,
      sessionNumber: created.session_number,
      storeId: created.store_id,
      scheduleId: created.schedule_id,
      conductedBy: created.conducted_by,
      status: created.status,
      countType: created.count_type,
      totalItems: Number(created.total_items),
      totalCounted: Number(created.total_counted),
      startedAt: created.started_at,
      completedAt: created.completed_at,
      notes: created.notes,
      createdAt: created.created_at,
      updatedAt: created.updated_at,
    };
  }

  /**
   * Record or update single counted item in active session.
   */
  async recordItemCount(
    sessionId: string,
    dto: RecordCountItemDto,
  ): Promise<StockCountItemResponseDto> {
    this.logger.log(`StockCountRepository.recordItemCount: session=${sessionId}, item=${dto.itemId}`);
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return {
        id: 'mock-ci-01',
        stockCountId: sessionId,
        itemId: dto.itemId,
        sku: 'DAI-001',
        name: 'Whole Milk 3.5%',
        unit: dto.unit,
        countedQuantity: dto.countedQty,
        notes: dto.notes,
        recordedAt: new Date().toISOString(),
      };
    }

    const { data, error } = await client
      .from('stock_count_items')
      .upsert(
        {
          stock_count_id: sessionId,
          item_id: dto.itemId,
          counted_quantity: dto.countedQty ?? dto.countedQuantity ?? 0,
          unit: dto.unit,
          notes: dto.notes,
          recorded_at: new Date().toISOString(),
        },
        { onConflict: 'stock_count_id,item_id' },
      )
      .select(
        `
        id,
        stock_count_id,
        item_id,
        counted_quantity,
        unit,
        notes,
        recorded_at,
        inventory_items (
          sku,
          name
        )
      `,
      )
      .single();

    if (error || !data) {
      this.logger.error(`Failed to record item count: ${error?.message}`);
      throw new InternalServerErrorException('Failed to record counted item');
    }

    // Update total counted in session
    const { count } = await client
      .from('stock_count_items')
      .select('id', { count: 'exact' })
      .eq('stock_count_id', sessionId);

    await client
      .from('stock_counts')
      .update({ total_counted: count || 1, updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    const inv = data.inventory_items as any;

    return {
      id: data.id,
      stockCountId: data.stock_count_id,
      itemId: data.item_id,
      sku: inv?.sku || '',
      name: inv?.name || '',
      unit: data.unit,
      countedQuantity: Number(data.counted_quantity),
      notes: data.notes,
      recordedAt: data.recorded_at,
    };
  }

  /**
   * Bulk record multiple item counts.
   */
  async bulkRecordItemCounts(
    sessionId: string,
    items: RecordCountItemDto[],
  ): Promise<void> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return;

    const payload = items.map((i) => ({
      stock_count_id: sessionId,
      item_id: i.itemId,
      counted_quantity: i.countedQty ?? i.countedQuantity ?? 0,
      unit: i.unit,
      notes: i.notes,
      recorded_at: new Date().toISOString(),
    }));

    const { error } = await client
      .from('stock_count_items')
      .upsert(payload, { onConflict: 'stock_count_id,item_id' });

    if (error) {
      this.logger.error(`Bulk count recording failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to bulk record counted items');
    }

    await client
      .from('stock_counts')
      .update({ total_counted: items.length, updated_at: new Date().toISOString() })
      .eq('id', sessionId);
  }

  /**
   * Query all store inventory items to match against during variance calculation.
   */
  async findStoreItemsForCount(
    storeId: string,
    targetCategoryIds?: string[],
  ): Promise<
    {
      id: string;
      sku: string;
      name: string;
      unit: string;
      physicalStock: number;
      costPerUnit: number;
    }[]
  > {
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return [
        {
          id: '01915dfa-b1c4-7221-9988-51b72e04e0a1',
          sku: 'DAI-001',
          name: 'Whole Milk 3.5%',
          unit: 'L',
          physicalStock: 25,
          costPerUnit: 1.25,
        },
        {
          id: '01915dfa-b1c4-7221-9988-51b72e04e0a2',
          sku: 'MEA-002',
          name: 'Organic Beef Patty 180g',
          unit: 'pcs',
          physicalStock: 10,
          costPerUnit: 2.8,
        },
      ];
    }

    let query = client
      .from('inventory_items')
      .select('id, sku, name, unit, physical_stock, cost_per_unit')
      .eq('store_id', storeId)
      .is('deleted_at', null);

    if (targetCategoryIds && targetCategoryIds.length > 0) {
      query = query.in('category_id', targetCategoryIds);
    }

    const { data, error } = await query;
    if (error) {
      this.logger.error(`Failed to load store items for count: ${error.message}`);
      throw new InternalServerErrorException('Failed to load store inventory items');
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      sku: row.sku,
      name: row.name,
      unit: row.unit,
      physicalStock: Number(row.physical_stock || 0),
      costPerUnit: Number(row.cost_per_unit || 0),
    }));
  }

  /**
   * Query line items recorded for a specific stock count session.
   */
  async findSessionCountedItems(
    sessionId: string,
  ): Promise<
    {
      itemId: string;
      countedQuantity: number;
      unit: string;
      notes?: string;
    }[]
  > {
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return [
        {
          itemId: '01915dfa-b1c4-7221-9988-51b72e04e0a1',
          countedQuantity: 22,
          unit: 'L',
        },
        {
          itemId: '01915dfa-b1c4-7221-9988-51b72e04e0a2',
          countedQuantity: 10,
          unit: 'pcs',
        },
      ];
    }

    const { data, error } = await client
      .from('stock_count_items')
      .select('item_id, counted_quantity, unit, notes')
      .eq('stock_count_id', sessionId);

    if (error) {
      this.logger.error(`Failed to load counted items for session ${sessionId}: ${error.message}`);
      throw new InternalServerErrorException('Failed to load counted items');
    }

    return (data || []).map((row: any) => ({
      itemId: row.item_id,
      countedQuantity: Number(row.counted_quantity || 0),
      unit: row.unit,
      notes: row.notes,
    }));
  }

  /**
   * Persist calculated variance summary and line items to database.
   */
  async saveVarianceResults(
    sessionId: string,
    storeId: string,
    varianceData: {
      varianceNumber: string;
      totalExpectedValue: number;
      totalCountedValue: number;
      netVarianceValue: number;
      totalItemsCounted: number;
      itemsWithDiscrepancyCount: number;
      items: VarianceItemDto[];
    },
  ): Promise<string> {
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return 'mock-variance-id';
    }

    // 1. Insert variance record
    const { data: variance, error: varError } = await client
      .from('variances')
      .upsert(
        {
          store_id: storeId,
          stock_count_id: sessionId,
          variance_number: varianceData.varianceNumber,
          total_expected_value: varianceData.totalExpectedValue,
          total_counted_value: varianceData.totalCountedValue,
          net_variance_value: varianceData.netVarianceValue,
          total_items_counted: varianceData.totalItemsCounted,
          items_with_discrepancy_count: varianceData.itemsWithDiscrepancyCount,
        },
        { onConflict: 'stock_count_id' },
      )
      .select('id')
      .single();

    if (varError || !variance) {
      this.logger.error(`Failed to save variance summary: ${varError?.message}`);
      throw new InternalServerErrorException('Failed to save variance summary');
    }

    // 2. Insert variance line items
    const varianceItemsPayload = varianceData.items.map((i) => ({
      variance_id: variance.id,
      item_id: i.itemId,
      expected_quantity: i.expectedQty,
      counted_quantity: i.countedQty,
      variance_quantity: i.varianceQty,
      unit: i.unit,
      unit_cost: i.unitCost,
      variance_value: i.varianceValue,
      discrepancy_tier: i.discrepancyTier,
    }));

    await client
      .from('variance_items')
      .upsert(varianceItemsPayload, { onConflict: 'variance_id,item_id' });

    return variance.id;
  }

  /**
   * Get variance summary and lines for session.
   */
  async getVarianceSummary(
    sessionId: string,
    storeId: string,
  ): Promise<VarianceReviewResponseDto | null> {
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return this.buildMockVarianceReview(sessionId);
    }

    const { data: variance, error } = await client
      .from('variances')
      .select(
        `
        id,
        stock_count_id,
        variance_number,
        total_expected_value,
        total_counted_value,
        net_variance_value,
        total_items_counted,
        items_with_discrepancy_count,
        approved_by,
        approved_at,
        ledger_synced_at,
        notes,
        users (
          name
        ),
        stock_counts (
          session_number
        )
      `,
      )
      .eq('stock_count_id', sessionId)
      .eq('store_id', storeId)
      .single();

    if (error || !variance) {
      return null;
    }

    const { data: lines } = await client
      .from('variance_items')
      .select(
        `
        id,
        item_id,
        expected_quantity,
        counted_quantity,
        variance_quantity,
        unit,
        unit_cost,
        variance_value,
        discrepancy_tier,
        inventory_items (
          sku,
          name
        )
      `,
      )
      .eq('variance_id', variance.id);

    const stockCount = variance.stock_counts as any;
    const approvedUser = variance.users as any;

    const varianceItems: VarianceItemDto[] = (lines || []).map((l: any) => {
      const inv = l.inventory_items;
      const expected = Number(l.expected_quantity);
      const varianceQty = Number(l.variance_quantity);
      const percentage = expected > 0 ? (varianceQty / expected) * 100 : 0;

      return {
        itemId: l.item_id,
        sku: inv?.sku || '',
        name: inv?.name || '',
        unit: l.unit,
        unitCost: Number(l.unit_cost),
        expectedQty: expected,
        countedQty: Number(l.counted_quantity),
        varianceQty,
        variancePercentage: Math.round(percentage * 100) / 100,
        varianceValue: Number(l.variance_value),
        discrepancyTier: l.discrepancy_tier,
      };
    });

    return {
      varianceId: variance.id,
      sessionId: variance.stock_count_id,
      sessionNumber: stockCount?.session_number || '',
      totalExpectedValue: Number(variance.total_expected_value),
      totalCountedValue: Number(variance.total_counted_value),
      netVarianceValue: Number(variance.net_variance_value),
      totalItemsCounted: Number(variance.total_items_counted),
      itemsWithDiscrepancyCount: Number(variance.items_with_discrepancy_count),
      approvedBy: variance.approved_by,
      approvedByName: approvedUser?.name,
      approvedAt: variance.approved_at,
      ledgerSyncedAt: variance.ledger_synced_at,
      notes: variance.notes,
      varianceItems,
    };
  }

  /**
   * Mark session as completed.
   */
  async completeSession(
    sessionId: string,
    storeId: string,
    notes?: string,
  ): Promise<void> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return;

    await client
      .from('stock_counts')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('store_id', storeId);
  }

  /**
   * Mark session as cancelled/rejected.
   */
  async cancelSession(
    sessionId: string,
    storeId: string,
    reason?: string,
  ): Promise<void> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return;

    await client
      .from('stock_counts')
      .update({
        status: 'rejected',
        notes: reason || 'Cancelled by user',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('store_id', storeId);
  }

  /**
   * Apply approved variance counts directly to physical stock and create audit ledger movements.
   */
  async applyVarianceSyncToLedger(
    sessionId: string,
    varianceId: string,
    storeId: string,
    actorId: string,
    itemsToSync: VarianceItemDto[],
  ): Promise<void> {
    this.logger.log(`StockCountRepository.applyVarianceSyncToLedger: session=${sessionId}`);
    const client = this.supabaseService.getAdminClient();
    if (!client) return;

    const now = new Date().toISOString();

    for (const item of itemsToSync) {
      if (item.varianceQty === 0) continue; // No physical movement needed

      const txNumber = `VAR-${now.slice(0, 10).replace(/-/g, '')}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

      // 1. Insert into inventory transaction ledger
      await client.from('inventory_transactions').insert({
        store_id: storeId,
        item_id: item.itemId,
        transaction_number: txNumber,
        transaction_type: 'COUNT_VARIANCE',
        delta: item.varianceQty,
        previous_stock: item.expectedQty,
        new_stock: item.countedQty,
        cost_impact: item.varianceValue,
        actor_id: actorId,
        reference_type: 'STOCK_COUNT',
        reference_id: sessionId,
        note: `Audit count reconciliation (Session: ${sessionId})`,
      });

      // 2. Update physical stock in inventory_items
      await client
        .from('inventory_items')
        .update({
          physical_stock: item.countedQty,
          updated_by: actorId,
          updated_at: now,
        })
        .eq('id', item.itemId)
        .eq('store_id', storeId);
    }

    // 3. Mark variance and session as approved and synced
    await client
      .from('variances')
      .update({
        approved_by: actorId,
        approved_at: now,
        ledger_synced_at: now,
        updated_at: now,
      })
      .eq('id', varianceId);

    await client
      .from('stock_counts')
      .update({
        status: 'approved',
        updated_at: now,
      })
      .eq('id', sessionId);
  }

  private buildMockHistoryResponse(
    page: number,
    limit: number,
    storeId: string,
  ): PaginatedResponseDto<StockCountSessionResponseDto> {
    const mockSessions: StockCountSessionResponseDto[] = [
      {
        id: '01915dfa-b1c4-7221-9988-000000000088',
        sessionNumber: 'SC-20260818-D01',
        storeId,
        conductedBy: '01915dfa-9012-7000-8000-000000000099',
        conductedByName: 'Mario Batali',
        status: 'approved',
        countType: 'blind',
        totalItems: 45,
        totalCounted: 45,
        startedAt: '2026-08-18T10:00:00Z',
        completedAt: '2026-08-18T11:15:00Z',
        netVarianceValue: -3.75,
        itemsWithDiscrepancies: 1,
        createdAt: '2026-08-18T10:00:00Z',
        updatedAt: '2026-08-18T11:30:00Z',
      },
    ];

    return {
      data: mockSessions,
      meta: {
        page,
        limit,
        total: mockSessions.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  private buildMockSessionDetail(
    sessionId: string,
    storeId: string,
  ): StockCountDetailResponseDto {
    const status = sessionId.includes('in_progress')
      ? 'in_progress'
      : sessionId.includes('approved')
      ? 'approved'
      : sessionId.includes('completed')
      ? 'completed'
      : 'in_progress';
    return {
      id: sessionId,
      sessionNumber: 'SC-20260818-D01',
      storeId,
      conductedBy: '01915dfa-9012-7000-8000-000000000099',
      conductedByName: 'Mario Batali',
      status,
      countType: 'blind',
      totalItems: 2,
      totalCounted: 2,
      startedAt: '2026-08-18T10:00:00Z',
      completedAt: status === 'completed' || status === 'approved' ? '2026-08-18T11:15:00Z' : undefined,
      createdAt: '2026-08-18T10:00:00Z',
      updatedAt: '2026-08-18T11:30:00Z',
      items: [
        {
          id: 'ci-01',
          stockCountId: sessionId,
          itemId: '01915dfa-b1c4-7221-9988-51b72e04e0a1',
          sku: 'DAI-001',
          name: 'Whole Milk 3.5%',
          unit: 'L',
          countedQuantity: 22,
          expectedQuantity: 25,
          recordedAt: '2026-08-18T10:30:00Z',
        },
      ],
      variance: this.buildMockVarianceReview(sessionId),
    };
  }

  private buildMockVarianceReview(sessionId: string): VarianceReviewResponseDto {
    return {
      varianceId: 'var-01',
      sessionId,
      sessionNumber: 'SC-20260818-D01',
      totalExpectedValue: 31.25,
      totalCountedValue: 27.5,
      netVarianceValue: -3.75,
      totalItemsCounted: 2,
      itemsWithDiscrepancyCount: 1,
      varianceItems: [
        {
          itemId: '01915dfa-b1c4-7221-9988-51b72e04e0a1',
          sku: 'DAI-001',
          name: 'Whole Milk 3.5%',
          unit: 'L',
          unitCost: 1.25,
          expectedQty: 25,
          countedQty: 22,
          varianceQty: -3,
          variancePercentage: -12.0,
          varianceValue: -3.75,
          discrepancyTier: 'minor',
        },
      ],
    };
  }
}

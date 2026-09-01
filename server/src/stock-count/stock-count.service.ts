import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
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
  VarianceItemDto,
  VarianceReviewResponseDto,
} from './dto/stock-count.dto';
import { DiscrepancyTier } from './entities/variance-item.entity';
import { StockCountRepository } from './stock-count.repository';

@Injectable()
export class StockCountService {
  private readonly logger = new Logger(StockCountService.name);

  constructor(private readonly stockCountRepository: StockCountRepository) {}

  /**
   * Start a new blind or standard stock count session.
   */
  async startSession(
    dto: StartStockCountSessionDto,
    storeId: string,
    actorId: string,
  ): Promise<StockCountSessionResponseDto> {
    this.logger.log(`StockCountService.startSession: store=${storeId}, type=${dto.countType}`);

    // Determine target item scope
    const storeItems = await this.stockCountRepository.findStoreItemsForCount(
      storeId,
      dto.targetCategoryIds,
    );

    return this.stockCountRepository.createSession(
      dto,
      storeId,
      actorId,
      storeItems.length,
    );
  }

  /**
   * Get active inventory items ready for stock count in store.
   */
  async getActiveCountItems(storeId: string) {
    const items = await this.stockCountRepository.findStoreItemsForCount(storeId);
    return items.map((i) => ({
      id: i.id,
      name: i.name,
      sku: i.sku,
      unit: i.unit,
      expected: Number(i.physicalStock || 0),
      currentStock: Number(i.physicalStock || 0),
      physicalStock: Number(i.physicalStock || 0),
      costPerUnit: Number(i.costPerUnit || 0),
    }));
  }

  /**
   * Cancel an active or draft stock count session.
   */
  async cancelSession(
    sessionId: string,
    storeId: string,
    reason?: string,
  ): Promise<{ success: boolean; message: string }> {
    const session = await this.stockCountRepository.findSessionById(sessionId, storeId);
    if (!session) {
      throw new NotFoundException(`Stock count session '${sessionId}' not found`);
    }

    await this.stockCountRepository.cancelSession(sessionId, storeId, reason);
    return { success: true, message: 'Stock count session cancelled' };
  }

  /**
   * Record counted quantity for a specific SKU in active session.
   */
  async recordItemCount(
    sessionId: string,
    dto: RecordCountItemDto,
    storeId: string,
  ): Promise<StockCountItemResponseDto> {
    const session = await this.stockCountRepository.findSessionById(sessionId, storeId);
    if (!session) {
      throw new NotFoundException(`Stock count session '${sessionId}' not found`);
    }

    if (session.status !== 'in_progress') {
      throw new BadRequestException(
        `Cannot record count on session with status '${session.status}' (must be 'in_progress')`,
      );
    }

    return this.stockCountRepository.recordItemCount(sessionId, dto);
  }

  /**
   * Bulk record multiple item counts.
   */
  async bulkRecordItemCounts(
    sessionId: string,
    dto: BulkRecordCountItemsDto,
    storeId: string,
  ): Promise<{ success: boolean; recordedCount: number }> {
    const session = await this.stockCountRepository.findSessionById(sessionId, storeId);
    if (!session) {
      throw new NotFoundException(`Stock count session '${sessionId}' not found`);
    }

    if (session.status !== 'in_progress') {
      throw new BadRequestException(
        `Cannot record counts on session with status '${session.status}'`,
      );
    }

    await this.stockCountRepository.bulkRecordItemCounts(sessionId, dto.items);
    return { success: true, recordedCount: dto.items.length };
  }

  /**
   * Submit count session, transition to completed, and execute variance calculations.
   * ALL mathematical calculations and shrinkage business rules are isolated here.
   */
  async submitCount(
    sessionId: string,
    dto: SubmitCountSessionDto,
    storeId: string,
    actorId: string,
  ): Promise<VarianceReviewResponseDto> {
    this.logger.log(`StockCountService.submitCount: Calculating variance for session=${sessionId}`);

    const session = await this.stockCountRepository.findSessionById(sessionId, storeId);
    if (!session) {
      throw new NotFoundException(`Stock count session '${sessionId}' not found`);
    }

    if (session.status !== 'in_progress') {
      throw new BadRequestException(
        `Cannot submit session with status '${session.status}' (must be 'in_progress')`,
      );
    }

    // 1. Fetch store inventory theoretical baselines
    const storeItems = await this.stockCountRepository.findStoreItemsForCount(
      storeId,
      session.scheduleId ? undefined : undefined,
    );

    // 2. Fetch recorded count lines
    const countedItems = await this.stockCountRepository.findSessionCountedItems(sessionId);
    const countedMap = new Map<string, number>();
    for (const c of countedItems) {
      countedMap.set(c.itemId, c.countedQuantity);
    }

    // 3. Execute Variance Business Logic & Mathematics
    const varianceItems: VarianceItemDto[] = [];
    let totalExpectedValue = 0;
    let totalCountedValue = 0;
    let itemsWithDiscrepancyCount = 0;

    for (const item of storeItems) {
      const expectedQty = Number(item.physicalStock || 0);
      const unitCost = Number(item.costPerUnit || 0);
      const countedQty = countedMap.has(item.id) ? (countedMap.get(item.id) as number) : 0;

      const varianceQty = countedQty - expectedQty;
      const varianceValue = Math.round(varianceQty * unitCost * 100) / 100;
      const expectedVal = Math.round(expectedQty * unitCost * 100) / 100;
      const countedVal = Math.round(countedQty * unitCost * 100) / 100;

      totalExpectedValue += expectedVal;
      totalCountedValue += countedVal;

      let variancePercentage = 0;
      if (expectedQty > 0) {
        variancePercentage = Math.round((varianceQty / expectedQty) * 10000) / 100;
      } else if (countedQty > 0) {
        variancePercentage = 100.0;
      }

      // Determine Discrepancy Severity Tier
      let discrepancyTier: DiscrepancyTier = 'none';
      if (varianceQty !== 0) {
        itemsWithDiscrepancyCount++;
        const absValue = Math.abs(varianceValue);
        const absPct = Math.abs(variancePercentage);

        if (absValue >= 100.0 || (expectedQty > 0 && absPct >= 15.0)) {
          discrepancyTier = 'critical';
        } else {
          discrepancyTier = 'minor';
        }
      }

      varianceItems.push({
        itemId: item.id,
        sku: item.sku,
        name: item.name,
        unit: item.unit as any,
        unitCost,
        expectedQty,
        countedQty,
        varianceQty,
        variancePercentage,
        varianceValue,
        discrepancyTier,
      });
    }

    const netVarianceValue = Math.round((totalCountedValue - totalExpectedValue) * 100) / 100;
    const varianceNumber = `VAR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

    // 4. Persist calculated variance summary
    const varianceId = await this.stockCountRepository.saveVarianceResults(sessionId, storeId, {
      varianceNumber,
      totalExpectedValue: Math.round(totalExpectedValue * 100) / 100,
      totalCountedValue: Math.round(totalCountedValue * 100) / 100,
      netVarianceValue,
      totalItemsCounted: countedItems.length,
      itemsWithDiscrepancyCount,
      items: varianceItems,
    });

    // 5. Transition session to completed
    await this.stockCountRepository.completeSession(sessionId, storeId, dto.notes);

    return {
      varianceId,
      sessionId,
      sessionNumber: session.sessionNumber,
      totalExpectedValue: Math.round(totalExpectedValue * 100) / 100,
      totalCountedValue: Math.round(totalCountedValue * 100) / 100,
      netVarianceValue,
      totalItemsCounted: countedItems.length,
      itemsWithDiscrepancyCount,
      notes: dto.notes,
      varianceItems,
    };
  }

  /**
   * Retrieve variance review summary for session.
   */
  async getVarianceSummary(
    sessionId: string,
    storeId: string,
  ): Promise<VarianceReviewResponseDto> {
    const summary = await this.stockCountRepository.getVarianceSummary(sessionId, storeId);
    if (!summary) {
      throw new NotFoundException(`Variance summary for session '${sessionId}' not found`);
    }
    return summary;
  }

  /**
   * Approve variance, adjust physical stock balances, and write immutable audit ledger movements.
   */
  async approveVariance(
    sessionId: string,
    storeId: string,
    actorId: string,
  ): Promise<ApproveVarianceResponseDto> {
    this.logger.log(`StockCountService.approveVariance: Approving session=${sessionId} by actor=${actorId}`);

    const session = await this.stockCountRepository.findSessionById(sessionId, storeId);
    if (!session) {
      throw new NotFoundException(`Stock count session '${sessionId}' not found`);
    }

    if (session.status !== 'completed') {
      throw new BadRequestException(
        `Cannot approve session with status '${session.status}' (session must be 'completed' first)`,
      );
    }

    const variance = await this.getVarianceSummary(sessionId, storeId);
    const itemsToSync = variance.varianceItems.filter((i) => i.varianceQty !== 0);

    // Apply ledger synchronization in repository
    await this.stockCountRepository.applyVarianceSyncToLedger(
      sessionId,
      variance.varianceId,
      storeId,
      actorId,
      variance.varianceItems,
    );

    const now = new Date().toISOString();

    return {
      success: true,
      message: `Variance approved successfully. ${itemsToSync.length} items reconciled in inventory ledger.`,
      sessionId,
      varianceId: variance.varianceId,
      syncedItemsCount: itemsToSync.length,
      netVarianceValue: variance.netVarianceValue,
      ledgerSyncedAt: now,
    };
  }

  /**
   * Query historical stock count sessions.
   */
  async findHistory(
    query: QueryCountHistoryDto,
    storeId: string,
  ): Promise<PaginatedResponseDto<StockCountSessionResponseDto>> {
    return this.stockCountRepository.findHistory(query, storeId);
  }

  /**
   * Get stock count session detail.
   */
  async findSessionById(
    sessionId: string,
    storeId: string,
  ): Promise<StockCountDetailResponseDto> {
    const session = await this.stockCountRepository.findSessionById(sessionId, storeId);
    if (!session) {
      throw new NotFoundException(`Stock count session '${sessionId}' not found`);
    }
    return session;
  }
}

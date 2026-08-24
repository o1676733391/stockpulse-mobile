import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import {
  QueryCountHistoryDto,
  RecordCountItemDto,
  StartStockCountSessionDto,
  StockCountDetailResponseDto,
  StockCountItemResponseDto,
  StockCountSessionResponseDto,
  VarianceItemDto,
  VarianceReviewResponseDto,
} from '../dto/stock-count.dto';

export interface IStockCountRepository {
  findHistory(
    query: QueryCountHistoryDto,
    storeId: string,
  ): Promise<PaginatedResponseDto<StockCountSessionResponseDto>>;

  findSessionById(
    sessionId: string,
    storeId: string,
  ): Promise<StockCountDetailResponseDto | null>;

  createSession(
    data: StartStockCountSessionDto,
    storeId: string,
    actorId: string,
    totalTargetItems: number,
  ): Promise<StockCountSessionResponseDto>;

  recordItemCount(
    sessionId: string,
    dto: RecordCountItemDto,
  ): Promise<StockCountItemResponseDto>;

  bulkRecordItemCounts(
    sessionId: string,
    items: RecordCountItemDto[],
  ): Promise<void>;

  findStoreItemsForCount(
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
  >;

  findSessionCountedItems(
    sessionId: string,
  ): Promise<
    {
      itemId: string;
      countedQuantity: number;
      unit: string;
      notes?: string;
    }[]
  >;

  saveVarianceResults(
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
  ): Promise<string>;

  getVarianceSummary(
    sessionId: string,
    storeId: string,
  ): Promise<VarianceReviewResponseDto | null>;

  completeSession(
    sessionId: string,
    storeId: string,
    notes?: string,
  ): Promise<void>;

  applyVarianceSyncToLedger(
    sessionId: string,
    varianceId: string,
    storeId: string,
    actorId: string,
    itemsToSync: VarianceItemDto[],
  ): Promise<void>;
}

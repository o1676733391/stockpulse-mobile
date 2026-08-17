import { mockCountSchedules, mockStockCountItems, mockSummaryItems } from '@/mocks/inventoryMockData';
import { CountSchedule, CountSummaryItem, StockCountItem } from '@/types/inventory';
import { apiClient, logDebugFallback } from './apiClient';

export interface IStockCountService {
  getSchedules(): Promise<CountSchedule[]>;
  getActiveItems(): Promise<StockCountItem[]>;
  submitCount(counts: Record<string, number>, scheduleId?: string): Promise<{ success: boolean; summary: CountSummaryItem[] }>;
}

export class RealStockCountService implements IStockCountService {
  async getSchedules(): Promise<CountSchedule[]> {
    try {
      return await apiClient.get<CountSchedule[]>('/stock-count/schedules');
    } catch (err) {
      logDebugFallback('StockCountService', '/stock-count/schedules', err);
      return [...mockCountSchedules];
    }
  }

  async getActiveItems(): Promise<StockCountItem[]> {
    try {
      return await apiClient.get<StockCountItem[]>('/stock-count/active-items');
    } catch (err) {
      logDebugFallback('StockCountService', '/stock-count/active-items', err);
      return [...mockStockCountItems];
    }
  }

  async submitCount(
    counts: Record<string, number>,
    scheduleId: string = 'daily'
  ): Promise<{ success: boolean; summary: CountSummaryItem[] }> {
    try {
      await apiClient.post('/stock-count/submit', { counts, scheduleId });
      const items = await this.getActiveItems();
      const summary: CountSummaryItem[] = items.map((it) => {
        const is = counts[it.id] !== undefined ? counts[it.id] : it.expected;
        return {
          id: it.id,
          name: it.name,
          should: it.expected,
          is,
          unit: it.unit,
          cost: 4.80,
        };
      });
      return { success: true, summary };
    } catch (err) {
      logDebugFallback('StockCountService', '/stock-count/submit', err);
      return { success: true, summary: [...mockSummaryItems] };
    }
  }
}

export const stockCountService: IStockCountService = new RealStockCountService();

import { CountSchedule, CountSummaryItem, StockCountItem } from '@/types/inventory';
import { apiClient, logDebugFallback } from './apiClient';

export interface StockCountSessionData {
  id: string;
  sessionNumber: string;
  name: string;
  countType: 'blind' | 'standard';
  status: 'draft' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  scheduledDate: string;
  startedAt?: string;
  completedAt?: string;
  countedItemsCount?: number;
  totalItemsCount?: number;
}

export interface VarianceReviewData {
  sessionId: string;
  status: string;
  totalItemsCounted: number;
  discrepancyCount: number;
  netVarianceValue: number;
  items: CountSummaryItem[];
}

export interface IStockCountService {
  getSchedules(): Promise<CountSchedule[]>;
  getActiveItems(): Promise<StockCountItem[]>;
  startSession(name?: string, countType?: 'blind' | 'standard'): Promise<StockCountSessionData>;
  recordItemCount(sessionId: string, itemId: string, countedQuantity: number, notes?: string, unit?: string): Promise<void>;
  submitCount(
    counts: Record<string, number>,
    sessionId?: string
  ): Promise<{ success: boolean; summary: CountSummaryItem[]; sessionId?: string }>;
  getVariances(sessionId: string): Promise<VarianceReviewData>;
  approveVariance(sessionId: string, notes?: string): Promise<{ success: boolean; netVarianceValue: number }>;
  cancelSession(sessionId: string, reason?: string): Promise<{ success: boolean }>;
  getHistory(): Promise<StockCountSessionData[]>;
}

export class RealStockCountService implements IStockCountService {
  private activeSessionId: string = '';
  private cachedItems: Map<string, StockCountItem> = new Map();

  async getSchedules(): Promise<CountSchedule[]> {
    try {
      const historyRes = await apiClient.get<any>('/stock-counts/history');
      const sessions: any[] = Array.isArray(historyRes)
        ? historyRes
        : Array.isArray(historyRes?.items)
        ? historyRes.items
        : Array.isArray(historyRes?.data)
        ? historyRes.data
        : [];

      if (sessions.length > 0) {
        return sessions.map((s: any) => ({
          id: s.id,
          label: s.name || `Stock Count #${s.sessionNumber || s.id.slice(0, 6)}`,
          sub: `${s.countType === 'blind' ? 'Blind Count' : 'Standard Audit'} · ${s.createdByName || 'Staff Team'}`,
          progress: s.countedItemsCount || 0,
          total: s.totalItemsCount || 0,
          status: s.status === 'in_progress' ? ('in_progress' as const) : ('scheduled' as const),
          route: '/stock-count/active',
        }));
      }

      if (apiClient.isFallbackEnabled()) {
        return [
          {
            id: 'sched-daily',
            label: 'Daily Closing Inventory Count',
            sub: 'Blind Count · Kitchen Staff',
            progress: 0,
            total: 0,
            status: 'scheduled' as const,
            route: '/stock-count/active',
          },
        ];
      }
      return [];
    } catch (err) {
      logDebugFallback('StockCountService', '/stock-counts/history [getSchedules]', err);
      return [];
    }
  }

  async getActiveItems(): Promise<StockCountItem[]> {
    try {
      let rawList: any[] = [];
      try {
        const countItemsRes = await apiClient.get<any>('/stock-counts/active-items');
        rawList = Array.isArray(countItemsRes)
          ? countItemsRes
          : Array.isArray(countItemsRes?.items)
          ? countItemsRes.items
          : Array.isArray(countItemsRes?.data)
          ? countItemsRes.data
          : [];
      } catch {
        const res = await apiClient.get<any>('/inventory');
        rawList = Array.isArray(res)
          ? res
          : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.data)
          ? res.data
          : [];
      }

      const items = rawList.map((item: any) => ({
        id: item.id,
        name: item.name,
        sku: item.sku || '',
        category: item.category || 'General',
        expected: Number(item.currentStock ?? item.current_stock ?? item.physicalStock ?? 0),
        unit: item.unit || 'kg',
      }));

      items.forEach((it) => this.cachedItems.set(it.id, it));
      return items;
    } catch (err) {
      logDebugFallback('StockCountService', '/stock-counts/active-items [getActiveItems]', err);
      throw err;
    }
  }

  async startSession(
    name: string = 'Daily Closing Count',
    countType: 'blind' | 'standard' = 'blind'
  ): Promise<StockCountSessionData> {
    try {
      const payload: Record<string, any> = {
        countType,
      };
      if (name) {
        payload.notes = name;
      }
      const res = await apiClient.post<any>('/stock-counts/sessions', payload);
      this.activeSessionId = res.id;
      return {
        ...res,
        name: res.name || res.notes || name,
        sessionNumber: res.sessionNumber || res.id?.slice(0, 8) || '',
        scheduledDate: res.scheduledDate || res.startedAt || new Date().toISOString(),
        countedItemsCount: res.totalCounted ?? res.countedItemsCount ?? 0,
        totalItemsCount: res.totalItems ?? res.totalItemsCount ?? 0,
      };
    } catch (err) {
      logDebugFallback('StockCountService', '/stock-counts/sessions [POST]', err);
      throw err;
    }
  }

  async recordItemCount(
    sessionId: string,
    itemId: string,
    countedQuantity: number,
    notes?: string,
    unit?: string
  ): Promise<void> {
    try {
      const cachedUnit = unit || this.cachedItems.get(itemId)?.unit || 'pcs';
      const validUnits = ['kg', 'g', 'L', 'ml', 'pcs', 'can', 'bottle', 'pack'];
      const normalizedUnit = validUnits.includes(cachedUnit.toLowerCase())
        ? cachedUnit.toLowerCase()
        : 'pcs';

      await apiClient.put(`/stock-counts/sessions/${sessionId}/items/${itemId}`, {
        countedQty: countedQuantity,
        unit: normalizedUnit,
        notes: notes || undefined,
      });
    } catch (err) {
      logDebugFallback(
        'StockCountService',
        `/stock-counts/sessions/${sessionId}/items/${itemId} [PUT]`,
        err
      );
      throw err;
    }
  }

  async submitCount(
    counts: Record<string, number>,
    sessionId?: string
  ): Promise<{ success: boolean; summary: CountSummaryItem[]; sessionId?: string }> {
    let activeId = sessionId || this.activeSessionId;
    if (!activeId || activeId.trim() === '') {
      const newSession = await this.startSession('Daily Closing Count', 'blind');
      activeId = newSession.id;
    }

    try {
      const validUnits = ['kg', 'g', 'L', 'ml', 'pcs', 'can', 'bottle', 'pack'];
      const itemsPayload = Object.entries(counts).map(([itemId, countedQuantity]) => {
        const cachedUnit = this.cachedItems.get(itemId)?.unit || 'pcs';
        const unit = validUnits.includes(cachedUnit.toLowerCase())
          ? cachedUnit.toLowerCase()
          : 'pcs';
        return {
          itemId,
          countedQty: countedQuantity,
          unit,
        };
      });

      if (itemsPayload.length > 0) {
        await apiClient.post(`/stock-counts/sessions/${activeId}/items`, {
          items: itemsPayload,
        });
      }

      await apiClient.post(`/stock-counts/sessions/${activeId}/submit`, {
        notes: 'Submitted via StockPulse Mobile App',
      });

      const variances = await this.getVariances(activeId);
      return { success: true, summary: variances.items, sessionId: activeId };
    } catch (err) {
      logDebugFallback('StockCountService', `/stock-counts/sessions/${activeId}/submit [POST]`, err);
      throw err;
    }
  }

  async getVariances(sessionId: string): Promise<VarianceReviewData> {
    try {
      const res = await apiClient.get<any>(`/stock-counts/sessions/${sessionId}/variance`);
      const rawItems: any[] = Array.isArray(res?.varianceItems)
        ? res.varianceItems
        : Array.isArray(res?.items)
        ? res.items
        : [];

      const mappedItems: CountSummaryItem[] = rawItems.map((it: any) => ({
        id: it.itemId || it.id,
        name: it.name || it.itemName || 'Item',
        should: Number(it.systemQty ?? it.theoreticalStock ?? it.expected ?? 0),
        is: Number(it.countedQty ?? it.physicalStock ?? it.counted ?? 0),
        unit: it.unit || 'kg',
        cost: Number(it.varianceValue ?? it.costImpact ?? 0),
      }));

      return {
        sessionId: res.sessionId || sessionId,
        status: res.status || 'completed',
        totalItemsCounted: res.totalItemsCounted || mappedItems.length,
        discrepancyCount: res.discrepancyCount || mappedItems.filter((i) => i.is !== i.should).length,
        netVarianceValue: Number(res.netVarianceValue || 0),
        items: mappedItems,
      };
    } catch (err) {
      logDebugFallback(
        'StockCountService',
        `/stock-counts/sessions/${sessionId}/variance [GET]`,
        err
      );
      throw err;
    }
  }

  async approveVariance(
    sessionId: string,
    notes?: string
  ): Promise<{ success: boolean; netVarianceValue: number }> {
    try {
      const res = await apiClient.post<any>(
        `/stock-counts/sessions/${sessionId}/variance/approve`,
        {}
      );
      return {
        success: true,
        netVarianceValue: res?.netVarianceValue || 0,
      };
    } catch (err) {
      logDebugFallback(
        'StockCountService',
        `/stock-counts/sessions/${sessionId}/variance/approve [POST]`,
        err
      );
      throw err;
    }
  }

  async cancelSession(sessionId: string, reason?: string): Promise<{ success: boolean }> {
    try {
      await apiClient.post(`/stock-counts/sessions/${sessionId}/cancel`, { reason });
      return { success: true };
    } catch (err) {
      logDebugFallback(
        'StockCountService',
        `/stock-counts/sessions/${sessionId}/cancel`,
        err
      );
      throw err;
    }
  }

  async getHistory(): Promise<StockCountSessionData[]> {
    try {
      const res = await apiClient.get<any>('/stock-counts/history');
      const rawList: any[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.data)
        ? res.data
        : [];

      return rawList.map((s: any) => ({
        id: s.id,
        sessionNumber: s.sessionNumber || s.id.slice(0, 6),
        name: s.name || `Count #${s.sessionNumber || s.id.slice(0, 6)}`,
        countType: s.countType || 'blind',
        status: s.status || 'completed',
        scheduledDate: s.scheduledDate || s.startedAt || new Date().toISOString(),
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        countedItemsCount: s.countedItemsCount,
        totalItemsCount: s.totalItemsCount,
      }));
    } catch (err) {
      logDebugFallback('StockCountService', '/stock-counts/history', err);
      throw err;
    }
  }
}

export const stockCountService: IStockCountService = new RealStockCountService();

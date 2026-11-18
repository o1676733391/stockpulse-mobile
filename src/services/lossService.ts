import { CancellationReason, FoodLossLog, KitchenCancellation, LossCategory } from '@/types/loss';
import { apiClient, logDebugFallback } from './apiClient';
import { inventoryService } from './inventoryService';

export const INITIAL_LOSS_LOGS: FoodLossLog[] = [
  {
    id: 'loss-01',
    timestamp: '11 Mar 2026, 14:20',
    itemId: 'i1',
    itemName: 'Fresh Chicken Breast Fillet',
    sku: 'CHK-001',
    quantity: 0.8,
    unit: 'kg',
    unitCost: 4.80,
    totalLossCost: 3.84,
    category: 'cooking_dropped',
    loggedBy: 'Marco Rossi',
    notes: 'Line dropped during peak lunch rush',
  },
  {
    id: 'loss-02',
    timestamp: '11 Mar 2026, 09:15',
    itemId: 'i5',
    itemName: 'Whole Fresh Milk 3.8% Fat',
    sku: 'MLK-005',
    quantity: 2.0,
    unit: 'L',
    unitCost: 1.10,
    totalLossCost: 2.20,
    category: 'spoilage_expired',
    loggedBy: 'Elena Fischer',
    notes: 'Opened carton past safe BBD usage window',
  },
  {
    id: 'loss-03',
    timestamp: '10 Mar 2026, 17:40',
    itemId: 'i2',
    itemName: 'Fresh Atlantic Salmon Portion',
    sku: 'SAL-002',
    quantity: 0.45,
    unit: 'kg',
    unitCost: 16.20,
    totalLossCost: 7.29,
    category: 'prep_trimming',
    loggedBy: 'David Weber',
    notes: 'Excess butchery trimming loss',
  },
  {
    id: 'loss-04',
    timestamp: '10 Mar 2026, 11:00',
    itemId: 'i7',
    itemName: 'Vine Tomatoes Grade A',
    sku: 'TOM-007',
    quantity: 1.5,
    unit: 'kg',
    unitCost: 1.80,
    totalLossCost: 2.70,
    category: 'spoilage_expired',
    loggedBy: 'Anna Schmidt',
    notes: 'Soft rot detected in bottom of delivery crate',
  },
];

export const INITIAL_CANCELLATIONS: KitchenCancellation[] = [
  {
    id: 'canc-01',
    timestamp: '11 Mar 2026, 13:45',
    ticketNumber: 'TKT-8802',
    tableNumber: 'Table 14',
    recipeId: 'r1',
    recipeName: 'Menu 1 — Chicken Plate',
    portions: 1,
    reason: 'guest_cancelled',
    wasPrepped: true,
    wastedCost: 3.42,
    cancelledBy: 'Marco Rossi',
    notes: 'Customer walked out due to emergency; chicken already plated',
  },
  {
    id: 'canc-02',
    timestamp: '11 Mar 2026, 12:10',
    ticketNumber: 'TKT-8795',
    tableNumber: 'Table 08',
    recipeId: 'r2',
    recipeName: 'Burger XL Deluxe',
    portions: 2,
    reason: 'wrong_order',
    wasPrepped: false,
    wastedCost: 0,
    cancelledBy: 'Elena Fischer',
    notes: 'Server rang in wrong burger; voided before hot line fired ticket',
  },
  {
    id: 'canc-03',
    timestamp: '10 Mar 2026, 20:30',
    ticketNumber: 'TKT-8760',
    tableNumber: 'Takeout #19',
    recipeId: 'r3',
    recipeName: 'Salmon Lunch Special',
    portions: 1,
    reason: 'kitchen_delay',
    wasPrepped: true,
    wastedCost: 8.90,
    cancelledBy: 'David Weber',
    notes: 'Long delivery driver delay, fish dried out under heat lamp',
  },
];

let localLossLogs = [...INITIAL_LOSS_LOGS];
let localCancellations = [...INITIAL_CANCELLATIONS];

export interface ILossService {
  getLossLogs(): Promise<FoodLossLog[]>;
  getKitchenCancellations(): Promise<KitchenCancellation[]>;
  createLossLog(payload: {
    itemId: string;
    itemName: string;
    sku: string;
    quantity: number;
    unit: string;
    unitCost: number;
    category: LossCategory;
    loggedBy: string;
    notes?: string;
  }): Promise<FoodLossLog>;
  createKitchenCancellation(payload: {
    ticketNumber: string;
    tableNumber?: string;
    recipeId: string;
    recipeName: string;
    portions: number;
    reason: CancellationReason;
    wasPrepped: boolean;
    unitCost: number;
    cancelledBy: string;
    notes?: string;
  }): Promise<KitchenCancellation>;
}

export class RealLossService implements ILossService {
  async getLossLogs(): Promise<FoodLossLog[]> {
    try {
      const res = await apiClient.get<any>('/inventory/loss-logs');
      const list = Array.isArray(res) ? res : res?.items || res?.data;
      if (Array.isArray(list)) return list;
      return apiClient.isFallbackEnabled() ? localLossLogs : [];
    } catch (err) {
      logDebugFallback('LossService', '/inventory/loss-logs', err);
      return apiClient.isFallbackEnabled() ? localLossLogs : [];
    }
  }

  async getKitchenCancellations(): Promise<KitchenCancellation[]> {
    try {
      const res = await apiClient.get<any>('/kitchen/cancellations');
      const list = Array.isArray(res) ? res : res?.items || res?.data;
      if (Array.isArray(list)) return list;
      return apiClient.isFallbackEnabled() ? localCancellations : [];
    } catch (err) {
      logDebugFallback('LossService', '/kitchen/cancellations', err);
      return apiClient.isFallbackEnabled() ? localCancellations : [];
    }
  }

  async createLossLog(payload: {
    itemId: string;
    itemName: string;
    sku: string;
    quantity: number;
    unit: string;
    unitCost: number;
    category: LossCategory;
    loggedBy: string;
    notes?: string;
  }): Promise<FoodLossLog> {
    const totalLossCost = parseFloat((payload.quantity * payload.unitCost).toFixed(2));
    const newLog: FoodLossLog = {
      id: `loss-${Date.now()}`,
      timestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      itemId: payload.itemId,
      itemName: payload.itemName,
      sku: payload.sku,
      quantity: payload.quantity,
      unit: payload.unit,
      unitCost: payload.unitCost,
      totalLossCost,
      category: payload.category,
      loggedBy: payload.loggedBy,
      notes: payload.notes,
    };

    localLossLogs.unshift(newLog);

    try {
      await apiClient.post('/inventory/loss-logs', newLog);
    } catch {
      // safe fallback
    }

    // Deduct physical inventory balance
    try {
      await inventoryService.adjustStock(payload.itemId, -payload.quantity, `Food Loss: ${payload.category}`);
    } catch {
      // safe fallback
    }

    return newLog;
  }

  async createKitchenCancellation(payload: {
    ticketNumber: string;
    tableNumber?: string;
    recipeId: string;
    recipeName: string;
    portions: number;
    reason: CancellationReason;
    wasPrepped: boolean;
    unitCost: number;
    cancelledBy: string;
    notes?: string;
  }): Promise<KitchenCancellation> {
    const wastedCost = payload.wasPrepped ? parseFloat((payload.portions * payload.unitCost).toFixed(2)) : 0;
    const newCanc: KitchenCancellation = {
      id: `canc-${Date.now()}`,
      timestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      ticketNumber: payload.ticketNumber,
      tableNumber: payload.tableNumber,
      recipeId: payload.recipeId,
      recipeName: payload.recipeName,
      portions: payload.portions,
      reason: payload.reason,
      wasPrepped: payload.wasPrepped,
      wastedCost,
      cancelledBy: payload.cancelledBy,
      notes: payload.notes,
    };

    localCancellations.unshift(newCanc);

    try {
      await apiClient.post('/kitchen/cancellations', newCanc);
    } catch {
      // safe fallback
    }

    return newCanc;
  }
}

export const lossService: ILossService = new RealLossService();
